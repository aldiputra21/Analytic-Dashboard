// JWT Authentication Service
// Drizzle ORM PostgreSQL implementation

import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { asc, eq, and, or } from 'drizzle-orm';
import { db } from '../../db/connection';
import { roles, userCorporateAccesses, users } from '../../db/schema/index.js';
import { JWTPayload, FRSUser, UserRole } from '../../types/financial/user';
import { sendPasswordResetEmail } from './emailService';
import { getEffectivePermissions, getUserAccessContext } from './permissionService';

const JWT_SECRET = process.env.FRS_JWT_SECRET || 'frs-dev-secret-change-in-production';
const JWT_EXPIRES_IN = process.env.FRS_JWT_EXPIRES_IN || '30m';
const BCRYPT_ROUNDS = 10;
const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000;

const tokenBlacklist = new Set<string>();

export function validatePasswordStrength(password: string): { valid: boolean; message?: string } {
  if (password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters long' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one uppercase letter' };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one lowercase letter' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one number' };
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one special character' };
  }
  return { valid: true };
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function issueToken(payload: JWTPayload): string {
  const now = Math.floor(Date.now() / 1000);
  
  // Use existing original iat if present, otherwise set it to now
  // This tracks when the session actually started (first login)
  const origIat = (payload as any).origIat || payload.iat || now;

  const token = jwt.sign(
    {
      userId: payload.userId,
      username: payload.username,
      role: payload.role,
      roleName: payload.roleName,
      roleDescription: payload.roleDescription,
      permissions: payload.permissions,
      authzVersion: payload.authzVersion ?? 1,
      origIat: origIat, // Preserve original session start
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN as any },
  );

  return token;
}

export function verifyToken(token: string): JWTPayload | null {
  if (tokenBlacklist.has(token)) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[AuthService] Token is blacklisted');
    }
    return null;
  }
  try {
    return jwt.verify(token, JWT_SECRET, { clockTolerance: 10 }) as JWTPayload;
  } catch (err: any) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[AuthService] Token verification failed:', err.message, { 
        name: err.name,
        expiredAt: err.expiredAt 
      });
    }
    return null;
  }
}

export function invalidateToken(token: string): void {
  tokenBlacklist.add(token);
}

function hashResetToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function buildResetLink(appUrl: string, token: string): string {
  const url = new URL(appUrl);
  url.searchParams.set('auth', 'reset');
  url.searchParams.set('token', token);
  return url.toString();
}

export async function requestPasswordReset(identifier: string, appUrl: string): Promise<string | null> {
  const normalizedIdentifier = identifier.trim().toLowerCase();
  const rawIdentifier = identifier.trim();
  const [row] = await db.select().from(users)
    .where(
      and(
        or(
          eq(users.email, normalizedIdentifier),
          eq(users.username, rawIdentifier),
          eq(users.username, normalizedIdentifier),
        ),
        eq(users.isActive, true)
      )
    )
    .limit(1);

  if (!row) {
    return null;
  }

  const resetToken = crypto.randomBytes(32).toString('hex');
  const resetTokenHash = hashResetToken(resetToken);
  const resetExpiresAt = new Date(Date.now() + PASSWORD_RESET_TTL_MS);

  await db.update(users)
    .set({
      passwordResetTokenHash: resetTokenHash,
      passwordResetExpiresAt: resetExpiresAt,
      updatedAt: new Date(),
      updatedBy: row.id,
    })
    .where(eq(users.id, row.id));

  await sendPasswordResetEmail({
    to: row.email,
    fullName: row.fullName,
    resetLink: buildResetLink(appUrl, resetToken),
  });

  return row.id;
}

export async function resetPasswordWithToken(token: string, newPassword: string): Promise<{ success: true; userId: string } | { success: false; reason: 'invalid_token' | 'weak_password' }> {
  const validation = validatePasswordStrength(newPassword);
  if (!validation.valid) {
    return { success: false, reason: 'weak_password' };
  }

  const resetTokenHash = hashResetToken(token);
  const [row] = await db.select().from(users)
    .where(and(eq(users.passwordResetTokenHash, resetTokenHash), eq(users.isActive, true)))
    .limit(1);

  if (!row || !row.passwordResetExpiresAt || row.passwordResetExpiresAt.getTime() < Date.now()) {
    return { success: false, reason: 'invalid_token' };
  }

  const passwordHash = await hashPassword(newPassword);
  await db.update(users)
    .set({
      passwordHash,
      passwordChangedAt: new Date(),
      passwordResetTokenHash: null,
      passwordResetExpiresAt: null,
      updatedAt: new Date(),
      updatedBy: row.id,
    })
    .where(eq(users.id, row.id));

  return { success: true, userId: row.id };
}

/**
 * Authenticates a user by username or email + password.
 * Returns the user and a JWT token on success.
 */
export async function authenticateUser(
  identifier: string,
  password: string,
): Promise<{ user: FRSUser; token: string } | null> {
  const [row] = await db.select().from(users)
    .where(
      and(
        or(eq(users.email, identifier), eq(users.username, identifier)),
        eq(users.isActive, true),
      )
    )
    .limit(1);

  if (!row) return null;

  const passwordMatch = await verifyPassword(password, row.passwordHash);
  if (!passwordMatch) return null;

  // Update last login
  await db.update(users).set({ lastLogin: new Date() }).where(eq(users.id, row.id));

  const user = await mapRowToUser(row);
  const token = issueToken({
    userId: user.id,
    username: user.username ?? user.email,
    role: user.role,
    roleName: user.roleName,
    roleDescription: user.roleDescription,
    permissions: user.permissions,
    authzVersion: user.authzVersion,
  });

  return { user, token };
}

/**
 * Gets a user by ID.
 */
export async function getUserById(userId: string): Promise<FRSUser | null> {
  const [row] = await db.select().from(users)
    .where(and(eq(users.id, userId), eq(users.isActive, true)))
    .limit(1);
  return row ? mapRowToUser(row) : null;
}

async function resolvePrimaryRole(userId: string): Promise<{ role: UserRole; name: string; description: string | null }> {
  const rows = await db.select({
    roleName: roles.name,
    scope: userCorporateAccesses.scope,
    description: roles.description
  })
    .from(userCorporateAccesses)
    .innerJoin(roles, eq(roles.id, userCorporateAccesses.roleId))
    .where(eq(userCorporateAccesses.userId, userId))
    .orderBy(asc(userCorporateAccesses.scope));

  const prioritizedRoles: UserRole[] = [
    'system_admin',
    'global_admin',
    'corporate_admin',
    'global_executive',
    'corporate_executive',
    'finance_leader',
    'finance_manager',
    'finance_staff',
    'dept_leader',
    'dept_manager',
    'dept_staff',
    'owner',
    'bod',
    'subsidiary_manager'
  ];
  for (const roleName of prioritizedRoles) {
    const matched = rows.find((row) => row.roleName === roleName);
    if (matched) {
      return {
        role: roleName as UserRole,
        name: matched.roleName,
        description: matched.description
      };
    }
  }

  const defaultRow = rows[0];
  return {
    role: (defaultRow?.roleName as UserRole) || 'subsidiary_manager',
    name: defaultRow?.roleName || 'subsidiary_manager',
    description: defaultRow?.description || 'Subsidiary Manager'
  };
}

export async function mapRowToUser(row: typeof users.$inferSelect): Promise<FRSUser> {
  const [roleInfo, permissions, corporateAccess] = await Promise.all([
    resolvePrimaryRole(row.id),
    getEffectivePermissions(row.id),
    db.select({ corporateId: userCorporateAccesses.corporateId })
      .from(userCorporateAccesses)
      .where(eq(userCorporateAccesses.userId, row.id)),
  ]);

  // Get primary corporateId (first one with 'corporate' or 'department' scope)
  const primaryAccess = corporateAccess.find(a => a.corporateId) || null;
  const subsidiaryIds = corporateAccess
    .filter(a => a.corporateId)
    .map(a => a.corporateId as string);
  const hasFullCorporateAccess = corporateAccess.some(a => a.corporateId === null);

  return {
    id: row.id,
    username: row.username ?? row.email,
    email: row.email,
    role: roleInfo.role,
    roleName: roleInfo.name,
    roleDescription: roleInfo.description ?? undefined,
    permissions,
    authzVersion: row.authzVersion,
    fullName: row.fullName,
    isActive: row.isActive,
    emailVerified: row.emailVerified,
    lastLogin: row.lastLogin ?? undefined,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt ?? row.createdAt,
    createdBy: row.createdBy,
    corporateId: primaryAccess?.corporateId ?? undefined,
    subsidiaryIds: subsidiaryIds.length > 0 ? subsidiaryIds : undefined,
    hasFullCorporateAccess,
    scope: (await getUserAccessContext(row.id)).scope,
  };
}


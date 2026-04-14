// JWT Authentication Service
// Drizzle ORM PostgreSQL implementation

import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { eq, and, or } from 'drizzle-orm';
import { db } from '../../db/connection';
import { users } from '../../db/schema/index.js';
import { JWTPayload, FRSUser, UserRole } from '../../types/financial/user';
import { sendPasswordResetEmail } from './emailService';

const JWT_SECRET = process.env.FRS_JWT_SECRET || 'frs-dev-secret-change-in-production';
const JWT_EXPIRES_IN = '30m';
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
  return jwt.sign(
    { userId: payload.userId, username: payload.username, role: payload.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN },
  );
}

export function verifyToken(token: string): JWTPayload | null {
  if (tokenBlacklist.has(token)) return null;
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch {
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
      updatedBy: row.email,
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
      updatedBy: row.email,
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

  const user = mapRowToUser(row);
  const token = issueToken({ userId: user.id, username: user.username ?? user.email, role: user.role });

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

export function mapRowToUser(row: typeof users.$inferSelect): FRSUser {
  return {
    id: row.id,
    username: row.username ?? row.email,
    email: row.email,
    role: 'owner' as UserRole, // role resolved via user_corporate_accesses at runtime
    fullName: row.fullName,
    isActive: row.isActive,
    lastLogin: row.lastLogin ?? undefined,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt ?? row.createdAt,
    createdBy: row.createdBy,
  };
}


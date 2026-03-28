// JWT Authentication Service
// Requirements: 9.6, 9.7, 9.8

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Database from 'better-sqlite3';
import { JWTPayload, FRSUser, UserRole } from '../../types/financial/user';

const JWT_SECRET = process.env.FRS_JWT_SECRET || 'frs-dev-secret-change-in-production';
const JWT_EXPIRES_IN = '30m'; // 30 minutes session timeout (Req 9.7)
const BCRYPT_ROUNDS = 10;

// In-memory token blacklist for logout invalidation
const tokenBlacklist = new Set<string>();

/**
 * Validates password meets strong password policy.
 * Min 12 chars, uppercase, lowercase, number, special char.
 * Requirements: 9.6
 */
export function validatePasswordStrength(password: string): { valid: boolean; message?: string } {
  if (password.length < 12) {
    return { valid: false, message: 'Password must be at least 12 characters long' };
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

/**
 * Hashes a password using bcrypt.
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

/**
 * Verifies a password against a hash.
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Issues a JWT token for a user.
 */
export function issueToken(payload: JWTPayload): string {
  return jwt.sign(
    { userId: payload.userId, username: payload.username, role: payload.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

/**
 * Verifies and decodes a JWT token.
 * Returns null if invalid or blacklisted.
 */
export function verifyToken(token: string): JWTPayload | null {
  if (tokenBlacklist.has(token)) return null;
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch {
    return null;
  }
}

/**
 * Invalidates a token (logout).
 */
export function invalidateToken(token: string): void {
  tokenBlacklist.add(token);
}

/**
 * Authenticates a user by username and password.
 * Returns the user and a JWT token on success.
 */
export async function authenticateUser(
  db: Database.Database,
  username: string,
  password: string
): Promise<{ user: FRSUser; token: string } | null> {
  const row = db
    .prepare('SELECT * FROM frs_users WHERE username = ? AND is_active = 1')
    .get(username) as any;

  if (!row) return null;

  const passwordMatch = await verifyPassword(password, row.password_hash);
  if (!passwordMatch) return null;

  // Update last login
  db.prepare('UPDATE frs_users SET last_login = CURRENT_TIMESTAMP WHERE id = ?').run(row.id);

  const user: FRSUser = mapRowToUser(row);
  const token = issueToken({ userId: user.id, username: user.username, role: user.role });

  return { user, token };
}

/**
 * Gets a user by ID.
 */
export function getUserById(db: Database.Database, userId: string): FRSUser | null {
  const row = db.prepare('SELECT * FROM frs_users WHERE id = ? AND is_active = 1').get(userId) as any;
  return row ? mapRowToUser(row) : null;
}

export function mapRowToUser(row: any): FRSUser {
  return {
    id: row.id,
    username: row.username,
    email: row.email,
    role: row.role as UserRole,
    fullName: row.full_name,
    isActive: Boolean(row.is_active),
    lastLogin: row.last_login ? new Date(row.last_login) : undefined,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    createdBy: row.created_by ?? undefined,
  };
}

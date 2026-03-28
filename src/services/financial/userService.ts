// User Management Service
// Requirements: 9.1, 9.5, 9.9

import Database from 'better-sqlite3';
import { FRSUser, CreateUserInput, UpdateUserInput, UserSubsidiaryAccess, UserRole } from '../../types/financial/user';
import { hashPassword, validatePasswordStrength } from './authService';
import { mapRowToUser } from './authService';

function generateId(): string {
  return `usr_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Creates a new user with strong password validation.
 * Requirements: 9.5, 9.6
 */
export async function createUser(
  db: Database.Database,
  input: CreateUserInput,
  createdBy: string
): Promise<{ user?: FRSUser; error?: string }> {
  // Validate password strength (Req 9.6)
  const pwCheck = validatePasswordStrength(input.password);
  if (!pwCheck.valid) {
    return { error: pwCheck.message };
  }

  // Check for duplicate username/email
  const existingUsername = db.prepare('SELECT id FROM frs_users WHERE username = ?').get(input.username);
  if (existingUsername) return { error: 'Username already exists' };

  const existingEmail = db.prepare('SELECT id FROM frs_users WHERE email = ?').get(input.email);
  if (existingEmail) return { error: 'Email already exists' };

  const id = generateId();
  const passwordHash = await hashPassword(input.password);
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO frs_users (id, username, email, password_hash, role, full_name, is_active, created_at, updated_at, created_by)
    VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?, ?)
  `).run(id, input.username, input.email, passwordHash, input.role, input.fullName, now, now, createdBy);

  const row = db.prepare('SELECT * FROM frs_users WHERE id = ?').get(id) as any;
  return { user: mapRowToUser(row) };
}

/**
 * Lists all users.
 */
export function listUsers(db: Database.Database): FRSUser[] {
  const rows = db.prepare('SELECT * FROM frs_users ORDER BY created_at ASC').all() as any[];
  return rows.map(mapRowToUser);
}

/**
 * Gets a user by ID.
 */
export function getUserById(db: Database.Database, id: string): FRSUser | null {
  const row = db.prepare('SELECT * FROM frs_users WHERE id = ?').get(id) as any;
  return row ? mapRowToUser(row) : null;
}

/**
 * Updates a user's profile.
 * Requirements: 9.5
 */
export function updateUser(
  db: Database.Database,
  id: string,
  input: UpdateUserInput
): FRSUser | null {
  const existing = db.prepare('SELECT * FROM frs_users WHERE id = ?').get(id) as any;
  if (!existing) return null;

  db.prepare(`
    UPDATE frs_users SET
      username = ?, email = ?, role = ?, full_name = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(
    input.username ?? existing.username,
    input.email ?? existing.email,
    input.role ?? existing.role,
    input.fullName ?? existing.full_name,
    id,
  );

  const row = db.prepare('SELECT * FROM frs_users WHERE id = ?').get(id) as any;
  return mapRowToUser(row);
}

/**
 * Activates or deactivates a user.
 * Requirements: 9.5
 */
export function setUserStatus(
  db: Database.Database,
  id: string,
  isActive: boolean
): FRSUser | null {
  const existing = db.prepare('SELECT * FROM frs_users WHERE id = ?').get(id) as any;
  if (!existing) return null;

  db.prepare('UPDATE frs_users SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
    .run(isActive ? 1 : 0, id);

  const row = db.prepare('SELECT * FROM frs_users WHERE id = ?').get(id) as any;
  return mapRowToUser(row);
}

/**
 * Assigns subsidiary access to a user.
 * Requirements: 9.9
 */
export function assignSubsidiaryAccess(
  db: Database.Database,
  userId: string,
  subsidiaryIds: string[],
  grantedBy: string
): { success: boolean; error?: string } {
  const user = db.prepare('SELECT id FROM frs_users WHERE id = ?').get(userId);
  if (!user) return { success: false, error: 'User not found' };

  const insert = db.prepare(`
    INSERT OR IGNORE INTO frs_user_subsidiary_access (id, user_id, subsidiary_id, granted_at, granted_by)
    VALUES (?, ?, ?, CURRENT_TIMESTAMP, ?)
  `);

  const doInsert = db.transaction(() => {
    for (const subsidiaryId of subsidiaryIds) {
      const sub = db.prepare('SELECT id FROM subsidiaries WHERE id = ?').get(subsidiaryId);
      if (!sub) throw new Error(`Subsidiary ${subsidiaryId} not found`);
      insert.run(`usa_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`, userId, subsidiaryId, grantedBy);
    }
  });

  try {
    doInsert();
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Gets all subsidiary access records for a user.
 */
export function getUserSubsidiaryAccess(db: Database.Database, userId: string): UserSubsidiaryAccess[] {
  const rows = db
    .prepare('SELECT * FROM frs_user_subsidiary_access WHERE user_id = ?')
    .all(userId) as any[];
  return rows.map((row) => ({
    id: row.id,
    userId: row.user_id,
    subsidiaryId: row.subsidiary_id,
    grantedAt: new Date(row.granted_at),
    grantedBy: row.granted_by,
  }));
}

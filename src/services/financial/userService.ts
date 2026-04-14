// User Management Service
// Drizzle ORM PostgreSQL implementation

import { eq, asc, or } from 'drizzle-orm';
import { db } from '../../db/connection';
import { users, userCorporateAccesses, roles, corporates } from '../../db/schema';
import { FRSUser, CreateUserInput, UpdateUserInput, UserSubsidiaryAccess } from '../../types/financial/user';
import { hashPassword, validatePasswordStrength, mapRowToUser } from './authService';

/**
 * Creates a new user with strong password validation.
 */
export async function createUser(
  input: CreateUserInput,
  createdBy: string,
): Promise<{ user?: FRSUser; error?: string }> {
  const pwCheck = validatePasswordStrength(input.password);
  if (!pwCheck.valid) {
    return { error: pwCheck.message };
  }

  // Check for duplicate email or username
  const [existingEmail] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, input.email))
    .limit(1);
  if (existingEmail) return { error: 'Email already exists' };

  if (input.username) {
    const [existingUsername] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.username, input.username))
      .limit(1);
    if (existingUsername) return { error: 'Username already exists' };
  }

  const passwordHash = await hashPassword(input.password);

  const [inserted] = await db.insert(users).values({
    username: input.username ?? null,
    email: input.email,
    passwordHash,
    fullName: input.fullName,
    createdBy,
  }).returning();

  return { user: mapRowToUser(inserted) };
}

/**
 * Lists all users.
 */
export async function listUsers(): Promise<FRSUser[]> {
  const rows = await db.select().from(users).orderBy(asc(users.createdAt));
  return rows.map(mapRowToUser);
}

/**
 * Gets a user by ID.
 */
export async function getUserById(id: string): Promise<FRSUser | null> {
  const [row] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return row ? mapRowToUser(row) : null;
}

/**
 * Updates a user's profile.
 */
export async function updateUser(
  id: string,
  input: UpdateUserInput,
): Promise<FRSUser | null> {
  const [existing] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  if (!existing) return null;

  // Check username uniqueness if being changed
  if (input.username !== undefined && input.username !== existing.username) {
    if (input.username) {
      const [dup] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.username, input.username))
        .limit(1);
      if (dup) return null; // caller should handle conflict
    }
  }

  const [updated] = await db.update(users).set({
    username: input.username !== undefined ? (input.username ?? null) : existing.username,
    email: input.email ?? existing.email,
    fullName: input.fullName ?? existing.fullName,
    updatedAt: new Date(),
  }).where(eq(users.id, id)).returning();

  return mapRowToUser(updated);
}

/**
 * Activates or deactivates a user.
 */
export async function setUserStatus(
  id: string,
  isActive: boolean,
): Promise<FRSUser | null> {
  const [existing] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  if (!existing) return null;

  const [updated] = await db.update(users).set({
    isActive,
    updatedAt: new Date(),
  }).where(eq(users.id, id)).returning();

  return mapRowToUser(updated);
}

/**
 * Assigns corporate access to a user with a given role.
 * Scope-based: 'corporate' scope assigns access at corporate level.
 */
export async function assignSubsidiaryAccess(
  userId: string,
  subsidiaryIds: string[],
  grantedBy: string,
): Promise<{ success: boolean; error?: string }> {
  const [user] = await db.select({ id: users.id }).from(users).where(eq(users.id, userId)).limit(1);
  if (!user) return { success: false, error: 'User not found' };

  // Get default role (e.g., first role or 'subsidiary_manager')
  const [defaultRole] = await db.select({ id: roles.id }).from(roles).where(eq(roles.name, 'subsidiary_manager')).limit(1);
  if (!defaultRole) return { success: false, error: 'Default role not found' };

  try {
    await db.transaction(async (tx) => {
      for (const corporateId of subsidiaryIds) {
        const [corp] = await tx.select({ id: corporates.id }).from(corporates).where(eq(corporates.id, corporateId)).limit(1);
        if (!corp) throw new Error(`Corporate ${corporateId} not found`);

        await tx.insert(userCorporateAccesses).values({
          userId,
          roleId: defaultRole.id,
          scope: 'corporate',
          corporateId,
          grantedBy,
        }).onConflictDoNothing();
      }
    });
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

/**
 * Gets all corporate access records for a user.
 */
export async function getUserSubsidiaryAccess(userId: string): Promise<UserSubsidiaryAccess[]> {
  const rows = await db
    .select()
    .from(userCorporateAccesses)
    .where(eq(userCorporateAccesses.userId, userId));

  return rows.map((row) => ({
    id: row.id,
    userId: row.userId,
    subsidiaryId: row.corporateId ?? '',
    grantedAt: row.createdAt,
    grantedBy: row.grantedBy ?? '',
  }));
}

// User Management Service
// Drizzle ORM PostgreSQL implementation

import { and, eq, asc, sql } from 'drizzle-orm';
import { db } from '../../db/connection';
import { users, userCorporateAccesses, roles, corporates } from '../../db/schema/index.js';
import { FRSUser, CreateUserInput, UpdateUserInput, UserSubsidiaryAccess } from '../../types/financial/user';
import { hashPassword, validatePasswordStrength, mapRowToUser } from './authService';
import { invalidatePermissionCache } from './permissionService';

async function getAssignedRoleId(userId: string): Promise<string | null> {
  const [roleAccess] = await db
    .select({ roleId: userCorporateAccesses.roleId })
    .from(userCorporateAccesses)
    .where(eq(userCorporateAccesses.userId, userId))
    .limit(1);

  return roleAccess?.roleId ?? null;
}

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

  const [selectedRole] = await db
    .select({ id: roles.id })
    .from(roles)
    .where(eq(roles.name, input.role))
    .limit(1);

  if (!selectedRole) {
    return { error: 'Selected role not found' };
  }

  if (input.role !== 'owner' && (!input.subsidiaryIds || input.subsidiaryIds.length === 0)) {
    return { error: 'At least one subsidiary must be assigned for non-owner users' };
  }

  const inserted = await db.transaction(async (tx) => {
    const [createdUser] = await tx.insert(users).values({
      username: input.username ?? null,
      email: input.email,
      passwordHash,
      fullName: input.fullName,
      createdBy,
    }).returning();

    if (input.role === 'owner') {
      await tx.insert(userCorporateAccesses).values({
        userId: createdUser.id,
        roleId: selectedRole.id,
        scope: 'system',
        grantedBy: createdBy,
      }).onConflictDoNothing();
    } else {
      for (const corporateId of input.subsidiaryIds ?? []) {
        const [corp] = await tx.select({ id: corporates.id }).from(corporates).where(eq(corporates.id, corporateId)).limit(1);
        if (!corp) throw new Error(`Corporate ${corporateId} not found`);

        await tx.insert(userCorporateAccesses).values({
          userId: createdUser.id,
          roleId: selectedRole.id,
          scope: 'corporate',
          corporateId,
          grantedBy: createdBy,
        }).onConflictDoNothing();
      }
    }

    return createdUser;
  });

  return { user: await mapRowToUser(inserted) };
}

/**
 * Lists all users.
 */
export async function listUsers(): Promise<FRSUser[]> {
  const rows = await db.select().from(users).orderBy(asc(users.createdAt));
  return Promise.all(rows.map((row) => mapRowToUser(row)));
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
  updatedBy: string,
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

  const updatedUser = await db.transaction(async (tx) => {
    if (input.role) {
      const [selectedRole] = await tx
        .select({ id: roles.id })
        .from(roles)
        .where(eq(roles.name, input.role))
        .limit(1);

      if (!selectedRole) {
        throw new Error('Selected role not found');
      }

      await tx.delete(userCorporateAccesses).where(eq(userCorporateAccesses.userId, id));

      if (input.role === 'owner') {
        await tx.insert(userCorporateAccesses).values({
          userId: id,
          roleId: selectedRole.id,
          scope: 'system',
          grantedBy: updatedBy,
        });
      } else {
        const subsidiaryIds = input.subsidiaryIds ?? [];
        if (subsidiaryIds.length === 0) {
          throw new Error('At least one subsidiary must be assigned for non-owner users');
        }

        for (const corporateId of subsidiaryIds) {
          const [corp] = await tx
            .select({ id: corporates.id })
            .from(corporates)
            .where(eq(corporates.id, corporateId))
            .limit(1);

          if (!corp) {
            throw new Error(`Corporate ${corporateId} not found`);
          }

          await tx.insert(userCorporateAccesses).values({
            userId: id,
            roleId: selectedRole.id,
            scope: 'corporate',
            corporateId,
            grantedBy: updatedBy,
          }).onConflictDoNothing();
        }
      }
    }

    const [updated] = await tx.update(users).set({
      username: input.username !== undefined ? (input.username ?? null) : existing.username,
      email: input.email ?? existing.email,
      fullName: input.fullName ?? existing.fullName,
      authzVersion: input.role ? sql`${users.authzVersion} + 1` : users.authzVersion,
      updatedBy,
      updatedAt: new Date(),
    }).where(eq(users.id, id)).returning();

    return updated;
  });

  if (input.role) {
    invalidatePermissionCache(id);
  }

  return mapRowToUser(updatedUser);
}

/**
 * Activates or deactivates a user.
 */
export async function setUserStatus(
  id: string,
  isActive: boolean,
  updatedBy: string,
): Promise<FRSUser | null> {
  const [existing] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  if (!existing) return null;

  const [updated] = await db.update(users).set({
    isActive,
    authzVersion: sql`${users.authzVersion} + 1`,
    updatedBy,
    updatedAt: new Date(),
  }).where(eq(users.id, id)).returning();

  invalidatePermissionCache(id);

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
  options?: { replace?: boolean },
): Promise<{ success: boolean; error?: string }> {
  const [user] = await db.select({ id: users.id }).from(users).where(eq(users.id, userId)).limit(1);
  if (!user) return { success: false, error: 'User not found' };

  const assignedRoleId = await getAssignedRoleId(userId);
  if (!assignedRoleId) return { success: false, error: 'User role assignment not found' };

  const [assignedRole] = await db
    .select({ name: roles.name })
    .from(roles)
    .where(eq(roles.id, assignedRoleId))
    .limit(1);

  if (assignedRole?.name === 'owner') {
    return { success: false, error: 'Owner users do not support subsidiary-scoped access assignments' };
  }

  try {
    await db.transaction(async (tx) => {
      if (options?.replace) {
        await tx
          .delete(userCorporateAccesses)
          .where(and(
            eq(userCorporateAccesses.userId, userId),
            eq(userCorporateAccesses.scope, 'corporate'),
          ));
      }

      for (const corporateId of subsidiaryIds) {
        const [corp] = await tx.select({ id: corporates.id }).from(corporates).where(eq(corporates.id, corporateId)).limit(1);
        if (!corp) throw new Error(`Corporate ${corporateId} not found`);

        await tx.insert(userCorporateAccesses).values({
          userId,
          roleId: assignedRoleId,
          scope: 'corporate',
          corporateId,
          grantedBy,
        }).onConflictDoNothing();
      }

      await tx.update(users).set({
        authzVersion: sql`${users.authzVersion} + 1`,
        updatedBy: grantedBy,
        updatedAt: new Date(),
      }).where(eq(users.id, userId));
    });

    invalidatePermissionCache(userId);
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
    .where(and(
      eq(userCorporateAccesses.userId, userId),
      eq(userCorporateAccesses.scope, 'corporate'),
    ));

  return rows.map((row) => ({
    id: row.id,
    userId: row.userId,
    subsidiaryId: row.corporateId ?? '',
    grantedAt: row.createdAt,
    grantedBy: row.grantedBy ?? '',
  }));
}


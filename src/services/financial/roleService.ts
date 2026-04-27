import { and, eq, sql, asc, desc, ilike, not } from 'drizzle-orm';
import { db } from '../../db/connection';
import { roles, rolePermissions, permissions, users, userCorporateAccesses } from '../../db/schema';
import { createFRSAuditLog } from './auditLogService';
import { invalidatePermissionCache } from './permissionService';

// ============================================================================
// Types
// ============================================================================

export interface Role {
  id: string;
  name: string;
  scope: 'system' | 'corporate' | 'department';
  description?: string;
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  updatedBy?: string;
  updatedAt?: Date;
}

export interface RoleWithPermissions extends Role {
  permissions: string[]; // permission IDs
}

export interface ListRolesFilters {
  scope?: 'system' | 'corporate' | 'department';
  isActive?: boolean;
  search?: string;
  page?: number;
  pageSize?: number;
  requestingScope?: 'system' | 'corporate' | 'department';
}

export interface CreateRoleInput {
  name: string;
  scope: 'system' | 'corporate' | 'department';
  description?: string;
}

export interface UpdateRoleInput {
  name?: string;
  description?: string;
  isActive?: boolean;
}

// ============================================================================
// Mappers
// ============================================================================

function mapRowToRole(row: typeof roles.$inferSelect): Role {
  return {
    id: row.id,
    name: row.name,
    scope: row.scope as 'system' | 'corporate' | 'department',
    description: row.description ?? undefined,
    isActive: row.isActive,
    createdBy: row.createdBy,
    createdAt: row.createdAt,
    updatedBy: row.updatedBy ?? undefined,
    updatedAt: row.updatedAt ?? undefined,
  };
}

// ============================================================================
// Public Functions
// ============================================================================

/**
 * Lists roles with optional filtering and pagination.
 */
export async function listRoles(filters: ListRolesFilters = {}): Promise<{
  data: Role[];
  totalCount: number;
}> {
  const conditions = [];

  if (filters.scope) {
    conditions.push(eq(roles.scope, filters.scope));
  }

  if (filters.isActive !== undefined) {
    conditions.push(eq(roles.isActive, filters.isActive));
  }

  if (filters.search) {
    conditions.push(ilike(roles.name, `%${filters.search}%`));
  }

  // Filter by requesting scope
  if (filters.requestingScope && filters.requestingScope !== 'system') {
    const { inArray } = await import('drizzle-orm');
    conditions.push(inArray(roles.scope, ['corporate', 'department']));
  }

  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? 10;
  const offset = (page - 1) * pageSize;

  // Get total count
  const countResult = await db
    .select({ count: sql<string>`cast(count(*) as integer)` })
    .from(roles)
    .where(conditions.length > 0 ? and(...conditions) : undefined);

  const totalCount = parseInt(countResult[0]?.count ?? '0', 10);

  // Get paginated data
  const rows = await db
    .select()
    .from(roles)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(asc(roles.createdAt))
    .limit(pageSize)
    .offset(offset);

  return {
    data: rows.map(mapRowToRole),
    totalCount,
  };
}

/**
 * Gets a single role by ID with its assigned permissions.
 */
export async function getRoleById(id: string): Promise<RoleWithPermissions | null> {
  const [roleRow] = await db
    .select()
    .from(roles)
    .where(eq(roles.id, id))
    .limit(1);

  if (!roleRow) {
    return null;
  }

  // Get assigned permissions
  const permissionRows = await db
    .select({ permissionId: rolePermissions.permissionId })
    .from(rolePermissions)
    .where(eq(rolePermissions.roleId, id));

  return {
    ...mapRowToRole(roleRow),
    permissions: permissionRows.map((row) => row.permissionId),
  };
}

/**
 * Creates a new role.
 */
export async function createRole(
  input: CreateRoleInput,
  actorId: string,
): Promise<Role> {
  // Validate unique name
  const [existing] = await db
    .select({ id: roles.id })
    .from(roles)
    .where(eq(roles.name, input.name))
    .limit(1);

  if (existing) {
    throw new Error(`Role with name "${input.name}" already exists`);
  }

  // Validate scope enum
  if (!['system', 'corporate', 'department'].includes(input.scope)) {
    throw new Error(`Invalid scope: ${input.scope}`);
  }

  const [created] = await db
    .insert(roles)
    .values({
      name: input.name,
      scope: input.scope,
      description: input.description ?? null,
      isActive: true,
      createdBy: actorId,
    })
    .returning();

  // Create audit log
  await createFRSAuditLog({
    userId: actorId,
    action: 'create',
    entityType: 'role',
    entityId: created.id,
    newValues: {
      name: created.name,
      scope: created.scope,
      description: created.description,
    },
  });

  return mapRowToRole(created);
}

/**
 * Updates a role.
 */
export async function updateRole(
  id: string,
  input: UpdateRoleInput,
  actorId: string,
): Promise<Role> {
  const [existing] = await db
    .select()
    .from(roles)
    .where(eq(roles.id, id))
    .limit(1);

  if (!existing) {
    throw new Error(`Role with ID "${id}" not found`);
  }

  // Check unique name if being changed
  if (input.name !== undefined && input.name !== existing.name) {
    const [dup] = await db
      .select({ id: roles.id })
      .from(roles)
      .where(eq(roles.name, input.name))
      .limit(1);

    if (dup) {
      throw new Error(`Role with name "${input.name}" already exists`);
    }
  }

  const oldValues = {
    name: existing.name,
    description: existing.description,
    isActive: existing.isActive,
  };

  const [updated] = await db
    .update(roles)
    .set({
      name: input.name ?? existing.name,
      description: input.description !== undefined ? (input.description ?? null) : existing.description,
      isActive: input.isActive !== undefined ? input.isActive : existing.isActive,
      updatedBy: actorId,
      updatedAt: new Date(),
    })
    .where(eq(roles.id, id))
    .returning();

  // Create audit log
  const newValues = {
    name: updated.name,
    description: updated.description,
    isActive: updated.isActive,
  };

  await createFRSAuditLog({
    userId: actorId,
    action: 'update',
    entityType: 'role',
    entityId: id,
    oldValues,
    newValues,
  });

  return mapRowToRole(updated);
}

/**
 * Toggles a role's active status.
 */
export async function toggleRoleStatus(id: string, actorId: string): Promise<Role> {
  const [existing] = await db
    .select()
    .from(roles)
    .where(eq(roles.id, id))
    .limit(1);

  if (!existing) {
    throw new Error(`Role with ID "${id}" not found`);
  }

  const newIsActive = !existing.isActive;

  const [updated] = await db
    .update(roles)
    .set({
      isActive: newIsActive,
      updatedBy: actorId,
      updatedAt: new Date(),
    })
    .where(eq(roles.id, id))
    .returning();

  // Create audit log
  await createFRSAuditLog({
    userId: actorId,
    action: 'toggle_status',
    entityType: 'role',
    entityId: id,
    oldValues: { isActive: existing.isActive },
    newValues: { isActive: newIsActive },
  });

  return mapRowToRole(updated);
}

/**
 * Gets all permissions assigned to a role.
 */
export async function getRolePermissions(roleId: string): Promise<string[]> {
  const rows = await db
    .select({ permissionId: rolePermissions.permissionId })
    .from(rolePermissions)
    .where(eq(rolePermissions.roleId, roleId));

  return rows.map((row) => row.permissionId);
}

/**
 * Sets permissions for a role (transactional replace).
 * Computes delta, adds new permissions, removes removed permissions,
 * increments authz_version for all users with this role, and creates audit log.
 */
export async function setRolePermissions(
  roleId: string,
  permissionIds: string[],
  actorId: string,
): Promise<void> {
  // Verify role exists
  const [role] = await db
    .select({ id: roles.id })
    .from(roles)
    .where(eq(roles.id, roleId))
    .limit(1);

  if (!role) {
    throw new Error(`Role with ID "${roleId}" not found`);
  }

  // Verify all permission IDs exist
  const permissionRows = await db
    .select({ id: permissions.id })
    .from(permissions)
    .where(eq(permissions.isActive, true));

  const validPermissionIds = new Set(permissionRows.map((row) => row.id));

  for (const permId of permissionIds) {
    if (!validPermissionIds.has(permId)) {
      throw new Error(`Permission with ID "${permId}" not found or is inactive`);
    }
  }

  // Get current permissions
  const currentRows = await db
    .select({ permissionId: rolePermissions.permissionId })
    .from(rolePermissions)
    .where(eq(rolePermissions.roleId, roleId));

  const currentPermissionIds = new Set(currentRows.map((row) => row.permissionId));
  const newPermissionIds = new Set(permissionIds);

  // Compute delta
  const toAdd = permissionIds.filter((id) => !currentPermissionIds.has(id));
  const toRemove = Array.from(currentPermissionIds).filter((id) => !newPermissionIds.has(id));

  // If no changes, skip
  if (toAdd.length === 0 && toRemove.length === 0) {
    return;
  }

  await db.transaction(async (tx) => {
    // Add new permissions
    if (toAdd.length > 0) {
      await tx.insert(rolePermissions).values(
        toAdd.map((permissionId) => ({
          roleId,
          permissionId,
          grantedBy: actorId,
        })),
      );
    }

    // Remove permissions
    if (toRemove.length > 0) {
      await tx
        .delete(rolePermissions)
        .where(
          and(
            eq(rolePermissions.roleId, roleId),
            sql`${rolePermissions.permissionId} IN (${sql.join(toRemove, sql`, `)})`
          ),
        );
    }

    // Increment authz_version for all users with this role
    const userIds = await tx
      .select({ userId: userCorporateAccesses.userId })
      .from(userCorporateAccesses)
      .where(eq(userCorporateAccesses.roleId, roleId));

    const uniqueUserIds = Array.from(new Set(userIds.map((row) => row.userId)));

    if (uniqueUserIds.length > 0) {
      await tx
        .update(users)
        .set({
          authzVersion: sql`${users.authzVersion} + 1`,
        })
        .where(sql`${users.id} IN (${sql.join(uniqueUserIds, sql`, `)})`);

      // Invalidate permission cache for affected users
      uniqueUserIds.forEach((userId) => invalidatePermissionCache(userId));
    }
  });

  // Create audit log
  await createFRSAuditLog({
    userId: actorId,
    action: 'set_permissions',
    entityType: 'role',
    entityId: roleId,
    oldValues: { permissionIds: Array.from(currentPermissionIds) },
    newValues: { permissionIds },
  });
}

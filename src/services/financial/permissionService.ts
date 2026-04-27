import { and, eq, sql, asc, desc, ilike } from 'drizzle-orm';
import { db } from '../../db/connection';
import { permissions, rolePermissions, userCorporateAccesses } from '../../db/schema';
import { createFRSAuditLog } from './auditLogService';

const permissionCache = new Map<string, { permissions: string[]; expiresAt: number }>();
const CACHE_TTL_MS = 60_000;

// ============================================================================
// Types
// ============================================================================

export interface Permission {
  id: string;
  key: string;
  module: string;
  description?: string;
  metadata?: Record<string, unknown>;
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  updatedBy?: string;
  updatedAt?: Date;
}

export interface ListPermissionsFilters {
  module?: string;
  isActive?: boolean;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface CreatePermissionInput {
  key: string;
  module: string;
  description?: string;
  metadata?: Record<string, unknown>;
}

export interface UpdatePermissionInput {
  description?: string;
  metadata?: Record<string, unknown>;
  isActive?: boolean;
}

// ============================================================================
// Mappers
// ============================================================================

function mapRowToPermission(row: typeof permissions.$inferSelect): Permission {
  return {
    id: row.id,
    key: row.key,
    module: row.module,
    description: row.description ?? undefined,
    metadata: (row.metadata as Record<string, unknown>) ?? undefined,
    isActive: row.isActive,
    createdBy: row.createdBy,
    createdAt: row.createdAt,
    updatedBy: row.updatedBy ?? undefined,
    updatedAt: row.updatedAt ?? undefined,
  };
}

function getCachedPermissions(userId: string): string[] | null {
  const cached = permissionCache.get(userId);
  if (!cached) return null;
  if (cached.expiresAt < Date.now()) {
    permissionCache.delete(userId);
    return null;
  }
  return cached.permissions;
}

export function invalidatePermissionCache(userId?: string): void {
  if (userId) {
    permissionCache.delete(userId);
    return;
  }
  permissionCache.clear();
}

export async function getEffectivePermissions(userId: string): Promise<string[]> {
  const cached = getCachedPermissions(userId);
  if (cached) return cached;

  const rows: Array<{ key: string }> = await db.select({ key: permissions.key })
    .from(userCorporateAccesses)
    .innerJoin(rolePermissions, eq(rolePermissions.roleId, userCorporateAccesses.roleId))
    .innerJoin(permissions, and(
      eq(permissions.id, rolePermissions.permissionId),
      eq(permissions.isActive, true),
    ))
    .where(eq(userCorporateAccesses.userId, userId))
    .catch(() => {
      // During phased rollout, role_permissions/permissions may not exist yet.
      return [];
    });

  const unique = Array.from(new Set(rows.map((row) => row.key)));
  permissionCache.set(userId, {
    permissions: unique,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });

  return unique;
}

export async function userHasPermission(userId: string, permissionKey: string): Promise<boolean> {
  const effectivePermissions = await getEffectivePermissions(userId);
  return effectivePermissions.includes(permissionKey);
}

export function toPermissionKey(resource: string, action: string): string {
  return `cfd.${resource}.${action}`;
}

/**
 * Gets the comprehensive access context for a user.
 */
export async function getUserAccessContext(userId: string): Promise<{
  scope: 'system' | 'corporate' | 'department';
  corporateIds: string[];
  departmentIds: string[];
}> {
  const rows = await db.select({ 
    corporateId: userCorporateAccesses.corporateId,
    departmentId: userCorporateAccesses.departmentId,
    scope: userCorporateAccesses.scope 
  })
    .from(userCorporateAccesses)
    .where(eq(userCorporateAccesses.userId, userId));

  // Determine highest scope (system > corporate > department)
  let scope: 'system' | 'corporate' | 'department' = 'department';
  if (rows.some(r => r.scope === 'system')) scope = 'system';
  else if (rows.some(r => r.scope === 'corporate')) scope = 'corporate';

  const corporateIds = Array.from(new Set(rows.map(r => r.corporateId).filter((id): id is string => id !== null)));
  const departmentIds = Array.from(new Set(rows.map(r => r.departmentId).filter((id): id is string => id !== null)));

  return { scope, corporateIds, departmentIds };
}

/**
 * Gets the list of corporate IDs a user has access to.
 * Returns null if the user has system-wide access (owner/bod logic).
 */
export async function getUserSubsidiaryIds(userId: string): Promise<string[] | null> {
  const context = await getUserAccessContext(userId);
  if (context.scope === 'system') return null;
  return context.corporateIds;
}

// ============================================================================
// CRUD Operations
// ============================================================================

/**
 * Lists permissions with filtering and pagination.
 */
export async function listPermissions(
  filters: ListPermissionsFilters = {}
): Promise<{ records: Permission[]; totalCount: number }> {
  const { module, isActive, search, page = 1, pageSize = 10 } = filters;

  const conditions = [];

  if (module) {
    conditions.push(eq(permissions.module, module));
  }

  if (isActive !== undefined) {
    conditions.push(eq(permissions.isActive, isActive));
  }

  if (search) {
    conditions.push(
      sql`(${permissions.key} ILIKE ${'%' + search + '%'} OR ${permissions.module} ILIKE ${'%' + search + '%'})`
    );
  }

  // Build count query
  let countQuery = db.select({ count: sql<number>`count(*)` }).from(permissions);
  if (conditions.length > 0) {
    countQuery = countQuery.where(and(...conditions)) as any;
  }

  // Get total count
  const [countResult] = await countQuery;
  const totalCount = Number(countResult.count);

  // Build data query
  let dataQuery = db.select().from(permissions);
  if (conditions.length > 0) {
    dataQuery = dataQuery.where(and(...conditions)) as any;
  }

  // Apply pagination
  const offset = (page - 1) * pageSize;
  const rows = await dataQuery
    .orderBy(asc(permissions.module), asc(permissions.key))
    .limit(pageSize)
    .offset(offset);

  return {
    records: rows.map(mapRowToPermission),
    totalCount,
  };
}

/**
 * Gets a single permission by ID.
 * Throws 404 if not found.
 */
export async function getPermissionById(id: string): Promise<Permission> {
  const [row] = await db.select().from(permissions).where(eq(permissions.id, id)).limit(1);

  if (!row) {
    throw new Error(`Permission not found: ${id}`);
  }

  return mapRowToPermission(row);
}

/**
 * Creates a new permission.
 * Validates unique key format: module.resource.action
 */
export async function createPermission(
  input: CreatePermissionInput,
  actorId: string,
  context?: { ip?: string; userAgent?: string }
): Promise<Permission> {
  // Validate key format: module.resource.action
  const keyParts = input.key.split('.');
  if (keyParts.length !== 3) {
    throw new Error('Permission key must follow format: module.resource.action');
  }

  // Check if key already exists
  const [existing] = await db
    .select()
    .from(permissions)
    .where(eq(permissions.key, input.key))
    .limit(1);

  if (existing) {
    throw new Error(`Permission key '${input.key}' already exists`);
  }

  // Insert new permission
  const [inserted] = await db
    .insert(permissions)
    .values({
      key: input.key,
      module: input.module,
      description: input.description ?? null,
      metadata: input.metadata ?? null,
      isActive: true,
      createdBy: actorId,
    })
    .returning();

  const permission = mapRowToPermission(inserted);

  // Create audit log
  await createFRSAuditLog({
    userId: actorId,
    action: 'create',
    entityType: 'permission',
    entityId: permission.id,
    newValues: JSON.parse(JSON.stringify(permission)),
    ipAddress: context?.ip,
    userAgent: context?.userAgent,
  });

  // Invalidate cache
  invalidatePermissionCache();

  return permission;
}

/**
 * Updates a permission.
 * Records updated_by and updated_at.
 */
export async function updatePermission(
  id: string,
  input: UpdatePermissionInput,
  actorId: string,
  context?: { ip?: string; userAgent?: string }
): Promise<Permission> {
  // Get existing permission
  const [existing] = await db.select().from(permissions).where(eq(permissions.id, id)).limit(1);

  if (!existing) {
    throw new Error(`Permission not found: ${id}`);
  }

  const oldPermission = mapRowToPermission(existing);

  // Update permission
  const [updated] = await db
    .update(permissions)
    .set({
      description: input.description !== undefined ? input.description : existing.description,
      metadata: input.metadata !== undefined ? input.metadata : existing.metadata,
      isActive: input.isActive !== undefined ? input.isActive : existing.isActive,
      updatedBy: actorId,
      updatedAt: new Date(),
    })
    .where(eq(permissions.id, id))
    .returning();

  const newPermission = mapRowToPermission(updated);

  // Create audit log
  await createFRSAuditLog({
    userId: actorId,
    action: 'update',
    entityType: 'permission',
    entityId: id,
    oldValues: JSON.parse(JSON.stringify(oldPermission)),
    newValues: JSON.parse(JSON.stringify(newPermission)),
    ipAddress: context?.ip,
    userAgent: context?.userAgent,
  });

  // Invalidate cache
  invalidatePermissionCache();

  return newPermission;
}

/**
 * Toggles permission active status.
 */
export async function togglePermissionStatus(
  id: string,
  actorId: string,
  context?: { ip?: string; userAgent?: string }
): Promise<Permission> {
  // Get existing permission
  const [existing] = await db.select().from(permissions).where(eq(permissions.id, id)).limit(1);

  if (!existing) {
    throw new Error(`Permission not found: ${id}`);
  }

  const oldPermission = mapRowToPermission(existing);

  // Toggle status
  const newStatus = !existing.isActive;
  const [updated] = await db
    .update(permissions)
    .set({
      isActive: newStatus,
      updatedBy: actorId,
      updatedAt: new Date(),
    })
    .where(eq(permissions.id, id))
    .returning();

  const newPermission = mapRowToPermission(updated);

  // Create audit log
  await createFRSAuditLog({
    userId: actorId,
    action: 'update',
    entityType: 'permission',
    entityId: id,
    oldValues: JSON.parse(JSON.stringify(oldPermission)),
    newValues: JSON.parse(JSON.stringify(newPermission)),
    ipAddress: context?.ip,
    userAgent: context?.userAgent,
  });

  // Invalidate cache
  invalidatePermissionCache();

  return newPermission;
}

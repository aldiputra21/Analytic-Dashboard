import { and, eq } from 'drizzle-orm';
import { db } from '../../db/connection';
import { permissions, rolePermissions, userCorporateAccesses } from '../../db/schema';

const permissionCache = new Map<string, { permissions: string[]; expiresAt: number }>();
const CACHE_TTL_MS = 60_000;

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
 * Gets the list of corporate IDs a user has access to.
 * Returns null if the user has system-wide access (owner/bod logic).
 */
export async function getUserSubsidiaryIds(userId: string): Promise<string[] | null> {
  const rows = await db.select({ 
    corporateId: userCorporateAccesses.corporateId,
    scope: userCorporateAccesses.scope 
  })
    .from(userCorporateAccesses)
    .where(eq(userCorporateAccesses.userId, userId));

  // If any row has scope 'system', user has access to everything
  if (rows.some(r => r.scope === 'system')) {
    return null; // null means "all"
  }

  return rows
    .map(r => r.corporateId)
    .filter((id): id is string => id !== null);
}

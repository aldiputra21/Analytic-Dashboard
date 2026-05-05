// Audit Log Service
// Drizzle ORM PostgreSQL implementation

import { eq, and, gte, lte, desc } from 'drizzle-orm';
import { db } from '../../db/connection';
import { auditLogs } from '../../db/schema/index.js';
import { users } from '../../db/schema/public.js';
import { CreateAuditLogInput, AuditLogEntry } from '../../types/financial/user';

export interface RequestContext {
  ip?: string;
  userAgent?: string;
}

type AuditLogRow = typeof auditLogs.$inferSelect & {
  userName: string | null;
  userEmail: string | null;
};

function mapRowToAuditLog(row: AuditLogRow): AuditLogEntry {
  return {
    id: row.id,
    userId: row.userId ?? '',
    userName: row.userName ?? undefined,
    userEmail: row.userEmail ?? undefined,
    action: row.action as AuditLogEntry['action'],
    entityType: row.entityType,
    entityId: row.entityId ?? undefined,
    subsidiaryId: undefined, // no longer stored; kept for backward compat
    oldValues: (row.oldValues as Record<string, unknown>) ?? undefined,
    newValues: (row.newValues as Record<string, unknown>) ?? undefined,
    justification: row.justification ?? undefined,
    ipAddress: row.ipAddress ?? undefined,
    userAgent: row.userAgent ?? undefined,
    createdAt: row.createdAt,
  };
}

/**
 * Creates an audit log entry.
 */
export async function createFRSAuditLog(
  input: CreateAuditLogInput,
): Promise<void> {
  try {
    await db.insert(auditLogs).values({
      userId: input.userId ?? null,
      module: 'frs',
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId ?? null,
      oldValues: input.oldValues ?? null,
      newValues: input.newValues ?? null,
      justification: input.justification ?? null,
      ipAddress: input.ipAddress ?? null,
      userAgent: input.userAgent ?? null,
    });
  } catch (err) {
    // Audit log failures must not break main operations
    console.error('[Audit] Failed to write audit log:', err);
  }
}

/**
 * Retrieves audit log entries with optional filters.
 * Joins with users table to return full name and email.
 */
export async function getFRSAuditLog(
  access: { scope: string; corporateIds: string[]; departmentIds: string[] },
  filters: {
    userId?: string;
    departmentId?: string;
    entityType?: string;
    action?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  } = {},
): Promise<AuditLogEntry[]> {
  const conditions = [];

  if (filters.userId) conditions.push(eq(auditLogs.userId, filters.userId));
  if (filters.departmentId) conditions.push(eq(auditLogs.departmentId, filters.departmentId));
  if (filters.entityType) conditions.push(eq(auditLogs.entityType, filters.entityType));
  if (filters.action) conditions.push(eq(auditLogs.action, filters.action));
  if (filters.startDate) conditions.push(gte(auditLogs.createdAt, filters.startDate));
  if (filters.endDate) conditions.push(lte(auditLogs.createdAt, filters.endDate));

  // Apply access context filtering
  if (access.scope === 'department') {
    const { inArray } = await import('drizzle-orm');
    if (access.departmentIds.length === 0) return [];
    conditions.push(inArray(auditLogs.departmentId, access.departmentIds));
  } else if (access.scope === 'corporate') {
    const { inArray } = await import('drizzle-orm');
    const { departments } = await import('../../db/schema/public.js');

    // Subquery to get all departments for allowed corporates
    const allowedDeptIds = db.select({ id: departments.id })
      .from(departments)
      .where(inArray(departments.corporateId, access.corporateIds));

    conditions.push(inArray(auditLogs.departmentId, allowedDeptIds));
  }

  const limit = filters.limit ?? 50;
  const offset = filters.offset ?? 0;

  const rows = await db
    .select({
      id: auditLogs.id,
      userId: auditLogs.userId,
      module: auditLogs.module,
      action: auditLogs.action,
      entityType: auditLogs.entityType,
      entityId: auditLogs.entityId,
      departmentId: auditLogs.departmentId,
      oldValues: auditLogs.oldValues,
      newValues: auditLogs.newValues,
      justification: auditLogs.justification,
      ipAddress: auditLogs.ipAddress,
      userAgent: auditLogs.userAgent,
      createdAt: auditLogs.createdAt,
      userName: users.fullName,
      userEmail: users.email,
    })
    .from(auditLogs)
    .leftJoin(users, eq(auditLogs.userId, users.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(auditLogs.createdAt))
    .limit(limit)
    .offset(offset);

  return rows.map(mapRowToAuditLog);
}

// Audit Log Service
// Drizzle ORM PostgreSQL implementation

import { eq, and, gte, lte, desc, sql } from 'drizzle-orm';
import { db } from '../../db/connection';
import { auditLogs } from '../../db/schema/index.js';
import { CreateAuditLogInput, AuditLogEntry } from '../../types/financial/user';

type AuditLogRow = typeof auditLogs.$inferSelect;

function mapRowToAuditLog(row: AuditLogRow): AuditLogEntry {
  return {
    id: row.id,
    userId: row.userId ?? '',
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
 */
export async function getFRSAuditLog(
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

  const limit = filters.limit ?? 50;
  const offset = filters.offset ?? 0;

  const rows = await db
    .select()
    .from(auditLogs)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(auditLogs.createdAt))
    .limit(limit)
    .offset(offset);

  return rows.map(mapRowToAuditLog);
}


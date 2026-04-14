import { db } from '../db/connection';
import { auditLogs } from '../db/schema';
import { AuditAction, CRMAuditLog } from '../types/crm';
import { eq, and, desc } from 'drizzle-orm';

// ============================================================
// CRM Audit Log Helper
// Drizzle ORM PostgreSQL implementation — writes to public.audit_logs with module='crm'.
// ============================================================

/**
 * Logs a CRM operation to the audit_logs table.
 */
export async function logCRMAudit(
  params: {
    userId: string;
    action: AuditAction;
    entityType: string;
    entityId: string;
    oldValues?: Record<string, unknown> | null;
    newValues?: Record<string, unknown> | null;
  },
): Promise<void> {
  const { userId, action, entityType, entityId, oldValues, newValues } = params;

  try {
    await db.insert(auditLogs).values({
      userId,
      action,
      module: 'crm',
      entityType,
      entityId,
      oldValues: oldValues ?? undefined,
      newValues: newValues ?? undefined,
    });
  } catch (err) {
    console.error('[CRM Audit] Failed to write audit log entry:', err);
  }
}

/**
 * Retrieves audit log entries for a specific entity.
 */
export async function getAuditLog(
  entityType: string,
  entityId: string,
): Promise<CRMAuditLog[]> {
  const rows = await db.select().from(auditLogs)
    .where(and(
      eq(auditLogs.module, 'crm'),
      eq(auditLogs.entityType, entityType),
      eq(auditLogs.entityId, entityId),
    ))
    .orderBy(desc(auditLogs.createdAt));

  return rows.map(mapRowToAuditLog);
}

/**
 * Retrieves all audit log entries for a specific user.
 */
export async function getUserAuditLog(
  userId: string,
  limit = 100,
): Promise<CRMAuditLog[]> {
  const rows = await db.select().from(auditLogs)
    .where(and(
      eq(auditLogs.module, 'crm'),
      eq(auditLogs.userId, userId),
    ))
    .orderBy(desc(auditLogs.createdAt))
    .limit(limit);

  return rows.map(mapRowToAuditLog);
}

function mapRowToAuditLog(row: typeof auditLogs.$inferSelect): CRMAuditLog {
  return {
    id: row.id,
    userId: row.userId,
    action: row.action as AuditAction,
    entityType: row.entityType ?? '',
    entityId: row.entityId ?? '',
    oldValues: row.oldValues as Record<string, unknown> | undefined,
    newValues: row.newValues as Record<string, unknown> | undefined,
    createdAt: row.createdAt,
  };
}

/** Convenience wrapper: logs a "create" action. */
export async function logCreate(
  userId: string, entityType: string, entityId: string,
  newValues: Record<string, unknown>,
): Promise<void> {
  await logCRMAudit({ userId, action: 'create', entityType, entityId, newValues });
}

/** Convenience wrapper: logs an "update" action. */
export async function logUpdate(
  userId: string, entityType: string, entityId: string,
  oldValues: Record<string, unknown>, newValues: Record<string, unknown>,
): Promise<void> {
  await logCRMAudit({ userId, action: 'update', entityType, entityId, oldValues, newValues });
}

/** Convenience wrapper: logs a "delete" action. */
export async function logDelete(
  userId: string, entityType: string, entityId: string,
  oldValues: Record<string, unknown>,
): Promise<void> {
  await logCRMAudit({ userId, action: 'delete', entityType, entityId, oldValues });
}

/** Convenience wrapper: logs a "transition" action. */
export async function logTransition(
  userId: string, entityType: string, entityId: string,
  oldValues: Record<string, unknown>, newValues: Record<string, unknown>,
): Promise<void> {
  await logCRMAudit({ userId, action: 'transition', entityType, entityId, oldValues, newValues });
}

/** Convenience wrapper: logs an "approve" action. */
export async function logApprove(
  userId: string, entityType: string, entityId: string,
  newValues?: Record<string, unknown>,
): Promise<void> {
  await logCRMAudit({ userId, action: 'approve', entityType, entityId, newValues });
}

/** Convenience wrapper: logs a "reject" action. */
export async function logReject(
  userId: string, entityType: string, entityId: string,
  newValues?: Record<string, unknown>,
): Promise<void> {
  await logCRMAudit({ userId, action: 'reject', entityType, entityId, newValues });
}

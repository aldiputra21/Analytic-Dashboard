import Database from 'better-sqlite3';
import { AuditAction, CRMAuditLog } from '../types/crm';

// ============================================================
// CRM Audit Log Helper
// Records all CRM operations to the crm_audit_log table.
// Requirements: 9.6
// ============================================================

/**
 * Generates a simple unique ID for audit log entries.
 * Uses timestamp + random suffix to avoid collisions.
 */
function generateAuditId(): string {
  return `audit_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Logs a CRM operation to the crm_audit_log table.
 *
 * @param db - The SQLite database instance
 * @param params - Audit log parameters
 */
export function logCRMAudit(
  db: Database.Database,
  params: {
    userId: string;
    action: AuditAction;
    entityType: string;
    entityId: string;
    oldValues?: Record<string, unknown> | null;
    newValues?: Record<string, unknown> | null;
  }
): void {
  const { userId, action, entityType, entityId, oldValues, newValues } = params;

  try {
    db.prepare(
      `INSERT INTO crm_audit_log (id, user_id, action, entity_type, entity_id, old_values, new_values)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).run(
      generateAuditId(),
      userId,
      action,
      entityType,
      entityId,
      oldValues != null ? JSON.stringify(oldValues) : null,
      newValues != null ? JSON.stringify(newValues) : null
    );
  } catch (err) {
    // Audit log failures should not break the main operation, but we log the error
    console.error('[CRM Audit] Failed to write audit log entry:', err);
  }
}

/**
 * Retrieves audit log entries for a specific entity.
 *
 * @param db - The SQLite database instance
 * @param entityType - The type of entity (e.g., 'opportunity', 'contract')
 * @param entityId - The ID of the entity
 * @returns Array of audit log entries
 */
export function getAuditLog(
  db: Database.Database,
  entityType: string,
  entityId: string
): CRMAuditLog[] {
  const rows = db
    .prepare(
      `SELECT * FROM crm_audit_log
       WHERE entity_type = ? AND entity_id = ?
       ORDER BY created_at DESC`
    )
    .all(entityType, entityId) as any[];

  return rows.map(mapRowToAuditLog);
}

/**
 * Retrieves all audit log entries for a specific user.
 *
 * @param db - The SQLite database instance
 * @param userId - The user ID
 * @param limit - Maximum number of entries to return (default: 100)
 * @returns Array of audit log entries
 */
export function getUserAuditLog(
  db: Database.Database,
  userId: string,
  limit = 100
): CRMAuditLog[] {
  const rows = db
    .prepare(
      `SELECT * FROM crm_audit_log
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT ?`
    )
    .all(userId, limit) as any[];

  return rows.map(mapRowToAuditLog);
}

/**
 * Maps a raw database row to a CRMAuditLog object.
 */
function mapRowToAuditLog(row: any): CRMAuditLog {
  return {
    id: row.id,
    userId: row.user_id,
    action: row.action as AuditAction,
    entityType: row.entity_type,
    entityId: row.entity_id,
    oldValues: row.old_values ? JSON.parse(row.old_values) : undefined,
    newValues: row.new_values ? JSON.parse(row.new_values) : undefined,
    createdAt: new Date(row.created_at),
  };
}

/**
 * Convenience wrapper: logs a "create" action.
 */
export function logCreate(
  db: Database.Database,
  userId: string,
  entityType: string,
  entityId: string,
  newValues: Record<string, unknown>
): void {
  logCRMAudit(db, { userId, action: 'create', entityType, entityId, newValues });
}

/**
 * Convenience wrapper: logs an "update" action.
 */
export function logUpdate(
  db: Database.Database,
  userId: string,
  entityType: string,
  entityId: string,
  oldValues: Record<string, unknown>,
  newValues: Record<string, unknown>
): void {
  logCRMAudit(db, { userId, action: 'update', entityType, entityId, oldValues, newValues });
}

/**
 * Convenience wrapper: logs a "delete" action.
 */
export function logDelete(
  db: Database.Database,
  userId: string,
  entityType: string,
  entityId: string,
  oldValues: Record<string, unknown>
): void {
  logCRMAudit(db, { userId, action: 'delete', entityType, entityId, oldValues });
}

/**
 * Convenience wrapper: logs a "transition" action (e.g., pipeline stage change).
 */
export function logTransition(
  db: Database.Database,
  userId: string,
  entityType: string,
  entityId: string,
  oldValues: Record<string, unknown>,
  newValues: Record<string, unknown>
): void {
  logCRMAudit(db, { userId, action: 'transition', entityType, entityId, oldValues, newValues });
}

/**
 * Convenience wrapper: logs an "approve" action.
 */
export function logApprove(
  db: Database.Database,
  userId: string,
  entityType: string,
  entityId: string,
  newValues?: Record<string, unknown>
): void {
  logCRMAudit(db, { userId, action: 'approve', entityType, entityId, newValues });
}

/**
 * Convenience wrapper: logs a "reject" action.
 */
export function logReject(
  db: Database.Database,
  userId: string,
  entityType: string,
  entityId: string,
  newValues?: Record<string, unknown>
): void {
  logCRMAudit(db, { userId, action: 'reject', entityType, entityId, newValues });
}

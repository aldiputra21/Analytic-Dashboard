// FRS Audit Log Service
// Requirements: 9.8, 11.1, 11.2

import Database from 'better-sqlite3';
import { CreateAuditLogInput, AuditLogEntry } from '../../types/financial/user';

function generateId(): string {
  return `frs_audit_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Creates an audit log entry for any FRS operation.
 * Requirements: 9.8, 11.1, 11.2
 */
export function createFRSAuditLog(
  db: Database.Database,
  input: CreateAuditLogInput
): void {
  try {
    db.prepare(`
      INSERT INTO frs_audit_log
        (id, user_id, action, entity_type, entity_id, subsidiary_id,
         old_values, new_values, justification, ip_address, user_agent)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      generateId(),
      input.userId,
      input.action,
      input.entityType,
      input.entityId ?? null,
      input.subsidiaryId ?? null,
      input.oldValues != null ? JSON.stringify(input.oldValues) : null,
      input.newValues != null ? JSON.stringify(input.newValues) : null,
      input.justification ?? null,
      input.ipAddress ?? null,
      input.userAgent ?? null,
    );
  } catch (err) {
    // Audit log failures must not break main operations
    console.error('[FRS Audit] Failed to write audit log:', err);
  }
}

/**
 * Retrieves audit log entries with optional filters.
 */
export function getFRSAuditLog(
  db: Database.Database,
  filters: {
    userId?: string;
    subsidiaryId?: string;
    entityType?: string;
    action?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  } = {}
): AuditLogEntry[] {
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (filters.userId) { conditions.push('user_id = ?'); params.push(filters.userId); }
  if (filters.subsidiaryId) { conditions.push('subsidiary_id = ?'); params.push(filters.subsidiaryId); }
  if (filters.entityType) { conditions.push('entity_type = ?'); params.push(filters.entityType); }
  if (filters.action) { conditions.push('action = ?'); params.push(filters.action); }
  if (filters.startDate) { conditions.push('created_at >= ?'); params.push(filters.startDate.toISOString()); }
  if (filters.endDate) { conditions.push('created_at <= ?'); params.push(filters.endDate.toISOString()); }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const limit = filters.limit ?? 50;
  const offset = filters.offset ?? 0;

  const rows = db
    .prepare(`SELECT id, user_id, action, entity_type, entity_id, subsidiary_id, old_values, new_values, justification, ip_address, user_agent, created_at FROM frs_audit_log ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`)
    .all(...params, limit, offset) as any[];

  return rows.map(mapRowToAuditLog);
}

function mapRowToAuditLog(row: any): AuditLogEntry {
  return {
    id: row.id,
    userId: row.user_id,
    action: row.action,
    entityType: row.entity_type,
    entityId: row.entity_id ?? undefined,
    subsidiaryId: row.subsidiary_id ?? undefined,
    oldValues: row.old_values ? JSON.parse(row.old_values) : undefined,
    newValues: row.new_values ? JSON.parse(row.new_values) : undefined,
    justification: row.justification ?? undefined,
    ipAddress: row.ip_address ?? undefined,
    userAgent: row.user_agent ?? undefined,
    createdAt: new Date(row.created_at),
  };
}

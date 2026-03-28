// Target Service — MAFINDA Dashboard Enhancement
// Requirements: 7.3, 7.4

import Database from 'better-sqlite3';
import { NotFoundError } from './departmentService';

export interface FinancialTarget {
  id: string;
  entityType: 'department' | 'project';
  entityId: string;
  period: string;           // format: "YYYY-MM"
  periodType: 'monthly' | 'quarterly' | 'annual';
  revenueTarget: number;
  operationalCostTarget: number;
  createdAt: string;
  updatedAt: string;
}

export interface GetTargetsFilter {
  entityType?: 'department' | 'project';
  entityId?: string;
  period?: string;
}

function generateId(): string {
  return `tgt_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function mapRow(row: any): FinancialTarget {
  return {
    id: row.id,
    entityType: row.entity_type,
    entityId: row.entity_id,
    period: row.period,
    periodType: row.period_type,
    revenueTarget: row.revenue_target,
    operationalCostTarget: row.operational_cost_target,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Returns targets, optionally filtered by entityType, entityId, and/or period.
 * Requirements: 7.3, 7.4
 */
export function getTargets(
  db: Database.Database,
  filter: GetTargetsFilter = {}
): FinancialTarget[] {
  const conditions: string[] = [];
  const params: any[] = [];

  if (filter.entityType) {
    conditions.push('entity_type = ?');
    params.push(filter.entityType);
  }
  if (filter.entityId) {
    conditions.push('entity_id = ?');
    params.push(filter.entityId);
  }
  if (filter.period) {
    conditions.push('period = ?');
    params.push(filter.period);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const sql = `SELECT * FROM mafinda_targets ${where} ORDER BY period DESC, entity_type ASC`;

  const rows = db.prepare(sql).all(...params) as any[];
  return rows.map(mapRow);
}

/**
 * Upserts a target using INSERT OR REPLACE to ensure uniqueness per
 * (entityType, entityId, period, periodType).
 * If a record with the same composite key exists, it is replaced.
 * Requirements: 7.3, 7.4
 */
export function upsertTarget(
  db: Database.Database,
  data: {
    entityType: 'department' | 'project';
    entityId: string;
    period: string;
    periodType: 'monthly' | 'quarterly' | 'annual';
    revenueTarget: number;
    operationalCostTarget: number;
  }
): FinancialTarget {
  const now = new Date().toISOString();

  // Check if a record already exists for this composite key so we can reuse its id
  const existing = db.prepare(`
    SELECT id, created_at FROM mafinda_targets
    WHERE entity_type = ? AND entity_id = ? AND period = ? AND period_type = ?
  `).get(data.entityType, data.entityId, data.period, data.periodType) as any;

  const id = existing ? existing.id : generateId();

  db.prepare(`
    INSERT OR REPLACE INTO mafinda_targets
      (id, entity_type, entity_id, period, period_type, revenue_target, operational_cost_target, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    data.entityType,
    data.entityId,
    data.period,
    data.periodType,
    data.revenueTarget,
    data.operationalCostTarget,
    existing ? existing.created_at ?? now : now,
    now
  );

  // Re-fetch to get the full record including created_at
  const saved = db.prepare('SELECT * FROM mafinda_targets WHERE id = ?').get(id) as any;
  return mapRow(saved);
}

/**
 * Deletes a target by id.
 * Throws NotFoundError (404) if not found.
 * Requirements: 7.3, 7.4
 */
export function deleteTarget(
  db: Database.Database,
  id: string
): { success: boolean } {
  const existing = db.prepare('SELECT id FROM mafinda_targets WHERE id = ?').get(id) as any;
  if (!existing) throw new NotFoundError('Target tidak ditemukan');

  db.prepare('DELETE FROM mafinda_targets WHERE id = ?').run(id);
  return { success: true };
}

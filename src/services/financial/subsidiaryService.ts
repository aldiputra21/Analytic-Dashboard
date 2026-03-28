// Subsidiary Service
// Requirements: 1.1, 1.2, 1.3, 1.5, 1.6

import Database from 'better-sqlite3';
import { Subsidiary, CreateSubsidiaryInput, UpdateSubsidiaryInput } from '../../types/financial/subsidiary';

const MAX_SUBSIDIARIES = 5;

function generateId(): string {
  return `sub_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function mapRowToSubsidiary(row: any): Subsidiary {
  return {
    id: row.id,
    name: row.name,
    industrySector: row.industry_sector,
    fiscalYearStartMonth: row.fiscal_year_start_month,
    currency: row.currency,
    taxRate: row.tax_rate,
    isActive: Boolean(row.is_active),
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    createdBy: row.created_by,
  };
}

/**
 * Creates a new subsidiary. Enforces max 5 limit.
 * Requirements: 1.1, 1.2, 1.3
 */
export function createSubsidiary(
  db: Database.Database,
  input: CreateSubsidiaryInput,
  createdBy: string
): { subsidiary?: Subsidiary; error?: string } {
  const count = (db.prepare('SELECT COUNT(*) as count FROM subsidiaries').get() as any).count;
  if (count >= MAX_SUBSIDIARIES) {
    return { error: `Maximum of ${MAX_SUBSIDIARIES} subsidiaries allowed` };
  }

  const id = generateId();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO subsidiaries (id, name, industry_sector, fiscal_year_start_month, currency, tax_rate, is_active, created_at, updated_at, created_by)
    VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?, ?)
  `).run(
    id,
    input.name,
    input.industrySector,
    input.fiscalYearStartMonth,
    input.currency ?? 'IDR',
    input.taxRate,
    now,
    now,
    createdBy,
  );

  const row = db.prepare('SELECT * FROM subsidiaries WHERE id = ?').get(id) as any;
  return { subsidiary: mapRowToSubsidiary(row) };
}

/**
 * Lists all subsidiaries with optional active filter.
 * Requirements: 1.1
 */
export function listSubsidiaries(
  db: Database.Database,
  activeOnly?: boolean
): Subsidiary[] {
  const sql = activeOnly
    ? 'SELECT * FROM subsidiaries WHERE is_active = 1 ORDER BY created_at ASC'
    : 'SELECT * FROM subsidiaries ORDER BY created_at ASC';
  const rows = db.prepare(sql).all() as any[];
  return rows.map(mapRowToSubsidiary);
}

/**
 * Gets a subsidiary by ID.
 */
export function getSubsidiaryById(
  db: Database.Database,
  id: string
): Subsidiary | null {
  const row = db.prepare('SELECT * FROM subsidiaries WHERE id = ?').get(id) as any;
  return row ? mapRowToSubsidiary(row) : null;
}

/**
 * Updates a subsidiary's profile.
 * Requirements: 1.2
 */
export function updateSubsidiary(
  db: Database.Database,
  id: string,
  input: UpdateSubsidiaryInput
): Subsidiary | null {
  const existing = db.prepare('SELECT * FROM subsidiaries WHERE id = ?').get(id) as any;
  if (!existing) return null;

  const updated = {
    name: input.name ?? existing.name,
    industry_sector: input.industrySector ?? existing.industry_sector,
    fiscal_year_start_month: input.fiscalYearStartMonth ?? existing.fiscal_year_start_month,
    currency: input.currency ?? existing.currency,
    tax_rate: input.taxRate ?? existing.tax_rate,
  };

  db.prepare(`
    UPDATE subsidiaries
    SET name = ?, industry_sector = ?, fiscal_year_start_month = ?, currency = ?, tax_rate = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(updated.name, updated.industry_sector, updated.fiscal_year_start_month, updated.currency, updated.tax_rate, id);

  const row = db.prepare('SELECT * FROM subsidiaries WHERE id = ?').get(id) as any;
  return mapRowToSubsidiary(row);
}

/**
 * Toggles subsidiary active status.
 * Requirements: 1.5
 */
export function setSubsidiaryStatus(
  db: Database.Database,
  id: string,
  isActive: boolean
): Subsidiary | null {
  const existing = db.prepare('SELECT * FROM subsidiaries WHERE id = ?').get(id) as any;
  if (!existing) return null;

  db.prepare('UPDATE subsidiaries SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
    .run(isActive ? 1 : 0, id);

  const row = db.prepare('SELECT * FROM subsidiaries WHERE id = ?').get(id) as any;
  return mapRowToSubsidiary(row);
}

/**
 * Deletes a subsidiary. Rejects if it has financial data.
 * Requirements: 1.6
 */
export function deleteSubsidiary(
  db: Database.Database,
  id: string
): { success: boolean; error?: string } {
  const existing = db.prepare('SELECT * FROM subsidiaries WHERE id = ?').get(id) as any;
  if (!existing) return { success: false, error: 'Subsidiary not found' };

  const hasData = (db.prepare('SELECT COUNT(*) as count FROM frs_financial_data WHERE subsidiary_id = ?').get(id) as any).count > 0;
  if (hasData) {
    return { success: false, error: 'Cannot delete subsidiary with existing financial data' };
  }

  db.prepare('DELETE FROM subsidiaries WHERE id = ?').run(id);
  return { success: true };
}

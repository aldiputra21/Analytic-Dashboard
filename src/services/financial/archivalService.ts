// Data Archival Service
// Requirements: 12.8

import Database from 'better-sqlite3';

export interface ArchivalResult {
  archivedCount: number;
  errors: string[];
}

/**
 * Archives financial data records with period_end_date older than 10 years.
 * Moves records from frs_financial_data to frs_financial_data_archive.
 * Requirements: 12.8
 */
export function archiveOldFinancialData(db: Database.Database): ArchivalResult {
  const tenYearsAgo = new Date();
  tenYearsAgo.setFullYear(tenYearsAgo.getFullYear() - 10);
  const cutoffDate = tenYearsAgo.toISOString().split('T')[0];

  const oldRecords = db
    .prepare(`
      SELECT * FROM frs_financial_data
      WHERE period_end_date < ?
    `)
    .all(cutoffDate) as any[];

  if (oldRecords.length === 0) {
    return { archivedCount: 0, errors: [] };
  }

  const errors: string[] = [];
  let archivedCount = 0;

  const doArchive = db.transaction(() => {
    for (const row of oldRecords) {
      try {
        // Insert into archive table
        db.prepare(`
          INSERT OR IGNORE INTO frs_financial_data_archive
            (id, original_id, subsidiary_id, period_type, period_start_date, period_end_date,
             revenue, net_profit, operating_cash_flow, interest_expense,
             cash, inventory, current_assets, total_assets, current_liabilities,
             short_term_debt, current_portion_long_term_debt, total_liabilities, total_equity,
             archived_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `).run(
          `arch_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
          row.id,
          row.subsidiary_id,
          row.period_type,
          row.period_start_date,
          row.period_end_date,
          row.revenue,
          row.net_profit,
          row.operating_cash_flow,
          row.interest_expense,
          row.cash,
          row.inventory,
          row.current_assets,
          row.total_assets,
          row.current_liabilities,
          row.short_term_debt,
          row.current_portion_long_term_debt,
          row.total_liabilities,
          row.total_equity,
        );

        // Delete from main table (cascades to calculated_ratios and history)
        db.prepare('DELETE FROM frs_financial_data WHERE id = ?').run(row.id);
        archivedCount++;
      } catch (err: any) {
        errors.push(`Failed to archive record ${row.id}: ${err.message}`);
      }
    }
  });

  doArchive();

  return { archivedCount, errors };
}

/**
 * Gets archived financial data records with optional filters.
 * Requirements: 12.8
 */
export function getArchivedData(
  db: Database.Database,
  filters: {
    subsidiaryId?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
  } = {}
): any[] {
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (filters.subsidiaryId) { conditions.push('subsidiary_id = ?'); params.push(filters.subsidiaryId); }
  if (filters.startDate) { conditions.push('period_start_date >= ?'); params.push(filters.startDate); }
  if (filters.endDate) { conditions.push('period_end_date <= ?'); params.push(filters.endDate); }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const limit = filters.limit ?? 100;
  const offset = filters.offset ?? 0;

  return db
    .prepare(`SELECT * FROM frs_financial_data_archive ${where} ORDER BY period_end_date DESC LIMIT ? OFFSET ?`)
    .all(...params, limit, offset) as any[];
}

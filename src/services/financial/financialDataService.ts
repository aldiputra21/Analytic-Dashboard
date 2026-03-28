// Financial Data Service
// Requirements: 2.3, 11.1, 11.3, 11.4, 11.5, 11.6

import Database from 'better-sqlite3';
import { FinancialData, CreateFinancialDataInput, UpdateFinancialDataInput, PeriodType } from '../../types/financial/financialData';

function generateId(): string {
  return `fd_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export function mapRowToFinancialData(row: any): FinancialData {
  return {
    id: row.id,
    subsidiaryId: row.subsidiary_id,
    periodType: row.period_type as PeriodType,
    periodStartDate: new Date(row.period_start_date),
    periodEndDate: new Date(row.period_end_date),
    revenue: row.revenue,
    netProfit: row.net_profit,
    operatingCashFlow: row.operating_cash_flow,
    interestExpense: row.interest_expense,
    cash: row.cash,
    inventory: row.inventory,
    currentAssets: row.current_assets,
    totalAssets: row.total_assets,
    currentLiabilities: row.current_liabilities,
    shortTermDebt: row.short_term_debt,
    currentPortionLongTermDebt: row.current_portion_long_term_debt,
    totalLiabilities: row.total_liabilities,
    totalEquity: row.total_equity,
    isRestated: Boolean(row.is_restated),
    restatementReason: row.restatement_reason ?? undefined,
    version: row.version,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    createdBy: row.created_by,
  };
}

/**
 * Creates a financial data entry.
 * Requirements: 2.3
 */
export function createFinancialData(
  db: Database.Database,
  input: CreateFinancialDataInput,
  createdBy: string
): { data?: FinancialData; error?: string } {
  // Check for duplicate subsidiary+period combination (Req 2.7)
  const existing = db.prepare(
    'SELECT id FROM frs_financial_data WHERE subsidiary_id = ? AND period_type = ? AND period_start_date = ?'
  ).get(input.subsidiaryId, input.periodType, input.periodStartDate instanceof Date ? input.periodStartDate.toISOString().split('T')[0] : input.periodStartDate);

  if (existing) {
    return { error: 'Financial data for this subsidiary and period already exists' };
  }

  const id = generateId();
  const now = new Date().toISOString();
  const startDate = input.periodStartDate instanceof Date ? input.periodStartDate.toISOString().split('T')[0] : input.periodStartDate;
  const endDate = input.periodEndDate instanceof Date ? input.periodEndDate.toISOString().split('T')[0] : input.periodEndDate;

  db.prepare(`
    INSERT INTO frs_financial_data
      (id, subsidiary_id, period_type, period_start_date, period_end_date,
       revenue, net_profit, operating_cash_flow, interest_expense,
       cash, inventory, current_assets, total_assets, current_liabilities,
       short_term_debt, current_portion_long_term_debt, total_liabilities, total_equity,
       is_restated, version, created_at, updated_at, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 1, ?, ?, ?)
  `).run(
    id,
    input.subsidiaryId,
    input.periodType,
    startDate,
    endDate,
    input.revenue,
    input.netProfit,
    input.operatingCashFlow,
    input.interestExpense ?? 0,
    input.cash,
    input.inventory ?? 0,
    input.currentAssets,
    input.totalAssets,
    input.currentLiabilities,
    input.shortTermDebt ?? 0,
    input.currentPortionLongTermDebt ?? 0,
    input.totalLiabilities,
    input.totalEquity,
    now,
    now,
    createdBy,
  );

  const row = db.prepare('SELECT * FROM frs_financial_data WHERE id = ?').get(id) as any;
  return { data: mapRowToFinancialData(row) };
}

/**
 * Queries financial data with filters.
 */
export function queryFinancialData(
  db: Database.Database,
  filters: {
    subsidiaryId?: string;
    periodType?: PeriodType;
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
  }
): FinancialData[] {
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (filters.subsidiaryId) { conditions.push('subsidiary_id = ?'); params.push(filters.subsidiaryId); }
  if (filters.periodType) { conditions.push('period_type = ?'); params.push(filters.periodType); }
  if (filters.startDate) { conditions.push('period_start_date >= ?'); params.push(filters.startDate); }
  if (filters.endDate) { conditions.push('period_end_date <= ?'); params.push(filters.endDate); }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const limit = filters.limit ?? 50;
  const offset = filters.offset ?? 0;

  const rows = db
    .prepare(`SELECT id, subsidiary_id, period_type, period_start_date, period_end_date, revenue, net_profit, operating_cash_flow, interest_expense, cash, inventory, current_assets, total_assets, current_liabilities, short_term_debt, current_portion_long_term_debt, total_liabilities, total_equity, is_restated, restatement_reason, version, created_at, updated_at, created_by FROM frs_financial_data ${where} ORDER BY period_start_date DESC LIMIT ? OFFSET ?`)
    .all(...params, limit, offset) as any[];

  return rows.map(mapRowToFinancialData);
}

/**
 * Gets a single financial data entry by ID.
 */
export function getFinancialDataById(db: Database.Database, id: string): FinancialData | null {
  const row = db.prepare('SELECT * FROM frs_financial_data WHERE id = ?').get(id) as any;
  return row ? mapRowToFinancialData(row) : null;
}

/**
 * Updates a financial data entry with versioning and historical data protection.
 * Requirements: 11.3, 11.4, 11.5, 11.6
 */
export function updateFinancialData(
  db: Database.Database,
  id: string,
  input: UpdateFinancialDataInput,
  updatedBy: string,
  userRole: string
): { data?: FinancialData; error?: string } {
  const existing = db.prepare('SELECT * FROM frs_financial_data WHERE id = ?').get(id) as any;
  if (!existing) return { error: 'Financial data not found' };

  // Historical data protection: data older than current fiscal year requires owner approval (Req 11.3)
  const currentYear = new Date().getFullYear();
  const dataYear = new Date(existing.period_end_date).getFullYear();
  if (dataYear < currentYear && userRole !== 'owner') {
    return { error: 'Modification of historical financial data requires Owner approval' };
  }

  // Require justification for historical data (Req 11.4)
  if (dataYear < currentYear && !input.restatementReason) {
    return { error: 'A restatement reason is required when modifying historical financial data' };
  }

  // Save current version to history (Req 11.6)
  const histId = `fdh_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  db.prepare(`
    INSERT INTO frs_financial_data_history
      (id, financial_data_id, version, subsidiary_id, period_type, period_start_date, period_end_date,
       revenue, net_profit, operating_cash_flow, interest_expense, cash, inventory,
       current_assets, total_assets, current_liabilities, short_term_debt,
       current_portion_long_term_debt, total_liabilities, total_equity,
       changed_at, changed_by, change_reason)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?, ?)
  `).run(
    histId, id, existing.version,
    existing.subsidiary_id, existing.period_type, existing.period_start_date, existing.period_end_date,
    existing.revenue, existing.net_profit, existing.operating_cash_flow, existing.interest_expense,
    existing.cash, existing.inventory, existing.current_assets, existing.total_assets,
    existing.current_liabilities, existing.short_term_debt, existing.current_portion_long_term_debt,
    existing.total_liabilities, existing.total_equity,
    updatedBy, input.restatementReason ?? null,
  );

  const isHistorical = dataYear < currentYear;

  db.prepare(`
    UPDATE frs_financial_data SET
      revenue = ?, net_profit = ?, operating_cash_flow = ?, interest_expense = ?,
      cash = ?, inventory = ?, current_assets = ?, total_assets = ?,
      current_liabilities = ?, short_term_debt = ?, current_portion_long_term_debt = ?,
      total_liabilities = ?, total_equity = ?,
      is_restated = ?, restatement_reason = ?,
      version = version + 1, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(
    input.revenue ?? existing.revenue,
    input.netProfit ?? existing.net_profit,
    input.operatingCashFlow ?? existing.operating_cash_flow,
    input.interestExpense ?? existing.interest_expense,
    input.cash ?? existing.cash,
    input.inventory ?? existing.inventory,
    input.currentAssets ?? existing.current_assets,
    input.totalAssets ?? existing.total_assets,
    input.currentLiabilities ?? existing.current_liabilities,
    input.shortTermDebt ?? existing.short_term_debt,
    input.currentPortionLongTermDebt ?? existing.current_portion_long_term_debt,
    input.totalLiabilities ?? existing.total_liabilities,
    input.totalEquity ?? existing.total_equity,
    isHistorical ? 1 : existing.is_restated,
    input.restatementReason ?? existing.restatement_reason,
    id,
  );

  const row = db.prepare('SELECT * FROM frs_financial_data WHERE id = ?').get(id) as any;
  return { data: mapRowToFinancialData(row) };
}

/**
 * Deletes a financial data entry.
 * Requirements: 11.1
 */
export function deleteFinancialData(
  db: Database.Database,
  id: string
): { success: boolean; error?: string } {
  const existing = db.prepare('SELECT * FROM frs_financial_data WHERE id = ?').get(id) as any;
  if (!existing) return { success: false, error: 'Financial data not found' };

  db.prepare('DELETE FROM frs_financial_data WHERE id = ?').run(id);
  return { success: true };
}

/**
 * Gets version history for a financial data entry.
 * Requirements: 11.6
 */
export function getFinancialDataHistory(db: Database.Database, financialDataId: string): any[] {
  const rows = db
    .prepare('SELECT * FROM frs_financial_data_history WHERE financial_data_id = ? ORDER BY version ASC')
    .all(financialDataId) as any[];
  return rows.map((row) => ({
    id: row.id,
    financialDataId: row.financial_data_id,
    version: row.version,
    subsidiaryId: row.subsidiary_id,
    periodType: row.period_type,
    periodStartDate: row.period_start_date,
    periodEndDate: row.period_end_date,
    revenue: row.revenue,
    netProfit: row.net_profit,
    operatingCashFlow: row.operating_cash_flow,
    interestExpense: row.interest_expense,
    cash: row.cash,
    inventory: row.inventory,
    currentAssets: row.current_assets,
    totalAssets: row.total_assets,
    currentLiabilities: row.current_liabilities,
    shortTermDebt: row.short_term_debt,
    currentPortionLongTermDebt: row.current_portion_long_term_debt,
    totalLiabilities: row.total_liabilities,
    totalEquity: row.total_equity,
    changedAt: new Date(row.changed_at),
    changedBy: row.changed_by,
    changeReason: row.change_reason ?? undefined,
  }));
}

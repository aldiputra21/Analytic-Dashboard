// Financial Data Service
// Reads aggregated financial data from cfd.v_financial_summary view.
// Data entry (create/update/delete) is handled by financialStatementService.ts.

import { sql } from 'drizzle-orm';
import { db } from '../../db/connection';
import { FinancialData, PeriodType } from '../../types/financial/financialData';

interface ViewRow {
  balance_sheet_id: string;
  department_id: string;
  period: string;
  corporate_id: string;
  revenue: string;
  net_profit: string;
  interest_expense: string;
  cash: string;
  inventory: string;
  current_assets: string;
  total_assets: string;
  current_liabilities: string;
  short_term_debt: string;
  total_liabilities: string;
  total_equity: string;
}

function n(v: string | null | undefined): number {
  return parseFloat(v ?? '0') || 0;
}

export function mapRowToFinancialData(row: ViewRow): FinancialData {
  return {
    id: row.balance_sheet_id,
    subsidiaryId: row.corporate_id,
    periodType: 'monthly' as PeriodType,
    periodStartDate: new Date(row.period + '-01'),
    periodEndDate: new Date(row.period + '-01'),
    revenue: n(row.revenue),
    netProfit: n(row.net_profit),
    operatingCashFlow: 0, // OCF from weekly_cash_flows via fn_calculate_ocf_ratios
    interestExpense: n(row.interest_expense),
    cash: n(row.cash),
    inventory: n(row.inventory),
    currentAssets: n(row.current_assets),
    totalAssets: n(row.total_assets),
    currentLiabilities: n(row.current_liabilities),
    shortTermDebt: n(row.short_term_debt),
    currentPortionLongTermDebt: 0,
    totalLiabilities: n(row.total_liabilities),
    totalEquity: n(row.total_equity),
    isRestated: false,
    version: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: '',
  };
}

/**
 * Queries financial data from v_financial_summary view.
 */
export async function queryFinancialData(
  filters: {
    corporateId?: string;
    departmentId?: string;
    period?: string;
    limit?: number;
    offset?: number;
  },
): Promise<FinancialData[]> {
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (filters.corporateId) {
    conditions.push(`corporate_id = $${conditions.length + 1}`);
    params.push(filters.corporateId);
  }
  if (filters.departmentId) {
    conditions.push(`department_id = $${conditions.length + 1}`);
    params.push(filters.departmentId);
  }
  if (filters.period) {
    conditions.push(`period = $${conditions.length + 1}`);
    params.push(filters.period);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const limit = filters.limit ?? 50;
  const offset = filters.offset ?? 0;

  const rows = (await db.execute(
    sql.raw(`SELECT * FROM cfd.v_financial_summary ${where} ORDER BY period DESC LIMIT ${limit} OFFSET ${offset}`),
  )).rows as unknown as ViewRow[];

  return rows.map(mapRowToFinancialData);
}

/**
 * Gets a single financial data entry by balance_sheet_id.
 */
export async function getFinancialDataById(id: string): Promise<FinancialData | null> {
  const rows = (await db.execute(
    sql`SELECT * FROM cfd.v_financial_summary WHERE balance_sheet_id = ${id} LIMIT 1`,
  )).rows as unknown as ViewRow[];
  return rows.length > 0 ? mapRowToFinancialData(rows[0]) : null;
}

/**
 * Gets financial data for a specific department and period.
 */
export async function getFinancialDataByDeptPeriod(
  departmentId: string,
  period: string,
): Promise<FinancialData | null> {
  const rows = (await db.execute(
    sql`SELECT * FROM cfd.v_financial_summary WHERE department_id = ${departmentId} AND period = ${period} LIMIT 1`,
  )).rows as unknown as ViewRow[];
  return rows.length > 0 ? mapRowToFinancialData(rows[0]) : null;
}

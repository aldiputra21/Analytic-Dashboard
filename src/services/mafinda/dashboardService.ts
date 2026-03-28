// Dashboard Service — MAFINDA Dashboard Enhancement
// Requirements: 1.3, 1.6, 2.5, 3.4, 3.5, 3.6, 4.5, 5.5, 6.5

import Database from 'better-sqlite3';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DeptRevenueTargetItem {
  departmentId: string;
  departmentName: string;
  target: number;
  realization: number;
  /** achievementRate = (realization / target) * 100; 0 when target is 0 */
  achievementRate: number;
}

export interface DeptRevenueTargetResult {
  period: string;
  periodType: string;
  departments: DeptRevenueTargetItem[];
}

export interface RevenueCostSummary {
  period: string;
  departmentId?: string;
  departmentName?: string;
  revenue: number;
  revenueChange: number;       // % change vs previous period
  operationalCost: number;
  operationalCostChange: number;
}

export interface CashFlowDataPoint {
  period: string;
  cashIn: number;
  cashOut: number;
  netCashFlow: number;         // cashIn - cashOut
}

export interface CashFlowResult {
  data: CashFlowDataPoint[];
  departmentId?: string;
  projectId?: string;
}

export interface AssetComposition {
  period: string;
  currentAssets: number;
  fixedAssets: number;
  otherAssets: number;
  totalAssets: number;         // currentAssets + fixedAssets + otherAssets
}

export interface EquityLiabilityComposition {
  period: string;
  paidInCapital: number;
  retainedEarnings: number;
  otherEquity: number;
  shortTermLiabilities: number;
  longTermLiabilities: number;
  totalEquity: number;         // paidInCapital + retainedEarnings + otherEquity
  totalLiabilities: number;   // shortTermLiabilities + longTermLiabilities
  totalAssets: number;         // totalEquity + totalLiabilities
}

export interface HistoricalDataPoint {
  period: string;
  revenue: number;
  netProfit: number;
  totalAssets: number;
  totalLiabilities: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Calculates achievement rate.
 * Returns 0 when target is 0 to avoid division by zero.
 * Requirements: 1.3
 */
export function calculateAchievementRate(target: number, realization: number): number {
  if (target === 0) return 0;
  return (realization / target) * 100;
}

/**
 * Calculates net cash flow.
 * Requirements: 3.4
 */
export function calculateNetCashFlow(cashIn: number, cashOut: number): number {
  return cashIn - cashOut;
}

/**
 * Builds asset composition ensuring totalAssets = currentAssets + fixedAssets + otherAssets.
 * Requirements: 4.5
 */
export function buildAssetComposition(
  period: string,
  currentAssets: number,
  fixedAssets: number,
  otherAssets: number
): AssetComposition {
  return {
    period,
    currentAssets,
    fixedAssets,
    otherAssets,
    totalAssets: currentAssets + fixedAssets + otherAssets,
  };
}

/**
 * Builds equity & liability composition ensuring totalEquity + totalLiabilities = totalAssets.
 * Requirements: 5.5
 */
export function buildEquityLiabilityComposition(
  period: string,
  paidInCapital: number,
  retainedEarnings: number,
  otherEquity: number,
  shortTermLiabilities: number,
  longTermLiabilities: number
): EquityLiabilityComposition {
  const totalEquity = paidInCapital + retainedEarnings + otherEquity;
  const totalLiabilities = shortTermLiabilities + longTermLiabilities;
  return {
    period,
    paidInCapital,
    retainedEarnings,
    otherEquity,
    shortTermLiabilities,
    longTermLiabilities,
    totalEquity,
    totalLiabilities,
    totalAssets: totalEquity + totalLiabilities,
  };
}

/** Returns the previous period string in "YYYY-MM" format. */
function previousPeriod(period: string): string {
  const [year, month] = period.split('-').map(Number);
  const date = new Date(year, month - 2); // month-2 because Date months are 0-indexed
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

/** Calculates percentage change; returns 0 when previous is 0. */
function percentChange(current: number, previous: number): number {
  if (previous === 0) return 0;
  return ((current - previous) / previous) * 100;
}

// ─── Service Functions ────────────────────────────────────────────────────────

/**
 * Returns target vs realization revenue per department for a given period.
 * achievementRate = (realization / target) * 100
 * Requirements: 1.3, 1.6
 */
export function getDeptRevenueTarget(
  db: Database.Database,
  period: string,
  periodType: string
): DeptRevenueTargetResult {
  const departments = db
    .prepare('SELECT id, name FROM mafinda_departments WHERE is_active = 1 ORDER BY name ASC')
    .all() as any[];

  const items: DeptRevenueTargetItem[] = departments.map((dept) => {
    const targetRow = db.prepare(`
      SELECT revenue_target FROM mafinda_targets
      WHERE entity_type = 'department' AND entity_id = ? AND period = ? AND period_type = ?
    `).get(dept.id, period, periodType) as any;

    const realizationRow = db.prepare(`
      SELECT revenue FROM mafinda_revenue_realizations
      WHERE entity_type = 'department' AND entity_id = ? AND period = ? AND period_type = ?
    `).get(dept.id, period, periodType) as any;

    const target = targetRow?.revenue_target ?? 0;
    const realization = realizationRow?.revenue ?? 0;

    return {
      departmentId: dept.id,
      departmentName: dept.name,
      target,
      realization,
      achievementRate: calculateAchievementRate(target, realization),
    };
  });

  return { period, periodType, departments: items };
}

/**
 * Returns revenue and operational cost summary, optionally filtered by department.
 * Includes percentage change vs the previous period.
 * Requirements: 2.5
 */
export function getRevenueCostSummary(
  db: Database.Database,
  period: string,
  departmentId?: string
): RevenueCostSummary {
  const prevPeriod = previousPeriod(period);

  if (departmentId) {
    // Per-department: use revenue_realizations
    const dept = db
      .prepare('SELECT id, name FROM mafinda_departments WHERE id = ?')
      .get(departmentId) as any;

    const current = db.prepare(`
      SELECT revenue, operational_cost FROM mafinda_revenue_realizations
      WHERE entity_type = 'department' AND entity_id = ? AND period = ?
    `).get(departmentId, period) as any;

    const previous = db.prepare(`
      SELECT revenue, operational_cost FROM mafinda_revenue_realizations
      WHERE entity_type = 'department' AND entity_id = ? AND period = ?
    `).get(departmentId, prevPeriod) as any;

    const revenue = current?.revenue ?? 0;
    const operationalCost = current?.operational_cost ?? 0;
    const prevRevenue = previous?.revenue ?? 0;
    const prevCost = previous?.operational_cost ?? 0;

    return {
      period,
      departmentId,
      departmentName: dept?.name,
      revenue,
      revenueChange: percentChange(revenue, prevRevenue),
      operationalCost,
      operationalCostChange: percentChange(operationalCost, prevCost),
    };
  }

  // Aggregate across all departments from income statements
  const current = db.prepare(`
    SELECT revenue, operational_expenses FROM mafinda_income_statements WHERE period = ?
  `).get(period) as any;

  const previous = db.prepare(`
    SELECT revenue, operational_expenses FROM mafinda_income_statements WHERE period = ?
  `).get(prevPeriod) as any;

  const revenue = current?.revenue ?? 0;
  const operationalCost = current?.operational_expenses ?? 0;
  const prevRevenue = previous?.revenue ?? 0;
  const prevCost = previous?.operational_expenses ?? 0;

  return {
    period,
    revenue,
    revenueChange: percentChange(revenue, prevRevenue),
    operationalCost,
    operationalCostChange: percentChange(operationalCost, prevCost),
  };
}

/**
 * Returns cash flow data points for a range of months.
 * Optionally filtered by departmentId and/or projectId.
 * netCashFlow = cashIn - cashOut for each period.
 * Requirements: 3.4, 3.5, 3.6
 */
export function getCashFlowData(
  db: Database.Database,
  period: string,
  months = 6,
  departmentId?: string,
  projectId?: string
): CashFlowResult {
  // Build list of periods to cover
  const [year, month] = period.split('-').map(Number);
  const periods: string[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(year, month - 1 - i);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    periods.push(`${y}-${m}`);
  }

  const conditions: string[] = ['period IN (' + periods.map(() => '?').join(',') + ')'];
  const params: any[] = [...periods];

  if (departmentId !== undefined) {
    conditions.push('department_id = ?');
    params.push(departmentId);
  }
  if (projectId !== undefined) {
    conditions.push('project_id = ?');
    params.push(projectId);
  }

  const rows = db.prepare(`
    SELECT period,
      SUM(operating_cash_in + investing_cash_in + financing_cash_in) AS cash_in,
      SUM(operating_cash_out + investing_cash_out + financing_cash_out) AS cash_out
    FROM mafinda_cash_flows
    WHERE ${conditions.join(' AND ')}
    GROUP BY period
    ORDER BY period ASC
  `).all(...params) as any[];

  // Build a map for quick lookup
  const rowMap = new Map<string, { cashIn: number; cashOut: number }>();
  for (const r of rows) {
    rowMap.set(r.period, { cashIn: r.cash_in ?? 0, cashOut: r.cash_out ?? 0 });
  }

  // Return a data point for every period in range (zero-fill missing)
  const data: CashFlowDataPoint[] = periods.map((p) => {
    const entry = rowMap.get(p) ?? { cashIn: 0, cashOut: 0 };
    return {
      period: p,
      cashIn: entry.cashIn,
      cashOut: entry.cashOut,
      netCashFlow: calculateNetCashFlow(entry.cashIn, entry.cashOut),
    };
  });

  return {
    data,
    departmentId,
    projectId,
  };
}

/**
 * Returns asset composition for a given period.
 * totalAssets = currentAssets + fixedAssets + otherAssets
 * Requirements: 4.5
 */
export function getAssetComposition(
  db: Database.Database,
  period: string
): AssetComposition | null {
  const row = db.prepare(`
    SELECT period, current_assets, fixed_assets, other_assets
    FROM mafinda_balance_sheets
    WHERE period = ?
  `).get(period) as any;

  if (!row) return null;

  return buildAssetComposition(
    row.period,
    row.current_assets,
    row.fixed_assets,
    row.other_assets
  );
}

/**
 * Returns equity & liability composition for a given period.
 * totalEquity + totalLiabilities = totalAssets
 * Requirements: 5.5
 */
export function getEquityLiabilityComposition(
  db: Database.Database,
  period: string
): EquityLiabilityComposition | null {
  const row = db.prepare(`
    SELECT period, paid_in_capital, retained_earnings, other_equity,
           short_term_liabilities, long_term_liabilities
    FROM mafinda_balance_sheets
    WHERE period = ?
  `).get(period) as any;

  if (!row) return null;

  return buildEquityLiabilityComposition(
    row.period,
    row.paid_in_capital,
    row.retained_earnings,
    row.other_equity,
    row.short_term_liabilities,
    row.long_term_liabilities
  );
}

/**
 * Returns historical financial data for the last N months ending at the most recent period.
 * Joins income statements and balance sheets by period.
 * Requirements: 6.5
 */
export function getHistoricalData(
  db: Database.Database,
  months: number
): HistoricalDataPoint[] {
  const rows = db.prepare(`
    SELECT
      i.period,
      i.revenue,
      i.net_profit,
      (COALESCE(b.current_assets, 0) + COALESCE(b.fixed_assets, 0) + COALESCE(b.other_assets, 0)) AS total_assets,
      (COALESCE(b.short_term_liabilities, 0) + COALESCE(b.long_term_liabilities, 0)) AS total_liabilities
    FROM mafinda_income_statements i
    LEFT JOIN mafinda_balance_sheets b ON b.period = i.period
    ORDER BY i.period DESC
    LIMIT ?
  `).all(months) as any[];

  // Return in ascending order for chart rendering
  return rows.reverse().map((r) => ({
    period: r.period,
    revenue: r.revenue,
    netProfit: r.net_profit,
    totalAssets: r.total_assets,
    totalLiabilities: r.total_liabilities,
  }));
}

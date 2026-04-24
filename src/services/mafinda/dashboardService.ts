// Dashboard Service — MAFINDA Dashboard Enhancement
// Drizzle ORM PostgreSQL implementation

import { eq, and, asc, desc, sql, inArray } from 'drizzle-orm';
import { db } from '../../db/connection';
import { departments, corporates } from '../../db/schema/public';
import {
  balanceSheets,
  incomeStatements,
  targetHeaders,
  targetDetails,
  weeklyCashFlows,
} from '../../db/schema/cfd';

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
  departments: DeptRevenueTargetItem[];
}

export interface RevenueCostSummary {
  period: string;
  corporateId?: string;
  corporateName?: string;
  departmentId?: string;
  departmentName?: string;
  revenue: number;
  revenueChange: number;
  operationalCost: number;
  operationalCostChange: number;
}

export interface CashFlowDataPoint {
  period: string;
  cashIn: number;
  cashOut: number;
  netCashFlow: number;
}

export interface CashFlowResult {
  data: CashFlowDataPoint[];
  corporateId?: string;
  departmentId?: string;
  entityType?: string;
  entityId?: string;
}

export interface AssetComposition {
  period: string;
  currentAssets: number;
  fixedAssets: number;
  // Backward-compatible alias used by existing dashboard widgets
  otherAssets: number;
  totalAssets: number;
}

export interface EquityLiabilityComposition {
  period: string;
  capital: number;
  earningsAfterTax: number;
  retainedEarnings: number;
  dividends: number;
  currentLiabilities: number;
  longTermLiabilities: number;
  // Backward-compatible aliases used by existing dashboard widgets
  paidInCapital: number;
  otherEquity: number;
  shortTermLiabilities: number;
  totalEquity: number;
  totalLiabilities: number;
  totalAssets: number;
  totalEquityAndLiabilities: number;
}

export interface HistoricalDataPoint {
  period: string;
  revenue: number;
  netProfit: number;
  totalAssets: number;
  totalLiabilities: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function calculateAchievementRate(target: number, realization: number): number {
  if (target === 0) return 0;
  return (realization / target) * 100;
}

export function calculateNetCashFlow(cashIn: number, cashOut: number): number {
  return cashIn - cashOut;
}

export function buildAssetComposition(
  period: string,
  currentAssets: number,
  fixedAssets: number,
): AssetComposition {
  return {
    period,
    currentAssets,
    fixedAssets,
    otherAssets: 0,
    totalAssets: currentAssets + fixedAssets,
  };
}

export function buildEquityLiabilityComposition(
  period: string,
  capital: number,
  earningsAfterTax: number,
  retainedEarnings: number,
  dividends: number,
  currentLiabilities: number,
  longTermLiabilities: number,
): EquityLiabilityComposition {
  const totalEquity = capital + earningsAfterTax + retainedEarnings - dividends;
  const totalLiabilities = currentLiabilities + longTermLiabilities;
  const totalAssets = totalEquity + totalLiabilities;
  return {
    period,
    capital,
    earningsAfterTax,
    retainedEarnings,
    dividends,
    currentLiabilities,
    longTermLiabilities,
    paidInCapital: capital,
    otherEquity: earningsAfterTax,
    shortTermLiabilities: currentLiabilities,
    totalEquity,
    totalLiabilities,
    totalAssets,
    totalEquityAndLiabilities: totalAssets,
  };
}

/** Returns the previous period string in "YYYY-MM" format. */
function previousPeriod(period: string): string {
  const [year, month] = period.split('-').map(Number);
  const date = new Date(year, month - 2);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

/** Calculates percentage change; returns 0 when previous is 0. */
function percentChange(current: number, previous: number): number {
  if (previous === 0) return 0;
  return ((current - previous) / previous) * 100;
}

/** Parse period "YYYY-MM" into { year, month }. */
function parsePeriod(period: string): { year: number; month: number } {
  const [year, month] = period.split('-').map(Number);
  return { year, month };
}

/** Parse numeric string to number, defaulting to 0. */
function n(value: string | null | undefined): number {
  return parseFloat(value ?? '0') || 0;
}

// ─── Service Functions ────────────────────────────────────────────────────────

/**
 * Returns target vs realization revenue per department for a given period.
 * Target comes from target_details (targetType = 'revenue').
 * Realization comes from income_statements (revenue).
 */
export async function getDeptRevenueTarget(
  period: string,
  corporateId?: string,
): Promise<DeptRevenueTargetResult> {
  const { year, month } = parsePeriod(period);

  const conditions = [eq(departments.isActive, true)];
  if (corporateId) conditions.push(eq(departments.corporateId, corporateId));

  const depts = await db.select({ 
    id: departments.id, 
    name: departments.name,
    corporateId: departments.corporateId
  })
    .from(departments)
    .where(and(...conditions))
    .orderBy(asc(departments.name));

  const items: DeptRevenueTargetItem[] = [];
  for (const dept of depts) {
    // Get revenue target from target_headers → target_details
    const [targetRow] = await db
      .select({ amount: targetDetails.amount })
      .from(targetDetails)
      .innerJoin(targetHeaders, eq(targetDetails.targetHeaderId, targetHeaders.id))
      .where(and(
        eq(targetHeaders.departmentId, dept.id),
        eq(targetHeaders.fiscalYear, year),
        // eq(targetHeaders.fiscalMonth, month),
        eq(targetDetails.targetType, 'revenue'),
      ))
      .limit(1);

    // Get realization from income_statements — Note: income_statements is corporate level
    const [realizationRow] = await db
      .select({ revenue: incomeStatements.revenue })
      .from(incomeStatements)
      .where(and(
        eq(incomeStatements.corporateId, dept.corporateId),
        eq(incomeStatements.period, period),
      ))
      .limit(1);

    const target = n(targetRow?.amount);
    const realization = n(realizationRow?.revenue);

    items.push({
      departmentId: dept.id,
      departmentName: dept.name,
      target,
      realization,
      achievementRate: calculateAchievementRate(target, realization),
    });
  }

  return { period, departments: items };
}

/**
 * Returns revenue and operational cost summary, optionally filtered by department.
 * Includes percentage change vs the previous period.
 */
export async function getRevenueCostSummary(
  period: string,
  corporateId?: string,
): Promise<RevenueCostSummary> {
  const prevPeriod = previousPeriod(period);

  if (corporateId) {
    const [corp] = await db.select({ id: corporates.id, name: corporates.name })
      .from(corporates)
      .where(eq(corporates.id, corporateId))
      .limit(1);

    const [current] = await db
      .select({ revenue: incomeStatements.revenue, opex: incomeStatements.operatingExpenses })
      .from(incomeStatements)
      .where(and(eq(incomeStatements.corporateId, corporateId), eq(incomeStatements.period, period)))
      .limit(1);

    const [previous] = await db
      .select({ revenue: incomeStatements.revenue, opex: incomeStatements.operatingExpenses })
      .from(incomeStatements)
      .where(and(eq(incomeStatements.corporateId, corporateId), eq(incomeStatements.period, prevPeriod)))
      .limit(1);

    const revenue = n(current?.revenue);
    const operationalCost = n(current?.opex);
    const prevRevenue = n(previous?.revenue);
    const prevCost = n(previous?.opex);

    return {
      period,
      corporateId,
      corporateName: corp?.name,
      revenue,
      revenueChange: percentChange(revenue, prevRevenue),
      operationalCost,
      operationalCostChange: percentChange(operationalCost, prevCost),
    };
  }

  // Aggregate all departments
  const currentAgg = await db
    .select({
      revenue: sql<string>`COALESCE(SUM(${incomeStatements.revenue}::numeric), 0)`,
      opex: sql<string>`COALESCE(SUM(${incomeStatements.operatingExpenses}::numeric), 0)`,
    })
    .from(incomeStatements)
    .where(eq(incomeStatements.period, period));

  const previousAgg = await db
    .select({
      revenue: sql<string>`COALESCE(SUM(${incomeStatements.revenue}::numeric), 0)`,
      opex: sql<string>`COALESCE(SUM(${incomeStatements.operatingExpenses}::numeric), 0)`,
    })
    .from(incomeStatements)
    .where(eq(incomeStatements.period, prevPeriod));

  const revenue = n(currentAgg[0]?.revenue);
  const operationalCost = n(currentAgg[0]?.opex);
  const prevRevenue = n(previousAgg[0]?.revenue);
  const prevCost = n(previousAgg[0]?.opex);

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
 * Aggregates weekly_cash_flows across weeks per period.
 * Optionally filtered by departmentId or entityType/entityId.
 */
export async function getCashFlowData(
  period: string,
  months = 6,
  corporateId?: string,
  entityType?: string,
  entityId?: string,
): Promise<CashFlowResult> {
  const [year, month] = period.split('-').map(Number);
  const periods: string[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(year, month - 1 - i);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    periods.push(`${y}-${m}`);
  }

  const conditions = [inArray(weeklyCashFlows.period, periods)];
  if (corporateId) conditions.push(eq(weeklyCashFlows.corporateId, corporateId));
  if (entityType) conditions.push(eq(weeklyCashFlows.entityType, entityType));
  if (entityId) conditions.push(eq(weeklyCashFlows.entityId, entityId));

  const rows = await db
    .select({
      period: weeklyCashFlows.period,
      cashIn: sql<string>`SUM(
        ${weeklyCashFlows.operatingCashIn}::numeric +
        ${weeklyCashFlows.investingCashIn}::numeric +
        ${weeklyCashFlows.financingCashIn}::numeric
      )`,
      cashOut: sql<string>`SUM(
        ${weeklyCashFlows.operatingCashOut}::numeric +
        ${weeklyCashFlows.investingCashOut}::numeric +
        ${weeklyCashFlows.financingCashOut}::numeric
      )`,
    })
    .from(weeklyCashFlows)
    .where(and(...conditions))
    .groupBy(weeklyCashFlows.period)
    .orderBy(asc(weeklyCashFlows.period));

  const rowMap = new Map<string, { cashIn: number; cashOut: number }>();
  for (const r of rows) {
    rowMap.set(r.period, { cashIn: n(r.cashIn), cashOut: n(r.cashOut) });
  }

  const data: CashFlowDataPoint[] = periods.map((p) => {
    const entry = rowMap.get(p) ?? { cashIn: 0, cashOut: 0 };
    return {
      period: p,
      cashIn: entry.cashIn,
      cashOut: entry.cashOut,
      netCashFlow: calculateNetCashFlow(entry.cashIn, entry.cashOut),
    };
  });

  return { data, corporateId, entityType, entityId };
}

/**
 * Returns asset composition for a given period (optionally filtered by department).
 * currentAssets = cash_and_bank + accounts_receivable + work_in_progress + inventory + prepaid_expenses
 * fixedAssets = land + building + equipment + other_fixed_assets
 */
export async function getAssetComposition(
  period: string,
  corporateId?: string,
): Promise<AssetComposition | null> {
  const conditions = [eq(balanceSheets.period, period)];
  if (corporateId) conditions.push(eq(balanceSheets.corporateId, corporateId));

  const [row] = await db
    .select({
      period: balanceSheets.period,
      currentAssets: sql<string>`SUM(
        ${balanceSheets.cashAndBank}::numeric + ${balanceSheets.accountsReceivable}::numeric +
        ${balanceSheets.workInProgress}::numeric + ${balanceSheets.inventory}::numeric +
        ${balanceSheets.prepaidExpenses}::numeric
      )`,
      fixedAssets: sql<string>`SUM(
        ${balanceSheets.land}::numeric + ${balanceSheets.building}::numeric +
        ${balanceSheets.equipment}::numeric + ${balanceSheets.otherFixedAssets}::numeric
      )`,
    })
    .from(balanceSheets)
    .where(and(...conditions))
    .groupBy(balanceSheets.period);

  if (!row) return null;

  return buildAssetComposition(row.period, n(row.currentAssets), n(row.fixedAssets));
}

/**
 * Returns equity & liability composition for a given period (optionally filtered by department).
 */
export async function getEquityLiabilityComposition(
  period: string,
  corporateId?: string,
): Promise<EquityLiabilityComposition | null> {
  const conditions = [eq(balanceSheets.period, period)];
  if (corporateId) conditions.push(eq(balanceSheets.corporateId, corporateId));

  const [row] = await db
    .select({
      period: balanceSheets.period,
      capital: sql<string>`SUM(${balanceSheets.capital}::numeric)`,
      earningsAfterTax: sql<string>`SUM(${balanceSheets.earningsAfterTax}::numeric)`,
      retainedEarnings: sql<string>`SUM(${balanceSheets.retainedEarnings}::numeric)`,
      dividends: sql<string>`SUM(${balanceSheets.dividends}::numeric)`,
      currentLiabilities: sql<string>`SUM(
        ${balanceSheets.accountsPayable}::numeric +
        ${balanceSheets.bankLoanCurrent}::numeric +
        ${balanceSheets.otherCurrentLiabilities}::numeric
      )`,
      longTermLiabilities: sql<string>`SUM(
        ${balanceSheets.bankLoanLongTerm}::numeric +
        ${balanceSheets.otherLongTermLiabilities}::numeric +
        ${balanceSheets.shareholderLoan}::numeric
      )`,
    })
    .from(balanceSheets)
    .where(and(...conditions))
    .groupBy(balanceSheets.period);

  if (!row) return null;

  return buildEquityLiabilityComposition(
    row.period,
    n(row.capital),
    n(row.earningsAfterTax),
    n(row.retainedEarnings),
    n(row.dividends),
    n(row.currentLiabilities),
    n(row.longTermLiabilities),
  );
}

/**
 * Returns historical financial data for the last N months.
 * Joins income statements and balance sheets by (departmentId, period).
 * net_profit = revenue - cogs - operating_expenses - interest_expense - tax_expense
 */
export async function getHistoricalData(
  months: number,
  corporateId?: string,
): Promise<HistoricalDataPoint[]> {
  const conditions = corporateId ? [eq(incomeStatements.corporateId, corporateId)] : [];

  const rows = await db
    .select({
      period: incomeStatements.period,
      revenue: sql<string>`SUM(${incomeStatements.revenue}::numeric)`,
      netProfit: sql<string>`SUM(
        ${incomeStatements.revenue}::numeric -
        ${incomeStatements.cogs}::numeric -
        ${incomeStatements.operatingExpenses}::numeric -
        ${incomeStatements.interestExpense}::numeric -
        ${incomeStatements.taxExpense}::numeric
      )`,
    })
    .from(incomeStatements)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .groupBy(incomeStatements.period)
    .orderBy(desc(incomeStatements.period))
    .limit(months);

  // Build asset/liability totals via balance sheets for each period
  const periodsInResult = rows.map((r) => r.period);
  const bsRows = periodsInResult.length > 0
    ? await db
        .select({
          period: balanceSheets.period,
          totalAssets: sql<string>`SUM(
            ${balanceSheets.cashAndBank}::numeric + ${balanceSheets.accountsReceivable}::numeric +
            ${balanceSheets.workInProgress}::numeric + ${balanceSheets.inventory}::numeric +
            ${balanceSheets.prepaidExpenses}::numeric + ${balanceSheets.land}::numeric +
            ${balanceSheets.building}::numeric + ${balanceSheets.equipment}::numeric +
            ${balanceSheets.otherFixedAssets}::numeric
          )`,
          totalLiabilities: sql<string>`SUM(
            ${balanceSheets.accountsPayable}::numeric + ${balanceSheets.bankLoanCurrent}::numeric +
            ${balanceSheets.otherCurrentLiabilities}::numeric + ${balanceSheets.bankLoanLongTerm}::numeric +
            ${balanceSheets.otherLongTermLiabilities}::numeric + ${balanceSheets.shareholderLoan}::numeric
          )`,
        })
        .from(balanceSheets)
        .where(
          corporateId
            ? and(inArray(balanceSheets.period, periodsInResult), eq(balanceSheets.corporateId, corporateId))
            : inArray(balanceSheets.period, periodsInResult),
        )
        .groupBy(balanceSheets.period)
    : [];

  const bsMap = new Map(bsRows.map((r) => [r.period, r]));

  // Return ascending for charts
  return rows.reverse().map((r) => {
    const bs = bsMap.get(r.period);
    return {
      period: r.period,
      revenue: n(r.revenue),
      netProfit: n(r.netProfit),
      totalAssets: n(bs?.totalAssets),
      totalLiabilities: n(bs?.totalLiabilities),
    };
  });
}

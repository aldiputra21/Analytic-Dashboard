// Dashboard Service — MAFINDA Dashboard Enhancement
// Drizzle ORM PostgreSQL implementation

import { format } from 'date-fns';
import { eq, and, asc, desc, sql, inArray } from 'drizzle-orm';
import { db } from '../../db/connection';
import { departments, corporates } from '../../db/schema/public';
import {
  balanceSheets,
  incomeStatements,
  targetHeaders,
  targetDetails,
  weeklyCashFlows,
  cashRealizations,
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
  week: string;
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

export interface DashboardAggregatedResult {
  revenueTarget: DeptRevenueTargetResult;
  revenueCostSummary: RevenueCostSummary;
  cashFlowData: CashFlowResult;
  assetComposition: AssetComposition | null;
  equityLiabilityComposition: EquityLiabilityComposition | null;
  historicalData: HistoricalDataPoint[];
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

/** Returns the previous period string. Handles YYYY-MM and YYYY-QX formats. */
function previousPeriod(period: string): string {
  if (period.includes('-Q')) {
    const [year, qStr] = period.split('-');
    const q = parseInt(qStr.substring(1), 10);
    if (q === 1) return `${parseInt(year, 10) - 1}-Q4`;
    return `${year}-Q${q - 1}`;
  }
  if (period.includes('-S')) {
    const [year, sStr] = period.split('-');
    const s = parseInt(sStr.substring(1), 10);
    if (s === 1) return `${parseInt(year, 10) - 1}-S2`;
    return `${year}-S${s - 1}`;
  }
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

/** Parse period "YYYY-MM" or "YYYY-QX" into { year, month, quarter }. */
function parsePeriod(period: string): { 
  year: number; 
  month: number | null; 
  quarter: number | null;
  semester: number | null;
} {
  const [yearStr, part] = period.split('-');
  const year = parseInt(yearStr, 10);
  if (part.startsWith('Q')) {
    return { year, month: null, quarter: parseInt(part.substring(1), 10), semester: null };
  }
  if (part.startsWith('S')) {
    return { year, month: null, quarter: null, semester: parseInt(part.substring(1), 10) };
  }
  return { year, month: parseInt(part, 10), quarter: null, semester: null };
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
  const { year, month, quarter } = parsePeriod(period);

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
  const targetMonths = quarter ? [(quarter - 1) * 3 + 1, (quarter - 1) * 3 + 2, (quarter - 1) * 3 + 3] : [month!];
  const realizationPeriods = quarter 
    ? [`${year}-${String((quarter - 1) * 3 + 1).padStart(2, '0')}`, `${year}-${String((quarter - 1) * 3 + 2).padStart(2, '0')}`, `${year}-${String((quarter - 1) * 3 + 3).padStart(2, '0')}`]
    : [period];

  for (const dept of depts) {
    // Get revenue target from target_headers → target_details (Sum for quarter if needed)
    const targetRows = await db
      .select({ amount: targetDetails.amount })
      .from(targetDetails)
      .innerJoin(targetHeaders, eq(targetDetails.targetHeaderId, targetHeaders.id))
      .where(and(
        eq(targetHeaders.departmentId, dept.id),
        eq(targetHeaders.fiscalYear, year),
        inArray(targetDetails.month, targetMonths),
        eq(targetDetails.targetType, 'revenue'),
      ));

    // Get realization from income_statements (Sum for quarter if needed)
    const realizationRows = await db
      .select({ revenue: incomeStatements.revenue })
      .from(incomeStatements)
      .where(and(
        eq(incomeStatements.corporateId, dept.corporateId),
        inArray(incomeStatements.period, realizationPeriods),
      ));

    const target = targetRows.reduce((sum, r) => sum + n(r.amount), 0);
    const realization = realizationRows.reduce((sum, r) => sum + n(r.revenue), 0);

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
  const { year, quarter } = parsePeriod(period);
  const { year: pYear, quarter: pQuarter } = parsePeriod(prevPeriod);

  const currentPeriods = quarter 
    ? [`${year}-${String((quarter - 1) * 3 + 1).padStart(2, '0')}`, `${year}-${String((quarter - 1) * 3 + 2).padStart(2, '0')}`, `${year}-${String((quarter - 1) * 3 + 3).padStart(2, '0')}`]
    : [period];
  
  const previousPeriods = pQuarter
    ? [`${pYear}-${String((pQuarter - 1) * 3 + 1).padStart(2, '0')}`, `${pYear}-${String((pQuarter - 1) * 3 + 2).padStart(2, '0')}`, `${pYear}-${String((pQuarter - 1) * 3 + 3).padStart(2, '0')}`]
    : [prevPeriod];

  let corporateName: string | undefined;
  if (corporateId) {
    const [corp] = await db.select({ name: corporates.name })
      .from(corporates)
      .where(eq(corporates.id, corporateId))
      .limit(1);
    corporateName = corp?.name;
  }

  const currentRows = await db
    .select({
      revenue: sql<string>`COALESCE(SUM(${incomeStatements.revenue}::numeric), 0)`,
      opex: sql<string>`COALESCE(SUM(${incomeStatements.operatingExpenses}::numeric), 0)`,
    })
    .from(incomeStatements)
    .where(and(
      inArray(incomeStatements.period, currentPeriods),
      corporateId ? eq(incomeStatements.corporateId, corporateId) : undefined
    ));

  const previousRows = await db
    .select({
      revenue: sql<string>`COALESCE(SUM(${incomeStatements.revenue}::numeric), 0)`,
      opex: sql<string>`COALESCE(SUM(${incomeStatements.operatingExpenses}::numeric), 0)`,
    })
    .from(incomeStatements)
    .where(and(
      inArray(incomeStatements.period, previousPeriods),
      corporateId ? eq(incomeStatements.corporateId, corporateId) : undefined
    ));

  const revenue = n(currentRows[0]?.revenue);
  const operationalCost = n(currentRows[0]?.opex);
  const prevRevenue = n(previousRows[0]?.revenue);
  const prevCost = n(previousRows[0]?.opex);

  return {
    period,
    corporateId,
    corporateName,
    revenue,
    revenueChange: percentChange(revenue, prevRevenue),
    operationalCost,
    operationalCostChange: percentChange(operationalCost, prevCost),
  };
}

/**
 * Returns cash flow data points for a range of months, aggregated by week.
 * Combines planned data (weekly_cash_flows) and actual realizations (cash_realizations).
 */
export async function getCashFlowData(
  period: string,
  months = 6,
  corporateId?: string,
  departmentId?: string,
  projectId?: string,
): Promise<CashFlowResult> {
  const { year, month, quarter, semester } = parsePeriod(period);
  const periods: string[] = [];
  
  if (quarter) {
    // If quarter is selected, show exactly the 3 months of that quarter
    const startMonth = (quarter - 1) * 3 + 1;
    for (let i = 0; i < 3; i++) {
      const m = String(startMonth + i).padStart(2, '0');
      periods.push(`${year}-${m}`);
    }
  } else if (semester) {
    // If semester is selected, show exactly the 6 months
    const startMonth = (semester - 1) * 6 + 1;
    for (let i = 0; i < 6; i++) {
      const m = String(startMonth + i).padStart(2, '0');
      periods.push(`${year}-${m}`);
    }
  } else {
    // Standard N months trailing
    for (let i = (months || 6) - 1; i >= 0; i--) {
      const d = new Date(year, (month || 1) - 1 - i);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      periods.push(`${y}-${m}`);
    }
  }

  // --- 1. Fetch Weekly Cash Flows ---
  const wcfConditions = [inArray(weeklyCashFlows.period, periods)];
  if (corporateId) wcfConditions.push(eq(weeklyCashFlows.corporateId, corporateId));
  if (departmentId || projectId) {
    // weekly_cash_flows only supports corporate and project entity types
    // If departmentId is provided, we use the corporate level data as a fallback 
    // unless the table schema is updated to support departments.
    // However, realizations DO support departments.
    const entityType = projectId ? 'project' : 'corporate';
    wcfConditions.push(eq(weeklyCashFlows.entityType, entityType));
    wcfConditions.push(eq(weeklyCashFlows.entityId, projectId || corporateId!));
  }

  const wcfRows = await db
    .select({
      period: weeklyCashFlows.period,
      week: weeklyCashFlows.week,
      cashIn: sql<string>`(
        ${weeklyCashFlows.operatingCashIn}::numeric +
        ${weeklyCashFlows.investingCashIn}::numeric +
        ${weeklyCashFlows.financingCashIn}::numeric
      )`,
      cashOut: sql<string>`(
        ${weeklyCashFlows.operatingCashOut}::numeric +
        ${weeklyCashFlows.investingCashOut}::numeric +
        ${weeklyCashFlows.financingCashOut}::numeric
      )`,
    })
    .from(weeklyCashFlows)
    .where(and(...wcfConditions));

  // --- 2. Fetch Cash Realizations ---
  const startDateStr = `${periods[0]}-01`;
  const endMonthForLastDay = quarter ? quarter * 3 : (semester ? semester * 6 : (month || 1));
  const endDateStr = format(new Date(year, endMonthForLastDay, 0), 'yyyy-MM-dd'); // Last day of last month in range

  const crConditions = [
    sql`${cashRealizations.transactionDate} >= ${startDateStr}`,
    sql`${cashRealizations.transactionDate} <= ${endDateStr}`,
  ];
  if (departmentId) crConditions.push(eq(cashRealizations.departmentId, departmentId));
  if (projectId) crConditions.push(eq(cashRealizations.projectId, projectId));

  const crRows = await db
    .select({
      transactionDate: cashRealizations.transactionDate,
      category: cashRealizations.category,
      amount: cashRealizations.amount,
    })
    .from(cashRealizations)
    .where(and(...crConditions));

  // --- 3. Aggregate Data by (Period, Week) ---
  const weeklyMap = new Map<string, { cashIn: number; cashOut: number }>();

  // Helper to generate map key
  const getWKey = (p: string, w: string) => `${p}|${w}`;

  // Process WCF rows
  for (const r of wcfRows) {
    const key = getWKey(r.period, r.week);
    const existing = weeklyMap.get(key) ?? { cashIn: 0, cashOut: 0 };
    weeklyMap.set(key, {
      cashIn: existing.cashIn + n(r.cashIn),
      cashOut: existing.cashOut + n(r.cashOut),
    });
  }

  // Process Realization rows
  for (const r of crRows) {
    const d = new Date(r.transactionDate);
    const p = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const day = d.getDate();
    let w = 'W1';
    if (day > 7) w = 'W2';
    if (day > 14) w = 'W3';
    if (day > 21) w = 'W4';
    if (day > 28) w = 'W5';

    const key = getWKey(p, w);
    const existing = weeklyMap.get(key) ?? { cashIn: 0, cashOut: 0 };
    
    if (r.category === 'cash-in') {
      existing.cashIn += n(r.amount);
    } else {
      existing.cashOut += n(r.amount);
    }
    weeklyMap.set(key, existing);
  }

  // --- 4. Build Final Result ---
  const weeks = ['W1', 'W2', 'W3', 'W4', 'W5'];
  const data: CashFlowDataPoint[] = [];

  for (const p of periods) {
    for (const w of weeks) {
      const entry = weeklyMap.get(getWKey(p, w));
      const cashIn = entry?.cashIn ?? 0;
      const cashOut = entry?.cashOut ?? 0;
      
      data.push({
        period: p,
        week: w,
        cashIn,
        cashOut,
        netCashFlow: calculateNetCashFlow(cashIn, cashOut),
      });
    }
  }

  return { data, corporateId, departmentId, entityId: projectId };
}

/**
 * Returns asset composition for a given period (optionally filtered by corporate).
 * Snapshot as of the last month of the period/quarter.
 */
export async function getAssetComposition(
  period: string,
  corporateId?: string,
): Promise<AssetComposition | null> {
  const { year, quarter, semester, month } = parsePeriod(period);
  let targetPeriod = period;
  if (quarter) {
    targetPeriod = `${year}-${String(quarter * 3).padStart(2, '0')}`;
  } else if (semester) {
    targetPeriod = `${year}-${String(semester * 6).padStart(2, '0')}`;
  }

  const conditions = [eq(balanceSheets.period, targetPeriod)];
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
 * Returns equity & liability composition for a given period (optionally filtered by corporate).
 * Snapshot as of the last month of the period/quarter.
 */
export async function getEquityLiabilityComposition(
  period: string,
  corporateId?: string,
): Promise<EquityLiabilityComposition | null> {
  const { year, quarter, semester, month } = parsePeriod(period);
  let targetPeriod = period;
  if (quarter) {
    targetPeriod = `${year}-${String(quarter * 3).padStart(2, '0')}`;
  } else if (semester) {
    targetPeriod = `${year}-${String(semester * 6).padStart(2, '0')}`;
  }

  const conditions = [eq(balanceSheets.period, targetPeriod)];
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

/**
 * Aggregates all dashboard data into a single object to reduce API requests.
 */
export async function getDashboardAggregated(params: {
  period: string;
  corporateId?: string;
  historicalMonths: number;
  revCostDeptId?: string;
  cashFlowDeptId?: string;
  cashFlowMonths?: number;
}): Promise<DashboardAggregatedResult> {
  const { period, corporateId, historicalMonths, revCostDeptId, cashFlowDeptId, cashFlowMonths } = params;

  const [
    revenueTarget,
    revenueCostSummary,
    cashFlowData,
    assetComposition,
    equityLiabilityComposition,
    historicalData
  ] = await Promise.all([
    getDeptRevenueTarget(period, corporateId),
    getRevenueCostSummary(period, corporateId),
    getCashFlowData(period, cashFlowMonths || 6, corporateId, cashFlowDeptId),
    getAssetComposition(period, corporateId),
    getEquityLiabilityComposition(period, corporateId),
    getHistoricalData(historicalMonths, corporateId)
  ]);

  return {
    revenueTarget,
    revenueCostSummary,
    cashFlowData,
    assetComposition,
    equityLiabilityComposition,
    historicalData
  };
}

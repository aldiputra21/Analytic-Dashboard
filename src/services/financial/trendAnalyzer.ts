// Trend Analysis Engine
// Requirements: 8.3, 8.4, 8.6

import Database from 'better-sqlite3';
import { RatioName } from '../../types/financial/ratio';
import { PeriodType } from '../../types/financial/financialData';

export interface TrendPeriod {
  periodStartDate: string;
  periodEndDate: string;
  value: number | null;
  movingAverage3m: number | null;
  movingAverage12m: number | null;
  isSignificantChange: boolean;
}

export interface RatioTrendResult {
  subsidiaryId: string;
  ratioName: RatioName;
  periods: TrendPeriod[];
}

export interface CAGRResult {
  subsidiaryId: string;
  metric: 'revenue' | 'netProfit';
  startDate: string;
  endDate: string;
  startValue: number;
  endValue: number;
  years: number;
  cagr: number | null; // percentage
}

/**
 * Calculates arithmetic mean of an array of numbers (ignoring nulls).
 */
function arithmeticMean(values: (number | null)[]): number | null {
  const valid = values.filter((v): v is number => v !== null);
  if (valid.length === 0) return null;
  return valid.reduce((sum, v) => sum + v, 0) / valid.length;
}

/**
 * Calculates 3-month and 12-month moving averages for a ratio series.
 * Requirements: 8.3
 */
export function calculateMovingAverages(
  values: (number | null)[]
): { ma3m: (number | null)[]; ma12m: (number | null)[] } {
  const ma3m: (number | null)[] = [];
  const ma12m: (number | null)[] = [];

  for (let i = 0; i < values.length; i++) {
    // 3-month MA: use up to 3 periods ending at i
    const window3 = values.slice(Math.max(0, i - 2), i + 1);
    ma3m.push(arithmeticMean(window3));

    // 12-month MA: use up to 12 periods ending at i
    const window12 = values.slice(Math.max(0, i - 11), i + 1);
    ma12m.push(arithmeticMean(window12));
  }

  return { ma3m, ma12m };
}

/**
 * Detects significant trend changes: >20% change over 3 consecutive periods.
 * Requirements: 8.4
 */
export function detectSignificantTrendChanges(values: (number | null)[]): boolean[] {
  const flags: boolean[] = new Array(values.length).fill(false);

  for (let i = 2; i < values.length; i++) {
    const first = values[i - 2];
    const last = values[i];
    if (first !== null && last !== null && first !== 0) {
      const pctChange = Math.abs((last - first) / Math.abs(first)) * 100;
      if (pctChange > 20) {
        flags[i] = true;
      }
    }
  }

  return flags;
}

/**
 * Calculates CAGR for revenue or net profit over multi-year periods.
 * CAGR = ((Ending Value / Beginning Value)^(1/Years) - 1) × 100
 * Requirements: 8.6
 */
export function calculateCAGR(
  startValue: number,
  endValue: number,
  years: number
): number | null {
  if (years <= 0 || startValue === 0) return null;
  // Handle negative start values gracefully
  if (startValue < 0 || endValue < 0) return null;
  return (Math.pow(endValue / startValue, 1 / years) - 1) * 100;
}

/**
 * Fetches historical ratio data for a subsidiary and computes trend metrics.
 * Requirements: 8.1, 8.2, 8.3, 8.4
 */
export function getSubsidiaryRatioTrends(
  db: Database.Database,
  subsidiaryId: string,
  ratioName: RatioName,
  periodType?: PeriodType,
  startDate?: string,
  endDate?: string
): RatioTrendResult {
  const columnMap: Record<RatioName, string> = {
    roa: 'cr.roa',
    roe: 'cr.roe',
    npm: 'cr.npm',
    der: 'cr.der',
    currentRatio: 'cr.current_ratio',
    quickRatio: 'cr.quick_ratio',
    cashRatio: 'cr.cash_ratio',
    ocfRatio: 'cr.ocf_ratio',
    dscr: 'cr.dscr',
  };

  const col = columnMap[ratioName];
  let sql = `
    SELECT fd.period_start_date, fd.period_end_date, ${col} as value
    FROM frs_calculated_ratios cr
    JOIN frs_financial_data fd ON cr.financial_data_id = fd.id
    WHERE cr.subsidiary_id = ?
  `;
  const params: any[] = [subsidiaryId];

  if (periodType) {
    sql += ' AND fd.period_type = ?';
    params.push(periodType);
  }
  if (startDate) {
    sql += ' AND fd.period_start_date >= ?';
    params.push(startDate);
  }
  if (endDate) {
    sql += ' AND fd.period_end_date <= ?';
    params.push(endDate);
  }

  sql += ' ORDER BY fd.period_start_date ASC';

  const rows = db.prepare(sql).all(...params) as Array<{
    period_start_date: string;
    period_end_date: string;
    value: number | null;
  }>;

  const values = rows.map((r) => r.value);
  const { ma3m, ma12m } = calculateMovingAverages(values);
  const significantFlags = detectSignificantTrendChanges(values);

  const periods: TrendPeriod[] = rows.map((row, i) => ({
    periodStartDate: row.period_start_date,
    periodEndDate: row.period_end_date,
    value: row.value,
    movingAverage3m: ma3m[i],
    movingAverage12m: ma12m[i],
    isSignificantChange: significantFlags[i],
  }));

  return { subsidiaryId, ratioName, periods };
}

/**
 * Calculates CAGR for revenue and net profit for a subsidiary.
 * Requirements: 8.6
 */
export function getSubsidiaryCAGR(
  db: Database.Database,
  subsidiaryId: string
): CAGRResult[] {
  const rows = db.prepare(`
    SELECT period_start_date, period_end_date, revenue, net_profit
    FROM frs_financial_data
    WHERE subsidiary_id = ?
    ORDER BY period_start_date ASC
  `).all(subsidiaryId) as Array<{
    period_start_date: string;
    period_end_date: string;
    revenue: number;
    net_profit: number;
  }>;

  if (rows.length < 2) return [];

  const first = rows[0];
  const last = rows[rows.length - 1];

  const startYear = new Date(first.period_start_date).getFullYear();
  const endYear = new Date(last.period_end_date).getFullYear();
  const years = endYear - startYear;

  if (years <= 0) return [];

  const results: CAGRResult[] = [];

  for (const metric of ['revenue', 'netProfit'] as const) {
    const dbField = metric === 'netProfit' ? 'net_profit' : 'revenue';
    const startValue = (first as any)[dbField];
    const endValue = (last as any)[dbField];

    results.push({
      subsidiaryId,
      metric,
      startDate: first.period_start_date,
      endDate: last.period_end_date,
      startValue,
      endValue,
      years,
      cagr: calculateCAGR(startValue, endValue, years),
    });
  }

  return results;
}

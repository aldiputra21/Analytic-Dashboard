// Trend Analysis Engine
// Drizzle ORM PostgreSQL implementation — uses cfd.v_financial_ratios + v_financial_summary views

import { sql } from 'drizzle-orm';
import { db } from '../../db/connection';
import { RatioName } from '../../types/financial/ratio';

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
  cagr: number | null;
}

function arithmeticMean(values: (number | null)[]): number | null {
  const valid = values.filter((v): v is number => v !== null);
  if (valid.length === 0) return null;
  return valid.reduce((sum, v) => sum + v, 0) / valid.length;
}

export function calculateMovingAverages(
  values: (number | null)[],
): { ma3m: (number | null)[]; ma12m: (number | null)[] } {
  const ma3m: (number | null)[] = [];
  const ma12m: (number | null)[] = [];

  for (let i = 0; i < values.length; i++) {
    ma3m.push(arithmeticMean(values.slice(Math.max(0, i - 2), i + 1)));
    ma12m.push(arithmeticMean(values.slice(Math.max(0, i - 11), i + 1)));
  }

  return { ma3m, ma12m };
}

export function detectSignificantTrendChanges(values: (number | null)[]): boolean[] {
  const flags: boolean[] = new Array(values.length).fill(false);

  for (let i = 2; i < values.length; i++) {
    const first = values[i - 2];
    const last = values[i];
    if (first !== null && last !== null && first !== 0) {
      const pctChange = Math.abs((last - first) / Math.abs(first)) * 100;
      if (pctChange > 20) flags[i] = true;
    }
  }

  return flags;
}

export function calculateCAGR(
  startValue: number,
  endValue: number,
  years: number,
): number | null {
  if (years <= 0 || startValue === 0) return null;
  if (startValue < 0 || endValue < 0) return null;
  return (Math.pow(endValue / startValue, 1 / years) - 1) * 100;
}

const VIEW_COL: Record<RatioName, string> = {
  roa: 'roa', roe: 'roe', npm: 'npm', der: 'der',
  currentRatio: 'current_ratio', quickRatio: 'quick_ratio',
  cashRatio: 'cash_ratio', ocfRatio: 'roa', dscr: 'roa', // ocf/dscr not in view
};

/**
 * Fetches historical ratio data for a corporate and computes trend metrics.
 */
export async function getSubsidiaryRatioTrends(
  corporateId: string,
  ratioName: RatioName,
  startDate?: string,
  endDate?: string,
): Promise<RatioTrendResult> {
  const col = VIEW_COL[ratioName];
  if (ratioName === 'ocfRatio' || ratioName === 'dscr') {
    return { subsidiaryId: corporateId, ratioName, periods: [] };
  }

  let query = `
    SELECT period, ${col} as value
    FROM cfd.v_financial_ratios
    WHERE corporate_id = '${corporateId}'
  `;
  if (startDate) query += ` AND period >= '${startDate.substring(0, 7)}'`;
  if (endDate) query += ` AND period <= '${endDate.substring(0, 7)}'`;
  query += ' ORDER BY period ASC';

  const rows = (await db.execute(sql.raw(query))).rows as { period: string; value: string | null }[];

  const values = rows.map((r) => (r.value != null ? parseFloat(r.value) : null));
  const { ma3m, ma12m } = calculateMovingAverages(values);
  const significantFlags = detectSignificantTrendChanges(values);

  const periods: TrendPeriod[] = rows.map((row, i) => ({
    periodStartDate: row.period + '-01',
    periodEndDate: row.period + '-01',
    value: values[i],
    movingAverage3m: ma3m[i],
    movingAverage12m: ma12m[i],
    isSignificantChange: significantFlags[i],
  }));

  return { subsidiaryId: corporateId, ratioName, periods };
}

/**
 * Calculates CAGR for revenue and net profit for a corporate.
 */
export async function getSubsidiaryCAGR(
  corporateId: string,
): Promise<CAGRResult[]> {
  const rows = (await db.execute(sql`
    SELECT period, revenue, net_profit
    FROM cfd.v_financial_summary
    WHERE corporate_id = ${corporateId}
    ORDER BY period ASC
  `)).rows as { period: string; revenue: string; net_profit: string }[];

  if (rows.length < 2) return [];

  const first = rows[0];
  const last = rows[rows.length - 1];

  const startYear = parseInt(first.period.substring(0, 4));
  const endYear = parseInt(last.period.substring(0, 4));
  const years = endYear - startYear;

  if (years <= 0) return [];

  const results: CAGRResult[] = [];

  for (const metric of ['revenue', 'netProfit'] as const) {
    const field = metric === 'netProfit' ? 'net_profit' : 'revenue';
    const startValue = parseFloat((first as Record<string, string>)[field]) || 0;
    const endValue = parseFloat((last as Record<string, string>)[field]) || 0;

    results.push({
      subsidiaryId: corporateId,
      metric,
      startDate: first.period + '-01',
      endDate: last.period + '-01',
      startValue,
      endValue,
      years,
      cagr: calculateCAGR(startValue, endValue, years),
    });
  }

  return results;
}

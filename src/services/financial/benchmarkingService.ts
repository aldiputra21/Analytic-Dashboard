// Benchmarking Service
// Requirements: 6.1, 6.4, 6.5, 6.6, 6.7

import Database from 'better-sqlite3';
import { RatioName } from '../../types/financial/ratio';
import { PeriodType } from '../../types/financial/financialData';

export interface SubsidiaryRankingEntry {
  subsidiaryId: string;
  subsidiaryName: string;
  value: number | null;
  rank: number;
  gapFromBest: number | null;   // % gap from best performer
  varianceFromAverage: number | null;
}

export interface BenchmarkResult {
  ratioName: RatioName;
  portfolioAverage: number | null;
  bestSubsidiaryId: string | null;
  subsidiaries: SubsidiaryRankingEntry[];
}

export interface IndustryBenchmarkEntry {
  subsidiaryId: string;
  subsidiaryName: string;
  industrySector: string;
  ratioName: RatioName;
  subsidiaryValue: number | null;
  industryBenchmark: number | null;
  variance: number | null; // subsidiaryValue - industryBenchmark
}

// Ratios where lower is better (leverage)
const LOWER_IS_BETTER: Set<RatioName> = new Set(['der']);

// Industry benchmark defaults per sector per ratio
// These represent typical industry standards
const INDUSTRY_BENCHMARKS: Record<string, Partial<Record<RatioName, number>>> = {
  manufacturing: {
    roa: 5.0,
    roe: 10.0,
    npm: 8.0,
    der: 1.5,
    currentRatio: 1.5,
    quickRatio: 1.0,
    cashRatio: 0.3,
    ocfRatio: 0.5,
    dscr: 1.25,
  },
  retail: {
    roa: 4.0,
    roe: 12.0,
    npm: 3.0,
    der: 2.0,
    currentRatio: 1.2,
    quickRatio: 0.5,
    cashRatio: 0.2,
    ocfRatio: 0.4,
    dscr: 1.1,
  },
  technology: {
    roa: 8.0,
    roe: 15.0,
    npm: 15.0,
    der: 0.5,
    currentRatio: 2.0,
    quickRatio: 1.8,
    cashRatio: 1.0,
    ocfRatio: 1.0,
    dscr: 2.0,
  },
  finance: {
    roa: 1.5,
    roe: 12.0,
    npm: 20.0,
    der: 5.0,
    currentRatio: 1.1,
    quickRatio: 1.0,
    cashRatio: 0.5,
    ocfRatio: 0.3,
    dscr: 1.2,
  },
  healthcare: {
    roa: 6.0,
    roe: 12.0,
    npm: 10.0,
    der: 1.0,
    currentRatio: 1.8,
    quickRatio: 1.4,
    cashRatio: 0.5,
    ocfRatio: 0.7,
    dscr: 1.5,
  },
  default: {
    roa: 5.0,
    roe: 10.0,
    npm: 8.0,
    der: 1.5,
    currentRatio: 1.5,
    quickRatio: 1.0,
    cashRatio: 0.3,
    ocfRatio: 0.5,
    dscr: 1.25,
  },
};

const ALL_RATIOS: RatioName[] = [
  'roa', 'roe', 'npm', 'der', 'currentRatio', 'quickRatio', 'cashRatio', 'ocfRatio', 'dscr',
];

/**
 * Fetches the latest ratio values for all active subsidiaries.
 */
function fetchLatestRatios(
  db: Database.Database,
  periodType?: PeriodType,
  startDate?: string,
  endDate?: string
): Array<{ subsidiaryId: string; subsidiaryName: string; roa: number | null; roe: number | null; npm: number | null; der: number | null; current_ratio: number | null; quick_ratio: number | null; cash_ratio: number | null; ocf_ratio: number | null; dscr: number | null }> {
  let sql = `
    SELECT
      cr.subsidiary_id,
      s.name as subsidiary_name,
      cr.roa, cr.roe, cr.npm, cr.der,
      cr.current_ratio, cr.quick_ratio, cr.cash_ratio, cr.ocf_ratio, cr.dscr
    FROM frs_calculated_ratios cr
    JOIN frs_financial_data fd ON cr.financial_data_id = fd.id
    JOIN subsidiaries s ON cr.subsidiary_id = s.id
    WHERE s.is_active = 1
  `;
  const params: any[] = [];

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

  // Get the most recent entry per subsidiary
  sql += `
    AND fd.period_start_date = (
      SELECT MAX(fd2.period_start_date)
      FROM frs_financial_data fd2
      JOIN frs_calculated_ratios cr2 ON cr2.financial_data_id = fd2.id
      WHERE fd2.subsidiary_id = cr.subsidiary_id
      ${periodType ? 'AND fd2.period_type = ?' : ''}
    )
    ORDER BY s.name ASC
  `;
  if (periodType) params.push(periodType);

  return db.prepare(sql).all(...params) as any[];
}

/**
 * Calculates performance rankings, portfolio averages, and gaps for all ratios.
 * Requirements: 6.1, 6.4, 6.5, 6.6
 */
export function calculateBenchmarks(
  db: Database.Database,
  periodType?: PeriodType,
  startDate?: string,
  endDate?: string
): BenchmarkResult[] {
  const rows = fetchLatestRatios(db, periodType, startDate, endDate);

  const columnMap: Record<RatioName, string> = {
    roa: 'roa',
    roe: 'roe',
    npm: 'npm',
    der: 'der',
    currentRatio: 'current_ratio',
    quickRatio: 'quick_ratio',
    cashRatio: 'cash_ratio',
    ocfRatio: 'ocf_ratio',
    dscr: 'dscr',
  };

  return ALL_RATIOS.map((ratioName) => {
    const col = columnMap[ratioName];
    const lowerIsBetter = LOWER_IS_BETTER.has(ratioName);

    // Extract values
    const entries = rows.map((row) => ({
      subsidiaryId: row.subsidiaryId ?? (row as any).subsidiary_id,
      subsidiaryName: row.subsidiaryName ?? (row as any).subsidiary_name,
      value: (row as any)[col] as number | null,
    }));

    const validEntries = entries.filter((e) => e.value !== null);

    // Portfolio average
    const portfolioAverage =
      validEntries.length > 0
        ? validEntries.reduce((sum, e) => sum + e.value!, 0) / validEntries.length
        : null;

    // Best value
    let bestValue: number | null = null;
    let bestSubsidiaryId: string | null = null;
    if (validEntries.length > 0) {
      const sorted = [...validEntries].sort((a, b) =>
        lowerIsBetter ? a.value! - b.value! : b.value! - a.value!
      );
      bestValue = sorted[0].value;
      bestSubsidiaryId = sorted[0].subsidiaryId;
    }

    // Assign ranks and calculate gaps
    const ranked = entries.map((entry) => {
      let rank = 0;
      let gapFromBest: number | null = null;
      let varianceFromAverage: number | null = null;

      if (entry.value !== null) {
        // Rank: count how many have a better value
        rank =
          validEntries.filter((e) =>
            lowerIsBetter ? e.value! < entry.value! : e.value! > entry.value!
          ).length + 1;

        // Gap from best: ((Best - Current) / |Best|) × 100
        if (bestValue !== null && bestValue !== 0) {
          gapFromBest = ((bestValue - entry.value) / Math.abs(bestValue)) * 100;
          if (lowerIsBetter) {
            // For lower-is-better, gap is how much worse (higher) you are
            gapFromBest = ((entry.value - bestValue) / Math.abs(bestValue)) * 100;
          }
        } else if (bestValue === 0) {
          gapFromBest = 0;
        }

        // Variance from average
        if (portfolioAverage !== null) {
          varianceFromAverage = entry.value - portfolioAverage;
        }
      }

      return {
        subsidiaryId: entry.subsidiaryId,
        subsidiaryName: entry.subsidiaryName,
        value: entry.value,
        rank,
        gapFromBest,
        varianceFromAverage,
      };
    });

    return {
      ratioName,
      portfolioAverage,
      bestSubsidiaryId,
      subsidiaries: ranked,
    };
  });
}

/**
 * Compares subsidiary ratios against industry benchmarks.
 * Requirements: 6.7
 */
export function getIndustryBenchmarkComparison(
  db: Database.Database,
  periodType?: PeriodType,
  startDate?: string,
  endDate?: string
): IndustryBenchmarkEntry[] {
  const rows = fetchLatestRatios(db, periodType, startDate, endDate);

  // Fetch industry sectors for each subsidiary
  const sectorRows = db.prepare(
    'SELECT id, industry_sector FROM subsidiaries WHERE is_active = 1'
  ).all() as Array<{ id: string; industry_sector: string }>;

  const sectorMap = new Map(sectorRows.map((r) => [r.id, r.industry_sector]));

  const columnMap: Record<RatioName, string> = {
    roa: 'roa',
    roe: 'roe',
    npm: 'npm',
    der: 'der',
    currentRatio: 'current_ratio',
    quickRatio: 'quick_ratio',
    cashRatio: 'cash_ratio',
    ocfRatio: 'ocf_ratio',
    dscr: 'dscr',
  };

  const results: IndustryBenchmarkEntry[] = [];

  for (const row of rows) {
    const subId = (row as any).subsidiary_id ?? row.subsidiaryId;
    const subName = (row as any).subsidiary_name ?? row.subsidiaryName;
    const sector = (sectorMap.get(subId) ?? 'default').toLowerCase();
    const benchmarks = INDUSTRY_BENCHMARKS[sector] ?? INDUSTRY_BENCHMARKS['default'];

    for (const ratioName of ALL_RATIOS) {
      const col = columnMap[ratioName];
      const subsidiaryValue = (row as any)[col] as number | null;
      const industryBenchmark = benchmarks[ratioName] ?? null;

      results.push({
        subsidiaryId: subId,
        subsidiaryName: subName,
        industrySector: sector,
        ratioName,
        subsidiaryValue,
        industryBenchmark,
        variance:
          subsidiaryValue !== null && industryBenchmark !== null
            ? subsidiaryValue - industryBenchmark
            : null,
      });
    }
  }

  return results;
}

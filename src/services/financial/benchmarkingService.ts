// Benchmarking Service
// Drizzle ORM PostgreSQL implementation — uses cfd.v_financial_ratios view

import { sql } from 'drizzle-orm';
import { db } from '../../db/connection';
import { RatioName } from '../../types/financial/ratio';

export interface SubsidiaryRankingEntry {
  subsidiaryId: string;
  subsidiaryName: string;
  value: number | null;
  rank: number;
  gapFromBest: number | null;
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
  variance: number | null;
}

const LOWER_IS_BETTER: Set<RatioName> = new Set(['der']);

const INDUSTRY_BENCHMARKS: Record<string, Partial<Record<RatioName, number>>> = {
  manufacturing: { roa: 5.0, roe: 10.0, npm: 8.0, der: 1.5, currentRatio: 1.5, quickRatio: 1.0, cashRatio: 0.3, ocfRatio: 0.5, dscr: 1.25 },
  retail: { roa: 4.0, roe: 12.0, npm: 3.0, der: 2.0, currentRatio: 1.2, quickRatio: 0.5, cashRatio: 0.2, ocfRatio: 0.4, dscr: 1.1 },
  technology: { roa: 8.0, roe: 15.0, npm: 15.0, der: 0.5, currentRatio: 2.0, quickRatio: 1.8, cashRatio: 1.0, ocfRatio: 1.0, dscr: 2.0 },
  finance: { roa: 1.5, roe: 12.0, npm: 20.0, der: 5.0, currentRatio: 1.1, quickRatio: 1.0, cashRatio: 0.5, ocfRatio: 0.3, dscr: 1.2 },
  healthcare: { roa: 6.0, roe: 12.0, npm: 10.0, der: 1.0, currentRatio: 1.8, quickRatio: 1.4, cashRatio: 0.5, ocfRatio: 0.7, dscr: 1.5 },
  default: { roa: 5.0, roe: 10.0, npm: 8.0, der: 1.5, currentRatio: 1.5, quickRatio: 1.0, cashRatio: 0.3, ocfRatio: 0.5, dscr: 1.25 },
};

const ALL_RATIOS: RatioName[] = ['roa', 'roe', 'npm', 'der', 'currentRatio', 'quickRatio', 'cashRatio', 'ocfRatio', 'dscr'];

interface RatioRow {
  corporate_id: string;
  corporate_name: string;
  roa: string | null;
  roe: string | null;
  npm: string | null;
  der: string | null;
  current_ratio: string | null;
  quick_ratio: string | null;
  cash_ratio: string | null;
  industry: string | null;
}

/**
 * Fetches the latest ratio values for all active corporates from the view.
 */
async function fetchLatestRatios(): Promise<RatioRow[]> {
  const result = await db.execute(sql`
    SELECT DISTINCT ON (vr.corporate_id)
      vr.corporate_id,
      c.name AS corporate_name,
      c.industry,
      vr.roa, vr.roe, vr.npm, vr.der,
      vr.current_ratio, vr.quick_ratio, vr.cash_ratio
    FROM cfd.v_financial_ratios vr
    JOIN public.corporates c ON c.id = vr.corporate_id
    WHERE c.is_active = true
    ORDER BY vr.corporate_id, vr.period DESC
  `);
  return result.rows as unknown as RatioRow[];
}

function n(v: string | null): number | null {
  return v != null ? parseFloat(v) : null;
}

const COL_MAP: Record<RatioName, keyof RatioRow> = {
  roa: 'roa', roe: 'roe', npm: 'npm', der: 'der',
  currentRatio: 'current_ratio', quickRatio: 'quick_ratio',
  cashRatio: 'cash_ratio', ocfRatio: 'roa', dscr: 'roa', // ocf/dscr not in view
};

/**
 * Calculates performance rankings, portfolio averages, and gaps for all ratios.
 */
export async function calculateBenchmarks(): Promise<BenchmarkResult[]> {
  const rows = await fetchLatestRatios();

  return ALL_RATIOS.map((ratioName) => {
    const col = COL_MAP[ratioName];
    const lowerIsBetter = LOWER_IS_BETTER.has(ratioName);

    const entries = rows.map((row) => ({
      subsidiaryId: row.corporate_id,
      subsidiaryName: row.corporate_name,
      value: (ratioName === 'ocfRatio' || ratioName === 'dscr') ? null : n(row[col] as string | null),
    }));

    const validEntries = entries.filter((e) => e.value !== null);
    const portfolioAverage = validEntries.length > 0
      ? validEntries.reduce((sum, e) => sum + e.value!, 0) / validEntries.length
      : null;

    let bestValue: number | null = null;
    let bestSubsidiaryId: string | null = null;
    if (validEntries.length > 0) {
      const sorted = [...validEntries].sort((a, b) =>
        lowerIsBetter ? a.value! - b.value! : b.value! - a.value!,
      );
      bestValue = sorted[0].value;
      bestSubsidiaryId = sorted[0].subsidiaryId;
    }

    const ranked = entries.map((entry) => {
      let rank = 0;
      let gapFromBest: number | null = null;
      let varianceFromAverage: number | null = null;

      if (entry.value !== null) {
        rank = validEntries.filter((e) =>
          lowerIsBetter ? e.value! < entry.value! : e.value! > entry.value!,
        ).length + 1;

        if (bestValue !== null && bestValue !== 0) {
          gapFromBest = lowerIsBetter
            ? ((entry.value - bestValue) / Math.abs(bestValue)) * 100
            : ((bestValue - entry.value) / Math.abs(bestValue)) * 100;
        } else if (bestValue === 0) {
          gapFromBest = 0;
        }

        if (portfolioAverage !== null) {
          varianceFromAverage = entry.value - portfolioAverage;
        }
      }

      return { subsidiaryId: entry.subsidiaryId, subsidiaryName: entry.subsidiaryName, value: entry.value, rank, gapFromBest, varianceFromAverage };
    });

    return { ratioName, portfolioAverage, bestSubsidiaryId, subsidiaries: ranked };
  });
}

/**
 * Compares subsidiary ratios against industry benchmarks.
 */
export async function getIndustryBenchmarkComparison(): Promise<IndustryBenchmarkEntry[]> {
  const rows = await fetchLatestRatios();
  const results: IndustryBenchmarkEntry[] = [];

  for (const row of rows) {
    const sector = (row.industry ?? 'default').toLowerCase();
    const benchmarks = INDUSTRY_BENCHMARKS[sector] ?? INDUSTRY_BENCHMARKS['default'];

    for (const ratioName of ALL_RATIOS) {
      const col = COL_MAP[ratioName];
      const subsidiaryValue = (ratioName === 'ocfRatio' || ratioName === 'dscr') ? null : n(row[col] as string | null);
      const industryBenchmark = benchmarks[ratioName] ?? null;

      results.push({
        subsidiaryId: row.corporate_id,
        subsidiaryName: row.corporate_name,
        industrySector: sector,
        ratioName,
        subsidiaryValue,
        industryBenchmark,
        variance: subsidiaryValue !== null && industryBenchmark !== null
          ? subsidiaryValue - industryBenchmark
          : null,
      });
    }
  }

  return results;
}

// Ratio Types
// Requirements: 3.1 - 3.10

export type RatioName =
  | 'roa'
  | 'roe'
  | 'npm'
  | 'der'
  | 'currentRatio'
  | 'quickRatio'
  | 'cashRatio'
  | 'ocfRatio'
  | 'dscr';

export interface CalculatedRatios {
  id: string;
  financialDataId: string;
  subsidiaryId: string;

  // Profitability
  roa: number | null; // %
  roe: number | null; // %
  npm: number | null; // %

  // Leverage
  der: number | null;

  // Liquidity
  currentRatio: number | null;
  quickRatio: number | null;
  cashRatio: number | null;

  // Cash Flow
  ocfRatio: number | null;
  dscr: number | null;

  healthScore: number; // 0-100
  calculatedAt: Date;
}

export interface RatioTrend {
  subsidiaryId: string;
  ratioName: RatioName;
  periods: Array<{
    periodStartDate: Date;
    periodEndDate: Date;
    value: number | null;
    movingAverage3m?: number | null;
    movingAverage12m?: number | null;
    isSignificantChange?: boolean;
  }>;
}

export interface BenchmarkData {
  ratioName: RatioName;
  subsidiaries: Array<{
    subsidiaryId: string;
    value: number | null;
    rank: number;
    gapFromBest: number | null;
    varianceFromAverage: number | null;
  }>;
  portfolioAverage: number | null;
  bestSubsidiaryId: string | null;
}

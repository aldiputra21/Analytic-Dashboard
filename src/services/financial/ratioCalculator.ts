// Ratio Calculation Engine
// Pure calculation functions — ratios are now computed by database views (v_financial_ratios).
// This module retained for in-memory calculations, health score, and backward compatibility.

import { FinancialData } from '../../types/financial/financialData';
import { CalculatedRatios, RatioName } from '../../types/financial/ratio';

/**
 * Safely divides two numbers. Returns null if denominator is zero.
 */
function safeDivide(numerator: number, denominator: number, ratioName: string): number | null {
  if (denominator === 0) {
    console.warn(`[RatioCalculator] Zero denominator for ${ratioName}. Returning null.`);
    return null;
  }
  return numerator / denominator;
}

// ============================================================
// Health Score Weights
// ============================================================

const HEALTH_WEIGHTS: Record<RatioName, number> = {
  roa:          0.15,
  roe:          0.15,
  npm:          0.15,
  der:          0.10,
  currentRatio: 0.15,
  quickRatio:   0.10,
  cashRatio:    0.05,
  ocfRatio:     0.10,
  dscr:         0.05,
};

export function scoreRatio(ratioName: RatioName, value: number | null): number {
  if (value === null) return 50;

  switch (ratioName) {
    case 'roa':
      if (value >= 5) return 100;
      if (value >= 2) return 70;
      if (value >= 0) return 40;
      return 10;
    case 'roe':
      if (value >= 10) return 100;
      if (value >= 5) return 70;
      if (value >= 0) return 40;
      return 10;
    case 'npm':
      if (value >= 10) return 100;
      if (value >= 5) return 70;
      if (value >= 0) return 40;
      return 10;
    case 'der':
      if (value <= 1.0) return 100;
      if (value <= 2.0) return 70;
      if (value <= 3.0) return 40;
      return 10;
    case 'currentRatio':
      if (value >= 2.0) return 100;
      if (value >= 1.0) return 70;
      if (value >= 0.5) return 40;
      return 10;
    case 'quickRatio':
      if (value >= 1.0) return 100;
      if (value >= 0.5) return 70;
      if (value >= 0.2) return 40;
      return 10;
    case 'cashRatio':
      if (value >= 0.5) return 100;
      if (value >= 0.2) return 70;
      if (value >= 0.1) return 40;
      return 10;
    case 'ocfRatio':
      if (value >= 1.0) return 100;
      if (value >= 0.5) return 70;
      if (value >= 0) return 40;
      return 10;
    case 'dscr':
      if (value >= 1.5) return 100;
      if (value >= 1.0) return 70;
      if (value >= 0.5) return 40;
      return 10;
    default:
      return 50;
  }
}

/**
 * Calculates the weighted health score (0-100) from all ratios.
 */
export function calculateHealthScore(ratios: Omit<CalculatedRatios, 'id' | 'financialDataId' | 'subsidiaryId' | 'healthScore' | 'calculatedAt'>): number {
  let totalWeight = 0;
  let weightedScore = 0;

  for (const [ratioName, weight] of Object.entries(HEALTH_WEIGHTS) as [RatioName, number][]) {
    const value = ratios[ratioName] as number | null;
    const score = scoreRatio(ratioName, value);
    weightedScore += score * weight;
    totalWeight += weight;
  }

  return totalWeight > 0 ? Math.round((weightedScore / totalWeight) * 100) / 100 : 0;
}

/**
 * Calculates all 9 financial ratios from financial data (in-memory).
 */
export function calculateRatios(data: FinancialData): Omit<CalculatedRatios, 'id' | 'financialDataId' | 'subsidiaryId' | 'calculatedAt'> {
  const roa = safeDivide(data.netProfit, data.totalAssets, 'roa');
  const roaPct = roa !== null ? roa * 100 : null;

  const roe = safeDivide(data.netProfit, data.totalEquity, 'roe');
  const roePct = roe !== null ? roe * 100 : null;

  const npm = safeDivide(data.netProfit, data.revenue, 'npm');
  const npmPct = npm !== null ? npm * 100 : null;

  const der = safeDivide(data.totalLiabilities, data.totalEquity, 'der');
  const currentRatio = safeDivide(data.currentAssets, data.currentLiabilities, 'currentRatio');
  const quickRatio = safeDivide(data.currentAssets - data.inventory, data.currentLiabilities, 'quickRatio');
  const cashRatio = safeDivide(data.cash, data.currentLiabilities, 'cashRatio');
  const ocfRatio = safeDivide(data.operatingCashFlow, data.currentLiabilities, 'ocfRatio');

  const debtService = data.interestExpense + data.shortTermDebt + data.currentPortionLongTermDebt;
  const dscr = safeDivide(data.operatingCashFlow, debtService, 'dscr');

  const ratios = { roa: roaPct, roe: roePct, npm: npmPct, der, currentRatio, quickRatio, cashRatio, ocfRatio, dscr };
  const healthScore = calculateHealthScore(ratios);

  return { ...ratios, healthScore };
}

/**
 * Maps a view row (v_financial_ratios) to CalculatedRatios.
 */
export function mapRowToRatios(row: Record<string, unknown>): CalculatedRatios {
  const n = (v: unknown) => (v != null ? parseFloat(String(v)) : null);
  return {
    id: String(row.id ?? ''),
    financialDataId: '',
    subsidiaryId: String(row.corporate_id ?? row.corporateId ?? ''),
    corporateName: String(row.corporate_name ?? row.corporateName ?? ''),
    roa: n(row.roa),
    roe: n(row.roe),
    npm: n(row.npm),
    der: n(row.der),
    currentRatio: n(row.current_ratio ?? row.currentRatio),
    quickRatio: n(row.quick_ratio ?? row.quickRatio),
    cashRatio: n(row.cash_ratio ?? row.cashRatio),
    ocfRatio: n(row.ocf_ratio ?? row.ocfRatio),
    dscr: n(row.dscr),
    healthScore: n(row.health_score ?? row.healthScore) ?? 0,
    calculatedAt: row.calculated_at instanceof Date ? row.calculated_at : new Date(),
  };
}

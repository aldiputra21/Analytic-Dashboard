// Ratio Calculation Engine
// Requirements: 2.3, 3.1 - 3.10

import Database from 'better-sqlite3';
import { FinancialData } from '../../types/financial/financialData';
import { CalculatedRatios, RatioName } from '../../types/financial/ratio';
import { Threshold } from '../../types/financial/threshold';

function generateId(): string {
  return `rat_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Safely divides two numbers. Returns null if denominator is zero.
 * Requirements: 3.10
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

// Scoring thresholds for each ratio (score 0-100 per ratio)
function scoreRatio(ratioName: RatioName, value: number | null): number {
  if (value === null) return 50; // neutral score for null

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
 * Requirements: 2.3
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
 * Calculates all 9 financial ratios from financial data.
 * Requirements: 3.1 - 3.10
 */
export function calculateRatios(data: FinancialData): Omit<CalculatedRatios, 'id' | 'financialDataId' | 'subsidiaryId' | 'calculatedAt'> {
  // ROA = (Net Profit / Total Assets) × 100 (Req 3.1)
  const roa = safeDivide(data.netProfit, data.totalAssets, 'roa');
  const roaPct = roa !== null ? roa * 100 : null;

  // ROE = (Net Profit / Total Equity) × 100 (Req 3.2)
  const roe = safeDivide(data.netProfit, data.totalEquity, 'roe');
  const roePct = roe !== null ? roe * 100 : null;

  // NPM = (Net Profit / Revenue) × 100 (Req 3.3)
  const npm = safeDivide(data.netProfit, data.revenue, 'npm');
  const npmPct = npm !== null ? npm * 100 : null;

  // DER = Total Liabilities / Total Equity (Req 3.4)
  const der = safeDivide(data.totalLiabilities, data.totalEquity, 'der');

  // Current Ratio = Current Assets / Current Liabilities (Req 3.5)
  const currentRatio = safeDivide(data.currentAssets, data.currentLiabilities, 'currentRatio');

  // Quick Ratio = (Current Assets - Inventory) / Current Liabilities (Req 3.6)
  const quickRatio = safeDivide(data.currentAssets - data.inventory, data.currentLiabilities, 'quickRatio');

  // Cash Ratio = Cash / Current Liabilities (Req 3.7)
  const cashRatio = safeDivide(data.cash, data.currentLiabilities, 'cashRatio');

  // OCF Ratio = Operating Cash Flow / Current Liabilities (Req 3.8)
  const ocfRatio = safeDivide(data.operatingCashFlow, data.currentLiabilities, 'ocfRatio');

  // DSCR = Operating Cash Flow / (Interest Expense + Short-term Debt + Current Portion LTD) (Req 3.9)
  const debtService = data.interestExpense + data.shortTermDebt + data.currentPortionLongTermDebt;
  const dscr = safeDivide(data.operatingCashFlow, debtService, 'dscr');

  const ratios = {
    roa: roaPct,
    roe: roePct,
    npm: npmPct,
    der,
    currentRatio,
    quickRatio,
    cashRatio,
    ocfRatio,
    dscr,
  };

  const healthScore = calculateHealthScore(ratios);

  return { ...ratios, healthScore };
}

/**
 * Calculates ratios and persists them to the database.
 * Requirements: 2.3
 */
export function calculateAndStoreRatios(
  db: Database.Database,
  data: FinancialData
): CalculatedRatios {
  const ratios = calculateRatios(data);
  const id = generateId();
  const now = new Date().toISOString();

  // Upsert: replace if already exists for this financial_data_id
  db.prepare(`
    INSERT INTO frs_calculated_ratios
      (id, financial_data_id, subsidiary_id, roa, roe, npm, der,
       current_ratio, quick_ratio, cash_ratio, ocf_ratio, dscr, health_score, calculated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(financial_data_id) DO UPDATE SET
      roa = excluded.roa, roe = excluded.roe, npm = excluded.npm, der = excluded.der,
      current_ratio = excluded.current_ratio, quick_ratio = excluded.quick_ratio,
      cash_ratio = excluded.cash_ratio, ocf_ratio = excluded.ocf_ratio,
      dscr = excluded.dscr, health_score = excluded.health_score,
      calculated_at = excluded.calculated_at
  `).run(
    id,
    data.id,
    data.subsidiaryId,
    ratios.roa,
    ratios.roe,
    ratios.npm,
    ratios.der,
    ratios.currentRatio,
    ratios.quickRatio,
    ratios.cashRatio,
    ratios.ocfRatio,
    ratios.dscr,
    ratios.healthScore,
    now,
  );

  const row = db.prepare('SELECT * FROM frs_calculated_ratios WHERE financial_data_id = ?').get(data.id) as any;
  return mapRowToRatios(row);
}

export function mapRowToRatios(row: any): CalculatedRatios {
  return {
    id: row.id,
    financialDataId: row.financial_data_id,
    subsidiaryId: row.subsidiary_id,
    roa: row.roa ?? null,
    roe: row.roe ?? null,
    npm: row.npm ?? null,
    der: row.der ?? null,
    currentRatio: row.current_ratio ?? null,
    quickRatio: row.quick_ratio ?? null,
    cashRatio: row.cash_ratio ?? null,
    ocfRatio: row.ocf_ratio ?? null,
    dscr: row.dscr ?? null,
    healthScore: row.health_score,
    calculatedAt: new Date(row.calculated_at),
  };
}

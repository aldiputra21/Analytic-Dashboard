// Report Generator Service
// Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.7

import Database from 'better-sqlite3';
import { calculateRatios } from './ratioCalculator';
import { FinancialData, PeriodType } from '../../types/financial/financialData';
import { CalculatedRatios } from '../../types/financial/ratio';

export interface SubsidiaryContribution {
  subsidiaryId: string;
  subsidiaryName: string;
  revenue: number;
  netProfit: number;
  totalAssets: number;
  totalEquity: number;
  totalLiabilities: number;
  revenueContribution: number;   // %
  profitContribution: number;    // %
}

export interface ConsolidatedFinancials {
  revenue: number;
  netProfit: number;
  operatingCashFlow: number;
  cash: number;
  currentAssets: number;
  totalAssets: number;
  currentLiabilities: number;
  totalLiabilities: number;
  totalEquity: number;
}

export interface ConsolidatedReport {
  periodType: PeriodType;
  periodStartDate: string;
  periodEndDate: string;
  generatedAt: string;
  consolidated: ConsolidatedFinancials;
  consolidatedRatios: Omit<CalculatedRatios, 'id' | 'financialDataId' | 'subsidiaryId' | 'calculatedAt'>;
  contributions: SubsidiaryContribution[];
  subsidiaryCount: number;
}

/**
 * Generates a consolidated financial report for all active subsidiaries.
 * Aggregates financial data and calculates consolidated ratios.
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.7
 */
export function generateConsolidatedReport(
  db: Database.Database,
  periodType: PeriodType,
  periodStartDate: string,
  periodEndDate: string
): ConsolidatedReport {
  // Fetch all active subsidiaries
  const subsidiaries = db.prepare(
    'SELECT id, name FROM subsidiaries WHERE is_active = 1'
  ).all() as Array<{ id: string; name: string }>;

  if (subsidiaries.length === 0) {
    return buildEmptyReport(periodType, periodStartDate, periodEndDate);
  }

  // Fetch financial data for each subsidiary in the given period
  const financialDataRows: Array<FinancialData & { subsidiary_name: string }> = [];

  for (const sub of subsidiaries) {
    const row = db.prepare(`
      SELECT fd.*, s.name as subsidiary_name
      FROM frs_financial_data fd
      JOIN subsidiaries s ON fd.subsidiary_id = s.id
      WHERE fd.subsidiary_id = ?
        AND fd.period_type = ?
        AND fd.period_start_date >= ?
        AND fd.period_end_date <= ?
      ORDER BY fd.period_start_date DESC
      LIMIT 1
    `).get(sub.id, periodType, periodStartDate, periodEndDate) as any;

    if (row) {
      financialDataRows.push(mapRowToFinancialData(row));
    }
  }

  if (financialDataRows.length === 0) {
    return buildEmptyReport(periodType, periodStartDate, periodEndDate);
  }

  // Aggregate consolidated totals (Req 7.1, 7.4)
  const consolidated: ConsolidatedFinancials = {
    revenue: 0,
    netProfit: 0,
    operatingCashFlow: 0,
    cash: 0,
    currentAssets: 0,
    totalAssets: 0,
    currentLiabilities: 0,
    totalLiabilities: 0,
    totalEquity: 0,
  };

  for (const data of financialDataRows) {
    consolidated.revenue += data.revenue;
    consolidated.netProfit += data.netProfit;
    consolidated.operatingCashFlow += data.operatingCashFlow;
    consolidated.cash += data.cash;
    consolidated.currentAssets += data.currentAssets;
    consolidated.totalAssets += data.totalAssets;
    consolidated.currentLiabilities += data.currentLiabilities;
    consolidated.totalLiabilities += data.totalLiabilities;
    consolidated.totalEquity += data.totalEquity;
  }

  // Calculate consolidated ratios using aggregated totals (Req 7.3)
  const consolidatedFinancialData: FinancialData = {
    id: 'consolidated',
    subsidiaryId: 'consolidated',
    periodType,
    periodStartDate: new Date(periodStartDate),
    periodEndDate: new Date(periodEndDate),
    ...consolidated,
    interestExpense: financialDataRows.reduce((s, d) => s + d.interestExpense, 0),
    inventory: financialDataRows.reduce((s, d) => s + d.inventory, 0),
    shortTermDebt: financialDataRows.reduce((s, d) => s + d.shortTermDebt, 0),
    currentPortionLongTermDebt: financialDataRows.reduce((s, d) => s + d.currentPortionLongTermDebt, 0),
    isRestated: false,
    version: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'system',
  };

  const consolidatedRatios = calculateRatios(consolidatedFinancialData);

  // Calculate contribution percentages (Req 7.5)
  const contributions: SubsidiaryContribution[] = financialDataRows.map((data) => {
    const subName = (data as any).subsidiary_name ?? '';
    return {
      subsidiaryId: data.subsidiaryId,
      subsidiaryName: subName,
      revenue: data.revenue,
      netProfit: data.netProfit,
      totalAssets: data.totalAssets,
      totalEquity: data.totalEquity,
      totalLiabilities: data.totalLiabilities,
      revenueContribution:
        consolidated.revenue !== 0
          ? (data.revenue / consolidated.revenue) * 100
          : 0,
      profitContribution:
        consolidated.netProfit !== 0
          ? (data.netProfit / consolidated.netProfit) * 100
          : 0,
    };
  });

  return {
    periodType,
    periodStartDate,
    periodEndDate,
    generatedAt: new Date().toISOString(),
    consolidated,
    consolidatedRatios,
    contributions,
    subsidiaryCount: financialDataRows.length,
  };
}

function buildEmptyReport(
  periodType: PeriodType,
  periodStartDate: string,
  periodEndDate: string
): ConsolidatedReport {
  const emptyConsolidated: ConsolidatedFinancials = {
    revenue: 0, netProfit: 0, operatingCashFlow: 0, cash: 0,
    currentAssets: 0, totalAssets: 0, currentLiabilities: 0,
    totalLiabilities: 0, totalEquity: 0,
  };
  return {
    periodType,
    periodStartDate,
    periodEndDate,
    generatedAt: new Date().toISOString(),
    consolidated: emptyConsolidated,
    consolidatedRatios: {
      roa: null, roe: null, npm: null, der: null,
      currentRatio: null, quickRatio: null, cashRatio: null,
      ocfRatio: null, dscr: null, healthScore: 0,
    },
    contributions: [],
    subsidiaryCount: 0,
  };
}

function mapRowToFinancialData(row: any): FinancialData & { subsidiary_name: string } {
  return {
    id: row.id,
    subsidiaryId: row.subsidiary_id,
    periodType: row.period_type,
    periodStartDate: new Date(row.period_start_date),
    periodEndDate: new Date(row.period_end_date),
    revenue: row.revenue,
    netProfit: row.net_profit,
    operatingCashFlow: row.operating_cash_flow,
    interestExpense: row.interest_expense ?? 0,
    cash: row.cash,
    inventory: row.inventory ?? 0,
    currentAssets: row.current_assets,
    totalAssets: row.total_assets,
    currentLiabilities: row.current_liabilities,
    shortTermDebt: row.short_term_debt ?? 0,
    currentPortionLongTermDebt: row.current_portion_long_term_debt ?? 0,
    totalLiabilities: row.total_liabilities,
    totalEquity: row.total_equity,
    isRestated: Boolean(row.is_restated),
    restatementReason: row.restatement_reason,
    version: row.version ?? 1,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    createdBy: row.created_by,
    subsidiary_name: row.subsidiary_name ?? '',
  };
}

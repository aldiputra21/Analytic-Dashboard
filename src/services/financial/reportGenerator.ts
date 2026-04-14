// Report Generator Service
// Drizzle ORM PostgreSQL implementation — uses cfd.v_financial_summary view

import { sql } from 'drizzle-orm';
import { db } from '../../db/connection';
import { calculateRatios } from './ratioCalculator';
import { FinancialData } from '../../types/financial/financialData';
import { CalculatedRatios } from '../../types/financial/ratio';

export interface SubsidiaryContribution {
  subsidiaryId: string;
  subsidiaryName: string;
  revenue: number;
  netProfit: number;
  totalAssets: number;
  totalEquity: number;
  totalLiabilities: number;
  revenueContribution: number;
  profitContribution: number;
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
  period: string;
  generatedAt: string;
  consolidated: ConsolidatedFinancials;
  consolidatedRatios: Omit<CalculatedRatios, 'id' | 'financialDataId' | 'subsidiaryId' | 'calculatedAt'>;
  contributions: SubsidiaryContribution[];
  subsidiaryCount: number;
}

/**
 * Generates a consolidated financial report for all active corporates.
 * Aggregates financial data from v_financial_summary and calculates consolidated ratios.
 */
export async function generateConsolidatedReport(
  period: string,
): Promise<ConsolidatedReport> {
  interface ReportRow {
    corporate_id: string;
    corporate_name: string;
    revenue: string;
    net_profit: string;
    interest_expense: string;
    cash: string;
    inventory: string;
    current_assets: string;
    total_assets: string;
    current_liabilities: string;
    short_term_bank_loans: string;
    total_liabilities: string;
    total_equity: string;
  }

  const rows = (await db.execute(sql`
    SELECT
      vs.corporate_id,
      c.name AS corporate_name,
      SUM(vs.revenue)::text AS revenue,
      SUM(vs.net_profit)::text AS net_profit,
      SUM(vs.interest_expense)::text AS interest_expense,
      SUM(vs.cash)::text AS cash,
      SUM(vs.inventory)::text AS inventory,
      SUM(vs.current_assets)::text AS current_assets,
      SUM(vs.total_assets)::text AS total_assets,
      SUM(vs.current_liabilities)::text AS current_liabilities,
      SUM(vs.short_term_bank_loans)::text AS short_term_bank_loans,
      SUM(vs.total_liabilities)::text AS total_liabilities,
      SUM(vs.total_equity)::text AS total_equity
    FROM cfd.v_financial_summary vs
    JOIN public.corporates c ON vs.corporate_id = c.id
    WHERE vs.period = ${period} AND c.is_active = true
    GROUP BY vs.corporate_id, c.name
  `)).rows as unknown as ReportRow[];

  if (rows.length === 0) {
    return buildEmptyReport(period);
  }

  const n = (v: string | null) => parseFloat(v ?? '0') || 0;

  const consolidated: ConsolidatedFinancials = {
    revenue: 0, netProfit: 0, operatingCashFlow: 0, cash: 0,
    currentAssets: 0, totalAssets: 0, currentLiabilities: 0,
    totalLiabilities: 0, totalEquity: 0,
  };

  for (const row of rows) {
    consolidated.revenue += n(row.revenue);
    consolidated.netProfit += n(row.net_profit);
    consolidated.cash += n(row.cash);
    consolidated.currentAssets += n(row.current_assets);
    consolidated.totalAssets += n(row.total_assets);
    consolidated.currentLiabilities += n(row.current_liabilities);
    consolidated.totalLiabilities += n(row.total_liabilities);
    consolidated.totalEquity += n(row.total_equity);
  }

  // Build a FinancialData-compatible object for ratio calculation
  const consolidatedFD: FinancialData = {
    id: 'consolidated',
    subsidiaryId: 'consolidated',
    periodType: 'monthly',
    periodStartDate: new Date(period + '-01'),
    periodEndDate: new Date(period + '-01'),
    ...consolidated,
    interestExpense: rows.reduce((s, r) => s + n(r.interest_expense), 0),
    inventory: rows.reduce((s, r) => s + n(r.inventory), 0),
    shortTermDebt: rows.reduce((s, r) => s + n(r.short_term_bank_loans), 0),
    currentPortionLongTermDebt: 0,
    isRestated: false,
    version: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'system',
  };

  const consolidatedRatios = calculateRatios(consolidatedFD);

  const contributions: SubsidiaryContribution[] = rows.map((row) => ({
    subsidiaryId: row.corporate_id,
    subsidiaryName: row.corporate_name,
    revenue: n(row.revenue),
    netProfit: n(row.net_profit),
    totalAssets: n(row.total_assets),
    totalEquity: n(row.total_equity),
    totalLiabilities: n(row.total_liabilities),
    revenueContribution:
      consolidated.revenue !== 0
        ? (n(row.revenue) / consolidated.revenue) * 100 : 0,
    profitContribution:
      consolidated.netProfit !== 0
        ? (n(row.net_profit) / consolidated.netProfit) * 100 : 0,
  }));

  return {
    period,
    generatedAt: new Date().toISOString(),
    consolidated,
    consolidatedRatios,
    contributions,
    subsidiaryCount: rows.length,
  };
}

function buildEmptyReport(period: string): ConsolidatedReport {
  return {
    period,
    generatedAt: new Date().toISOString(),
    consolidated: {
      revenue: 0, netProfit: 0, operatingCashFlow: 0, cash: 0,
      currentAssets: 0, totalAssets: 0, currentLiabilities: 0,
      totalLiabilities: 0, totalEquity: 0,
    },
    consolidatedRatios: {
      roa: null, roe: null, npm: null, der: null,
      currentRatio: null, quickRatio: null, cashRatio: null,
      ocfRatio: null, dscr: null, healthScore: 0,
    },
    contributions: [],
    subsidiaryCount: 0,
  };
}

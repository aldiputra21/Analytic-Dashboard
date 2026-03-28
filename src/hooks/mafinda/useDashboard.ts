// useDashboard.ts — Custom hook for MAFINDA dashboard API calls
// Requirements: 1.2, 2.3, 3.2, 3.3, 4.3, 5.3, 6.2

import { useState, useEffect, useCallback, useRef } from 'react';
import type {
  DeptRevenueTargetResult,
  RevenueCostSummary,
  CashFlowResult,
  AssetComposition,
  EquityLiabilityComposition,
  HistoricalDataPoint,
} from '../../services/mafinda/dashboardService.js';

export interface DashboardFilters {
  period: string;                                    // format: "YYYY-MM"
  periodType: 'monthly' | 'quarterly' | 'annual';
  departmentId?: string;
  projectId?: string;
  historicalMonths: 3 | 6 | 12 | 24;
}

export interface DashboardData {
  revenueTargetData: DeptRevenueTargetResult | null;
  revenueCostSummary: RevenueCostSummary | null;
  cashFlowData: CashFlowResult | null;
  assetComposition: AssetComposition | null;
  equityLiabilityComposition: EquityLiabilityComposition | null;
  historicalData: HistoricalDataPoint[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

async function apiFetch<T>(url: string): Promise<T> {
  const res = await fetch(url);
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error ?? 'Request failed');
  }
  return data as T;
}

function buildParams(params: Record<string, string | undefined>): string {
  const sp = new URLSearchParams();
  for (const [key, val] of Object.entries(params)) {
    if (val !== undefined && val !== '') sp.set(key, val);
  }
  const str = sp.toString();
  return str ? `?${str}` : '';
}

export function useDashboard(filters: DashboardFilters): DashboardData {
  const [revenueTargetData, setRevenueTargetData] = useState<DeptRevenueTargetResult | null>(null);
  const [revenueCostSummary, setRevenueCostSummary] = useState<RevenueCostSummary | null>(null);
  const [cashFlowData, setCashFlowData] = useState<CashFlowResult | null>(null);
  const [assetComposition, setAssetComposition] = useState<AssetComposition | null>(null);
  const [equityLiabilityComposition, setEquityLiabilityComposition] =
    useState<EquityLiabilityComposition | null>(null);
  const [historicalData, setHistoricalData] = useState<HistoricalDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Use a ref to track the latest filters for the refetch callback
  const filtersRef = useRef(filters);
  filtersRef.current = filters;

  const fetchAll = useCallback(async (f: DashboardFilters) => {
    if (!f.period) return;

    setIsLoading(true);
    setError(null);

    try {
      const [revTarget, revCost, cashFlow, assets, equity, historical] = await Promise.allSettled([
        apiFetch<DeptRevenueTargetResult>(
          `/api/dashboard/dept-revenue-target${buildParams({ period: f.period, periodType: f.periodType })}`
        ),
        apiFetch<RevenueCostSummary>(
          `/api/dashboard/revenue-cost-summary${buildParams({ period: f.period, departmentId: f.departmentId })}`
        ),
        apiFetch<CashFlowResult>(
          `/api/dashboard/cash-flow${buildParams({
            period: f.period,
            months: String(f.historicalMonths),
            departmentId: f.departmentId,
            projectId: f.projectId,
          })}`
        ),
        apiFetch<AssetComposition>(
          `/api/dashboard/asset-composition${buildParams({ period: f.period })}`
        ),
        apiFetch<EquityLiabilityComposition>(
          `/api/dashboard/equity-liability-composition${buildParams({ period: f.period })}`
        ),
        apiFetch<HistoricalDataPoint[]>(
          `/api/dashboard/historical-data${buildParams({ months: String(f.historicalMonths) })}`
        ),
      ]);

      if (revTarget.status === 'fulfilled') setRevenueTargetData(revTarget.value);
      if (revCost.status === 'fulfilled') setRevenueCostSummary(revCost.value);
      if (cashFlow.status === 'fulfilled') setCashFlowData(cashFlow.value);
      if (assets.status === 'fulfilled') setAssetComposition(assets.value);
      if (equity.status === 'fulfilled') setEquityLiabilityComposition(equity.value);
      if (historical.status === 'fulfilled') setHistoricalData(historical.value);

      // Surface first error if any endpoint failed
      const firstError = [revTarget, revCost, cashFlow, assets, equity, historical].find(
        (r) => r.status === 'rejected'
      ) as PromiseRejectedResult | undefined;
      if (firstError) setError(firstError.reason?.message ?? 'Gagal memuat sebagian data');
    } catch (err: any) {
      setError(err.message ?? 'Terjadi kesalahan');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Auto-refetch when filters change
  useEffect(() => {
    fetchAll(filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    filters.period,
    filters.periodType,
    filters.departmentId,
    filters.projectId,
    filters.historicalMonths,
    fetchAll,
  ]);

  const refetch = useCallback(() => {
    fetchAll(filtersRef.current);
  }, [fetchAll]);

  return {
    revenueTargetData,
    revenueCostSummary,
    cashFlowData,
    assetComposition,
    equityLiabilityComposition,
    historicalData,
    isLoading,
    error,
    refetch,
  };
}

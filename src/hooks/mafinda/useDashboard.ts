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
  corporateId?: string;
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
  const token = localStorage.getItem('frs_token');
  if (!token) {
    throw new Error('Not authenticated');
  }
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
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

  // Use a ref to track abort controller for cancelling stale requests
  const abortControllerRef = useRef<AbortController | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const fetchAll = useCallback(async (f: DashboardFilters) => {
    // Require period
    if (!f.period) return;
    
    // Check auth before fetching
    const token = localStorage.getItem('frs_token');
    if (!token) {
      setError('Not authenticated');
      return;
    }

    // Cancel previous request if still pending
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setIsLoading(true);
    setError(null);

    try {
      // CorporateId is handled by backend from JWT context
      const signal = abortControllerRef.current.signal;
      const [revTarget, revCost, cashFlow, assets, equity, historical] = await Promise.allSettled([
        apiFetch<DeptRevenueTargetResult>(
          `/api/dashboard/dept-revenue-target${buildParams({ period: f.period, corporateId: f.corporateId })}`
        ),
        apiFetch<RevenueCostSummary>(
          `/api/dashboard/revenue-cost-summary${buildParams({ period: f.period, corporateId: f.corporateId, departmentId: f.departmentId })}`
        ),
        apiFetch<CashFlowResult>(
          `/api/dashboard/cash-flow${buildParams({
            period: f.period,
            months: String(f.historicalMonths),
            corporateId: f.corporateId,
            departmentId: f.departmentId,
            projectId: f.projectId,
          })}`
        ),
        apiFetch<AssetComposition>(
          `/api/dashboard/asset-composition${buildParams({ period: f.period, corporateId: f.corporateId })}`
        ),
        apiFetch<EquityLiabilityComposition>(
          `/api/dashboard/equity-liability-composition${buildParams({ period: f.period, corporateId: f.corporateId })}`
        ),
        apiFetch<HistoricalDataPoint[]>(
          `/api/dashboard/historical-data${buildParams({ months: String(f.historicalMonths), corporateId: f.corporateId })}`
        ),
      ]);

      // Check if request was aborted
      if (signal.aborted) return;

      if (revTarget.status === 'fulfilled') {
        const val = revTarget.value;
        if (val && val.departments && !Array.isArray(val.departments)) {
          val.departments = (val.departments as any).records || [];
        }
        setRevenueTargetData(val);
      }
      if (revCost.status === 'fulfilled') setRevenueCostSummary(revCost.value);
      if (cashFlow.status === 'fulfilled') setCashFlowData(cashFlow.value);
      if (assets.status === 'fulfilled') setAssetComposition(assets.value);
      if (equity.status === 'fulfilled') setEquityLiabilityComposition(equity.value);
      if (historical.status === 'fulfilled') {
        const val = historical.value;
        setHistoricalData(Array.isArray(val) ? val : ((val as any).records || []));
      }

      // Surface first error if any endpoint failed
      const firstError = [revTarget, revCost, cashFlow, assets, equity, historical].find(
        (r) => r.status === 'rejected'
      ) as PromiseRejectedResult | undefined;
      if (firstError) setError(firstError.reason?.message ?? 'Gagal memuat sebagian data');
    } catch (err: any) {
      // Ignore abort errors
      if (err.name !== 'AbortError') {
        setError(err.message ?? 'Terjadi kesalahan');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);  // No external dependencies - uses refs for current state

  // Auto-refetch when filter properties change with debounce to prevent cascade
  useEffect(() => {
    // Debounce for 300ms to avoid multiple rapid calls
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    
    debounceTimerRef.current = setTimeout(() => {
      fetchAll(filtersRef.current);
    }, 300);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    filters.period,
    filters.periodType,
    filters.corporateId,
    filters.departmentId,
    filters.projectId,
    filters.historicalMonths,
  ]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

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

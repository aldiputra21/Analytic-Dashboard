import { useQuery } from '@tanstack/react-query';
import type {
  DeptRevenueTargetResult,
  RevenueCostSummary,
  CashFlowResult,
  AssetComposition,
  EquityLiabilityComposition,
  HistoricalDataPoint,
  DashboardAggregatedResult,
} from '../../services/mafinda/dashboardService.js';
import { DASHBOARD_QUERY_KEYS } from '../../constants/queryKeys';

export interface DashboardAggregatedFilters {
  period: string;
  historicalMonths: number;
  corporateId?: string;
  revCostDeptId?: string;
  cashFlowDeptId?: string;
  cashFlowProjectId?: string;
  cashFlowMonths?: number;
}

export interface DashboardFilters {
  period: string;
  periodType: 'monthly' | 'quarterly' | 'semiannual' | 'annual';
  corporateId?: string;
  departmentId?: string;
  projectId?: string;
  historicalMonths: 3 | 6 | 12 | 24 | 60;
}

export interface DashboardData {
  revenueTargetData: DeptRevenueTargetResult | null;
  revenueCostSummary: RevenueCostSummary | null;
  cashFlowData: CashFlowResult | null;
  assetComposition: AssetComposition | null;
  equityLiabilityComposition: EquityLiabilityComposition | null;
  historicalData: HistoricalDataPoint[];
  cashFlowBridge: any[] | null;
  projectionRealization: any[] | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

async function apiFetch<T>(url: string, signal?: AbortSignal): Promise<T> {
  const token = localStorage.getItem('frs_token');
  if (!token) throw new Error('Not authenticated');
  
  const res = await fetch(url, { 
    headers: { Authorization: `Bearer ${token}` },
    signal
  });
  
  const data = await res.json();
  if (!res.ok) {
    const errorMsg = typeof data.error === 'object' ? data.error.message : (data.error ?? 'Request failed');
    throw new Error(errorMsg);
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

/**
 * Hook for legacy separate dashboard requests.
 */
export function useDashboard(filters: DashboardFilters): DashboardData {
  const { period, periodType, corporateId, departmentId, projectId, historicalMonths } = filters;
  
  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['mafinda', 'dashboard', 'legacy', filters],
    queryFn: async ({ signal }) => {
      const [revTarget, revCost, cashFlow, assets, equity, historical] = await Promise.all([
        apiFetch<DeptRevenueTargetResult>(
          `/api/mafinda/dashboard/dept-revenue-target${buildParams({ period, corporateId })}`,
          signal
        ),
        apiFetch<RevenueCostSummary>(
          `/api/mafinda/dashboard/revenue-cost-summary${buildParams({ period, corporateId, departmentId })}`,
          signal
        ),
        apiFetch<CashFlowResult>(
          `/api/mafinda/dashboard/cash-flow${buildParams({
            period,
            months: String(historicalMonths),
            corporateId,
            departmentId,
            projectId,
          })}`,
          signal
        ),
        apiFetch<AssetComposition>(
          `/api/mafinda/dashboard/asset-composition${buildParams({ period, corporateId })}`,
          signal
        ),
        apiFetch<EquityLiabilityComposition>(
          `/api/mafinda/dashboard/equity-liability-composition${buildParams({ period, corporateId })}`,
          signal
        ),
        apiFetch<HistoricalDataPoint[]>(
          `/api/mafinda/dashboard/historical-data${buildParams({ months: String(historicalMonths), corporateId })}`,
          signal
        ),
      ]);

      return {
        revenueTargetData: revTarget,
        revenueCostSummary: revCost,
        cashFlowData: cashFlow,
        assetComposition: assets,
        equityLiabilityComposition: equity,
        historicalData: Array.isArray(historical) ? historical : ((historical as any).records || []),
      };
    },
    enabled: !!period,
  });

  return {
    revenueTargetData: data?.revenueTargetData ?? null,
    revenueCostSummary: data?.revenueCostSummary ?? null,
    cashFlowData: data?.cashFlowData ?? null,
    assetComposition: data?.assetComposition ?? null,
    equityLiabilityComposition: data?.equityLiabilityComposition ?? null,
    historicalData: data?.historicalData ?? [],
    cashFlowBridge: null, // Legacy doesn't support bridge
    projectionRealization: null, // Legacy doesn't support comparison
    isLoading,
    error: error ? (error as Error).message : null,
    refetch,
  };
}

/**
 * Main dashboard hook using aggregated endpoint and React Query caching.
 */
export function useDashboardAggregated(filters: DashboardAggregatedFilters): DashboardData {
  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: DASHBOARD_QUERY_KEYS.mafindaDashboard(filters),
    queryFn: async ({ signal }) => {
      const params = buildParams({
        period: filters.period,
        corporateId: filters.corporateId,
        historicalMonths: String(filters.historicalMonths),
        cashFlowMonths: String(filters.cashFlowMonths || 6),
        revCostDeptId: filters.revCostDeptId,
        cashFlowDeptId: filters.cashFlowDeptId,
        cashFlowProjectId: filters.cashFlowProjectId,
      });

      return await apiFetch<DashboardAggregatedResult>(`/api/mafinda/dashboard/aggregated${params}`, signal);
    },
    enabled: !!filters.period,
  });

  return {
    revenueTargetData: data?.revenueTarget ?? null,
    revenueCostSummary: data?.revenueCostSummary ?? null,
    cashFlowData: data?.cashFlowData ?? null,
    assetComposition: data?.assetComposition ?? null,
    equityLiabilityComposition: data?.equityLiabilityComposition ?? null,
    historicalData: data?.historicalData ?? [],
    cashFlowBridge: data?.cashFlowBridge ?? null,
    projectionRealization: data?.projectionRealization ?? null,
    isLoading,
    error: error ? (error as Error).message : null,
    refetch,
  };
}

import { useQuery } from '@tanstack/react-query';
import { CalculatedRatios } from '../../types/financial/ratio';
import { PeriodType } from '../../types/financial/financialData';
import { apiFetch } from '../../services/financial/apiFetch';
import { DASHBOARD_QUERY_KEYS } from '../../constants/queryKeys';

const API_BASE = '/api/frs';

export interface RatioWithPeriod extends CalculatedRatios {
  period: string;
  corporateId: string;
  periodType: PeriodType;
  periodStartDate: string;
  periodEndDate: string;
  dataUpdatedAt: string;
}

interface UseRatiosOptions {
  subsidiaryId?: string;
  periodType?: PeriodType;
  startDate?: string;
  endDate?: string;
  limit?: number;
  enabled?: boolean;
}

interface UseRatiosResult {
  ratios: RatioWithPeriod[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useRatios(options: UseRatiosOptions = {}): UseRatiosResult {
  const { subsidiaryId, periodType, startDate, endDate, limit, enabled = true } = options;

  const filters = { subsidiaryId, periodType, startDate, endDate, limit };

  const {
    data: ratios = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: DASHBOARD_QUERY_KEYS.ratios(filters),
    queryFn: async ({ signal }) => {
      const params = new URLSearchParams();
      if (subsidiaryId) params.set('subsidiaryId', subsidiaryId);
      if (periodType) params.set('periodType', periodType);
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);
      if (limit) params.set('limit', String(limit));

      const res = await apiFetch(`${API_BASE}/ratios?${params}`, { signal });
      if (!res.ok) throw new Error('Failed to fetch ratios');
      return await res.json();
    },
    enabled,
  });

  return {
    ratios: ratios as RatioWithPeriod[],
    isLoading,
    error: error ? (error as Error).message : null,
    refetch,
  };
}

/**
 * Fetches the latest ratio for each active subsidiary.
 * Supports optional period filtering.
 */
export function useLatestRatios(options: { period?: string } = {}): UseRatiosResult {
  const { period } = options;

  const {
    data: ratios = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: DASHBOARD_QUERY_KEYS.latestRatios(period || 'current'),
    queryFn: async () => {
      const url = period 
        ? `${API_BASE}/ratios/latest?period=${period}`
        : `${API_BASE}/ratios/latest`;
        
      const res = await apiFetch(url);
      if (!res.ok) throw new Error('Failed to fetch latest ratios');
      return await res.json();
    },
  });

  return {
    ratios: ratios as RatioWithPeriod[],
    isLoading,
    error: error ? (error as Error).message : null,
    refetch,
  };
}

/** Invalidates the client-side ratio cache — Handled by queryClient elsewhere */
export function invalidateRatiosClientCache(): void {
  // Logic handled by manual invalidation strategy via queryClient.invalidateQueries
}

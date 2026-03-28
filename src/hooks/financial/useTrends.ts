// useTrends.ts - Hook for fetching trend analysis data
// Requirements: 8.1, 8.2

import { useState, useEffect, useCallback, useRef } from 'react';
import { RatioName } from '../../types/financial/ratio';
import { PeriodType } from '../../types/financial/financialData';
import { RatioTrendResult, CAGRResult } from '../../services/financial/trendAnalyzer';
import { apiFetch } from '../../services/financial/apiFetch';

const API_BASE = '/api/frs';

export type TrendPeriodFilter = '3m' | '6m' | '1y' | '3y' | '5y';

export interface TrendEntry {
  subsidiaryId: string;
  ratioName?: RatioName;
  periods?: RatioTrendResult['periods'];
  type?: 'cagr';
  data?: CAGRResult[];
}

interface UseTrendsOptions {
  subsidiaryId?: string;
  ratioName?: RatioName;
  periodType?: PeriodType;
  period?: TrendPeriodFilter;
  enabled?: boolean;
}

interface UseTrendsResult {
  trends: TrendEntry[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useTrends(options: UseTrendsOptions = {}): UseTrendsResult {
  const { subsidiaryId, ratioName, periodType, period, enabled = true } = options;
  const [trends, setTrends] = useState<TrendEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const fetchTrends = useCallback(async () => {
    if (!enabled) return;

    abortRef.current?.abort();
    abortRef.current = new AbortController();

    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (subsidiaryId) params.set('subsidiaryId', subsidiaryId);
      if (ratioName) params.set('ratioName', ratioName);
      if (periodType) params.set('periodType', periodType);
      if (period) params.set('period', period);

      const res = await apiFetch(`${API_BASE}/ratios/trends?${params}`, {
        signal: abortRef.current.signal,
      });

      if (!res.ok) throw new Error('Failed to fetch trends');
      const data: TrendEntry[] = await res.json();
      setTrends(data);
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setError(err.message ?? 'Unknown error');
      }
    } finally {
      setIsLoading(false);
    }
  }, [subsidiaryId, ratioName, periodType, period, enabled]);

  useEffect(() => {
    fetchTrends();
    return () => abortRef.current?.abort();
  }, [fetchTrends]);

  return { trends, isLoading, error, refetch: fetchTrends };
}

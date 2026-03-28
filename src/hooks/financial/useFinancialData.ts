// useFinancialData.ts - Hook for financial data queries
// Requirements: 12.2

import { useState, useEffect, useCallback, useRef } from 'react';
import { FinancialData, PeriodType } from '../../types/financial/financialData';

const API_BASE = '/api/frs';

interface UseFinancialDataOptions {
  subsidiaryId?: string;
  periodType?: PeriodType;
  startDate?: string;
  endDate?: string;
  limit?: number;
  enabled?: boolean;
}

interface UseFinancialDataResult {
  data: FinancialData[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useFinancialData(options: UseFinancialDataOptions = {}): UseFinancialDataResult {
  const { subsidiaryId, periodType, startDate, endDate, limit, enabled = true } = options;
  const [data, setData] = useState<FinancialData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const fetchData = useCallback(async () => {
    if (!enabled) return;

    abortRef.current?.abort();
    abortRef.current = new AbortController();

    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (subsidiaryId) params.set('subsidiaryId', subsidiaryId);
      if (periodType) params.set('periodType', periodType);
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);
      if (limit) params.set('limit', String(limit));

      const token = localStorage.getItem('frs_token');
      const res = await fetch(`${API_BASE}/financial-data?${params}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        signal: abortRef.current.signal,
      });

      if (!res.ok) throw new Error('Failed to fetch financial data');
      const json: FinancialData[] = await res.json();
      setData(json);
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setError(err.message ?? 'Unknown error');
      }
    } finally {
      setIsLoading(false);
    }
  }, [enabled, subsidiaryId, periodType, startDate, endDate, limit]);

  useEffect(() => {
    fetchData();
    return () => abortRef.current?.abort();
  }, [fetchData]);

  return { data, isLoading, error, refetch: fetchData };
}

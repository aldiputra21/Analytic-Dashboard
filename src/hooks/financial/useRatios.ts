// useRatios.ts - Hook for fetching calculated ratios
// Requirements: 12.2, 12.4

import { useState, useEffect, useCallback, useRef } from 'react';
import { CalculatedRatios } from '../../types/financial/ratio';
import { PeriodType } from '../../types/financial/financialData';
import { apiFetch } from '../../services/financial/apiFetch';

const API_BASE = '/api/frs';
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes client-side cache

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

// Module-level cache shared across hook instances
const ratioCache = new Map<string, CacheEntry<any>>();

function getCached<T>(key: string): T | null {
  const entry = ratioCache.get(key);
  if (!entry || Date.now() > entry.expiresAt) {
    ratioCache.delete(key);
    return null;
  }
  return entry.data as T;
}

function setCached<T>(key: string, data: T): void {
  ratioCache.set(key, { data, expiresAt: Date.now() + CACHE_TTL_MS });
}

export interface RatioWithPeriod extends CalculatedRatios {
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
  const [ratios, setRatios] = useState<RatioWithPeriod[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const cacheKey = `ratios:${subsidiaryId ?? 'all'}:${periodType ?? 'all'}:${startDate ?? ''}:${endDate ?? ''}:${limit ?? ''}`;

  const fetchRatios = useCallback(async () => {
    if (!enabled) return;

    // Check client-side cache first
    const cached = getCached<RatioWithPeriod[]>(cacheKey);
    if (cached) {
      setRatios(cached);
      return;
    }

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

      const res = await apiFetch(`${API_BASE}/ratios?${params}`, {
        signal: abortRef.current.signal,
      });

      if (!res.ok) throw new Error('Failed to fetch ratios');
      const data: RatioWithPeriod[] = await res.json();
      setCached(cacheKey, data);
      setRatios(data);
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setError(err.message ?? 'Unknown error');
      }
    } finally {
      setIsLoading(false);
    }
  }, [cacheKey, enabled, subsidiaryId, periodType, startDate, endDate, limit]);

  useEffect(() => {
    fetchRatios();
    return () => abortRef.current?.abort();
  }, [fetchRatios]);

  return { ratios, isLoading, error, refetch: fetchRatios };
}

/**
 * Fetches the latest ratio for each active subsidiary.
 */
export function useLatestRatios(): UseRatiosResult {
  const [ratios, setRatios] = useState<RatioWithPeriod[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLatest = useCallback(async () => {
    const cacheKey = 'ratios:latest';
    const cached = getCached<RatioWithPeriod[]>(cacheKey);
    if (cached) {
      setRatios(cached);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const res = await apiFetch(`${API_BASE}/ratios/latest`);
      if (!res.ok) throw new Error('Failed to fetch latest ratios');
      const data: RatioWithPeriod[] = await res.json();
      setCached(cacheKey, data);
      setRatios(data);
    } catch (err: any) {
      setError(err.message ?? 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchLatest(); }, [fetchLatest]);

  return { ratios, isLoading, error, refetch: fetchLatest };
}

/** Invalidates the client-side ratio cache */
export function invalidateRatiosClientCache(): void {
  ratioCache.clear();
}

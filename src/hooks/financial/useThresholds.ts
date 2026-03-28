// useThresholds.ts - Hook for threshold management
// Requirements: 5.10, 15.1, 15.5, 15.6

import { useState, useEffect, useCallback } from 'react';
import { Threshold, CreateThresholdInput } from '../../types/financial/threshold';
import { PeriodType } from '../../types/financial/financialData';

const API_BASE = '/api/frs';

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('frs_token');
  return token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
}

interface UseThresholdsOptions {
  subsidiaryId?: string;
  periodType?: PeriodType;
  enabled?: boolean;
}

interface UseThresholdsResult {
  thresholds: Threshold[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
  updateThresholds: (updates: Omit<CreateThresholdInput, 'subsidiaryId'>[]) => Promise<void>;
  resetToDefaults: () => Promise<void>;
}

export function useThresholds(options: UseThresholdsOptions = {}): UseThresholdsResult {
  const { subsidiaryId, periodType, enabled = true } = options;
  const [thresholds, setThresholds] = useState<Threshold[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchThresholds = useCallback(async () => {
    if (!enabled || !subsidiaryId) return;
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (periodType) params.set('periodType', periodType);

      const res = await fetch(`${API_BASE}/thresholds/${subsidiaryId}?${params}`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error('Failed to fetch thresholds');
      const data: Threshold[] = await res.json();
      setThresholds(data);
    } catch (err: any) {
      setError(err.message ?? 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [enabled, subsidiaryId, periodType]);

  useEffect(() => { fetchThresholds(); }, [fetchThresholds]);

  const updateThresholds = useCallback(async (updates: Omit<CreateThresholdInput, 'subsidiaryId'>[]) => {
    if (!subsidiaryId) return;
    const res = await fetch(`${API_BASE}/thresholds/${subsidiaryId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ thresholds: updates }),
    });
    if (!res.ok) {
      const body = await res.json();
      throw new Error(body.error?.message ?? 'Failed to update thresholds');
    }
    const data: Threshold[] = await res.json();
    setThresholds(data);
  }, [subsidiaryId]);

  const resetToDefaults = useCallback(async () => {
    if (!subsidiaryId) return;
    const res = await fetch(`${API_BASE}/thresholds/${subsidiaryId}/reset`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const body = await res.json();
      throw new Error(body.error?.message ?? 'Failed to reset thresholds');
    }
    const body = await res.json();
    setThresholds(body.thresholds ?? []);
  }, [subsidiaryId]);

  return { thresholds, isLoading, error, refetch: fetchThresholds, updateThresholds, resetToDefaults };
}

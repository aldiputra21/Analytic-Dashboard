import { useState, useEffect, useCallback } from 'react';
import { Threshold, CreateThresholdInput } from '../../types/financial/threshold';
import { PeriodType } from '../../types/financial/financialData';
import { apiFetch } from '../../services/financial/apiFetch';

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

      const res = await apiFetch(`/api/frs/thresholds/${subsidiaryId}?${params}`);
      if (!res.ok) {
        const errData = await res.json();
        throw errData;
      }
      const data: Threshold[] = await res.json();
      setThresholds(data);
    } catch (err: any) {
      const errCode = err.error?.code || err.code || 'NETWORK_ERROR';
      setError(errCode);
    } finally {
      setIsLoading(false);
    }
  }, [enabled, subsidiaryId, periodType]);

  useEffect(() => { fetchThresholds(); }, [fetchThresholds]);

  const updateThresholds = useCallback(async (updates: Omit<CreateThresholdInput, 'subsidiaryId'>[]) => {
    if (!subsidiaryId) return;
    try {
      const res = await apiFetch(`/api/frs/thresholds/${subsidiaryId}`, {
        method: 'PUT',
        body: JSON.stringify({ thresholds: updates }),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw errData;
      }
      const data: Threshold[] = await res.json();
      setThresholds(data);
    } catch (err: any) {
      // Re-throw to be handled by component
      throw err;
    }
  }, [subsidiaryId]);

  const resetToDefaults = useCallback(async () => {
    if (!subsidiaryId) return;
    try {
      const res = await apiFetch(`/api/frs/thresholds/${subsidiaryId}/reset`, {
        method: 'POST',
      });
      if (!res.ok) {
        const errData = await res.json();
        throw errData;
      }
      const body = await res.json();
      setThresholds(body.thresholds ?? []);
    } catch (err: any) {
      // Re-throw to be handled by component
      throw err;
    }
  }, [subsidiaryId]);

  return { thresholds, isLoading, error, refetch: fetchThresholds, updateThresholds, resetToDefaults };
}

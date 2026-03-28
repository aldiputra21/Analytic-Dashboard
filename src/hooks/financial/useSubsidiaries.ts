// useSubsidiaries.ts - Hook for subsidiary data
// Requirements: 4.1

import { useState, useEffect, useCallback } from 'react';
import { Subsidiary } from '../../types/financial/subsidiary';
import { apiFetch } from '../../services/financial/apiFetch';

const API_BASE = '/api/frs';

interface UseSubsidiariesResult {
  subsidiaries: Subsidiary[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useSubsidiaries(activeOnly = false): UseSubsidiariesResult {
  const [subsidiaries, setSubsidiaries] = useState<Subsidiary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSubsidiaries = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = activeOnly ? '?active=true' : '';
      const res = await apiFetch(`${API_BASE}/subsidiaries${params}`);
      if (!res.ok) throw new Error('Failed to fetch subsidiaries');
      const data: Subsidiary[] = await res.json();
      setSubsidiaries(data);
    } catch (err: any) {
      setError(err.message ?? 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [activeOnly]);

  useEffect(() => { fetchSubsidiaries(); }, [fetchSubsidiaries]);

  return { subsidiaries, isLoading, error, refetch: fetchSubsidiaries };
}

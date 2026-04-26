// useCorporates.ts - Hook for corporate data
import { useState, useEffect, useCallback } from 'react';
import { Corporate } from '../../types/financial/corporate';
import { apiFetch } from '../../services/financial/apiFetch';

const API_BASE = '/api/frs';

interface UseCorporatesResult {
  corporates: Corporate[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/** Returns all active corporates for dropdowns. Always uses the dedicated /dropdown-items endpoint. */
export function useCorporates(): UseCorporatesResult {
  const [corporates, setCorporates] = useState<Corporate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCorporates = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiFetch(`${API_BASE}/corporates/dropdown-items`);
      if (!res.ok) throw new Error('Failed to fetch corporates');
      const data = await res.json();
      // Ensure we handle both array and {records, totalCount} formats
      const records = Array.isArray(data) ? data : (data.records || []);
      setCorporates(records);
    } catch (err: any) {
      setError(err.message ?? 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchCorporates(); }, [fetchCorporates]);

  return { corporates, isLoading, error, refetch: fetchCorporates };
}

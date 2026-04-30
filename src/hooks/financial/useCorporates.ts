import { useState, useEffect, useCallback, useMemo } from 'react';
import { apiFetch } from '../../services/financial/apiFetch';
import { Corporate } from '../../types/financial/corporate';
import { useAuth } from './useAuth';

export function useCorporates() {
  const { user, scope, hasFullCorporateAccess, subsidiaryIds } = useAuth();
  const [corporates, setCorporates] = useState<Corporate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Show selector ONLY if system scope
  const showSelector = scope === 'system';
  const defaultCorporateId = user?.corporateId || (subsidiaryIds?.[0]);

  const fetchCorporates = useCallback(async () => {
    // Only fetch if we need to show the selector OR if we are system scope
    if (!showSelector) return;

    setIsLoading(true);
    setError(null);
    try {
      const res = await apiFetch('/api/frs/corporates/dropdown-items');
      if (!res.ok) throw new Error('Failed to fetch corporates');
      const data = await res.json();
      setCorporates(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('[useCorporates] Error:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [showSelector, scope]);

  useEffect(() => {
    fetchCorporates();
  }, [fetchCorporates]);

  const options = useMemo(() => corporates.map(c => ({
    value: c.id,
    label: c.name,
    sublabel: c.code
  })), [corporates]);

  return {
    corporates,
    isLoading,
    error,
    refetch: fetchCorporates,
    options,
    showSelector,
    defaultCorporateId
  };
}

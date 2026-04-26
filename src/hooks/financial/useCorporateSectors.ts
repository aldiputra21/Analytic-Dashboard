import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../../services/financial/apiFetch';
import { useAuth } from './useAuth';

export interface CorporateSectorDropdownItem {
  id: string;
  code: string;
  labelId: string;
  labelEn: string;
}

export function useCorporateSectors() {
  const { language } = useAuth();
  const [sectors, setSectors] = useState<CorporateSectorDropdownItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSectors = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiFetch('/api/corporate-sectors/dropdown-items');
      if (!res.ok) throw new Error('Failed to fetch corporate sectors');
      const data = await res.json();
      setSectors(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('[useCorporateSectors] Error:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSectors();
  }, [fetchSectors]);

  return {
    sectors,
    isLoading,
    error,
    refetch: fetchSectors,
    // Formatted for SearchableSelect
    options: sectors.map(s => ({
      value: s.code,
      label: language === 'id' ? s.labelId : s.labelEn,
      sublabel: s.code
    }))
  };
}

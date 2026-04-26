import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../../services/financial/apiFetch';

export interface BankDropdownItem {
  id: string;
  code: string;
  name: string;
}

export function useBanks() {
  const [banks, setBanks] = useState<BankDropdownItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBanks = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiFetch('/api/banks/dropdown-items');
      if (!res.ok) throw new Error('Failed to fetch banks');
      const data = await res.json();
      setBanks(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('[useBanks] Error:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBanks();
  }, [fetchBanks]);

  return {
    banks,
    isLoading,
    error,
    refetch: fetchBanks,
    // Formatted for SearchableSelect
    options: banks.map(b => ({
      value: b.id,
      label: b.name,
      sublabel: b.code
    }))
  };
}

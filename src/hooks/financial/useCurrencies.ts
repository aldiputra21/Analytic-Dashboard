import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../../services/financial/apiFetch';

export interface CurrencyDropdownItem {
  id: string;
  code: string;
  label: string;
}

export function useCurrencies() {
  const [currencies, setCurrencies] = useState<CurrencyDropdownItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCurrencies = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiFetch('/api/currencies/dropdown-items');
      if (!res.ok) throw new Error('Failed to fetch currencies');
      const data = await res.json();
      setCurrencies(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('[useCurrencies] Error:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCurrencies();
  }, [fetchCurrencies]);

  return {
    currencies,
    isLoading,
    error,
    refetch: fetchCurrencies,
    // Formatted for SearchableSelect
    options: currencies.map(c => ({
      value: c.code,
      label: c.label,
      sublabel: c.code
    }))
  };
}

import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../../services/financial/apiFetch';
import { useAuth } from './useAuth';

export interface CostCenterCategoryDropdownItem {
  id: string;
  code: string;
  labelId: string;
  labelEn: string;
}

export function useCostCenterCategories() {
  const { language } = useAuth();
  const [categories, setCategories] = useState<CostCenterCategoryDropdownItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiFetch('/api/cost-center-categories/dropdown-items');
      if (!res.ok) throw new Error('Failed to fetch cost center categories');
      const data = await res.json();
      setCategories(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('[useCostCenterCategories] Error:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  return {
    categories,
    isLoading,
    error,
    refetch: fetchCategories,
    // Formatted for SearchableSelect
    options: categories.map(c => ({
      value: c.code, // Usually code is used as ID for cost center selection
      label: language === 'id' ? c.labelId : c.labelEn,
      sublabel: c.code
    }))
  };
}

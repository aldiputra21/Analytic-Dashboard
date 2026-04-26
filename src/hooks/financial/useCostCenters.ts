import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../../services/financial/apiFetch';

export interface CostCenterDropdownItem {
  id: string;
  code: string;
  name: string;
  parentId: string | null;
}

export function useCostCenters(parentId?: string | null) {
  const [costCenters, setCostCenters] = useState<CostCenterDropdownItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCostCenters = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const url = parentId 
        ? `/api/cost-centers/dropdown-items?parentId=${parentId}`
        : '/api/cost-centers/dropdown-items';
        
      const res = await apiFetch(url);
      if (!res.ok) throw new Error('Failed to fetch cost centers');
      const data = await res.json();
      setCostCenters(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('[useCostCenters] Error:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [parentId]);

  useEffect(() => {
    fetchCostCenters();
  }, [fetchCostCenters]);

  return {
    costCenters,
    isLoading,
    error,
    refetch: fetchCostCenters,
    // Formatted for SearchableSelect
    options: costCenters.map(cc => ({
      value: cc.id,
      label: cc.name,
      sublabel: cc.code
    }))
  };
}

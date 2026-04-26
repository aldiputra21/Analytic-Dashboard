import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../../services/financial/apiFetch';
import { useAuth } from './useAuth';

export interface DepartmentDropdownItem {
  id: string;
  name: string;
  code?: string;
  corporateId: string;
  corporateName?: string;
}

export function useDepartments() {
  const { language } = useAuth();
  const [departments, setDepartments] = useState<DepartmentDropdownItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDepartments = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiFetch('/api/departments/dropdown-items');
      if (!res.ok) throw new Error('Failed to fetch departments');
      const data = await res.json();
      setDepartments(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('[useDepartments] Error:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  return {
    departments,
    isLoading,
    error,
    refetch: fetchDepartments,
    // Formatted for SearchableSelect
    options: departments.map(d => ({
      value: d.id,
      label: d.name,
      sublabel: d.code ? `${d.code}${d.corporateName ? ` • ${d.corporateName}` : ''}` : d.corporateName
    }))
  };
}

import { useState, useEffect, useCallback, useMemo } from 'react';
import { apiFetch } from '../../services/financial/apiFetch';
import { Department } from '../mafinda/useManagement';
import { useAuth } from './useAuth';

export function useDepartments() {
  const { user, scope } = useAuth();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Show selector if scope is system or corporate. Hide if scope is department.
  const showSelector = scope === 'system' || scope === 'corporate';
  const defaultDepartmentId = user?.departmentId; // Fallback to user's assigned department if restricted

  const fetchDepartments = useCallback(async () => {
    // If scope is department, we assume they only have access to their own, 
    // so we don't necessarily need to fetch the whole list unless we want to show the label.
    // However, the requirement is "tidak hit ke backend untuk get items" if restricted.
    if (!showSelector) return;

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
  }, [showSelector]);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  const options = useMemo(() => departments.map(d => ({
    value: d.id,
    label: d.name,
    sublabel: d.code,
    corporateId: d.corporateId
  })), [departments]);

  return {
    departments,
    isLoading,
    error,
    refetch: fetchDepartments,
    options,
    showSelector,
    defaultDepartmentId
  };
}

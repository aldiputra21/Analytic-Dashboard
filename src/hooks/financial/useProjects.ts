import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../../services/financial/apiFetch';

export interface ProjectDropdownItem {
  id: string;
  name: string;
  code?: string;
  departmentId: string;
  departmentName?: string;
  corporateId?: string;
}

export function useProjects() {
  const [projects, setProjects] = useState<ProjectDropdownItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiFetch('/api/projects/dropdown-items');
      if (!res.ok) throw new Error('Failed to fetch projects');
      const data = await res.json();
      setProjects(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('[useProjects] Error:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  return {
    projects,
    isLoading,
    error,
    refetch: fetchProjects,
    // Formatted for SearchableSelect
    options: projects.map(p => ({
      value: p.id,
      label: p.name,
      sublabel: p.code ? `${p.code}${p.departmentName ? ` • ${p.departmentName}` : ''}` : p.departmentName,
      departmentId: p.departmentId
    }))
  };
}

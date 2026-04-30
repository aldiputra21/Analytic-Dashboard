import { useState, useEffect, useCallback, useMemo } from 'react';
import { apiFetch } from '../../services/financial/apiFetch';
import { useAuth } from './useAuth';

export function useDashboardDepartments(corporateId?: string) {
  const [departments, setDepartments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDepartments = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const url = `/api/frs/dashboard/departments${corporateId && corporateId !== 'all' ? `?corporateId=${corporateId}` : ''}`;
      const res = await apiFetch(url);
      if (!res.ok) throw new Error('Failed to fetch dashboard departments');
      const data = await res.json();
      setDepartments(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [corporateId]);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  const options = useMemo(() => departments.map(d => ({
    value: d.id,
    label: d.name,
    sublabel: d.code,
    corporateId: d.corporateId
  })), [departments]);

  return { departments, isLoading, error, refetch: fetchDepartments, options };
}

export function useDashboardProjects(departmentId?: string) {
  const [projects, setProjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const url = `/api/frs/dashboard/projects${departmentId ? `?departmentId=${departmentId}` : ''}`;
      const res = await apiFetch(url);
      if (!res.ok) throw new Error('Failed to fetch dashboard projects');
      const data = await res.json();
      setProjects(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [departmentId]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const options = useMemo(() => projects.map(p => ({
    value: p.id,
    label: p.name,
    sublabel: p.code,
    departmentId: p.departmentId
  })), [projects]);

  return { projects, isLoading, error, refetch: fetchProjects, options };
}

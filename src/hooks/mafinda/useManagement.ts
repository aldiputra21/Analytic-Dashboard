// useManagement.ts — Custom hook for MAFINDA management API calls
// Requirements: 7.1, 7.2, 7.3, 7.4

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../financial/useAuth';
import { apiFetch as apiService } from '../../services/financial/apiFetch';

export interface Department {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  departmentId: string;
  departmentName?: string;
  name: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FinancialTarget {
  id: string;
  entityType: 'department' | 'project';
  entityId: string;
  period: string;
  periodType: 'monthly' | 'quarterly' | 'annual';
  revenueTarget: number;
  operationalCostTarget: number;
  createdAt: string;
  updatedAt: string;
}

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await apiService(url, options);
  const data = await res.json();
  if (!res.ok) {
    const err = new Error(data.error ?? 'Request failed') as any;
    err.status = res.status;
    throw err;
  }
  return data as T;
}

export function useManagement() {
  const { user } = useAuth();  // Get user from session to extract corporateId
  const [departments, setDepartments] = useState<Department[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [targets, setTargets] = useState<FinancialTarget[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Use a ref to track abort controller for cancelling stale requests
  const abortControllerRef = useRef<AbortController | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const fetchAll = useCallback(async () => {
    // Cancel previous request if still pending
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    const corporateId = user?.corporateId;
    // Allow undefined corporateId (owner role with system scope accesses all)
    
    setIsLoading(true);
    setError(null);
    try {
      const url = (id: string) => corporateId ? `${id}?corporateId=${corporateId}` : id;
      const [depts, projs, tgts] = await Promise.all([
        apiFetch<Department[]>(url('/api/departments')),
        apiFetch<Project[]>(url('/api/projects')),
        apiFetch<FinancialTarget[]>(url('/api/targets')),
      ]);

      // Extract records from paginated or raw array responses
      const deptsArray = Array.isArray(depts) ? depts : ((depts as any).records || []);
      const projsArray = Array.isArray(projs) ? projs : ((projs as any).records || []);
      const tgtsArray = Array.isArray(tgts) ? tgts : ((tgts as any).records || []);

      // Check if request was aborted
      if (abortControllerRef.current.signal.aborted) return;

      setDepartments(deptsArray);
      setProjects(projsArray);
      setTargets(tgtsArray);
    } catch (err: any) {
      // Ignore abort errors
      if (err.name !== 'AbortError') {
        setError(err.message);
      }
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);  // Only depend on user ID, corporateId is read fresh in hook

  // Auto-refetch when user changes with debounce
  useEffect(() => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    
    debounceTimerRef.current = setTimeout(() => {
      fetchAll();
    }, 300);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // --- Department actions ---

  const createDepartment = useCallback(
    async (data: { name: string; description?: string }) => {
      const dept = await apiFetch<Department>('/api/departments', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      setDepartments((prev) => [...prev, dept].sort((a, b) => a.name.localeCompare(b.name)));
    },
    []
  );

  const updateDepartment = useCallback(
    async (id: string, data: { name?: string; description?: string }) => {
      const updated = await apiFetch<Department>(`/api/departments/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      setDepartments((prev) =>
        prev.map((d) => (d.id === id ? updated : d)).sort((a, b) => a.name.localeCompare(b.name))
      );
    },
    []
  );

  const deleteDepartment = useCallback(async (id: string) => {
    await apiFetch(`/api/departments/${id}`, { method: 'DELETE' });
    setDepartments((prev) => prev.filter((d) => d.id !== id));
    setProjects((prev) => prev.filter((p) => p.departmentId !== id));
  }, []);

  // --- Project actions ---

  const createProject = useCallback(
    async (data: {
      departmentId: string;
      name: string;
      description?: string;
      startDate?: string;
      endDate?: string;
    }) => {
      const proj = await apiFetch<Project>('/api/projects', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      setProjects((prev) => [...prev, proj].sort((a, b) => a.name.localeCompare(b.name)));
    },
    []
  );

  const updateProject = useCallback(
    async (
      id: string,
      data: { name?: string; description?: string; startDate?: string; endDate?: string }
    ) => {
      const updated = await apiFetch<Project>(`/api/projects/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      setProjects((prev) =>
        prev.map((p) => (p.id === id ? updated : p)).sort((a, b) => a.name.localeCompare(b.name))
      );
    },
    []
  );

  const deleteProject = useCallback(async (id: string) => {
    await apiFetch(`/api/projects/${id}`, { method: 'DELETE' });
    setProjects((prev) => prev.filter((p) => p.id !== id));
  }, []);

  // --- Target actions ---

  const upsertTarget = useCallback(
    async (data: {
      entityType: 'department' | 'project';
      entityId: string;
      period: string;
      periodType: 'monthly' | 'quarterly' | 'annual';
      revenueTarget: number;
      operationalCostTarget: number;
    }) => {
      const saved = await apiFetch<FinancialTarget>('/api/targets', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      setTargets((prev) => {
        const exists = prev.find((t) => t.id === saved.id);
        return exists ? prev.map((t) => (t.id === saved.id ? saved : t)) : [...prev, saved];
      });
    },
    []
  );

  const deleteTarget = useCallback(async (id: string) => {
    await apiFetch(`/api/targets/${id}`, { method: 'DELETE' });
    setTargets((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return {
    departments,
    projects,
    targets,
    isLoading,
    error,
    refetch: fetchAll,
    createDepartment,
    updateDepartment,
    deleteDepartment,
    createProject,
    updateProject,
    deleteProject,
    upsertTarget,
    deleteTarget,
  };
}

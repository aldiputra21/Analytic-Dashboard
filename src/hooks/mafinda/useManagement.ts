// useManagement.ts — Custom hook for MAFINDA management API calls
// Requirements: 7.1, 7.2, 7.3, 7.4

import { useState, useEffect, useCallback } from 'react';

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
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) {
    const err = new Error(data.error ?? 'Request failed') as any;
    err.status = res.status;
    throw err;
  }
  return data as T;
}

export function useManagement() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [targets, setTargets] = useState<FinancialTarget[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [depts, projs, tgts] = await Promise.all([
        apiFetch<Department[]>('/api/departments'),
        apiFetch<Project[]>('/api/projects'),
        apiFetch<FinancialTarget[]>('/api/targets'),
      ]);
      setDepartments(depts);
      setProjects(projs);
      setTargets(tgts);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

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

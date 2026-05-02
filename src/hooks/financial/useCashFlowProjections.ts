import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { apiFetch as apiService } from '../../services/financial/apiFetch';

export interface CashFlowProjectionDetail {
  id: string;
  headerId: string;
  month: number;
  type: 'cash-in' | 'cash-out';
  group: 'operating' | 'investing' | 'financing';
  category: string;
  amount: number;
  notes?: string | null;
}

export interface CashFlowProjectionHeader {
  id: string;
  corporateId: string;
  corporateName?: string;
  fiscalYear: number;
  initialBalance: number;
  notes?: string | null;
  createdBy: string;
  createdAt: string;
  updatedBy?: string | null;
  updatedAt?: string | null;
  details?: CashFlowProjectionDetail[];
}

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await apiService(url, options);
  const data = await res.json().catch(() => ({}));
  
  if (!res.ok) {
    const err = new Error(data.error?.message ?? data.error ?? data.message ?? 'Request failed') as any;
    err.status = res.status;
    err.code = data.error?.code || data.code;
    throw err;
  }
  return data as T;
}

export function useCashFlowProjections(corporateId?: string, page: number = 1, pageSize: number = 10, year?: string) {
  const { user } = useAuth();
  const [projections, setProjections] = useState<CashFlowProjectionHeader[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeCorporateId = corporateId || user?.corporateId;

  const fetchProjections = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const queryParams = new URLSearchParams();
      if (corporateId) queryParams.set('corporateId', corporateId);
      if (year) queryParams.set('year', year);
      queryParams.set('page', page.toString());
      queryParams.set('pageSize', pageSize.toString());

      const url = `/api/cash-flow-projections?${queryParams.toString()}`;
        
      const data = await apiFetch<{ records: CashFlowProjectionHeader[], totalCount: number }>(url);
      setProjections(data.records || []);
      setTotalCount(data.totalCount || 0);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch projections');
    } finally {
      setIsLoading(false);
    }
  }, [corporateId, page, pageSize, year]);

  useEffect(() => {
    fetchProjections();
  }, [fetchProjections]);

  const getProjection = async (id: string) => {
    return await apiFetch<CashFlowProjectionHeader>(`/api/cash-flow-projections/${id}`);
  };

  const createProjection = async (data: {
    corporateId: string;
    fiscalYear: number;
    initialBalance: number;
    notes?: string;
    details: Omit<CashFlowProjectionDetail, 'id' | 'headerId'>[];
  }) => {
    const saved = await apiFetch<CashFlowProjectionHeader>('/api/cash-flow-projections', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    setProjections((prev) => [saved, ...prev]);
    return saved;
  };

  const updateProjection = async (id: string, data: {
    initialBalance?: number;
    notes?: string;
    details?: Omit<CashFlowProjectionDetail, 'id' | 'headerId'>[];
  }) => {
    const updated = await apiFetch<{ id: string; success: boolean }>(`/api/cash-flow-projections/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    await fetchProjections(); // Refetch to get updated header data
    return updated;
  };

  const deleteProjection = async (id: string) => {
    await apiFetch(`/api/cash-flow-projections/${id}`, { method: 'DELETE' });
    setProjections((prev) => prev.filter((p) => p.id !== id));
  };

  return {
    projections,
    totalCount,
    isLoading,
    error,
    refetch: fetchProjections,
    getProjection,
    createProjection,
    updateProjection,
    deleteProjection,
  };
}

import { useState, useEffect, useCallback } from 'react';
import { Role } from '../../services/financial/roleService';
import { apiFetch } from '../../services/financial/apiFetch';

interface UseRolesFilters {
  scope?: 'system' | 'corporate' | 'department';
  isActive?: boolean;
  search?: string;
  page?: number;
  pageSize?: number;
}

interface UseRolesResult {
  data: Role[];
  totalCount: number;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch roles with optional filters and pagination.
 * Requirements: 25.2
 */
export function useRoles(filters?: UseRolesFilters): UseRolesResult {
  const [data, setData] = useState<Role[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRoles = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filters?.scope) params.append('scope', filters.scope);
      if (filters?.isActive !== undefined)
        params.append('isActive', String(filters.isActive));
      if (filters?.search) params.append('search', filters.search);
      if (filters?.page) params.append('page', String(filters.page));
      if (filters?.pageSize) params.append('pageSize', String(filters.pageSize));

      const queryString = params.toString();
      const url = `/api/roles${queryString ? `?${queryString}` : ''}`;

      const res = await apiFetch(url);
      if (!res.ok) {
        const errData = await res.json();
        throw errData;
      }

      const result = await res.json();
      setData(result.data || []);
      setTotalCount(result.totalCount || 0);
    } catch (err: any) {
      const errCode = err.error?.code || err.code || 'NETWORK_ERROR';
      setError(errCode);
    } finally {
      setIsLoading(false);
    }
  }, [filters?.scope, filters?.isActive, filters?.search, filters?.page, filters?.pageSize]);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  return {
    data,
    totalCount,
    isLoading,
    error,
    refetch: fetchRoles,
  };
}

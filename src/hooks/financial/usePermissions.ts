import { useState, useEffect, useCallback } from 'react';
import { Permission } from '../../services/financial/permissionService';
import { apiFetch } from '../../services/financial/apiFetch';

interface UsePermissionsFilters {
  module?: string;
  isActive?: boolean;
  search?: string;
  page?: number;
  pageSize?: number;
}

interface UsePermissionsResult {
  data: Permission[];
  totalCount: number;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch permissions with optional filters and pagination.
 * Requirements: 25.1
 */
export function usePermissions(
  filters?: UsePermissionsFilters
): UsePermissionsResult {
  const [data, setData] = useState<Permission[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPermissions = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filters?.module) params.append('module', filters.module);
      if (filters?.isActive !== undefined)
        params.append('isActive', String(filters.isActive));
      if (filters?.search) params.append('search', filters.search);
      if (filters?.page) params.append('page', String(filters.page));
      if (filters?.pageSize) params.append('pageSize', String(filters.pageSize));

      const queryString = params.toString();
      const url = `/api/permissions${queryString ? `?${queryString}` : ''}`;

      const res = await apiFetch(url);
      if (!res.ok) {
        const errData = await res.json();
        throw errData;
      }

      const result = await res.json();
      setData(result.records || []);
      setTotalCount(result.totalCount || 0);
    } catch (err: any) {
      const errCode = err.error?.code || err.code || 'NETWORK_ERROR';
      setError(errCode);
    } finally {
      setIsLoading(false);
    }
  }, [filters?.module, filters?.isActive, filters?.search, filters?.page, filters?.pageSize]);

  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  return {
    data,
    totalCount,
    isLoading,
    error,
    refetch: fetchPermissions,
  };
}

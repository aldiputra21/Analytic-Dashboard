import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../../services/financial/apiFetch';
import { FRSUser } from '../../types/financial/user';

interface UseUsersFilters {
  status?: 'all' | 'active' | 'inactive';
  verified?: 'all' | 'verified' | 'unverified';
  search?: string;
  page?: number;
  pageSize?: number;
}

interface UseUsersResult {
  data: FRSUser[];
  totalCount: number;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useUsers(filters?: UseUsersFilters): UseUsersResult {
  const [data, setData] = useState<FRSUser[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filters?.status) params.append('status', filters.status);
      if (filters?.verified) params.append('verified', filters.verified);
      if (filters?.search) params.append('search', filters.search);
      if (filters?.page) params.append('page', String(filters.page));
      if (filters?.pageSize) params.append('pageSize', String(filters.pageSize));

      const queryString = params.toString();
      const url = `/api/users${queryString ? `?${queryString}` : ''}`;

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
  }, [filters?.status, filters?.verified, filters?.search, filters?.page, filters?.pageSize]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return {
    data,
    totalCount,
    isLoading,
    error,
    refetch: fetchUsers,
  };
}

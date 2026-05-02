import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../../services/financial/apiFetch';
import { Corporate } from '../../types/financial/corporate';
import { useAuth } from './useAuth';
import { DASHBOARD_QUERY_KEYS } from '../../constants/queryKeys';

export function useCorporates() {
  const { user, scope, subsidiaryIds } = useAuth();

  // Show selector if system scope OR user has access to multiple subsidiaries
  const showSelector = scope === 'system' || (subsidiaryIds && subsidiaryIds.length > 1);
  const defaultCorporateId = user?.corporateId || (subsidiaryIds?.[0]);

  const {
    data: corporates = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: DASHBOARD_QUERY_KEYS.corporates,
    queryFn: async () => {
      const res = await apiFetch('/api/frs/corporates/dropdown-items');
      if (!res.ok) throw new Error('Failed to fetch corporates');
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
    enabled: showSelector, // Only fetch if we need to show the selector
  });

  const options = useMemo(() => (corporates as Corporate[]).map(c => ({
    value: c.id,
    label: c.name,
    sublabel: c.code
  })), [corporates]);

  return {
    corporates: corporates as Corporate[],
    isLoading,
    error: error ? (error as Error).message : null,
    refetch,
    options,
    showSelector,
    defaultCorporateId
  };
}

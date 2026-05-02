import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../../services/financial/apiFetch';

/**
 * Custom hook to fetch a specific system configuration value.
 * @param key The configuration key to fetch (e.g., 'REALIZATION_ATTACHMENT_MAX_SIZE')
 * @returns React Query result containing the configuration value
 */
export function useSystemConfig<T = any>(key: string) {
  return useQuery({
    queryKey: ['system-config', key],
    queryFn: async () => {
      const res = await apiFetch(`/api/system-configs/${key}`);
      if (!res.ok) {
        throw new Error(`Failed to fetch config ${key}`);
      }
      const data = await res.json();
      return data.value as T;
    },
    enabled: !!key,
    staleTime: 1000 * 60 * 60, // 1 hour stale time as these rarely change
    gcTime: 1000 * 60 * 60 * 2, // 2 hours cache
    retry: 1,
  });
}

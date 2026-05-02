import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../../services/financial/apiFetch';

export interface RealizationConfigs {
  uploadDir: string;
  maxSize: number;
  allowedFormats: string[];
}

/**
 * Custom hook to fetch realization-specific configuration (like file upload limits).
 * This uses the dedicated /api/cash-realizations/configs endpoint which requires
 * only realization read permissions, rather than broad system config access.
 */
export function useRealizationConfigs() {
  return useQuery({
    queryKey: ['realization-configs'],
    queryFn: async () => {
      const res = await apiFetch('/api/cash-realizations/configs');
      if (!res.ok) {
        throw new Error('Failed to fetch realization configs');
      }
      return await res.json() as RealizationConfigs;
    },
    staleTime: 1000 * 60 * 60, // 1 hour
    gcTime: 1000 * 60 * 60 * 2, // 2 hours
    retry: 1,
  });
}

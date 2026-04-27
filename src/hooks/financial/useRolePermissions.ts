import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../../services/financial/apiFetch';

interface UseRolePermissionsResult {
  assigned: string[];
  isLoading: boolean;
  error: string | null;
  save: (permissionIds: string[]) => Promise<void>;
}

/**
 * Hook to manage role permissions.
 * Fetches assigned permissions for a role and provides a save function.
 * Requirements: 25.3
 */
export function useRolePermissions(
  roleId: string | null
): UseRolePermissionsResult {
  const [assigned, setAssigned] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch assigned permissions when roleId changes
  useEffect(() => {
    if (!roleId) {
      setAssigned([]);
      return;
    }

    const fetchPermissions = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await apiFetch(`/api/roles/${roleId}/permissions`);
        if (!res.ok) {
          throw new Error('Failed to fetch role permissions');
        }

        const result = await res.json();
        setAssigned(result.permissions || []);
      } catch (err: any) {
        setError(err.message ?? 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPermissions();
  }, [roleId]);

  const save = useCallback(
    async (permissionIds: string[]) => {
      if (!roleId) {
        throw new Error('Role ID is required');
      }

      setIsLoading(true);
      setError(null);
      try {
        const res = await apiFetch(`/api/roles/${roleId}/permissions`, {
          method: 'PUT',
          body: JSON.stringify({ permissionIds }),
        });

        if (!res.ok) {
          throw new Error('Failed to save role permissions');
        }

        setAssigned(permissionIds);
      } catch (err: any) {
        setError(err.message ?? 'Unknown error');
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [roleId]
  );

  return {
    assigned,
    isLoading,
    error,
    save,
  };
}

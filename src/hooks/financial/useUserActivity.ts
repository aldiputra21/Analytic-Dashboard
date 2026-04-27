import { useState, useEffect } from 'react';
import { LoginActivity } from '../../types/financial/user';
import { apiFetch } from '../../services/financial/apiFetch';

interface UseUserActivityResult {
  activities: LoginActivity[];
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook to fetch user login activities.
 * Returns the last 10 login activities for the current user.
 * Requirements: 25.6
 */
export function useUserActivity(): UseUserActivityResult {
  const [activities, setActivities] = useState<LoginActivity[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchActivities = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await apiFetch('/api/profile/activity');
        if (!res.ok) {
          throw new Error('Failed to fetch user activities');
        }

        const data = await res.json();
        setActivities(data.activities || []);
      } catch (err: any) {
        setError(err.message ?? 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchActivities();
  }, []);

  return {
    activities,
    isLoading,
    error,
  };
}

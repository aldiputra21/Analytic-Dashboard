// useAlerts.ts - Hook for alert management
// Requirements: 5.8, 5.9

import { useState, useEffect, useCallback } from 'react';
import { Alert, AlertSeverity, AlertStatus } from '../../types/financial/alert';
import { apiFetch } from '../../services/financial/apiFetch';

const API_BASE = '/api/frs';

interface UseAlertsOptions {
  subsidiaryId?: string;
  severity?: AlertSeverity;
  status?: AlertStatus;
  enabled?: boolean;
}

interface UseAlertsResult {
  alerts: Alert[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
  acknowledge: (alertId: string) => Promise<void>;
}

export function useAlerts(options: UseAlertsOptions = {}): UseAlertsResult {
  const { subsidiaryId, severity, status = 'active', enabled = true } = options;
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAlerts = useCallback(async () => {
    if (!enabled) return;
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (subsidiaryId) params.set('subsidiaryId', subsidiaryId);
      if (severity) params.set('severity', severity);
      if (status) params.set('status', status);

      const res = await apiFetch(`${API_BASE}/alerts?${params}`);
      if (!res.ok) throw new Error('Failed to fetch alerts');
      const data: Alert[] = await res.json();
      setAlerts(data);
    } catch (err: any) {
      setError(err.message ?? 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [enabled, subsidiaryId, severity, status]);

  useEffect(() => { fetchAlerts(); }, [fetchAlerts]);

  const acknowledge = useCallback(async (alertId: string) => {
    await apiFetch(`${API_BASE}/alerts/${alertId}/acknowledge`, { method: 'PATCH' });
    // Optimistic update
    setAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, status: 'acknowledged' as AlertStatus } : a))
    );
  }, []);

  return { alerts, isLoading, error, refetch: fetchAlerts, acknowledge };
}

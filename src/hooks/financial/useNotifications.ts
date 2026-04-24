import { useCallback, useEffect, useRef, useState } from 'react';
import { apiFetch } from '../../services/financial/apiFetch';

const API_BASE = '/api/frs/notifications';
const POLLING_INTERVAL_MS = 60_000;         // Increased from 30s to 60s to reduce API load
const BACKGROUND_POLLING_INTERVAL_MS = 120_000;  // Increased from 60s to 120s when tab is not visible

export type NotificationStatus = 'unread' | 'read' | 'archived' | 'dismissed';

export interface NotificationItem {
  id: string;
  sourceModule: string;
  sourceEntityType: string;
  sourceEntityId: string;
  recipientUserId: string;
  recipientRoleId?: string | null;
  category: string;
  templateKey: string;
  templateVars: Record<string, unknown>;
  payload: Record<string, unknown>;
  severity: 'low' | 'medium' | 'high';
  status: NotificationStatus;
  readAt?: string | null;
  readBy?: string | null;
  createdBy?: string | null;
  createdAt: string;
  updatedBy?: string | null;
  updatedAt?: string | null;
}

interface UseNotificationsOptions {
  status?: NotificationStatus;
  enabled?: boolean;
  token?: string | null;
}

interface UseNotificationsResult {
  notifications: NotificationItem[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  realtimeStatus: 'idle' | 'sse' | 'polling';
  refetch: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  archive: (notificationId: string) => Promise<void>;
}

export function useNotifications(options: UseNotificationsOptions = {}): UseNotificationsResult {
  const { status, enabled = true, token } = options;
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [realtimeStatus, setRealtimeStatus] = useState<'idle' | 'sse' | 'polling'>('idle');
  const realtimeStatusRef = useRef<'idle' | 'sse' | 'polling'>(realtimeStatus);
  const pollingTimerRef = useRef<number | null>(null);
  const pollingRetryCountRef = useRef(0);
  const maxPollingRetries = 5; // Stop polling after 5 failed attempts
  const fetchAbortRef = useRef<AbortController | null>(null);

  // Sync ref with state
  useEffect(() => {
    realtimeStatusRef.current = realtimeStatus;
  }, [realtimeStatus]);

  const clearPolling = useCallback(() => {
    if (pollingTimerRef.current !== null) {
      window.clearTimeout(pollingTimerRef.current);
      pollingTimerRef.current = null;
    }
    pollingRetryCountRef.current = 0;
  }, []);

  const fetchNotifications = useCallback(async () => {
    if (!enabled) return;

    // Abort previous request if still pending
    fetchAbortRef.current?.abort();
    fetchAbortRef.current = new AbortController();

    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (status) params.set('status', status);
      const res = await apiFetch(`${API_BASE}?${params.toString()}`);
      if (!res.ok) {
        throw new Error('Failed to fetch notifications');
      }
      const data: NotificationItem[] = await res.json();
      setNotifications(data);
      // Success resets polling retries
      pollingRetryCountRef.current = 0;
    } catch (fetchError) {
      // Don't set error for polling requests (only for explicit fetches)
      if (realtimeStatus !== 'polling') {
        setError(fetchError instanceof Error ? fetchError.message : 'Unknown error');
      }
    } finally {
      setIsLoading(false);
    }
  }, [enabled, status, realtimeStatus]);

  const schedulePolling = useCallback(() => {
    // DO NOT schedule if SSE is active or polling is disabled
    if (!enabled || realtimeStatus === 'sse') {
      clearPolling();
      return;
    }

    // Stop polling after max retries reached
    if (pollingRetryCountRef.current >= maxPollingRetries) {
      setRealtimeStatus('idle');
      return;
    }

    clearPolling();
    const delay = document.visibilityState === 'hidden'
      ? BACKGROUND_POLLING_INTERVAL_MS
      : POLLING_INTERVAL_MS;

    pollingTimerRef.current = window.setTimeout(async () => {
      // Re-verify status inside timeout using Ref to handle rapid transitions
      // This avoids the TS "no overlap" error and stale closures
      if (realtimeStatusRef.current !== 'sse' && pollingRetryCountRef.current < maxPollingRetries) {
        pollingRetryCountRef.current += 1;
        await fetchNotifications();
        schedulePolling();
      }
    }, delay);
  }, [clearPolling, enabled, fetchNotifications, realtimeStatus]);

  // Initial fetch
  useEffect(() => {
    void fetchNotifications();
  }, [fetchNotifications]);

  // SSE + polling management
  useEffect(() => {
    if (!enabled) return undefined;

    let eventSource: EventSource | null = null;
    let closed = false;
    let sseFailureCount = 0;

    const startPollingFallback = () => {
      if (closed) return;
      setRealtimeStatus('polling');
      pollingRetryCountRef.current = 0;
      schedulePolling();
    };

    if (typeof window !== 'undefined' && 'EventSource' in window) {
      if (!token) {
        startPollingFallback();
        return undefined;
      }

      eventSource = new EventSource(`${API_BASE}/stream?token=${encodeURIComponent(token)}`, { withCredentials: false });
      
      eventSource.onopen = () => {
        clearPolling();
        setRealtimeStatus('sse');
        sseFailureCount = 0;
      };
      
      eventSource.onerror = () => {
        sseFailureCount += 1;
        eventSource?.close();
        
        // Only fall back to polling if SSE fails consistently
        if (sseFailureCount >= 2) {
          startPollingFallback();
        } else {
          // For transient errors, just close and let component remount handle reconnect
          if (!closed) {
            setRealtimeStatus('idle');
          }
        }
      };
      
      eventSource.addEventListener('notification', () => {
        void fetchNotifications();
      });
    } else {
      startPollingFallback();
    }

    const handleVisibilityChange = () => {
      if (realtimeStatus === 'polling' && pollingRetryCountRef.current < maxPollingRetries) {
        schedulePolling();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      closed = true;
      clearPolling();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      eventSource?.close();
      fetchAbortRef.current?.abort();
    };
  }, [clearPolling, enabled, fetchNotifications, schedulePolling, realtimeStatus, token]);

  const markAsRead = useCallback(async (notificationId: string) => {
    const res = await apiFetch(`${API_BASE}/${notificationId}/read`, { method: 'PATCH' });
    if (!res.ok) {
      throw new Error('Failed to mark notification as read');
    }
    await fetchNotifications();
  }, [fetchNotifications]);

  const archive = useCallback(async (notificationId: string) => {
    const res = await apiFetch(`${API_BASE}/${notificationId}/archive`, { method: 'PATCH' });
    if (!res.ok) {
      throw new Error('Failed to archive notification');
    }
    await fetchNotifications();
  }, [fetchNotifications]);

  return {
    notifications,
    unreadCount: notifications.filter((item) => item.status === 'unread').length,
    isLoading,
    error,
    realtimeStatus,
    refetch: fetchNotifications,
    markAsRead,
    archive,
  };
}

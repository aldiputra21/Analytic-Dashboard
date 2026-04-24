import React, { useMemo, useState } from 'react';
import { Archive, Bell, CheckCheck, Radio, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { useNotifications, type NotificationStatus } from '../../../hooks/financial/useNotifications';
import { useAuth } from '../../../hooks/financial/useAuth';
import { useCorporates } from '../../../hooks/financial/useCorporates';
import { cn } from '../../../utils/cn';
import { RATIO_META } from './RatioCard';

const STATUS_OPTIONS: Array<{ key: NotificationStatus; label: string }> = [
  { key: 'unread', label: 'Unread' },
  { key: 'read', label: 'Read' },
  { key: 'archived', label: 'Archived' },
  { key: 'dismissed', label: 'Dismissed' },
];

const SEVERITY_STYLES: Record<'high' | 'medium' | 'low', string> = {
  high: 'bg-red-100 text-red-700 border-red-200',
  medium: 'bg-amber-100 text-amber-700 border-amber-200',
  low: 'bg-blue-100 text-blue-700 border-blue-200',
};

export const AlertsInbox: React.FC = () => {
  const { token, user } = useAuth();
  const { corporates: subsidiaries } = useCorporates();
  const [status, setStatus] = useState<NotificationStatus>('unread');
  const {
    notifications,
    unreadCount,
    isLoading,
    realtimeStatus,
    refetch,
    markAsRead,
    archive,
  } = useNotifications({ status, enabled: Boolean(user), token });

  const subsidiaryMap = useMemo(
    () => Object.fromEntries(subsidiaries.map((subsidiary) => [subsidiary.id, subsidiary.name])),
    [subsidiaries],
  );

  return (
    <div className="space-y-4 p-6">
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-slate-600" />
            <h2 className="text-lg font-semibold text-slate-900">Alerts Inbox</h2>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Realtime CFD alerts delivered through notifications with polling fallback.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className={cn(
            'inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium',
            realtimeStatus === 'sse'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : realtimeStatus === 'polling'
                ? 'border-amber-200 bg-amber-50 text-amber-700'
                : 'border-slate-200 bg-slate-50 text-slate-600',
          )}>
            <Radio className="w-3.5 h-3.5" />
            {realtimeStatus === 'sse' ? 'Realtime SSE' : realtimeStatus === 'polling' ? 'Polling Fallback' : 'Idle'}
          </span>
          <button
            onClick={() => void refetch()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
          >
            <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
            Refresh
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {STATUS_OPTIONS.map((option) => (
          <button
            key={option.key}
            onClick={() => setStatus(option.key)}
            className={cn(
              'rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
              status === option.key
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50',
            )}
          >
            {option.label}
            {option.key === 'unread' && unreadCount > 0 ? ` (${unreadCount})` : ''}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {notifications.length === 0 && !isLoading && (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center text-sm text-slate-500">
            No alerts in this state.
          </div>
        )}

        {notifications.map((notification) => {
          const payload = notification.payload ?? {};
          const corporateId = String(payload.corporateId ?? '');
          const ratioName = String(payload.ratioName ?? notification.category);
          const ratioMeta = RATIO_META.find((item) => item.key === ratioName);
          const currentValue = Number(payload.currentValue ?? 0);
          const thresholdValue = Number(payload.thresholdValue ?? 0);
          const message = String(payload.message ?? notification.templateKey);

          return (
            <div key={notification.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={cn('inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold uppercase', SEVERITY_STYLES[notification.severity])}>
                      {notification.severity}
                    </span>
                    <span className="text-sm font-semibold text-slate-900">
                      {(subsidiaryMap[corporateId] ?? corporateId) || 'System'}
                    </span>
                    <span className="text-xs text-slate-400">•</span>
                    <span className="text-xs text-slate-500">{ratioMeta?.label ?? ratioName}</span>
                  </div>
                  <p className="text-sm text-slate-700">{message}</p>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                    <span>Current: <strong className="text-slate-700">{currentValue.toFixed(2)}</strong></span>
                    <span>Threshold: <strong className="text-slate-700">{thresholdValue.toFixed(2)}</strong></span>
                    <span>{format(new Date(notification.createdAt), 'dd MMM yyyy HH:mm')}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {notification.status === 'unread' && (
                    <button
                      onClick={() => void markAsRead(notification.id)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-100"
                    >
                      <CheckCheck className="w-4 h-4" />
                      Mark read
                    </button>
                  )}
                  {notification.status !== 'archived' && (
                    <button
                      onClick={() => void archive(notification.id)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
                    >
                      <Archive className="w-4 h-4" />
                      Archive
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

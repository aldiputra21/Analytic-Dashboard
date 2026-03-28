// AlertPanel.tsx - Active alerts with icon, color, count badge, expandable panel
// Requirements: 5.8, 5.9

import React, { useState } from 'react';
import { AlertCircle, AlertTriangle, Info, ChevronDown, ChevronUp, Bell, Check } from 'lucide-react';
import { format } from 'date-fns';
import { Alert, AlertSeverity } from '../../../types/financial/alert';
import { cn } from '../../../utils/cn';
import { RATIO_META } from './RatioCard';

const SEVERITY_CONFIG: Record<AlertSeverity, {
  icon: React.ElementType;
  color: string;
  bg: string;
  border: string;
  badge: string;
  label: string;
}> = {
  high: {
    icon: AlertCircle,
    color: 'text-red-600',
    bg: 'bg-red-50',
    border: 'border-red-200',
    badge: 'bg-red-500',
    label: 'High',
  },
  medium: {
    icon: AlertTriangle,
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    badge: 'bg-amber-500',
    label: 'Medium',
  },
  low: {
    icon: Info,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    badge: 'bg-blue-500',
    label: 'Low',
  },
};

interface AlertItemProps {
  alert: Alert;
  subsidiaryName: string;
  onAcknowledge?: (alertId: string) => void;
}

const AlertItem: React.FC<AlertItemProps> = ({ alert, subsidiaryName, onAcknowledge }) => {
  const cfg = SEVERITY_CONFIG[alert.severity];
  const Icon = cfg.icon;
  const ratioMeta = RATIO_META.find((m) => m.key === alert.ratioName);

  return (
    <div className={cn('flex items-start gap-3 p-3 rounded-lg border', cfg.bg, cfg.border)}>
      <Icon className={cn('w-4 h-4 mt-0.5 shrink-0', cfg.color)} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={cn('text-[10px] font-bold uppercase px-1.5 py-0.5 rounded', cfg.badge, 'text-white')}>
            {cfg.label}
          </span>
          <span className="text-xs font-semibold text-slate-700 truncate">{subsidiaryName}</span>
          <span className="text-xs text-slate-500">·</span>
          <span className="text-xs text-slate-500">{ratioMeta?.label ?? alert.ratioName}</span>
        </div>
        <p className="text-xs text-slate-600 mt-1">{alert.message}</p>
        <div className="flex items-center gap-3 mt-1.5 text-[10px] text-slate-400">
          <span>Current: <strong className={cfg.color}>{alert.currentValue.toFixed(2)}</strong></span>
          <span>Threshold: <strong>{alert.thresholdValue.toFixed(2)}</strong></span>
          <span>{format(new Date(alert.createdAt), 'dd MMM HH:mm')}</span>
        </div>
      </div>
      {onAcknowledge && alert.status === 'active' && (
        <button
          onClick={() => onAcknowledge(alert.id)}
          className="shrink-0 p-1 rounded-md hover:bg-white/60 transition-colors"
          title="Acknowledge"
        >
          <Check className="w-3.5 h-3.5 text-slate-500" />
        </button>
      )}
    </div>
  );
};

interface AlertPanelProps {
  alerts: Alert[];
  subsidiaryMap: Record<string, string>; // id -> name
  onAcknowledge?: (alertId: string) => void;
  className?: string;
}

export const AlertPanel: React.FC<AlertPanelProps> = ({
  alerts,
  subsidiaryMap,
  onAcknowledge,
  className,
}) => {
  const [expanded, setExpanded] = useState(false);

  const activeAlerts = alerts.filter((a) => a.status === 'active');
  const highCount = activeAlerts.filter((a) => a.severity === 'high').length;
  const mediumCount = activeAlerts.filter((a) => a.severity === 'medium').length;
  const lowCount = activeAlerts.filter((a) => a.severity === 'low').length;

  // Sort: high first, then medium, then low
  const sorted = [...activeAlerts].sort((a, b) => {
    const order: Record<AlertSeverity, number> = { high: 0, medium: 1, low: 2 };
    return order[a.severity] - order[b.severity];
  });

  return (
    <div className={cn('bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden', className)}>
      {/* Header - always visible, acts as toggle */}
      <button
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-slate-500" />
          <span className="text-sm font-semibold text-slate-900">Active Alerts</span>

          {/* Count badges */}
          <div className="flex items-center gap-1">
            {highCount > 0 && (
              <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                {highCount}
              </span>
            )}
            {mediumCount > 0 && (
              <span className="bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                {mediumCount}
              </span>
            )}
            {lowCount > 0 && (
              <span className="bg-blue-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                {lowCount}
              </span>
            )}
            {activeAlerts.length === 0 && (
              <span className="text-xs text-slate-400">No active alerts</span>
            )}
          </div>
        </div>

        {activeAlerts.length > 0 && (
          expanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />
        )}
      </button>

      {/* Expandable alert list */}
      {expanded && activeAlerts.length > 0 && (
        <div className="px-4 pb-4 space-y-2 max-h-[400px] overflow-y-auto">
          {sorted.map((alert) => (
            <AlertItem
              key={alert.id}
              alert={alert}
              subsidiaryName={subsidiaryMap[alert.subsidiaryId] ?? alert.subsidiaryId}
              onAcknowledge={onAcknowledge}
            />
          ))}
        </div>
      )}
    </div>
  );
};

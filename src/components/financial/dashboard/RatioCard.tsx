// RatioCard.tsx - Display all 9 financial ratio metrics per subsidiary
// Requirements: 4.1, 4.9, 15.7

import React from 'react';
import { format } from 'date-fns';
import { CheckCircle2, AlertCircle, AlertTriangle, Clock } from 'lucide-react';
import { CalculatedRatios, RatioName } from '../../../types/financial/ratio';
import { Threshold, ThresholdStatus } from '../../../types/financial/threshold';
import { cn } from '../../../utils/cn';

interface RatioMeta {
  key: RatioName;
  label: string;
  unit: string;
  description: string;
}

export const RATIO_META: RatioMeta[] = [
  { key: 'roa',          label: 'ROA',           unit: '%',  description: 'Return on Assets' },
  { key: 'roe',          label: 'ROE',           unit: '%',  description: 'Return on Equity' },
  { key: 'npm',          label: 'NPM',           unit: '%',  description: 'Net Profit Margin' },
  { key: 'der',          label: 'DER',           unit: 'x',  description: 'Debt-to-Equity Ratio' },
  { key: 'currentRatio', label: 'Current Ratio', unit: 'x',  description: 'Current Assets / Current Liabilities' },
  { key: 'quickRatio',   label: 'Quick Ratio',   unit: 'x',  description: '(Current Assets - Inventory) / Current Liabilities' },
  { key: 'cashRatio',    label: 'Cash Ratio',    unit: 'x',  description: 'Cash / Current Liabilities' },
  { key: 'ocfRatio',     label: 'OCF Ratio',     unit: 'x',  description: 'Operating Cash Flow / Current Liabilities' },
  { key: 'dscr',         label: 'DSCR',          unit: 'x',  description: 'Debt Service Coverage Ratio' },
];

/**
 * Determines threshold status for a ratio value.
 * Requirements: 15.7
 */
export function getRatioStatus(
  ratioName: RatioName,
  value: number | null,
  threshold?: Threshold
): ThresholdStatus | null {
  if (value === null || !threshold) return null;

  // DER: lower is better
  if (ratioName === 'der') {
    if (threshold.healthyMax !== undefined && value <= threshold.healthyMax) return 'healthy';
    if (threshold.moderateMax !== undefined && value <= threshold.moderateMax) return 'moderate';
    return 'risky';
  }

  // All others: higher is better
  if (threshold.healthyMin !== undefined && value >= threshold.healthyMin) return 'healthy';
  if (threshold.moderateMin !== undefined && value >= threshold.moderateMin) return 'moderate';
  return 'risky';
}

const STATUS_CONFIG: Record<ThresholdStatus, { icon: React.ElementType; color: string; bg: string; border: string }> = {
  healthy:  { icon: CheckCircle2,  color: 'text-emerald-600', bg: 'bg-emerald-50',  border: 'border-emerald-200' },
  moderate: { icon: AlertTriangle, color: 'text-amber-600',   bg: 'bg-amber-50',    border: 'border-amber-200' },
  risky:    { icon: AlertCircle,   color: 'text-red-600',     bg: 'bg-red-50',      border: 'border-red-200' },
};

interface RatioItemProps {
  meta: RatioMeta;
  value: number | null;
  threshold?: Threshold;
}

const RatioItem: React.FC<RatioItemProps> = ({ meta, value, threshold }) => {
  const status = getRatioStatus(meta.key, value, threshold);
  const cfg = status ? STATUS_CONFIG[status] : null;
  const StatusIcon = cfg?.icon;

  // Threshold reference value for display
  const thresholdRef = threshold
    ? (meta.key === 'der' ? threshold.healthyMax : threshold.healthyMin)
    : undefined;

  return (
    <div className={cn(
      'flex items-center justify-between p-2.5 rounded-lg border',
      cfg ? `${cfg.bg} ${cfg.border}` : 'bg-slate-50 border-slate-200'
    )}>
      <div className="min-w-0">
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{meta.label}</p>
        <p className="text-sm font-bold text-slate-900 mt-0.5">
          {value !== null ? `${value.toFixed(2)}${meta.unit}` : '—'}
        </p>
        {thresholdRef !== undefined && (
          <p className="text-[9px] text-slate-400 mt-0.5">
            Target: {thresholdRef.toFixed(2)}{meta.unit}
          </p>
        )}
      </div>
      {cfg && StatusIcon && (
        <StatusIcon className={cn('w-4 h-4 shrink-0', cfg.color)} />
      )}
    </div>
  );
};

interface RatioCardProps {
  subsidiaryName: string;
  subsidiaryColor: string;
  ratios: CalculatedRatios;
  thresholds?: Threshold[];
  lastUpdatedAt?: Date;
  className?: string;
}

export const RatioCard: React.FC<RatioCardProps> = ({
  subsidiaryName,
  subsidiaryColor,
  ratios,
  thresholds = [],
  lastUpdatedAt,
  className,
}) => {
  const getThreshold = (ratioName: RatioName) =>
    thresholds.find((t) => t.ratioName === ratioName);

  return (
    <div className={cn('bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden', className)}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: subsidiaryColor }} />
          <h3 className="text-sm font-semibold text-slate-900 truncate">{subsidiaryName}</h3>
        </div>
        {lastUpdatedAt && (
          <div className="flex items-center gap-1 text-[10px] text-slate-400">
            <Clock className="w-3 h-3" />
            <span>{format(lastUpdatedAt, 'dd MMM yyyy')}</span>
          </div>
        )}
      </div>

      {/* Health Score */}
      <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
        <span className="text-xs text-slate-500 font-medium">Health Score</span>
        <span
          className="text-sm font-bold"
          style={{
            color: ratios.healthScore <= 50 ? '#ef4444' : ratios.healthScore <= 75 ? '#eab308' : '#22c55e',
          }}
        >
          {Math.round(ratios.healthScore)} / 100
        </span>
      </div>

      {/* Ratio Grid */}
      <div className="p-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
        {RATIO_META.map((meta) => (
          <RatioItem
            key={meta.key}
            meta={meta}
            value={ratios[meta.key]}
            threshold={getThreshold(meta.key)}
          />
        ))}
      </div>
    </div>
  );
};

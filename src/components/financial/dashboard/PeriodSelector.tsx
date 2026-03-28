// PeriodSelector.tsx - Time period selection for dashboard
// Requirements: 4.5, 8.2

import React from 'react';
import { Calendar } from 'lucide-react';
import { cn } from '../../../utils/cn';

export type PeriodRange = '3m' | '6m' | '1y' | '3y' | '5y';

export const PERIOD_OPTIONS: { value: PeriodRange; label: string }[] = [
  { value: '3m', label: '3M' },
  { value: '6m', label: '6M' },
  { value: '1y', label: '1Y' },
  { value: '3y', label: '3Y' },
  { value: '5y', label: '5Y' },
];

interface PeriodSelectorProps {
  value: PeriodRange;
  onChange: (period: PeriodRange) => void;
  className?: string;
}

export const PeriodSelector: React.FC<PeriodSelectorProps> = ({ value, onChange, className }) => {
  return (
    <div className={cn('flex items-center gap-1 bg-slate-100 rounded-lg p-1', className)}>
      <Calendar className="w-3.5 h-3.5 text-slate-400 ml-1 shrink-0" />
      {PERIOD_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={cn(
            'px-2.5 py-1 rounded-md text-xs font-medium transition-colors',
            value === opt.value
              ? 'bg-white text-indigo-600 shadow-sm font-semibold'
              : 'text-slate-500 hover:text-slate-700'
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
};

/**
 * Returns the start date for a given period range from today.
 */
export function getPeriodStartDate(range: PeriodRange): Date {
  const now = new Date();
  switch (range) {
    case '3m': return new Date(now.getFullYear(), now.getMonth() - 3, 1);
    case '6m': return new Date(now.getFullYear(), now.getMonth() - 6, 1);
    case '1y': return new Date(now.getFullYear() - 1, now.getMonth(), 1);
    case '3y': return new Date(now.getFullYear() - 3, now.getMonth(), 1);
    case '5y': return new Date(now.getFullYear() - 5, now.getMonth(), 1);
  }
}

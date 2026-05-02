// PeriodSelector.tsx - Time period selection for dashboard
// Requirements: 4.5, 8.2

import React from 'react';
import { Calendar } from 'lucide-react';
import { cn } from '../../../utils/cn';
import { useAuth } from '../../../hooks/financial/useAuth';
import { dashboardI18n } from '../../../i18n/dashboard';

export type PeriodRange = '3m' | '6m' | '1y' | '3y' | '5y';

// PERIOD_OPTIONS removed, using dashboardI18n

interface PeriodSelectorProps {
  value: PeriodRange;
  onChange: (period: PeriodRange) => void;
  className?: string;
}

export const PeriodSelector: React.FC<PeriodSelectorProps> = ({ value, onChange, className }) => {
  const { language } = useAuth();
  const t = dashboardI18n[language];
  return (
    <div className={cn('flex items-center gap-1 bg-slate-100 rounded-lg p-1', className)}>
      <Calendar className="w-3.5 h-3.5 text-slate-400 ml-1 shrink-0" />
      {(['3m', '6m', '1y', '3y', '5y'] as PeriodRange[]).map((pv) => (
        <button
          key={pv}
          onClick={() => onChange(pv)}
          className={cn(
            'px-2.5 py-1 rounded-md text-xs font-medium transition-colors',
            value === pv
              ? 'bg-white text-indigo-600 shadow-sm font-semibold'
              : 'text-slate-500 hover:text-slate-700'
          )}
        >
          {t.periods[pv]}
        </button>
      ))}
    </div>
  );
};

/**
 * Returns the start date for a given period range relative to a reference date.
 */
export function getPeriodStartDate(range: PeriodRange, referenceDate: Date = new Date()): Date {
  const base = new Date(referenceDate);
  switch (range) {
    case '3m': return new Date(base.getFullYear(), base.getMonth() - 3, 1);
    case '6m': return new Date(base.getFullYear(), base.getMonth() - 6, 1);
    case '1y': return new Date(base.getFullYear() - 1, base.getMonth(), 1);
    case '3y': return new Date(base.getFullYear() - 3, base.getMonth(), 1);
    case '5y': return new Date(base.getFullYear() - 5, base.getMonth(), 1);
  }
}

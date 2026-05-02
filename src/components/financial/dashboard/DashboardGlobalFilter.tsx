import React from 'react';
import { Calendar } from 'lucide-react';
import { cn } from '../../../utils/cn';
import { useAuth } from '../../../hooks/financial/useAuth';
import { mafindaI18n } from '../../../i18n/mafinda';

export type PeriodType = 'quarterly' | 'semiannual';

interface DashboardGlobalFilterProps {
  year: number;
  setYear: (y: number) => void;
  periodType: PeriodType;
  setPeriodType: (t: PeriodType) => void;
  subPeriod: string;
  setSubPeriod: (s: string) => void;
  className?: string;
}

export const DashboardGlobalFilter: React.FC<DashboardGlobalFilterProps> = ({
  year,
  setYear,
  periodType,
  setPeriodType,
  subPeriod,
  setSubPeriod,
  className,
}) => {
  const { language } = useAuth();
  const mt = mafindaI18n[language];

  // Show 3 years before and 3 years after current year
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 7 }, (_, i) => currentYear - 3 + i);

  const subPeriods =
    periodType === 'quarterly' ? ['Q1', 'Q2', 'Q3', 'Q4'] : ['S1', 'S2'];

  const getSubPeriodLabel = (sp: string) => {
    const key = sp.toLowerCase();
    if (periodType === 'quarterly') {
      return (mt.filters.quarters as any)[key] || sp;
    }
    return (mt.filters.semesters as any)[key] || sp;
  };

  return (
    <div className={cn('flex flex-wrap items-center gap-4', className)}>
      {/* Year Selector */}
      <div className="flex items-center gap-2 bg-white/80 backdrop-blur-md border border-slate-200 rounded-xl px-3 py-2 shadow-sm transition-all hover:border-indigo-300 hover:shadow-md">
        <Calendar className="w-4 h-4 text-indigo-500" />
        <select
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className="bg-transparent text-sm font-bold text-slate-700 outline-none cursor-pointer appearance-none min-w-[60px]"
        >
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>

      {/* Period Type Toggle */}
      <div className="flex items-center gap-1 bg-slate-200/50 backdrop-blur-sm rounded-xl p-1 shadow-inner border border-slate-200/50">
        <button
          onClick={() => {
            setPeriodType('quarterly');
            setSubPeriod('Q1');
          }}
          className={cn(
            'px-4 py-1.5 rounded-lg text-xs font-bold transition-all duration-200',
            periodType === 'quarterly'
              ? 'bg-white text-indigo-600 shadow-sm scale-105'
              : 'text-slate-500 hover:bg-white/40'
          )}
        >
          {mt.filters.quarterly}
        </button>
        <button
          onClick={() => {
            setPeriodType('semiannual');
            setSubPeriod('S1');
          }}
          className={cn(
            'px-4 py-1.5 rounded-lg text-xs font-bold transition-all duration-200',
            periodType === 'semiannual'
              ? 'bg-white text-indigo-600 shadow-sm scale-105'
              : 'text-slate-500 hover:bg-white/40'
          )}
        >
          {mt.filters.semiannual}
        </button>
      </div>

      {/* Sub-period Selector */}
      <div className="flex items-center gap-1.5 bg-indigo-50/50 border border-indigo-100/50 rounded-xl p-1 shadow-sm">
        {subPeriods.map((sp) => (
          <button
            key={sp}
            onClick={() => setSubPeriod(sp)}
            className={cn(
              'px-4 py-1.5 rounded-lg text-xs font-black transition-all duration-300 uppercase tracking-wider',
              subPeriod === sp
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 ring-2 ring-indigo-400/20'
                : 'text-indigo-600 hover:bg-indigo-100/80 active:scale-95'
            )}
          >
            {getSubPeriodLabel(sp)}
          </button>
        ))}
      </div>
    </div>
  );
};

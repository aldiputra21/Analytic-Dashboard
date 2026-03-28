// CompanySelector.tsx - Filter dashboard by individual subsidiary or all
// Requirements: 4.2

import React from 'react';
import { Building2, ChevronDown } from 'lucide-react';
import { Subsidiary } from '../../../types/financial/subsidiary';
import { cn } from '../../../utils/cn';

// Consistent color palette per subsidiary index
export const SUBSIDIARY_COLORS = [
  '#6366f1', // indigo
  '#0ea5e9', // sky
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ef4444', // red
];

export function getSubsidiaryColor(index: number): string {
  return SUBSIDIARY_COLORS[index % SUBSIDIARY_COLORS.length];
}

interface CompanySelectorProps {
  subsidiaries: Subsidiary[];
  selectedId: string | 'all';
  onChange: (id: string | 'all') => void;
  className?: string;
}

export const CompanySelector: React.FC<CompanySelectorProps> = ({
  subsidiaries,
  selectedId,
  onChange,
  className,
}) => {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  // Close on outside click
  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selectedLabel =
    selectedId === 'all'
      ? 'All Companies'
      : subsidiaries.find((s) => s.id === selectedId)?.name ?? 'Select Company';

  const selectedColor =
    selectedId === 'all'
      ? '#6366f1'
      : getSubsidiaryColor(subsidiaries.findIndex((s) => s.id === selectedId));

  return (
    <div ref={ref} className={cn('relative', className)}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors shadow-sm min-w-[160px]"
      >
        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: selectedColor }} />
        <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        <span className="flex-1 text-left truncate">{selectedLabel}</span>
        <ChevronDown className={cn('w-3.5 h-3.5 text-slate-400 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 w-full min-w-[200px] bg-white border border-slate-200 rounded-lg shadow-lg z-50 py-1">
          <button
            onClick={() => { onChange('all'); setOpen(false); }}
            className={cn(
              'w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-slate-50 transition-colors',
              selectedId === 'all' ? 'text-indigo-600 font-medium bg-indigo-50' : 'text-slate-700'
            )}
          >
            <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 shrink-0" />
            All Companies
          </button>
          {subsidiaries.map((sub, idx) => (
            <button
              key={sub.id}
              onClick={() => { onChange(sub.id); setOpen(false); }}
              className={cn(
                'w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-slate-50 transition-colors',
                selectedId === sub.id ? 'font-medium bg-slate-50' : 'text-slate-700'
              )}
            >
              <div
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: getSubsidiaryColor(idx) }}
              />
              <span className="truncate">{sub.name}</span>
              {!sub.isActive && (
                <span className="ml-auto text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">Inactive</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

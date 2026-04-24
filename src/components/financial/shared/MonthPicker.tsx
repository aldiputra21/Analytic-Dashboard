import React, { useState, useRef, useEffect } from 'react';
import { cn } from '../../../utils/cn';
import { Calendar, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import { formatPeriod } from '../../../utils/format';

interface MonthPickerProps {
  value: string; // YYYY-MM or empty
  onChange: (value: string) => void;
  className?: string;
  language?: string;
  labels?: {
    month: string;
    year: string;
  };
}

export const MonthPicker: React.FC<MonthPickerProps> = ({
  value,
  onChange,
  className,
  language = 'id',
  labels = { month: 'Bulan', year: 'Tahun' }
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Parse current value
  const parts = value.split('-');
  const selectedValue = parts.length === 2 
    ? { year: parseInt(parts[0]), month: parseInt(parts[1]) }
    : { year: new Date().getFullYear(), month: new Date().getMonth() + 1 };

  const [viewYear, setViewYear] = useState(selectedValue.year);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const monthsId = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const monthsEn = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const months = language === 'id' ? monthsId : monthsEn;

  const handleSelect = (monthIndex: number) => {
    const monthStr = (monthIndex + 1).toString().padStart(2, '0');
    onChange(`${viewYear}-${monthStr}`);
    setIsOpen(false);
  };

  const isSelected = (monthIndex: number) => {
    return selectedValue.year === viewYear && selectedValue.month === monthIndex + 1;
  };

  const activeLabels = {
    month: labels?.month || (language === 'id' ? 'Bulan' : 'Month'),
    year: labels?.year || (language === 'id' ? 'Tahun' : 'Year'),
  };

  return (
    <div className={cn("relative inline-block", className)} ref={dropdownRef}>
      <button 
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between gap-3 bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-medium text-slate-700 hover:border-slate-300 hover:bg-slate-50 focus:ring-2 focus:ring-indigo-500/20 shadow-sm transition-all active:scale-[0.98] w-full cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <Calendar size={16} className="text-slate-400" />
          <div className="flex items-center gap-2 flex-1">
            <span>{value ? formatPeriod(value, language) : activeLabels.month}</span>
          </div>
        </div>
        <ChevronDown size={16} className={cn("text-slate-400 transition-transform duration-200", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 bg-white rounded-2xl shadow-xl border border-slate-200 p-4 z-[100] w-[240px] animate-in fade-in slide-in-from-top-2">
          {/* Header */}
          <div className="flex items-center justify-between px-2 mb-4">
            <button 
              type="button"
              onClick={() => setViewYear(v => v - 1)}
              className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm font-bold text-slate-800">{viewYear}</span>
            <button 
              type="button"
              onClick={() => setViewYear(v => v + 1)}
              className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Months Grid */}
          <div className="grid grid-cols-3 gap-2">
            {months.map((monthStr, index) => {
              const active = isSelected(index);
              return (
                <button
                  type="button"
                  key={monthStr}
                  onClick={() => handleSelect(index)}
                  className={cn(
                    "py-2 text-xs font-medium rounded-lg transition-all border cursor-pointer",
                    active 
                      ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-200" 
                      : "bg-white text-slate-600 border-transparent hover:border-slate-200 hover:bg-slate-50"
                  )}
                >
                  {monthStr}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../../utils/cn';
import { Calendar, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import { formatPeriod } from '../../../utils/format';
import { commonsI18n, Locale } from '../../../i18n/commons';

interface MonthRangePickerProps {
  startValue: string; // YYYY-MM
  endValue: string;   // YYYY-MM
  onChange: (start: string, end: string) => void;
  className?: string;
  language?: string;
  labels?: {
    start?: string;
    end?: string;
    apply?: string;
  };
  usePortal?: boolean;
}

export const MonthRangePicker: React.FC<MonthRangePickerProps> = ({
  startValue,
  endValue,
  onChange,
  className,
  language = 'id',
  labels,
  usePortal = true
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });

  // Parse values
  const parseValue = (val: string) => {
    const parts = val.split('-');
    if (parts.length === 2) {
      return { year: parseInt(parts[0]), month: parseInt(parts[1]) };
    }
    return { year: new Date().getFullYear(), month: new Date().getMonth() + 1 };
  };

  const currentStart = parseValue(startValue);
  const currentEnd = parseValue(endValue);

  // View state for the calendars (which year is currently being viewed)
  const [viewYearStart, setViewYearStart] = useState(currentStart.year);
  const [viewYearEnd, setViewYearEnd] = useState(currentEnd.year);

  // Local state for selections while picker is open
  const [tempStart, setTempStart] = useState(currentStart);
  const [tempEnd, setTempEnd] = useState(currentEnd);

  // Sync state when props change
  useEffect(() => {
    setTempStart(parseValue(startValue));
    setTempEnd(parseValue(endValue));
    setViewYearStart(parseValue(startValue).year);
    setViewYearEnd(parseValue(endValue).year);
  }, [startValue, endValue]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node) && 
          dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Update coordinates on scroll/resize
  useEffect(() => {
    const updateCoords = () => {
      if (isOpen && usePortal && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setCoords({
          top: rect.bottom + window.scrollY,
          left: rect.left + window.scrollX,
          width: rect.width
        });
      }
    };

    if (isOpen && usePortal) {
      updateCoords();
      window.addEventListener('scroll', updateCoords, true);
      window.addEventListener('resize', updateCoords);
    }

    return () => {
      window.removeEventListener('scroll', updateCoords, true);
      window.removeEventListener('resize', updateCoords);
    };
  }, [isOpen, usePortal]);

  const common = commonsI18n[language as Locale] || commonsI18n.id;
  const months = common.shortMonths;

  const activeLabels = {
    start: labels?.start || (language === 'id' ? 'Mulai' : 'Start'),
    end: labels?.end || (language === 'id' ? 'Selesai' : 'End'),
    apply: labels?.apply || (language === 'id' ? 'Terapkan' : 'Apply'),
  };

  const handleApply = () => {
    const startStr = `${tempStart.year}-${tempStart.month.toString().padStart(2, '0')}`;
    const endStr = `${tempEnd.year}-${tempEnd.month.toString().padStart(2, '0')}`;
    
    // Ensure start is before or equal to end
    const startDate = new Date(tempStart.year, tempStart.month - 1);
    const endDate = new Date(tempEnd.year, tempEnd.month - 1);
    
    if (startDate <= endDate) {
      onChange(startStr, endStr);
      setIsOpen(false);
    } else {
      // If start is after end, just swap them
      onChange(endStr, startStr);
      setIsOpen(false);
    }
  };

  const isMonthSelected = (year: number, monthIndex: number, type: 'start' | 'end') => {
    const temp = type === 'start' ? tempStart : tempEnd;
    return temp.year === year && temp.month === monthIndex + 1;
  };

  const isMonthInRange = (year: number, monthIndex: number) => {
    const date = new Date(year, monthIndex);
    const startDate = new Date(tempStart.year, tempStart.month - 1);
    const endDate = new Date(tempEnd.year, tempEnd.month - 1);
    
    // Make sure we compare correctly regardless of which is earlier
    const minDate = startDate <= endDate ? startDate : endDate;
    const maxDate = startDate <= endDate ? endDate : startDate;

    return date >= minDate && date <= maxDate;
  };

  const renderCalendar = (type: 'start' | 'end') => {
    const viewYear = type === 'start' ? viewYearStart : viewYearEnd;
    const setViewYear = type === 'start' ? setViewYearStart : setViewYearEnd;
    const setTemp = type === 'start' ? setTempStart : setTempEnd;

    return (
      <div className="flex-1 w-full sm:w-[220px]">
        {/* Header */}
        <div className="flex items-center justify-between px-2 mb-4">
          <button 
            type="button"
            onClick={() => setViewYear(v => v - 1)}
            className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm font-medium text-slate-800">{viewYear}</span>
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
            const selected = isMonthSelected(viewYear, index, type);
            const inRange = isMonthInRange(viewYear, index);
            
            return (
              <button
                type="button"
                key={monthStr}
                onClick={() => setTemp({ year: viewYear, month: index + 1 })}
                className={cn(
                  "py-2 text-xs font-medium rounded-lg transition-all border cursor-pointer",
                  selected 
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-200" 
                    : inRange 
                      ? "bg-indigo-50 text-indigo-700 border-indigo-100" 
                      : "bg-white text-slate-600 border-transparent hover:border-slate-200 hover:bg-slate-50"
                )}
              >
                {monthStr}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const dropdownContent = (
    <div 
      ref={dropdownRef}
      style={usePortal ? { 
        position: 'absolute', 
        top: coords.top, 
        left: coords.left, 
        zIndex: 9999 
      } : {}}
      className={cn(
        "bg-white rounded-2xl shadow-xl border border-slate-200 p-4 flex flex-col gap-4 animate-in fade-in slide-in-from-top-2",
        !usePortal && "absolute top-full left-0 mt-2 z-[100]"
      )}
    >
      <div className="flex flex-col sm:flex-row gap-6">
        {renderCalendar('start')}
        {renderCalendar('end')}
      </div>
      <div className="flex justify-end pt-3 border-t border-slate-100">
        <button
          type="button"
          onClick={handleApply}
          className="px-4 py-2 bg-indigo-600 text-white text-xs font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-sm cursor-pointer"
        >
          {activeLabels.apply}
        </button>
      </div>
    </div>
  );

  return (
    <div className={cn("relative inline-block", className)} ref={containerRef}>
      <button 
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between gap-3 bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-700 hover:border-slate-300 hover:bg-slate-50 focus:ring-2 focus:ring-indigo-500/20 shadow-sm transition-all active:scale-[0.98] w-full cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <Calendar size={16} className="text-slate-400" />
          <div className="flex items-center gap-2 text-left">
            <span>{startValue ? formatPeriod(startValue, language) : activeLabels.start}</span>
            <span className="text-slate-300 font-normal">—</span>
            <span>{endValue ? formatPeriod(endValue, language) : activeLabels.end}</span>
          </div>
        </div>
        <ChevronDown size={16} className={cn("text-slate-400 transition-transform duration-200", isOpen && "rotate-180")} />
      </button>

      {isOpen && (usePortal ? createPortal(dropdownContent, document.body) : dropdownContent)}
    </div>
  );
};


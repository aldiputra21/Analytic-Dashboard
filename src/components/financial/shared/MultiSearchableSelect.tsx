import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Search, X, Check } from 'lucide-react';
import { cn } from '../../../utils/cn';

interface Option {
  value: string;
  label: string;
  sublabel?: string;
}

interface MultiSearchableSelectProps {
  options: Option[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  label?: React.ReactNode;
  className?: string;
  error?: string;
  disabled?: boolean;
  size?: 'sm' | 'md';
  usePortal?: boolean;
  required?: boolean;
}

export const MultiSearchableSelect: React.FC<MultiSearchableSelectProps> = ({
  options, value = [], onChange, placeholder = 'Select options...', label, className, error, disabled,
  size = 'md', usePortal = true, required
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0, direction: 'down' as 'up' | 'down' });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node) &&
        dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const updateCoords = () => {
      if (isOpen && usePortal && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const dropdownHeight = 320;
        const spaceBelow = window.innerHeight - rect.bottom;
        const direction = (spaceBelow < dropdownHeight && rect.top > spaceBelow) ? 'up' : 'down';
        
        setCoords({
          top: direction === 'down' 
            ? rect.bottom + window.scrollY 
            : rect.top + window.scrollY,
          left: rect.left + window.scrollX,
          width: rect.width,
          direction
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

  const filteredOptions = options.filter(o =>
    o.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.sublabel?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleOption = (optionValue: string) => {
    if (value.includes(optionValue)) {
      onChange(value.filter(v => v !== optionValue));
    } else {
      onChange([...value, optionValue]);
    }
  };

  const removeValue = (e: React.MouseEvent, v: string) => {
    e.stopPropagation();
    onChange(value.filter(val => val !== v));
  };

  const dropdownContent = (
    <div
      ref={dropdownRef}
      style={usePortal ? {
        position: 'absolute',
        top: coords.top,
        left: coords.left,
        width: coords.width,
        zIndex: 9999,
        transform: coords.direction === 'up' ? 'translateY(-100%) translateY(-4px)' : 'none'
      } : {}}
      className={cn(
        "bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-100",
        usePortal ? (coords.direction === 'up' ? "origin-bottom" : "origin-top") : "absolute z-50 w-full mt-1 origin-top"
      )}
    >
      <div className="p-2 border-b border-slate-50 bg-slate-50/50">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            autoFocus
            className="w-full pl-8 pr-8 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            placeholder="Search..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-2 top-2 p-0.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
      <div className="max-h-60 overflow-y-auto py-1">
        {filteredOptions.length === 0 ? (
          <div className="px-4 py-3 text-xs text-slate-400 text-center italic">No results found</div>
        ) : (
          filteredOptions.map(option => {
            const isSelected = value.includes(option.value);
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => toggleOption(option.value)}
                className={cn(
                  "w-full text-left px-4 py-2 text-sm transition-colors flex items-center justify-between group",
                  isSelected ? "bg-indigo-50 text-indigo-700" : "hover:bg-slate-50"
                )}
              >
                <div className="flex flex-col">
                  <span className="font-medium">{option.label}</span>
                  {option.sublabel && <span className="text-[10px] opacity-60 font-medium">{option.sublabel}</span>}
                </div>
                {isSelected && <Check className="w-4 h-4 text-indigo-600" />}
              </button>
            );
          })
        )}
      </div>
    </div>
  );

  return (
    <div className={cn("relative space-y-1", className)} ref={containerRef}>
      {label && <label className="text-xs font-bold text-slate-700 uppercase tracking-tight flex items-center gap-1.5">{label} {required && <span className="text-red-500">*</span>}</label>}

      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={cn(
          "w-full flex items-center justify-between border rounded-lg transition-all min-h-[38px]",
          size === 'sm' ? "px-2 py-1 text-[11px]" : "px-3 py-1.5 text-sm",
          disabled ? "bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed" : "bg-white cursor-pointer",
          isOpen ? "ring-2 ring-indigo-500/20 border-indigo-500" : "border-slate-200 hover:border-slate-300",
          error && "border-red-500 ring-red-500/20"
        )}
      >
        <div className="flex flex-wrap gap-1 flex-1 min-w-0">
          {value.length > 0 ? (
            value.length <= 2 ? (
              value.map(v => {
                const opt = options.find(o => o.value === v);
                return (
                  <span key={v} className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded text-[11px] font-medium max-w-[120px]">
                    <span className="truncate">{opt?.label || v}</span>
                    <button onClick={(e) => removeValue(e, v)} className="hover:text-slate-900"><X className="w-2.5 h-2.5" /></button>
                  </span>
                );
              })
            ) : (
              <span className="text-indigo-700 font-bold px-1.5 py-0.5 bg-indigo-50 rounded text-[11px]">
                {value.length} Selected
              </span>
            )
          ) : (
            <span className="text-slate-400 truncate">{placeholder}</span>
          )}
        </div>
        <ChevronDown className={cn("text-slate-400 transition-transform flex-shrink-0 ml-2", size === 'sm' ? "w-3 h-3" : "w-4 h-4", isOpen && "rotate-180")} />
      </div>

      {isOpen && (usePortal ? createPortal(dropdownContent, document.body) : dropdownContent)}
      {error && <p className="text-[10px] font-bold text-red-600 mt-1 uppercase">{error}</p>}
    </div>
  );
};

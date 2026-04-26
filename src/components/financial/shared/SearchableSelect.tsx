// SearchableSelect.tsx - Reusable select with search clearing logic and portal support
import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Search, X } from 'lucide-react';
import { cn } from '../../../utils/cn';

interface Option {
  value: string;
  label: string;
  sublabel?: string;
}

interface SearchableSelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  className?: string;
  error?: string;
  disabled?: boolean;
  size?: 'sm' | 'md';
  usePortal?: boolean;
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({
  options, value, onChange, placeholder = 'Select an option...', label, className, error, disabled,
  size = 'md', usePortal = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });

  const selectedOption = options.find(o => o.value === value);

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
    if (isOpen && usePortal && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width
      });
    }
  }, [isOpen, usePortal]);

  const filteredOptions = options.filter(o => 
    o.label.toLowerCase().includes(searchTerm.toLowerCase()) || 
    o.sublabel?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const dropdownContent = (
    <div 
      ref={dropdownRef}
      style={usePortal ? { 
        position: 'absolute', 
        top: coords.top, 
        left: coords.left, 
        width: coords.width,
        zIndex: 9999 
      } : {}}
      className={cn(
        "bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-100 origin-top",
        !usePortal && "absolute z-50 w-full mt-1"
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
          filteredOptions.map(option => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
                setSearchTerm('');
              }}
              className={cn(
                "w-full text-left px-4 py-2 text-sm transition-colors flex flex-col",
                value === option.value ? "bg-indigo-50 text-indigo-700" : "hover:bg-slate-50"
              )}
            >
              <span className="font-medium">{option.label}</span>
              {option.sublabel && <span className="text-[10px] opacity-60 font-medium">{option.sublabel}</span>}
            </button>
          ))
        )}
      </div>
    </div>
  );

  return (
    <div className={cn("relative space-y-1", className)} ref={containerRef}>
      {label && <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider">{label}</label>}
      
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full flex items-center justify-between border rounded-lg transition-all",
          size === 'sm' ? "px-2 py-1 text-[11px]" : "px-3 py-2 text-sm",
          disabled ? "bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed" : "bg-white cursor-pointer",
          isOpen ? "ring-2 ring-indigo-500/20 border-indigo-500" : "border-slate-200 hover:border-slate-300",
          error && "border-red-500 ring-red-500/20"
        )}
      >
        <span className={cn("truncate", !selectedOption && "text-slate-400")}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown className={cn("text-slate-400 transition-transform", size === 'sm' ? "w-3 h-3" : "w-4 h-4", isOpen && "rotate-180")} />
      </button>

      {isOpen && (usePortal ? createPortal(dropdownContent, document.body) : dropdownContent)}
      {error && <p className="text-[10px] font-bold text-red-600 mt-1 uppercase">{error}</p>}
    </div>
  );
};

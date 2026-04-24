// SearchableSelect.tsx - Reusable select with search clearing logic
import React, { useState, useRef, useEffect } from 'react';
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
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({
  options, value, onChange, placeholder = 'Select an option...', label, className, error, disabled
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(o => o.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = options.filter(o => 
    o.label.toLowerCase().includes(searchTerm.toLowerCase()) || 
    o.sublabel?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={cn("relative space-y-1", className)} ref={containerRef}>
      {label && <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider">{label}</label>}
      
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full flex items-center justify-between px-3 py-2 text-sm border rounded-lg transition-all",
          disabled ? "bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed" : "bg-white cursor-pointer",
          isOpen ? "ring-2 ring-indigo-500/20 border-indigo-500" : "border-slate-200 hover:border-slate-300",
          error && "border-red-500 ring-red-500/20"
        )}
      >
        <span className={cn("truncate", !selectedOption && "text-slate-400")}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown className={cn("w-4 h-4 text-slate-400 transition-transform", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-100 origin-top">
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
      )}
      {error && <p className="text-[10px] font-bold text-red-600 mt-1 uppercase">{error}</p>}
    </div>
  );
};

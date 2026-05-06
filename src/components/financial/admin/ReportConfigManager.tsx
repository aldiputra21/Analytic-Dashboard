import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Plus, Search, Edit2, Trash2,
  ChevronLeft, ChevronRight, X, AlertCircle, CheckCircle2,
  RefreshCw, FilterX, FileSpreadsheet, Info, ArrowUp, ArrowDown,
  Upload, Code2, Tag, GripVertical, Eye,
  Download as DownloadIcon
} from 'lucide-react';
import { MultiSearchableSelect } from '../shared/MultiSearchableSelect';
import { SearchableSelect } from '../shared/SearchableSelect';
import { SqlQueryEditor } from './SqlQueryEditor';
import { QueryTestPanel } from './QueryTestPanel';
import { motion, AnimatePresence } from 'framer-motion';
import { apiFetch } from '../../../services/financial/apiFetch';
import { cn } from '../../../utils/cn';
import { useAuth } from '../../../hooks/financial/useAuth';
import { toast } from 'sonner';
import { getErrorMessage } from '../../../utils/errorUtils';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogHeader
} from '../../ui/alert-dialog';
import { reportConfigI18n } from '../../../i18n/report-config';
import { commonsI18n } from '../../../i18n/commons';
import type { ReportConfig, FilterConfig, ColumnConfig } from '../../../types/financial/reportConfig';
import { useRoles } from '../../../hooks/financial/useRoles';

// ─── Types ────────────────────────────────────────────────────────────────────

type ModalMode = 'create' | 'edit' | 'view';
type ActiveTab = 'basic' | 'filters' | 'query' | 'columns' | 'template';

interface FormData {
  titleId: string;
  titleEn: string;
  query: string;
  isActive: boolean;
  allowedRoles: string[];
  retentionType: 'immediate' | 'days';
  retentionDays: string;
  filters: FilterConfig[];
  columns: ColumnConfig[];
  templateFilename: string;       // original filename (display + stored in DB)
  cellInfoFilter: string;
  startRow: string;
  writeHeader: boolean;
}

const DEFAULT_FORM: FormData = {
  titleId: '',
  titleEn: '',
  query: '',
  isActive: true,
  allowedRoles: [],
  retentionType: 'days',
  retentionDays: '30',
  filters: [],
  columns: [],
  templateFilename: '',
  cellInfoFilter: '',
  startRow: '1',
  writeHeader: false,
};

const DEFAULT_FILTER: FilterConfig = {
  paramName: '',
  labelId: '',
  labelEn: '',
  type: 'text',
  order: 1,
  required: false,
};

const DEFAULT_COLUMN: ColumnConfig = {
  fieldName: '',
  order: 1,
  dataType: 'string',
  format: '',
  headerLabelId: '',
  headerLabelEn: '',
};

// ─── Modal Component ──────────────────────────────────────────────────────────

const Modal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[92vh]"
      >
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <div className="p-1.5 bg-indigo-100 text-indigo-600 rounded-lg">
              <FileSpreadsheet size={18} />
            </div>
            {title}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors cursor-pointer">
            <X size={20} className="text-slate-500" />
          </button>
        </div>
        <div className="flex-1 overflow-hidden flex flex-col">
          {children}
        </div>
      </motion.div>
    </div>
  );
};

// ─── Tab Bar ──────────────────────────────────────────────────────────────────

const TabBar: React.FC<{
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  tabs: { key: ActiveTab; label: string }[];
}> = ({ activeTab, onTabChange, tabs }) => (
  <div className="flex border-b border-slate-200 bg-slate-50/50 shrink-0">
    {tabs.map((tab) => (
      <button
        key={tab.key}
        type="button"
        onClick={() => onTabChange(tab.key)}
        className={cn(
          'px-5 py-3 text-xs font-black uppercase tracking-wider transition-all border-b-2 cursor-pointer',
          activeTab === tab.key
            ? 'border-indigo-600 text-indigo-700 bg-white'
            : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-white/50'
        )}
      >
        {tab.label}
      </button>
    ))}
  </div>
);

// ─── Inline Toggle ────────────────────────────────────────────────────────────

const InlineToggle: React.FC<{
  value: boolean;
  onChange: (v: boolean) => void;
  label: string;
  activeLabel: string;
  inactiveLabel: string;
  disabled?: boolean;
}> = ({ value, onChange, label, activeLabel, inactiveLabel, disabled }) => (
  <div className="flex items-center gap-3 bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-100 w-fit">
    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChange(!value)}
      className={cn(
        'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:cursor-not-allowed disabled:opacity-50',
        value ? 'bg-indigo-600' : 'bg-slate-200'
      )}
    >
      <span
        className={cn(
          'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
          value ? 'translate-x-5' : 'translate-x-0'
        )}
      />
    </button>
    <span className={cn('text-[10px] font-black uppercase tracking-widest', value ? 'text-indigo-600' : 'text-slate-400')}>
      {value ? activeLabel : inactiveLabel}
    </span>
  </div>
);


// ─── Dropdown Items List Editor ───────────────────────────────────────────────

const DropdownItemsEditor: React.FC<{
  items: Array<{ value: string; labelId: string; labelEn: string }>;
  onChange: (items: Array<{ value: string; labelId: string; labelEn: string }>) => void;
  language: 'id' | 'en';
}> = ({ items, onChange, language }) => {
  const t = reportConfigI18n[language];
  const tf = t.filters;

  // drag state
  const dragIdx = useRef<number | null>(null);
  const dragOverIdx = useRef<number | null>(null);

  const addItem = () => {
    onChange([...items, { value: '', labelId: '', labelEn: '' }]);
  };

  const removeItem = (idx: number) => {
    onChange(items.filter((_, i) => i !== idx));
  };

  const updateItem = (idx: number, field: 'value' | 'labelId' | 'labelEn', val: string) => {
    onChange(items.map((item, i) => (i === idx ? { ...item, [field]: val } : item)));
  };

  const handleDragStart = (idx: number) => {
    dragIdx.current = idx;
  };

  const handleDragEnter = (idx: number) => {
    dragOverIdx.current = idx;
  };

  const handleDragEnd = () => {
    if (dragIdx.current === null || dragOverIdx.current === null) return;
    if (dragIdx.current === dragOverIdx.current) {
      dragIdx.current = null;
      dragOverIdx.current = null;
      return;
    }
    const next = [...items];
    const [moved] = next.splice(dragIdx.current, 1);
    next.splice(dragOverIdx.current, 0, moved);
    onChange(next);
    dragIdx.current = null;
    dragOverIdx.current = null;
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-[10px] font-black text-slate-500 uppercase tracking-tight">{tf.dropdownItems}</label>
        <button
          type="button"
          onClick={addItem}
          className="flex items-center gap-1 px-2 py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-md text-[10px] font-black transition-all cursor-pointer border border-indigo-200/50"
        >
          <Plus size={11} />
          {language === 'id' ? 'Tambah Opsi' : 'Add Option'}
        </button>
      </div>

      {items.length === 0 ? (
        <div className="py-4 text-center text-slate-400 text-xs border-2 border-dashed border-slate-200 rounded-lg">
          {language === 'id' ? 'Belum ada opsi. Klik "Tambah Opsi".' : 'No options yet. Click "Add Option".'}
        </div>
      ) : (
        <div className="space-y-1.5">
          {/* Header row */}
          <div className="grid grid-cols-[20px_1fr_1fr_1fr_20px] gap-2 px-1">
            <div />
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Value</span>
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{tf.dropdownItemLabelId}</span>
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{tf.dropdownItemLabelEn}</span>
            <div />
          </div>

          {items.map((item, idx) => (
            <div
              key={idx}
              draggable
              onDragStart={() => handleDragStart(idx)}
              onDragEnter={() => handleDragEnter(idx)}
              onDragEnd={handleDragEnd}
              onDragOver={(e) => e.preventDefault()}
              className="grid grid-cols-[20px_1fr_1fr_1fr_20px] gap-2 items-center group"
            >
              <div className="flex items-center justify-center text-slate-300 group-hover:text-slate-400 cursor-grab active:cursor-grabbing">
                <GripVertical size={13} />
              </div>
              <input
                type="text"
                value={item.value}
                onChange={(e) => updateItem(idx, 'value', e.target.value)}
                placeholder={language === 'id' ? 'Contoh: 1' : 'e.g. 1'}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-mono"
              />
              <input
                type="text"
                value={item.labelId}
                onChange={(e) => updateItem(idx, 'labelId', e.target.value)}
                placeholder="Contoh: Opsi 1"
                className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
              />
              <input
                type="text"
                value={item.labelEn}
                onChange={(e) => updateItem(idx, 'labelEn', e.target.value)}
                placeholder="e.g. Option 1"
                className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
              />
              <button
                type="button"
                onClick={() => removeItem(idx)}
                className="flex items-center justify-center text-slate-300 hover:text-rose-500 transition-colors cursor-pointer"
              >
                <X size={13} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};


// ─── Filter Array Editor ──────────────────────────────────────────────────────

const FilterArrayEditor: React.FC<{
  filters: FilterConfig[];
  onChange: (filters: FilterConfig[]) => void;
  language: 'id' | 'en';
}> = ({ filters, onChange, language }) => {
  const t = reportConfigI18n[language];
  const tf = t.filters;

  // drag-drop state
  const dragIdx = useRef<number | null>(null);
  const dragOverIdx = useRef<number | null>(null);
  const [draggingIdx, setDraggingIdx] = useState<number | null>(null);

  const addFilter = () => {
    const newFilter: FilterConfig = {
      ...DEFAULT_FILTER,
      order: filters.length + 1,
    };
    onChange([...filters, newFilter]);
  };

  const removeFilter = (idx: number) => {
    const next = filters.filter((_, i) => i !== idx);
    // recalculate order
    onChange(next.map((f, i) => ({ ...f, order: i + 1 })));
  };

  const updateFilter = (idx: number, patch: Partial<FilterConfig>) => {
    onChange(filters.map((f, i) => (i === idx ? { ...f, ...patch } : f)));
  };

  const moveFilter = (idx: number, dir: 'up' | 'down') => {
    const next = [...filters];
    const target = dir === 'up' ? idx - 1 : idx + 1;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    // recalculate order
    onChange(next.map((f, i) => ({ ...f, order: i + 1 })));
  };

  const handleDragStart = (idx: number) => {
    dragIdx.current = idx;
    setDraggingIdx(idx);
  };

  const handleDragEnter = (idx: number) => {
    dragOverIdx.current = idx;
  };

  const handleDragEnd = () => {
    setDraggingIdx(null);
    if (dragIdx.current === null || dragOverIdx.current === null) return;
    if (dragIdx.current === dragOverIdx.current) {
      dragIdx.current = null;
      dragOverIdx.current = null;
      return;
    }
    const next = [...filters];
    const [moved] = next.splice(dragIdx.current, 1);
    next.splice(dragOverIdx.current, 0, moved);
    // recalculate order
    onChange(next.map((f, i) => ({ ...f, order: i + 1 })));
    dragIdx.current = null;
    dragOverIdx.current = null;
  };

  const filterTypeOptions = [
    { value: 'text', label: tf.typeText },
    { value: 'date', label: tf.typeDate },
    { value: 'date_range', label: tf.typeDateRange },
    { value: 'numeric', label: tf.typeNumeric },
    { value: 'numeric_range', label: tf.typeNumericRange },
    { value: 'dropdown', label: tf.typeDropdown },
    { value: 'month', label: tf.typeMonth },
    { value: 'month_range', label: tf.typeMonthRange },
  ];

  const dropdownSourceOptions = [
    { value: 'json', label: tf.dropdownSourceJson },
    { value: 'query', label: tf.dropdownSourceQuery },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-black text-slate-600 uppercase tracking-wider">{tf.sectionTitle}</h4>
        <button
          type="button"
          onClick={addFilter}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg text-xs font-black transition-all cursor-pointer border border-indigo-200/50"
        >
          <Plus size={13} />
          {tf.addFilter}
        </button>
      </div>

      {filters.length === 0 ? (
        <div className="py-8 text-center text-slate-400 text-sm border-2 border-dashed border-slate-200 rounded-xl">
          {tf.noFilters}
        </div>
      ) : (
        <div className="space-y-3">
          {filters.map((filter, idx) => (
            <div
              key={idx}
              draggable
              onDragStart={() => handleDragStart(idx)}
              onDragEnter={() => handleDragEnter(idx)}
              onDragEnd={handleDragEnd}
              onDragOver={(e) => e.preventDefault()}
              className={cn(
                'border rounded-xl p-4 bg-slate-50/50 space-y-3 transition-all',
                draggingIdx === idx
                  ? 'opacity-40 border-indigo-300 bg-indigo-50/30'
                  : 'border-slate-200 hover:border-slate-300'
              )}
            >
              <div className="flex items-center justify-between">
                {/* Drag handle + order badge */}
                <div className="flex items-center gap-2">
                  <div className="text-slate-300 hover:text-slate-500 cursor-grab active:cursor-grabbing transition-colors">
                    <GripVertical size={16} />
                  </div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    #{idx + 1}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button type="button" onClick={() => moveFilter(idx, 'up')} disabled={idx === 0} className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed">
                    <ArrowUp size={14} />
                  </button>
                  <button type="button" onClick={() => moveFilter(idx, 'down')} disabled={idx === filters.length - 1} className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed">
                    <ArrowDown size={14} />
                  </button>
                  <button type="button" onClick={() => removeFilter(idx)} className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-tight">{tf.paramName} *</label>
                  <input
                    type="text"
                    value={filter.paramName}
                    onChange={(e) => updateFilter(idx, { paramName: e.target.value })}
                    placeholder={tf.paramNamePlaceholder}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                  />
                  <p className="text-[9px] text-slate-400">{tf.paramNameHint}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-tight">{tf.labelId} *</label>
                  <input
                    type="text"
                    value={filter.labelId}
                    onChange={(e) => updateFilter(idx, { labelId: e.target.value })}
                    placeholder={tf.labelIdPlaceholder}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-tight">{tf.labelEn} *</label>
                  <input
                    type="text"
                    value={filter.labelEn}
                    onChange={(e) => updateFilter(idx, { labelEn: e.target.value })}
                    placeholder={tf.labelEnPlaceholder}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-12 gap-3 items-end">
                <div className="col-span-4 space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-tight">{tf.type} *</label>
                  <SearchableSelect
                    options={filterTypeOptions}
                    value={filter.type}
                    onChange={(val) => updateFilter(idx, {
                      type: val as FilterConfig['type'],
                      // Set default dropdownSource when switching to dropdown type
                      ...(val === 'dropdown' && !filter.dropdownSource ? { dropdownSource: 'json' } : {}),
                    })}
                    placeholder={tf.typePlaceholder}
                    size="sm"
                  />
                </div>
                {/* Required: toggle */}
                <div className="col-span-4 flex items-center gap-2 pt-4">
                  <button
                    type="button"
                    onClick={() => updateFilter(idx, { required: !(filter.required ?? false) })}
                    className={cn(
                      'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none',
                      (filter.required ?? false) ? 'bg-indigo-600' : 'bg-slate-200'
                    )}
                  >
                    <span
                      className={cn(
                        'pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
                        (filter.required ?? false) ? 'translate-x-4' : 'translate-x-0'
                      )}
                    />
                  </button>
                  <span className={cn('text-xs font-bold', (filter.required ?? false) ? 'text-indigo-600' : 'text-slate-400')}>
                    {tf.required}
                  </span>
                </div>
              </div>

              {filter.type === 'dropdown' && (
                <div className="space-y-3 pt-2 border-t border-slate-200">
                  <div className="col-span-4 space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-tight">{tf.dropdownSource}</label>
                    <SearchableSelect
                      options={dropdownSourceOptions}
                      value={filter.dropdownSource ?? 'json'}
                      onChange={(val) => updateFilter(idx, { dropdownSource: val as 'json' | 'query' })}
                      size="sm"
                    />
                  </div>
                  {(filter.dropdownSource ?? 'json') === 'json' ? (
                    <DropdownItemsEditor
                      items={filter.dropdownItems ?? []}
                      onChange={(items) => updateFilter(idx, { dropdownItems: items })}
                      language={language}
                    />
                  ) : (
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-tight">{tf.dropdownQuery}</label>
                      <textarea
                        value={filter.dropdownQuery ?? ''}
                        onChange={(e) => updateFilter(idx, { dropdownQuery: e.target.value })}
                        placeholder={tf.dropdownQueryPlaceholder}
                        rows={3}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all resize-none"
                      />
                      <p className="text-[9px] text-slate-400 italic">
                        {tf.dropdownQueryHint}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};


// ─── Column Array Editor ──────────────────────────────────────────────────────

const ColumnArrayEditor: React.FC<{
  columns: ColumnConfig[];
  onChange: (columns: ColumnConfig[]) => void;
  language: 'id' | 'en';
  writeHeader: boolean;
}> = ({ columns, onChange, language, writeHeader }) => {
  const t = reportConfigI18n[language];
  const tc = t.columns;

  // drag-drop state
  const dragIdx = useRef<number | null>(null);
  const dragOverIdx = useRef<number | null>(null);
  const [draggingIdx, setDraggingIdx] = useState<number | null>(null);

  const addColumn = () => {
    const newCol: ColumnConfig = {
      ...DEFAULT_COLUMN,
      order: columns.length + 1,
    };
    onChange([...columns, newCol]);
  };

  const removeColumn = (idx: number) => {
    const next = columns.filter((_, i) => i !== idx);
    onChange(next.map((c, i) => ({ ...c, order: i + 1 })));
  };

  const updateColumn = (idx: number, patch: Partial<ColumnConfig>) => {
    onChange(columns.map((c, i) => (i === idx ? { ...c, ...patch } : c)));
  };

  const moveColumn = (idx: number, dir: 'up' | 'down') => {
    const next = [...columns];
    const target = dir === 'up' ? idx - 1 : idx + 1;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    onChange(next.map((c, i) => ({ ...c, order: i + 1 })));
  };

  const handleDragStart = (idx: number) => {
    dragIdx.current = idx;
    setDraggingIdx(idx);
  };

  const handleDragEnter = (idx: number) => {
    dragOverIdx.current = idx;
  };

  const handleDragEnd = () => {
    setDraggingIdx(null);
    if (dragIdx.current === null || dragOverIdx.current === null) return;
    if (dragIdx.current === dragOverIdx.current) {
      dragIdx.current = null;
      dragOverIdx.current = null;
      return;
    }
    const next = [...columns];
    const [moved] = next.splice(dragIdx.current, 1);
    next.splice(dragOverIdx.current, 0, moved);
    onChange(next.map((c, i) => ({ ...c, order: i + 1 })));
    dragIdx.current = null;
    dragOverIdx.current = null;
  };

  const dataTypeOptions = [
    { value: 'string', label: tc.dataTypeString },
    { value: 'number', label: tc.dataTypeNumber },
    { value: 'date', label: tc.dataTypeDate },
    { value: 'currency', label: tc.dataTypeCurrency },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-black text-slate-600 uppercase tracking-wider">{tc.sectionTitle}</h4>
        <button
          type="button"
          onClick={addColumn}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg text-xs font-black transition-all cursor-pointer border border-indigo-200/50"
        >
          <Plus size={13} />
          {tc.addColumn}
        </button>
      </div>

      {columns.length === 0 ? (
        <div className="py-8 text-center text-slate-400 text-sm border-2 border-dashed border-slate-200 rounded-xl">
          {tc.noColumns}
        </div>
      ) : (
        <div className="space-y-3">
          {columns.map((col, idx) => (
            <div
              key={idx}
              draggable
              onDragStart={() => handleDragStart(idx)}
              onDragEnter={() => handleDragEnter(idx)}
              onDragEnd={handleDragEnd}
              onDragOver={(e) => e.preventDefault()}
              className={cn(
                'border rounded-xl p-4 bg-slate-50/50 space-y-3 transition-all',
                draggingIdx === idx
                  ? 'opacity-40 border-indigo-300 bg-indigo-50/30'
                  : 'border-slate-200 hover:border-slate-300'
              )}
            >
              <div className="flex items-center justify-between">
                {/* Drag handle + order badge */}
                <div className="flex items-center gap-2">
                  <div className="text-slate-300 hover:text-slate-500 cursor-grab active:cursor-grabbing transition-colors">
                    <GripVertical size={16} />
                  </div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    #{idx + 1}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button type="button" onClick={() => moveColumn(idx, 'up')} disabled={idx === 0} className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed">
                    <ArrowUp size={14} />
                  </button>
                  <button type="button" onClick={() => moveColumn(idx, 'down')} disabled={idx === columns.length - 1} className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed">
                    <ArrowDown size={14} />
                  </button>
                  <button type="button" onClick={() => removeColumn(idx)} className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-12 gap-3">
                <div className="col-span-5 space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-tight">{tc.fieldName} *</label>
                  <input
                    type="text"
                    value={col.fieldName}
                    onChange={(e) => updateColumn(idx, { fieldName: e.target.value })}
                    placeholder={tc.fieldNamePlaceholder}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                  />
                </div>
                <div className="col-span-4 space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-tight">{tc.dataType} *</label>
                  <SearchableSelect
                    options={dataTypeOptions}
                    value={col.dataType}
                    onChange={(val) => updateColumn(idx, { dataType: val as ColumnConfig['dataType'] })}
                    placeholder={tc.dataTypePlaceholder}
                    size="sm"
                  />
                </div>
                <div className="col-span-3 space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-tight">{tc.format}</label>
                  <input
                    type="text"
                    value={col.format ?? ''}
                    onChange={(e) => updateColumn(idx, { format: e.target.value })}
                    placeholder={tc.formatPlaceholder}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                  />
                </div>
              </div>

              {/* Header labels — only shown when writeHeader is on (controlled at config level) */}
              {writeHeader && (
                <div className="grid grid-cols-12 gap-3">
                  <div className="col-span-6 space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-tight">{tc.headerLabelId} *</label>
                    <input
                      type="text"
                      value={col.headerLabelId ?? ''}
                      onChange={(e) => updateColumn(idx, { headerLabelId: e.target.value })}
                      placeholder={tc.headerLabelIdPlaceholder}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                    />
                  </div>
                  <div className="col-span-6 space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-tight">{tc.headerLabelEn} *</label>
                    <input
                      type="text"
                      value={col.headerLabelEn ?? ''}
                      onChange={(e) => updateColumn(idx, { headerLabelEn: e.target.value })}
                      placeholder={tc.headerLabelEnPlaceholder}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};


// ─── Main Component ───────────────────────────────────────────────────────────

export const ReportConfigManager: React.FC = () => {
  const { hasPermission, language } = useAuth();
  const t = reportConfigI18n[language];
  const common = commonsI18n[language];

  const canWrite = hasPermission('public.report_configs.write');
  const canDelete = hasPermission('public.report_configs.delete');

  // ── Data State ──────────────────────────────────────────────────────────────
  const [data, setData] = useState<ReportConfig[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── Filters ─────────────────────────────────────────────────────────────────
  const [filterSearch, setFilterSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');

  // ── Pagination ──────────────────────────────────────────────────────────────
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // ── Modal ───────────────────────────────────────────────────────────────────
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>('create');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>('basic');
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<FormData>(DEFAULT_FORM);

  // ── Delete ──────────────────────────────────────────────────────────────────
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // ── Template ────────────────────────────────────────────────────────────────
  const [templateFile, setTemplateFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);

  // ── Query textarea ref (for cursor-based param insertion) ───────────────────
  const queryTextareaRef = useRef<HTMLTextAreaElement>(null);

  // ── Roles ───────────────────────────────────────────────────────────────────
  const { data: roles = [] } = useRoles({ isActive: true, pageSize: 200 });
  const roleOptions = roles.map((r) => ({ value: r.name, label: r.name, sublabel: r.scope }));

  // ── Fetch template path from system_configs ─────────────────────────────────
  const [templatePath, setTemplatePath] = useState<string>('');
  useEffect(() => {
    apiFetch('/api/frs/report-configs/template-path')
      .then((res) => res.ok ? res.json() : null)
      .then((d) => { if (d?.path) setTemplatePath(d.path); })
      .catch(() => { /* silently ignore — UI falls back to default */ });
  }, []); // apiFetch is stable — safe to omit from deps

  // ── Fetch Data ──────────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (appliedSearch) params.set('search', appliedSearch);
      params.set('page', currentPage.toString());
      params.set('pageSize', pageSize.toString());

      const res = await apiFetch(`/api/frs/report-configs?${params.toString()}`);
      if (res.ok) {
        const d = await res.json();
        setData(d.data || []);
        setTotalCount(d.total || 0);
      } else {
        const errData = await res.json();
        throw errData;
      }
    } catch (err: unknown) {
      const e = err as { error?: { code?: string }; code?: string };
      const errCode = e.error?.code || e.code || 'NETWORK_ERROR';
      setError(getErrorMessage(errCode, language));
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, pageSize, appliedSearch, language]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleApplyFilter = () => {
    setAppliedSearch(filterSearch);
    setCurrentPage(1);
  };

  const handleClearFilter = () => {
    setFilterSearch('');
    setAppliedSearch('');
    setCurrentPage(1);
  };

  // ── Open Modal ──────────────────────────────────────────────────────────────
  const openModal = (mode: ModalMode, item?: ReportConfig) => {
    setModalMode(mode);
    setActiveTab('basic');
    setTemplateFile(null);
    if (item) {
      setEditingId(item.id);
      setFormData({
        titleId: item.titleId,
        titleEn: item.titleEn,
        query: item.query,
        isActive: item.isActive,
        allowedRoles: item.allowedRoles,
        retentionType: (item.retentionType as 'immediate' | 'days') ?? 'days',
        retentionDays: item.retentionDays?.toString() ?? '30',
        filters: item.filters ?? [],
        columns: item.columns ?? [],
        templateFilename: item.templateFilename ?? '',
        cellInfoFilter: item.cellInfoFilter ?? '',
        startRow: item.startRow?.toString() ?? '1',
        writeHeader: item.writeHeader ?? false,
      });
    } else {
      setEditingId(null);
      setFormData({ ...DEFAULT_FORM });
    }
    setIsModalOpen(true);
  };

  // ── Save ────────────────────────────────────────────────────────────────────
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;

    // Basic validation
    if (!formData.titleId.trim()) {
      toast.error(t.validation.titleIdRequired);
      setActiveTab('basic');
      return;
    }
    if (!formData.titleEn.trim()) {
      toast.error(t.validation.titleEnRequired);
      setActiveTab('basic');
      return;
    }
    if (!formData.query.trim()) {
      toast.error(t.validation.queryRequired);
      setActiveTab('query');
      return;
    }
    if (formData.columns.length === 0) {
      toast.error(t.validation.columnsMinOne);
      setActiveTab('columns');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        titleId: formData.titleId,
        titleEn: formData.titleEn,
        query: formData.query,
        isActive: formData.isActive,
        allowedRoles: formData.allowedRoles,
        retentionType: formData.retentionType,
        retentionDays: formData.retentionType === 'days' ? parseInt(formData.retentionDays) || 30 : undefined,
        filters: formData.filters,
        columns: formData.columns,
        templateFilename: formData.templateFilename || undefined,
        cellInfoFilter: formData.cellInfoFilter || undefined,
        startRow: parseInt(formData.startRow) || 1,
        writeHeader: formData.writeHeader,
      };

      const url = editingId ? `/api/frs/report-configs/${editingId}` : '/api/frs/report-configs';
      const method = editingId ? 'PUT' : 'POST';

      const res = await apiFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const saved = await res.json();

        // Upload template file if selected
        if (templateFile && (saved.id || editingId)) {
          const configId = saved.id || editingId;
          const formDataUpload = new FormData();
          formDataUpload.append('template', templateFile);
          const uploadRes = await apiFetch(`/api/frs/report-configs/${configId}/parse-template`, {
            method: 'POST',
            body: formDataUpload,
          });
          if (uploadRes.ok) {
            const parsed = await uploadRes.json();
            if (parsed.startRow || parsed.templateFilename) {
              // Save original filename to DB; disk file is template-{id}.{ext}
              await apiFetch(`/api/frs/report-configs/${configId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  startRow: parsed.startRow,
                  templateFilename: parsed.templateFilename, // original name
                }),
              });
              setFormData((p) => ({ ...p, templateFilename: parsed.templateFilename ?? p.templateFilename }));
            }
          } else {
            toast.error(t.alerts.errorUploadTemplate);
          }
        }

        toast.success(modalMode === 'create' ? t.alerts.successCreate : t.alerts.successUpdate);
        setIsModalOpen(false);
        fetchData();
      } else {
        const errData = await res.json();
        throw errData;
      }
    } catch (err: unknown) {
      const e = err as { error?: { code?: string; message?: string }; code?: string; message?: string };
      const errCode = e.error?.code || e.code || 'NETWORK_ERROR';
      const errMsg = e.error?.message || e.message;
      if (errMsg) {
        toast.error(errMsg);
      } else {
        toast.error(getErrorMessage(errCode, language));
      }
    } finally {
      setIsSaving(false);
    }
  };

  // ── Toggle Status ───────────────────────────────────────────────────────────
  const handleToggleStatus = async (config: ReportConfig) => {
    try {
      const res = await apiFetch(`/api/frs/report-configs/${config.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !config.isActive }),
      });
      if (res.ok) {
        toast.success(config.isActive ? t.alerts.successToggleInactive : t.alerts.successToggleActive);
        fetchData();
      } else {
        const errData = await res.json();
        throw errData;
      }
    } catch (err: unknown) {
      const e = err as { error?: { code?: string }; code?: string };
      const errCode = e.error?.code || e.code || 'NETWORK_ERROR';
      toast.error(getErrorMessage(errCode, language));
    }
  };

  // ── Delete ──────────────────────────────────────────────────────────────────
  const handleDelete = async (id: string) => {
    setIsDeleting(true);
    try {
      const res = await apiFetch(`/api/frs/report-configs/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success(t.alerts.successDelete);
        setDeleteConfirmId(null);
        fetchData();
      } else {
        const errData = await res.json();
        throw errData;
      }
    } catch (err: unknown) {
      const e = err as { error?: { code?: string }; code?: string };
      const errCode = e.error?.code || e.code || 'NETWORK_ERROR';
      toast.error(getErrorMessage(errCode, language));
      setDeleteConfirmId(null);
    } finally {
      setIsDeleting(false);
    }
  };

  // ── Parse Template ──────────────────────────────────────────────────────────
  const handleParseTemplate = async () => {
    if (!templateFile || !editingId) return;
    setIsParsing(true);
    try {
      const fd = new FormData();
      fd.append('template', templateFile);
      const res = await apiFetch(`/api/frs/report-configs/${editingId}/parse-template`, {
        method: 'POST',
        body: fd,
      });
      if (res.ok) {
        const d = await res.json();
        if (d.startRow) {
          setFormData((prev) => ({ ...prev, startRow: d.startRow.toString() }));
          toast.success(`Start row detected: ${d.startRow}`);
        }
      } else {
        toast.error(t.alerts.errorParseTemplate);
      }
    } catch {
      toast.error(t.alerts.errorParseTemplate);
    } finally {
      setIsParsing(false);
    }
  };

  // ── Insert param at cursor ──────────────────────────────────────────────────
  const insertParamAtCursor = useCallback((paramName: string) => {
    const textarea = queryTextareaRef.current;
    const placeholder = `\${${paramName}}`;
    if (!textarea) {
      setFormData((p) => ({ ...p, query: p.query + placeholder }));
      return;
    }
    const start = textarea.selectionStart ?? textarea.value.length;
    const end = textarea.selectionEnd ?? textarea.value.length;
    const before = textarea.value.substring(0, start);
    const after = textarea.value.substring(end);
    const newQuery = before + placeholder + after;
    setFormData((p) => ({ ...p, query: newQuery }));
    // Restore focus and cursor position after React re-render
    requestAnimationFrame(() => {
      textarea.focus();
      const newPos = start + placeholder.length;
      textarea.setSelectionRange(newPos, newPos);
    });
  }, []);

  const totalPages = Math.ceil(totalCount / pageSize);

  const tabs = [
    { key: 'basic' as ActiveTab, label: t.modal.tabBasicInfo },
    { key: 'filters' as ActiveTab, label: t.modal.tabFilters },
    { key: 'query' as ActiveTab, label: t.modal.tabQuery },
    { key: 'columns' as ActiveTab, label: t.modal.tabColumns },
    { key: 'template' as ActiveTab, label: t.modal.tabTemplate },
  ];

  const isViewMode = modalMode === 'view';

  const retentionTypeOptions = [
    { value: 'immediate', label: t.form.retentionTypeImmediate },
    { value: 'days', label: t.form.retentionTypeDays },
  ];


  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-100">
              <FileSpreadsheet size={24} />
            </div>
            {t.manager.title}
          </h2>
          <p className="text-sm text-slate-500 mt-1 flex items-center gap-1.5 ml-1">
            <Info size={14} className="text-indigo-400" />
            {t.manager.subtitle}
          </p>
        </div>
        {canWrite && (
          <button
            onClick={() => openModal('create')}
            className="group px-4 py-2 text-sm font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-lg shadow-indigo-100 active:scale-95 cursor-pointer"
          >
            <Plus size={18} className="group-hover:rotate-90 transition-transform duration-300" />
            {t.manager.addNew}
          </button>
        )}
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200/60 flex flex-wrap items-center gap-4">
        <div className="flex-1 min-w-[240px] relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
          <input
            type="text"
            placeholder={common.search}
            value={filterSearch}
            onChange={(e) => setFilterSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleApplyFilter()}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleApplyFilter}
            className="flex items-center gap-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-4 py-2 rounded-xl text-xs font-black transition-all active:scale-95 border border-indigo-200/50 cursor-pointer"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
            {common.apply}
          </button>
          <button
            onClick={handleClearFilter}
            className="flex items-center gap-2 bg-slate-50 text-slate-500 hover:bg-slate-100 px-4 py-2 rounded-xl text-xs font-black transition-all active:scale-95 border border-slate-200/50 cursor-pointer"
          >
            <FilterX size={14} />
            {common.clear}
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">{t.table.reportTitle}</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">{t.table.allowedRoles}</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">{common.status}</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">{common.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              <AnimatePresence>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <motion.tr key={`skeleton-${i}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="animate-pulse">
                      <td className="px-6 py-4"><div className="h-4 bg-slate-200 rounded w-40 mb-1" /><div className="h-3 bg-slate-200 rounded w-32" /></td>
                      <td className="px-6 py-4"><div className="h-5 bg-slate-200 rounded-full w-32" /></td>
                      <td className="px-6 py-4"><div className="h-6 bg-slate-200 rounded-full w-20" /></td>
                      <td className="px-6 py-4"><div className="h-8 bg-slate-200 rounded w-20 ml-auto" /></td>
                    </motion.tr>
                  ))
                ) : error ? (
                  <motion.tr key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <td colSpan={4}>
                      <div className="py-20 flex flex-col items-center justify-center gap-4 text-center">
                        <div className="p-4 bg-red-50 rounded-full text-red-400 border border-red-100">
                          <AlertCircle size={48} />
                        </div>
                        <div>
                          <p className="text-slate-800 font-bold text-lg">{common.errorLoadTable}</p>
                          <p className="text-slate-500 text-sm mt-1 max-w-xs mx-auto">{error}</p>
                          <button
                            onClick={() => fetchData()}
                            className="mt-6 px-6 py-2.5 bg-indigo-600 text-white text-xs font-black rounded-xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 cursor-pointer flex items-center gap-2 mx-auto"
                          >
                            <RefreshCw size={14} />
                            {common.retry}
                          </button>
                        </div>
                      </div>
                    </td>
                  </motion.tr>
                ) : data.length === 0 ? (
                  <motion.tr key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <td colSpan={4}>
                      <div className="py-20 flex flex-col items-center justify-center gap-4 text-center">
                        <div className="p-4 bg-slate-50 rounded-full text-slate-300">
                          <FileSpreadsheet size={48} />
                        </div>
                        <div>
                          <p className="text-slate-800 font-bold text-lg">{t.table.empty}</p>
                          <p className="text-slate-500 text-sm mt-1">{t.table.emptyDesc}</p>
                        </div>
                      </div>
                    </td>
                  </motion.tr>
                ) : (
                  data.map((config, idx) => (
                    <motion.tr
                      key={config.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: idx * 0.03 }}
                      className="hover:bg-slate-50/50 transition-colors group font-bold"
                    >
                      <td className="px-6 py-4 text-slate-800">
                        <div className="flex flex-col">
                          <span className="text-sm font-black">{language === 'id' ? config.titleId : config.titleEn}</span>
                          <span className="text-[10px] font-bold text-slate-400">{language === 'id' ? config.titleEn : config.titleId}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {config.allowedRoles && config.allowedRoles.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {config.allowedRoles.slice(0, 3).map((role) => (
                              <span
                                key={role}
                                className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-full text-[10px] font-black"
                              >
                                <Tag size={9} />
                                {role}
                              </span>
                            ))}
                            {config.allowedRoles.length > 3 && (
                              <span className="inline-flex items-center px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full text-[10px] font-black">
                                +{config.allowedRoles.length - 3}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {canWrite ? (
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(config)}
                            className={cn(
                              'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black tracking-wider uppercase border cursor-pointer transition-all hover:opacity-80',
                              config.isActive
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                : 'bg-slate-50 text-slate-500 border-slate-100'
                            )}
                            title={config.isActive ? common.deactivate : common.activate}
                          >
                            <div className={cn('w-1.5 h-1.5 rounded-full', config.isActive ? 'bg-emerald-500' : 'bg-slate-400')} />
                            {config.isActive ? common.active : common.inactive}
                          </button>
                        ) : (
                          <div className={cn(
                            'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black tracking-wider uppercase border',
                            config.isActive
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                              : 'bg-slate-50 text-slate-500 border-slate-100'
                          )}>
                            <div className={cn('w-1.5 h-1.5 rounded-full', config.isActive ? 'bg-emerald-500' : 'bg-slate-400')} />
                            {config.isActive ? common.active : common.inactive}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => openModal('view', config)}
                            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all cursor-pointer"
                            title={common.view}
                          >
                            <Eye size={16} />
                          </button>
                          {canWrite && (
                            <button
                              onClick={() => openModal('edit', config)}
                              className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all cursor-pointer"
                              title={common.edit}
                            >
                              <Edit2 size={16} />
                            </button>
                          )}
                          {canDelete && (
                            <button
                              onClick={() => setDeleteConfirmId(config.id)}
                              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                              title={common.delete}
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!isLoading && totalCount > 0 && (
          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/30 flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <span className="text-xs font-bold text-slate-500">
                {common.pagination.showing}{' '}
                <span className="text-slate-800 mx-0.5">{Math.min(totalCount, (currentPage - 1) * pageSize + 1)}</span>
                {' '}-{' '}
                <span className="text-slate-800 mx-0.5">{Math.min(totalCount, currentPage * pageSize)}</span>
                {' '}{common.pagination.of}{' '}
                <span className="text-slate-800 mx-0.5">{totalCount}</span>
                {' '}{common.pagination.entries}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{common.pagination.rowsPerPage}</span>
                <select
                  value={pageSize}
                  onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                  className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all cursor-pointer shadow-sm hover:border-slate-300"
                >
                  {[10, 25, 50, 100].map((size) => (
                    <option key={size} value={size}>{size}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className={cn('p-2 rounded-lg transition-all', currentPage === 1 ? 'text-slate-300 cursor-not-allowed' : 'text-slate-600 hover:bg-white hover:shadow-sm active:scale-90 cursor-pointer')}
              >
                <ChevronLeft size={16} />
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum = i + 1;
                  if (totalPages > 5 && currentPage > 3) {
                    pageNum = currentPage - 2 + i;
                    if (pageNum + (4 - i) > totalPages) pageNum = totalPages - 4 + i;
                  }
                  if (pageNum > 0 && pageNum <= totalPages) {
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={cn(
                          'w-8 h-8 flex items-center justify-center rounded-lg text-xs font-black transition-all',
                          currentPage === pageNum
                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100 scale-110 cursor-pointer'
                            : 'bg-white text-slate-600 border border-slate-200 hover:border-indigo-300 cursor-pointer'
                        )}
                      >
                        {pageNum}
                      </button>
                    );
                  }
                  return null;
                })}
              </div>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className={cn('p-2 rounded-lg transition-all', currentPage === totalPages ? 'text-slate-300 cursor-not-allowed' : 'text-slate-600 hover:bg-white hover:shadow-sm active:scale-90 cursor-pointer')}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>


      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <Modal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            title={modalMode === 'create' ? t.modal.createTitle : modalMode === 'view' ? t.modal.viewTitle : t.modal.editTitle}
          >
            <form onSubmit={handleSave} noValidate className="flex-1 overflow-hidden flex flex-col">
              <TabBar activeTab={activeTab} onTabChange={setActiveTab} tabs={tabs} />

              <div className={cn('flex-1 overflow-y-auto p-6 space-y-6', isViewMode && 'pointer-events-none select-none opacity-80')}>

                {/* ── Tab: Info Dasar ── */}
                {activeTab === 'basic' && (
                  <div className="space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-tight">{t.form.titleId} *</label>
                        <input
                          type="text"
                          value={formData.titleId}
                          onChange={(e) => setFormData((p) => ({ ...p, titleId: e.target.value }))}
                          placeholder={t.form.titleIdPlaceholder}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-sm"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-tight">{t.form.titleEn} *</label>
                        <input
                          type="text"
                          value={formData.titleEn}
                          onChange={(e) => setFormData((p) => ({ ...p, titleEn: e.target.value }))}
                          placeholder={t.form.titleEnPlaceholder}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-sm"
                        />
                      </div>
                    </div>

                    <InlineToggle
                      value={formData.isActive}
                      onChange={(v) => setFormData((p) => ({ ...p, isActive: v }))}
                      label={t.form.isActive}
                      activeLabel={common.active}
                      inactiveLabel={common.inactive}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-tight">{t.form.retentionType}</label>
                        <SearchableSelect
                          options={retentionTypeOptions}
                          value={formData.retentionType}
                          onChange={(val) => setFormData((p) => ({ ...p, retentionType: val as 'immediate' | 'days' }))}
                        />
                      </div>
                      {formData.retentionType === 'days' && (
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-tight">{t.form.retentionDays}</label>
                          <input
                            type="number"
                            min={1}
                            value={formData.retentionDays}
                            onChange={(e) => setFormData((p) => ({ ...p, retentionDays: e.target.value }))}
                            placeholder={t.form.retentionDaysPlaceholder}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-sm"
                          />
                        </div>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-tight">{t.form.allowedRoles}</label>
                      <MultiSearchableSelect
                        options={roleOptions}
                        value={formData.allowedRoles}
                        onChange={(val) => setFormData((p) => ({ ...p, allowedRoles: val }))}
                        placeholder={t.form.allowedRolesPlaceholder}
                      />
                    </div>
                  </div>
                )}

                {/* ── Tab: Filter ── */}
                {activeTab === 'filters' && (
                  <FilterArrayEditor
                    filters={formData.filters}
                    onChange={(filters) => setFormData((p) => ({ ...p, filters }))}
                    language={language}
                  />
                )}

                {/* ── Tab: Query SQL ── */}
                {activeTab === 'query' && (
                  <div className="space-y-5">
                    {/* Parameter buttons panel — always shown */}
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="p-1 bg-indigo-100 text-indigo-600 rounded-md">
                          <Tag size={13} />
                        </div>
                        <div>
                          <p className="text-xs font-black text-slate-700 uppercase tracking-wider">{t.form.queryParamsTitle}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">{t.form.queryParamsHint}</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {/* ${WHERE} — special built-in parameter, always first */}
                        <button
                          type="button"
                          onClick={() => insertParamAtCursor('WHERE')}
                          className={cn(
                            'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition-all border cursor-pointer',
                            'bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100 hover:border-amber-400 hover:shadow-sm active:scale-95'
                          )}
                          title={language === 'id'
                            ? 'Sisipkan ${WHERE} — akan di-generate otomatis dari semua filter aktif (AND), atau "1=1" jika tidak ada filter'
                            : 'Insert ${WHERE} — auto-generated from all active filters (AND), or "1=1" if none'}
                        >
                          <Code2 size={11} />
                          <span className="font-mono">{`\${WHERE}`}</span>
                          <span className="text-amber-500 font-normal">
                            — {language === 'id' ? 'Klausa WHERE otomatis' : 'Auto WHERE clause'}
                          </span>
                        </button>

                        {/* Filter-based parameters */}
                        {formData.filters.map((filter) => {
                          const isRange = ['date_range', 'numeric_range', 'month_range'].includes(filter.type);
                          const label = language === 'id' ? filter.labelId : filter.labelEn;

                          if (isRange && filter.paramName) {
                            // Range: show two buttons — _from and _to
                            return (
                              <React.Fragment key={filter.paramName}>
                                <button
                                  type="button"
                                  onClick={() => insertParamAtCursor(filter.paramName + '_from')}
                                  className={cn(
                                    'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition-all border cursor-pointer',
                                    'bg-white text-indigo-700 border-indigo-200 hover:bg-indigo-50 hover:border-indigo-400 hover:shadow-sm active:scale-95'
                                  )}
                                  title={`Insert \${${filter.paramName}_from}`}
                                >
                                  <Code2 size={11} />
                                  <span className="font-mono">{`\${${filter.paramName}_from}`}</span>
                                  {label && <span className="text-slate-400 font-normal">— {label} ({language === 'id' ? 'Dari' : 'From'})</span>}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => insertParamAtCursor(filter.paramName + '_to')}
                                  className={cn(
                                    'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition-all border cursor-pointer',
                                    'bg-white text-indigo-700 border-indigo-200 hover:bg-indigo-50 hover:border-indigo-400 hover:shadow-sm active:scale-95'
                                  )}
                                  title={`Insert \${${filter.paramName}_to}`}
                                >
                                  <Code2 size={11} />
                                  <span className="font-mono">{`\${${filter.paramName}_to}`}</span>
                                  {label && <span className="text-slate-400 font-normal">— {label} ({language === 'id' ? 'Sampai' : 'To'})</span>}
                                </button>
                              </React.Fragment>
                            );
                          }

                          // Non-range: single button
                          return (
                            <button
                              key={filter.paramName}
                              type="button"
                              onClick={() => insertParamAtCursor(filter.paramName)}
                              disabled={!filter.paramName}
                              className={cn(
                                'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition-all border cursor-pointer',
                                'bg-white text-indigo-700 border-indigo-200 hover:bg-indigo-50 hover:border-indigo-400 hover:shadow-sm active:scale-95',
                                'disabled:opacity-40 disabled:cursor-not-allowed'
                              )}
                              title={`Insert \${${filter.paramName}}`}
                            >
                              <Code2 size={11} />
                              <span className="font-mono">{`\${${filter.paramName}}`}</span>
                              {label && (
                                <span className="text-slate-400 font-normal">— {label}</span>
                              )}
                            </button>
                          );
                        })}
                      </div>

                      {/* Hint when no filters configured */}
                      {formData.filters.length === 0 && (
                        <p className="text-[10px] text-slate-400 italic">
                          {language === 'id'
                            ? 'Tambahkan filter di tab "Filter" agar parameter filter tersedia di sini.'
                            : 'Add filters in the "Filters" tab to make filter parameters available here.'}
                        </p>
                      )}
                    </div>

                    {/* Query textarea */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-tight">{t.form.query} *</label>
                      <SqlQueryEditor
                        value={formData.query}
                        onChange={(q) => setFormData((p) => ({ ...p, query: q }))}
                        placeholder={t.form.queryPlaceholder}
                        hint={t.form.queryHint}
                        language={language}
                        textareaRef={queryTextareaRef}
                      />
                    </div>

                    {/* Test Query panel */}
                    <QueryTestPanel
                      query={formData.query}
                      filters={formData.filters}
                      language={language}
                    />
                  </div>
                )}

                {/* ── Tab: Kolom Output ── */}
                {activeTab === 'columns' && (
                  <div className="space-y-5">
                    {/* Write Header toggle */}
                    <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-black text-slate-700">{t.columns.writeHeader}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{t.columns.writeHeaderHint}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setFormData((p) => ({ ...p, writeHeader: !p.writeHeader }))}
                        className={cn(
                          'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none',
                          formData.writeHeader ? 'bg-indigo-600' : 'bg-slate-200'
                        )}
                      >
                        <span
                          className={cn(
                            'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
                            formData.writeHeader ? 'translate-x-5' : 'translate-x-0'
                          )}
                        />
                      </button>
                    </div>

                    <ColumnArrayEditor
                      columns={formData.columns}
                      onChange={(columns) => setFormData((p) => ({ ...p, columns }))}
                      language={language}
                      writeHeader={formData.writeHeader}
                    />
                  </div>
                )}

                {/* ── Tab: Template & Output ── */}
                {activeTab === 'template' && (
                  <div className="space-y-5">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-tight">{t.template.templatePath}</label>
                      <div className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-500 font-mono">
                        {templatePath || './storage/report-templates'}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-tight">{t.template.uploadTemplate}</label>
                      <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:border-indigo-300 transition-colors">
                        <Upload size={24} className="mx-auto text-slate-300 mb-2" />
                        <p className="text-xs text-slate-500 mb-3">{t.template.uploadHint}</p>
                        {formData.templateFilename && (
                          <div className="flex items-center justify-center mb-2">
                            <p className="text-xs mr-2 font-bold text-indigo-600">
                              {t.template.currentTemplate}:
                            </p>
                            {/* Download button — always clickable, even in view mode */}
                            {(editingId) && (
                              <a
                                href={`/api/frs/report-configs/${editingId}/template`}
                                download={formData.templateFilename}
                                onClick={(e) => e.stopPropagation()}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg text-xs font-black transition-colors border border-indigo-200/50 pointer-events-auto"
                                title={language === 'id' ? 'Unduh template' : 'Download template'}
                              >
                                <DownloadIcon size={13} />
                                <span>{formData.templateFilename}</span>
                              </a>
                            )}
                          </div>
                        )}
                        <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg text-sm font-black transition-all border border-indigo-200/50">
                          <Upload size={13} />
                          {t.template.uploadTemplate}
                          <input
                            type="file"
                            accept=".xlsx"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                setTemplateFile(file);
                                setFormData((p) => ({ ...p, templateFilename: file.name }));
                              }
                            }}
                          />
                        </label>
                        {templateFile && (
                          <p className="text-xs text-emerald-600 font-bold mt-2">{templateFile.name}</p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-tight">{t.template.cellInfoFilter}</label>
                        <input
                          type="text"
                          value={formData.cellInfoFilter}
                          onChange={(e) => setFormData((p) => ({ ...p, cellInfoFilter: e.target.value }))}
                          placeholder={t.template.cellInfoFilterPlaceholder}
                          maxLength={10}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-sm"
                        />
                        <p className="text-[10px] text-slate-400">{t.template.cellInfoFilterHint}</p>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-tight">{t.template.startRow}</label>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            min={1}
                            value={formData.startRow}
                            onChange={(e) => setFormData((p) => ({ ...p, startRow: e.target.value }))}
                            placeholder={t.template.startRowPlaceholder}
                            className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-sm"
                          />
                          {editingId && templateFile && (
                            <button
                              type="button"
                              onClick={handleParseTemplate}
                              disabled={isParsing}
                              className="px-3 py-2 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-xl text-xs font-black transition-all cursor-pointer disabled:opacity-50 whitespace-nowrap"
                            >
                              {isParsing ? t.template.parsing : t.template.parseFromTemplate}
                            </button>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400">{t.template.startRowHint}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSaving}
                  className="px-8 py-3 bg-white border border-slate-200 text-sm font-bold text-slate-500 rounded-xl hover:bg-slate-50 transition-all active:scale-95 cursor-pointer shadow-sm"
                >
                  {isViewMode ? common.close ?? 'Tutup' : common.cancel}
                </button>
                {!isViewMode && (
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-10 py-3 bg-indigo-600 text-sm font-bold text-white rounded-xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 flex items-center justify-center gap-2 min-w-[180px] cursor-pointer"
                  >
                    {isSaving ? <RefreshCw className="animate-spin" size={18} /> : <CheckCircle2 size={18} />}
                    {isSaving ? common.saving : common.save}
                  </button>
                )}
              </div>
            </form>
          </Modal>
        )}
      </AnimatePresence>

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deleteConfirmId}
        onOpenChange={(open) => !open && setDeleteConfirmId(null)}
      >
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-black text-slate-800">{t.alerts.deleteTitle}</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-500 font-medium pt-2">
              {t.alerts.deleteDesc}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6 gap-3">
            <AlertDialogCancel
              onClick={() => setDeleteConfirmId(null)}
              className="rounded-xl border-slate-200 font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
            >
              {common.cancel}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
              className="rounded-xl bg-rose-600 hover:bg-rose-700 font-bold shadow-lg shadow-rose-100 transition-all active:scale-95 cursor-pointer"
            >
              {isDeleting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              {isDeleting ? common.deleting : common.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};





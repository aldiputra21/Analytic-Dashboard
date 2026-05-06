// QueryTestPanel.tsx
// Test query panel: runs the current SQL query against the readonly DB,
// shows preview rows, column list, and any errors.
// Filter inputs are rendered according to their configured type.

import React, { useState, useCallback } from 'react';
import {
  Play, X, AlertCircle, CheckCircle2, Loader2,
  ChevronDown, ChevronRight, Table2, Copy, Check,
} from 'lucide-react';
import { apiFetch } from '../../../services/financial/apiFetch';
import { MonthPicker } from '../shared/MonthPicker';
import { MonthRangePicker } from '../shared/MonthRangePicker';
import { cn } from '../../../utils/cn';
import type { FilterConfig } from '../../../types/financial/reportConfig';

// ─── Types ────────────────────────────────────────────────────────────────────

interface TestColumn {
  name: string;
  type: string;
}

interface TestResult {
  success: boolean;
  rowCount?: number;
  columns?: TestColumn[];
  rows?: Record<string, unknown>[];
  error?: string;
}

interface QueryTestPanelProps {
  query: string;
  filters: FilterConfig[];
  language: 'id' | 'en';
}

// ─── Range value helpers ──────────────────────────────────────────────────────

const RANGE_TYPES = new Set(['date_range', 'numeric_range', 'month_range']);

function getRangeFrom(v: unknown): string {
  if (v && typeof v === 'object' && 'from' in v) return String((v as { from: unknown }).from ?? '');
  return '';
}
function getRangeTo(v: unknown): string {
  if (v && typeof v === 'object' && 'to' in v) return String((v as { to: unknown }).to ?? '');
  return '';
}

// ─── Labels ───────────────────────────────────────────────────────────────────

const labels = {
  id: {
    title: 'Test Query',
    run: 'Jalankan',
    running: 'Menjalankan...',
    success: (rows: number) => `Berhasil — ${rows} baris dikembalikan (maks. 10)`,
    error: 'Query gagal',
    noQuery: 'Tulis query terlebih dahulu',
    columns: 'Kolom yang dikembalikan',
    preview: 'Preview Data',
    filterValues: 'Nilai Filter (untuk test)',
    filterHint: 'Isi nilai filter sementara untuk menggantikan placeholder di query.',
    noRows: 'Query berhasil tapi tidak ada baris yang dikembalikan.',
    copyColumns: 'Salin nama kolom',
    copied: 'Tersalin!',
    null: '(null)',
    close: 'Tutup',
    whereNote: '${WHERE} akan diganti dengan kondisi berdasarkan nilai filter di atas.',
    required: 'Wajib',
    from: 'Dari',
    to: 'Sampai',
    min: 'Min',
    max: 'Maks',
  },
  en: {
    title: 'Test Query',
    run: 'Run',
    running: 'Running...',
    success: (rows: number) => `Success — ${rows} row(s) returned (max 10)`,
    error: 'Query failed',
    noQuery: 'Write a query first',
    columns: 'Returned columns',
    preview: 'Data Preview',
    filterValues: 'Filter Values (for testing)',
    filterHint: 'Fill in temporary filter values to replace placeholders in the query.',
    noRows: 'Query succeeded but returned no rows.',
    copyColumns: 'Copy column names',
    copied: 'Copied!',
    null: '(null)',
    close: 'Close',
    whereNote: '${WHERE} will be replaced with conditions based on the filter values above.',
    required: 'Required',
    from: 'From',
    to: 'To',
    min: 'Min',
    max: 'Max',
  },
};

// ─── Single filter input ──────────────────────────────────────────────────────

const FilterInput: React.FC<{
  filter: FilterConfig;
  value: unknown;
  onChange: (v: unknown) => void;
  language: 'id' | 'en';
}> = ({ filter, value, onChange, language }) => {
  const t = labels[language];
  const inputCls = 'w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-mono';

  if (filter.type === 'date') {
    return (
      <input
        type="date"
        value={typeof value === 'string' ? value : ''}
        onChange={(e) => onChange(e.target.value)}
        className={inputCls}
      />
    );
  }

  if (filter.type === 'numeric') {
    return (
      <input
        type="number"
        value={typeof value === 'string' || typeof value === 'number' ? String(value) : ''}
        onChange={(e) => onChange(e.target.value)}
        className={inputCls}
      />
    );
  }

  if (filter.type === 'date_range') {
    return (
      <div className="flex items-center gap-1.5">
        <input
          type="date"
          value={getRangeFrom(value)}
          onChange={(e) => onChange({ from: e.target.value, to: getRangeTo(value) })}
          placeholder={t.from}
          className={cn(inputCls, 'flex-1')}
        />
        <span className="text-slate-400 text-[10px] shrink-0">—</span>
        <input
          type="date"
          value={getRangeTo(value)}
          onChange={(e) => onChange({ from: getRangeFrom(value), to: e.target.value })}
          placeholder={t.to}
          className={cn(inputCls, 'flex-1')}
        />
      </div>
    );
  }

  if (filter.type === 'numeric_range') {
    return (
      <div className="flex items-center gap-1.5">
        <input
          type="number"
          value={getRangeFrom(value)}
          onChange={(e) => onChange({ from: e.target.value, to: getRangeTo(value) })}
          placeholder={t.min}
          className={cn(inputCls, 'flex-1')}
        />
        <span className="text-slate-400 text-[10px] shrink-0">—</span>
        <input
          type="number"
          value={getRangeTo(value)}
          onChange={(e) => onChange({ from: getRangeFrom(value), to: e.target.value })}
          placeholder={t.max}
          className={cn(inputCls, 'flex-1')}
        />
      </div>
    );
  }

  if (filter.type === 'month') {
    return (
      <MonthPicker
        value={typeof value === 'string' ? value : ''}
        onChange={(v) => onChange(v)}
        language={language}
        usePortal
      />
    );
  }

  if (filter.type === 'month_range') {
    return (
      <MonthRangePicker
        startValue={getRangeFrom(value)}
        endValue={getRangeTo(value)}
        onChange={(start, end) => onChange({ from: start, to: end })}
        language={language}
        usePortal
      />
    );
  }

  if (filter.type === 'dropdown' && (filter.dropdownSource === 'json' || !filter.dropdownSource) && filter.dropdownItems?.length) {
    return (
      <select
        value={typeof value === 'string' ? value : ''}
        onChange={(e) => onChange(e.target.value)}
        className={cn(inputCls, 'cursor-pointer')}
      >
        <option value="">{language === 'id' ? '— Pilih —' : '— Select —'}</option>
        {filter.dropdownItems.map((item, i) => (
          <option key={`${item.value}-${i}`} value={item.value}>
            {language === 'id'
              ? (item.labelId || (item as any).label || item.labelEn || item.value)
              : (item.labelEn || (item as any).label || item.labelId || item.value)}
          </option>
        ))}
      </select>
    );
  }

  // text / dropdown-query / fallback
  return (
    <input
      type="text"
      value={typeof value === 'string' ? value : ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={filter.paramName}
      className={inputCls}
    />
  );
};

// ─── Main component ───────────────────────────────────────────────────────────

export const QueryTestPanel: React.FC<QueryTestPanelProps> = ({
  query,
  filters,
  language,
}) => {
  const t = labels[language];

  const [isOpen, setIsOpen] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);
  const [filterValues, setFilterValues] = useState<Record<string, unknown>>({});
  const [copied, setCopied] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [showColumns, setShowColumns] = useState(true);

  // ── Run query ─────────────────────────────────────────────────────────────
  const runQuery = useCallback(async () => {
    if (!query.trim()) return;
    setIsRunning(true);
    setResult(null);
    try {
      const res = await apiFetch('/api/frs/report-configs/test-query', {
        method: 'POST',
        body: JSON.stringify({
          query,
          filters,
          filterValues,
        }),
      });
      const data: TestResult = await res.json();
      setResult(data);
      setShowPreview(true);
      setShowColumns(true);
    } catch {
      setResult({
        success: false,
        error: language === 'id' ? 'Gagal menghubungi server' : 'Failed to reach server',
      });
    } finally {
      setIsRunning(false);
    }
  }, [query, filters, filterValues, language]);

  // ── Copy column names ─────────────────────────────────────────────────────
  const copyColumns = useCallback(() => {
    if (!result?.columns) return;
    const text = result.columns.map((c) => c.name).join(', ');
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [result]);

  // ── Has WHERE placeholder ─────────────────────────────────────────────────
  const hasWhere = /\$\{WHERE\}|\{\{WHERE\}\}/i.test(query);

  // ── Active filters (those with paramName) ─────────────────────────────────
  const activeFilters = filters.filter((f) => f.paramName);

  // ── Determine grid columns — range types span full width ─────────────────
  const isWide = (f: FilterConfig) =>
    RANGE_TYPES.has(f.type) || f.type === 'month_range';

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-200">
        <button
          type="button"
          onClick={() => setIsOpen((v) => !v)}
          className="flex items-center gap-2 text-xs font-black text-slate-600 hover:text-slate-800 transition-colors cursor-pointer"
        >
          {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          <Play size={13} className="text-emerald-500" />
          {t.title}
        </button>

        <button
          type="button"
          onClick={runQuery}
          disabled={isRunning || !query.trim()}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer',
            'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        >
          {isRunning
            ? <><Loader2 size={12} className="animate-spin" />{t.running}</>
            : <><Play size={12} />{t.run}</>
          }
        </button>
      </div>

      {/* Collapsible body */}
      {isOpen && (
        <div className="p-4 space-y-4 bg-white">

          {/* Filter values input */}
          {activeFilters.length > 0 && (
            <div className="space-y-2">
              <div>
                <p className="text-xs font-black text-slate-600 uppercase tracking-wider">{t.filterValues}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">{t.filterHint}</p>
                {hasWhere && (
                  <p className="text-[10px] text-amber-600 mt-0.5 font-bold">{t.whereNote}</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                {activeFilters.map((f) => (
                  <div
                    key={f.paramName}
                    className={cn('space-y-0.5', isWide(f) && 'col-span-2')}
                  >
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-tight flex items-center gap-1">
                      {language === 'id' ? f.labelId : f.labelEn}
                      <span className="text-slate-400 font-normal normal-case">({f.paramName})</span>
                      {f.required && (
                        <span className="text-red-400 text-[9px] font-black">{t.required}</span>
                      )}
                    </label>
                    <FilterInput
                      filter={f}
                      value={filterValues[f.paramName] ?? (RANGE_TYPES.has(f.type) ? { from: '', to: '' } : '')}
                      onChange={(v) => setFilterValues((prev) => ({ ...prev, [f.paramName]: v }))}
                      language={language}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Result */}
          {result && (
            <div className="space-y-3">
              {/* Status banner */}
              <div className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold',
                result.success
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-red-50 text-red-700 border border-red-200'
              )}>
                {result.success
                  ? <CheckCircle2 size={14} className="shrink-0" />
                  : <AlertCircle size={14} className="shrink-0" />
                }
                <span className="flex-1">
                  {result.success
                    ? t.success(result.rowCount ?? result.rows?.length ?? 0)
                    : `${t.error}: ${result.error}`
                  }
                </span>
                {result.success && (
                  <button
                    type="button"
                    onClick={() => setResult(null)}
                    className="text-emerald-500 hover:text-emerald-700 cursor-pointer"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>

              {result.success && result.columns && result.columns.length > 0 && (
                <>
                  {/* Columns section */}
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setShowColumns((v) => !v)}
                      className="w-full flex items-center justify-between px-3 py-2 bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      <span className="flex items-center gap-1.5 text-[10px] font-black text-slate-600 uppercase tracking-wider">
                        {showColumns ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                        {t.columns}
                        <span className="bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded-full text-[9px]">
                          {result.columns.length}
                        </span>
                      </span>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); copyColumns(); }}
                        className="flex items-center gap-1 text-[10px] text-indigo-600 hover:text-indigo-800 font-bold cursor-pointer"
                      >
                        {copied ? <Check size={11} /> : <Copy size={11} />}
                        {copied ? t.copied : t.copyColumns}
                      </button>
                    </button>
                    {showColumns && (
                      <div className="flex flex-wrap gap-1.5 p-3">
                        {result.columns.map((col) => (
                          <span
                            key={col.name}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 rounded-md text-[10px] font-mono text-slate-700 border border-slate-200"
                          >
                            <Table2 size={9} className="text-slate-400" />
                            <span className="font-black">{col.name}</span>
                            <span className="text-slate-400">{col.type}</span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Preview rows section */}
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setShowPreview((v) => !v)}
                      className="w-full flex items-center gap-1.5 px-3 py-2 bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer text-[10px] font-black text-slate-600 uppercase tracking-wider"
                    >
                      {showPreview ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                      {t.preview}
                      <span className="bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded-full text-[9px]">
                        {result.rows?.length ?? 0}
                      </span>
                    </button>

                    {showPreview && (
                      result.rows && result.rows.length > 0 ? (
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="bg-slate-800 text-slate-200">
                                {result.columns.map((col) => (
                                  <th
                                    key={col.name}
                                    className="px-3 py-2 text-left text-[10px] font-black uppercase tracking-wider whitespace-nowrap"
                                  >
                                    {col.name}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {result.rows.map((row, rowIdx) => (
                                <tr
                                  key={rowIdx}
                                  className={rowIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}
                                >
                                  {result.columns!.map((col) => {
                                    const val = row[col.name];
                                    const isNull = val === null || val === undefined;
                                    return (
                                      <td
                                        key={col.name}
                                        className={cn(
                                          'px-3 py-1.5 font-mono whitespace-nowrap max-w-[200px] truncate',
                                          isNull ? 'text-slate-300 italic' : 'text-slate-700'
                                        )}
                                        title={isNull ? '' : String(val)}
                                      >
                                        {isNull ? t.null : String(val)}
                                      </td>
                                    );
                                  })}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p className="px-4 py-6 text-center text-xs text-slate-400 italic">{t.noRows}</p>
                      )
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

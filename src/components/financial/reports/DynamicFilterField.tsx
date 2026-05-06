// DynamicFilterField.tsx — Renders a single filter input based on FilterConfig type
// Requirements: 5.2, 5.3, 5.4, 5.5, 5.6, 5.7

import React, { useState, useEffect } from 'react';
import { AlertCircle } from 'lucide-react';
import { SearchableSelect } from '../shared/SearchableSelect';
import { MonthPicker } from '../shared/MonthPicker';
import { MonthRangePicker } from '../shared/MonthRangePicker';
import { apiFetch } from '../../../services/financial/apiFetch';
import { cn } from '../../../utils/cn';
import type { FilterConfig } from '../../../types/financial/reportConfig';

// ─── Props ────────────────────────────────────────────────────────────────────

interface DynamicFilterFieldProps {
  filter: FilterConfig;
  configId: string;
  value: unknown;
  onChange: (value: unknown) => void;
  language: 'id' | 'en';
  /** Whether this field has a validation error (required but empty) */
  hasError?: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Range value shape used by date_range, numeric_range, month_range */
interface RangeValue {
  from: string;
  to: string;
}

function toRangeValue(v: unknown): RangeValue {
  if (v && typeof v === 'object' && 'from' in v && 'to' in v) {
    return { from: String((v as RangeValue).from ?? ''), to: String((v as RangeValue).to ?? '') };
  }
  return { from: '', to: '' };
}

// ─── Component ────────────────────────────────────────────────────────────────

export const DynamicFilterField: React.FC<DynamicFilterFieldProps> = ({
  filter,
  configId,
  value,
  onChange,
  language,
  hasError = false,
}) => {
  const label = language === 'id' ? filter.labelId : filter.labelEn;
  const isRequired = filter.required ?? false;

  // ── Dropdown-query state ──────────────────────────────────────────────────
  const [dropdownOptions, setDropdownOptions] = useState<Array<{ value: string; labelId?: string; labelEn?: string; label?: string }>>([]);
  const [isLoadingDropdown, setIsLoadingDropdown] = useState(false);
  const [dropdownError, setDropdownError] = useState<string | null>(null);

  useEffect(() => {
    if (filter.type !== 'dropdown' || filter.dropdownSource !== 'query') return;

    let cancelled = false;
    setIsLoadingDropdown(true);
    setDropdownError(null);

    apiFetch(`/api/frs/report-outputs/dropdown/${configId}/${filter.paramName}`, {
      method: 'POST',
      body: JSON.stringify({}),
    })
      .then(async (res) => {
        if (cancelled) return;
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw errData;
        }
        const data = await res.json();
        // Backend returns Array<{ value, labelId, labelEn }> or Array<{ value, label }>
        setDropdownOptions(Array.isArray(data) ? data : (data.options ?? []));
      })
      .catch(() => {
        if (!cancelled) {
          setDropdownError(
            language === 'id'
              ? 'Gagal memuat opsi dropdown'
              : 'Failed to load dropdown options'
          );
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoadingDropdown(false);
      });

    return () => {
      cancelled = true;
    };
  }, [filter.type, filter.dropdownSource, filter.paramName, configId, language]);

  // ── Shared label element ──────────────────────────────────────────────────
  const labelEl = (
    <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
      {label}
      {isRequired && <span className="text-red-500 ml-1">*</span>}
    </label>
  );

  // ── Shared error ring class ───────────────────────────────────────────────
  const inputCls = cn(
    'w-full px-3 py-2 text-sm rounded-xl border bg-white text-slate-800',
    'focus:outline-none focus:ring-2 transition-all',
    hasError ? 'border-red-400 ring-1 ring-red-300 focus:ring-red-400' : 'border-slate-200 focus:ring-indigo-300'
  );

  const errorEl = hasError ? (
    <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
      <AlertCircle size={12} />
      {language === 'id' ? 'Field ini wajib diisi' : 'This field is required'}
    </p>
  ) : null;

  // ── Render: text ──────────────────────────────────────────────────────────
  if (filter.type === 'text') {
    return (
      <div className="flex flex-col">
        {labelEl}
        <input
          type="text"
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => onChange(e.target.value)}
          className={inputCls}
        />
        {errorEl}
      </div>
    );
  }

  // ── Render: numeric ───────────────────────────────────────────────────────
  if (filter.type === 'numeric') {
    return (
      <div className="flex flex-col">
        {labelEl}
        <input
          type="number"
          value={typeof value === 'string' || typeof value === 'number' ? String(value) : ''}
          onChange={(e) => onChange(e.target.value)}
          className={inputCls}
        />
        {errorEl}
      </div>
    );
  }

  // ── Render: date ──────────────────────────────────────────────────────────
  if (filter.type === 'date') {
    return (
      <div className="flex flex-col">
        {labelEl}
        <input
          type="date"
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => onChange(e.target.value)}
          className={inputCls}
        />
        {errorEl}
      </div>
    );
  }

  // ── Render: date_range ────────────────────────────────────────────────────
  if (filter.type === 'date_range') {
    const rv = toRangeValue(value);
    const rangeLabel = language === 'id' ? { from: 'Dari', to: 'Sampai' } : { from: 'From', to: 'To' };
    return (
      <div className="flex flex-col">
        {labelEl}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative w-full">
            <input
              type="date"
              value={rv.from}
              onChange={(e) => onChange({ ...rv, from: e.target.value })}
              className={cn(inputCls, 'w-full')}
            />
          </div>
          <div className="flex items-center justify-center shrink-0 px-2 py-1 bg-slate-100 rounded-lg">
            <span className="text-slate-500 text-[10px] font-black uppercase tracking-tighter whitespace-nowrap">
              {rangeLabel.from} — {rangeLabel.to}
            </span>
          </div>
          <div className="relative w-full">
            <input
              type="date"
              value={rv.to}
              onChange={(e) => onChange({ ...rv, to: e.target.value })}
              className={cn(inputCls, 'w-full')}
            />
          </div>
        </div>
        {errorEl}
      </div>
    );
  }

  // ── Render: numeric_range ─────────────────────────────────────────────────
  if (filter.type === 'numeric_range') {
    const rv = toRangeValue(value);
    const rangeLabel = language === 'id' ? { from: 'Min', to: 'Maks' } : { from: 'Min', to: 'Max' };
    return (
      <div className="flex flex-col">
        {labelEl}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <input
            type="number"
            value={rv.from}
            onChange={(e) => onChange({ ...rv, from: e.target.value })}
            placeholder={rangeLabel.from}
            className={cn(inputCls, 'w-full')}
          />
          <div className="flex items-center justify-center shrink-0 px-3">
             <span className="w-4 h-0.5 bg-slate-300 rounded-full" />
          </div>
          <input
            type="number"
            value={rv.to}
            onChange={(e) => onChange({ ...rv, to: e.target.value })}
            placeholder={rangeLabel.to}
            className={cn(inputCls, 'w-full')}
          />
        </div>
        {errorEl}
      </div>
    );
  }

  // ── Render: month ─────────────────────────────────────────────────────────
  if (filter.type === 'month') {
    return (
      <div className="flex flex-col">
        {labelEl}
        <MonthPicker
          value={typeof value === 'string' ? value : ''}
          onChange={(v) => onChange(v)}
          language={language}
          usePortal
        />
        {errorEl}
      </div>
    );
  }

  // ── Render: month_range ───────────────────────────────────────────────────
  if (filter.type === 'month_range') {
    const rv = toRangeValue(value);
    return (
      <div className="flex flex-col">
        {labelEl}
        <MonthRangePicker
          startValue={rv.from}
          endValue={rv.to}
          onChange={(start, end) => onChange({ from: start, to: end })}
          language={language}
          usePortal
        />
        {errorEl}
      </div>
    );
  }

  // ── Render: dropdown (static JSON) ───────────────────────────────────────
  if (filter.type === 'dropdown' && (filter.dropdownSource === 'json' || (!filter.dropdownSource && filter.dropdownItems?.length))) {
    const options = (filter.dropdownItems ?? []).map((item) => ({
      value: item.value,
      label: language === 'id'
        ? (item.labelId || (item as any).label || item.labelEn || item.value)
        : (item.labelEn || (item as any).label || item.labelId || item.value),
    }));

    return (
      <div className="flex flex-col">
        <SearchableSelect
          label={label}
          options={options}
          value={typeof value === 'string' ? value : ''}
          onChange={(v) => onChange(v)}
          placeholder={language === 'id' ? 'Pilih opsi...' : 'Select option...'}
          error={hasError ? (language === 'id' ? 'Field ini wajib diisi' : 'This field is required') : undefined}
          required={isRequired}
        />
      </div>
    );
  }

  // ── Render: dropdown (SQL query) ─────────────────────────────────────────
  if (filter.type === 'dropdown' && filter.dropdownSource === 'query') {
    if (isLoadingDropdown) {
      return (
        <div className="flex flex-col">
          {labelEl}
          <div className="h-10 bg-slate-100 rounded-xl animate-pulse" />
        </div>
      );
    }

    if (dropdownError) {
      return (
        <div className="flex flex-col">
          {labelEl}
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-red-200 bg-red-50 text-xs text-red-600">
            <AlertCircle size={14} className="shrink-0" />
            <span>{dropdownError}</span>
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col">
        <SearchableSelect
          label={label}
          options={dropdownOptions.map((opt) => ({
            value: opt.value,
            label: language === 'id' 
              ? (opt.labelId || opt.label || opt.labelEn || opt.value)
              : (opt.labelEn || opt.label || opt.labelId || opt.value)
          }))}
          value={typeof value === 'string' ? value : ''}
          onChange={(v) => onChange(v)}
          placeholder={language === 'id' ? 'Pilih opsi...' : 'Select option...'}
          error={hasError ? (language === 'id' ? 'Field ini wajib diisi' : 'This field is required') : undefined}
          required={isRequired}
        />
      </div>
    );
  }

  // ── Fallback: unknown type ────────────────────────────────────────────────
  return null;
};

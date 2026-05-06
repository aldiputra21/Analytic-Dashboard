// WeeklyCashFlowForm — Shared form component untuk Weekly Cash Flow.
// Dipakai oleh:
//   1. WeeklyCashFlowManager.tsx (di dalam modal CRUD)
//   2. formRegistry.tsx via createApprovalFormAdapter (di approval context)
//
// Kalkulasi Net Cash Flow dihitung dari payload — pure function.
// Tidak ada fetch data di dalam form.

import React, { useMemo } from 'react';
import { TrendingUp, TrendingDown, Calculator, FileSpreadsheet } from 'lucide-react';
import { cn } from '../../../../utils/cn';
import { formatRupiah } from '../../../../utils/format';
import { weeklyCashFlowI18n } from '../../../../i18n/weekly-cash-flow';
import { MonthPicker } from '../MonthPicker';
import { CorporateSelector } from '../CorporateSelector';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface WeeklyCashFlowPayload {
  corporateId?: string;
  entityType?: 'corporate' | 'project';
  entityId?: string;
  period?: string;
  week?: string;
  operatingCashIn?: number;
  operatingCashOut?: number;
  investingCashIn?: number;
  investingCashOut?: number;
  financingCashIn?: number;
  financingCashOut?: number;
  notes?: string;
  [key: string]: unknown;
}

export interface WeeklyCashFlowFormProps {
  payload: WeeklyCashFlowPayload;
  onChange?: (field: keyof WeeklyCashFlowPayload, value: unknown) => void;
  readOnly?: boolean;
  language: 'id' | 'en';
  showCorporateSelector?: boolean;
  corporateSelectorDisabled?: boolean;
}

// ── Sub-components ────────────────────────────────────────────────────────────

const FormField: React.FC<{
  label: string;
  value: number | string;
  onChange: (val: string) => void;
  readOnly?: boolean;
}> = ({ label, value, onChange, readOnly = false }) => {
  const displayValue = useMemo(() => {
    if (value === undefined || value === null || value === '' || value === 0) {
      return value === 0 ? '0' : '';
    }
    const num = Math.floor(Number(value));
    return isNaN(num) ? '' : num.toLocaleString('id-ID');
  }, [value]);

  return (
    <div className="space-y-1.5">
      <label className="text-xs font-bold text-slate-500 uppercase tracking-tight">{label}</label>
      <input
        type="text"
        inputMode="numeric"
        value={displayValue}
        onChange={(e) => onChange(e.target.value.replace(/[^0-9-]/g, ''))}
        readOnly={readOnly}
        className={cn(
          'w-full px-4 py-3 text-sm border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm bg-slate-50/30',
          readOnly && 'bg-slate-100 cursor-not-allowed font-medium text-slate-600 border-none shadow-none',
        )}
      />
    </div>
  );
};

const SectionHeader: React.FC<{ title: string; icon: React.ReactNode; color: string }> = ({ title, icon, color }) => (
  <div className={cn('flex items-center gap-2 mb-4 pb-2 border-b-2', color)}>
    <div className="p-1.5 rounded-lg bg-white shadow-sm border border-slate-100">{icon}</div>
    <h4 className="font-bold text-sm text-slate-700 tracking-tight uppercase">{title}</h4>
  </div>
);

const SummaryCard: React.FC<{
  label: string;
  value: number;
  color: 'indigo' | 'emerald' | 'amber' | 'rose';
  fullWidth?: boolean;
}> = ({ label, value, color, fullWidth = false }) => {
  const variants = {
    indigo: 'bg-indigo-50 border-indigo-100 text-indigo-700',
    emerald: 'bg-emerald-50 border-emerald-100 text-emerald-700',
    amber: 'bg-amber-50 border-amber-100 text-amber-700',
    rose: 'bg-rose-50 border-rose-100 text-rose-700',
  };
  return (
    <div className={cn('px-4 py-3 rounded-xl border flex flex-col gap-1 shadow-sm', variants[color], fullWidth ? 'col-span-2 w-full' : '')}>
      <span className="text-[10px] font-bold uppercase tracking-wider opacity-70">{label}</span>
      <span className={cn('text-lg font-black', value < 0 && 'text-rose-600')}>{formatRupiah(value, false)}</span>
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────

const WEEK_OPTIONS = ['W1', 'W2', 'W3', 'W4', 'W5'];

export const WeeklyCashFlowForm: React.FC<WeeklyCashFlowFormProps> = ({
  payload,
  onChange,
  readOnly = false,
  language,
  showCorporateSelector = true,
  corporateSelectorDisabled = false,
}) => {
  const t = weeklyCashFlowI18n[language];

  const n = (key: keyof WeeklyCashFlowPayload) => parseFloat(String(payload[key] ?? 0)) || 0;

  // Calculations — pure function from payload
  const totalCashIn = n('operatingCashIn') + n('investingCashIn') + n('financingCashIn');
  const totalCashOut = n('operatingCashOut') + n('investingCashOut') + n('financingCashOut');
  const netCashFlow = totalCashIn - totalCashOut;

  const field = (key: keyof WeeklyCashFlowPayload) => (val: string) => {
    onChange?.(key, val === '' ? 0 : parseFloat(val));
  };

  const isReadOnly = readOnly || !onChange;

  return (
    <div>
      <div className="space-y-6">
        {/* ── Header: Period, Week & Corporate ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-tight flex items-center gap-1.5">
              <FileSpreadsheet size={12} />
              {t.modal.period}
              {!isReadOnly && <span className="text-red-500">*</span>}
            </label>
            <MonthPicker
              value={String(payload.period ?? '')}
              onChange={(val) => onChange?.('period', val)}
              language={language}
              labels={{ month: t.modal.month, year: t.modal.year }}
              className={cn('w-full', isReadOnly && 'pointer-events-none opacity-80')}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-tight">
              {t.modal.week}
              {!isReadOnly && <span className="text-red-500 ml-1">*</span>}
            </label>
            <select
              value={String(payload.week ?? '')}
              onChange={(e) => onChange?.('week', e.target.value)}
              disabled={isReadOnly}
              className={cn(
                'w-full px-4 py-3 text-sm border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm bg-slate-50/30',
                isReadOnly && 'bg-slate-100 cursor-not-allowed font-medium text-slate-600 border-none shadow-none',
              )}
            >
              <option value="">{t.modal.week}</option>
              {WEEK_OPTIONS.map((w) => (
                <option key={w} value={w}>{w}</option>
              ))}
            </select>
          </div>

          {showCorporateSelector && (
            <CorporateSelector
              label={t.modal.corporate}
              value={String(payload.corporateId ?? '')}
              onChange={(val) => onChange?.('corporateId', val)}
              placeholder={t.modal.selectCorporate}
              disabled={isReadOnly || corporateSelectorDisabled}
              required={!isReadOnly}
            />
          )}
        </div>

        {/* ── Operating Activity ── */}
        <div>
          <SectionHeader
            title={t.modal.operatingActivity}
            icon={<Calculator size={16} className="text-indigo-500" />}
            color="border-indigo-500"
          />
          <div className="grid grid-cols-2 gap-4">
            <FormField
              label={`${t.modal.operatingActivity} (${t.fields.in})`}
              value={n('operatingCashIn')}
              onChange={field('operatingCashIn')}
              readOnly={isReadOnly}
            />
            <FormField
              label={`${t.modal.operatingActivity} (${t.fields.out})`}
              value={n('operatingCashOut')}
              onChange={field('operatingCashOut')}
              readOnly={isReadOnly}
            />
          </div>
        </div>

        {/* ── Investing Activity ── */}
        <div>
          <SectionHeader
            title={t.modal.investing}
            icon={<TrendingUp size={16} className="text-emerald-500" />}
            color="border-emerald-500"
          />
          <div className="grid grid-cols-2 gap-4">
            <FormField
              label={`${t.modal.investing} (${t.fields.in})`}
              value={n('investingCashIn')}
              onChange={field('investingCashIn')}
              readOnly={isReadOnly}
            />
            <FormField
              label={`${t.modal.investing} (${t.fields.out})`}
              value={n('investingCashOut')}
              onChange={field('investingCashOut')}
              readOnly={isReadOnly}
            />
          </div>
        </div>

        {/* ── Financing Activity ── */}
        <div>
          <SectionHeader
            title={t.modal.financing}
            icon={<TrendingDown size={16} className="text-amber-500" />}
            color="border-amber-500"
          />
          <div className="grid grid-cols-2 gap-4">
            <FormField
              label={`${t.modal.financing} (${t.fields.in})`}
              value={n('financingCashIn')}
              onChange={field('financingCashIn')}
              readOnly={isReadOnly}
            />
            <FormField
              label={`${t.modal.financing} (${t.fields.out})`}
              value={n('financingCashOut')}
              onChange={field('financingCashOut')}
              readOnly={isReadOnly}
            />
          </div>
        </div>

        {/* ── Footer: Net Cash Flow ── */}
        <div className="pt-4 border-t border-slate-100">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <SummaryCard label={t.fields.cashIn} value={totalCashIn} color="emerald" />
            <SummaryCard label={t.fields.cashOut} value={totalCashOut} color="rose" />
            <SummaryCard label={t.modal.netCashFlow} value={netCashFlow} color={netCashFlow >= 0 ? 'indigo' : 'rose'} />
          </div>
        </div>

        {/* ── Notes ── */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-tight ml-1">{t.modal.notes}</label>
          <textarea
            value={String(payload.notes ?? '')}
            onChange={(e) => onChange?.('notes', e.target.value)}
            readOnly={isReadOnly}
            placeholder={isReadOnly ? '' : t.modal.notesPlaceholder}
            rows={3}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all resize-none shadow-sm"
          />
        </div>
      </div>
    </div>
  );
};

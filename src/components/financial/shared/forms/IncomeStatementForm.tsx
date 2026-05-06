// IncomeStatementForm — Shared form component untuk Income Statement.
// Dipakai oleh:
//   1. IncomeStatementManager.tsx (di dalam modal CRUD)
//   2. formRegistry.tsx via createApprovalFormAdapter (di approval context)
//
// Kalkulasi (Gross Profit, Operating Profit, Net Income) dihitung dari payload — pure function.
// Tidak ada fetch data di dalam form.

import React, { useMemo } from 'react';
import { TrendingUp, TrendingDown, Calculator, FileSpreadsheet } from 'lucide-react';
import { cn } from '../../../../utils/cn';
import { formatRupiah } from '../../../../utils/format';
import { incomeStatementI18n } from '../../../../i18n/income-statement';
import { MonthPicker } from '../MonthPicker';
import { CorporateSelector } from '../CorporateSelector';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface IncomeStatementPayload {
  period?: string;
  corporateId?: string;
  revenue?: number;
  cogs?: number;
  operatingExpenses?: number;
  interestExpense?: number;
  taxExpense?: number;
  otherIncome?: number;
  otherExpense?: number;
  notes?: string;
  [key: string]: unknown;
}

export interface IncomeStatementFormProps {
  payload: IncomeStatementPayload;
  onChange?: (field: keyof IncomeStatementPayload, value: unknown) => void;
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

export const IncomeStatementForm: React.FC<IncomeStatementFormProps> = ({
  payload,
  onChange,
  readOnly = false,
  language,
  showCorporateSelector = true,
  corporateSelectorDisabled = false,
}) => {
  const t = incomeStatementI18n[language];

  const n = (key: keyof IncomeStatementPayload) => parseFloat(String(payload[key] ?? 0)) || 0;

  // Calculations — pure function from payload
  const grossProfit = n('revenue') - n('cogs');
  const ebit = grossProfit - n('operatingExpenses');
  const ebt = ebit + n('otherIncome') - n('interestExpense') - n('otherExpense');
  const netIncome = ebt - n('taxExpense');
  const netMargin = n('revenue') > 0 ? (netIncome / n('revenue')) * 100 : 0;

  const field = (key: keyof IncomeStatementPayload) => (val: string) => {
    onChange?.(key, val === '' ? 0 : parseFloat(val));
  };

  const isReadOnly = readOnly || !onChange;

  return (
    <div>
      <div className="space-y-6">
        {/* ── Header: Period & Corporate ── */}
        <div className={cn('grid gap-6 items-end', showCorporateSelector ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 max-w-xs')}>
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

        {/* ── Revenue & COGS ── */}
        <div>
          <SectionHeader
            title={t.modal.revenueAndCogs}
            icon={<TrendingUp size={16} className="text-emerald-500" />}
            color="border-emerald-500"
          />
          <div className="grid grid-cols-2 gap-4">
            <FormField label={t.fields.revenue} value={n('revenue')} onChange={field('revenue')} readOnly={isReadOnly} />
            <FormField label={t.fields.cogs} value={n('cogs')} onChange={field('cogs')} readOnly={isReadOnly} />
            <div className="col-span-2">
              <SummaryCard label={t.modal.grossProfit} value={grossProfit} color={grossProfit >= 0 ? 'emerald' : 'rose'} fullWidth />
            </div>
          </div>
        </div>

        {/* ── Operating Expenses ── */}
        <div>
          <SectionHeader
            title={t.modal.expensesAndProfit}
            icon={<TrendingDown size={16} className="text-amber-500" />}
            color="border-amber-500"
          />
          <div className="grid grid-cols-2 gap-4">
            <FormField label={t.fields.operatingExpenses} value={n('operatingExpenses')} onChange={field('operatingExpenses')} readOnly={isReadOnly} />
            <div className="col-span-2">
              <SummaryCard label={t.modal.ebit} value={ebit} color={ebit >= 0 ? 'indigo' : 'rose'} fullWidth />
            </div>
          </div>
        </div>

        {/* ── Other Income & Expenses ── */}
        <div>
          <SectionHeader
            title={t.modal.otherIncExp}
            icon={<Calculator size={16} className="text-indigo-500" />}
            color="border-indigo-500"
          />
          <div className="grid grid-cols-2 gap-4">
            <FormField label={t.fields.otherIncome} value={n('otherIncome')} onChange={field('otherIncome')} readOnly={isReadOnly} />
            <FormField label={t.fields.interest} value={n('interestExpense')} onChange={field('interestExpense')} readOnly={isReadOnly} />
            <FormField label={t.fields.otherExpense} value={n('otherExpense')} onChange={field('otherExpense')} readOnly={isReadOnly} />
            <div className="col-span-2">
              <SummaryCard label={t.modal.ebt} value={ebt} color={ebt >= 0 ? 'indigo' : 'rose'} fullWidth />
            </div>
          </div>
        </div>

        {/* ── Tax ── */}
        <div className="grid grid-cols-2 gap-4">
          <FormField label={t.fields.tax} value={n('taxExpense')} onChange={field('taxExpense')} readOnly={isReadOnly} />
        </div>

        {/* ── Footer: Net Income & Margin ── */}
        <div className="pt-4 border-t border-slate-100">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SummaryCard label={t.modal.netProfit} value={netIncome} color={netIncome >= 0 ? 'emerald' : 'rose'} />
            <div className={cn(
              'px-4 py-3 rounded-xl border flex flex-col gap-1 shadow-sm',
              netMargin >= 0 ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-rose-50 border-rose-100 text-rose-700',
            )}>
              <span className="text-[10px] font-bold uppercase tracking-wider opacity-70">{t.modal.netMargin}</span>
              <span className="text-lg font-black">{netMargin.toFixed(2)}%</span>
            </div>
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

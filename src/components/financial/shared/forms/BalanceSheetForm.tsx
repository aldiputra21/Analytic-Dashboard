// BalanceSheetForm — Shared form component untuk Balance Sheet.
// Dipakai oleh:
//   1. BalanceSheetManager.tsx (di dalam modal CRUD)
//   2. formRegistry.tsx via createApprovalFormAdapter (di approval context)
//      → tidak perlu file wrapper terpisah per-modul
//
// Status balance/unbalanced ditampilkan sebagai bar penuh di bawah header
// (periode + corporate), selalu terlihat saat form pertama dibuka.
// Kalkulasi dihitung dari payload — pure function, konsisten di semua konteks.

import React, { useMemo } from 'react';
import {
  ArrowLeftRight, TrendingUp, Landmark, Calculator,
  CheckCircle, AlertCircle, FileSpreadsheet,
} from 'lucide-react';
import { cn } from '../../../../utils/cn';
import { formatRupiah } from '../../../../utils/format';
import { balanceSheetI18n } from '../../../../i18n/balance-sheet';
import { MonthPicker } from '../../shared/MonthPicker';
import { CorporateSelector } from '../../shared/CorporateSelector';
import { NumericInput } from '../../shared/NumericInput';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface BalanceSheetPayload {
  period?: string;
  corporateId?: string;
  cashAndBank?: number;
  accountsReceivable?: number;
  workInProgress?: number;
  inventory?: number;
  prepaidExpenses?: number;
  land?: number;
  building?: number;
  equipment?: number;
  otherFixedAssets?: number;
  accountsPayable?: number;
  bankLoanCurrent?: number;
  otherCurrentLiabilities?: number;
  bankLoanLongTerm?: number;
  otherLongTermLiabilities?: number;
  shareholderLoan?: number;
  capital?: number;
  earningsAfterTax?: number;
  retainedEarnings?: number;
  dividends?: number;
  notes?: string;
  [key: string]: unknown;
}

export interface BalanceSheetFormProps {
  payload: BalanceSheetPayload;
  onChange?: (field: keyof BalanceSheetPayload, value: unknown) => void;
  readOnly?: boolean;
  language: 'id' | 'en';
  showCorporateSelector?: boolean;
  corporateSelectorDisabled?: boolean;
}

// ── Sub-components ────────────────────────────────────────────────────────────


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
      <span className="text-lg font-black">{formatRupiah(value, false)}</span>
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────

export const BalanceSheetForm: React.FC<BalanceSheetFormProps> = ({
  payload,
  onChange,
  readOnly = false,
  language,
  showCorporateSelector = true,
  corporateSelectorDisabled = false,
}) => {
  const t = balanceSheetI18n[language];

  const n = (key: keyof BalanceSheetPayload) => parseFloat(String(payload[key] ?? 0)) || 0;

  const totalActiva = n('cashAndBank') + n('accountsReceivable') + n('workInProgress') + n('inventory') + n('prepaidExpenses');
  const totalFixedAssets = n('land') + n('building') + n('equipment') + n('otherFixedAssets');
  const totalAssets = totalActiva + totalFixedAssets;

  const totalCurrentLiabilities = n('accountsPayable') + n('bankLoanCurrent') + n('otherCurrentLiabilities');
  const totalNonCurrentLiabilities = n('bankLoanLongTerm') + n('otherLongTermLiabilities') + n('shareholderLoan');
  const totalLiabilities = totalCurrentLiabilities + totalNonCurrentLiabilities;

  const totalEquity = n('capital') + n('earningsAfterTax') + n('retainedEarnings') - n('dividends');
  const totalLiabilitiesEquity = totalLiabilities + totalEquity;

  const isBalanced = totalAssets > 0 && Math.abs(totalAssets - totalLiabilitiesEquity) < 1;

  const field = (key: keyof BalanceSheetPayload) => (val: string) => {
    onChange?.(key, val === '' ? 0 : parseFloat(val));
  };

  const isReadOnly = readOnly || !onChange;

  return (
    <div>
      {/* ── Sticky Status Bar ──
          sticky top-0 mengacu ke scroll container terdekat (overflow-y-auto di modal).
          Saat scroll, bar nempel tepat di bawah tab bar (approval) atau header (manager).
          -mx-6 px-6 agar bar melebar penuh ke tepi padding container. */}
      <div className={cn(
        'sticky top-0 z-10 -mx-6 px-6 py-2.5 flex items-center gap-2.5 border-b mb-6 transition-all',
        isBalanced
          ? 'bg-emerald-50/95 border-emerald-100 text-emerald-700 backdrop-blur-sm'
          : totalAssets > 0
            ? 'bg-rose-50/95 border-rose-100 text-rose-700 backdrop-blur-sm'
            : 'bg-slate-50/95 border-slate-200 text-slate-400 backdrop-blur-sm',
      )}>
        {isBalanced
          ? <CheckCircle size={15} className="shrink-0" />
          : <AlertCircle size={15} className="shrink-0" />}
        <span className="text-xs font-black uppercase tracking-widest">
          {isBalanced
            ? t.status.balanced
            : totalAssets > 0
              ? `${t.modal.diff}: ${formatRupiah(Math.abs(totalAssets - totalLiabilitiesEquity), false)}`
              : '—'}
        </span>
        {!isBalanced && totalAssets > 0 && (
          <span className="ml-auto text-[10px] font-bold opacity-70 hidden sm:block">
            {t.modal.totalAssets}: {formatRupiah(totalAssets, false)}
            {' · '}
            {t.modal.totalLiabEquity}: {formatRupiah(totalLiabilitiesEquity, false)}
          </span>
        )}
      </div>

      <div className="space-y-6">
        {/* ── Header: Periode & Corporate ── */}
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

        {/* ── Main Form: Assets (left) & Liabilities+Equity (right) ── */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* LEFT: ASSETS */}
          <div className="space-y-8">
            <div>
              <SectionHeader title={t.modal.activa} icon={<ArrowLeftRight size={16} className="text-blue-500" />} color="border-blue-500" />
              <div className="grid grid-cols-2 gap-4">
                <NumericInput label={t.fields.cashAndBank} value={n('cashAndBank')} onValueChange={(v) => onChange?.('cashAndBank', v.floatValue ?? 0)} disabled={isReadOnly} />
                <NumericInput label={t.fields.accountsReceivable} value={n('accountsReceivable')} onValueChange={(v) => onChange?.('accountsReceivable', v.floatValue ?? 0)} disabled={isReadOnly} />
                <NumericInput label={t.fields.workInProgress} value={n('workInProgress')} onValueChange={(v) => onChange?.('workInProgress', v.floatValue ?? 0)} disabled={isReadOnly} />
                <NumericInput label={t.fields.inventory} value={n('inventory')} onValueChange={(v) => onChange?.('inventory', v.floatValue ?? 0)} disabled={isReadOnly} />
                <NumericInput label={t.fields.prepaidExpenses} value={n('prepaidExpenses')} onValueChange={(v) => onChange?.('prepaidExpenses', v.floatValue ?? 0)} disabled={isReadOnly} />
                <div className="col-span-2"><SummaryCard label={t.modal.totalActiva} value={totalActiva} color="indigo" fullWidth /></div>
              </div>
            </div>

            <div>
              <SectionHeader title={t.modal.fixedAsset} icon={<Landmark size={16} className="text-indigo-500" />} color="border-indigo-500" />
              <div className="grid grid-cols-2 gap-4">
                 <NumericInput label={t.fields.land} value={n('land')} onValueChange={(v) => onChange?.('land', v.floatValue ?? 0)} disabled={isReadOnly} />
                 <NumericInput label={t.fields.building} value={n('building')} onValueChange={(v) => onChange?.('building', v.floatValue ?? 0)} disabled={isReadOnly} />
                 <NumericInput label={t.fields.equipment} value={n('equipment')} onValueChange={(v) => onChange?.('equipment', v.floatValue ?? 0)} disabled={isReadOnly} />
                 <NumericInput label={t.fields.otherFixedAssets} value={n('otherFixedAssets')} onValueChange={(v) => onChange?.('otherFixedAssets', v.floatValue ?? 0)} disabled={isReadOnly} />
                <div className="col-span-2"><SummaryCard label={t.modal.totalFixedAsset} value={totalFixedAssets} color="indigo" fullWidth /></div>
              </div>
            </div>
          </div>

          {/* RIGHT: LIABILITIES & EQUITY */}
          <div className="space-y-8">
            <div>
              <SectionHeader title={t.modal.shortTermLiabilities} icon={<TrendingUp size={16} className="text-amber-500" />} color="border-amber-500" />
              <div className="grid grid-cols-2 gap-4">
                <NumericInput label={t.fields.accountsPayable} value={n('accountsPayable')} onValueChange={(v) => onChange?.('accountsPayable', v.floatValue ?? 0)} disabled={isReadOnly} />
                <NumericInput label={t.fields.bankLoanCurrent} value={n('bankLoanCurrent')} onValueChange={(v) => onChange?.('bankLoanCurrent', v.floatValue ?? 0)} disabled={isReadOnly} />
                <NumericInput label={t.fields.otherCurrentLiabilities} value={n('otherCurrentLiabilities')} onValueChange={(v) => onChange?.('otherCurrentLiabilities', v.floatValue ?? 0)} disabled={isReadOnly} />
                <div className="col-span-2"><SummaryCard label={t.modal.totalShortTermLiabilities} value={totalCurrentLiabilities} color="amber" fullWidth /></div>
              </div>
            </div>

            <div>
              <SectionHeader title={t.modal.longTermLiabilities} icon={<Landmark size={16} className="text-orange-500" />} color="border-orange-500" />
              <div className="grid grid-cols-2 gap-4">
                <NumericInput label={t.fields.bankLoanLongTerm} value={n('bankLoanLongTerm')} onValueChange={(v) => onChange?.('bankLoanLongTerm', v.floatValue ?? 0)} disabled={isReadOnly} />
                <NumericInput label={t.fields.otherLongTermLiabilities} value={n('otherLongTermLiabilities')} onValueChange={(v) => onChange?.('otherLongTermLiabilities', v.floatValue ?? 0)} disabled={isReadOnly} />
                <NumericInput label={t.fields.shareholderLoan} value={n('shareholderLoan')} onValueChange={(v) => onChange?.('shareholderLoan', v.floatValue ?? 0)} disabled={isReadOnly} />
                <div className="col-span-2"><SummaryCard label={t.modal.totalLongTermLiabilities} value={totalNonCurrentLiabilities} color="amber" fullWidth /></div>
              </div>
            </div>

            <div>
              <SectionHeader title={t.modal.equity} icon={<Calculator size={16} className="text-emerald-500" />} color="border-emerald-500" />
              <div className="grid grid-cols-2 gap-4">
                <NumericInput label={t.fields.capital} value={n('capital')} onValueChange={(v) => onChange?.('capital', v.floatValue ?? 0)} disabled={isReadOnly} />
                <NumericInput label={t.fields.earningsAfterTax} value={n('earningsAfterTax')} onValueChange={(v) => onChange?.('earningsAfterTax', v.floatValue ?? 0)} disabled={isReadOnly} />
                <NumericInput label={t.fields.retainedEarnings} value={n('retainedEarnings')} onValueChange={(v) => onChange?.('retainedEarnings', v.floatValue ?? 0)} disabled={isReadOnly} />
                <NumericInput label={t.fields.dividends} value={n('dividends')} onValueChange={(v) => onChange?.('dividends', v.floatValue ?? 0)} disabled={isReadOnly} />
                <div className="col-span-2"><SummaryCard label={t.modal.totalEquity} value={totalEquity} color="emerald" fullWidth /></div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Footer: Total Assets vs Total Liabilities + Equity ── */}
        <div className="pt-8 border-t border-slate-100">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <SummaryCard label={t.modal.totalAssets} value={totalAssets} color="indigo" />
            <SummaryCard label={t.modal.totalLiabEquity} value={totalLiabilitiesEquity} color="emerald" />
          </div>
        </div>

        {/* ── Notes ── */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-tight ml-1">{t.modal.notes}</label>
          <textarea
            value={String(payload.notes ?? '')}
            onChange={(e) => onChange?.('notes', e.target.value)}
            readOnly={isReadOnly}
            placeholder={t.modal.notesPlaceholder}
            rows={3}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all resize-none shadow-sm"
          />
        </div>
      </div>
    </div>
  );
};

// BankLoanForm — Shared form component untuk Bank Loan.
// Dipakai oleh:
//   1. BankLoanManager.tsx (di dalam modal CRUD)
//   2. formRegistry.tsx via createApprovalFormAdapter (di approval context)
//
// Kalkulasi total bunga dan sisa pokok ditampilkan di footer form — pure function.
// Tidak ada fetch data di dalam form.

import React, { useMemo } from 'react';
import { Landmark, Calculator, FileSpreadsheet } from 'lucide-react';
import { cn } from '../../../../utils/cn';
import { formatRupiah } from '../../../../utils/format';
import { bankLoanI18n } from '../../../../i18n/bank-loan';
import { NumericInput } from '../NumericInput';
import { CorporateSelector } from '../CorporateSelector';
import { SearchableSelect } from '../SearchableSelect';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface BankLoanPayload {
  bankId?: string;
  bankName?: string;
  corporateId?: string;
  loanAmount?: number;
  amount?: number; // alias for loanAmount
  interestRate?: number;
  startDate?: string;
  endDate?: string;
  tenor?: number;
  interestType?: 'flat' | 'effective';
  creditType?: 'KMK' | 'KMI';
  installmentAmount?: number;
  alertMinDays?: number;
  notes?: string;
  [key: string]: unknown;
}

export interface BankLoanFormProps {
  payload: BankLoanPayload;
  onChange?: (field: keyof BankLoanPayload, value: unknown) => void;
  readOnly?: boolean;
  language: 'id' | 'en';
  showCorporateSelector?: boolean;
  corporateSelectorDisabled?: boolean;
  bankOptions?: Array<{ value: string; label: string }>;
}

// ── Sub-components ────────────────────────────────────────────────────────────

const FormField: React.FC<{
  label: string;
  value: string;
  onChange?: (val: string) => void;
  readOnly?: boolean;
  type?: string;
  required?: boolean;
}> = ({ label, value, onChange, readOnly = false, type = 'text', required = false }) => (
  <div className="space-y-1.5">
    <label className="text-xs font-bold text-slate-500 uppercase tracking-tight">
      {label}
      {required && !readOnly && <span className="text-red-500 ml-1">*</span>}
    </label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      readOnly={readOnly}
      className={cn(
        'w-full px-4 py-3 text-sm border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm bg-slate-50/30',
        readOnly && 'bg-slate-100 cursor-not-allowed font-medium text-slate-600 border-none shadow-none',
      )}
    />
  </div>
);


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
}> = ({ label, value, color }) => {
  const variants = {
    indigo: 'bg-indigo-50 border-indigo-100 text-indigo-700',
    emerald: 'bg-emerald-50 border-emerald-100 text-emerald-700',
    amber: 'bg-amber-50 border-amber-100 text-amber-700',
    rose: 'bg-rose-50 border-rose-100 text-rose-700',
  };
  return (
    <div className={cn('px-4 py-3 rounded-xl border flex flex-col gap-1 shadow-sm', variants[color])}>
      <span className="text-[10px] font-bold uppercase tracking-wider opacity-70">{label}</span>
      <span className="text-lg font-black">{formatRupiah(value, false)}</span>
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────

export const BankLoanForm: React.FC<BankLoanFormProps> = ({
  payload,
  onChange,
  readOnly = false,
  language,
  showCorporateSelector = true,
  corporateSelectorDisabled = false,
  bankOptions = [],
}) => {
  const t = bankLoanI18n[language];

  const isReadOnly = readOnly || !onChange;

  const loanAmount = parseFloat(String(payload.loanAmount ?? payload.amount ?? 0)) || 0;
  const interestRateRaw = parseFloat(String(payload.interestRate ?? 0)) || 0;
  // interestRate stored as decimal (0.05 = 5%), display as percentage
  const interestRatePercent = interestRateRaw > 1 ? interestRateRaw : interestRateRaw * 100;
  const tenor = parseInt(String(payload.tenor ?? 0)) || 0;

  // Calculations — pure function from payload
  const totalInterest = useMemo(() => {
    if (loanAmount <= 0 || interestRatePercent <= 0 || tenor <= 0) return 0;
    const annualRate = interestRatePercent / 100;
    if (payload.interestType === 'flat') {
      return loanAmount * annualRate * (tenor / 12);
    }
    // Effective: approximate total interest
    const monthlyRate = annualRate / 12;
    const totalPayment = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, tenor)) / (Math.pow(1 + monthlyRate, tenor) - 1) * tenor;
    return Math.max(0, totalPayment - loanAmount);
  }, [loanAmount, interestRatePercent, tenor, payload.interestType]);

  const totalPayment = loanAmount + totalInterest;

  return (
    <div>
      <div className="space-y-6">
        {/* ── Bank & Corporate ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Bank */}
          {bankOptions.length > 0 ? (
            <SearchableSelect
              label={<span className="text-xs font-bold text-slate-500 uppercase tracking-tight flex items-center gap-1.5">
                <Landmark size={12} className="text-indigo-500" />
                {t.modal.bank}
                {!isReadOnly && <span className="text-red-500">*</span>}
              </span>}
              options={bankOptions}
              value={String(payload.bankId ?? '')}
              onChange={(val) => onChange?.('bankId', val)}
              placeholder={t.modal.selectBank}
              disabled={isReadOnly}
              required={!isReadOnly}
            />
          ) : (
            <FormField
              label={t.modal.bank}
              value={String(payload.bankName ?? payload.bankId ?? '')}
              readOnly
            />
          )}

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

        {/* ── Loan Details ── */}
        <div>
          <SectionHeader
            title={language === 'id' ? 'Detail Pinjaman' : 'Loan Details'}
            icon={<FileSpreadsheet size={16} className="text-indigo-500" />}
            color="border-indigo-500"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <NumericInput
              label={t.modal.amount}
              value={loanAmount}
              onValueChange={(v) => onChange?.('loanAmount', v.floatValue ?? 0)}
              disabled={isReadOnly}
              required
            />

            <FormField
              label={t.modal.startDate}
              value={String(payload.startDate ?? '')}
              onChange={(val) => onChange?.('startDate', val)}
              readOnly={isReadOnly}
              type="date"
              required
            />

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-tight">
                {t.modal.tenor}
                {!isReadOnly && <span className="text-red-500 ml-1">*</span>}
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={payload.tenor ?? ''}
                  onChange={(e) => onChange?.('tenor', parseInt(e.target.value) || 0)}
                  readOnly={isReadOnly}
                  min={1}
                  className={cn(
                    'flex-1 px-4 py-3 text-sm border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm bg-slate-50/30',
                    isReadOnly && 'bg-slate-100 cursor-not-allowed font-medium text-slate-600 border-none shadow-none',
                  )}
                />
                <span className="text-sm font-bold text-slate-500 shrink-0">{t.modal.tenorUnit}</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-tight">
                {t.modal.interestRate}
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={interestRatePercent || ''}
                  onChange={(e) => onChange?.('interestRate', parseFloat(e.target.value) / 100 || 0)}
                  readOnly={isReadOnly}
                  min={0}
                  max={100}
                  step={0.01}
                  className={cn(
                    'flex-1 px-4 py-3 text-sm border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm bg-slate-50/30',
                    isReadOnly && 'bg-slate-100 cursor-not-allowed font-medium text-slate-600 border-none shadow-none',
                  )}
                />
                <span className="text-sm font-bold text-slate-500 shrink-0">{t.modal.interestRateUnit}</span>
              </div>
            </div>

            {/* Interest Type */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-tight">{t.modal.interestType}</label>
              <select
                value={String(payload.interestType ?? 'flat')}
                onChange={(e) => onChange?.('interestType', e.target.value)}
                disabled={isReadOnly}
                className={cn(
                  'w-full px-4 py-3 text-sm border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm bg-slate-50/30',
                  isReadOnly && 'bg-slate-100 cursor-not-allowed font-medium text-slate-600 border-none shadow-none',
                )}
              >
                <option value="flat">{t.interestType.flat}</option>
                <option value="effective">{t.interestType.effective}</option>
              </select>
            </div>

            {/* Credit Type */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-tight">{t.modal.creditType}</label>
              <select
                value={String(payload.creditType ?? 'KMK')}
                onChange={(e) => onChange?.('creditType', e.target.value)}
                disabled={isReadOnly}
                className={cn(
                  'w-full px-4 py-3 text-sm border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm bg-slate-50/30',
                  isReadOnly && 'bg-slate-100 cursor-not-allowed font-medium text-slate-600 border-none shadow-none',
                )}
              >
                <option value="KMK">{t.modal.kmk}</option>
                <option value="KMI">{t.modal.kmi}</option>
              </select>
            </div>
          </div>
        </div>

        {/* ── Footer: Calculations ── */}
        <div className="pt-4 border-t border-slate-100">
          <div className="flex items-center gap-2 mb-4">
            <Calculator size={14} className="text-slate-400" />
            <span className="text-xs font-bold text-slate-500 uppercase tracking-tight">
              {language === 'id' ? 'Ringkasan Pinjaman' : 'Loan Summary'}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <SummaryCard
              label={t.modal.amount}
              value={loanAmount}
              color="indigo"
            />
            <SummaryCard
              label={language === 'id' ? 'Total Bunga' : 'Total Interest'}
              value={totalInterest}
              color="amber"
            />
            <SummaryCard
              label={language === 'id' ? 'Total Pembayaran' : 'Total Payment'}
              value={totalPayment}
              color="emerald"
            />
          </div>
        </div>

        {/* ── Notes ── */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-tight ml-1">
            {language === 'id' ? 'Catatan' : 'Notes'}
          </label>
          <textarea
            value={String(payload.notes ?? '')}
            onChange={(e) => onChange?.('notes', e.target.value)}
            readOnly={isReadOnly}
            rows={3}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all resize-none shadow-sm"
          />
        </div>
      </div>
    </div>
  );
};

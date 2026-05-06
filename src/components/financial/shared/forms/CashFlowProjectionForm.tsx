// CashFlowProjectionForm — Shared form component untuk Cash Flow Projection.
// Dipakai oleh:
//   1. CashFlowProjectionManager.tsx (di dalam modal CRUD)
//   2. formRegistry.tsx via createApprovalFormAdapter (di approval context)
//
// Sticky Status Bar menampilkan Total Cash In dan Total Cash Out — selalu terlihat saat scroll.
// Kalkulasi dihitung dari payload.details — pure function, tidak ada fetch data.

import React, { useMemo } from 'react';
import { TrendingUp, TrendingDown, Plus, Trash2, FileSpreadsheet } from 'lucide-react';
import { cn } from '../../../../utils/cn';
import { formatRupiah } from '../../../../utils/format';
import { cashFlowProjectionI18n } from '../../../../i18n/cash-flow-projection';
import { commonsI18n } from '../../../../i18n/commons';
import { CorporateSelector } from '../CorporateSelector';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface CashFlowProjectionDetail {
  month: number;
  group: 'operating' | 'investing' | 'financing';
  type: 'cash-in' | 'cash-out';
  category: string;
  amount: number;
  notes?: string;
  [key: string]: unknown;
}

export interface CashFlowProjectionPayload {
  corporateId?: string;
  fiscalYear?: number;
  initialBalance?: number;
  notes?: string;
  details?: CashFlowProjectionDetail[];
  [key: string]: unknown;
}

export interface CashFlowProjectionFormProps {
  payload: CashFlowProjectionPayload;
  onChange?: (field: keyof CashFlowProjectionPayload, value: unknown) => void;
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

// ── Main Component ────────────────────────────────────────────────────────────

const GROUP_OPTIONS = ['operating', 'investing', 'financing'] as const;
const TYPE_OPTIONS = ['cash-in', 'cash-out'] as const;

export const CashFlowProjectionForm: React.FC<CashFlowProjectionFormProps> = ({
  payload,
  onChange,
  readOnly = false,
  language,
  showCorporateSelector = true,
  corporateSelectorDisabled = false,
}) => {
  const t = cashFlowProjectionI18n[language];
  const common = commonsI18n[language];

  const isReadOnly = readOnly || !onChange;

  const details: CashFlowProjectionDetail[] = Array.isArray(payload.details) ? payload.details : [];

  // Calculations — pure function from payload.details
  const totalCashIn = useMemo(
    () => details.filter((d) => d.type === 'cash-in').reduce((sum, d) => sum + (parseFloat(String(d.amount ?? 0)) || 0), 0),
    [details],
  );

  const totalCashOut = useMemo(
    () => details.filter((d) => d.type === 'cash-out').reduce((sum, d) => sum + (parseFloat(String(d.amount ?? 0)) || 0), 0),
    [details],
  );

  const netCashFlow = totalCashIn - totalCashOut;

  const months = common.shortMonths;

  const handleDetailChange = (index: number, field: keyof CashFlowProjectionDetail, value: unknown) => {
    const updated = details.map((row, i) => i === index ? { ...row, [field]: value } : row);
    onChange?.('details', updated);
  };

  const addDetail = () => {
    onChange?.('details', [
      ...details,
      { month: 1, group: 'operating', type: 'cash-in', category: '', amount: 0 },
    ]);
  };

  const removeDetail = (index: number) => {
    onChange?.('details', details.filter((_, i) => i !== index));
  };

  const formatAmount = (value: number | string) => {
    if (value === undefined || value === null || value === '' || value === 0) {
      return value === 0 ? '0' : '';
    }
    const num = Math.floor(Number(value));
    return isNaN(num) ? '' : num.toLocaleString('id-ID');
  };

  const groupLabel = (group: string) => {
    const map: Record<string, string> = {
      operating: t.operating,
      investing: t.investing,
      financing: t.financing,
    };
    return map[group] ?? group;
  };

  const typeLabel = (type: string) => {
    return type === 'cash-in' ? t.inflow : t.outflow;
  };

  return (
    <div>
      {/* ── Sticky Status Bar ──
          sticky top-0 mengacu ke scroll container terdekat (overflow-y-auto di modal).
          Saat scroll, bar nempel tepat di bawah tab bar (approval) atau header (manager).
          -mx-6 px-6 agar bar melebar penuh ke tepi padding container. */}
      <div className="sticky top-0 z-10 -mx-6 px-6 py-2.5 flex items-center gap-6 border-b mb-6 bg-white/95 backdrop-blur-sm border-slate-100">
        <div className="flex items-center gap-2">
          <TrendingUp size={14} className="text-emerald-500 shrink-0" />
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{t.totalInflow}</span>
          <span className="text-sm font-black text-emerald-600">{formatRupiah(totalCashIn, false)}</span>
        </div>
        <div className="w-px h-4 bg-slate-200" />
        <div className="flex items-center gap-2">
          <TrendingDown size={14} className="text-rose-500 shrink-0" />
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{t.totalOutflow}</span>
          <span className="text-sm font-black text-rose-600">{formatRupiah(totalCashOut, false)}</span>
        </div>
        <div className="w-px h-4 bg-slate-200" />
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{t.netCashFlow}</span>
          <span className={cn('text-sm font-black', netCashFlow >= 0 ? 'text-indigo-600' : 'text-rose-600')}>
            {formatRupiah(netCashFlow, false)}
          </span>
        </div>
      </div>

      <div className="space-y-6">
        {/* ── Header: Corporate & Fiscal Year ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
          {showCorporateSelector && (
            <CorporateSelector
              label={language === 'id' ? 'Perusahaan' : 'Corporate'}
              value={String(payload.corporateId ?? '')}
              onChange={(val) => onChange?.('corporateId', val)}
              placeholder={language === 'id' ? 'Pilih Perusahaan' : 'Select Corporate'}
              disabled={isReadOnly || corporateSelectorDisabled}
              required={!isReadOnly}
            />
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-tight flex items-center gap-1.5">
              <FileSpreadsheet size={12} />
              {t.fiscalYear}
              {!isReadOnly && <span className="text-red-500">*</span>}
            </label>
            <input
              type="number"
              value={payload.fiscalYear ?? ''}
              onChange={(e) => onChange?.('fiscalYear', parseInt(e.target.value) || undefined)}
              readOnly={isReadOnly}
              min={2000}
              max={2100}
              className={cn(
                'w-full px-4 py-3 text-sm border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm bg-slate-50/30',
                isReadOnly && 'bg-slate-100 cursor-not-allowed font-medium text-slate-600 border-none shadow-none',
              )}
            />
          </div>
        </div>

        {/* ── Initial Balance ── */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-tight">{t.initialBalance}</label>
          <input
            type="text"
            inputMode="numeric"
            value={formatAmount(payload.initialBalance ?? 0)}
            onChange={(e) => onChange?.('initialBalance', parseFloat(e.target.value.replace(/[^0-9-]/g, '')) || 0)}
            readOnly={isReadOnly}
            className={cn(
              'w-full px-4 py-3 text-sm border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm bg-slate-50/30',
              isReadOnly && 'bg-slate-100 cursor-not-allowed font-medium text-slate-600 border-none shadow-none',
            )}
          />
        </div>

        {/* ── Details Table ── */}
        <div>
          <SectionHeader
            title={language === 'id' ? 'Rincian Proyeksi' : 'Projection Details'}
            icon={<TrendingUp size={16} className="text-indigo-500" />}
            color="border-indigo-500"
          />

          <div className="space-y-2">
            {/* Header row */}
            {details.length > 0 && (
              <div className="grid grid-cols-12 gap-2 px-1">
                <div className="col-span-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t.month}</div>
                <div className="col-span-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t.group}</div>
                <div className="col-span-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t.type}</div>
                <div className="col-span-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t.category}</div>
                <div className="col-span-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t.amount}</div>
                {!isReadOnly && <div className="col-span-1" />}
              </div>
            )}

            {details.length === 0 && (
              <p className="text-xs text-slate-400 italic py-2">{common.noData}</p>
            )}

            {details.map((row, index) => (
              <div key={index} className="grid grid-cols-12 gap-2 items-center">
                {/* Month */}
                <div className="col-span-2">
                  <select
                    value={row.month}
                    onChange={(e) => handleDetailChange(index, 'month', parseInt(e.target.value))}
                    disabled={isReadOnly}
                    className={cn(
                      'w-full px-2 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-slate-50/30',
                      isReadOnly && 'bg-slate-100 cursor-not-allowed text-slate-600 border-none',
                    )}
                  >
                    {months.map((m, i) => (
                      <option key={i} value={i + 1}>{m}</option>
                    ))}
                  </select>
                </div>

                {/* Group */}
                <div className="col-span-2">
                  <select
                    value={row.group}
                    onChange={(e) => handleDetailChange(index, 'group', e.target.value)}
                    disabled={isReadOnly}
                    className={cn(
                      'w-full px-2 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-slate-50/30',
                      isReadOnly && 'bg-slate-100 cursor-not-allowed text-slate-600 border-none',
                    )}
                  >
                    {GROUP_OPTIONS.map((g) => (
                      <option key={g} value={g}>{groupLabel(g)}</option>
                    ))}
                  </select>
                </div>

                {/* Type */}
                <div className="col-span-2">
                  <select
                    value={row.type}
                    onChange={(e) => handleDetailChange(index, 'type', e.target.value)}
                    disabled={isReadOnly}
                    className={cn(
                      'w-full px-2 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-slate-50/30',
                      isReadOnly && 'bg-slate-100 cursor-not-allowed text-slate-600 border-none',
                    )}
                  >
                    {TYPE_OPTIONS.map((tp) => (
                      <option key={tp} value={tp}>{typeLabel(tp)}</option>
                    ))}
                  </select>
                </div>

                {/* Category */}
                <div className="col-span-3">
                  <input
                    type="text"
                    value={String(row.category ?? '')}
                    onChange={(e) => handleDetailChange(index, 'category', e.target.value)}
                    readOnly={isReadOnly}
                    placeholder={t.category}
                    className={cn(
                      'w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-slate-50/30',
                      isReadOnly && 'bg-slate-100 cursor-not-allowed text-slate-600 border-none',
                    )}
                  />
                </div>

                {/* Amount */}
                <div className="col-span-2">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={formatAmount(row.amount)}
                    onChange={(e) => handleDetailChange(index, 'amount', parseFloat(e.target.value.replace(/[^0-9-]/g, '')) || 0)}
                    readOnly={isReadOnly}
                    placeholder="0"
                    className={cn(
                      'w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-slate-50/30',
                      isReadOnly && 'bg-slate-100 cursor-not-allowed text-slate-600 border-none',
                    )}
                  />
                </div>

                {/* Remove */}
                {!isReadOnly && (
                  <div className="col-span-1 flex justify-center">
                    <button
                      type="button"
                      onClick={() => removeDetail(index)}
                      className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>
            ))}

            {!isReadOnly && (
              <button
                type="button"
                onClick={addDetail}
                className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 px-3 py-2 rounded-xl transition-all cursor-pointer"
              >
                <Plus size={14} />
                {language === 'id' ? 'Tambah Baris' : 'Add Row'}
              </button>
            )}
          </div>
        </div>

        {/* ── Footer Summary ── */}
        <div className="pt-4 border-t border-slate-100">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-100 flex flex-col gap-1 shadow-sm">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 opacity-70">{t.totalInflow}</span>
              <span className="text-lg font-black text-emerald-700">{formatRupiah(totalCashIn, false)}</span>
            </div>
            <div className="px-4 py-3 rounded-xl bg-rose-50 border border-rose-100 flex flex-col gap-1 shadow-sm">
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 opacity-70">{t.totalOutflow}</span>
              <span className="text-lg font-black text-rose-700">{formatRupiah(totalCashOut, false)}</span>
            </div>
            <div className={cn(
              'px-4 py-3 rounded-xl border flex flex-col gap-1 shadow-sm',
              netCashFlow >= 0 ? 'bg-indigo-50 border-indigo-100 text-indigo-700' : 'bg-rose-50 border-rose-100 text-rose-700',
            )}>
              <span className="text-[10px] font-bold uppercase tracking-wider opacity-70">{t.netCashFlow}</span>
              <span className="text-lg font-black">{formatRupiah(netCashFlow, false)}</span>
            </div>
          </div>
        </div>

        {/* ── Notes ── */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-tight ml-1">{t.notes}</label>
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

// IncomeStatementProjectionForm — Shared form component untuk Income Statement Projection.
// Dipakai oleh:
//   1. TargetManager.tsx (di dalam modal CRUD)
//   2. formRegistry.tsx via createApprovalFormAdapter (di approval context)
//
// Sticky Status Bar menampilkan Total Pendapatan dan Total Biaya — selalu terlihat saat scroll.
// Kalkulasi dihitung dari payload — pure function, tidak ada fetch data.

import React, { useMemo } from 'react';
import { TrendingUp, TrendingDown, FileSpreadsheet, Plus, Trash2 } from 'lucide-react';
import { cn } from '../../../../utils/cn';
import { formatRupiah } from '../../../../utils/format';
import { targetI18n } from '../../../../i18n/target';
import { commonsI18n } from '../../../../i18n/commons';
import { NumericInput } from '../NumericInput';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ProjectionDetailRow {
  month: number;
  costCenterId?: string;
  amount: number;
  notes?: string;
  [key: string]: unknown;
}

export interface IncomeStatementProjectionPayload {
  departmentId?: string;
  departmentName?: string;
  fiscalYear?: number;
  relatedToProject?: boolean;
  projectId?: string;
  revenueDetails?: ProjectionDetailRow[];
  costDetails?: ProjectionDetailRow[];
  notes?: string;
  [key: string]: unknown;
}

export interface IncomeStatementProjectionFormProps {
  payload: IncomeStatementProjectionPayload;
  onChange?: (field: keyof IncomeStatementProjectionPayload, value: unknown) => void;
  readOnly?: boolean;
  language: 'id' | 'en';
}

// ── Sub-components ────────────────────────────────────────────────────────────

const SectionHeader: React.FC<{ title: string; icon: React.ReactNode; color: string }> = ({ title, icon, color }) => (
  <div className={cn('flex items-center gap-2 mb-4 pb-2 border-b-2', color)}>
    <div className="p-1.5 rounded-lg bg-white shadow-sm border border-slate-100">{icon}</div>
    <h4 className="font-bold text-sm text-slate-700 tracking-tight uppercase">{title}</h4>
  </div>
);

// ── Main Component ────────────────────────────────────────────────────────────

export const IncomeStatementProjectionForm: React.FC<IncomeStatementProjectionFormProps> = ({
  payload,
  onChange,
  readOnly = false,
  language,
}) => {
  const t = targetI18n[language];
  const common = commonsI18n[language];

  const isReadOnly = readOnly || !onChange;

  const revenueDetails: ProjectionDetailRow[] = Array.isArray(payload.revenueDetails) ? payload.revenueDetails : [];
  const costDetails: ProjectionDetailRow[] = Array.isArray(payload.costDetails) ? payload.costDetails : [];

  // Calculations — pure function from payload
  const totalRevenue = useMemo(
    () => revenueDetails.reduce((sum, row) => sum + (parseFloat(String(row.amount ?? 0)) || 0), 0),
    [revenueDetails],
  );

  const totalCost = useMemo(
    () => costDetails.reduce((sum, row) => sum + (parseFloat(String(row.amount ?? 0)) || 0), 0),
    [costDetails],
  );

  const months = common.shortMonths;

  const handleRevenueRowChange = (index: number, field: keyof ProjectionDetailRow, value: unknown) => {
    const updated = revenueDetails.map((row, i) => i === index ? { ...row, [field]: value } : row);
    onChange?.('revenueDetails', updated);
  };

  const handleCostRowChange = (index: number, field: keyof ProjectionDetailRow, value: unknown) => {
    const updated = costDetails.map((row, i) => i === index ? { ...row, [field]: value } : row);
    onChange?.('costDetails', updated);
  };

  const addRevenueRow = () => {
    onChange?.('revenueDetails', [...revenueDetails, { month: 1, amount: 0 }]);
  };

  const addCostRow = () => {
    onChange?.('costDetails', [...costDetails, { month: 1, amount: 0 }]);
  };

  const removeRevenueRow = (index: number) => {
    onChange?.('revenueDetails', revenueDetails.filter((_, i) => i !== index));
  };

  const removeCostRow = (index: number) => {
    onChange?.('costDetails', costDetails.filter((_, i) => i !== index));
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
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{t.fields.totalRevenue}</span>
          <span className="text-sm font-black text-emerald-600">{formatRupiah(totalRevenue, false)}</span>
        </div>
        <div className="w-px h-4 bg-slate-200" />
        <div className="flex items-center gap-2">
          <TrendingDown size={14} className="text-rose-500 shrink-0" />
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{t.fields.totalCost}</span>
          <span className="text-sm font-black text-rose-600">{formatRupiah(totalCost, false)}</span>
        </div>
      </div>

      <div className="space-y-6">
        {/* ── Header: Department & Fiscal Year ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-tight flex items-center gap-1.5">
              <FileSpreadsheet size={12} />
              {t.fields.department}
            </label>
            <input
              type="text"
              value={String(payload.departmentName ?? payload.departmentId ?? '')}
              readOnly
              className="w-full px-4 py-3 text-sm border border-slate-200 rounded-2xl bg-slate-100 cursor-not-allowed font-medium text-slate-600 border-none shadow-none"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-tight">{t.fields.year}</label>
            <input
              type="number"
              value={payload.fiscalYear ?? ''}
              onChange={(e) => onChange?.('fiscalYear', parseInt(e.target.value) || undefined)}
              readOnly={isReadOnly}
              className={cn(
                'w-full px-4 py-3 text-sm border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm bg-slate-50/30',
                isReadOnly && 'bg-slate-100 cursor-not-allowed font-medium text-slate-600 border-none shadow-none',
              )}
            />
          </div>
        </div>

        {/* ── Revenue Details ── */}
        <div>
          <SectionHeader
            title={t.modal.revenueTitle}
            icon={<TrendingUp size={16} className="text-emerald-500" />}
            color="border-emerald-500"
          />
          <div className="space-y-2">
            {revenueDetails.length === 0 && (
              <p className="text-xs text-slate-400 italic py-2">{common.noData}</p>
            )}
            {revenueDetails.map((row, index) => (
              <div key={index} className="grid grid-cols-12 gap-2 items-center">
                <div className="col-span-4">
                  <select
                    value={row.month}
                    onChange={(e) => handleRevenueRowChange(index, 'month', parseInt(e.target.value))}
                    disabled={isReadOnly}
                    className={cn(
                      'w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-slate-50/30',
                      isReadOnly && 'bg-slate-100 cursor-not-allowed text-slate-600 border-none',
                    )}
                  >
                    {months.map((m, i) => (
                      <option key={i} value={i + 1}>{m}</option>
                    ))}
                  </select>
                </div>
                <div className="col-span-7">
                  <NumericInput
                    value={row.amount}
                    onValueChange={(v) => handleRevenueRowChange(index, 'amount', v.floatValue ?? 0)}
                    disabled={isReadOnly}
                    placeholder="0"
                    className="py-2.5 px-4"
                  />
                </div>
                {!isReadOnly && (
                  <div className="col-span-1 flex justify-center">
                    <button
                      type="button"
                      onClick={() => removeRevenueRow(index)}
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
                onClick={addRevenueRow}
                className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 px-3 py-2 rounded-xl transition-all cursor-pointer"
              >
                <Plus size={14} />
                {t.modal.addRow}
              </button>
            )}
            <div className="pt-2 border-t border-slate-100">
              <div className="px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-100 flex justify-between items-center">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 opacity-70">{t.fields.totalRevenue}</span>
                <span className="text-base font-black text-emerald-700">{formatRupiah(totalRevenue, false)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Cost Details ── */}
        <div>
          <SectionHeader
            title={t.modal.costTitle}
            icon={<TrendingDown size={16} className="text-rose-500" />}
            color="border-rose-500"
          />
          <div className="space-y-2">
            {costDetails.length === 0 && (
              <p className="text-xs text-slate-400 italic py-2">{common.noData}</p>
            )}
            {costDetails.map((row, index) => (
              <div key={index} className="grid grid-cols-12 gap-2 items-center">
                <div className="col-span-4">
                  <select
                    value={row.month}
                    onChange={(e) => handleCostRowChange(index, 'month', parseInt(e.target.value))}
                    disabled={isReadOnly}
                    className={cn(
                      'w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-slate-50/30',
                      isReadOnly && 'bg-slate-100 cursor-not-allowed text-slate-600 border-none',
                    )}
                  >
                    {months.map((m, i) => (
                      <option key={i} value={i + 1}>{m}</option>
                    ))}
                  </select>
                </div>
                <div className="col-span-7">
                  <NumericInput
                    value={row.amount}
                    onValueChange={(v) => handleCostRowChange(index, 'amount', v.floatValue ?? 0)}
                    disabled={isReadOnly}
                    placeholder="0"
                    className="py-2.5 px-4"
                  />
                </div>
                {!isReadOnly && (
                  <div className="col-span-1 flex justify-center">
                    <button
                      type="button"
                      onClick={() => removeCostRow(index)}
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
                onClick={addCostRow}
                className="flex items-center gap-1.5 text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-3 py-2 rounded-xl transition-all cursor-pointer"
              >
                <Plus size={14} />
                {t.modal.addRow}
              </button>
            )}
            <div className="pt-2 border-t border-slate-100">
              <div className="px-4 py-3 rounded-xl bg-rose-50 border border-rose-100 flex justify-between items-center">
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 opacity-70">{t.fields.totalCost}</span>
                <span className="text-base font-black text-rose-700">{formatRupiah(totalCost, false)}</span>
              </div>
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

import React, { useState } from 'react';
import { useToast } from '../../financial/shared/Toast';
import { useAuth } from '../../financial/useAuth';
import { commonsI18n } from '../../../i18n/commons';
import { incomeStatementI18n } from '../../../i18n/income-statement';

interface IncomeStatementFormProps {
  existingPeriods?: string[];
  onSaved?: () => void;
}

interface F {
  period: string;
  pendapatan: string; hpp: string;
  beban_adm: string;
  pendapatan_lain: string; beban_lain: string;
  pajak_penghasilan: string;
}

const empty: F = { period: '', pendapatan: '', hpp: '', beban_adm: '', pendapatan_lain: '', beban_lain: '', pajak_penghasilan: '' };

function n(v: string) { return parseFloat(v) || 0; }
function rp(v: number) { return v === 0 ? 'Rp 0' : `Rp ${v.toLocaleString('id-ID')}`; }

function Inp({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-col gap-0.5">
      <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">{label}</label>
      <input type="number" min="0" step="any" value={value} onChange={(e) => onChange(e.target.value)}
        placeholder="0"
        className="px-2 py-1.5 text-xs border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-400 bg-white" />
    </div>
  );
}

function Total({ label, value, color }: { label: string; value: number; color: string }) {
  const cls: Record<string, string> = {
    green:  'bg-green-50  border-green-400  text-green-800',
    blue:   'bg-blue-50   border-blue-400   text-blue-800',
    purple: 'bg-purple-50 border-purple-400 text-purple-800',
    indigo: 'bg-indigo-50 border-indigo-400 text-indigo-900',
    emerald:'bg-emerald-50 border-emerald-500 text-emerald-900',
    red:    'bg-red-50    border-red-500    text-red-900',
  };
  return (
    <div className={`flex items-center justify-between px-2.5 py-1.5 rounded-md border-2 ${cls[color]}`}>
      <span className="text-[10px] font-bold uppercase tracking-wide">{label}</span>
      <span className="text-xs font-black">{rp(value)}</span>
    </div>
  );
}

export const IncomeStatementForm: React.FC<IncomeStatementFormProps> = ({ existingPeriods = [], onSaved }) => {
  const { language } = useAuth();
  const t = commonsI18n[language];
  const ti = incomeStatementI18n[language];
  const { showSuccess, showError } = useToast();
  const [form, setForm] = useState<F>(empty);
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState(false);

  const set = (k: keyof F, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const laba_kotor          = n(form.pendapatan) - n(form.hpp);
  const laba_usaha          = laba_kotor - n(form.beban_adm);
  const pb_lain             = n(form.pendapatan_lain) - n(form.beban_lain);
  const laba_sebelum_pajak  = laba_usaha + pb_lain;
  const laba_setelah_pajak  = laba_sebelum_pajak - n(form.pajak_penghasilan);

  async function doSave() {
    setSaving(true);
    try {
      const res = await fetch('/api/financial-statements/income-statement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          period: form.period.trim(),
          pendapatan: n(form.pendapatan), hpp: n(form.hpp), laba_kotor,
          beban_adm: n(form.beban_adm), laba_usaha,
          pendapatan_lain: n(form.pendapatan_lain), beban_lain: n(form.beban_lain), pb_lain,
          laba_sebelum_pajak, pajak_penghasilan: n(form.pajak_penghasilan), laba_setelah_pajak,
          // legacy
          revenue: n(form.pendapatan), costOfGoodsSold: n(form.hpp),
          operationalExpenses: n(form.beban_adm), interestExpense: n(form.beban_lain),
          tax: n(form.pajak_penghasilan), netProfit: laba_setelah_pajak,
        }),
      });
      const data = await res.json();
      if (!res.ok) { showError(data.error ?? t.errorSave); return; }
      showSuccess(ti.modal.saveSuccess.replace('{period}', form.period));
      setForm(empty);
      onSaved?.();
    } catch { showError(ti.alerts.errorNetwork); }
    finally { setSaving(false); setConfirm(false); }
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.period.trim()) return;
    if (existingPeriods.includes(form.period.trim())) { setConfirm(true); return; }
    doSave();
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-500 flex items-center justify-between">
        <h3 className="text-sm font-bold text-white">{ti.title}</h3>
        <div className={`px-2 py-0.5 rounded text-[10px] font-bold ${laba_setelah_pajak >= 0 ? 'bg-emerald-400 text-white' : 'bg-red-400 text-white'}`}>
          Net: {rp(laba_setelah_pajak)}
        </div>
      </div>

      <form onSubmit={submit} className="p-4">
        {/* Periode */}
        <div className="mb-3">
          <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">{ti.modal.period} *</label>
          <input type="month" value={form.period} onChange={(e) => set('period', e.target.value)} required
            className="mt-0.5 w-full px-2 py-1.5 text-xs border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-400" />
        </div>

        {/* 3-column grid */}
        <div className="grid grid-cols-3 gap-3">
          {/* Col 1: Pendapatan & HPP */}
          <div className="space-y-2">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-1">{ti.modal.revenueAndCogs}</p>
            <Inp label={ti.fields.revenue} value={form.pendapatan} onChange={(v) => set('pendapatan', v)} />
            <Inp label={ti.fields.cogs} value={form.hpp} onChange={(v) => set('hpp', v)} />
            <Total label={ti.modal.grossProfit} value={laba_kotor} color="green" />
          </div>

          {/* Col 2: Beban & Lain-lain */}
          <div className="space-y-2">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-1">{ti.modal.expensesAndOthers}</p>
            <Inp label={ti.fields.operatingExpenses} value={form.beban_adm} onChange={(v) => set('beban_adm', v)} />
            <Total label={ti.modal.ebit} value={laba_usaha} color="blue" />
            <Inp label={ti.modal.otherIncome} value={form.pendapatan_lain} onChange={(v) => set('pendapatan_lain', v)} />
            <Inp label={ti.fields.interest} value={form.beban_lain} onChange={(v) => set('beban_lain', v)} />
            <Total label={ti.modal.otherIncExp} value={pb_lain} color="purple" />
          </div>

          {/* Col 3: Pajak & Hasil */}
          <div className="space-y-2">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-1">{ti.modal.taxAndResult}</p>
            <Total label={ti.modal.ebt} value={laba_sebelum_pajak} color="indigo" />
            <Inp label={ti.fields.tax} value={form.pajak_penghasilan} onChange={(v) => set('pajak_penghasilan', v)} />
            <Total label={ti.modal.netProfit} value={laba_setelah_pajak} color={laba_setelah_pajak >= 0 ? 'emerald' : 'red'} />
          </div>
        </div>

        <button type="submit" disabled={saving || !form.period.trim()}
          className="mt-4 w-full py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors">
          {saving ? t.saving : ti.modal.saveBtn}
        </button>
      </form>

      {confirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-xs p-5 space-y-3">
            <p className="text-sm font-semibold text-slate-900">{ti.modal.overwriteConfirm.replace('{period}', form.period)}</p>
            <div className="flex gap-2">
              <button onClick={() => setConfirm(false)} className="flex-1 py-1.5 text-xs border border-slate-200 rounded-lg hover:bg-slate-50">{t.cancel}</button>
              <button onClick={doSave} disabled={saving} className="flex-1 py-1.5 text-xs text-white bg-amber-600 rounded-lg hover:bg-amber-700 disabled:opacity-50">
                {saving ? '...' : ti.modal.overwrite}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

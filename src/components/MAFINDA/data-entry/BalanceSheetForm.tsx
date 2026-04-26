import React, { useState } from 'react';
import { useToast } from '../../financial/shared/Toast';
import { useAuth } from '../../../hooks/financial/useAuth';
import { commonsI18n } from '../../../i18n/commons';
import { balanceSheetI18n } from '../../../i18n/balance-sheet';

interface BalanceSheetFormProps {
  existingPeriods?: string[];
  onSaved?: () => void;
}

interface F {
  period: string;
  kas: string; deposito: string; piutang_usaha: string; piutang_lainnya: string;
  uang_muka: string; pekerjaan_dalam_proses: string; pajak_dibayar_dimuka: string; beban_dibayar_dimuka: string;
  aset_tetap: string; aset_tak_berwujud: string; aset_lain: string;
  utang_usaha: string; utang_pajak: string; utang_pembiayaan_pendek: string;
  beban_ymhd_pendek: string; utang_bank_pendek: string;
  utang_pemg_saham: string; beban_ymhd_panjang: string; utang_bank_panjang: string;
  utang_pembiayaan_panjang: string; utang_lainnya: string;
  modal_saham: string; laba_ditahan_ditentukan: string;
  laba_ditahan_belum_ditentukan: string; lr_tahun_berjalan: string;
}

const empty: F = {
  period: '',
  kas: '', deposito: '', piutang_usaha: '', piutang_lainnya: '',
  uang_muka: '', pekerjaan_dalam_proses: '', pajak_dibayar_dimuka: '', beban_dibayar_dimuka: '',
  aset_tetap: '', aset_tak_berwujud: '', aset_lain: '',
  utang_usaha: '', utang_pajak: '', utang_pembiayaan_pendek: '',
  beban_ymhd_pendek: '', utang_bank_pendek: '',
  utang_pemg_saham: '', beban_ymhd_panjang: '', utang_bank_panjang: '',
  utang_pembiayaan_panjang: '', utang_lainnya: '',
  modal_saham: '', laba_ditahan_ditentukan: '',
  laba_ditahan_belum_ditentukan: '', lr_tahun_berjalan: '',
};

function n(v: string) { return parseFloat(v) || 0; }
function rp(v: number) { return `Rp ${v.toLocaleString('id-ID')}`; }

function Inp({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-col gap-0.5">
      <label className="text-[9px] font-semibold text-slate-500 uppercase tracking-wide leading-tight">{label}</label>
      <input type="number" min="0" step="any" value={value} onChange={(e) => onChange(e.target.value)}
        placeholder="0"
        className="px-2 py-1 text-xs border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-400 bg-white" />
    </div>
  );
}

function SectionTotal({ label, value, color }: { label: string; value: number; color: string }) {
  const cls: Record<string, string> = {
    indigo: 'bg-indigo-50 border-indigo-400 text-indigo-900',
    orange: 'bg-orange-50 border-orange-400 text-orange-900',
    red:    'bg-red-50    border-red-500    text-red-900',
    green:  'bg-green-50  border-green-500  text-green-900',
    purple: 'bg-purple-50 border-purple-500 text-purple-900',
  };
  return (
    <div className={`flex items-center justify-between px-2 py-1 rounded border-2 ${cls[color]}`}>
      <span className="text-[9px] font-bold uppercase tracking-wide">{label}</span>
      <span className="text-[10px] font-black">{rp(value)}</span>
    </div>
  );
}

function GrandTotal({ label, value, color }: { label: string; value: number; color: string }) {
  const cls: Record<string, string> = {
    indigo: 'bg-indigo-600 text-white',
    red:    'bg-red-600    text-white',
    purple: 'bg-purple-600 text-white',
  };
  return (
    <div className={`flex items-center justify-between px-3 py-1.5 rounded-lg ${cls[color]}`}>
      <span className="text-[10px] font-black uppercase tracking-wide">{label}</span>
      <span className="text-xs font-black">{rp(value)}</span>
    </div>
  );
}

function ColHeader({ label, color }: { label: string; color: string }) {
  const cls: Record<string, string> = {
    blue:   'bg-blue-600',
    orange: 'bg-orange-500',
    green:  'bg-green-600',
  };
  return (
    <div className={`${cls[color]} text-white text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-t-lg`}>
      {label}
    </div>
  );
}

export const BalanceSheetForm: React.FC<BalanceSheetFormProps> = ({ existingPeriods = [], onSaved }) => {
  const { language } = useAuth();
  const t = commonsI18n[language];
  const tb = balanceSheetI18n[language];
  const { showSuccess, showError } = useToast();
  const [form, setForm] = useState<F>(empty);
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState(false);

  const set = (k: keyof F, v: string) => setForm((f) => ({ ...f, [k]: v }));

  // ── Autosum ──────────────────────────────────────────────────────────────
  const aset_lancar    = n(form.kas) + n(form.deposito) + n(form.piutang_usaha) + n(form.piutang_lainnya)
                       + n(form.uang_muka) + n(form.pekerjaan_dalam_proses) + n(form.pajak_dibayar_dimuka) + n(form.beban_dibayar_dimuka);
  const aset_tak_lancar = n(form.aset_tetap) + n(form.aset_tak_berwujud) + n(form.aset_lain);
  const total_aset     = aset_lancar + aset_tak_lancar;

  const kwjbn_pendek   = n(form.utang_usaha) + n(form.utang_pajak) + n(form.utang_pembiayaan_pendek)
                       + n(form.beban_ymhd_pendek) + n(form.utang_bank_pendek);
  const kwjbn_panjang  = n(form.utang_pemg_saham) + n(form.beban_ymhd_panjang) + n(form.utang_bank_panjang)
                       + n(form.utang_pembiayaan_panjang) + n(form.utang_lainnya);
  const total_kwjbn    = kwjbn_pendek + kwjbn_panjang;

  const total_ekuitas  = n(form.modal_saham) + n(form.laba_ditahan_ditentukan)
                       + n(form.laba_ditahan_belum_ditentukan) + n(form.lr_tahun_berjalan);
  const total_kwjbn_ekuitas = total_kwjbn + total_ekuitas;

  const balanced = total_aset > 0 && Math.abs(total_aset - total_kwjbn_ekuitas) < 1;

  async function doSave() {
    setSaving(true);
    try {
      const res = await fetch('/api/financial-statements/balance-sheet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          period: form.period.trim(),
          kas: n(form.kas), deposito: n(form.deposito), piutang_usaha: n(form.piutang_usaha),
          piutang_lainnya: n(form.piutang_lainnya), uang_muka: n(form.uang_muka),
          pekerjaan_dalam_proses: n(form.pekerjaan_dalam_proses),
          pajak_dibayar_dimuka: n(form.pajak_dibayar_dimuka), beban_dibayar_dimuka: n(form.beban_dibayar_dimuka),
          aset_tetap: n(form.aset_tetap), aset_tak_berwujud: n(form.aset_tak_berwujud), aset_lain: n(form.aset_lain),
          utang_usaha: n(form.utang_usaha), utang_pajak: n(form.utang_pajak),
          utang_pembiayaan_pendek: n(form.utang_pembiayaan_pendek), beban_ymhd_pendek: n(form.beban_ymhd_pendek),
          utang_bank_pendek: n(form.utang_bank_pendek), utang_pemg_saham: n(form.utang_pemg_saham),
          beban_ymhd_panjang: n(form.beban_ymhd_panjang), utang_bank_panjang: n(form.utang_bank_panjang),
          utang_pembiayaan_panjang: n(form.utang_pembiayaan_panjang), utang_lainnya: n(form.utang_lainnya),
          modal_saham: n(form.modal_saham), laba_ditahan_ditentukan: n(form.laba_ditahan_ditentukan),
          laba_ditahan_belum_ditentukan: n(form.laba_ditahan_belum_ditentukan), lr_tahun_berjalan: n(form.lr_tahun_berjalan),
          aset_lancar, aset_tak_lancar, total_aset,
          jumlah_kewajiban_pendek: kwjbn_pendek, jumlah_kewajiban_panjang: kwjbn_panjang,
          jumlah_kewajiban: total_kwjbn, jumlah_ekuitas: total_ekuitas, jumlah_kewajiban_ekuitas: total_kwjbn_ekuitas,
          // legacy
          currentAssets: aset_lancar, fixedAssets: aset_tak_lancar, otherAssets: 0,
          shortTermLiabilities: kwjbn_pendek, longTermLiabilities: kwjbn_panjang,
          paidInCapital: n(form.modal_saham),
          retainedEarnings: n(form.laba_ditahan_ditentukan) + n(form.laba_ditahan_belum_ditentukan),
          otherEquity: n(form.lr_tahun_berjalan),
        }),
      });
      const data = await res.json();
      if (!res.ok) { showError(data.error ?? t.errorSave); return; }
      showSuccess(t.successSave);
      setForm(empty);
      onSaved?.();
    } catch { showError(t.errorNetwork); }
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
      <div className="px-4 py-2.5 bg-gradient-to-r from-slate-800 to-slate-700 flex items-center justify-between">
        <h3 className="text-sm font-bold text-white">{tb.title}</h3>
        <div className={`px-2 py-0.5 rounded text-[10px] font-bold ${balanced ? 'bg-emerald-400 text-white' : total_aset > 0 ? 'bg-red-400 text-white' : 'bg-slate-600 text-slate-300'}`}>
          {balanced 
            ? `✓ ${tb.status.balanced}`
            : total_aset > 0 
              ? `⚠ ${tb.status.unbalanced}`
              : tb.modal.noData}
        </div>
      </div>

      <form onSubmit={submit} className="p-4">
        {/* Periode */}
        <div className="mb-3 flex items-center gap-3">
          <div className="flex flex-col gap-0.5 w-48">
            <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">{tb.modal.period} *</label>
            <input type="month" value={form.period} onChange={(e) => set('period', e.target.value)} required
              className="px-2 py-1.5 text-xs border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-400" />
          </div>
          {total_aset > 0 && (
            <div className="flex gap-3 text-xs">
              <span className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded font-semibold">{tb.modal.totalAssets}: {rp(total_aset)}</span>
              <span className="px-2 py-1 bg-red-50 text-red-700 rounded font-semibold">{tb.modal.liabilities.slice(0,5)}: {rp(total_kwjbn)}</span>
              <span className="px-2 py-1 bg-green-50 text-green-700 rounded font-semibold">{tb.modal.equity}: {rp(total_ekuitas)}</span>
            </div>
          )}
        </div>

        {/* 3-column grid */}
        <div className="grid grid-cols-3 gap-3">

          {/* ── COL 1: ASET ── */}
          <div className="space-y-1.5">
            <ColHeader label={tb.modal.totalAssets} color="blue" />
            <div className="border border-slate-100 rounded-b-lg p-2 space-y-1.5 bg-slate-50">
              <p className="text-[9px] font-bold text-slate-400 uppercase">{tb.modal.activa}</p>
              <Inp label={tb.fields.cashAndBank} value={form.kas} onChange={(v) => set('kas', v)} />
              <Inp label={language === 'id' ? 'Deposito' : 'Deposits'} value={form.deposito} onChange={(v) => set('deposito', v)} />
              <Inp label={tb.fields.accountsReceivable} value={form.piutang_usaha} onChange={(v) => set('piutang_usaha', v)} />
              <Inp label={language === 'id' ? 'Piutang Lainnya' : 'Other Receivables'} value={form.piutang_lainnya} onChange={(v) => set('piutang_lainnya', v)} />
              <Inp label={language === 'id' ? 'Uang Muka' : 'Advances'} value={form.uang_muka} onChange={(v) => set('uang_muka', v)} />
              <Inp label={tb.fields.workInProgress} value={form.pekerjaan_dalam_proses} onChange={(v) => set('pekerjaan_dalam_proses', v)} />
              <Inp label={language === 'id' ? 'Pjk Dibyr Dimuka' : 'Prepaid Tax'} value={form.pajak_dibayar_dimuka} onChange={(v) => set('pajak_dibayar_dimuka', v)} />
              <Inp label={tb.fields.prepaidExpenses} value={form.beban_dibayar_dimuka} onChange={(v) => set('beban_dibayar_dimuka', v)} />
              <SectionTotal label={tb.modal.totalActiva} value={aset_lancar} color="indigo" />

              <p className="text-[9px] font-bold text-slate-400 uppercase pt-1">{tb.modal.fixedAsset}</p>
              <Inp label={language === 'id' ? 'Aset Tetap' : 'Fixed Assets'} value={form.aset_tetap} onChange={(v) => set('aset_tetap', v)} />
              <Inp label={language === 'id' ? 'Aset Tak Berwujud' : 'Intangible Assets'} value={form.aset_tak_berwujud} onChange={(v) => set('aset_tak_berwujud', v)} />
              <Inp label={language === 'id' ? 'Aset Lain' : 'Other Assets'} value={form.aset_lain} onChange={(v) => set('aset_lain', v)} />
              <SectionTotal label={tb.modal.totalFixedAsset} value={aset_tak_lancar} color="indigo" />
            </div>
            <GrandTotal label={tb.modal.totalAssets} value={total_aset} color="indigo" />
          </div>

          {/* ── COL 2: KEWAJIBAN ── */}
          <div className="space-y-1.5">
            <ColHeader label={tb.modal.liabilities} color="orange" />
            <div className="border border-slate-100 rounded-b-lg p-2 space-y-1.5 bg-slate-50">
              <p className="text-[9px] font-bold text-slate-400 uppercase">{tb.modal.shortTermLiabilities}</p>
              <Inp label={tb.fields.accountsPayable} value={form.utang_usaha} onChange={(v) => set('utang_usaha', v)} />
              <Inp label={language === 'id' ? 'Utang Pajak' : 'Tax Payable'} value={form.utang_pajak} onChange={(v) => set('utang_pajak', v)} />
              <Inp label={language === 'id' ? 'Utang Pembiayaan' : 'Financing Payable'} value={form.utang_pembiayaan_pendek} onChange={(v) => set('utang_pembiayaan_pendek', v)} />
              <Inp label={language === 'id' ? 'Beban YMHD' : 'Accrued Expenses'} value={form.beban_ymhd_pendek} onChange={(v) => set('beban_ymhd_pendek', v)} />
              <Inp label={tb.fields.bankLoanCurrent} value={form.utang_bank_pendek} onChange={(v) => set('utang_bank_pendek', v)} />
              <SectionTotal label={tb.modal.totalShortTermLiabilities} value={kwjbn_pendek} color="orange" />

              <p className="text-[9px] font-bold text-slate-400 uppercase pt-1">{tb.modal.longTermLiabilities}</p>
              <Inp label={tb.fields.shareholderLoan} value={form.utang_pemg_saham} onChange={(v) => set('utang_pemg_saham', v)} />
              <Inp label={language === 'id' ? 'Beban YMHD' : 'Accrued Expenses'} value={form.beban_ymhd_panjang} onChange={(v) => set('beban_ymhd_panjang', v)} />
              <Inp label={tb.fields.bankLoanLongTerm} value={form.utang_bank_panjang} onChange={(v) => set('utang_bank_panjang', v)} />
              <Inp label={language === 'id' ? 'Utang Pembiayaan' : 'Financing Payable'} value={form.utang_pembiayaan_panjang} onChange={(v) => set('utang_pembiayaan_panjang', v)} />
              <Inp label={language === 'id' ? 'Utang Lainnya' : 'Other Liabilities'} value={form.utang_lainnya} onChange={(v) => set('utang_lainnya', v)} />
              <SectionTotal label={tb.modal.totalLongTermLiabilities} value={kwjbn_panjang} color="red" />
            </div>
            <GrandTotal label={tb.modal.totalLiab} value={total_kwjbn} color="red" />
          </div>

          {/* ── COL 3: EKUITAS ── */}
          <div className="space-y-1.5">
            <ColHeader label={tb.modal.equity} color="green" />
            <div className="border border-slate-100 rounded-b-lg p-2 space-y-1.5 bg-slate-50">
              <Inp label={tb.fields.capital} value={form.modal_saham} onChange={(v) => set('modal_saham', v)} />
              <Inp label={language === 'id' ? 'Laba Ditahan Ditentukan' : 'Appropriated Retained Earnings'} value={form.laba_ditahan_ditentukan} onChange={(v) => set('laba_ditahan_ditentukan', v)} />
              <Inp label={language === 'id' ? 'Laba Ditahan Blm Ditentukan' : 'Unappropriated Retained Earnings'} value={form.laba_ditahan_belum_ditentukan} onChange={(v) => set('laba_ditahan_belum_ditentukan', v)} />
              <Inp label={tb.fields.earningsAfterTax} value={form.lr_tahun_berjalan} onChange={(v) => set('lr_tahun_berjalan', v)} />
              <SectionTotal label={tb.modal.totalEquity} value={total_ekuitas} color="green" />
            </div>
            <GrandTotal label={tb.modal.totalEquity} value={total_ekuitas} color="purple" />

            {/* Balance check */}
            {total_aset > 0 && (
              <div className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-[10px] font-semibold ${balanced ? 'bg-emerald-50 text-emerald-800 border border-emerald-300' : 'bg-red-50 text-red-800 border border-red-300'}`}>
                <span>{balanced ? '✓' : '⚠'}</span>
                <span>{balanced ? tb.status.balanced : `${tb.modal.diff}: ${rp(Math.abs(total_aset - total_kwjbn_ekuitas))}`}</span>
              </div>
            )}

            <div className="pt-1 border-t border-slate-100">
              <div className="flex items-center justify-between px-2 py-1 bg-slate-100 rounded text-[9px] font-bold text-slate-600 uppercase">
                <span>{tb.modal.totalLiabEquityCompact}</span>
                <span>{rp(total_kwjbn_ekuitas)}</span>
              </div>
            </div>
          </div>
        </div>

        <button type="submit" disabled={saving || !form.period.trim()}
          className="mt-4 w-full py-2 text-xs font-semibold text-white bg-slate-800 rounded-lg hover:bg-slate-900 disabled:opacity-50 transition-colors">
          {saving ? t.saving : t.save}
        </button>
      </form>

      {confirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-xs p-5 space-y-3">
            <p className="text-sm font-semibold text-slate-900">{tb.modal.overwriteConfirm}</p>
            <div className="flex gap-2">
              <button onClick={() => setConfirm(false)} className="flex-1 py-1.5 text-xs border border-slate-200 rounded-lg hover:bg-slate-50">{t.cancel}</button>
              <button onClick={doSave} disabled={saving} className="flex-1 py-1.5 text-xs text-white bg-amber-600 rounded-lg hover:bg-amber-700 disabled:opacity-50">
                {saving ? '...' : tb.modal.overwrite}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

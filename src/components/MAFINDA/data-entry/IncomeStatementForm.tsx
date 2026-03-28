// IncomeStatementForm.tsx — Form input data Laba Rugi (Income Statement)
// Requirements: 8.2, 8.4, 8.5, 8.6

import React, { useState } from 'react';
import { useToast } from '../../financial/shared/Toast';

interface IncomeStatementFormProps {
  existingPeriods?: string[];
  onSaved?: () => void;
}

interface FormState {
  period: string;
  revenue: string;
  costOfGoodsSold: string;
  operationalExpenses: string;
  interestExpense: string;
  tax: string;
  netProfit: string;
}

const emptyForm: FormState = {
  period: '',
  revenue: '',
  costOfGoodsSold: '',
  operationalExpenses: '',
  interestExpense: '',
  tax: '',
  netProfit: '',
};

const fieldLabels: Record<keyof FormState, string> = {
  period: 'Periode',
  revenue: 'Total Pendapatan (Revenue)',
  costOfGoodsSold: 'Harga Pokok Penjualan (HPP)',
  operationalExpenses: 'Beban Operasional',
  interestExpense: 'Beban Bunga',
  tax: 'Pajak',
  netProfit: 'Laba Bersih',
};

const numericFields: (keyof FormState)[] = [
  'revenue', 'costOfGoodsSold', 'operationalExpenses',
  'interestExpense', 'tax', 'netProfit',
];

function parseNum(val: string): number {
  return parseFloat(val) || 0;
}

function isValidNonNegative(val: string): boolean {
  if (val.trim() === '') return false;
  const n = parseFloat(val);
  return !isNaN(n) && n >= 0;
}

export const IncomeStatementForm: React.FC<IncomeStatementFormProps> = ({
  existingPeriods = [],
  onSaved,
}) => {
  const { showSuccess, showError } = useToast();
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [confirmOverwrite, setConfirmOverwrite] = useState(false);
  const [touched, setTouched] = useState<Partial<Record<keyof FormState, boolean>>>({});

  function isFormValid(): boolean {
    if (!form.period.trim()) return false;
    return numericFields.every((f) => isValidNonNegative(form[f]));
  }

  function getFieldError(field: keyof FormState): string | null {
    if (!touched[field]) return null;
    if (field === 'period') return form.period.trim() ? null : 'Periode wajib diisi';
    const val = form[field];
    if (val.trim() === '') return `${fieldLabels[field]} wajib diisi`;
    const n = parseFloat(val);
    if (isNaN(n)) return 'Harus berupa angka valid';
    if (n < 0) return 'Nilai tidak boleh negatif';
    return null;
  }

  function handleChange(field: keyof FormState, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function handleBlur(field: keyof FormState) {
    setTouched((t) => ({ ...t, [field]: true }));
  }

  async function doSave() {
    setSaving(true);
    try {
      const res = await fetch('/api/financial-statements/income-statement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          period: form.period.trim(),
          revenue: parseNum(form.revenue),
          costOfGoodsSold: parseNum(form.costOfGoodsSold),
          operationalExpenses: parseNum(form.operationalExpenses),
          interestExpense: parseNum(form.interestExpense),
          tax: parseNum(form.tax),
          netProfit: parseNum(form.netProfit),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        showError(data.error ?? 'Gagal menyimpan laba rugi');
        return;
      }
      showSuccess(`Laba Rugi periode ${form.period} berhasil disimpan`);
      setForm(emptyForm);
      setTouched({});
      onSaved?.();
    } catch {
      showError('Terjadi kesalahan jaringan');
    } finally {
      setSaving(false);
      setConfirmOverwrite(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const allTouched = Object.fromEntries(
      (Object.keys(form) as (keyof FormState)[]).map((k) => [k, true])
    ) as Record<keyof FormState, boolean>;
    setTouched(allTouched);
    if (!isFormValid()) return;

    if (existingPeriods.includes(form.period.trim())) {
      setConfirmOverwrite(true);
      return;
    }
    doSave();
  }

  const fieldGroups = [
    {
      legend: 'Pendapatan',
      fields: ['revenue'] as const,
    },
    {
      legend: 'Beban',
      fields: ['costOfGoodsSold', 'operationalExpenses', 'interestExpense', 'tax'] as const,
    },
    {
      legend: 'Hasil',
      fields: ['netProfit'] as const,
    },
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6">
      <h3 className="text-sm font-semibold text-slate-900 mb-4">Input Laba Rugi (Income Statement)</h3>
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {/* Period */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">
            Periode <span className="text-red-500">*</span>
          </label>
          <input
            type="month"
            value={form.period}
            onChange={(e) => handleChange('period', e.target.value)}
            onBlur={() => handleBlur('period')}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {getFieldError('period') && (
            <p className="text-xs text-red-500 mt-1">{getFieldError('period')}</p>
          )}
        </div>

        {fieldGroups.map(({ legend, fields }) => (
          <fieldset key={legend} className="border border-slate-100 rounded-lg p-4 space-y-3">
            <legend className="text-xs font-semibold text-slate-500 px-1">{legend}</legend>
            {fields.map((field) => (
              <div key={field}>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  {fieldLabels[field]} <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={form[field]}
                  onChange={(e) => handleChange(field, e.target.value)}
                  onBlur={() => handleBlur(field)}
                  placeholder="0"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {getFieldError(field) && (
                  <p className="text-xs text-red-500 mt-1">{getFieldError(field)}</p>
                )}
              </div>
            ))}
          </fieldset>
        ))}

        <button
          type="submit"
          disabled={saving}
          className="w-full py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {saving ? 'Menyimpan...' : 'Simpan Laba Rugi'}
        </button>
      </form>

      {/* Confirm overwrite modal */}
      {confirmOverwrite && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                <svg className="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                </svg>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-900">Data Sudah Ada</h4>
                <p className="text-xs text-slate-500 mt-1">
                  Laba Rugi untuk periode <span className="font-medium text-slate-700">{form.period}</span> sudah ada.
                  Apakah Anda ingin menimpa data yang ada?
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmOverwrite(false)}
                className="flex-1 py-2 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                onClick={doSave}
                disabled={saving}
                className="flex-1 py-2 text-sm font-medium text-white bg-amber-600 rounded-lg hover:bg-amber-700 disabled:opacity-50"
              >
                {saving ? 'Menyimpan...' : 'Timpa Data'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

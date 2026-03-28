// CashFlowStatementForm.tsx — Form input data Arus Kas (Cash Flow Statement)
// Requirements: 8.3, 8.4, 8.5, 8.6

import React, { useState } from 'react';
import { useToast } from '../../financial/shared/Toast';
import type { Department, Project } from '../../../hooks/mafinda/useManagement';

interface CashFlowStatementFormProps {
  departments?: Department[];
  projects?: Project[];
  existingKeys?: Array<{ period: string; departmentId?: string; projectId?: string }>;
  onSaved?: () => void;
}

interface FormState {
  period: string;
  departmentId: string;
  projectId: string;
  operatingCashIn: string;
  operatingCashOut: string;
  investingCashIn: string;
  investingCashOut: string;
  financingCashIn: string;
  financingCashOut: string;
}

const emptyForm: FormState = {
  period: '',
  departmentId: '',
  projectId: '',
  operatingCashIn: '',
  operatingCashOut: '',
  investingCashIn: '',
  investingCashOut: '',
  financingCashIn: '',
  financingCashOut: '',
};

const cashFieldLabels: Record<string, string> = {
  operatingCashIn: 'Cash In dari Operasi',
  operatingCashOut: 'Cash Out dari Operasi',
  investingCashIn: 'Cash In dari Investasi',
  investingCashOut: 'Cash Out dari Investasi',
  financingCashIn: 'Cash In dari Pendanaan',
  financingCashOut: 'Cash Out dari Pendanaan',
};

const cashFields = Object.keys(cashFieldLabels) as (keyof FormState)[];

function parseNum(val: string): number {
  return parseFloat(val) || 0;
}

function isValidNonNegative(val: string): boolean {
  if (val.trim() === '') return false;
  const n = parseFloat(val);
  return !isNaN(n) && n >= 0;
}

export const CashFlowStatementForm: React.FC<CashFlowStatementFormProps> = ({
  departments = [],
  projects = [],
  existingKeys = [],
  onSaved,
}) => {
  const { showSuccess, showError } = useToast();
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [confirmOverwrite, setConfirmOverwrite] = useState(false);
  const [touched, setTouched] = useState<Partial<Record<keyof FormState, boolean>>>({});

  const filteredProjects = form.departmentId
    ? projects.filter((p) => p.departmentId === form.departmentId && p.isActive)
    : [];

  function isFormValid(): boolean {
    if (!form.period.trim()) return false;
    return cashFields.every((f) => isValidNonNegative(form[f]));
  }

  function getFieldError(field: keyof FormState): string | null {
    if (!touched[field]) return null;
    if (field === 'period') return form.period.trim() ? null : 'Periode wajib diisi';
    if (field === 'departmentId' || field === 'projectId') return null;
    const val = form[field];
    if (val.trim() === '') return `${cashFieldLabels[field]} wajib diisi`;
    const n = parseFloat(val);
    if (isNaN(n)) return 'Harus berupa angka valid';
    if (n < 0) return 'Nilai tidak boleh negatif';
    return null;
  }

  function handleChange(field: keyof FormState, value: string) {
    setForm((f) => {
      const next = { ...f, [field]: value };
      // Reset projectId when department changes
      if (field === 'departmentId') next.projectId = '';
      return next;
    });
  }

  function handleBlur(field: keyof FormState) {
    setTouched((t) => ({ ...t, [field]: true }));
  }

  function isDuplicate(): boolean {
    return existingKeys.some(
      (k) =>
        k.period === form.period.trim() &&
        (k.departmentId ?? '') === form.departmentId &&
        (k.projectId ?? '') === form.projectId
    );
  }

  async function doSave() {
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        period: form.period.trim(),
        operatingCashIn: parseNum(form.operatingCashIn),
        operatingCashOut: parseNum(form.operatingCashOut),
        investingCashIn: parseNum(form.investingCashIn),
        investingCashOut: parseNum(form.investingCashOut),
        financingCashIn: parseNum(form.financingCashIn),
        financingCashOut: parseNum(form.financingCashOut),
      };
      if (form.departmentId) body.departmentId = form.departmentId;
      if (form.projectId) body.projectId = form.projectId;

      const res = await fetch('/api/financial-statements/cash-flow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        showError(data.error ?? 'Gagal menyimpan arus kas');
        return;
      }
      showSuccess(`Arus Kas periode ${form.period} berhasil disimpan`);
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

    if (isDuplicate()) {
      setConfirmOverwrite(true);
      return;
    }
    doSave();
  }

  const cashGroups = [
    { legend: 'Aktivitas Operasi', fields: ['operatingCashIn', 'operatingCashOut'] as const },
    { legend: 'Aktivitas Investasi', fields: ['investingCashIn', 'investingCashOut'] as const },
    { legend: 'Aktivitas Pendanaan', fields: ['financingCashIn', 'financingCashOut'] as const },
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6">
      <h3 className="text-sm font-semibold text-slate-900 mb-4">Input Arus Kas (Cash Flow Statement)</h3>
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

        {/* Optional: Department & Project */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Departemen <span className="text-slate-400 font-normal">(opsional)</span>
            </label>
            <select
              value={form.departmentId}
              onChange={(e) => handleChange('departmentId', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">— Semua —</option>
              {departments.filter((d) => d.isActive).map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Proyek <span className="text-slate-400 font-normal">(opsional)</span>
            </label>
            <select
              value={form.projectId}
              onChange={(e) => handleChange('projectId', e.target.value)}
              disabled={!form.departmentId}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white disabled:opacity-50"
            >
              <option value="">— Semua —</option>
              {filteredProjects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Cash flow groups */}
        {cashGroups.map(({ legend, fields }) => (
          <fieldset key={legend} className="border border-slate-100 rounded-lg p-4 space-y-3">
            <legend className="text-xs font-semibold text-slate-500 px-1">{legend}</legend>
            {fields.map((field) => (
              <div key={field}>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  {cashFieldLabels[field]} <span className="text-red-500">*</span>
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
          {saving ? 'Menyimpan...' : 'Simpan Arus Kas'}
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
                  Arus Kas untuk kombinasi periode dan entitas ini sudah ada.
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

// FinancialDataForm.tsx - Manual financial data entry form
// Requirements: 2.1, 12.6

import React, { useState } from 'react';
import { useSubsidiaries } from '../../../hooks/financial/useSubsidiaries';
import { PeriodType } from '../../../types/financial/financialData';

const API_BASE = '/api/frs';

function getToken(): string {
  return localStorage.getItem('frs_token') ?? '';
}

interface FormData {
  subsidiaryId: string;
  periodType: PeriodType;
  periodStartDate: string;
  periodEndDate: string;
  // Income Statement
  revenue: string;
  netProfit: string;
  operatingCashFlow: string;
  interestExpense: string;
  // Balance Sheet
  cash: string;
  inventory: string;
  currentAssets: string;
  totalAssets: string;
  currentLiabilities: string;
  shortTermDebt: string;
  currentPortionLongTermDebt: string;
  totalLiabilities: string;
  totalEquity: string;
}

const emptyForm: FormData = {
  subsidiaryId: '',
  periodType: 'annual',
  periodStartDate: '',
  periodEndDate: '',
  revenue: '',
  netProfit: '',
  operatingCashFlow: '',
  interestExpense: '0',
  cash: '',
  inventory: '0',
  currentAssets: '',
  totalAssets: '',
  currentLiabilities: '',
  shortTermDebt: '0',
  currentPortionLongTermDebt: '0',
  totalLiabilities: '',
  totalEquity: '',
};

interface ValidationError {
  field: string;
  message: string;
}

function validateForm(form: FormData): ValidationError[] {
  const errors: ValidationError[] = [];
  const required = [
    'subsidiaryId', 'periodStartDate', 'periodEndDate',
    'revenue', 'netProfit', 'operatingCashFlow',
    'cash', 'currentAssets', 'totalAssets',
    'currentLiabilities', 'totalLiabilities', 'totalEquity',
  ];

  for (const field of required) {
    if (!form[field as keyof FormData]) {
      errors.push({ field, message: 'This field is required' });
    }
  }

  // Accounting equation check
  const assets = parseFloat(form.totalAssets);
  const liabilities = parseFloat(form.totalLiabilities);
  const equity = parseFloat(form.totalEquity);
  if (!isNaN(assets) && !isNaN(liabilities) && !isNaN(equity)) {
    const diff = Math.abs(assets - (liabilities + equity));
    const tolerance = assets * 0.0001;
    if (diff > tolerance) {
      errors.push({
        field: 'totalAssets',
        message: `Accounting equation imbalance: Assets (${assets}) ≠ Liabilities (${liabilities}) + Equity (${equity})`,
      });
    }
  }

  return errors;
}

interface FinancialDataFormProps {
  onSuccess?: () => void;
}

export const FinancialDataForm: React.FC<FinancialDataFormProps> = ({ onSuccess }) => {
  const { subsidiaries } = useSubsidiaries();
  const [form, setForm] = useState<FormData>(emptyForm);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  function setField(field: keyof FormData, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    // Clear validation error for this field
    setValidationErrors((prev) => prev.filter((e) => e.field !== field));
  }

  function getFieldError(field: string): string | undefined {
    return validationErrors.find((e) => e.field === field)?.message;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errors = validateForm(form);
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);

    try {
      const payload = {
        subsidiaryId: form.subsidiaryId,
        periodType: form.periodType,
        periodStartDate: form.periodStartDate,
        periodEndDate: form.periodEndDate,
        revenue: parseFloat(form.revenue),
        netProfit: parseFloat(form.netProfit),
        operatingCashFlow: parseFloat(form.operatingCashFlow),
        interestExpense: parseFloat(form.interestExpense) || 0,
        cash: parseFloat(form.cash),
        inventory: parseFloat(form.inventory) || 0,
        currentAssets: parseFloat(form.currentAssets),
        totalAssets: parseFloat(form.totalAssets),
        currentLiabilities: parseFloat(form.currentLiabilities),
        shortTermDebt: parseFloat(form.shortTermDebt) || 0,
        currentPortionLongTermDebt: parseFloat(form.currentPortionLongTermDebt) || 0,
        totalLiabilities: parseFloat(form.totalLiabilities),
        totalEquity: parseFloat(form.totalEquity),
      };

      const res = await fetch(`${API_BASE}/financial-data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.error?.details) {
          setValidationErrors(
            data.error.details.map((d: any) => ({ field: d.field ?? 'general', message: d.message }))
          );
        }
        throw new Error(data.error?.message ?? 'Failed to submit financial data');
      }

      setSubmitSuccess(true);
      setForm(emptyForm);
      onSuccess?.();
      setTimeout(() => setSubmitSuccess(false), 4000);
    } catch (err: any) {
      setSubmitError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass = (field: string) =>
    `w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
      getFieldError(field) ? 'border-red-400 bg-red-50' : 'border-slate-200'
    }`;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Period info */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
        <h3 className="text-sm font-semibold text-slate-800">Period Information</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Subsidiary *</label>
            <select
              value={form.subsidiaryId}
              onChange={(e) => setField('subsidiaryId', e.target.value)}
              className={inputClass('subsidiaryId')}
            >
              <option value="">Select subsidiary...</option>
              {subsidiaries.filter((s) => s.isActive).map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            {getFieldError('subsidiaryId') && (
              <p className="text-xs text-red-600 mt-1">{getFieldError('subsidiaryId')}</p>
            )}
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Period Type *</label>
            <select
              value={form.periodType}
              onChange={(e) => setField('periodType', e.target.value as PeriodType)}
              className={inputClass('periodType')}
            >
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="annual">Annual</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Period Start *</label>
            <input
              type="date"
              value={form.periodStartDate}
              onChange={(e) => setField('periodStartDate', e.target.value)}
              className={inputClass('periodStartDate')}
            />
            {getFieldError('periodStartDate') && (
              <p className="text-xs text-red-600 mt-1">{getFieldError('periodStartDate')}</p>
            )}
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Period End *</label>
            <input
              type="date"
              value={form.periodEndDate}
              onChange={(e) => setField('periodEndDate', e.target.value)}
              className={inputClass('periodEndDate')}
            />
            {getFieldError('periodEndDate') && (
              <p className="text-xs text-red-600 mt-1">{getFieldError('periodEndDate')}</p>
            )}
          </div>
        </div>
      </div>

      {/* Income Statement */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
        <h3 className="text-sm font-semibold text-slate-800">Income Statement</h3>
        <div className="grid grid-cols-2 gap-4">
          {[
            { field: 'revenue', label: 'Revenue *' },
            { field: 'netProfit', label: 'Net Profit *' },
            { field: 'operatingCashFlow', label: 'Operating Cash Flow *' },
            { field: 'interestExpense', label: 'Interest Expense' },
          ].map(({ field, label }) => (
            <div key={field}>
              <label className="block text-xs font-semibold text-slate-600 mb-1">{label}</label>
              <input
                type="number"
                step="any"
                value={form[field as keyof FormData]}
                onChange={(e) => setField(field as keyof FormData, e.target.value)}
                className={inputClass(field)}
                placeholder="0"
              />
              {getFieldError(field) && (
                <p className="text-xs text-red-600 mt-1">{getFieldError(field)}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Balance Sheet */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
        <h3 className="text-sm font-semibold text-slate-800">Balance Sheet</h3>
        <div className="grid grid-cols-2 gap-4">
          {[
            { field: 'cash', label: 'Cash *' },
            { field: 'inventory', label: 'Inventory' },
            { field: 'currentAssets', label: 'Current Assets *' },
            { field: 'totalAssets', label: 'Total Assets *' },
            { field: 'currentLiabilities', label: 'Current Liabilities *' },
            { field: 'shortTermDebt', label: 'Short-term Debt' },
            { field: 'currentPortionLongTermDebt', label: 'Current Portion LT Debt' },
            { field: 'totalLiabilities', label: 'Total Liabilities *' },
            { field: 'totalEquity', label: 'Total Equity *' },
          ].map(({ field, label }) => (
            <div key={field}>
              <label className="block text-xs font-semibold text-slate-600 mb-1">{label}</label>
              <input
                type="number"
                step="any"
                value={form[field as keyof FormData]}
                onChange={(e) => setField(field as keyof FormData, e.target.value)}
                className={inputClass(field)}
                placeholder="0"
              />
              {getFieldError(field) && (
                <p className="text-xs text-red-600 mt-1">{getFieldError(field)}</p>
              )}
            </div>
          ))}
        </div>

        {/* Accounting equation hint */}
        {form.totalAssets && form.totalLiabilities && form.totalEquity && (
          <div className={`text-xs rounded-lg px-3 py-2 ${
            Math.abs(parseFloat(form.totalAssets) - (parseFloat(form.totalLiabilities) + parseFloat(form.totalEquity))) < parseFloat(form.totalAssets) * 0.0001
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-amber-50 text-amber-700 border border-amber-200'
          }`}>
            Assets: {parseFloat(form.totalAssets).toLocaleString()} = Liabilities: {parseFloat(form.totalLiabilities).toLocaleString()} + Equity: {parseFloat(form.totalEquity).toLocaleString()}
          </div>
        )}
      </div>

      {/* Errors and submit */}
      {submitError && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-700">
          {submitError}
        </div>
      )}
      {submitSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-xs text-green-700">
          Financial data submitted successfully. Ratios have been calculated.
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full py-2.5 text-sm font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors"
      >
        {submitting ? 'Submitting...' : 'Submit Financial Data'}
      </button>
    </form>
  );
};

// SubsidiaryManager.tsx - Admin component for subsidiary CRUD
// Requirements: 1.1, 1.2, 9.1

import React, { useState } from 'react';
import { useSubsidiaries } from '../../../hooks/financial/useSubsidiaries';
import { Subsidiary, CreateSubsidiaryInput } from '../../../types/financial/subsidiary';

const INDUSTRY_SECTORS = [
  'Manufacturing', 'Retail', 'Technology', 'Finance', 'Healthcare',
  'Construction', 'Agriculture', 'Energy', 'Transportation', 'Services',
];

const CURRENCIES = ['IDR', 'USD', 'EUR', 'SGD', 'MYR'];

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const API_BASE = '/api/frs';

function getToken(): string {
  return localStorage.getItem('frs_token') ?? '';
}

const emptyForm: CreateSubsidiaryInput = {
  name: '',
  industrySector: 'Manufacturing',
  fiscalYearStartMonth: 1,
  currency: 'IDR',
  taxRate: 22,
};

export const SubsidiaryManager: React.FC = () => {
  const { subsidiaries, isLoading, error, refetch } = useSubsidiaries();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CreateSubsidiaryInput>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  function openCreate() {
    setForm(emptyForm);
    setEditingId(null);
    setFormError(null);
    setShowForm(true);
  }

  function openEdit(sub: Subsidiary) {
    setForm({
      name: sub.name,
      industrySector: sub.industrySector,
      fiscalYearStartMonth: sub.fiscalYearStartMonth,
      currency: sub.currency,
      taxRate: sub.taxRate,
    });
    setEditingId(sub.id);
    setFormError(null);
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFormError(null);

    try {
      const url = editingId
        ? `${API_BASE}/subsidiaries/${editingId}`
        : `${API_BASE}/subsidiaries`;
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message ?? 'Failed to save subsidiary');
      }

      setShowForm(false);
      refetch();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleStatus(sub: Subsidiary) {
    try {
      const res = await fetch(`${API_BASE}/subsidiaries/${sub.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ isActive: !sub.isActive }),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error?.message ?? 'Failed to update status');
        return;
      }
      refetch();
    } catch (err: any) {
      alert(err.message);
    }
  }

  async function handleDelete(sub: Subsidiary) {
    if (!confirm(`Delete "${sub.name}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`${API_BASE}/subsidiaries/${sub.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error?.message ?? 'Failed to delete subsidiary');
        return;
      }
      refetch();
    } catch (err: any) {
      alert(err.message);
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Subsidiary Management</h2>
          <p className="text-xs text-slate-500 mt-0.5">Manage up to 5 subsidiary companies</p>
        </div>
        <button
          onClick={openCreate}
          disabled={subsidiaries.length >= 5}
          className="px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          + Add Subsidiary
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-700">{error}</div>
      )}

      {/* Subsidiary list */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-24">
            <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : subsidiaries.length === 0 ? (
          <div className="flex items-center justify-center h-24 text-sm text-slate-400">
            No subsidiaries yet. Add one to get started.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600">Name</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600">Sector</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600">Currency</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600">Tax Rate</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600">Fiscal Year</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600">Status</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {subsidiaries.map((sub) => (
                <tr key={sub.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-slate-800">{sub.name}</td>
                  <td className="px-4 py-3 text-slate-600">{sub.industrySector}</td>
                  <td className="px-4 py-3 text-slate-600">{sub.currency}</td>
                  <td className="px-4 py-3 text-slate-600">{sub.taxRate}%</td>
                  <td className="px-4 py-3 text-slate-600">{MONTHS[sub.fiscalYearStartMonth - 1]}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      sub.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {sub.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEdit(sub)}
                        className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleToggleStatus(sub)}
                        className="text-xs text-slate-500 hover:text-slate-700 font-medium"
                      >
                        {sub.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        onClick={() => handleDelete(sub)}
                        className="text-xs text-red-500 hover:text-red-700 font-medium"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h3 className="text-sm font-semibold text-slate-900">
                {editingId ? 'Edit Subsidiary' : 'Add Subsidiary'}
              </h3>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Company Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  required
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="PT Example Indonesia"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Industry Sector *</label>
                <select
                  value={form.industrySector}
                  onChange={(e) => setForm((f) => ({ ...f, industrySector: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {INDUSTRY_SECTORS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Currency</label>
                  <select
                    value={form.currency}
                    onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {CURRENCIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Tax Rate (%)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step={0.1}
                    value={form.taxRate}
                    onChange={(e) => setForm((f) => ({ ...f, taxRate: parseFloat(e.target.value) }))}
                    required
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Fiscal Year Start Month</label>
                <select
                  value={form.fiscalYearStartMonth}
                  onChange={(e) => setForm((f) => ({ ...f, fiscalYearStartMonth: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {MONTHS.map((m, i) => (
                    <option key={m} value={i + 1}>{m}</option>
                  ))}
                </select>
              </div>

              {formError && (
                <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-700">
                  {formError}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 py-2 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : editingId ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

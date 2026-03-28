// TargetManager.tsx — UI for setting financial targets per department/project
// Requirements: 7.3, 7.4

import React, { useState } from 'react';
import { useToast } from '../../financial/shared/Toast';
import { formatRupiah } from '../../../utils/format';
import type { Department, Project, FinancialTarget } from '../../../hooks/mafinda/useManagement';

interface Props {
  departments: Department[];
  projects: Project[];
  targets: FinancialTarget[];
  onUpsertTarget: (data: {
    entityType: 'department' | 'project';
    entityId: string;
    period: string;
    periodType: 'monthly' | 'quarterly' | 'annual';
    revenueTarget: number;
    operationalCostTarget: number;
  }) => Promise<void>;
  onDeleteTarget: (id: string) => Promise<void>;
}

interface FormState {
  entityType: 'department' | 'project';
  entityId: string;
  period: string;
  periodType: 'monthly' | 'quarterly' | 'annual';
  revenueTarget: string;
  operationalCostTarget: string;
}

function currentPeriod(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function emptyForm(): FormState {
  return {
    entityType: 'department',
    entityId: '',
    period: currentPeriod(),
    periodType: 'monthly',
    revenueTarget: '',
    operationalCostTarget: '',
  };
}

const PERIOD_TYPE_LABELS: Record<string, string> = {
  monthly: 'Bulanan',
  quarterly: 'Kuartalan',
  annual: 'Tahunan',
};

export const TargetManager: React.FC<Props> = ({
  departments,
  projects,
  targets,
  onUpsertTarget,
  onDeleteTarget,
}) => {
  const { showSuccess, showError } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editingTarget, setEditingTarget] = useState<FinancialTarget | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [filterEntityType, setFilterEntityType] = useState<'all' | 'department' | 'project'>('all');

  const entityOptions =
    form.entityType === 'department'
      ? departments.map((d) => ({ id: d.id, label: d.name }))
      : projects.map((p) => ({ id: p.id, label: `${p.name} (${p.departmentName ?? ''})` }));

  const visibleTargets =
    filterEntityType === 'all'
      ? targets
      : targets.filter((t) => t.entityType === filterEntityType);

  function openCreate() {
    setForm(emptyForm());
    setEditingTarget(null);
    setShowForm(true);
  }

  function openEdit(target: FinancialTarget) {
    setForm({
      entityType: target.entityType,
      entityId: target.entityId,
      period: target.period,
      periodType: target.periodType,
      revenueTarget: String(target.revenueTarget),
      operationalCostTarget: String(target.operationalCostTarget),
    });
    setEditingTarget(target);
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const revenueTarget = parseFloat(form.revenueTarget);
    const operationalCostTarget = parseFloat(form.operationalCostTarget);

    if (isNaN(revenueTarget) || revenueTarget < 0) {
      showError('Target revenue harus berupa angka non-negatif');
      return;
    }
    if (isNaN(operationalCostTarget) || operationalCostTarget < 0) {
      showError('Target biaya operasional harus berupa angka non-negatif');
      return;
    }

    setSaving(true);
    try {
      await onUpsertTarget({
        entityType: form.entityType,
        entityId: form.entityId,
        period: form.period,
        periodType: form.periodType,
        revenueTarget,
        operationalCostTarget,
      });
      showSuccess(editingTarget ? 'Target berhasil diperbarui' : 'Target berhasil disimpan');
      setShowForm(false);
    } catch (err: any) {
      showError(err.message ?? 'Gagal menyimpan target');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await onDeleteTarget(id);
      showSuccess('Target berhasil dihapus');
    } catch (err: any) {
      showError(err.message ?? 'Gagal menghapus target');
    }
  }

  function getEntityName(target: FinancialTarget): string {
    if (target.entityType === 'department') {
      return departments.find((d) => d.id === target.entityId)?.name ?? target.entityId;
    }
    const proj = projects.find((p) => p.id === target.entityId);
    return proj ? `${proj.name} (${proj.departmentName ?? ''})` : target.entityId;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Target Keuangan</h3>
            <p className="text-xs text-slate-500 mt-0.5">{visibleTargets.length} target</p>
          </div>
          <select
            value={filterEntityType}
            onChange={(e) => setFilterEntityType(e.target.value as any)}
            className="px-2 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Semua</option>
            <option value="department">Departemen</option>
            <option value="project">Proyek</option>
          </select>
        </div>
        <button
          onClick={openCreate}
          disabled={departments.length === 0}
          className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          + Tetapkan Target
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        {visibleTargets.length === 0 ? (
          <div className="flex items-center justify-center h-20 text-sm text-slate-400">
            Belum ada target. Tetapkan target keuangan pertama.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600">Entitas</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600">Tipe</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600">Periode</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600">Jenis</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-600">Target Revenue</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-600">Target Biaya Ops</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-600">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visibleTargets.map((target) => (
                <tr key={target.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-slate-800 text-xs">{getEntityName(target)}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      target.entityType === 'department'
                        ? 'bg-purple-50 text-purple-700'
                        : 'bg-teal-50 text-teal-700'
                    }`}>
                      {target.entityType === 'department' ? 'Departemen' : 'Proyek'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600 text-xs">{target.period}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{PERIOD_TYPE_LABELS[target.periodType]}</td>
                  <td className="px-4 py-3 text-right text-slate-700 text-xs font-medium">
                    {formatRupiah(target.revenueTarget)}
                  </td>
                  <td className="px-4 py-3 text-right text-slate-700 text-xs font-medium">
                    {formatRupiah(target.operationalCostTarget)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <button
                        onClick={() => openEdit(target)}
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(target.id)}
                        className="text-xs text-red-500 hover:text-red-700 font-medium"
                      >
                        Hapus
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
                {editingTarget ? 'Edit Target' : 'Tetapkan Target'}
              </h3>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Tipe Entitas <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={form.entityType}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, entityType: e.target.value as any, entityId: '' }))
                    }
                    disabled={!!editingTarget}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50"
                  >
                    <option value="department">Departemen</option>
                    <option value="project">Proyek</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Entitas <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={form.entityId}
                    onChange={(e) => setForm((f) => ({ ...f, entityId: e.target.value }))}
                    required
                    disabled={!!editingTarget}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50"
                  >
                    <option value="">Pilih...</option>
                    {entityOptions.map((opt) => (
                      <option key={opt.id} value={opt.id}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Periode <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="month"
                    value={form.period}
                    onChange={(e) => setForm((f) => ({ ...f, period: e.target.value }))}
                    required
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Jenis Periode</label>
                  <select
                    value={form.periodType}
                    onChange={(e) => setForm((f) => ({ ...f, periodType: e.target.value as any }))}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="monthly">Bulanan</option>
                    <option value="quarterly">Kuartalan</option>
                    <option value="annual">Tahunan</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Target Revenue (Rp) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={form.revenueTarget}
                  onChange={(e) => setForm((f) => ({ ...f, revenueTarget: e.target.value }))}
                  required
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Target Biaya Operasional (Rp) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={form.operationalCostTarget}
                  onChange={(e) => setForm((f) => ({ ...f, operationalCostTarget: e.target.value }))}
                  required
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 py-2 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving || !form.entityId || !form.period}
                  className="flex-1 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? 'Menyimpan...' : editingTarget ? 'Perbarui' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

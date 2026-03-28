// ProjectManager.tsx — CRUD UI for projects
// Requirements: 7.2

import React, { useState } from 'react';
import { useToast } from '../../financial/shared/Toast';
import type { Department, Project } from '../../../hooks/mafinda/useManagement';

interface Props {
  departments: Department[];
  projects: Project[];
  onCreateProject: (data: {
    departmentId: string;
    name: string;
    description?: string;
    startDate?: string;
    endDate?: string;
  }) => Promise<void>;
  onUpdateProject: (
    id: string,
    data: { name?: string; description?: string; startDate?: string; endDate?: string }
  ) => Promise<void>;
  onDeleteProject: (id: string) => Promise<void>;
}

interface FormState {
  departmentId: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
}

function emptyForm(defaultDeptId = ''): FormState {
  return { departmentId: defaultDeptId, name: '', description: '', startDate: '', endDate: '' };
}

export const ProjectManager: React.FC<Props> = ({
  departments,
  projects,
  onCreateProject,
  onUpdateProject,
  onDeleteProject,
}) => {
  const { showSuccess, showError } = useToast();
  const [filterDeptId, setFilterDeptId] = useState<string>('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const visibleProjects = filterDeptId
    ? projects.filter((p) => p.departmentId === filterDeptId)
    : projects;

  function openCreate() {
    setForm(emptyForm(filterDeptId || (departments[0]?.id ?? '')));
    setEditingId(null);
    setShowForm(true);
  }

  function openEdit(proj: Project) {
    setForm({
      departmentId: proj.departmentId,
      name: proj.name,
      description: proj.description ?? '',
      startDate: proj.startDate ?? '',
      endDate: proj.endDate ?? '',
    });
    setEditingId(proj.id);
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        startDate: form.startDate || undefined,
        endDate: form.endDate || undefined,
      };
      if (editingId) {
        await onUpdateProject(editingId, payload);
        showSuccess('Proyek berhasil diperbarui');
      } else {
        await onCreateProject({ departmentId: form.departmentId, ...payload });
        showSuccess('Proyek berhasil ditambahkan');
      }
      setShowForm(false);
    } catch (err: any) {
      if (err.status === 409) {
        showError(`Nama proyek "${form.name}" sudah ada dalam departemen ini`);
      } else {
        showError(err.message ?? 'Gagal menyimpan proyek');
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirmDeleteId) return;
    try {
      await onDeleteProject(confirmDeleteId);
      showSuccess('Proyek berhasil dihapus');
    } catch (err: any) {
      showError(err.message ?? 'Gagal menghapus proyek');
    } finally {
      setConfirmDeleteId(null);
    }
  }

  function getDeptName(id: string) {
    return departments.find((d) => d.id === id)?.name ?? id;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Proyek</h3>
            <p className="text-xs text-slate-500 mt-0.5">{visibleProjects.length} proyek</p>
          </div>
          <select
            value={filterDeptId}
            onChange={(e) => setFilterDeptId(e.target.value)}
            className="px-2 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Semua Departemen</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>
        <button
          onClick={openCreate}
          disabled={departments.length === 0}
          className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          + Tambah Proyek
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        {visibleProjects.length === 0 ? (
          <div className="flex items-center justify-center h-20 text-sm text-slate-400">
            {departments.length === 0
              ? 'Tambahkan departemen terlebih dahulu.'
              : 'Belum ada proyek. Tambahkan proyek pertama.'}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600">Nama Proyek</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600">Departemen</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600">Tanggal Mulai</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600">Tanggal Selesai</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-600">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visibleProjects.map((proj) => (
                <tr key={proj.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-slate-800">{proj.name}</td>
                  <td className="px-4 py-3 text-slate-600 text-xs">{getDeptName(proj.departmentId)}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{proj.startDate ?? '—'}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{proj.endDate ?? '—'}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <button
                        onClick={() => openEdit(proj)}
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(proj.id)}
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
                {editingId ? 'Edit Proyek' : 'Tambah Proyek'}
              </h3>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Departemen <span className="text-red-500">*</span>
                </label>
                <select
                  value={form.departmentId}
                  onChange={(e) => setForm((f) => ({ ...f, departmentId: e.target.value }))}
                  required
                  disabled={!!editingId}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50"
                >
                  <option value="">Pilih departemen</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Nama Proyek <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  required
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nama proyek"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Deskripsi</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Deskripsi opsional"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Tanggal Mulai</label>
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Tanggal Selesai</label>
                  <input
                    type="date"
                    value={form.endDate}
                    onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
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
                  disabled={saving || !form.name.trim() || !form.departmentId}
                  className="flex-1 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? 'Menyimpan...' : editingId ? 'Perbarui' : 'Tambah'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {confirmDeleteId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-sm p-6 space-y-4">
            <h4 className="text-sm font-semibold text-slate-900">Hapus Proyek</h4>
            <p className="text-xs text-slate-500">
              Yakin ingin menghapus proyek{' '}
              <span className="font-medium text-slate-700">
                "{projects.find((p) => p.id === confirmDeleteId)?.name}"
              </span>
              ? Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="flex-1 py-2 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// DepartmentManager.tsx — CRUD UI for departments
// Requirements: 7.1, 7.5

import React, { useState } from 'react';
import { useToast } from '../../financial/shared/Toast';
import type { Department } from '../../../hooks/mafinda/useManagement';

interface Props {
  departments: Department[];
  onCreateDepartment: (data: { name: string; description?: string }) => Promise<void>;
  onUpdateDepartment: (id: string, data: { name?: string; description?: string }) => Promise<void>;
  onDeleteDepartment: (id: string) => Promise<void>;
  projects: { id: string; departmentId: string; name: string; isActive: boolean }[];
}

interface FormState {
  name: string;
  description: string;
}

const emptyForm: FormState = { name: '', description: '' };

export const DepartmentManager: React.FC<Props> = ({
  departments,
  onCreateDepartment,
  onUpdateDepartment,
  onDeleteDepartment,
  projects,
}) => {
  const { showSuccess, showError } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Department | null>(null);

  function openCreate() {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(true);
  }

  function openEdit(dept: Department) {
    setForm({ name: dept.name, description: dept.description ?? '' });
    setEditingId(dept.id);
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingId) {
        await onUpdateDepartment(editingId, {
          name: form.name.trim(),
          description: form.description.trim() || undefined,
        });
        showSuccess('Departemen berhasil diperbarui');
      } else {
        await onCreateDepartment({
          name: form.name.trim(),
          description: form.description.trim() || undefined,
        });
        showSuccess('Departemen berhasil ditambahkan');
      }
      setShowForm(false);
    } catch (err: any) {
      if (err.status === 409) {
        showError(`Nama departemen "${form.name}" sudah digunakan`);
      } else {
        showError(err.message ?? 'Gagal menyimpan departemen');
      }
    } finally {
      setSaving(false);
    }
  }

  function requestDelete(dept: Department) {
    setConfirmDelete(dept);
  }

  async function confirmDeleteAction() {
    if (!confirmDelete) return;
    try {
      await onDeleteDepartment(confirmDelete.id);
      showSuccess(`Departemen "${confirmDelete.name}" berhasil dihapus`);
    } catch (err: any) {
      showError(err.message ?? 'Gagal menghapus departemen');
    } finally {
      setConfirmDelete(null);
    }
  }

  function getActiveProjectCount(deptId: string) {
    return projects.filter((p) => p.departmentId === deptId && p.isActive).length;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Departemen</h3>
          <p className="text-xs text-slate-500 mt-0.5">{departments.length} departemen terdaftar</p>
        </div>
        <button
          onClick={openCreate}
          className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
        >
          + Tambah Departemen
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        {departments.length === 0 ? (
          <div className="flex items-center justify-center h-20 text-sm text-slate-400">
            Belum ada departemen. Tambahkan departemen pertama.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600">Nama</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600">Deskripsi</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600">Proyek Aktif</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-600">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {departments.map((dept) => (
                <tr key={dept.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-slate-800">{dept.name}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{dept.description ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                      {getActiveProjectCount(dept.id)} proyek
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <button
                        onClick={() => openEdit(dept)}
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => requestDelete(dept)}
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
                {editingId ? 'Edit Departemen' : 'Tambah Departemen'}
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
                  Nama Departemen <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  required
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Contoh: ONM, Engineering"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Deskripsi</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Deskripsi opsional"
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
                  disabled={saving || !form.name.trim()}
                  className="flex-1 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? 'Menyimpan...' : editingId ? 'Perbarui' : 'Tambah'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <svg className="w-4 h-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                </svg>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-900">Hapus Departemen</h4>
                <p className="text-xs text-slate-500 mt-1">
                  Hapus <span className="font-medium text-slate-700">"{confirmDelete.name}"</span>?
                </p>
                {getActiveProjectCount(confirmDelete.id) > 0 && (
                  <p className="text-xs text-amber-600 mt-2 bg-amber-50 border border-amber-200 rounded-lg px-2 py-1.5">
                    Peringatan: departemen ini memiliki{' '}
                    <strong>{getActiveProjectCount(confirmDelete.id)} proyek aktif</strong> yang akan ikut terhapus.
                  </p>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 py-2 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                onClick={confirmDeleteAction}
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

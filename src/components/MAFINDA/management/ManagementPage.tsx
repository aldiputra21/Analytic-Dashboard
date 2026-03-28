// ManagementPage.tsx — Halaman manajemen dengan desain Projects & Targets Management
// Requirements: 7.1, 7.2, 7.3, 7.4

import React, { useState } from 'react';
import { Briefcase, Building2, FolderOpen, Target, Plus, Edit2, Trash2, ChevronRight, Save, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useManagement } from '../../../hooks/mafinda/useManagement';
import { useToast } from '../../financial/shared/Toast';
import { formatRupiah } from '../../../utils/format';
import type { Department, Project, FinancialTarget } from '../../../hooks/mafinda/useManagement';

type Tab = 'departments' | 'projects' | 'targets';

// ─── Departments Tab ──────────────────────────────────────────────────────────

interface DeptFormState { name: string; description: string; }

const DepartmentsTab: React.FC<{
  departments: Department[];
  projects: Project[];
  onCreate: (d: { name: string; description?: string }) => Promise<void>;
  onUpdate: (id: string, d: { name?: string; description?: string }) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}> = ({ departments, projects, onCreate, onUpdate, onDelete }) => {
  const { showSuccess, showError } = useToast();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<DeptFormState>({ name: '', description: '' });
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Department | null>(null);

  function openCreate() {
    setForm({ name: '', description: '' });
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
        await onUpdate(editingId, { name: form.name.trim(), description: form.description.trim() || undefined });
        showSuccess('Departemen berhasil diperbarui');
      } else {
        await onCreate({ name: form.name.trim(), description: form.description.trim() || undefined });
        showSuccess('Departemen berhasil ditambahkan');
      }
      setShowForm(false);
    } catch (err: any) {
      showError(err.status === 409 ? `Nama "${form.name}" sudah digunakan` : (err.message ?? 'Gagal menyimpan'));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirmDelete) return;
    try {
      await onDelete(confirmDelete.id);
      showSuccess(`Departemen "${confirmDelete.name}" dihapus`);
    } catch (err: any) {
      showError(err.message ?? 'Gagal menghapus');
    } finally {
      setConfirmDelete(null);
    }
  }

  const getProjectCount = (deptId: string) => projects.filter(p => p.departmentId === deptId).length;
  const getActiveProjectCount = (deptId: string) => projects.filter(p => p.departmentId === deptId && p.isActive).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-slate-900">Departments</h3>
          <p className="text-xs text-slate-500 mt-0.5">{departments.length} departemen terdaftar</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" /> Add Department
        </button>
      </div>

      {departments.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 text-sm mb-4">Belum ada departemen. Buat departemen pertama.</p>
          <button onClick={openCreate} className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700">
            Buat Departemen
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {departments.map((dept, idx) => {
            const deptProjects = projects.filter(p => p.departmentId === dept.id);
            const isExpanded = expandedId === dept.id;
            return (
              <motion.div
                key={dept.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04 }}
                className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm"
              >
                {/* Department header */}
                <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-4 py-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : dept.id)}
                        className="text-white/70 hover:text-white transition-colors shrink-0"
                      >
                        <ChevronRight className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                      </button>
                      <Building2 className="w-4 h-4 text-white/80 shrink-0" />
                      <span className="text-sm font-bold text-white truncate">{dept.name}</span>
                      {dept.description && (
                        <span className="text-xs text-white/50 truncate hidden sm:block">{dept.description}</span>
                      )}
                      <span className="text-xs text-white/60 shrink-0">
                        ({getProjectCount(dept.id)} proyek, {getActiveProjectCount(dept.id)} aktif)
                      </span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => openEdit(dept)}
                        className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setConfirmDelete(dept)}
                        className="p-1.5 text-white/70 hover:text-red-300 hover:bg-red-500/20 rounded-lg transition-colors"
                        title="Hapus"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded projects list */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      {deptProjects.length === 0 ? (
                        <div className="px-6 py-4 text-xs text-slate-400 text-center">
                          Belum ada proyek di departemen ini
                        </div>
                      ) : (
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-100">
                              <th className="text-left px-4 py-2 font-semibold text-slate-500 uppercase tracking-wide">Nama Proyek</th>
                              <th className="text-left px-4 py-2 font-semibold text-slate-500 uppercase tracking-wide">Mulai</th>
                              <th className="text-left px-4 py-2 font-semibold text-slate-500 uppercase tracking-wide">Selesai</th>
                              <th className="text-left px-4 py-2 font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                            {deptProjects.map(proj => (
                              <tr key={proj.id} className="hover:bg-slate-50">
                                <td className="px-4 py-2.5 font-medium text-slate-700">
                                  <div className="flex items-center gap-2">
                                    <FolderOpen className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                                    {proj.name}
                                  </div>
                                </td>
                                <td className="px-4 py-2.5 text-slate-500">{proj.startDate ?? '—'}</td>
                                <td className="px-4 py-2.5 text-slate-500">{proj.endDate ?? '—'}</td>
                                <td className="px-4 py-2.5">
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${proj.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                                    {proj.isActive ? 'Aktif' : 'Nonaktif'}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="text-sm font-semibold text-slate-900">{editingId ? 'Edit Departemen' : 'Tambah Departemen'}</h3>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Nama <span className="text-red-500">*</span></label>
                <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Contoh: ONM, Engineering, Finance" autoFocus />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Deskripsi</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  placeholder="Deskripsi opsional" />
              </div>
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">Batal</button>
                <button type="submit" disabled={saving || !form.name.trim()} className="flex-1 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50">
                  {saving ? 'Menyimpan...' : editingId ? 'Perbarui' : 'Tambah'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <h4 className="text-sm font-semibold text-slate-900">Hapus Departemen</h4>
            <p className="text-xs text-slate-500">
              Hapus <strong>"{confirmDelete.name}"</strong>?
              {getProjectCount(confirmDelete.id) > 0 && (
                <span className="block mt-2 text-amber-600 bg-amber-50 border border-amber-200 rounded px-2 py-1.5">
                  Peringatan: {getProjectCount(confirmDelete.id)} proyek akan ikut terhapus.
                </span>
              )}
            </p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">Batal</button>
              <button onClick={handleDelete} className="flex-1 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700">Hapus</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Projects Tab ─────────────────────────────────────────────────────────────

interface ProjFormState {
  departmentId: string; name: string; description: string; startDate: string; endDate: string;
}

const ProjectsTab: React.FC<{
  departments: Department[];
  projects: Project[];
  onCreate: (d: { departmentId: string; name: string; description?: string; startDate?: string; endDate?: string }) => Promise<void>;
  onUpdate: (id: string, d: { name?: string; description?: string; startDate?: string; endDate?: string }) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}> = ({ departments, projects, onCreate, onUpdate, onDelete }) => {
  const { showSuccess, showError } = useToast();
  const [filterDeptId, setFilterDeptId] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ProjFormState>({ departmentId: '', name: '', description: '', startDate: '', endDate: '' });
  const [saving, setSaving] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const visible = filterDeptId ? projects.filter(p => p.departmentId === filterDeptId) : projects;

  function openCreate() {
    setForm({ departmentId: filterDeptId || (departments[0]?.id ?? ''), name: '', description: '', startDate: '', endDate: '' });
    setEditingId(null);
    setShowForm(true);
  }

  function openEdit(proj: Project) {
    setForm({ departmentId: proj.departmentId, name: proj.name, description: proj.description ?? '', startDate: proj.startDate ?? '', endDate: proj.endDate ?? '' });
    setEditingId(proj.id);
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { name: form.name.trim(), description: form.description.trim() || undefined, startDate: form.startDate || undefined, endDate: form.endDate || undefined };
      if (editingId) {
        await onUpdate(editingId, payload);
        showSuccess('Proyek berhasil diperbarui');
      } else {
        await onCreate({ departmentId: form.departmentId, ...payload });
        showSuccess('Proyek berhasil ditambahkan');
      }
      setShowForm(false);
    } catch (err: any) {
      showError(err.status === 409 ? `Nama "${form.name}" sudah ada di departemen ini` : (err.message ?? 'Gagal menyimpan'));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirmDeleteId) return;
    try {
      await onDelete(confirmDeleteId);
      showSuccess('Proyek berhasil dihapus');
    } catch (err: any) {
      showError(err.message ?? 'Gagal menghapus');
    } finally {
      setConfirmDeleteId(null);
    }
  }

  const getDeptName = (id: string) => departments.find(d => d.id === id)?.name ?? id;

  // Generate a short project code from name + dept
  const getProjectCode = (proj: Project) => {
    const deptName = getDeptName(proj.departmentId) ?? 'UNK';
    const deptAbbr = deptName.slice(0, 3).toUpperCase();
    const idx = projects.filter(p => p.departmentId === proj.departmentId).findIndex(p => p.id === proj.id) + 1;
    return `${deptAbbr}-${String(idx).padStart(3, '0')}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div>
            <h3 className="text-base font-semibold text-slate-900">Projects</h3>
            <p className="text-xs text-slate-500 mt-0.5">{visible.length} proyek</p>
          </div>
          <select value={filterDeptId} onChange={e => setFilterDeptId(e.target.value)}
            className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
            <option value="">Semua Departemen</option>
            {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>
        <button onClick={openCreate} disabled={departments.length === 0}
          className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-sm">
          <Plus className="w-4 h-4" /> Add Project
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        {visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <FolderOpen className="w-10 h-10 text-slate-300 mb-3" />
            <p className="text-sm text-slate-400">
              {departments.length === 0 ? 'Tambahkan departemen terlebih dahulu.' : 'Belum ada proyek.'}
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Project Code</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Project Name</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Department</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Periode</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visible.map(proj => (
                <tr key={proj.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <span className="text-xs font-bold text-indigo-600">{getProjectCode(proj)}</span>
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-800">{proj.name}</td>
                  <td className="px-4 py-3 text-slate-600 text-xs">{getDeptName(proj.departmentId)}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs">
                    {proj.startDate && proj.endDate
                      ? `${proj.startDate} – ${proj.endDate}`
                      : proj.startDate ?? proj.endDate ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${proj.isActive ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500'}`}>
                      {proj.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openEdit(proj)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Edit">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => setConfirmDeleteId(proj.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Hapus">
                        <Trash2 className="w-3.5 h-3.5" />
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
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="text-sm font-semibold text-slate-900">{editingId ? 'Edit Proyek' : 'Tambah Proyek'}</h3>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Departemen <span className="text-red-500">*</span></label>
                <select value={form.departmentId} onChange={e => setForm(f => ({ ...f, departmentId: e.target.value }))} required disabled={!!editingId}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-50">
                  <option value="">Pilih departemen</option>
                  {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Nama Proyek <span className="text-red-500">*</span></label>
                <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required autoFocus
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Nama proyek" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Deskripsi</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Tanggal Mulai</label>
                  <input type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Tanggal Selesai</label>
                  <input type="date" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">Batal</button>
                <button type="submit" disabled={saving || !form.name.trim() || !form.departmentId}
                  className="flex-1 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50">
                  {saving ? 'Menyimpan...' : editingId ? 'Perbarui' : 'Tambah'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {confirmDeleteId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <h4 className="text-sm font-semibold text-slate-900">Hapus Proyek</h4>
            <p className="text-xs text-slate-500">
              Yakin hapus <strong>"{projects.find(p => p.id === confirmDeleteId)?.name}"</strong>? Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmDeleteId(null)} className="flex-1 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">Batal</button>
              <button onClick={handleDelete} className="flex-1 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700">Hapus</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Targets Tab ──────────────────────────────────────────────────────────────

interface TargetFormState {
  entityType: 'department' | 'project';
  entityId: string;
  period: string;
  periodType: 'monthly' | 'quarterly' | 'annual';
  revenueTarget: string;
  operationalCostTarget: string;
}

function currentPeriod() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

const PERIOD_LABELS: Record<string, string> = { monthly: 'Bulanan', quarterly: 'Kuartalan', annual: 'Tahunan' };

const TargetsTab: React.FC<{
  departments: Department[];
  projects: Project[];
  targets: FinancialTarget[];
  onUpsert: (d: { entityType: 'department' | 'project'; entityId: string; period: string; periodType: 'monthly' | 'quarterly' | 'annual'; revenueTarget: number; operationalCostTarget: number }) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}> = ({ departments, projects, targets, onUpsert, onDelete }) => {
  const { showSuccess, showError } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editingTarget, setEditingTarget] = useState<FinancialTarget | null>(null);
  const [form, setForm] = useState<TargetFormState>({ entityType: 'department', entityId: '', period: currentPeriod(), periodType: 'monthly', revenueTarget: '', operationalCostTarget: '' });
  const [saving, setSaving] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'department' | 'project'>('all');

  const visible = filterType === 'all' ? targets : targets.filter(t => t.entityType === filterType);
  const entityOptions = form.entityType === 'department'
    ? departments.map(d => ({ id: d.id, label: d.name }))
    : projects.map(p => ({ id: p.id, label: `${p.name} (${departments.find(d => d.id === p.departmentId)?.name ?? ''})` }));

  function openCreate() {
    setForm({ entityType: 'department', entityId: '', period: currentPeriod(), periodType: 'monthly', revenueTarget: '', operationalCostTarget: '' });
    setEditingTarget(null);
    setShowForm(true);
  }

  function openEdit(t: FinancialTarget) {
    setForm({ entityType: t.entityType, entityId: t.entityId, period: t.period, periodType: t.periodType, revenueTarget: String(t.revenueTarget), operationalCostTarget: String(t.operationalCostTarget) });
    setEditingTarget(t);
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const rev = parseFloat(form.revenueTarget);
    const ops = parseFloat(form.operationalCostTarget);
    if (isNaN(rev) || rev < 0) { showError('Target revenue harus angka non-negatif'); return; }
    if (isNaN(ops) || ops < 0) { showError('Target biaya harus angka non-negatif'); return; }
    setSaving(true);
    try {
      await onUpsert({ entityType: form.entityType, entityId: form.entityId, period: form.period, periodType: form.periodType, revenueTarget: rev, operationalCostTarget: ops });
      showSuccess(editingTarget ? 'Target diperbarui' : 'Target disimpan');
      setShowForm(false);
    } catch (err: any) {
      showError(err.message ?? 'Gagal menyimpan target');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await onDelete(id);
      showSuccess('Target dihapus');
    } catch (err: any) {
      showError(err.message ?? 'Gagal menghapus');
    }
  }

  function getEntityName(t: FinancialTarget) {
    if (t.entityType === 'department') return departments.find(d => d.id === t.entityId)?.name ?? t.entityId;
    const proj = projects.find(p => p.id === t.entityId);
    return proj ? `${proj.name}` : t.entityId;
  }

  function getEntityDept(t: FinancialTarget) {
    if (t.entityType === 'department') return '—';
    const proj = projects.find(p => p.id === t.entityId);
    return proj ? (departments.find(d => d.id === proj.departmentId)?.name ?? '—') : '—';
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div>
            <h3 className="text-base font-semibold text-slate-900">Targets</h3>
            <p className="text-xs text-slate-500 mt-0.5">{visible.length} target</p>
          </div>
          <select value={filterType} onChange={e => setFilterType(e.target.value as any)}
            className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
            <option value="all">Semua</option>
            <option value="department">Departemen</option>
            <option value="project">Proyek</option>
          </select>
        </div>
        <button onClick={openCreate} disabled={departments.length === 0}
          className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-sm">
          <Plus className="w-4 h-4" /> Set Target
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        {visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Target className="w-10 h-10 text-slate-300 mb-3" />
            <p className="text-sm text-slate-400">Belum ada target keuangan.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Entitas</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Departemen</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Tipe</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Periode</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Jenis</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Target Revenue</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Target Biaya Ops</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visible.map(t => (
                <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-semibold text-slate-800 text-xs">{getEntityName(t)}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{getEntityDept(t)}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${t.entityType === 'department' ? 'bg-purple-50 text-purple-700' : 'bg-teal-50 text-teal-700'}`}>
                      {t.entityType === 'department' ? 'Dept' : 'Proyek'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600 text-xs">{t.period}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{PERIOD_LABELS[t.periodType]}</td>
                  <td className="px-4 py-3 text-right text-xs font-semibold text-blue-700">{formatRupiah(t.revenueTarget)}</td>
                  <td className="px-4 py-3 text-right text-xs font-semibold text-orange-600">{formatRupiah(t.operationalCostTarget)}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openEdit(t)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Edit">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDelete(t.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Hapus">
                        <Trash2 className="w-3.5 h-3.5" />
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
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="text-sm font-semibold text-slate-900">{editingTarget ? 'Edit Target' : 'Tetapkan Target'}</h3>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Tipe <span className="text-red-500">*</span></label>
                  <select value={form.entityType} onChange={e => setForm(f => ({ ...f, entityType: e.target.value as any, entityId: '' }))} disabled={!!editingTarget}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-50">
                    <option value="department">Departemen</option>
                    <option value="project">Proyek</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Entitas <span className="text-red-500">*</span></label>
                  <select value={form.entityId} onChange={e => setForm(f => ({ ...f, entityId: e.target.value }))} required disabled={!!editingTarget}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-50">
                    <option value="">Pilih...</option>
                    {entityOptions.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Periode <span className="text-red-500">*</span></label>
                  <input type="month" value={form.period} onChange={e => setForm(f => ({ ...f, period: e.target.value }))} required
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Jenis Periode</label>
                  <select value={form.periodType} onChange={e => setForm(f => ({ ...f, periodType: e.target.value as any }))}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    <option value="monthly">Bulanan</option>
                    <option value="quarterly">Kuartalan</option>
                    <option value="annual">Tahunan</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Target Revenue (Rp) <span className="text-red-500">*</span></label>
                <input type="number" min={0} value={form.revenueTarget} onChange={e => setForm(f => ({ ...f, revenueTarget: e.target.value }))} required
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="0" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Target Biaya Operasional (Rp) <span className="text-red-500">*</span></label>
                <input type="number" min={0} value={form.operationalCostTarget} onChange={e => setForm(f => ({ ...f, operationalCostTarget: e.target.value }))} required
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="0" />
              </div>
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">Batal</button>
                <button type="submit" disabled={saving || !form.entityId || !form.period}
                  className="flex-1 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50">
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

// ─── Main ManagementPage ──────────────────────────────────────────────────────

type TabDef = { id: Tab; label: string; icon: React.ElementType };

const TABS: TabDef[] = [
  { id: 'departments', label: 'Departments', icon: Building2 },
  { id: 'projects', label: 'Projects', icon: FolderOpen },
  { id: 'targets', label: 'Targets', icon: Target },
];

export const ManagementPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('departments');

  const {
    departments, projects, targets, isLoading, error,
    createDepartment, updateDepartment, deleteDepartment,
    createProject, updateProject, deleteProject,
    upsertTarget, deleteTarget,
  } = useManagement();

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Projects &amp; Targets Management</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage departments, projects, and targets</p>
        </div>
        <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center">
          <Briefcase className="w-5 h-5 text-indigo-600" />
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-2 text-xs text-red-700">
          Gagal memuat data: {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200">
        {TABS.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
                isActive
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="space-y-3 animate-pulse">
          <div className="h-10 bg-slate-100 rounded-xl" />
          <div className="h-40 bg-slate-100 rounded-xl" />
        </div>
      )}

      {/* Tab content */}
      {!isLoading && (
        <>
          {activeTab === 'departments' && (
            <DepartmentsTab
              departments={departments}
              projects={projects}
              onCreate={createDepartment}
              onUpdate={updateDepartment}
              onDelete={deleteDepartment}
            />
          )}
          {activeTab === 'projects' && (
            <ProjectsTab
              departments={departments}
              projects={projects}
              onCreate={createProject}
              onUpdate={updateProject}
              onDelete={deleteProject}
            />
          )}
          {activeTab === 'targets' && (
            <TargetsTab
              departments={departments}
              projects={projects}
              targets={targets}
              onUpsert={upsertTarget}
              onDelete={deleteTarget}
            />
          )}
        </>
      )}
    </div>
  );
};

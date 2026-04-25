import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus, Search, Edit2, Trash2, Eye,
  ChevronLeft, ChevronRight, FolderOpen, X,
  RefreshCw, FilterX, Info, ChevronDown,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiFetch } from '../../../services/financial/apiFetch';
import { cn } from '../../../utils/cn';
import { useAuth } from '../../../hooks/financial/useAuth';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel
} from '../../ui/alert-dialog';
import { costCenterCategoryI18n } from '../../../i18n/cost-center-category';
import { commonsI18n } from '../../../i18n/commons';
import { z } from 'zod';

interface CostCenterCategory {
  id: string;
  code: string;
  labelId: string;
  labelEn: string;
  status: 'active' | 'inactive';
  createdBy: string;
  createdAt: string;
  updatedBy: string | null;
  updatedAt: string | null;
}

const Modal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <div className="p-1.5 bg-indigo-100 text-indigo-600 rounded-lg">
              <FolderOpen size={18} />
            </div>
            {title}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors cursor-pointer">
            <X size={20} className="text-slate-500" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          {children}
        </div>
      </motion.div>
    </div>
  );
};

export const CostCenterCategoryManager: React.FC = () => {
  const { hasPermission, language } = useAuth();
  const t = costCenterCategoryI18n[language];
  const common = commonsI18n[language];

  // Validation Schema
  const categorySchema = z.object({
    code: z.string().min(2, t.validation.codeMin),
    labelId: z.string().min(1, t.validation.labelIdRequired),
    labelEn: z.string().min(1, t.validation.labelEnRequired),
    status: z.enum(['active', 'inactive'])
  });

  const canWrite = hasPermission('cfd.corporates.write');
  const canDelete = hasPermission('cfd.corporates.delete');

  const [data, setData] = useState<CostCenterCategory[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [appliedFilters, setAppliedFilters] = useState({ search: '', status: '' });

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create');
  const isReadOnly = modalMode === 'view';
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [formData, setFormData] = useState({
    code: '',
    labelId: '',
    labelEn: '',
    status: 'active' as 'active' | 'inactive',
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
      });
      if (appliedFilters.search) query.set('search', appliedFilters.search);
      if (appliedFilters.status) query.set('status', appliedFilters.status);

      const res = await apiFetch(`/api/cost-center-categories?${query.toString()}`);
      if (!res.ok) throw new Error(t.alerts.errorFetch);
      const d = await res.json();
      setData(d.records || []);
      setTotalCount(d.totalCount || 0);
    } catch (err: any) {
      setError(err.message || common.errorLoadTable);
      toast.error(err.message || common.errorLoadTable);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, appliedFilters, t.alerts.errorFetch]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleApplyFilter = () => {
    setAppliedFilters({ search, status: filterStatus });
    setPage(1);
  };

  const handleClearFilter = () => {
    setSearch('');
    setFilterStatus('');
    setAppliedFilters({ search: '', status: '' });
    setPage(1);
  };

  const openModal = (mode: 'create' | 'edit' | 'view', item?: CostCenterCategory) => {
    setModalMode(mode);
    if (item) {
      setEditingId(item.id);
      setFormData({ code: item.code, labelId: item.labelId, labelEn: item.labelEn, status: item.status });
    } else {
      setEditingId(null);
      setFormData({ code: '', labelId: '', labelEn: '', status: 'active' });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;
    setIsSaving(true);
    try {
      const validation = categorySchema.safeParse({
        ...formData,
        code: formData.code.toUpperCase()
      });
      if (!validation.success) {
        validation.error.issues.forEach(err => toast.error(err.message));
        setIsSaving(false);
        return;
      }

      const payload = validation.data;
      const url = editingId ? `/api/cost-center-categories/${editingId}` : '/api/cost-center-categories';
      const method = editingId ? 'PUT' : 'POST';
      const res = await apiFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        toast.success(modalMode === 'create' ? t.alerts.successSave : t.alerts.successUpdate);
        setIsModalOpen(false);
        fetchData();
      } else {
        const err = await res.json();
        if (res.status === 409) {
          toast.error(t.alerts.errorDuplicate);
        } else {
          toast.error(err.error?.message || t.alerts.errorSave);
        }
      }
    } catch {
      toast.error(t.alerts.errorNetwork);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setIsDeleting(true);
    try {
      const res = await apiFetch(`/api/cost-center-categories/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success(t.alerts.successDelete);
        setDeleteConfirmId(null);
        fetchData();
      } else {
        const d = await res.json();
        toast.error(d.error?.message || t.alerts.errorDelete);
        setDeleteConfirmId(null);
      }
    } catch {
      toast.error(t.alerts.errorNetwork);
      setDeleteConfirmId(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const totalPages = Math.ceil(totalCount / pageSize);
  const showingFrom = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const showingTo = Math.min(page * pageSize, totalCount);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-100">
              <FolderOpen size={24} />
            </div>
            {t.title}
          </h2>
          <p className="text-sm text-slate-500 mt-1 flex items-center gap-1.5 ml-1">
            <Info size={14} className="text-indigo-400" />
            {t.subtitle}
          </p>
        </div>
        {canWrite && (
          <button
            onClick={() => openModal('create')}
            className="px-4 py-2 text-sm font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-lg shadow-indigo-100 active:scale-95 cursor-pointer"
          >
            <Plus size={18} />
            {t.addNew}
          </button>
        )}
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200/60 flex flex-wrap items-center gap-4">
        <div className="flex-1 min-w-[240px] relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
          <input
            type="text"
            placeholder={t.searchPlaceholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleApplyFilter()}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
          />
        </div>
        <div className="relative">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="appearance-none pl-3 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all cursor-pointer"
          >
            <option value="">{t.tableHead.status}</option>
            <option value="active">{t.status.active}</option>
            <option value="inactive">{t.status.inactive}</option>
          </select>
          <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleApplyFilter}
            className="flex items-center gap-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-4 py-2 rounded-xl text-xs font-black transition-all active:scale-95 border border-indigo-200/50 cursor-pointer"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            {t.apply}
          </button>
          <button
            onClick={handleClearFilter}
            className="flex items-center gap-2 bg-slate-50 text-slate-500 hover:bg-slate-100 px-4 py-2 rounded-xl text-xs font-black transition-all active:scale-95 border border-slate-200/50 cursor-pointer"
          >
            <FilterX size={14} />
            {t.clear}
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">{t.tableHead.code}</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">{t.tableHead.labelId}</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">{t.tableHead.labelEn}</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">{t.tableHead.status}</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">{t.tableHead.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              <AnimatePresence>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <motion.tr
                      key={`skeleton-${i}`}
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="animate-pulse"
                    >
                      <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-16" /></td>
                      <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-40" /></td>
                      <td className="px-6 py-4"><div className="h-6 bg-slate-100 rounded-full w-16" /></td>
                      <td className="px-6 py-4"><div className="h-8 bg-slate-100 rounded w-20 ml-auto" /></td>
                    </motion.tr>
                  ))
                ) : error ? (
                  <motion.tr
                    key="error"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <td colSpan={5}>
                      <div className="py-20 flex flex-col items-center justify-center gap-4 text-center">
                        <div className="p-4 bg-red-50 rounded-full text-red-400 border border-red-100">
                          <AlertCircle size={48} />
                        </div>
                        <div>
                          <p className="text-slate-800 font-bold text-lg">{common.errorLoadTable}</p>
                          <p className="text-slate-500 text-sm mt-1 max-w-xs mx-auto">{error}</p>
                          <button
                            onClick={() => fetchData()}
                            className="mt-6 px-6 py-2.5 bg-indigo-600 text-white text-xs font-black rounded-xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 cursor-pointer flex items-center gap-2 mx-auto"
                          >
                            <RefreshCw size={14} />
                            {common.retry}
                          </button>
                        </div>
                      </div>
                    </td>
                  </motion.tr>
                ) : data.length === 0 ? (
                  <motion.tr key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <td colSpan={5}>
                      <div className="py-20 flex flex-col items-center justify-center gap-4 text-center">
                        <div className="p-4 bg-slate-50 rounded-full text-slate-300">
                          <FolderOpen size={48} />
                        </div>
                        <div>
                          <p className="text-slate-800 font-bold text-lg">{t.status.empty}</p>
                          <p className="text-slate-500 text-sm mt-1">{t.status.emptyDesc}</p>
                        </div>
                      </div>
                    </td>
                  </motion.tr>
                ) : (
                  data.map((cat, idx) => (
                    <motion.tr
                      key={cat.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: idx * 0.03 }}
                      className="hover:bg-slate-50/50 transition-colors group font-bold"
                    >
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-black tracking-wider uppercase">
                          {cat.code}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-800 text-sm font-semibold">{cat.labelId}</td>
                      <td className="px-6 py-4 text-slate-500 text-sm">{cat.labelEn}</td>
                      <td className="px-6 py-4">
                        <div className={cn(
                          'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black tracking-wider uppercase border',
                          cat.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                            : 'bg-slate-50 text-slate-500 border-slate-100'
                        )}>
                          <div className={cn('w-1.5 h-1.5 rounded-full', cat.status === 'active' ? 'bg-emerald-500' : 'bg-slate-400')} />
                          {cat.status === 'active' ? t.status.active : t.status.inactive}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => openModal('view', cat)}
                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all cursor-pointer"
                            title="View"
                          >
                            <Eye size={16} />
                          </button>
                          {canWrite && (
                            <button
                              onClick={() => openModal('edit', cat)}
                              className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all cursor-pointer"
                              title="Edit"
                            >
                              <Edit2 size={16} />
                            </button>
                          )}
                          {canDelete && (
                            <button
                              onClick={() => setDeleteConfirmId(cat.id)}
                              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                              title="Delete"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        {!loading && totalCount > 0 && (
          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/30 flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <span className="text-xs font-bold text-slate-500">
                {t.pagination.showing}{' '}
                <span className="text-slate-800">{showingFrom}</span> -{' '}
                <span className="text-slate-800">{showingTo}</span>{' '}
                {t.pagination.of}{' '}
                <span className="text-slate-800">{totalCount}</span>{' '}
                {t.pagination.entries}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.pagination.rowsPerPage}</span>
                <select
                  value={pageSize}
                  onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
                  className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-700 focus:outline-none cursor-pointer shadow-sm"
                >
                  {[10, 25, 50, 100].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className={cn('p-2 rounded-lg transition-all', page === 1 ? 'text-slate-300 cursor-not-allowed' : 'text-slate-600 hover:bg-white hover:shadow-sm active:scale-90 cursor-pointer')}
              >
                <ChevronLeft size={16} />
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum = i + 1;
                if (totalPages > 5 && page > 3) {
                  pageNum = page - 2 + i;
                  if (pageNum + (4 - i) > totalPages) pageNum = totalPages - 4 + i;
                }
                if (pageNum > 0 && pageNum <= totalPages) {
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={cn(
                        'w-8 h-8 flex items-center justify-center rounded-lg text-xs font-black transition-all',
                        page === pageNum
                          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100 scale-110 cursor-pointer'
                          : 'bg-white text-slate-600 border border-slate-200 hover:border-indigo-300 cursor-pointer'
                      )}
                    >
                      {pageNum}
                    </button>
                  );
                }
                return null;
              })}
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className={cn('p-2 rounded-lg transition-all', page === totalPages ? 'text-slate-300 cursor-not-allowed' : 'text-slate-600 hover:bg-white hover:shadow-sm active:scale-90 cursor-pointer')}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <Modal
            isOpen={isModalOpen}
            onClose={() => !isSaving && setIsModalOpen(false)}
            title={
              modalMode === 'create' ? t.modal.createTitle
                : modalMode === 'edit' ? t.modal.editTitle
                  : t.modal.viewTitle
            }
          >
            <form onSubmit={handleSave} className="space-y-5">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  {t.modal.code} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData(p => ({ ...p, code: e.target.value.toUpperCase() }))}
                  required
                  disabled={isReadOnly}
                  maxLength={50}
                  placeholder="OPEX"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-sm uppercase font-mono disabled:opacity-70 disabled:cursor-not-allowed"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  {t.modal.labelId} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.labelId}
                  onChange={(e) => setFormData(p => ({ ...p, labelId: e.target.value }))}
                  required
                  disabled={isReadOnly}
                  maxLength={100}
                  placeholder="Biaya Operasional"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-sm disabled:opacity-70 disabled:cursor-not-allowed"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  {t.modal.labelEn} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.labelEn}
                  onChange={(e) => setFormData(p => ({ ...p, labelEn: e.target.value }))}
                  required
                  disabled={isReadOnly}
                  maxLength={100}
                  placeholder="Operational Expenses"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-sm disabled:opacity-70 disabled:cursor-not-allowed"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  {t.modal.status}
                </label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    disabled={isReadOnly}
                    onClick={() => !isReadOnly && setFormData(p => ({ ...p, status: p.status === 'active' ? 'inactive' : 'active' }))}
                    className={cn(
                      'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none',
                      formData.status === 'active' ? 'bg-indigo-600' : 'bg-slate-200',
                      isReadOnly ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'
                    )}
                  >
                    <span className={cn(
                      'inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform',
                      formData.status === 'active' ? 'translate-x-6' : 'translate-x-1'
                    )} />
                  </button>
                  <span className={cn('text-xs font-black uppercase tracking-widest', formData.status === 'active' ? 'text-indigo-600' : 'text-slate-400')}>
                    {formData.status === 'active' ? t.status.active : t.status.inactive}
                  </span>
                </div>
              </div>

              {!isReadOnly ? (
                <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    disabled={isSaving}
                    className="px-4 py-2 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer disabled:opacity-50"
                  >
                    {t.modal.cancel}
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-5 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-indigo-100 active:scale-95 cursor-pointer disabled:opacity-70"
                  >
                    {isSaving ? t.status.submitting : t.modal.submit}
                  </button>
                </div>
              ) : (
                <div className="flex justify-end pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
                  >
                    {t.modal.close}
                  </button>
                </div>
              )}
            </form>
          </Modal>
        )}
      </AnimatePresence>

      <AlertDialog open={!!deleteConfirmId} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.alerts.deleteTitle}</AlertDialogTitle>
            <AlertDialogDescription>{t.alerts.deleteDesc}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>{t.alerts.deleteCancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
              disabled={isDeleting}
              className="bg-rose-600 hover:bg-rose-700 text-white"
            >
              {isDeleting ? t.alerts.deleteDeleting : t.alerts.deleteConfirm}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

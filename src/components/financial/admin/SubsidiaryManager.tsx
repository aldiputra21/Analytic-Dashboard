import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus, Search, Edit2, Trash2, Building2,
  X, AlertCircle, CheckCircle2,
  RefreshCw, Info, FilterX, Building,
  ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiFetch } from '../../../services/financial/apiFetch';
import { cn } from '../../../utils/cn';
import { useAuth } from '../../../hooks/financial/useAuth';
import { getErrorMessage } from '../../../utils/errorUtils';
import { useCorporates } from '../../../hooks/financial/useCorporates';
import { toast } from 'sonner';
import { z } from 'zod';
import { subsidiaryI18n } from '../../../i18n/subsidiary';
import { commonsI18n } from '../../../i18n/commons';
import { Subsidiary } from '../../../types/financial/subsidiary';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../../ui/alert-dialog';

// --- Shared Components ---

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
              <Building size={18} />
            </div>
            {title}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors cursor-pointer">
            <X size={20} className="text-slate-500" />
          </button>
        </div>
        <div className="flex-1 overflow-hidden flex flex-col">
          {children}
        </div>
      </motion.div>
    </div>
  );
};

const FormField: React.FC<{
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}> = ({ label, error, required, children }) => (
  <div className="space-y-1.5">
    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider ml-1">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    {children}
    {error && <p className="text-[10px] text-red-500 font-medium ml-1 flex items-center gap-1">
      <AlertCircle size={10} /> {error}
    </p>}
  </div>
);

// --- Main Component ---

export const SubsidiaryManager: React.FC = () => {
  const { hasPermission, language } = useAuth();
  const t = subsidiaryI18n[language];
  const common = commonsI18n[language];
  const { corporates: subsidiaries, isLoading, refetch } = useCorporates();

  const canWrite = hasPermission('cfd.corporates.write');
  const canDelete = hasPermission('cfd.corporates.delete');

  const subsidiarySchema = z.object({
    name: z.string().min(3, t.validation.nameMin),
    industrySector: z.string().min(1, t.validation.industrySectorRequired),
    fiscalYearStartMonth: z.number().min(1).max(12, t.validation.fiscalYearStartMonthRange),
    currency: z.string().min(1),
    taxRate: z.number().min(0).max(100, t.validation.taxRateRange),
  });

  // State
  const [search, setSearch] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create');
  const [editingSub, setEditingSub] = useState<Subsidiary | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    industrySector: 'Manufacturing',
    fiscalYearStartMonth: 1,
    currency: 'IDR',
    taxRate: 22,
  });

  // Master Data State
  const [sectors, setSectors] = useState<any[]>([]);
  const [currencies, setCurrencies] = useState<any[]>([]);

  const fetchConfigs = useCallback(async () => {
    try {
      const [sectorsRes, currenciesRes] = await Promise.all([
        apiFetch('/api/corporate-sectors?status=active&pageSize=100'),
        apiFetch('/api/currencies?status=active&pageSize=100'),
      ]);

      if (sectorsRes.ok) {
        const d = await sectorsRes.json();
        setSectors(d.records || []);
      }

      if (currenciesRes.ok) {
        const d = await currenciesRes.json();
        setCurrencies(d.records || []);
      }
    } catch (err: any) {
      const errCode = err.error?.code || err.code || 'NETWORK_ERROR';
      toast.error(getErrorMessage(errCode, language));
    }
  }, [language]);

  useEffect(() => {
    fetchConfigs();
  }, [fetchConfigs]);

  const handleOpenModal = (mode: 'create' | 'edit' | 'view', sub?: Subsidiary) => {
    setModalMode(mode);
    if (sub) {
      setEditingSub(sub);
      setFormData({
        name: sub.name,
        industrySector: sub.industrySector,
        fiscalYearStartMonth: sub.fiscalYearStartMonth,
        currency: sub.currency,
        taxRate: sub.taxRate,
      });
    } else {
      setEditingSub(null);
      setFormData({
        name: '',
        industrySector: sectors[0]?.code || 'Manufacturing',
        fiscalYearStartMonth: 1,
        currency: 'IDR',
        taxRate: 22,
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const validation = subsidiarySchema.safeParse(formData);
    if (!validation.success) {
      validation.error.issues.forEach(err => toast.error(err.message));
      setIsSaving(false);
      return;
    }

    try {
      const url = editingSub ? `/api/frs/subsidiaries/${editingSub.id}` : '/api/frs/subsidiaries';
      const method = editingSub ? 'PUT' : 'POST';

      const res = await apiFetch(url, {
        method,
        body: JSON.stringify(validation.data)
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw errorData;
      }

      toast.success(editingSub ? common.successUpdate : common.successSave);
      setIsModalOpen(false);
      refetch();
    } catch (err: any) {
      const errCode = err.error?.code || err.code || 'NETWORK_ERROR';
      toast.error(getErrorMessage(errCode, language));
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleStatus = async (sub: Subsidiary) => {
    try {
      const res = await apiFetch(`/api/frs/subsidiaries/${sub.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: !sub.isActive })
      });

      if (res.ok) {
        toast.success(common.successUpdate);
        refetch();
      } else {
        const errData = await res.json();
        throw errData;
      }
    } catch (err: any) {
      const errCode = err.error?.code || err.code || 'NETWORK_ERROR';
      toast.error(getErrorMessage(errCode, language));
    }
  };

  const handleDelete = async (id: string) => {
    setIsDeleting(true);
    try {
      const res = await apiFetch(`/api/frs/subsidiaries/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success(common.successDelete);
        setDeleteConfirmId(null);
        refetch();
      } else {
        const errData = await res.json();
        throw errData;
      }
    } catch (err: any) {
      const errCode = err.error?.code || err.code || 'NETWORK_ERROR';
      toast.error(getErrorMessage(errCode, language));
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredSubsidiaries = subsidiaries.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.industrySector.toLowerCase().includes(search.toLowerCase())
  );

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const getMonthName = (month: number) => months[month - 1];

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-100">
              <Building2 size={24} />
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
            onClick={() => handleOpenModal('create')}
            disabled={subsidiaries.length >= 5}
            className="px-4 py-2 text-sm font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-lg shadow-indigo-100 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <Plus size={18} />
            {t.addNew}
          </button>
        )}
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200/60 flex flex-wrap items-center gap-4">
        <div className="flex-1 min-w-[240px] relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
          <input
            type="text"
            placeholder={t.searchPlaceholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
          />
        </div>

        <button
          onClick={() => {
            setIsRefreshing(true);
            refetch().finally(() => setIsRefreshing(false));
          }}
          className="flex items-center gap-2 bg-slate-50 text-slate-500 hover:bg-slate-100 px-4 py-2 rounded-xl text-xs font-black transition-all active:scale-95 border border-slate-200/50 cursor-pointer"
        >
          <RefreshCw size={14} className={isRefreshing ? "animate-spin" : ""} />
          {common.retry}
        </button>
      </div>

      {/* Datatable section */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/40 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.tableHead.name}</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.tableHead.industrySector}</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.tableHead.currency}</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.tableHead.taxRate}</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.tableHead.fiscalYearStart}</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{common.status}</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">{common.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              <AnimatePresence>
                {isLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <motion.tr
                      key={`skeleton-${i}`}
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="animate-pulse"
                    >
                      <td className="px-6 py-4"><div className="h-6 bg-slate-100 rounded-lg w-32" /></td>
                      <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-24" /></td>
                      <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-12" /></td>
                      <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-12" /></td>
                      <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-24" /></td>
                      <td className="px-6 py-4"><div className="h-6 bg-slate-100 rounded-full w-16" /></td>
                      <td className="px-6 py-4"><div className="h-8 bg-slate-100 rounded-lg w-24 ml-auto" /></td>
                    </motion.tr>
                  ))
                ) : filteredSubsidiaries.length === 0 ? (
                  <motion.tr
                    key="empty"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  >
                    <td colSpan={7}>
                      <div className="py-20 flex flex-col items-center justify-center gap-4 text-center">
                        <div className="p-4 bg-slate-50 rounded-full text-slate-300">
                          <Building2 size={48} />
                        </div>
                        <div>
                          <p className="text-slate-800 font-bold text-lg">{t.status.empty}</p>
                          <p className="text-slate-500 text-sm mt-1">{t.status.emptyDesc}</p>
                        </div>
                      </div>
                    </td>
                  </motion.tr>
                ) : (
                  filteredSubsidiaries.map((sub, idx) => (
                    <motion.tr
                      key={sub.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: idx * 0.03 }}
                      className="hover:bg-slate-50/50 transition-colors group font-bold"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                            <Building size={14} />
                          </div>
                          <span className="text-sm text-slate-800">{sub.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs text-slate-500 tracking-wide uppercase">{sub.industrySector}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-mono text-slate-600">{sub.currency}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs text-slate-600">{sub.taxRate}%</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs text-slate-600">{getMonthName(sub.fiscalYearStartMonth)}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className={cn(
                          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black tracking-wider uppercase border",
                          sub.isActive
                            ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                            : "bg-slate-50 text-slate-500 border-slate-100"
                        )}>
                          <div className={cn("w-1.5 h-1.5 rounded-full", sub.isActive ? "bg-emerald-500" : "bg-slate-400")} />
                          {sub.isActive ? common.active : common.inactive}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleOpenModal('view', sub)}
                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all cursor-pointer"
                          >
                            <Info size={16} />
                          </button>
                          {canWrite && (
                            <button
                              onClick={() => handleOpenModal('edit', sub)}
                              className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all cursor-pointer"
                            >
                              <Edit2 size={16} />
                            </button>
                          )}
                          {canWrite && (
                            <button
                              onClick={() => handleToggleStatus(sub)}
                              className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all cursor-pointer"
                              title={sub.isActive ? common.deactivate : common.activate}
                            >
                              <RefreshCw size={16} />
                            </button>
                          )}
                          {canDelete && (
                            <button
                              onClick={() => setDeleteConfirmId(sub.id)}
                              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
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
      </div>

      {/* Form Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <Modal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            title={modalMode === 'create' ? t.modal.createTitle : modalMode === 'edit' ? t.modal.editTitle : t.modal.viewTitle}
          >
            <form onSubmit={handleSubmit} onInvalid={() => toast.error(common.errorRequired, { id: 'errorRequired' })} className="flex-1 overflow-hidden flex flex-col">
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <FormField label={t.modal.name} required>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
                    disabled={modalMode === 'view'}
                    placeholder="PT Titian Servis Indonesia"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                  />
                </FormField>

                <FormField label={t.modal.industrySector} required>
                  <input
                    type="text"
                    required
                    value={formData.industrySector}
                    onChange={(e) => setFormData(p => ({ ...p, industrySector: e.target.value }))}
                    disabled={modalMode === 'view'}
                    placeholder="Oil & Gas Service"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                  />
                </FormField>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField label={t.modal.fiscalYearStart} required>
                    <div className="relative">
                      <select
                        value={formData.fiscalYearStartMonth}
                        onChange={(e) => setFormData(p => ({ ...p, fiscalYearStartMonth: parseInt(e.target.value) }))}
                        disabled={modalMode === 'view'}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 appearance-none cursor-pointer"
                      >
                        {common.months.map((name, i) => (
                          <option key={i + 1} value={i + 1}>{name}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                    </div>
                  </FormField>

                  <FormField label={t.modal.currency} required>
                    <input
                      type="text"
                      required
                      value={formData.currency}
                      onChange={(e) => setFormData(p => ({ ...p, currency: e.target.value }))}
                      disabled={modalMode === 'view'}
                      placeholder="IDR"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                    />
                  </FormField>
                </div>

                <FormField label={t.modal.taxRate} required>
                  <div className="relative">
                    <input
                      type="number"
                      required
                      step="0.1"
                      value={formData.taxRate}
                      onChange={(e) => setFormData(p => ({ ...p, taxRate: parseFloat(e.target.value) }))}
                      disabled={modalMode === 'view'}
                      placeholder="22.0"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">%</span>
                  </div>
                </FormField>
              </div>

              <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-8 py-3 bg-white border border-slate-200 text-sm font-bold text-slate-500 rounded-xl hover:bg-slate-50 transition-all active:scale-95 shadow-sm cursor-pointer"
                >
                  {modalMode === 'view' ? common.close : common.cancel}
                </button>
                {modalMode !== 'view' && (
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-10 py-3 bg-indigo-600 text-sm font-bold text-white rounded-xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 flex items-center justify-center gap-2 min-w-[180px] cursor-pointer"
                  >
                    {isSaving ? <RefreshCw className="animate-spin" size={18} /> : <CheckCircle2 size={18} />}
                    {isSaving ? common.saving : common.save}
                  </button>
                )}
              </div>
            </form>
          </Modal>
        )}
      </AnimatePresence>

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deleteConfirmId}
        onOpenChange={(open) => !open && setDeleteConfirmId(null)}
      >
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-black text-slate-800">{t.alerts.deleteTitle}</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-500 font-medium pt-2">
              {t.alerts.deleteDesc}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6 gap-3">
            <AlertDialogCancel
              onClick={() => setDeleteConfirmId(null)}
              className="rounded-xl border-slate-200 font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
            >
              {common.cancel}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
              className="rounded-xl bg-rose-600 hover:bg-rose-700 font-bold shadow-lg shadow-rose-100 transition-all active:scale-95 cursor-pointer"
            >
              {isDeleting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              {isDeleting ? common.deleting : common.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

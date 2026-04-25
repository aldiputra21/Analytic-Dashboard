import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus, Search, Edit2, Trash2, Eye,
  ChevronLeft, ChevronRight, Wallet, X,
  RefreshCw, FilterX, Info, ChevronDown,
  FileText, Download, Paperclip, Calendar,
  ArrowUpRight, ArrowDownRight, Upload,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiFetch } from '../../../services/financial/apiFetch';
import { cn } from '../../../utils/cn';
import { useAuth } from '../../../hooks/financial/useAuth';
import { toast } from 'sonner';
import { z } from 'zod';
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
import { realizationI18n } from '../../../i18n/realization';
import { commonsI18n } from '../../../i18n/commons';
import { SearchableSelect } from '../shared/SearchableSelect';

interface Attachment {
  id: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
}

interface Realization {
  id: string;
  entityType: 'department' | 'project';
  departmentId: string;
  departmentName?: string;
  projectId: string | null;
  projectName?: string;
  transactionDate: string;
  category: 'cash-in' | 'cash-out';
  amount: string | number;
  notes: string | null;
  createdBy: string;
  createdAt: string;
  updatedBy: string | null;
  updatedAt: string | null;
  attachments?: Attachment[];
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
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <div className="p-1.5 bg-indigo-100 text-indigo-600 rounded-lg">
              <Wallet size={18} />
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

export const RealizationManager: React.FC = () => {
  const { hasPermission, language } = useAuth();
  const t = realizationI18n[language];
  const common = commonsI18n[language];

  const canWrite = hasPermission('cfd.realizations.write');
  const canDelete = hasPermission('cfd.realizations.delete');

  const [data, setData] = useState<Realization[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);



  // Filters
  const [search, setSearch] = useState('');
  const [filterEntityType, setFilterEntityType] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [appliedFilters, setAppliedFilters] = useState({
    search: '',
    entityType: '',
    category: '',
    dateFrom: '',
    dateTo: ''
  });

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Master Data for Dropdowns
  const [departments, setDepartments] = useState<{ value: string; label: string }[]>([]);
  const [projects, setProjects] = useState<{ value: string; label: string; departmentId: string }[]>([]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create');
  const isReadOnly = modalMode === 'view';
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    entityType: 'department' as 'department' | 'project',
    departmentId: '',
    projectId: '',
    transactionDate: new Date().toISOString().split('T')[0],
    category: 'cash-out' as 'cash-in' | 'cash-out',
    amount: '',
    notes: '',
  });

  // Attachments State
  const [isUploading, setIsUploading] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const realizationSchema = z.object({
    entityType: z.enum(['department', 'project']),
    departmentId: z.string().optional(),
    projectId: z.string().optional(),
    transactionDate: z.string().min(1, t.validation.transactionDateRequired),
    category: z.enum(['cash-in', 'cash-out']),
    amount: z.string().refine(v => {
      const n = parseFloat(v);
      return !isNaN(n) && n > 0;
    }, { message: t.validation.amountMin }),
    notes: z.string().optional(),
  }).refine(data => {
    if (data.entityType === 'department' && !data.departmentId) return false;
    if (data.entityType === 'project' && !data.projectId) return false;
    return true;
  }, {
    message: language === 'id' ? 'Departemen/Proyek wajib dipilih' : 'Department/Project is required',
    path: ['departmentId'] // Use departmentId as base error path
  });

  const fetchMasterData = useCallback(async () => {
    try {
      const [deptsRes, projsRes] = await Promise.all([
        apiFetch('/api/departments'),
        apiFetch('/api/projects')
      ]);

      if (deptsRes.ok) {
        const d = await deptsRes.json();
        setDepartments((d.records || []).map((item: any) => ({
          value: item.id,
          label: `[${item.code}] ${item.name}`
        })));
      }

      if (projsRes.ok) {
        const d = await projsRes.json();
        setProjects((d.records || []).map((item: any) => ({
          value: item.id,
          label: `[${item.code}] ${item.name}`,
          departmentId: item.departmentId
        })));
      }
    } catch (err) {
      console.error('Failed to fetch master data', err);
      toast.error(t.alerts.errorFetchMasterData || 'Gagal memuat data master');
    }
  }, [t.alerts.errorFetchMasterData]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const query = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
      });
      if (appliedFilters.search) query.set('search', appliedFilters.search);
      if (appliedFilters.entityType) query.set('entityType', appliedFilters.entityType);
      if (appliedFilters.category) query.set('category', appliedFilters.category);
      if (appliedFilters.dateFrom) query.set('dateFrom', appliedFilters.dateFrom);
      if (appliedFilters.dateTo) query.set('dateTo', appliedFilters.dateTo);

      const res = await apiFetch(`/api/cash-realizations?${query.toString()}`);
      if (!res.ok) throw new Error(t.alerts.errorFetch);
      const d = await res.json();
      setData(d.records || []);
      setTotalCount(d.totalCount || 0);
    } catch (err: any) {
      setError(err.message || t.alerts.errorFetch);
      toast.error(err.message || t.alerts.errorFetch);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, appliedFilters, t.alerts.errorFetch]);

  useEffect(() => {
    fetchMasterData();
  }, [fetchMasterData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleApplyFilter = () => {
    setAppliedFilters({
      search,
      entityType: filterEntityType,
      category: filterCategory,
      dateFrom,
      dateTo
    });
    setPage(1);
  };

  const handleClearFilter = () => {
    setSearch('');
    setFilterEntityType('');
    setFilterCategory('');
    setDateFrom('');
    setDateTo('');
    setAppliedFilters({
      search: '',
      entityType: '',
      category: '',
      dateFrom: '',
      dateTo: ''
    });
    setPage(1);
  };

  const openModal = (mode: 'create' | 'edit' | 'view', item?: Realization) => {
    setModalMode(mode);
    if (item) {
      setEditingId(item.id);
      setFormData({
        entityType: item.entityType,
        departmentId: item.departmentId,
        projectId: item.projectId || '',
        transactionDate: item.transactionDate.split('T')[0],
        category: item.category,
        amount: item.amount.toString(),
        notes: item.notes || '',
      });
    } else {
      setEditingId(null);
      setFormData({
        entityType: 'department',
        departmentId: '',
        projectId: '',
        transactionDate: new Date().toISOString().split('T')[0],
        category: 'cash-out',
        amount: '',
        notes: '',
      });
    }
    setIsModalOpen(true);
  };



  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;

    const validation = realizationSchema.safeParse(formData);
    if (!validation.success) {
      validation.error.issues.forEach(err => toast.error(err.message));
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        ...formData,
        projectId: formData.entityType === 'project' ? formData.projectId : null,
        departmentId: formData.entityType === 'department' ? formData.departmentId : null
      };

      const url = editingId ? `/api/cash-realizations/${editingId}` : '/api/cash-realizations';
      const method = editingId ? 'PUT' : 'POST';
      const res = await apiFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success(editingId ? t.alerts.successUpdate : t.alerts.successSave);
        setIsModalOpen(false);
        fetchData();
      } else {
        const err = await res.json();
        toast.error(err.error?.message || t.alerts.errorSave);
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
      const res = await apiFetch(`/api/cash-realizations/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success(t.alerts.successDelete);
        setDeleteConfirmId(null);
        fetchData();
      } else {
        const d = await res.json();
        toast.error(d.error?.message || t.alerts.errorDelete);
      }
    } catch {
      toast.error(t.alerts.errorNetwork);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingId) return;

    // Validation
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png'
    ];
    if (!allowedTypes.includes(file.type)) {
      toast.error(t.alerts.invalidFileType);
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error(t.alerts.fileTooLarge);
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('entityType', 'cash_realization');
      formData.append('entityId', editingId);

      const res = await apiFetch('/api/attachments', {
        method: 'POST',
        body: formData
      });

      if (res.ok) {
        toast.success(t.alerts.successUpload);
        // Refresh editing item to show new attachment
        const refreshRes = await apiFetch(`/api/cash-realizations/${editingId}`);
        if (refreshRes.ok) {
          const updatedItem = await refreshRes.json();
          setData(prev => prev.map(item => item.id === editingId ? updatedItem : item));
        }
      } else {
        toast.error(t.alerts.errorUpload);
      }
    } catch {
      toast.error(t.alerts.errorNetwork);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteAttachment = async (attachmentId: string) => {
    try {
      const res = await apiFetch(`/api/attachments/${attachmentId}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success(t.alerts.successDeleteAttachment);
        // Refresh editing item
        const refreshRes = await apiFetch(`/api/cash-realizations/${editingId}`);
        if (refreshRes.ok) {
          const updatedItem = await refreshRes.json();
          setData(prev => prev.map(item => item.id === editingId ? updatedItem : item));
        }
      } else {
        toast.error(t.alerts.errorDeleteAttachment);
      }
    } catch {
      toast.error(t.alerts.errorNetwork);
    }
  };

  const totalPages = Math.ceil(totalCount / pageSize);
  const showingFrom = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const showingTo = Math.min(page * pageSize, totalCount);

  // Filter projects based on selected department in form
  const filteredProjects = projects.filter(p => p.departmentId === formData.departmentId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-100">
              <Wallet size={24} />
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

      {/* Filters */}
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
            value={filterEntityType}
            onChange={(e) => setFilterEntityType(e.target.value)}
            className="appearance-none pl-3 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all cursor-pointer"
          >
            <option value="">{t.filters.entityType}</option>
            <option value="department">{t.modal.department}</option>
            <option value="project">{t.modal.project}</option>
          </select>
          <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>

        <div className="relative">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="appearance-none pl-3 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all cursor-pointer"
          >
            <option value="">{t.filters.category}</option>
            <option value="cash-in">{t.modal.cashIn}</option>
            <option value="cash-out">{t.modal.cashOut}</option>
          </select>
          <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>

        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-2 py-1">
          <Calendar size={14} className="text-slate-400" />
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="bg-transparent text-xs font-medium focus:outline-none cursor-pointer"
          />
          <span className="text-slate-300">-</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="bg-transparent text-xs font-medium focus:outline-none cursor-pointer"
          />
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

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">{t.tableHead.entity}</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">{t.tableHead.transactionDate}</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">{t.tableHead.category}</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">{t.tableHead.amount}</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">{t.tableHead.attachments}</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">{t.tableHead.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              <AnimatePresence>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <motion.tr key={`sk-${i}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="animate-pulse">
                      <td className="px-6 py-4"><div className="h-5 bg-slate-100 rounded w-32" /></td>
                      <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-24" /></td>
                      <td className="px-6 py-4"><div className="h-6 bg-slate-100 rounded-full w-20" /></td>
                      <td className="px-6 py-4"><div className="h-5 bg-slate-100 rounded w-28 ml-auto" /></td>
                      <td className="px-6 py-4 text-center"><div className="h-4 bg-slate-100 rounded w-8 mx-auto" /></td>
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
                    <td colSpan={6}>
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
                    <td colSpan={6}>
                      <div className="py-20 flex flex-col items-center justify-center gap-4 text-center">
                        <div className="p-4 bg-slate-50 rounded-full text-slate-300">
                          <Wallet size={48} />
                        </div>
                        <div>
                          <p className="text-slate-800 font-bold text-lg">{t.status.empty}</p>
                          <p className="text-slate-500 text-sm mt-1">{t.status.emptyDesc}</p>
                        </div>
                      </div>
                    </td>
                  </motion.tr>
                ) : (
                  data.map((item, idx) => (
                    <motion.tr
                      key={item.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: idx * 0.03 }}
                      className="hover:bg-slate-50/50 transition-colors group font-bold"
                    >
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-slate-800 text-sm">{item.projectName || item.departmentName}</span>
                          <span className="text-[10px] text-slate-400 uppercase tracking-tight">
                            {item.entityType === 'project' ? t.modal.project : t.modal.department}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-600 text-sm font-medium">
                        {new Date(item.transactionDate).toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', {
                          year: 'numeric', month: 'short', day: 'numeric'
                        })}
                      </td>
                      <td className="px-6 py-4">
                        <div className={cn(
                          'inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-black tracking-wider uppercase',
                          item.category === 'cash-in'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-rose-50 text-rose-700'
                        )}>
                          {item.category === 'cash-in' ? <ArrowDownRight size={12} /> : <ArrowUpRight size={12} />}
                          {item.category === 'cash-in' ? t.modal.cashIn : t.modal.cashOut}
                        </div>
                      </td>
                      <td className={cn(
                        'px-6 py-4 text-right text-sm font-black tabular-nums',
                        item.category === 'cash-in' ? 'text-emerald-600' : 'text-rose-600'
                      )}>
                        {item.category === 'cash-in' ? '+' : '-'}
                        {new Intl.NumberFormat(language === 'id' ? 'id-ID' : 'en-US', {
                          style: 'currency',
                          currency: 'IDR',
                          maximumFractionDigits: 0
                        }).format(Number(item.amount))}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {item.attachments && item.attachments.length > 0 ? (
                          <div className="inline-flex items-center gap-1 text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-md text-[10px]">
                            <Paperclip size={10} />
                            {item.attachments.length}
                          </div>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => openModal('view', item)}
                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all cursor-pointer"
                            title="View"
                          >
                            <Eye size={16} />
                          </button>
                          {canWrite && (
                            <button
                              onClick={() => openModal('edit', item)}
                              className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all cursor-pointer"
                              title="Edit"
                            >
                              <Edit2 size={16} />
                            </button>
                          )}
                          {canDelete && (
                            <button
                              onClick={() => setDeleteConfirmId(item.id)}
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

        {/* Pagination */}
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

      {/* CRUD Modal */}
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
            <form onSubmit={handleSave} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column: Basic Info */}
                <div className="space-y-5">
                  <div className="flex items-center gap-2 mb-2 pb-1 border-b border-slate-100">
                    <Info size={16} className="text-indigo-500" />
                    <span className="text-xs font-black text-slate-800 uppercase tracking-widest">{t.modal.basicInfo}</span>
                  </div>

                  {/* Entity Type */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      {t.modal.entityType} <span className="text-red-500">*</span>
                    </label>
                    <div className="flex p-1 bg-slate-100 rounded-xl">
                      <button
                        type="button"
                        disabled={isReadOnly}
                        onClick={() => setFormData(p => ({ ...p, entityType: 'department', projectId: '' }))}
                        className={cn(
                          'flex-1 py-1.5 text-xs font-black rounded-lg transition-all',
                          formData.entityType === 'department' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                        )}
                      >
                        {t.modal.department}
                      </button>
                      <button
                        type="button"
                        disabled={isReadOnly}
                        onClick={() => setFormData(p => ({ ...p, entityType: 'project' }))}
                        className={cn(
                          'flex-1 py-1.5 text-xs font-black rounded-lg transition-all',
                          formData.entityType === 'project' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                        )}
                      >
                        {t.modal.project}
                      </button>
                    </div>
                  </div>

                  {/* Department */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      {t.modal.department} <span className="text-red-500">*</span>
                    </label>
                    <SearchableSelect
                      options={departments}
                      value={formData.departmentId}
                      onChange={(val) => setFormData(p => ({ ...p, departmentId: val, projectId: '' }))}
                      placeholder={t.modal.department}
                      disabled={isReadOnly}
                    />
                  </div>

                  {/* Project (Conditional) */}
                  {formData.entityType === 'project' && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                        {t.modal.project} <span className="text-red-500">*</span>
                      </label>
                      <SearchableSelect
                        options={filteredProjects}
                        value={formData.projectId}
                        onChange={(val) => setFormData(p => ({ ...p, projectId: val }))}
                        placeholder={t.modal.project}
                        disabled={isReadOnly || !formData.departmentId}
                      />
                    </motion.div>
                  )}

                  {/* Transaction Date */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      {t.modal.transactionDate} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={formData.transactionDate}
                      onChange={(e) => setFormData(p => ({ ...p, transactionDate: e.target.value }))}
                      required
                      disabled={isReadOnly}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-sm font-medium"
                    />
                  </div>
                </div>

                {/* Right Column: Transaction Details */}
                <div className="space-y-5">
                  <div className="flex items-center gap-2 mb-2 pb-1 border-b border-slate-100">
                    <ArrowUpRight size={16} className="text-indigo-500" />
                    <span className="text-xs font-black text-slate-800 uppercase tracking-widest">Detail Transaksi</span>
                  </div>

                  {/* Category */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      {t.modal.category} <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        disabled={isReadOnly}
                        onClick={() => setFormData(p => ({ ...p, category: 'cash-in' }))}
                        className={cn(
                          'py-2.5 rounded-xl border-2 transition-all flex items-center justify-center gap-2 text-xs font-black uppercase tracking-wider',
                          formData.category === 'cash-in'
                            ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm'
                            : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'
                        )}
                      >
                        <ArrowDownRight size={16} />
                        {t.modal.cashIn}
                      </button>
                      <button
                        type="button"
                        disabled={isReadOnly}
                        onClick={() => setFormData(p => ({ ...p, category: 'cash-out' }))}
                        className={cn(
                          'py-2.5 rounded-xl border-2 transition-all flex items-center justify-center gap-2 text-xs font-black uppercase tracking-wider',
                          formData.category === 'cash-out'
                            ? 'bg-rose-50 border-rose-500 text-rose-700 shadow-sm'
                            : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'
                        )}
                      >
                        <ArrowUpRight size={16} />
                        {t.modal.cashOut}
                      </button>
                    </div>
                  </div>

                  {/* Amount */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      {t.modal.amount} <span className="text-red-500">*</span>
                    </label>
                    <div className="relative group">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-black text-xs">IDR</div>
                      <input
                        type="number"
                        value={formData.amount}
                        onChange={(e) => setFormData(p => ({ ...p, amount: e.target.value }))}
                        required
                        disabled={isReadOnly}
                        placeholder="0"
                        className="w-full pl-12 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-sm font-black tabular-nums"
                      />
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      {t.modal.notes}
                    </label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData(p => ({ ...p, notes: e.target.value }))}
                      disabled={isReadOnly}
                      rows={3}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-sm font-medium resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Attachments Section */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Paperclip size={16} className="text-indigo-500" />
                    <span className="text-xs font-black text-slate-800 uppercase tracking-widest">{t.modal.attachmentSection}</span>
                  </div>
                  {editingId && !isReadOnly && (
                    <label className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-black cursor-pointer hover:bg-indigo-100 transition-all border border-indigo-200/50">
                      <Upload size={14} />
                      {t.modal.uploadAttachment}
                      <input type="file" className="hidden" onChange={handleFileUpload} disabled={isUploading} />
                    </label>
                  )}
                </div>

                {/* Attachment List */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {editingId ? (
                    data.find(item => item.id === editingId)?.attachments?.map(att => (
                      <div key={att.id} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl group">
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className="p-2 bg-white rounded-lg border border-slate-100 text-indigo-500 flex-shrink-0">
                            <FileText size={16} />
                          </div>
                          <div className="overflow-hidden">
                            <p className="text-xs font-bold text-slate-800 truncate" title={att.fileName}>{att.fileName}</p>
                            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-tight">
                              {(att.fileSize / 1024).toFixed(1)} KB
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <a
                            href={`/api/attachments/${att.id}/download`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-md transition-all shadow-sm border border-transparent hover:border-indigo-100"
                            title={t.modal.downloadAttachment}
                          >
                            <Download size={14} />
                          </a>
                          {!isReadOnly && (
                            <button
                              type="button"
                              onClick={() => handleDeleteAttachment(att.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-white rounded-md transition-all shadow-sm border border-transparent hover:border-rose-100"
                              title={t.modal.deleteAttachment}
                            >
                              <X size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-2 py-8 flex flex-col items-center justify-center gap-2 border-2 border-dashed border-slate-100 rounded-2xl bg-slate-50/50">
                      <div className="p-2 bg-white rounded-full text-slate-300">
                        <Paperclip size={24} />
                      </div>
                      <p className="text-xs font-bold text-slate-400">{t.modal.noAttachments}</p>
                    </div>
                  )}
                  {editingId && (!data.find(item => item.id === editingId)?.attachments || data.find(item => item.id === editingId)?.attachments?.length === 0) && (
                    <div className="col-span-2 py-8 flex flex-col items-center justify-center gap-2 border-2 border-dashed border-slate-100 rounded-2xl bg-slate-50/50">
                      <div className="p-2 bg-white rounded-full text-slate-300">
                        <Paperclip size={24} />
                      </div>
                      <p className="text-xs font-bold text-slate-400">{t.modal.noAttachments}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              {!isReadOnly ? (
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
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
                <div className="flex justify-end pt-4 border-t border-slate-100">
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

      {/* Delete Confirm Dialog */}
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

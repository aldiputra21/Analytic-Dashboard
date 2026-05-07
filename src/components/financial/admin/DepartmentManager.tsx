import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus, Search, Edit2, Trash2, Eye,
  ChevronLeft, ChevronRight, Building2, X, AlertCircle, CheckCircle2,
  RefreshCw, FilterX, Users, Briefcase, Hash, Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiFetch } from '../../../services/financial/apiFetch';
import { cn } from '../../../utils/cn';
import { useAuth } from '../../../hooks/financial/useAuth';
import { getErrorMessage } from '../../../utils/errorUtils';
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
import { departmentI18n } from '../../../i18n/department';
import { commonsI18n } from '../../../i18n/commons';
import { useCorporates } from '../../../hooks/financial/useCorporates';
import { SearchableSelect } from '../shared/SearchableSelect';
import { CorporateSelector } from '../shared/CorporateSelector';
import { z } from 'zod';
import { useApproval } from '../../../hooks/financial/useApproval';
import { ApprovalDetailModal } from '../approval/ApprovalDetailModal';
import { approvalI18n } from '../../../i18n/approval';
import { ExportButton } from '../shared/ExportButton';
import { UploadButton } from '../shared/UploadButton';

interface Department {
  id: string;
  corporateId: string;
  corporateName?: string;
  code: string;
  name: string;
  description?: string;
  headName?: string;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
}

// --- Shared Components ---

const Modal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'md' | 'lg' | 'xl';
}> = ({ isOpen, onClose, title, children, size = 'lg' }) => {
  if (!isOpen) return null;

  const sizeClasses = {
    md: 'max-w-md',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className={cn("bg-white rounded-2xl shadow-2xl w-full overflow-hidden flex flex-col max-h-[90vh]", sizeClasses[size])}
      >
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <div className="p-1.5 bg-indigo-100 text-indigo-600 rounded-lg">
              <Briefcase size={18} />
            </div>
            {title}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
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

const SectionHeader: React.FC<{ title: string; icon: React.ReactNode; color: string }> = ({ title, icon, color }) => (
  <div className={cn("flex items-center gap-2 mb-4 pb-2 border-b-2", color)}>
    <div className="p-1.5 rounded-lg bg-white shadow-sm border border-slate-100">
      {icon}
    </div>
    <h4 className="font-bold text-sm text-slate-700 tracking-tight text-[10px] uppercase">{title}</h4>
  </div>
);

// --- Main Component ---

export const DepartmentManager: React.FC = () => {
  const { hasPermission, language } = useAuth();
  const t = departmentI18n[language];
  const common = commonsI18n[language];
  const { options: corporateOptions, isLoading: isCorpsLoading } = useCorporates();

  // Validation Schema
  const departmentSchema = z.object({
    corporateId: z.string().min(1, t.validation.corporateRequired),
    code: z.string().min(2, t.validation.codeMin),
    name: z.string().min(3, t.validation.nameMin),
    headName: z.string().optional(),
    description: z.string().optional(),
    isActive: z.boolean()
  });

  const canWrite = hasPermission('public.departments.write');
  const canDelete = hasPermission('public.departments.delete');

  // Approval integration
  const [activeDraftApprovalId, setActiveDraftApprovalId] = useState<string | null>(null);

  const approvalCreate = useApproval('cfd', 'department', 'create');
  const approvalEdit   = useApproval('cfd', 'department', 'edit');
  const approvalDelete = useApproval('cfd', 'department', 'delete');

  // State
  const [departments, setDepartments] = useState<Department[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [appliedFilters, setAppliedFilters] = useState({
    search: '',
    corporateId: '',
    corporateLabel: '',
  });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filterCorporate, setFilterCorporate] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [isViewOnly, setIsViewOnly] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Delete State
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    corporateId: '',
    code: '',
    name: '',
    headName: '',
    description: '',
    isActive: true
  });

  const fetchDepartments = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    setError(null);

    try {
      const query = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
        search: appliedFilters.search.trim(),
      });

      if (appliedFilters.corporateId) {
        query.set('corporateId', appliedFilters.corporateId);
      }

      const res = await apiFetch(`/api/departments?${query.toString()}`);
      if (!res.ok) {
        const errorData = await res.json();
        throw errorData;
      }

      const data = await res.json();
      setDepartments(data.records);
      setTotalCount(data.totalCount);
    } catch (err: any) {
      const errCode = err.error?.code || err.code || 'NETWORK_ERROR';
      const msg = getErrorMessage(errCode, language);
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, appliedFilters, common.errorLoadTable]);

  // Fetch departments when filters or pagination changes
  // Note: fetchDepartments is intentionally excluded from dependencies to prevent infinite loops
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    fetchDepartments();
  }, [appliedFilters, page, pageSize]);

  const handleApplyFilter = () => {
    const corporateLabel = corporateOptions.find(o => o.value === filterCorporate)?.label || '';
    setPage(1);
    setAppliedFilters({
      search: search,
      corporateId: filterCorporate,
      corporateLabel,
    });
  };

  const handleClearFilter = () => {
    setSearch('');
    setFilterCorporate('');
    setAppliedFilters({
      search: '',
      corporateId: '',
      corporateLabel: '',
    });
    setPage(1);
  };

  const handleOpenModal = (dept?: Department, viewOnly = false) => {
    setIsViewOnly(viewOnly);
    if (dept) {
      setEditingDept(dept);
      setFormData({
        corporateId: dept.corporateId,
        code: dept.code,
        name: dept.name,
        headName: dept.headName || '',
        description: dept.description || '',
        isActive: dept.isActive
      });
    } else {
      setEditingDept(null);
      setFormData({
        corporateId: filterCorporate || '',
        code: '',
        name: '',
        headName: '',
        description: '',
        isActive: true
      });
    }

    // Re-fetch workflow status setiap kali modal dibuka agar selalu pakai state terkini.
    if (!viewOnly) {
      if (dept) approvalEdit.recheck();
      else approvalCreate.recheck();
    }

    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    if (isSaving) return;
    setIsModalOpen(false);
    setEditingDept(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validation = departmentSchema.safeParse(formData);
    if (!validation.success) {
      validation.error.issues.forEach(err => toast.error(err.message));
      return;
    }

    setIsSaving(true);

    try {
      const payload = { ...formData };

      // Check if approval workflow is active for this action
      const approvalHook = editingDept ? approvalEdit : approvalCreate;
      if (!approvalHook.isChecking && approvalHook.hasWorkflow) {
        try {
          const draft = await approvalHook.createDraft({
            payload: payload as Record<string, unknown>,
            entityId: editingDept ? editingDept.id : undefined,
            originalData: editingDept ? { ...editingDept } : undefined,
          });
          setIsModalOpen(false);
          setActiveDraftApprovalId(draft.id);
          toast.success(approvalI18n[language].toast.draftCreated);
        } catch (err: any) {
          toast.error(getErrorMessage(err.error?.code || 'NETWORK_ERROR', language));
        } finally {
          setIsSaving(false);
        }
        return;
      }

      // Normal save flow (no approval workflow)
      const url = editingDept ? `/api/departments/${editingDept.id}` : '/api/departments';
      const method = editingDept ? 'PUT' : 'POST';

      const res = await apiFetch(url, {
        method,
        body: JSON.stringify(formData)
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw errorData;
      }

      toast.success(editingDept ? common.successUpdate : common.successSave);
      setIsModalOpen(false);
      fetchDepartments(true);
    } catch (err: any) {
      const errCode = err.error?.code || err.code || 'NETWORK_ERROR';
      toast.error(getErrorMessage(errCode, language));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    // Check if delete workflow is active
    if (!approvalDelete.isChecking && approvalDelete.hasWorkflow) {
      const item = departments.find(d => d.id === id);
      if (item) {
        try {
          const draft = await approvalDelete.createDraft({
            payload: { ...item } as Record<string, unknown>,
            entityId: id,
            originalData: { ...item } as Record<string, unknown>,
          });
          setDeleteConfirmId(null);
          setActiveDraftApprovalId(draft.id);
          toast.success(approvalI18n[language].toast.draftCreated);
        } catch (err: any) {
          toast.error(err.message ?? getErrorMessage('NETWORK_ERROR', language));
        }
        return;
      }
    }

    // Normal delete flow
    setIsDeleting(true);

    try {
      const res = await apiFetch(`/api/departments/${id}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        toast.success(common.successDelete);
        setDeleteConfirmId(null);
        fetchDepartments(true);
      } else {
        const errData = await res.json();
        throw errData;
      }
    } catch (err: any) {
      const errCode = err.error?.code || err.code || 'NETWORK_ERROR';
      toast.error(getErrorMessage(errCode, language));
      setDeleteConfirmId(null);
    } finally {
      setIsDeleting(false);
    }
  };

  // Pagination Helpers
  const totalPages = Math.ceil(totalCount / pageSize);
  const showingFrom = (page - 1) * pageSize + 1;
  const showingTo = Math.min(page * pageSize, totalCount);

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-100">
              <Briefcase size={24} />
            </div>
            {t.title}
          </h2>
          <p className="text-sm text-slate-500 mt-1 flex items-center gap-1.5 ml-1">
            <Info size={14} className="text-indigo-400" />
            {t.subtitle}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <UploadButton
            entityType="department"
            onUploadComplete={() => fetchDepartments(true)}
          />
          {canWrite && (
            <button
              onClick={() => handleOpenModal()}
              className="group px-4 py-2 text-sm font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-lg shadow-indigo-100 active:scale-95 cursor-pointer"
            >
              <Plus size={18} className="group-hover:rotate-90 transition-transform duration-300" />
              {t.inputNew}
            </button>
          )}
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200/60 flex flex-wrap items-center gap-4 mb-6">
        <CorporateSelector
          className="w-full md:w-72"
          value={filterCorporate}
          onChange={(val) => setFilterCorporate(val)}
          placeholder={t.modal.selectCorporate}
          disabled={isCorpsLoading}
        />

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

        <div className="flex items-center gap-2">
          <button
            onClick={handleApplyFilter}
            className="flex items-center gap-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-4 py-2 rounded-xl text-xs font-black transition-all active:scale-95 border border-indigo-200/50 cursor-pointer"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            {common.apply}
          </button>
          <button
            onClick={handleClearFilter}
            className="flex items-center gap-2 bg-slate-50 text-slate-500 hover:bg-slate-100 px-4 py-2 rounded-xl text-xs font-black transition-all active:scale-95 border border-slate-200/50 cursor-pointer"
          >
            <FilterX size={14} />
            {common.clear}
          </button>
          <ExportButton
            entityType="department"
            filters={appliedFilters}
            disabled={loading}
          />
        </div>
      </div>

      {/* Datatable section */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/40 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.tableHead.code}</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.tableHead.name}</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.tableHead.corporate}</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.tableHead.head}</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{common.status}</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">{common.actions}</th>
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
                      <td className="px-6 py-4"><div className="h-6 bg-slate-100 rounded-lg w-16" /></td>
                      <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-32 mb-2" /><div className="h-3 bg-slate-100 rounded w-24" /></td>
                      <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-28" /></td>
                      <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-20" /></td>
                      <td className="px-6 py-4"><div className="h-6 bg-slate-100 rounded-full w-20" /></td>
                      <td className="px-6 py-4"><div className="h-8 bg-slate-100 rounded-lg w-24 ml-auto" /></td>
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
                            onClick={() => fetchDepartments()}
                            className="mt-6 px-6 py-2.5 bg-indigo-600 text-white text-xs font-black rounded-xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 cursor-pointer flex items-center gap-2 mx-auto"
                          >
                            <RefreshCw size={14} />
                            {common.retry}
                          </button>
                        </div>
                      </div>
                    </td>
                  </motion.tr>
                ) : departments.length === 0 ? (
                  <motion.tr
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <td colSpan={6}>
                      <div className="py-20 flex flex-col items-center justify-center gap-4 text-center">
                        <div className="p-4 bg-slate-50 rounded-full text-slate-300">
                          <Briefcase size={48} />
                        </div>
                        <div>
                          <p className="text-slate-800 font-bold text-lg">{t.status.empty}</p>
                          <p className="text-slate-500 text-sm mt-1">{t.status.emptyDesc}</p>
                        </div>
                      </div>
                    </td>
                  </motion.tr>
                ) : (
                  departments.map((dept, idx) => (
                    <motion.tr
                      key={dept.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: idx * 0.03 }}
                      className="hover:bg-slate-50/50 transition-colors group font-bold"
                    >
                      <td className="px-6 py-4">
                        <div className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-black inline-block border border-indigo-100/50">
                          {dept.code}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-bold text-slate-800 text-sm tracking-tight">{dept.name}</p>
                          {dept.description && (
                            <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">{dept.description}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-md bg-slate-200 flex items-center justify-center shrink-0">
                            <Building2 size={12} className="text-slate-500" />
                          </div>
                          <span className="text-xs font-semibold text-slate-600 truncate max-w-[150px]">
                            {dept.corporateName || '-'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs font-bold text-slate-600">{dept.headName || '-'}</td>
                      <td className="px-6 py-4">
                        <div className={cn(
                          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black tracking-wider uppercase border",
                          dept.isActive
                            ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                            : "bg-slate-50 text-slate-500 border-slate-100"
                        )}>
                          <div className={cn("w-1.5 h-1.5 rounded-full", dept.isActive ? "bg-emerald-500" : "bg-slate-400")} />
                          {dept.isActive ? common.active : common.inactive}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleOpenModal(dept, true)}
                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all cursor-pointer"
                            title="View Details"
                          >
                            <Eye size={16} />
                          </button>
                          {canWrite && (
                            <button
                              onClick={() => handleOpenModal(dept)}
                              className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all cursor-pointer"
                              title="Edit Department"
                            >
                              <Edit2 size={16} />
                            </button>
                          )}
                          {canDelete && (
                            <button
                              onClick={() => setDeleteConfirmId(dept.id)}
                              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                              title="Delete Department"
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

        {/* Pagination Info */}
        {!loading && totalCount > 0 && (
          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/30 flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <span className="text-xs font-bold text-slate-500">
                {common.pagination.showing} <span className="text-slate-800 mx-0.5">{showingFrom}</span> - <span className="text-slate-800 mx-0.5">{showingTo}</span> {common.pagination.of} <span className="text-slate-800 mx-0.5">{totalCount}</span>
              </span>

              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  {common.pagination.rowsPerPage}
                </span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setPage(1);
                  }}
                  className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all cursor-pointer shadow-sm hover:border-slate-300"
                >
                  {[10, 25, 50, 100].map(size => (
                    <option key={size} value={size}>{size}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className={cn(
                  "p-2 rounded-lg transition-all",
                  page === 1 ? "text-slate-300 cursor-not-allowed" : "text-slate-600 hover:bg-white hover:shadow-sm active:scale-90 cursor-pointer"
                )}
              >
                <ChevronLeft size={16} />
              </button>

              <div className="flex items-center gap-1">
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
                          "w-8 h-8 flex items-center justify-center rounded-lg text-xs font-black transition-all cursor-pointer",
                          page === pageNum
                            ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100 scale-110"
                            : "bg-white text-slate-600 border border-slate-200 hover:border-indigo-300"
                        )}
                      >
                        {pageNum}
                      </button>
                    );
                  }
                  return null;
                })}
              </div>

              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className={cn(
                  "p-2 rounded-lg transition-all",
                  page === totalPages ? "text-slate-300 cursor-not-allowed" : "text-slate-600 hover:bg-white hover:shadow-sm active:scale-90 cursor-pointer"
                )}
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
            onClose={handleCloseModal}
            title={isViewOnly ? t.modal.viewTitle : (editingDept ? t.modal.editTitle : t.modal.createTitle)}
            size="lg"
          >
            <form onSubmit={handleSubmit} onInvalid={() => toast.error(common.errorRequired, { id: 'errorRequired' })} className="flex-1 overflow-hidden flex flex-col">
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <SectionHeader
                  title={t.modal.sectionTitle}
                  icon={<Briefcase size={14} className="text-indigo-600" />}
                  color="border-indigo-200"
                />

                {/* Row 1: Perusahaan + Kode */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <CorporateSelector
                    label={t.modal.corporate}
                    value={formData.corporateId}
                    onChange={(val) => setFormData({ ...formData, corporateId: val })}
                    disabled={!!editingDept || isViewOnly || isCorpsLoading}
                    placeholder={t.modal.selectCorporate}
                    required
                  />

                  <FormField label={t.modal.code} required>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Hash size={14} className="text-slate-400" />
                      </div>
                      <input
                        type="text"
                        value={formData.code}
                        onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                        disabled={!!editingDept || isViewOnly}
                        placeholder={t.modal.codePlaceholder}
                        className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 disabled:opacity-50"
                      />
                    </div>
                  </FormField>
                </div>

                {/* Row 2: Nama + Kepala Departemen */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField label={t.modal.name} required>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder={t.modal.namePlaceholder}
                      disabled={isViewOnly}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500"
                    />
                  </FormField>

                  <FormField label={t.modal.head}>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Users size={14} className="text-slate-400" />
                      </div>
                      <input
                        type="text"
                        value={formData.headName}
                        onChange={(e) => setFormData({ ...formData, headName: e.target.value })}
                        placeholder={t.modal.headPlaceholder}
                        disabled={isViewOnly}
                        className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500"
                      />
                    </div>
                  </FormField>
                </div>

                {/* Row 3: Deskripsi + Status */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                  <FormField label={t.modal.description}>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                      placeholder={t.modal.descriptionPlaceholder}
                      disabled={isViewOnly}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 resize-none"
                    />
                  </FormField>

                  <div className="space-y-1.5 pt-6">
                    <div className="flex items-center gap-3 bg-slate-50 px-4 py-3 rounded-2xl border border-slate-100">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{common.status}</span>
                      <button
                        type="button"
                        disabled={isViewOnly}
                        onClick={() => setFormData(p => ({ ...p, isActive: !p.isActive }))}
                        className={cn(
                          "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:cursor-not-allowed disabled:opacity-50",
                          formData.isActive ? "bg-indigo-600" : "bg-slate-200"
                        )}
                      >
                        <span
                          className={cn(
                            "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                            formData.isActive ? "translate-x-5" : "translate-x-0"
                          )}
                        />
                      </button>
                      <span className={cn("text-[10px] font-black uppercase tracking-widest", formData.isActive ? "text-indigo-600" : "text-slate-400")}>
                        {formData.isActive ? common.active : common.inactive}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-8 py-3 bg-white border border-slate-200 text-sm font-bold text-slate-500 rounded-xl hover:bg-slate-50 transition-all active:scale-95 cursor-pointer shadow-sm"
                >
                  {isViewOnly ? common.close : common.cancel}
                </button>
                {!isViewOnly && (
                  <button
                    type="submit"
                    disabled={isSaving || (editingDept ? approvalEdit.isChecking : approvalCreate.isChecking)}
                    className="px-10 py-3 bg-indigo-600 text-sm font-bold text-white rounded-xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 flex items-center justify-center gap-2 min-w-[180px] cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
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

      {/* --- Approval Detail Modal (opened after draft creation) --- */}
      <AnimatePresence>
        {activeDraftApprovalId && (
          <ApprovalDetailModal
            approvalId={activeDraftApprovalId}
            onClose={() => setActiveDraftApprovalId(null)}
            onRefresh={() => fetchDepartments(true)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

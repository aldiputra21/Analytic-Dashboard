import React, { useState, useEffect } from 'react';
import {
  Plus, Edit2, Trash2, Calculator, X, AlertCircle, CheckCircle2,
  RefreshCw, FilterX, DollarSign, Eye, Save, Calendar, FileText,
  Info, ChevronLeft, ChevronRight
} from 'lucide-react';
import { CorporateSelector } from '../shared/CorporateSelector';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../../utils/cn';
import { useAuth } from '../../../hooks/financial/useAuth';
import { useCorporates } from '../../../hooks/financial/useCorporates';
import { useCashFlowProjections, CashFlowProjectionHeader, CashFlowProjectionDetail } from '../../../hooks/financial/useCashFlowProjections';
import { toast } from 'sonner';
import { getErrorMessage } from '../../../utils/errorUtils';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogHeader
} from '../../ui/alert-dialog';
import { cashFlowProjectionI18n } from '../../../i18n/cashFlowProjections';
import { commonsI18n } from '../../../i18n/commons';
import { formatRupiah, parseFormattedNumber, formatNumber } from '../../../utils/format';
import { z } from 'zod';

// --- Helper Components ---
const Modal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'md' | 'lg' | 'xl' | 'full';
}> = ({ isOpen, onClose, title, children, size = 'lg' }) => {
  if (!isOpen) return null;

  const sizeClasses = {
    md: 'max-w-md',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-[95vw]'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className={cn("bg-white rounded-2xl shadow-2xl w-full overflow-hidden flex flex-col max-h-[90vh]", sizeClasses[size])}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <h3 className="text-lg font-bold text-slate-800">{title}</h3>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all">
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 flex flex-col overflow-hidden">
          {children}
        </div>
      </motion.div>
    </div>
  );
};

const FormField: React.FC<{
  label: string;
  icon?: React.ReactNode;
  error?: string;
  children: React.ReactNode;
  required?: boolean;
}> = ({ label, icon, error, children, required }) => (
  <div className="space-y-1.5">
    <label className="text-xs font-bold text-slate-700 uppercase tracking-tight flex items-center gap-1.5">
      {icon && <span className="text-indigo-500">{icon}</span>}
      {label}
      {required && <span className="text-red-500">*</span>}
    </label>
    <div className="relative group">
      {children}
    </div>
    {error && (
      <p className="flex items-center gap-1 mt-1 text-[10px] font-bold text-red-600 uppercase">
        <AlertCircle size={10} />
        {error}
      </p>
    )}
  </div>
);

// --- Main Component ---
export const CashFlowProjectionManager: React.FC = () => {
  const { hasPermission, language, user } = useAuth();
  const { corporates, showSelector } = useCorporates();
  const t = cashFlowProjectionI18n[language];
  const common = commonsI18n[language];
  const months = common.months;

  const initialCorporateId = (user?.subsidiaryIds && user.subsidiaryIds.length === 1) ? user.subsidiaryIds[0] : '';

  const [filterCorporateId, setFilterCorporateId] = useState<string>(initialCorporateId);
  const [filterYear, setFilterYear] = useState<string>('');

  const [appliedFilters, setAppliedFilters] = useState({
    corporateId: initialCorporateId,
    year: ''
  });

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const {
    projections, totalCount, isLoading, error, refetch,
    createProjection, updateProjection, deleteProjection, getProjection
  } = useCashFlowProjections(appliedFilters.corporateId, currentPage, pageSize, appliedFilters.year);

  const totalPages = Math.ceil(totalCount / pageSize);

  const canWrite = hasPermission('cfd.cash_flow_projections.write');
  const canDelete = hasPermission('cfd.cash_flow_projections.delete');

  // Validation Schema
  const projectionSchema = z.object({
    corporateId: z.string().min(1, t.validation.corporateRequired),
    fiscalYear: z.number().int().min(2000).max(2100),
    initialBalance: z.number().min(0, t.validation.amountMin),
    notes: z.string().optional(),
    details: z.array(z.object({
      month: z.number().int().min(1).max(12),
      type: z.enum(['cash-in', 'cash-out']),
      group: z.string(),
      category: z.string(),
      amount: z.number().min(0)
    })).refine((details) => {
      const total = details.reduce((sum, d) => sum + d.amount, 0);
      return total > 0;
    }, { message: t.validation.nominalZero })
  });

  // UI State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create');
  const isReadOnly = modalMode === 'view';
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form State
  const [headerForm, setHeaderForm] = useState({
    corporateId: initialCorporateId,
    fiscalYear: new Date().getFullYear(),
    initialBalance: 0,
    notes: ''
  });

  const [detailsForm, setDetailsForm] = useState<Omit<CashFlowProjectionDetail, 'id' | 'headerId'>[]>([]);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (appliedFilters.corporateId) {
      setHeaderForm(prev => ({ ...prev, corporateId: appliedFilters.corporateId }));
    }
  }, [appliedFilters.corporateId]);

  const initDetails = () => {
    const defaultDetails: Omit<CashFlowProjectionDetail, 'id' | 'headerId'>[] = [];
    for (let m = 1; m <= 12; m++) {
      defaultDetails.push({ month: m, type: 'cash-in', group: 'operating', category: 'Sales', amount: 0 });
      defaultDetails.push({ month: m, type: 'cash-out', group: 'operating', category: 'OPEX', amount: 0 });
    }
    setDetailsForm(defaultDetails);
  };

  const openCreate = () => {
    setModalMode('create');
    setEditingId(null);
    setFormErrors({});
    setHeaderForm({
      corporateId: (user?.subsidiaryIds && user.subsidiaryIds.length === 1) ? user.subsidiaryIds[0] : (appliedFilters.corporateId || ''),
      fiscalYear: new Date().getFullYear(),
      initialBalance: 0,
      notes: ''
    });
    initDetails();
    setIsModalOpen(true);
  };

  const openEdit = async (mode: 'edit' | 'view', item: CashFlowProjectionHeader) => {
    setModalMode(mode);
    setEditingId(item.id);
    setFormErrors({});
    try {
      const fullData = await getProjection(item.id);
      setHeaderForm({
        corporateId: fullData.corporateId,
        fiscalYear: fullData.fiscalYear,
        initialBalance: Number(fullData.initialBalance),
        notes: fullData.notes || ''
      });
      setDetailsForm(fullData.details || []);
      setIsModalOpen(true);
    } catch (err: any) {
      toast.error(getErrorMessage(err.code || err.message, language));
    }
  };

  const validateForm = () => {
    try {
      projectionSchema.parse({
        ...headerForm,
        details: detailsForm
      });
      setFormErrors({});
      return true;
    } catch (err) {
      if (err instanceof z.ZodError) {
        const errors: Record<string, string> = {};
        err.issues.forEach((e) => {
          if (e.path.length > 0) {
            errors[e.path.join('.')] = e.message;
          }
        });
        setFormErrors(errors);

        // Custom message for nested details
        if (errors['details']) {
          toast.error(t.validation.nominalZero);
        } else {
          toast.error(common.errorValidation);
        }
      }
      return false;
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving || !validateForm()) return;

    setIsSaving(true);
    try {
      const payload = {
        ...headerForm,
        details: detailsForm
      };

      if (modalMode === 'create') {
        await createProjection(payload);
        toast.success(t.alerts.saveSuccess);
      } else if (editingId) {
        await updateProjection(editingId, payload);
        toast.success(t.alerts.updateSuccess);
      }
      setIsModalOpen(false);
      refetch();
    } catch (err: any) {
      const message = err.code === 'DUPLICATE_ENTRY' 
        ? t.validation.duplicateEntry 
        : getErrorMessage(err.code || err.message, language);
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setIsDeleting(true);
    try {
      await deleteProjection(id);
      toast.success(t.alerts.deleteSuccess);
      setDeleteConfirmId(null);
      refetch();
    } catch (err: any) {
      toast.error(getErrorMessage(err.code || err.message, language));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleApplyFilter = () => {
    setAppliedFilters({
      corporateId: filterCorporateId,
      year: filterYear
    });
    setCurrentPage(1);
  };

  const handleClearFilter = () => {
    setFilterYear('');
    const defaultCorpId = showSelector ? '' : (user?.corporateId || '');
    setFilterCorporateId(defaultCorpId);
    setAppliedFilters({
      corporateId: defaultCorpId,
      year: ''
    });
    setCurrentPage(1);
  };

  const updateDetailAmount = (month: number, type: 'cash-in' | 'cash-out', category: string, value: string) => {
    const numericValue = parseFormattedNumber(value);
    setDetailsForm(prev => {
      const existing = prev.find(d => d.month === month && d.type === type && d.category === category);
      if (existing) {
        return prev.map(d =>
          (d.month === month && d.type === type && d.category === category)
            ? { ...d, amount: numericValue }
            : d
        );
      } else {
        // Default group to 'operating' for now, matching initDetails
        return [...prev, { month, type, category, group: 'operating', amount: numericValue }];
      }
    });
  };

  const filteredProjections = projections.filter(p =>
    (!appliedFilters.year || p.fiscalYear.toString() === appliedFilters.year) &&
    (!appliedFilters.corporateId || p.corporateId === appliedFilters.corporateId)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-4">
            <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-100">
              <Calculator size={24} />
            </div>
            {t.title}
          </h2>
          <p className="text-sm text-slate-500 mt-1 flex items-center gap-1.5 ml-1 font-medium">
            <Info size={14} className="text-indigo-400" />
            {t.subtitle}
          </p>
        </div>

        {canWrite && (
          <button
            onClick={openCreate}
            className="group px-4 py-2 text-sm font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-lg shadow-indigo-100 active:scale-95 cursor-pointer"
          >
            <Plus size={18} className="group-hover:rotate-90 transition-transform duration-300" />
            {t.addNew}
          </button>
        )}
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200/60 flex flex-wrap items-center gap-4">
        {showSelector && (
          <div className="flex-1 min-w-[240px]">
            <CorporateSelector
              value={filterCorporateId}
              onChange={setFilterCorporateId}
              placeholder={t.modal.selectCorporate}
              className="w-full"
            />
          </div>
        )}

        <div className={cn("relative group", showSelector ? "w-full md:w-48" : "flex-1")}>
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={16} />
          <input
            type="number"
            placeholder={t.modal.fiscalYear}
            value={filterYear}
            onChange={(e) => setFilterYear(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleApplyFilter()}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-normal"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleApplyFilter}
            className="flex items-center gap-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-4 py-2 rounded-lg text-xs font-bold transition-all active:scale-95 border border-indigo-200/50 cursor-pointer"
          >
            <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
            {common.apply}
          </button>
          <button
            onClick={handleClearFilter}
            className="flex items-center gap-2 bg-slate-50 text-slate-500 hover:bg-slate-100 px-4 py-2 rounded-lg text-xs font-bold transition-all active:scale-95 border border-slate-200/50 cursor-pointer"
          >
            <FilterX size={14} />
            {common.clear}
          </button>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="pl-10 pr-6 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-left">{t.tableHead.year}</th>
                <th className="px-6 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-left">{t.tableHead.corporate}</th>
                <th className="px-6 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-right">{t.tableHead.initialBalance}</th>
                <th className="px-6 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-left">{t.tableHead.notes}</th>
                <th className="px-6 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-left">{common.createdAt}</th>
                <th className="pl-6 pr-10 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-right">{common.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              <AnimatePresence>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={`skeleton-${i}`} className="animate-pulse">
                      <td className="pl-10 pr-6 py-5"><div className="h-4 bg-slate-100 rounded-lg w-12" /></td>
                      <td className="px-6 py-5"><div className="h-4 bg-slate-100 rounded-lg w-24" /></td>
                      <td className="px-6 py-5"><div className="h-4 bg-slate-100 rounded-lg w-32 ml-auto" /></td>
                      <td className="px-6 py-5"><div className="h-4 bg-slate-100 rounded-lg w-40" /></td>
                      <td className="px-6 py-5"><div className="h-4 bg-slate-100 rounded-lg w-24" /></td>
                      <td className="pl-6 pr-10 py-5 text-right"><div className="h-10 bg-slate-100 rounded-xl w-24 ml-auto" /></td>
                    </tr>
                  ))
                ) : filteredProjections.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-24 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <div className="p-6 bg-slate-50 rounded-full border border-slate-100">
                          <Calculator size={64} className="text-slate-200" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-slate-500 font-black text-lg">{t.status.empty}</p>
                          <p className="text-slate-400 text-sm font-medium">{t.status.emptyDesc}</p>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredProjections.map((p, idx) => {
                    return (
                      <motion.tr
                        key={p.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.03 }}
                        className="hover:bg-slate-50/50 transition-all group cursor-default"
                      >
                        <td className="pl-10 pr-6 py-5 font-black text-slate-900">{p.fiscalYear}</td>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-xs">
                              {p.corporateName?.substring(0, 2) || '??'}
                            </div>
                            <span className="font-bold text-slate-700">{p.corporateName || 'N/A'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-5 text-right font-black text-slate-700 tracking-tight">
                          {formatRupiah(p.initialBalance)}
                        </td>
                        <td className="px-6 py-5 text-slate-500 max-w-xs truncate font-medium italic">
                          {p.notes || '-'}
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex flex-col">
                            <span className="text-slate-700 font-bold text-xs">{new Date(p.createdAt).toLocaleDateString()}</span>
                            <span className="text-slate-400 text-[10px] font-medium">{new Date(p.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        </td>
                        <td className="pl-6 pr-10 py-5 text-right">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                            <button
                              onClick={() => openEdit('view', p)}
                              className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                              title={common.view}
                            >
                              <Eye size={18} />
                            </button>
                            {canWrite && (
                              <button
                                onClick={() => openEdit('edit', p)}
                                className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                                title={common.edit}
                              >
                                <Edit2 size={18} />
                              </button>
                            )}
                            {canDelete && (
                              <button
                                onClick={() => setDeleteConfirmId(p.id)}
                                className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                                title={common.delete}
                              >
                                <Trash2 size={18} />
                              </button>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        {/* Pagination Info */}
        {!isLoading && totalCount > 0 && (
          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/30 flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <span className="text-xs font-bold text-slate-500">
                {common.pagination.showing} <span className="text-slate-800 mx-0.5">{Math.min(totalCount, (currentPage - 1) * pageSize + 1)}</span> - <span className="text-slate-800 mx-0.5">{Math.min(totalCount, currentPage * pageSize)}</span> {common.pagination.of} <span className="text-slate-800 mx-0.5">{totalCount}</span> {common.pagination.entries}
              </span>

              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  {common.pagination.rowsPerPage}
                </span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
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
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className={cn(
                  "p-2 rounded-lg transition-all",
                  currentPage === 1 ? "text-slate-300 cursor-not-allowed" : "text-slate-600 hover:bg-white hover:shadow-sm active:scale-90 cursor-pointer"
                )}
              >
                <ChevronLeft size={16} />
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum = i + 1;
                  if (totalPages > 5 && currentPage > 3) {
                    pageNum = currentPage - 2 + i;
                    if (pageNum + (4 - i) > totalPages) pageNum = totalPages - 4 + i;
                  }

                  if (pageNum > 0 && pageNum <= totalPages) {
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={cn(
                          "w-8 h-8 flex items-center justify-center rounded-lg text-xs font-black transition-all",
                          currentPage === pageNum
                            ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100 scale-110 cursor-pointer"
                            : "bg-white text-slate-600 border border-slate-200 hover:border-indigo-300 cursor-pointer"
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
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className={cn(
                  "p-2 rounded-lg transition-all",
                  currentPage === totalPages ? "text-slate-300 cursor-not-allowed" : "text-slate-600 hover:bg-white hover:shadow-sm active:scale-90 cursor-pointer"
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
            onClose={() => setIsModalOpen(false)}
            title={modalMode === 'create' ? t.modal.createTitle : modalMode === 'edit' ? t.modal.editTitle : t.modal.viewTitle}
            size="full"
          >
            <form onSubmit={handleSave} className="flex-1 flex flex-col overflow-hidden" noValidate>
              <div className="p-8 overflow-y-auto space-y-10 scrollbar-hide">
                {/* Header Information Section */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                  <CorporateSelector
                    label={t.modal.corporate}
                    value={headerForm.corporateId}
                    onChange={val => setHeaderForm(p => ({ ...p, corporateId: val }))}
                    disabled={isReadOnly || modalMode === 'edit'}
                    error={formErrors.corporateId}
                    required
                    placeholder={t.modal.selectCorporate}
                    className="md:col-span-1"
                  />

                  <FormField
                    label={t.modal.fiscalYear}
                    icon={<Calendar size={14} />}
                    required
                    error={formErrors.fiscalYear}
                  >
                    <div className="relative">
                      <input
                        type="number"
                        value={headerForm.fiscalYear}
                        onChange={e => setHeaderForm(p => ({ ...p, fiscalYear: parseInt(e.target.value) || 0 }))}
                        disabled={isReadOnly || modalMode === 'edit'}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-sm font-normal disabled:bg-slate-100"
                      />
                    </div>
                  </FormField>

                  <FormField
                    label={t.modal.initialBalance}
                    icon={<DollarSign size={14} />}
                    required
                    error={formErrors.initialBalance}
                  >
                    <div className="relative">
                      <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs pointer-events-none">Rp</div>
                      <input
                        type="text"
                        value={headerForm.initialBalance !== undefined ? formatNumber(headerForm.initialBalance) : ''}
                        onChange={e => setHeaderForm(p => ({ ...p, initialBalance: parseFormattedNumber(e.target.value) }))}
                        disabled={isReadOnly}
                        className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-sm font-normal tracking-wider text-right"
                        placeholder="0"
                      />
                    </div>
                  </FormField>

                  <FormField
                    label={t.modal.notes}
                    icon={<FileText size={14} />}
                  >
                    <input
                      type="text"
                      value={headerForm.notes}
                      onChange={e => setHeaderForm(p => ({ ...p, notes: e.target.value }))}
                      disabled={isReadOnly}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-sm font-normal placeholder:text-slate-400"
                      placeholder={t.modal.notes}
                    />
                  </FormField>
                </div>

                <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow-sm">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="bg-slate-50/50">
                        <th className="pl-8 pr-4 py-4 text-left font-black text-slate-400 text-[10px] uppercase tracking-widest border-b border-slate-100 w-48">{t.modal.month}</th>
                        <th className="px-6 py-4 text-right font-black text-emerald-600 text-[10px] uppercase tracking-widest border-b border-slate-100">{t.modal.inflowSales}</th>
                        <th className="pl-6 pr-8 py-4 text-right font-black text-rose-600 text-[10px] uppercase tracking-widest border-b border-slate-100">{t.modal.outflowOpex}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {Array.from({ length: 12 }).map((_, i) => {
                        const mIndex = i + 1;
                        const inflow = detailsForm.find(d => d.month === mIndex && d.type === 'cash-in');
                        const outflow = detailsForm.find(d => d.month === mIndex && d.type === 'cash-out');

                        return (
                          <tr key={mIndex} className="hover:bg-slate-50/30 transition-colors group">
                            <td className="pl-8 pr-4 py-3">
                              <div className="flex items-center gap-3">
                                <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center text-[10px] font-black">{mIndex}</span>
                                <span className="font-bold text-slate-700">{months[i]}</span>
                              </div>
                            </td>
                            <td className="px-6 py-3">
                              <div className="relative group/input">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-emerald-300 pointer-events-none transition-colors group-focus-within/input:text-emerald-500">Rp</div>
                                <input
                                  type="text"
                                  value={inflow ? formatNumber(inflow.amount) : '0'}
                                  onChange={e => updateDetailAmount(mIndex, 'cash-in', 'Sales', e.target.value)}
                                  disabled={isReadOnly}
                                  className="w-full pl-10 pr-3 py-2 bg-emerald-50/20 border border-emerald-100/50 rounded-lg text-right text-sm font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                                  placeholder="0"
                                />
                              </div>
                            </td>
                            <td className="pl-6 pr-8 py-3">
                              <div className="relative group/input">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-rose-300 pointer-events-none transition-colors group-focus-within/input:text-rose-500">Rp</div>
                                <input
                                  type="text"
                                  value={outflow ? formatNumber(outflow.amount) : '0'}
                                  onChange={e => updateDetailAmount(mIndex, 'cash-out', 'OPEX', e.target.value)}
                                  disabled={isReadOnly}
                                  className="w-full pl-10 pr-3 py-2 bg-rose-50/20 border border-rose-100/50 rounded-lg text-right text-sm font-medium focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all"
                                  placeholder="0"
                                />
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Fixed Bottom Footer */}
              <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <div className="hidden md:flex items-center gap-10">
                  <div className="flex flex-col">
                    <span className="uppercase text-[9px] font-black tracking-[0.2em] text-slate-400 mb-1">{t.modal.totalInflow}</span>
                    <span className="text-emerald-600 font-black text-lg">
                      {formatRupiah(detailsForm.filter(d => d.type === 'cash-in').reduce((s, d) => s + d.amount, 0))}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="uppercase text-[9px] font-black tracking-[0.2em] text-slate-400 mb-1">{t.modal.totalOutflow}</span>
                    <span className="text-rose-600 font-black text-lg">
                      {formatRupiah(detailsForm.filter(d => d.type === 'cash-out').reduce((s, d) => s + d.amount, 0))}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-8 py-3 bg-white border border-slate-200 text-sm font-bold text-slate-500 rounded-xl hover:bg-slate-50 transition-all active:scale-95 cursor-pointer shadow-sm"
                  >
                    {isReadOnly ? common.close : common.cancel}
                  </button>
                  {!isReadOnly && (
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

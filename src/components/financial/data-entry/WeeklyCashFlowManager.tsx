import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  Plus, Search, Filter, Eye, Edit2, Trash2,
  X, AlertCircle, Banknote, Calendar, Layers,
  ArrowDownCircle, ArrowUpCircle, Briefcase, Building2, CheckCircle2,
  RefreshCw, FilterX, Landmark,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  ChevronDown,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiFetch } from '../../../services/financial/apiFetch';
import { getErrorMessage } from '../../../utils/errorUtils';
import { formatRupiah, formatPeriod } from '../../../utils/format';
import { cn } from '../../../utils/cn';
import { useAuth } from '../../../hooks/financial/useAuth';
import { useCorporates } from '../../../hooks/financial/useCorporates';
import { useProjects } from '../../../hooks/financial/useProjects';
import { toast } from 'sonner';
import { MonthPicker } from '../shared/MonthPicker';
import { MonthRangePicker } from '../shared/MonthRangePicker';
import { SearchableSelect } from '../shared/SearchableSelect';
import { CorporateSelector } from '../shared/CorporateSelector';
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
import { weeklyCashFlowI18n } from '../../../i18n/weekly-cash-flow';
import { commonsI18n } from '../../../i18n/commons';
import { z } from 'zod';
import { useApproval } from '../../../hooks/financial/useApproval';
import { ApprovalDetailModal } from '../approval/ApprovalDetailModal';
import { approvalI18n } from '../../../i18n/approval';

// --- Types ---
interface CashFlow {
  id: string;
  corporateId: string;
  corporateName?: string;
  entityType: 'project' | 'corporate';
  entityId: string;
  entityName?: string;
  period: string;
  week: string;
  operatingCashIn: number;
  operatingCashOut: number;
  investingCashIn: number;
  investingCashOut: number;
  financingCashIn: number;
  financingCashOut: number;
  notes?: string;
  createdAt: string;
  createdBy: string;
}



// --- Validation Schema ---
const cashFlowSchema = (t: any, showSelector: boolean) => z.object({
  corporateId: z.string().optional(),
  entityType: z.enum(['project', 'corporate']),
  entityId: z.string().optional(),
  period: z.string().min(7, t.validation.periodInvalid),
  week: z.string().min(1, t.validation.weekRequired),
  operatingCashIn: z.number().min(0, t.validation.amountMin),
  operatingCashOut: z.number().min(0, t.validation.amountMin),
  investingCashIn: z.number().min(0, t.validation.amountMin),
  investingCashOut: z.number().min(0, t.validation.amountMin),
  financingCashIn: z.number().min(0, t.validation.amountMin),
  financingCashOut: z.number().min(0, t.validation.amountMin),
  notes: z.string().optional()
}).superRefine((data, ctx) => {
  // 0. Corporate validation: If showSelector is true, corporateId must be provided
  if (showSelector && (!data.corporateId || data.corporateId === '')) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: t.validation.corporateRequired,
      path: ['corporateId']
    });
  }
  // 1. Entity validation: If entityType is 'project', entityId must be provided and NOT be the same as corporateId
  if (data.entityType === 'project') {
    if (!data.entityId || data.entityId === data.corporateId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: t.validation.entityRequired,
        path: ['entityId']
      });
    }
  }

  // 3. Nominal validation: Total sum of all activities cannot be zero
  const totalNominal =
    Math.abs(data.operatingCashIn) + Math.abs(data.operatingCashOut) +
    Math.abs(data.investingCashIn) + Math.abs(data.investingCashOut) +
    Math.abs(data.financingCashIn) + Math.abs(data.financingCashOut);

  if (totalNominal === 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: t.validation.nominalZero,
      path: ['operatingCashIn'] // Show near first input
    });
  }
});

// --- Components ---

const Modal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'md' | 'lg' | 'xl' | '2xl';
}> = ({ isOpen, onClose, title, children, size = 'lg' }) => {
  if (!isOpen) return null;

  const sizeClasses = {
    md: 'max-w-md',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    '2xl': 'max-w-6xl'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px]">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className={cn("bg-white rounded-2xl shadow-2xl w-full overflow-hidden flex flex-col max-h-[90vh] relative z-10", sizeClasses[size])}
      >
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <div className="p-1.5 bg-blue-100 text-blue-600 rounded-lg">
              <Banknote size={18} />
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
  value: number | string;
  onChange: (val: string) => void;
  type?: string;
  placeholder?: string;
  readOnly?: boolean;
}> = ({ label, value, onChange, placeholder = "0", readOnly = false }) => {
  const displayValue = useMemo(() => {
    if (value === undefined || value === null || value === "" || value === 0) {
      return value === 0 ? "0" : "";
    }
    const num = Math.floor(Number(value));
    return isNaN(num) ? "" : num.toLocaleString('id-ID');
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/[^0-9-]/g, "");
    onChange(rawValue);
  };

  return (
    <div className="space-y-1.5">
      <label className="text-xs font-bold text-slate-500 uppercase tracking-tight">{label}</label>
      <input
        type="text"
        inputMode="numeric"
        value={displayValue}
        onChange={handleChange}
        placeholder={placeholder}
        readOnly={readOnly}
        className={cn(
          "w-full px-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm bg-slate-50/30 font-bold",
          readOnly && "bg-slate-100 cursor-not-allowed font-medium text-slate-600 border-none shadow-none"
        )}
      />
    </div>
  );
};

// --- Main Component ---

export const WeeklyCashFlowManager: React.FC = () => {
  const { user, hasPermission, language, subsidiaryIds, hasFullCorporateAccess } = useAuth();
  const queryClient = useQueryClient();
  const t = weeklyCashFlowI18n[language];
  const common = commonsI18n[language];

  const canWrite = hasPermission('cfd.weekly_cash_flows.write');
  const canDelete = hasPermission('cfd.weekly_cash_flows.delete');

  const [data, setData] = useState<CashFlow[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Approval integration
  const [activeDraftApprovalId, setActiveDraftApprovalId] = useState<string | null>(null);
  const approvalCreate = useApproval('cfd', 'weekly_cash_flow', 'create');
  const approvalEdit = useApproval('cfd', 'weekly_cash_flow', 'edit');
  const approvalDelete = useApproval('cfd', 'weekly_cash_flow', 'delete');

  const { corporates, options: corporateOptions, isLoading: isCorpsLoading, showSelector } = useCorporates();
  const { projects, isLoading: isProjsLoading } = useProjects();

  // Filters
  const [filterPeriodStart, setFilterPeriodStart] = useState('');
  const [filterPeriodEnd, setFilterPeriodEnd] = useState('');
  const [filterCorporate, setFilterCorporate] = useState('');
  const [filterEntityType, setFilterEntityType] = useState('');
  const [filterEntity, setFilterEntity] = useState('');
  const [filterSearch, setFilterSearch] = useState('');

  const [appliedFilters, setAppliedFilters] = useState({
    periodStart: '',
    periodEnd: '',
    corporate: '',
    entityType: '',
    entity: '',
    search: ''
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Form State
  const [formData, setFormData] = useState<Partial<CashFlow>>({});


  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const queryParams = new URLSearchParams();
      if (appliedFilters.periodStart) queryParams.set('periodStart', appliedFilters.periodStart);
      if (appliedFilters.periodEnd) queryParams.set('periodEnd', appliedFilters.periodEnd);
      if (appliedFilters.corporate) queryParams.set('corporateId', appliedFilters.corporate);
      if (appliedFilters.entityType) queryParams.set('entityType', appliedFilters.entityType);
      if (appliedFilters.entity) queryParams.set('entityId', appliedFilters.entity);
      if (appliedFilters.search) queryParams.set('search', appliedFilters.search);
      queryParams.set('page', currentPage.toString());
      queryParams.set('pageSize', pageSize.toString());

      const res = await apiFetch(`/api/financial-statements/cash-flow?${queryParams.toString()}`);
      if (res.ok) {
        const d = await res.json();
        const records = d.records || d.data || [];
        setData(records);
        setTotalCount(d.totalCount || records.length || 0);
      } else {
        const errData = await res.json();
        throw errData;
      }
    } catch (err: any) {
      const errCode = err.error?.code || err.code || 'NETWORK_ERROR';
      const msg = getErrorMessage(errCode, language);
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };


  useEffect(() => {
    fetchData();
  }, [currentPage, pageSize, appliedFilters]);

  const handleApplyFilter = () => {
    setAppliedFilters({
      periodStart: filterPeriodStart,
      periodEnd: filterPeriodEnd,
      corporate: filterCorporate,
      entityType: filterEntityType,
      entity: filterEntity,
      search: filterSearch
    });
    setCurrentPage(1);
  };

  const handleClearFilter = () => {
    setFilterPeriodStart('');
    setFilterPeriodEnd('');
    setFilterCorporate('');
    setFilterEntityType('');
    setFilterEntity('');
    setFilterSearch('');
    setAppliedFilters({
      periodStart: '',
      periodEnd: '',
      corporate: '',
      entityType: '',
      entity: '',
      search: ''
    });
    setCurrentPage(1);
  };

  const handleDelete = async (id: string) => {
    // Check if delete workflow is active
    if (!approvalDelete.isChecking && approvalDelete.hasWorkflow) {
      const item = data.find(d => d.id === id);
      if (item) {
        try {
          const draft = await approvalDelete.createDraft({
            payload: { ...item },
            entityId: id,
            originalData: { ...item },
          });
          setDeleteConfirmId(null);
          setActiveDraftApprovalId(draft.id);
          toast.success(approvalI18n[language].toast.draftCreated);
        } catch (err: any) {
          toast.error(err.message ?? common.errorSave);
        }
        return;
      }
    }

    // Normal delete flow
    setIsDeleting(true);
    try {
      const res = await apiFetch(`/api/financial-statements/cash-flow/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success(common.successDelete);
        queryClient.invalidateQueries({ queryKey: ['ratios'] });
        queryClient.invalidateQueries({ queryKey: ['mafinda', 'dashboard'] });
        fetchData();
      } else {
        const errData = await res.json();
        throw errData;
      }
    } catch (err: any) {
      toast.error(getErrorMessage(err.error?.code || err.code || 'NETWORK_ERROR', language));
    } finally {
      setIsDeleting(false);
      setDeleteConfirmId(null);
    }
  };

  const handleOpenModal = (mode: 'create' | 'edit' | 'view', item?: CashFlow) => {
    setModalMode(mode);

    // Re-fetch workflow status every time modal opens to get latest state
    if (mode !== 'view') {
      if (mode === 'create') approvalCreate.recheck();
      else if (mode === 'edit') approvalEdit.recheck();
    }

    if (item) {
      setFormData({
        ...item,
        operatingCashIn: Number(item.operatingCashIn),
        operatingCashOut: Number(item.operatingCashOut),
        investingCashIn: Number(item.investingCashIn),
        investingCashOut: Number(item.investingCashOut),
        financingCashIn: Number(item.financingCashIn),
        financingCashOut: Number(item.financingCashOut),
      });
    } else {
      const defaultCorpId = hasFullCorporateAccess ? '' : (subsidiaryIds?.[0] || '');
      setFormData({
        period: new Date().toISOString().slice(0, 7),
        week: 'W1',
        corporateId: defaultCorpId,
        entityType: 'corporate',
        entityId: defaultCorpId,
        operatingCashIn: 0, operatingCashOut: 0,
        investingCashIn: 0, investingCashOut: 0,
        financingCashIn: 0, financingCashOut: 0,
        notes: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;

    // Declarative validation with Zod
    const validation = cashFlowSchema(t, showSelector).safeParse(formData);
    if (!validation.success) {
      // Use set to avoid duplicate messages if multiple fields trigger same error
      const uniqueErrors = new Set(validation.error.issues.map(err => err.message));
      uniqueErrors.forEach(msg => toast.error(msg));
      return;
    }

    // Check if approval workflow is active for this action
    const approvalHook = modalMode === 'create' ? approvalCreate : approvalEdit;
    if (!approvalHook.isChecking && approvalHook.hasWorkflow) {
      setIsSaving(true);
      try {
        const draft = await approvalHook.createDraft({
          payload: validation.data as Record<string, unknown>,
          entityId: modalMode === 'edit' ? formData.id : undefined,
          originalData: modalMode === 'edit' ? { ...formData } : undefined,
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
    setIsSaving(true);
    try {
      const url = modalMode === 'edit' ? `/api/financial-statements/cash-flow/${formData.id}` : '/api/financial-statements/cash-flow';
      const method = modalMode === 'edit' ? 'PUT' : 'POST';

      const res = await apiFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validation.data),
      });

      if (res.ok) {
        toast.success(modalMode === 'create' ? common.successSave : common.successUpdate);
        queryClient.invalidateQueries({ queryKey: ['ratios'] });
        queryClient.invalidateQueries({ queryKey: ['mafinda', 'dashboard'] });
        setIsModalOpen(false);
        fetchData();
      } else {
        const errData = await res.json();
        throw errData;
      }
    } catch (err: any) {
      toast.error(getErrorMessage(err.error?.code || err.code || 'NETWORK_ERROR', language));
    } finally {
      setIsSaving(false);
    }
  };

  // --- Calculations ---
  const n = (v: any) => parseFloat(String(v)) || 0;
  const netOperating = n(formData.operatingCashIn) - n(formData.operatingCashOut);
  const netInvesting = n(formData.investingCashIn) - n(formData.investingCashOut);
  const netFinancing = n(formData.financingCashIn) - n(formData.financingCashOut);
  const netCashFlow = netOperating + netInvesting + netFinancing;

  const totalPages = Math.ceil(totalCount / pageSize);

  const entityOptions = useMemo(() => {
    if (formData.entityType === 'project') {
      if (!formData.corporateId) return [];
      return projects
        .filter(p => p.corporateId === formData.corporateId)
        .map(p => ({ value: p.id, label: p.name, sublabel: p.code }));
    }
    return corporateOptions;
  }, [formData.entityType, formData.corporateId, projects, corporateOptions]);

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-full">

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <div className="p-2 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-100">
              <Banknote size={24} />
            </div>
            {t.title}
          </h1>
          <p className="text-sm text-slate-500 mt-1 flex items-center gap-1.5 ml-1">
            <Info size={14} className="text-indigo-400" />
            {t.subtitle}
          </p>
        </div>

        {canWrite && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleOpenModal('create')}
              className="group px-4 py-2 text-sm font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-lg shadow-indigo-100 active:scale-95 cursor-pointer"
            >
              <Plus size={18} className="group-hover:rotate-90 transition-transform duration-300" />
              {t.inputNew}
            </button>
          </div>
        )}
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200/60 flex flex-wrap items-center gap-4">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <CorporateSelector
            className="w-full md:w-72"
            value={filterCorporate}
            onChange={(val) => setFilterCorporate(val)}
            placeholder={t.modal.corporate}
            disabled={isCorpsLoading}
          />

          <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus-within:ring-2 focus-within:ring-blue-500/20 transition-all flex-1 min-w-[200px]">
            <Search size={16} className="text-slate-400" />
            <input
              type="text"
              placeholder={t.searchPlaceholder}
              value={filterSearch}
              onChange={(e) => setFilterSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleApplyFilter()}
              className="bg-transparent border-none text-sm text-slate-800 focus:outline-none w-full"
            />
          </div>

          <div className="flex items-center gap-2 min-w-[280px]">
            <MonthRangePicker
              startValue={filterPeriodStart}
              endValue={filterPeriodEnd}
              onChange={(start, end) => {
                setFilterPeriodStart(start);
                setFilterPeriodEnd(end);
              }}
              language={language}
              className="w-full"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleApplyFilter}
              className="flex items-center gap-2 bg-blue-50 text-blue-700 hover:bg-blue-100 px-4 py-2 rounded-xl text-xs font-black transition-all active:scale-95 border border-blue-200/50 cursor-pointer"
            >
              <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
              {common.apply}
            </button>
            <button
              onClick={handleClearFilter}
              className="flex items-center gap-2 bg-slate-50 text-slate-500 hover:bg-slate-100 px-4 py-2 rounded-xl text-xs font-black transition-all active:scale-95 border border-slate-200/50 cursor-pointer"
            >
              <FilterX size={14} />
              {common.clear}
            </button>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/60 border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100 font-black text-[10px] text-slate-400 uppercase tracking-widest">
                <th className="px-6 py-4">{t.tableHead.period}</th>
                <th className="px-6 py-4 text-center">{t.tableHead.week}</th>
                <th className="px-6 py-4">{t.tableHead.corporateProject}</th>
                <th className="px-6 py-4 text-right">{t.tableHead.cashIn}</th>
                <th className="px-6 py-4 text-right">{t.tableHead.cashOut}</th>
                <th className="px-6 py-4 text-right">{t.tableHead.netFlow}</th>
                <th className="px-6 py-4 text-right">{common.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-sm font-bold">
              <AnimatePresence>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <motion.tr
                      key={`skeleton-${i}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="animate-pulse"
                    >
                      <td className="px-6 py-4"><div className="h-6 bg-slate-100 rounded-lg w-20" /></td>
                      <td className="px-6 py-4 text-center"><div className="h-6 bg-slate-100 rounded-lg w-12 mx-auto" /></td>
                      <td className="px-6 py-4"><div className="h-6 bg-slate-100 rounded-lg w-40" /></td>
                      <td className="px-6 py-4"><div className="h-6 bg-slate-100 rounded-lg w-24 ml-auto" /></td>
                      <td className="px-6 py-4"><div className="h-6 bg-slate-100 rounded-lg w-24 ml-auto" /></td>
                      <td className="px-6 py-4"><div className="h-6 bg-slate-100 rounded-lg w-24 ml-auto" /></td>
                      <td className="px-6 py-4 text-right"><div className="h-6 bg-slate-100 rounded-lg w-16 ml-auto" /></td>
                    </motion.tr>
                  ))
                ) : error ? (
                  <motion.tr key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <td colSpan={7}>
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
                  <motion.tr
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <td colSpan={7} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="p-4 bg-slate-50 rounded-full text-slate-300">
                          <Layers size={48} />
                        </div>
                        <p className="text-slate-800 font-bold text-lg">{t.status.empty}</p>
                        <p className="text-slate-500 text-sm mt-1">{t.status.emptyDesc}</p>
                      </div>
                    </td>
                  </motion.tr>
                ) : (
                  data.map((item, idx) => {
                    const ci = n(item.operatingCashIn) + n(item.investingCashIn) + n(item.financingCashIn);
                    const co = n(item.operatingCashOut) + n(item.investingCashOut) + n(item.financingCashOut);
                    const nf = ci - co;

                    return (
                      <motion.tr
                        key={item.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ delay: idx * 0.03 }}
                        className="hover:bg-slate-50/50 transition-colors group"
                      >
                        <td className="px-6 py-4 text-slate-700">{formatPeriod(item.period, language)}</td>
                        <td className="px-6 py-4 text-center">
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-[10px] uppercase font-black shadow-sm cursor-pointer">{item.week}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-slate-800">{item.corporateName}</span>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className={cn(
                                "text-[8px] px-1 py-0.5 rounded font-black uppercase tracking-widest border",
                                item.entityType === 'project' ? "bg-amber-50 text-amber-600 border-amber-100" : "bg-indigo-50 text-indigo-600 border-indigo-100"
                              )}>
                                {item.entityType === 'project' ? t.modal.project : t.modal.corporate}
                              </span>
                              <span className="text-[10px] text-slate-400 font-bold tracking-tighter">
                                {item.entityName}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right text-emerald-600 font-bold">{formatRupiah(ci, true)}</td>
                        <td className="px-6 py-4 text-right text-rose-600 font-bold">{formatRupiah(co, true)}</td>
                        <td className="px-6 py-4 text-right">
                          <span className={cn("font-bold", nf >= 0 ? "text-emerald-700" : "text-rose-700")}>
                            {formatRupiah(nf, true)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleOpenModal('view', item)}
                              className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all cursor-pointer"
                              title={common.view}
                            >
                              <Eye size={16} />
                            </button>
                            {canWrite && (
                              <button
                                onClick={() => handleOpenModal('edit', item)}
                                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all cursor-pointer"
                                title={common.edit}
                              >
                                <Edit2 size={16} />
                              </button>
                            )}
                            {canDelete && (
                              <button
                                onClick={() => setDeleteConfirmId(item.id)}
                                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                                title={common.delete}
                              >
                                <Trash2 size={16} />
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
                {common.pagination.showing} {Math.min(totalCount, (currentPage - 1) * pageSize + 1)} - {Math.min(totalCount, currentPage * pageSize)} {common.pagination.of} {totalCount} {common.pagination.total}
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
                          "w-8 h-8 flex items-center justify-center rounded-lg text-xs font-black transition-all cursor-pointer",
                          currentPage === pageNum
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

      {/* --- CRUD MODAL --- */}
      <AnimatePresence>
        {isModalOpen && (
          <Modal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            title={modalMode === 'create' ? t.modal.createTitle : modalMode === 'edit' ? t.modal.editTitle : t.modal.viewTitle}
            size="xl"
          >
            <form onSubmit={handleSave} noValidate className="flex-1 overflow-hidden flex flex-col">
              <div className="flex-1 overflow-y-auto p-6 scrollbar-hide space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
                  {/* Period */}
                  <div className="md:col-span-4 space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-tight flex items-center gap-1.5">
                      <Calendar size={12} /> {t.modal.period}
                    </label>
                    <MonthPicker
                      value={formData.period || ''}
                      onChange={(val) => setFormData(prev => ({ ...prev, period: val }))}
                      language={language}
                      labels={{ month: t.modal.month, year: t.modal.year }}
                      className={cn(
                        "w-full",
                        modalMode === 'view' && "pointer-events-none opacity-80"
                      )}
                    />
                  </div>

                  {/* Week */}
                  <div className="md:col-span-3 space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-tight flex items-center gap-1.5">
                      <Layers size={12} /> {t.modal.week}
                    </label>
                    <div className="relative">
                      <select
                        required
                        value={formData.week || ''}
                        onChange={(e) => setFormData(p => ({ ...p, week: e.target.value }))}
                        disabled={modalMode === 'view'}
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 pr-10 text-sm font-normal text-slate-800 outline-none shadow-sm cursor-pointer focus:ring-2 focus:ring-blue-500/20 appearance-none transition-all"
                      >
                        <option value="W1">{t.modal.week} 1</option>
                        <option value="W2">{t.modal.week} 2</option>
                        <option value="W3">{t.modal.week} 3</option>
                        <option value="W4">{t.modal.week} 4</option>
                        <option value="W5">{t.modal.week} 5</option>
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                    </div>
                  </div>

                  {/* Corporate */}
                  <div className="md:col-span-5">
                    <CorporateSelector
                      label={t.modal.corporate}
                      value={formData.corporateId || ''}
                      onChange={(val) => setFormData(prev => ({ ...prev, corporateId: val, entityId: val }))}
                      placeholder={t.modal.selectCorporate}
                      disabled={isCorpsLoading || modalMode === 'view'}
                      required
                    />
                  </div>
                </div>

                {/* Entity Selection */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                  <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-tight">{t.modal.projectRelated}</span>
                      <span className="text-xs font-bold text-slate-600 uppercase">{formData.entityType === 'project' ? t.modal.yes : t.modal.no}</span>
                    </div>
                    <button
                      type="button"
                      disabled={modalMode === 'view'}
                      onClick={() => {
                        const nextType = formData.entityType === 'project' ? 'corporate' : 'project';
                        setFormData(p => ({
                          ...p,
                          entityType: nextType,
                          entityId: nextType === 'corporate' ? p.corporateId || '' : ''
                        }));
                      }}
                      className={cn(
                        "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none",
                        formData.entityType === 'project' ? "bg-blue-600" : "bg-slate-300",
                        modalMode === 'view' && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      <span
                        className={cn(
                          "inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm cursor-pointer",
                          formData.entityType === 'project' ? "translate-x-6" : "translate-x-1"
                        )}
                      />
                    </button>
                  </div>

                  {formData.entityType === 'project' && (
                    <div className="space-y-1.5">
                      <SearchableSelect
                        label={t.modal.project}
                        options={entityOptions}
                        value={formData.entityId || ''}
                        onChange={(val) => setFormData(p => ({ ...p, entityId: val }))}
                        placeholder={t.modal.selectEntity}
                        disabled={modalMode === 'view' || isProjsLoading}
                        required
                        className="w-full"
                      />
                    </div>
                  )}
                </div>

                {/* Cash Flow Sections */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {/* Operating */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-2 pb-2 border-b-2 border-blue-500">
                      <TrendingUp size={18} className="text-blue-500" />
                      <h4 className="font-bold text-sm text-slate-700 uppercase tracking-tight">{t.modal.operatingActivity}</h4>
                    </div>
                    <FormField label={t.fields.cashIn} value={formData.operatingCashIn || 0} onChange={(v) => setFormData(p => ({ ...p, operatingCashIn: v === "" ? 0 : parseFloat(v) }))} readOnly={modalMode === 'view'} />
                    <FormField label={t.fields.cashOut} value={formData.operatingCashOut || 0} onChange={(v) => setFormData(p => ({ ...p, operatingCashOut: v === "" ? 0 : parseFloat(v) }))} readOnly={modalMode === 'view'} />
                    <div className={cn("px-4 py-2.5 rounded-xl flex flex-col shadow-sm", netOperating >= 0 ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-rose-50 text-rose-700 border border-rose-100")}>
                      <span className="text-[10px] font-black uppercase opacity-70 tracking-wider">Net Operating</span>
                      <span className="text-sm font-black">{formatRupiah(netOperating, false)}</span>
                    </div>
                  </div>

                  {/* Investing */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-2 pb-2 border-b-2 border-amber-500">
                      <ArrowUpCircle size={18} className="text-amber-500" />
                      <h4 className="font-bold text-sm text-slate-700 uppercase tracking-tight">{t.modal.investing}</h4>
                    </div>
                    <FormField label={t.fields.cashIn} value={formData.investingCashIn || 0} onChange={(v) => setFormData(p => ({ ...p, investingCashIn: v === "" ? 0 : parseFloat(v) }))} readOnly={modalMode === 'view'} />
                    <FormField label={t.fields.cashOut} value={formData.investingCashOut || 0} onChange={(v) => setFormData(p => ({ ...p, investingCashOut: v === "" ? 0 : parseFloat(v) }))} readOnly={modalMode === 'view'} />
                    <div className={cn("px-4 py-2.5 rounded-xl flex flex-col shadow-sm", netInvesting >= 0 ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-rose-50 text-rose-700 border border-rose-100")}>
                      <span className="text-[10px] font-black uppercase opacity-70 tracking-wider">Net Investing</span>
                      <span className="text-sm font-black">{formatRupiah(netInvesting, false)}</span>
                    </div>
                  </div>

                  {/* Financing */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-2 pb-2 border-b-2 border-indigo-500">
                      <Landmark size={18} className="text-indigo-500" />
                      <h4 className="font-bold text-sm text-slate-700 uppercase tracking-tight">{t.modal.financing}</h4>
                    </div>
                    <FormField label={t.fields.cashIn} value={formData.financingCashIn || 0} onChange={(v) => setFormData(p => ({ ...p, financingCashIn: v === "" ? 0 : parseFloat(v) }))} readOnly={modalMode === 'view'} />
                    <FormField label={t.fields.cashOut} value={formData.financingCashOut || 0} onChange={(v) => setFormData(p => ({ ...p, financingCashOut: v === "" ? 0 : parseFloat(v) }))} readOnly={modalMode === 'view'} />
                    <div className={cn("px-4 py-2.5 rounded-xl flex flex-col shadow-sm", netFinancing >= 0 ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-rose-50 text-rose-700 border border-rose-100")}>
                      <span className="text-[10px] font-black uppercase opacity-70 tracking-wider">Net Financing</span>
                      <span className="text-sm font-black">{formatRupiah(netFinancing, false)}</span>
                    </div>
                  </div>
                </div>

                {/* Overall Summary */}
                <div className="pt-6 border-t border-slate-100">
                  <div className={cn(
                    "px-6 py-4 rounded-2xl shadow-xl flex items-center justify-between transition-all hover:scale-[1.01]",
                    netCashFlow >= 0 ? "bg-emerald-600 text-white shadow-emerald-100" : "bg-rose-600 text-white shadow-rose-100"
                  )}>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black uppercase tracking-widest opacity-80">{t.modal.netCashFlow}</span>
                      <span className="text-2xl font-black">{formatRupiah(netCashFlow, false)}</span>
                    </div>
                    {netCashFlow >= 0 ? <ArrowUpCircle size={32} /> : <ArrowDownCircle size={32} />}
                  </div>
                </div>

                {/* Notes */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-tight">{t.modal.notes}</label>
                  <textarea
                    value={formData.notes || ''}
                    onChange={(e) => setFormData(p => ({ ...p, notes: e.target.value }))}
                    readOnly={modalMode === 'view'}
                    placeholder={t.modal.notesPlaceholder}
                    rows={3}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all resize-none shadow-sm"
                  />
                </div>
              </div>

              <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSaving}
                  className="px-8 py-3.5 text-xs font-black text-slate-400 uppercase tracking-widest bg-slate-100 rounded-2xl hover:bg-slate-200 transition-all active:scale-95 cursor-pointer shadow-sm"
                >
                  {common.cancel}
                </button>
                {modalMode !== 'view' && (
                  <button
                    type="submit"
                    disabled={isSaving || (modalMode === 'create' ? approvalCreate.isChecking : approvalEdit.isChecking)}
                    className="px-10 py-3.5 text-xs font-black text-white uppercase tracking-widest bg-blue-600 rounded-2xl hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all active:scale-95 flex items-center justify-center gap-2 min-w-[200px] cursor-pointer disabled:cursor-not-allowed"
                  >
                    {isSaving ? <RefreshCw className="animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    {isSaving ? common.saving : common.save}
                  </button>
                )}
              </div>
            </form>
          </Modal>
        )}
      </AnimatePresence>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent className="rounded-3xl border-none shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-black text-slate-800">{t.alerts.deleteTitle}</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-500 font-medium">
              {t.alerts.deleteDesc}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="rounded-xl border-slate-200 font-bold hover:bg-slate-50">
              {common.cancel}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
              className="rounded-xl bg-rose-600 hover:bg-rose-700 font-bold shadow-lg shadow-rose-100"
              disabled={isDeleting}
            >
              {isDeleting ? <RefreshCw size={16} className="animate-spin mr-2" /> : <Trash2 size={16} className="mr-2" />}
              {isDeleting ? common.deleting : t.alerts.deleteConfirm}
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
            onRefresh={fetchData}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

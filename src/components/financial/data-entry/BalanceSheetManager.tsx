import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus, Search, Filter, Eye, Edit2, Trash2,
  ChevronLeft, ChevronRight, Scale, X, AlertCircle, CheckCircle,
  FileSpreadsheet, ArrowLeftRight, TrendingUp, Landmark, Calculator, CheckCircle2,
  RefreshCw, FilterX, Calendar, ChevronDown,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiFetch } from '../../../services/financial/apiFetch';
import { formatRupiah, formatPeriod } from '../../../utils/format';
import { cn } from '../../../utils/cn';
import { useAuth } from '../../../hooks/financial/useAuth';
import { useCorporates } from '../../../hooks/financial/useCorporates';
import { toast } from 'sonner';
import { MonthPicker } from '../shared/MonthPicker';
import { MonthRangePicker } from '../shared/MonthRangePicker';
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
import { balanceSheetI18n } from '../../../i18n/balance-sheet';
import { commonsI18n } from '../../../i18n/commons';
import { z } from 'zod';

// --- Types ---
interface BalanceSheet {
  id: string;
  corporateId: string;
  corporateName?: string;
  period: string;
  cashAndBank: number;
  accountsReceivable: number;
  workInProgress: number;
  inventory: number;
  prepaidExpenses: number;
  land: number;
  building: number;
  equipment: number;
  otherFixedAssets: number;
  accountsPayable: number;
  bankLoanCurrent: number;
  otherCurrentLiabilities: number;
  bankLoanLongTerm: number;
  otherLongTermLiabilities: number;
  shareholderLoan: number;
  capital: number;
  earningsAfterTax: number;
  retainedEarnings: number;
  dividends: number;
  notes?: string;
  createdAt: string;
  createdBy: string;
}

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
            <div className="p-1.5 bg-indigo-100 text-indigo-600 rounded-lg">
              <Scale size={18} />
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
      <div className="relative group">
        <input
          type="text"
          inputMode="numeric"
          value={displayValue}
          onChange={handleChange}
          placeholder={placeholder}
          readOnly={readOnly}
          className={cn(
            "w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm bg-slate-50/30 font-bold",
            readOnly && "bg-slate-100 cursor-not-allowed font-medium text-slate-600 border-none shadow-none"
          )}
        />
      </div>
    </div>
  );
};

const SectionHeader: React.FC<{ title: string; icon: React.ReactNode; color: string }> = ({ title, icon, color }) => (
  <div className={cn("flex items-center gap-2 mb-4 pb-2 border-b-2", color)}>
    <div className="p-1.5 rounded-lg bg-white shadow-sm border border-slate-100">
      {icon}
    </div>
    <h4 className="font-bold text-sm text-slate-700 tracking-tight uppercase">{title}</h4>
  </div>
);

const SummaryCard: React.FC<{ label: string; value: number; color: 'indigo' | 'emerald' | 'amber' | 'rose'; fullWidth?: boolean }> = ({ label, value, color, fullWidth = false }) => {
  const variants = {
    indigo: 'bg-indigo-50 border-indigo-100 text-indigo-700',
    emerald: 'bg-emerald-50 border-emerald-100 text-emerald-700',
    amber: 'bg-amber-50 border-amber-100 text-amber-700',
    rose: 'bg-rose-50 border-rose-100 text-rose-700',
  };

  return (
    <div className={cn(
      "px-4 py-3 rounded-xl border flex flex-col gap-1 shadow-sm transition-all",
      variants[color],
      fullWidth ? "col-span-2 w-full" : ""
    )}>
      <span className="text-[10px] font-bold uppercase tracking-wider opacity-70">{label}</span>
      <span className="text-sm font-black">{formatRupiah(value, false)}</span>
    </div>
  );
};

// --- Main Component ---

export const BalanceSheetManager: React.FC = () => {
  const { user, hasPermission, language, hasFullCorporateAccess, subsidiaryIds } = useAuth();
  const t = balanceSheetI18n[language];
  const common = commonsI18n[language];

  // Validation Schema
  const balanceSheetSchema = z.object({
    corporateId: z.string().min(1, t.validation.corporateRequired),
    period: z.string().regex(/^\d{4}-\d{2}$/, t.validation.periodInvalid),
    cashAndBank: z.number().min(0, t.validation.amountMin),
    accountsReceivable: z.number().min(0, t.validation.amountMin),
    workInProgress: z.number().min(0, t.validation.amountMin),
    inventory: z.number().min(0, t.validation.amountMin),
    prepaidExpenses: z.number().min(0, t.validation.amountMin),
    land: z.number().min(0, t.validation.amountMin),
    building: z.number().min(0, t.validation.amountMin),
    equipment: z.number().min(0, t.validation.amountMin),
    otherFixedAssets: z.number().min(0, t.validation.amountMin),
    accountsPayable: z.number().min(0, t.validation.amountMin),
    bankLoanCurrent: z.number().min(0, t.validation.amountMin),
    otherCurrentLiabilities: z.number().min(0, t.validation.amountMin),
    bankLoanLongTerm: z.number().min(0, t.validation.amountMin),
    otherLongTermLiabilities: z.number().min(0, t.validation.amountMin),
    shareholderLoan: z.number().min(0, t.validation.amountMin),
    capital: z.number().min(0, t.validation.amountMin),
    earningsAfterTax: z.number().min(0, t.validation.amountMin),
    retainedEarnings: z.number().min(0, t.validation.amountMin),
    dividends: z.number().min(0, t.validation.amountMin),
    notes: z.string().optional()
  }).refine((data) => {
    const totalAssets = (data.cashAndBank || 0) + (data.accountsReceivable || 0) + (data.workInProgress || 0) + (data.inventory || 0) + (data.prepaidExpenses || 0) + (data.land || 0) + (data.building || 0) + (data.equipment || 0) + (data.otherFixedAssets || 0);
    const totalLiabilities = (data.accountsPayable || 0) + (data.bankLoanCurrent || 0) + (data.otherCurrentLiabilities || 0) + (data.bankLoanLongTerm || 0) + (data.otherLongTermLiabilities || 0) + (data.shareholderLoan || 0);
    const totalEquity = (data.capital || 0) + (data.earningsAfterTax || 0) + (data.retainedEarnings || 0) - (data.dividends || 0);
    const diff = Math.abs(totalAssets - (totalLiabilities + totalEquity));
    return diff < 1; // Tolerance for floating point
  }, {
    message: t.validation.unbalancedError,
    path: ['totalAssets']
  });

  const canWrite = hasPermission('cfd.balance_sheets.write');
  const canDelete = hasPermission('cfd.balance_sheets.delete');

  const [data, setData] = useState<BalanceSheet[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const { corporates } = useCorporates();

  // Filters
  const [filterPeriodStart, setFilterPeriodStart] = useState('');
  const [filterPeriodEnd, setFilterPeriodEnd] = useState('');
  const [filterCorporate, setFilterCorporate] = useState('');

  const [appliedFilters, setAppliedFilters] = useState({
    periodStart: '',
    periodEnd: '',
    corporate: ''
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Form State
  const [formData, setFormData] = useState<Partial<BalanceSheet>>({});

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const queryParams = new URLSearchParams();
      if (appliedFilters.periodStart) queryParams.set('periodStart', appliedFilters.periodStart);
      if (appliedFilters.periodEnd) queryParams.set('periodEnd', appliedFilters.periodEnd);
      if (appliedFilters.corporate) queryParams.set('corporateId', appliedFilters.corporate);
      queryParams.set('page', currentPage.toString());
      queryParams.set('pageSize', pageSize.toString());

      const res = await apiFetch(`/api/financial-statements/balance-sheet?${queryParams.toString()}`);
      if (res.ok) {
        const d = await res.json();
        setData(d.records || []);
        setTotalCount(d.totalCount || 0);
      } else {
        const errData = await res.json();
        throw new Error(errData.error?.message || t.alerts.errorFetch);
      }
    } catch (err: any) {
      setError(err.message || common.errorLoadTable);
      toast.error(err.message || common.errorLoadTable);
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
      corporate: filterCorporate
    });
    setCurrentPage(1);
  };

  const handleClearFilter = () => {
    setFilterPeriodStart('');
    setFilterPeriodEnd('');
    setFilterCorporate('');
    setAppliedFilters({
      periodStart: '',
      periodEnd: '',
      corporate: ''
    });
    setCurrentPage(1);
  };

  const handleDelete = async (id: string) => {
    setIsDeleting(true);
    try {
      const res = await apiFetch(`/api/financial-statements/balance-sheet/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success(t.alerts.successDelete);
        fetchData();
      } else {
        const errData = await res.json();
        throw new Error(errData.error?.message || t.alerts.errorDelete);
      }
    } catch (err: any) {
      toast.error(err.message || t.alerts.errorNetwork);
    } finally {
      setIsDeleting(false);
      setDeleteConfirmId(null);
    }
  };

  const openModal = (mode: 'create' | 'edit' | 'view', item?: BalanceSheet) => {
    setModalMode(mode);
    if (item) {
      setFormData({
        ...item,
        cashAndBank: Number(item.cashAndBank),
        accountsReceivable: Number(item.accountsReceivable),
        workInProgress: Number(item.workInProgress),
        inventory: Number(item.inventory),
        prepaidExpenses: Number(item.prepaidExpenses),
        land: Number(item.land),
        building: Number(item.building),
        equipment: Number(item.equipment),
        otherFixedAssets: Number(item.otherFixedAssets),
        accountsPayable: Number(item.accountsPayable),
        bankLoanCurrent: Number(item.bankLoanCurrent),
        otherCurrentLiabilities: Number(item.otherCurrentLiabilities),
        bankLoanLongTerm: Number(item.bankLoanLongTerm),
        otherLongTermLiabilities: Number(item.otherLongTermLiabilities),
        shareholderLoan: Number(item.shareholderLoan),
        capital: Number(item.capital),
        earningsAfterTax: Number(item.earningsAfterTax),
        retainedEarnings: Number(item.retainedEarnings),
        dividends: Number(item.dividends),
      });
    } else {
      setFormData({
        period: new Date().toISOString().slice(0, 7),
        corporateId: hasFullCorporateAccess ? '' : (subsidiaryIds?.[0] || ''),
        cashAndBank: 0, accountsReceivable: 0, workInProgress: 0, inventory: 0, prepaidExpenses: 0,
        land: 0, building: 0, equipment: 0, otherFixedAssets: 0,
        accountsPayable: 0, bankLoanCurrent: 0, otherCurrentLiabilities: 0,
        bankLoanLongTerm: 0, otherLongTermLiabilities: 0, shareholderLoan: 0,
        capital: 0, earningsAfterTax: 0, retainedEarnings: 0, dividends: 0,
        notes: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;

    // Declarative validation with Zod
    const validation = balanceSheetSchema.safeParse(formData);
    if (!validation.success) {
      validation.error.issues.forEach(err => toast.error(err.message));
      return;
    }

    setIsSaving(true);
    try {
      const url = modalMode === 'edit' ? `/api/financial-statements/balance-sheet/${formData.id}` : '/api/financial-statements/balance-sheet';
      const method = modalMode === 'edit' ? 'PUT' : 'POST';

      const res = await apiFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validation.data),
      });

      if (res.ok) {
        toast.success(modalMode === 'create' ? t.alerts.successSave : t.alerts.successUpdate);
        setIsModalOpen(false);
        fetchData();
      } else {
        const errData = await res.json();
        throw new Error(errData.error?.message || t.alerts.errorSave);
      }
    } catch (err: any) {
      toast.error(err.message || t.alerts.errorNetwork);
    } finally {
      setIsSaving(false);
    }
  };

  // --- Calculations ---
  const n = (v: any) => parseFloat(String(v)) || 0;

  const totalActiva = n(formData.cashAndBank) + n(formData.accountsReceivable) + n(formData.workInProgress) + n(formData.inventory) + n(formData.prepaidExpenses);
  const totalFixedAssets = n(formData.land) + n(formData.building) + n(formData.equipment) + n(formData.otherFixedAssets);
  const totalAssets = totalActiva + totalFixedAssets;

  const totalCurrentLiabilities = n(formData.accountsPayable) + n(formData.bankLoanCurrent) + n(formData.otherCurrentLiabilities);
  const totalNonCurrentLiabilities = n(formData.bankLoanLongTerm) + n(formData.otherLongTermLiabilities) + n(formData.shareholderLoan);
  const totalLiabilities = totalCurrentLiabilities + totalNonCurrentLiabilities;

  const totalEquity = n(formData.capital) + n(formData.earningsAfterTax) + n(formData.retainedEarnings) - n(formData.dividends);
  const totalLiabilitiesEquity = totalLiabilities + totalEquity;

  const isBalanced = totalAssets > 0 && Math.abs(totalAssets - totalLiabilitiesEquity) < 1;

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-full">

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-100">
              <Scale size={24} />
            </div>
            {t.title}
          </h1>
          <p className="text-sm text-slate-500 mt-1 flex items-center gap-1.5 ml-1 font-bold">
            <Info size={14} className="text-indigo-400" />
            {t.subtitle}
          </p>
        </div>

        {canWrite && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => openModal('create')}
              className="px-4 py-2 text-sm font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-lg shadow-indigo-100 active:scale-95 cursor-pointer"
            >
              <Plus size={18} />
              {t.inputNew}
            </button>
          </div>
        )}
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200/60 flex flex-wrap items-center gap-4">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          {(hasFullCorporateAccess || user?.role === 'owner' || subsidiaryIds.length > 1) && (
            <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl flex-1 min-w-[200px]">
              <Landmark size={16} className="text-slate-500" />
              <select
                value={filterCorporate}
                onChange={(e) => setFilterCorporate(e.target.value)}
                className="bg-transparent border-none text-sm text-slate-800 focus:outline-none cursor-pointer w-full font-bold"
              >
                <option value="">{t.modal.selectCorporate}</option>
                {corporates
                  .filter(corp => (hasFullCorporateAccess || user?.role === 'owner') || (subsidiaryIds.length > 0 && subsidiaryIds.includes(corp.id)))
                  .map(corp => (
                    <option key={corp.id} value={corp.id}>{corp.name}</option>
                  ))}
              </select>
            </div>
          )}

          <div className="flex items-center gap-2 flex-1 min-w-[280px]">
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
              className="flex items-center gap-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-4 py-2 rounded-xl text-xs font-black transition-all active:scale-95 border border-indigo-200/50 cursor-pointer"
            >
              <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
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
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/60 border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.tableHead.period}</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.tableHead.corporate}</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">{t.tableHead.totalAssets}</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">{t.tableHead.totalLiabilities}</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">{t.tableHead.totalEquity}</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">{t.tableHead.status}</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">{t.tableHead.actions}</th>
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
                      <td className="px-6 py-4"><div className="h-6 bg-slate-100 rounded-lg w-40" /></td>
                      <td className="px-6 py-4"><div className="h-6 bg-slate-100 rounded-lg w-24 ml-auto" /></td>
                      <td className="px-6 py-4"><div className="h-6 bg-slate-100 rounded-lg w-24 ml-auto" /></td>
                      <td className="px-6 py-4"><div className="h-6 bg-slate-100 rounded-lg w-24 ml-auto" /></td>
                      <td className="px-6 py-4"><div className="h-6 bg-slate-100 rounded-lg w-20 mx-auto" /></td>
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
                          <Scale size={48} />
                        </div>
                        <p className="text-slate-800 font-bold text-lg">{t.status.empty}</p>
                        <p className="text-slate-500 text-sm mt-1">{t.status.emptyDesc}</p>
                      </div>
                    </td>
                  </motion.tr>
                ) : (
                  data.map((item, idx) => {
                    const tAssets = n(item.cashAndBank) + n(item.accountsReceivable) + n(item.workInProgress) + n(item.inventory) + n(item.prepaidExpenses) + n(item.land) + n(item.building) + n(item.equipment) + n(item.otherFixedAssets);
                    const tLiab = n(item.accountsPayable) + n(item.bankLoanCurrent) + n(item.otherCurrentLiabilities) + n(item.bankLoanLongTerm) + n(item.otherLongTermLiabilities) + n(item.shareholderLoan);
                    const tEq = n(item.capital) + n(item.earningsAfterTax) + n(item.retainedEarnings) - n(item.dividends);
                    const balanced = Math.abs(tAssets - (tLiab + tEq)) < 1;

                    return (
                      <motion.tr
                        key={item.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ delay: idx * 0.03 }}
                        className="hover:bg-slate-50/50 transition-colors group"
                      >
                        <td className="px-6 py-4">
                          <span className="text-sm font-black text-slate-700">{formatPeriod(item.period, language)}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-slate-700">{item.corporateName || 'N/A'}</span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">ID: {item.corporateId.slice(0, 8)}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="text-sm font-bold text-slate-700">{formatRupiah(tAssets, true)}</span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="text-sm font-bold text-rose-600">{formatRupiah(tLiab, true)}</span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="text-sm font-bold text-emerald-600">{formatRupiah(tEq, true)}</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={cn(
                            "px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm",
                            balanced ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700 border border-rose-200"
                          )}>
                            {balanced ? t.status.balanced : t.status.unbalanced}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => openModal('view', item)}
                              className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all cursor-pointer"
                              title={t.actions.view}
                            >
                              <Eye size={16} />
                            </button>
                            {canWrite && (
                              <button
                                onClick={() => openModal('edit', item)}
                                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all cursor-pointer"
                                title={t.actions.edit}
                              >
                                <Edit2 size={16} />
                              </button>
                            )}
                            {canDelete && (
                              <button
                                onClick={() => {
                                  setDeleteConfirmId(item.id);
                                }}
                                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                                title={t.actions.delete}
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
                {t.pagination.showing} {Math.min(totalCount, (currentPage - 1) * pageSize + 1)} - {Math.min(totalCount, currentPage * pageSize)} {t.pagination.of} {totalCount} {t.pagination.entries}
              </span>

              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  {t.pagination.rowsPerPage}
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
            size="2xl"
          >
            <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
              <form id="balanceSheetForm" onSubmit={handleSave} onInvalid={() => toast.error(t.alerts.errorRequired, { id: 'errorRequired' })} className="space-y-8">
                {/* Header Info */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 items-end">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-tight flex items-center gap-1.5">
                      <FileSpreadsheet size={12} /> {t.modal.period}
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

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-tight flex items-center gap-1.5">
                      <Landmark size={12} /> {t.modal.corporate}
                    </label>
                    {modalMode === 'view' ? (
                      <div className="w-full bg-slate-100 border-none rounded-xl px-4 py-2 text-sm font-bold text-slate-600">
                        {formData.corporateName || 'N/A'}
                      </div>
                    ) : (
                      <div className="relative">
                        <select
                          required
                          value={formData.corporateId}
                          onChange={(e) => setFormData(prev => ({ ...prev, corporateId: e.target.value }))}
                          className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 pr-10 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500/20 outline-none appearance-none transition-all shadow-sm cursor-pointer"
                        >
                          <option value="">{t.modal.selectCorporate}</option>
                          {corporates
                            .filter(corp => (hasFullCorporateAccess || user?.role === 'owner') || (subsidiaryIds.length > 0 && subsidiaryIds.includes(corp.id)))
                            .map(corp => (
                              <option key={corp.id} value={corp.id}>{corp.name}</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col justify-end">
                    <div className={cn(
                      "px-4 py-2.5 rounded-xl border flex items-center justify-between shadow-sm transition-all",
                      isBalanced ? "bg-emerald-50 border-emerald-100 text-emerald-700" : totalAssets > 0 ? "bg-rose-50 border-rose-100 text-rose-700" : "bg-slate-100 border-slate-200 text-slate-400"
                    )}>
                      <div className="flex flex-col">
                        <span className="text-[9px] font-black uppercase tracking-wider opacity-70">{t.tableHead.status}</span>
                        <span className="text-[10px] font-black uppercase">{isBalanced ? `✓ ${t.status.balanced}` : totalAssets > 0 ? `⚠ ${t.modal.diff}: ${formatRupiah(Math.abs(totalAssets - totalLiabilitiesEquity), false)}` : '...'}</span>
                      </div>
                      {isBalanced ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                    </div>
                  </div>
                </div>

                {/* Main Form Sections */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">

                  {/* ── LEFT: ASSETS ── */}
                  <div className="space-y-8">
                    {/* Current Assets */}
                    <div>
                      <SectionHeader title={t.modal.activa} icon={<ArrowLeftRight size={16} className="text-blue-500" />} color="border-blue-500" />
                      <div className="grid grid-cols-2 gap-4">
                        <FormField label={t.fields.cashAndBank} value={formData.cashAndBank || 0} onChange={(v) => setFormData(p => ({ ...p, cashAndBank: v === "" ? 0 : parseFloat(v) }))} readOnly={modalMode === 'view'} />
                        <FormField label={t.fields.accountsReceivable} value={formData.accountsReceivable || 0} onChange={(v) => setFormData(p => ({ ...p, accountsReceivable: v === "" ? 0 : parseFloat(v) }))} readOnly={modalMode === 'view'} />
                        <FormField label={t.fields.workInProgress} value={formData.workInProgress || 0} onChange={(v) => setFormData(p => ({ ...p, workInProgress: v === "" ? 0 : parseFloat(v) }))} readOnly={modalMode === 'view'} />
                        <FormField label={t.fields.inventory} value={formData.inventory || 0} onChange={(v) => setFormData(p => ({ ...p, inventory: v === "" ? 0 : parseFloat(v) }))} readOnly={modalMode === 'view'} />
                        <FormField label={t.fields.prepaidExpenses} value={formData.prepaidExpenses || 0} onChange={(v) => setFormData(p => ({ ...p, prepaidExpenses: v === "" ? 0 : parseFloat(v) }))} readOnly={modalMode === 'view'} />
                        <div className="col-span-2">
                          <SummaryCard label={t.modal.totalActiva} value={totalActiva} color="indigo" fullWidth />
                        </div>
                      </div>
                    </div>

                    {/* Fixed Assets */}
                    <div>
                      <SectionHeader title={t.modal.fixedAsset} icon={<Landmark size={16} className="text-indigo-500" />} color="border-indigo-500" />
                      <div className="grid grid-cols-2 gap-4">
                        <FormField label={t.fields.land} value={formData.land || 0} onChange={(v) => setFormData(p => ({ ...p, land: v === "" ? 0 : parseFloat(v) }))} readOnly={modalMode === 'view'} />
                        <FormField label={t.fields.building} value={formData.building || 0} onChange={(v) => setFormData(p => ({ ...p, building: v === "" ? 0 : parseFloat(v) }))} readOnly={modalMode === 'view'} />
                        <FormField label={t.fields.equipment} value={formData.equipment || 0} onChange={(v) => setFormData(p => ({ ...p, equipment: v === "" ? 0 : parseFloat(v) }))} readOnly={modalMode === 'view'} />
                        <FormField label={t.fields.otherFixedAssets} value={formData.otherFixedAssets || 0} onChange={(v) => setFormData(p => ({ ...p, otherFixedAssets: v === "" ? 0 : parseFloat(v) }))} readOnly={modalMode === 'view'} />
                        <div className="col-span-2">
                          <SummaryCard label={t.modal.totalFixedAsset} value={totalFixedAssets} color="indigo" fullWidth />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ── RIGHT: LIABILITIES & EQUITY ── */}
                  <div className="space-y-8">
                    {/* Current Liabilities */}
                    <div>
                      <SectionHeader title={t.modal.shortTermLiabilities} icon={<TrendingUp size={16} className="text-amber-500" />} color="border-amber-500" />
                      <div className="grid grid-cols-2 gap-4">
                        <FormField label={t.fields.accountsPayable} value={formData.accountsPayable || 0} onChange={(v) => setFormData(p => ({ ...p, accountsPayable: v === "" ? 0 : parseFloat(v) }))} readOnly={modalMode === 'view'} />
                        <FormField label={t.fields.bankLoanCurrent} value={formData.bankLoanCurrent || 0} onChange={(v) => setFormData(p => ({ ...p, bankLoanCurrent: v === "" ? 0 : parseFloat(v) }))} readOnly={modalMode === 'view'} />
                        <FormField label={t.fields.otherCurrentLiabilities} value={formData.otherCurrentLiabilities || 0} onChange={(v) => setFormData(p => ({ ...p, otherCurrentLiabilities: v === "" ? 0 : parseFloat(v) }))} readOnly={modalMode === 'view'} />
                        <div className="col-span-2">
                          <SummaryCard label={t.modal.totalShortTermLiabilities} value={totalCurrentLiabilities} color="amber" fullWidth />
                        </div>
                      </div>
                    </div>

                    {/* Non-Current Liabilities */}
                    <div>
                      <SectionHeader title={t.modal.longTermLiabilities} icon={<Landmark size={16} className="text-orange-500" />} color="border-orange-500" />
                      <div className="grid grid-cols-2 gap-4">
                        <FormField label={t.fields.bankLoanLongTerm} value={formData.bankLoanLongTerm || 0} onChange={(v) => setFormData(p => ({ ...p, bankLoanLongTerm: v === "" ? 0 : parseFloat(v) }))} readOnly={modalMode === 'view'} />
                        <FormField label={t.fields.otherLongTermLiabilities} value={formData.otherLongTermLiabilities || 0} onChange={(v) => setFormData(p => ({ ...p, otherLongTermLiabilities: v === "" ? 0 : parseFloat(v) }))} readOnly={modalMode === 'view'} />
                        <FormField label={t.fields.shareholderLoan} value={formData.shareholderLoan || 0} onChange={(v) => setFormData(p => ({ ...p, shareholderLoan: v === "" ? 0 : parseFloat(v) }))} readOnly={modalMode === 'view'} />
                        <div className="col-span-2">
                          <SummaryCard label={t.modal.totalLongTermLiabilities} value={totalNonCurrentLiabilities} color="amber" fullWidth />
                        </div>
                      </div>
                    </div>

                    {/* Equity */}
                    <div>
                      <SectionHeader title={t.modal.equity} icon={<Calculator size={16} className="text-emerald-500" />} color="border-emerald-500" />
                      <div className="grid grid-cols-2 gap-4">
                        <FormField label={t.fields.capital} value={formData.capital || 0} onChange={(v) => setFormData(p => ({ ...p, capital: v === "" ? 0 : parseFloat(v) }))} readOnly={modalMode === 'view'} />
                        <FormField label={t.fields.earningsAfterTax} value={formData.earningsAfterTax || 0} onChange={(v) => setFormData(p => ({ ...p, earningsAfterTax: v === "" ? 0 : parseFloat(v) }))} readOnly={modalMode === 'view'} />
                        <FormField label={t.fields.retainedEarnings} value={formData.retainedEarnings || 0} onChange={(v) => setFormData(p => ({ ...p, retainedEarnings: v === "" ? 0 : parseFloat(v) }))} readOnly={modalMode === 'view'} />
                        <FormField label={t.fields.dividends} value={formData.dividends || 0} onChange={(v) => setFormData(p => ({ ...p, dividends: v === "" ? 0 : parseFloat(v) }))} readOnly={modalMode === 'view'} />
                        <div className="col-span-2">
                          <SummaryCard label={t.modal.totalEquity} value={totalEquity} color="emerald" fullWidth />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Totals */}
                <div className="pt-8 border-t border-slate-100">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/50 p-6 rounded-3xl border border-slate-100 shadow-inner">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">{t.modal.totalAssets}</span>
                        <span className="text-2xl font-black text-slate-800">{formatRupiah(totalAssets, false)}</span>
                      </div>
                      <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                        <motion.div 
                          className="h-full bg-indigo-500" 
                          initial={{ width: 0 }}
                          animate={{ width: '100%' }}
                        />
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">{t.modal.totalLiabEquity}</span>
                        <span className="text-2xl font-black text-slate-800">{formatRupiah(totalLiabilitiesEquity, false)}</span>
                      </div>
                      <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                        <motion.div 
                          className={cn("h-full transition-all", isBalanced ? "bg-emerald-500" : "bg-rose-500")}
                          initial={{ width: 0 }}
                          animate={{ width: totalAssets > 0 ? `${(totalLiabilitiesEquity / totalAssets) * 100}%` : '0%' }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-tight ml-1">{t.modal.notes}</label>
                  <textarea
                    value={formData.notes || ''}
                    onChange={(e) => setFormData(p => ({ ...p, notes: e.target.value }))}
                    readOnly={modalMode === 'view'}
                    placeholder={t.modal.notesPlaceholder}
                    rows={3}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all resize-none shadow-sm"
                  />
                </div>
              </form>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-2.5 bg-white border border-slate-200 text-sm font-bold text-slate-600 rounded-xl hover:bg-slate-50 transition-all active:scale-95 cursor-pointer shadow-sm"
              >
                {modalMode === 'view' ? t.modal.cancel : t.modal.cancel}
              </button>
              {modalMode !== 'view' && (
                <button
                  type="submit"
                  form="balanceSheetForm"
                  disabled={isSaving}
                  className="px-8 py-2.5 bg-indigo-600 text-sm font-bold text-white rounded-xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 flex items-center gap-2 min-w-[140px] justify-center cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? <RefreshCw size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
                  {isSaving ? t.status.submitting : t.modal.submit}
                </button>
              )}
            </div>
          </Modal>
        )}
      </AnimatePresence>

      {/* --- Delete Confirmation --- */}
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
              {t.alerts.deleteCancel}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
              className="rounded-xl bg-rose-600 hover:bg-rose-700 font-bold shadow-lg shadow-rose-100"
              disabled={isDeleting}
            >
              {isDeleting ? <RefreshCw size={16} className="animate-spin mr-2" /> : <Trash2 size={16} className="mr-2" />}
              {isDeleting ? t.alerts.deleteDeleting : t.alerts.deleteConfirm}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

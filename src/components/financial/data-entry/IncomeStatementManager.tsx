import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus, Search, Filter, Eye, Edit2, Trash2,
  ChevronLeft, ChevronRight, X, AlertCircle,
  FileBarChart, TrendingUp, Calculator, PieChart,
  ArrowDownCircle, ArrowUpCircle, Banknote, CheckCircle2,
  RefreshCw, FilterX, Landmark, ChevronDown,
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
import { SearchableSelect } from '../shared/SearchableSelect';
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
import { incomeStatementI18n } from '../../../i18n/income-statement';
import { commonsI18n } from '../../../i18n/commons';
import { z } from 'zod';

// --- Types ---
interface IncomeStatement {
  id: string;
  corporateId: string;
  corporateName?: string;
  period: string;
  revenue: number;
  cogs: number;
  operatingExpenses: number;
  interestExpense: number;
  taxExpense: number;
  notes?: string;
  createdAt: string;
  createdBy: string;
}

// --- Validation Schema ---

// --- Components ---

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
            <div className="p-1.5 bg-emerald-100 text-emerald-600 rounded-lg">
              <FileBarChart size={18} />
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
          "w-full px-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm bg-slate-50/30 font-bold",
          readOnly && "bg-slate-100 cursor-not-allowed font-medium text-slate-600 border-none shadow-none"
        )}
      />
    </div>
  );
};

const SummaryCard: React.FC<{ label: string; value: number; color: 'emerald' | 'blue' | 'amber' | 'indigo' }> = ({ label, value, color }) => {
  const variants = {
    emerald: 'bg-emerald-600 text-white shadow-emerald-100',
    blue: 'bg-blue-600 text-white shadow-blue-100',
    amber: 'bg-amber-500 text-white shadow-amber-100',
    indigo: 'bg-indigo-600 text-white shadow-indigo-100',
  };

  return (
    <div className={cn("px-4 py-2.5 rounded-xl shadow-md flex flex-col justify-center transition-all hover:scale-[1.02] min-h-[62px]", variants[color])}>
      <span className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-0.5">{label}</span>
      <span className="text-base font-black">{formatRupiah(value, false)}</span>
    </div>
  );
};

// --- Main Component ---

export const IncomeStatementManager: React.FC = () => {
  const { user, hasPermission, language, hasFullCorporateAccess, subsidiaryIds } = useAuth();
  const t = incomeStatementI18n[language];
  const common = commonsI18n[language];

  // Validation Schema
  const incomeStatementSchema = z.object({
    corporateId: z.string().min(1, t.validation.corporateRequired),
    period: z.string().regex(/^\d{4}-\d{2}$/, t.validation.periodInvalid),
    revenue: z.number().min(0, t.validation.amountMin),
    cogs: z.number().min(0, t.validation.amountMin),
    operatingExpenses: z.number().min(0, t.validation.amountMin),
    interestExpense: z.number().min(0, t.validation.amountMin),
    taxExpense: z.number().min(0, t.validation.amountMin),
    notes: z.string().optional()
  });

  const canWrite = hasPermission('cfd.income_statements.write');
  const canDelete = hasPermission('cfd.income_statements.delete');

  const [data, setData] = useState<IncomeStatement[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const { options: corporateOptions, isLoading: isCorpsLoading, corporates } = useCorporates();

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
  const [formData, setFormData] = useState<Partial<IncomeStatement>>({});

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

      const res = await apiFetch(`/api/financial-statements/income-statement?${queryParams.toString()}`);
      if (res.ok) {
        const d = await res.json();
        setData(d.records || []);
        setTotalCount(d.totalCount || 0);
      } else {
        const errData = await res.json();
        throw new Error(errData.error?.message || common.errorLoadTable);
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
      const res = await apiFetch(`/api/financial-statements/income-statement/${id}`, { method: 'DELETE' });
    } catch (err: any) {
      toast.error(err.message || common.errorNetwork);
    } finally {
      setIsDeleting(false);
      setDeleteConfirmId(null);
    }
  };

  const openModal = (mode: 'create' | 'edit' | 'view', item?: IncomeStatement) => {
    setModalMode(mode);
    if (item) {
      setFormData({
        ...item,
        revenue: Number(item.revenue),
        cogs: Number(item.cogs),
        operatingExpenses: Number(item.operatingExpenses),
        interestExpense: Number(item.interestExpense),
        taxExpense: Number(item.taxExpense),
      });
    } else {
      setFormData({
        period: new Date().toISOString().slice(0, 7),
        corporateId: hasFullCorporateAccess ? '' : (subsidiaryIds?.[0] || ''),
        revenue: 0, cogs: 0, operatingExpenses: 0, interestExpense: 0, taxExpense: 0,
        notes: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;

    // Declarative validation with Zod
    const validation = incomeStatementSchema.safeParse(formData);
    if (!validation.success) {
      validation.error.issues.forEach(err => toast.error(err.message));
      return;
    }

    setIsSaving(true);
    try {
      const url = modalMode === 'edit' ? `/api/financial-statements/income-statement/${formData.id}` : '/api/financial-statements/income-statement';
      const method = modalMode === 'edit' ? 'PUT' : 'POST';

      const res = await apiFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validation.data),
      });

      if (res.ok) {
        toast.success(modalMode === 'create' ? common.successSave : common.successUpdate);
        setIsModalOpen(false);
        fetchData();
      } else {
        const errData = await res.json();
        throw new Error(errData.error?.message || common.errorSave);
      }
    } catch (err: any) {
      toast.error(err.message || common.errorNetwork);
    } finally {
      setIsSaving(false);
    }
  };

  // --- Calculations ---
  const n = (v: any) => parseFloat(String(v)) || 0;

  const grossProfit = n(formData.revenue) - n(formData.cogs);
  const ebit = grossProfit - n(formData.operatingExpenses);
  const netProfit = ebit - n(formData.interestExpense) - n(formData.taxExpense);

  const profitMargin = n(formData.revenue) > 0 ? (netProfit / n(formData.revenue)) * 100 : 0;

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-full font-bold">

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <div className="p-2 bg-emerald-600 text-white rounded-xl shadow-lg shadow-emerald-100">
              <FileBarChart size={24} />
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
            <div className="flex-1 min-w-[200px]">
              <SearchableSelect
                options={corporateOptions}
                value={filterCorporate}
                onChange={(val) => setFilterCorporate(val)}
                placeholder={t.modal.selectCorporate}
                disabled={isCorpsLoading}
              />
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
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.tableHead.period}</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.tableHead.corporate}</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">{t.tableHead.revenue}</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">{t.tableHead.cogs}</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">{t.tableHead.netProfit}</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">{t.tableHead.margin}</th>
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
                      <td className="px-6 py-4"><div className="h-6 bg-slate-100 rounded-lg w-16 mx-auto" /></td>
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
                          <PieChart size={48} />
                        </div>
                        <p className="text-slate-800 font-bold text-lg">{t.status.empty}</p>
                        <p className="text-slate-500 text-sm mt-1">{t.status.emptyDesc}</p>
                      </div>
                    </td>
                  </motion.tr>
                ) : (
                  data.map((item, idx) => {
                    const np = n(item.revenue) - n(item.cogs) - n(item.operatingExpenses) - n(item.interestExpense) - n(item.taxExpense);
                    const margin = n(item.revenue) > 0 ? (np / n(item.revenue)) * 100 : 0;

                    return (
                      <motion.tr
                        key={item.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ delay: idx * 0.03 }}
                        className="hover:bg-slate-50/50 transition-colors group text-sm font-bold"
                      >
                        <td className="px-6 py-4 text-slate-700">{formatPeriod(item.period, language)}</td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-slate-800">{item.corporateName}</span>
                            <span className="text-[10px] text-slate-400 font-bold tracking-tighter uppercase">ID: {item.corporateId.slice(0, 8)}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right text-slate-700">{formatRupiah(n(item.revenue), true)}</td>
                        <td className="px-6 py-4 text-right text-slate-700">{formatRupiah(n(item.cogs), true)}</td>
                        <td className="px-6 py-4 text-right">
                          <span className={cn("font-bold", np >= 0 ? "text-emerald-600" : "text-rose-600")}>
                            {formatRupiah(np, true)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={cn(
                            "px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest shadow-sm",
                            margin >= 10 ? "bg-emerald-100 text-emerald-700" : margin >= 5 ? "bg-amber-100 text-amber-700" : "bg-rose-100 text-rose-700"
                          )}>
                            {margin.toFixed(2)}%
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => openModal('view', item)}
                              className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all cursor-pointer"
                              title={common.view}
                            >
                              <Eye size={16} />
                            </button>
                            {canWrite && (
                              <button
                                onClick={() => openModal('edit', item)}
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
            <form onSubmit={handleSave} onInvalid={() => toast.error(common.errorRequired, { id: 'errorRequired' })} className="flex-1 overflow-hidden flex flex-col">
              <div className="flex-1 overflow-y-auto p-6 scrollbar-hide space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-tight flex items-center gap-1.5">
                      <FileBarChart size={12} /> {t.modal.period}
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
                      <Calculator size={12} /> {t.modal.corporate}
                    </label>
                    {modalMode === 'view' ? (
                      <div className="w-full bg-slate-100 border-none rounded-xl px-4 py-2 text-sm font-bold text-slate-600">
                        {formData.corporateName || 'N/A'}
                      </div>
                    ) : (
                      <SearchableSelect
                        options={corporateOptions.filter(opt => (hasFullCorporateAccess || user?.role === 'owner') || (subsidiaryIds.length > 0 && subsidiaryIds.includes(opt.value)))}
                        value={formData.corporateId || ''}
                        onChange={(val) => setFormData({ ...formData, corporateId: val })}
                        placeholder={t.modal.selectCorporate}
                        disabled={isCorpsLoading}
                      />
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-x-8 gap-y-6 items-start">
                  {/* Section Pendapatan & HPP (1/3) */}
                  <div className="lg:col-span-1 space-y-6">
                    <div className="flex items-center gap-2 pb-2 border-b-2 border-emerald-500">
                      <ArrowUpCircle size={18} className="text-emerald-500" />
                      <h4 className="font-bold text-sm text-slate-700 uppercase tracking-tight">{t.modal.revenueAndCogs}</h4>
                    </div>
                    <FormField label={t.fields.revenue} value={formData.revenue || 0} onChange={(v) => setFormData(p => ({ ...p, revenue: v === "" ? 0 : parseFloat(v) }))} readOnly={modalMode === 'view'} />
                    <FormField label={t.fields.cogs} value={formData.cogs || 0} onChange={(v) => setFormData(p => ({ ...p, cogs: v === "" ? 0 : parseFloat(v) }))} readOnly={modalMode === 'view'} />
                    <SummaryCard label={t.modal.grossProfit} value={grossProfit} color="blue" />
                  </div>

                  {/* Section Biaya & Profit (2/3) */}
                  <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center gap-2 pb-2 border-b-2 border-amber-500">
                      <TrendingUp size={18} className="text-amber-500" />
                      <h4 className="font-bold text-sm text-slate-700 uppercase tracking-tight">{t.modal.expensesAndProfit}</h4>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
                      {/* Row 1: Ops Expense & EBIT */}
                      <FormField label={t.fields.operatingExpenses} value={formData.operatingExpenses || 0} onChange={(v) => setFormData(p => ({ ...p, operatingExpenses: v === "" ? 0 : parseFloat(v) }))} readOnly={modalMode === 'view'} />
                      <SummaryCard label={t.modal.ebit} value={ebit} color="amber" />

                      {/* Row 2: Interest & EBT */}
                      <FormField label={t.fields.interest} value={formData.interestExpense || 0} onChange={(v) => setFormData(p => ({ ...p, interestExpense: v === "" ? 0 : parseFloat(v) }))} readOnly={modalMode === 'view'} />
                      <SummaryCard label={t.modal.ebt} value={ebit - n(formData.interestExpense)} color="amber" />

                      {/* Row 3: Tax & Net Profit */}
                      <FormField label={t.fields.tax} value={formData.taxExpense || 0} onChange={(v) => setFormData(p => ({ ...p, taxExpense: v === "" ? 0 : parseFloat(v) }))} readOnly={modalMode === 'view'} />
                      <SummaryCard label={t.modal.netProfit} value={netProfit} color="emerald" />
                    </div>
                  </div>
                </div>

                {/* Net Margin Card - Full Width */}
                <div className="pt-6 mt-4 border-t border-slate-100">
                  <div className={cn("px-5 py-4 rounded-2xl shadow-lg flex flex-col gap-1 w-full transition-all hover:scale-[1.02]", profitMargin >= 0 ? "bg-emerald-600 text-white shadow-emerald-100" : "bg-rose-600 text-white shadow-rose-100")}>
                    <span className="text-[10px] text-center font-black uppercase tracking-widest opacity-80">{t.modal.netMargin}</span>
                    <span className="text-xl text-center font-black">{profitMargin.toFixed(2)}%</span>
                  </div>
                </div>

                {/* Notes */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-tight">{t.modal.notes}</label>
                  <textarea
                    value={formData.notes || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    readOnly={modalMode === 'view'}
                    className="w-full px-4 py-3 text-sm border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm bg-slate-50/30 min-h-[100px] font-bold"
                    placeholder={t.modal.notesPlaceholder}
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
                    disabled={isSaving}
                    className="px-10 py-3.5 text-xs font-black text-white uppercase tracking-widest bg-indigo-600 rounded-2xl hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all active:scale-95 flex items-center justify-center gap-2 min-w-[200px] cursor-pointer disabled:cursor-not-allowed"
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

      {/* Delete Confirmation Alert Dialog */}
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
              {isDeleting ? common.deleting : t.alerts.deleteConfirm}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

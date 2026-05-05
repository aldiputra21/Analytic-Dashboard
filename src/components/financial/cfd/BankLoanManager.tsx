import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus, Search, Edit2, Trash2, Eye,
  ChevronLeft, ChevronRight, Landmark, X,
  RefreshCw, FilterX, Info, ChevronDown,
  Calendar, CreditCard, CheckCircle2, AlertCircle,
  TrendingUp, TrendingDown, Building2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiFetch } from '../../../services/financial/apiFetch';
import { cn } from '../../../utils/cn';
import { useAuth } from '../../../hooks/financial/useAuth';
import { useBanks } from '../../../hooks/financial/useBanks';
import { useCorporates } from '../../../hooks/financial/useCorporates';
import { toast } from 'sonner';
import { getErrorMessage } from '../../../utils/errorUtils';
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
import { bankLoanI18n } from '../../../i18n/bank-loan';
import { commonsI18n } from '../../../i18n/commons';
import { SearchableSelect } from '../shared/SearchableSelect';
import { CorporateSelector } from '../shared/CorporateSelector';
import { z } from 'zod';

interface Installment {
  id?: string;
  bankLoanId?: string;
  installmentDate: string;
  amount: string | number;
  status: 'paid' | 'unpaid';
  paidDate?: string | null;
}

interface BankLoan {
  id: string;
  bankId: string;
  bankName?: string;
  corporateId: string;
  corporateName?: string;
  amount: string | number;
  startDate: string;
  tenor: number;
  interestType: 'flat' | 'effective';
  interestRate: string | number;
  creditType: 'KMK' | 'KMI';
  status: 'ongoing' | 'paid';
  alertMinDays: number;
  createdBy: string;
  createdAt: string;
  updatedBy: string | null;
  updatedAt: string | null;
  installments?: Installment[];
  paidInstallmentsCount?: number;
  totalInstallmentsCount?: number;
}

const Modal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}> = ({ isOpen, onClose, title, children, footer }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <div className="p-1.5 bg-indigo-100 text-indigo-600 rounded-lg">
              <Landmark size={18} />
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
        {footer && (
          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50">
            {footer}
          </div>
        )}
      </motion.div>
    </div>
  );
};

// Helper function to format currency with thousand separator
const formatCurrencyDisplay = (value: string | number): string => {
  if (value === undefined || value === null || value === "" || value === 0) {
    return value === 0 ? "0" : "";
  }
  const num = Math.floor(Number(value));
  return isNaN(num) ? "" : num.toLocaleString('id-ID');
};

// Helper function to parse currency input (remove thousand separator)
const parseCurrencyInput = (value: string): string => {
  return value.replace(/[^0-9-]/g, "");
};

export const BankLoanManager: React.FC = () => {
  const { hasPermission, language, subsidiaryIds, hasFullCorporateAccess } = useAuth();
  const { options: bankOptions, isLoading: isBanksLoading } = useBanks();
  const { options: corporateOptions, isLoading: isCorpsLoading } = useCorporates();
  const t = bankLoanI18n[language];
  const common = commonsI18n[language];

  // Validation Schema
  const bankLoanSchema = (hasFullAccess: boolean) => z.object({
    bankId: z.string().min(1, t.validation.bankRequired),
    corporateId: hasFullAccess ? z.string().min(1, t.validation.corporateRequired) : z.string().optional(),
    creditType: z.enum(['KMK', 'KMI']),
    amount: z.string().refine(v => !isNaN(parseFloat(v)) && parseFloat(v) > 0, t.validation.nominalZero),
    startDate: z.string().min(1, t.validation.startDateRequired),
    tenor: z.number().min(1, t.validation.tenorMin),
    interestType: z.enum(['flat', 'effective']),
    interestRate: z.string().refine(v => !isNaN(parseFloat(v)), t.validation.interestRateInvalid),
    alertMinDays: z.number().min(1).max(31)
  });

  const canWrite = hasPermission('cfd.bank_loans.write');
  const canDelete = hasPermission('cfd.bank_loans.delete');

  const [data, setData] = useState<BankLoan[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterCorporate, setFilterCorporate] = useState('');
  const [appliedFilters, setAppliedFilters] = useState({
    search: '',
    status: '',
    corporateId: ''
  });

  const [page, setPage] = useState(1);
  const [_pageSize, _setPageSize] = useState(10);


  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create');
  const isReadOnly = modalMode === 'view';
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    bankId: '',
    corporateId: '',
    amount: '',
    startDate: new Date().toISOString().split('T')[0],
    tenor: 12,
    interestType: 'flat' as 'flat' | 'effective',
    interestRate: '5',
    creditType: 'KMK' as 'KMK' | 'KMI',
    alertMinDays: 5,
  });

  const [installments, setInstallments] = useState<Installment[]>([]);
  const [markPaidConfirmId, setMarkPaidConfirmId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);


  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        page: page.toString(),
        pageSize: _pageSize.toString(),
      });
      if (appliedFilters.search) query.set('search', appliedFilters.search);
      if (appliedFilters.status) query.set('status', appliedFilters.status);
      if (appliedFilters.corporateId) query.set('corporateId', appliedFilters.corporateId);

      const res = await apiFetch(`/api/bank-loans?${query.toString()}`);
      if (res.ok) {
        const d = await res.json();
        setData(d.records || []);
        setTotalCount(d.totalCount || 0);
      } else {
        const errData = await res.json();
        throw errData;
      }
    } catch (err: any) {
      const msg = getErrorMessage(err.error?.code || err.code || 'NETWORK_ERROR', language);
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [page, _pageSize, appliedFilters, language]);


  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleApplyFilter = () => {
    setAppliedFilters({ search, status: filterStatus, corporateId: filterCorporate });
    setPage(1);
  };

  const handleClearFilter = () => {
    setSearch('');
    setFilterStatus('');
    setFilterCorporate('');
    setAppliedFilters({ search: '', status: '', corporateId: '' });
    setPage(1);
  };

  // Auto-generate installments based on loan amount / tenor
  const generateInstallments = useCallback(() => {
    if (!formData.amount || !formData.tenor || !formData.startDate) return;

    const totalAmount = parseFloat(formData.amount);
    const tenorMonths = parseInt(formData.tenor.toString());

    if (isNaN(totalAmount) || isNaN(tenorMonths) || tenorMonths <= 0) return;

    const monthlyAmount = Math.round(totalAmount / tenorMonths);
    const newInstallments: Installment[] = [];
    const startDate = new Date(formData.startDate);

    for (let i = 1; i <= tenorMonths; i++) {
      const date = new Date(startDate);
      date.setMonth(date.getMonth() + i);

      newInstallments.push({
        installmentDate: date.toISOString().split('T')[0],
        amount: monthlyAmount,
        status: 'unpaid'
      });
    }
    setInstallments(newInstallments);
  }, [formData.amount, formData.tenor, formData.startDate]);

  useEffect(() => {
    if (modalMode === 'create') {
      generateInstallments();
    }
  }, [generateInstallments, modalMode]);

  const openModal = async (mode: 'create' | 'edit' | 'view', item?: BankLoan) => {
    setModalMode(mode);
    if (item) {
      setEditingId(item.id);
      setFormData({
        bankId: item.bankId,
        corporateId: item.corporateId,
        amount: item.amount.toString(),
        startDate: item.startDate.split('T')[0],
        tenor: item.tenor,
        interestType: item.interestType,
        interestRate: (Number(item.interestRate) * 100).toString(), // Convert from 0.05 to 5
        creditType: item.creditType || 'KMK',
        alertMinDays: item.alertMinDays,
      });

      // Fetch installments for the loan
      try {
        const res = await apiFetch(`/api/bank-loans/${item.id}`);
        if (res.ok) {
          const detail = await res.json();
          setInstallments(detail.installments || []);
        }
      } catch (err) {
        console.error('Failed to fetch installments', err);
      }
    } else {
      setEditingId(null);
      setFormData({
        bankId: '',
        corporateId: '',
        amount: '',
        startDate: new Date().toISOString().split('T')[0],
        tenor: 12,
        interestType: 'flat',
        interestRate: '',
        creditType: 'KMK',
        alertMinDays: 5,
      });
      setInstallments([]);
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;

    const validation = bankLoanSchema(hasFullCorporateAccess).safeParse(formData);
    if (!validation.success) {
      const uniqueErrors = new Set(validation.error.issues.map(err => err.message));
      uniqueErrors.forEach(msg => toast.error(msg));
      return;
    }

    setIsSaving(true);
    try {
      const basePayload = {
        ...validation.data,
        amount: parseFloat(validation.data.amount),
        interestRate: parseFloat(validation.data.interestRate) / 100, // Convert from 5 to 0.05
      };

      // For flat interest, send installmentAmount; for effective, send installments array
      const payload = formData.interestType === 'flat'
        ? {
          ...basePayload,
          installmentAmount: installments.length > 0 ? parseFloat(installments[0].amount.toString()) : 0,
        }
        : {
          ...basePayload,
          installments: installments.map(inst => ({
            installmentDate: inst.installmentDate,
            amount: parseFloat(inst.amount.toString()),
          })),
        };

      const url = editingId ? `/api/bank-loans/${editingId}` : '/api/bank-loans';
      const method = editingId ? 'PUT' : 'POST';
      const res = await apiFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success(editingId ? common.successUpdate : common.successSave);
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

  const handleMarkAsPaid = async (installmentId: string) => {
    try {
      const res = await apiFetch(`/api/bank-loans/installments/${installmentId}/mark-paid`, {
        method: 'POST'
      });
      if (res.ok) {
        const updated = await res.json();
        toast.success(t.alerts.successMarkPaid);
        if (updated.loanStatus === 'paid') {
          toast.success(t.alerts.successLoanPaid);
        }

        // Refresh detail
        if (editingId) {
          const detailRes = await apiFetch(`/api/bank-loans/${editingId}`);
          if (detailRes.ok) {
            const detail = await detailRes.json();
            setInstallments(detail.installments || []);
          }
        }
        fetchData();
        setMarkPaidConfirmId(null);
      } else {
        toast.error(t.alerts.errorMarkPaid);
      }
    } catch {
      toast.error(common.errorNetwork);
    }
  };

  const handleDelete = async (id: string) => {
    setIsDeleting(true);
    try {
      const res = await apiFetch(`/api/bank-loans/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success(common.successDelete);
        setDeleteConfirmId(null);
        fetchData();
      } else {
        const errData = await res.json();
        throw errData;
      }
    } catch (err: any) {
      toast.error(getErrorMessage(err.error?.code || err.code || 'NETWORK_ERROR', language));
    } finally {
      setIsDeleting(false);
    }
  };

  const totalPages = Math.ceil(totalCount / _pageSize);
  const showingFrom = totalCount === 0 ? 0 : (page - 1) * _pageSize + 1;
  const showingTo = Math.min(page * _pageSize, totalCount);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-100">
              <Landmark size={24} />
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
            className="group px-4 py-2 text-sm font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-lg shadow-indigo-100 active:scale-95 cursor-pointer"
          >
            <Plus size={18} className="group-hover:rotate-90 transition-transform duration-300" />
            {t.inputNew}
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200/60 flex flex-wrap items-center gap-4">
        <CorporateSelector
          className="w-full md:w-72"
          value={filterCorporate}
          onChange={(val) => setFilterCorporate(val)}
          placeholder={t.filter.allCorporates}
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
        <div className="relative">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="appearance-none pl-3 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all cursor-pointer"
          >
            <option value="">{t.filter.allStatuses}</option>
            <option value="ongoing">{t.loanStatus.ongoing}</option>
            <option value="paid">{t.loanStatus.paid}</option>
          </select>
          <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleApplyFilter}
            className="flex items-center gap-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-4 py-2 rounded-xl text-xs font-black transition-all active:scale-95 border border-indigo-200/50 cursor-pointer"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
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

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">{t.tableHead.bank}</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">{t.tableHead.corporate}</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">{t.tableHead.amount}</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">{t.tableHead.tenor}</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">{t.tableHead.progress}</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">{t.tableHead.status}</th>
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
                      <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-24" /></td>
                      <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-32" /></td>
                      <td className="px-6 py-4 text-right"><div className="h-4 bg-slate-100 rounded w-28 ml-auto" /></td>
                      <td className="px-6 py-4 text-center"><div className="h-4 bg-slate-100 rounded w-12 mx-auto" /></td>
                      <td className="px-6 py-4 text-center"><div className="h-6 bg-slate-100 rounded-full w-20 mx-auto" /></td>
                      <td className="px-6 py-4 text-center"><div className="h-6 bg-slate-100 rounded-full w-16 mx-auto" /></td>
                      <td className="px-6 py-4 text-right"><div className="h-8 bg-slate-100 rounded w-20 ml-auto" /></td>
                    </motion.tr>
                  ))
                ) : error ? (
                  <motion.tr
                    key="error"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
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
                  <motion.tr key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <td colSpan={7}>
                      <div className="py-20 flex flex-col items-center justify-center gap-4 text-center">
                        <div className="p-4 bg-slate-50 rounded-full text-slate-300">
                          <Landmark size={48} />
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
                      className="hover:bg-slate-50/50 transition-colors group"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-slate-800">
                          <Landmark size={14} className="text-indigo-500" />
                          {item.bankName}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-600 font-medium">{item.corporateName}</td>
                      <td className="px-6 py-4 text-right text-slate-800 font-black tabular-nums">
                        {new Intl.NumberFormat(language === 'id' ? 'id-ID' : 'en-US', {
                          style: 'currency',
                          currency: 'IDR',
                          maximumFractionDigits: 0
                        }).format(Number(item.amount))}
                      </td>
                      <td className="px-6 py-4 text-center text-slate-500 font-medium">
                        {item.tenor} {t.modal.tenorUnit}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${((item.paidInstallmentsCount || 0) / (item.totalInstallmentsCount || 1)) * 100}%` }}
                              className={cn(
                                'h-full rounded-full',
                                item.status === 'paid' ? 'bg-emerald-500' : 'bg-indigo-500'
                              )}
                            />
                          </div>
                          <span className="text-[10px] text-slate-400 font-black tracking-wider uppercase">
                            {item.paidInstallmentsCount}/{item.totalInstallmentsCount} {t.installment.progressLabel}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className={cn(
                          'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black tracking-wider uppercase border',
                          item.status === 'paid'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                            : 'bg-indigo-50 text-indigo-700 border-indigo-100'
                        )}>
                          {item.status === 'paid' ? <CheckCircle2 size={12} /> : <RefreshCw size={12} />}
                          {item.status === 'paid' ? t.loanStatus.paid : t.loanStatus.ongoing}
                        </div>
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
                          {canWrite && item.status !== 'paid' && (
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
                {common.pagination.showing}{' '}
                <span className="text-slate-800">{showingFrom}</span> -{' '}
                <span className="text-slate-800">{showingTo}</span>{' '}
                {common.pagination.of}{' '}
                <span className="text-slate-800">{totalCount}</span>{' '}
                {common.pagination.total}
              </span>
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
            footer={
              !isReadOnly ? (
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    form="bankLoanForm"
                    onClick={() => setIsModalOpen(false)}
                    disabled={isSaving}
                    className="px-8 py-3 bg-white border border-slate-200 text-sm font-bold text-slate-500 rounded-xl hover:bg-slate-50 transition-all active:scale-95 cursor-pointer shadow-sm disabled:opacity-50"
                  >
                    {common.cancel}
                  </button>
                  <button
                    type="submit"
                    form="bankLoanForm"
                    disabled={isSaving}
                    className="px-10 py-3 bg-indigo-600 text-sm font-bold text-white rounded-xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 flex items-center justify-center gap-2 min-w-[180px] cursor-pointer disabled:opacity-70"
                  >
                    {isSaving ? <RefreshCw className="animate-spin" size={18} /> : <CheckCircle2 size={18} />}
                    {isSaving ? common.saving : common.save}
                  </button>
                </div>
              ) : (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-8 py-3 bg-white border border-slate-200 text-sm font-bold text-slate-500 rounded-xl hover:bg-slate-50 transition-all active:scale-95 cursor-pointer shadow-sm"
                  >
                    {common.close}
                  </button>
                </div>
              )
            }
          >
            <form id="bankLoanForm" onSubmit={handleSave} noValidate className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Basic Info Column */}
                <div className="space-y-5">
                  <div className="flex items-center gap-2 mb-2 pb-1 border-b border-slate-100">
                    <Building2 size={16} className="text-indigo-500" />
                    <span className="text-xs font-black text-slate-800 uppercase tracking-widest">Informasi Pinjaman</span>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      {t.modal.bank} <span className="text-red-500">*</span>
                    </label>
                    <SearchableSelect
                      options={bankOptions}
                      value={formData.bankId}
                      onChange={(val) => setFormData(p => ({ ...p, bankId: val }))}
                      placeholder={t.modal.selectBank}
                      disabled={isReadOnly || isBanksLoading}
                    />
                  </div>

                  <CorporateSelector
                    label={t.modal.corporate}
                    value={formData.corporateId}
                    onChange={(val) => setFormData(p => ({ ...p, corporateId: val }))}
                    disabled={isReadOnly || isCorpsLoading}
                    required
                  />

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      {t.modal.creditType} <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        disabled={isReadOnly}
                        onClick={() => setFormData(p => ({ ...p, creditType: 'KMK' }))}
                        className={cn(
                          'py-2 px-2 rounded-xl border-2 transition-all flex items-center justify-center text-xs font-black uppercase tracking-wider',
                          formData.creditType === 'KMK'
                            ? 'bg-indigo-50 border-indigo-500 text-indigo-700 shadow-sm'
                            : 'bg-white border-slate-100 text-slate-400'
                        )}
                      >
                        {t.modal.kmk}
                      </button>
                      <button
                        type="button"
                        disabled={isReadOnly}
                        onClick={() => setFormData(p => ({ ...p, creditType: 'KMI' }))}
                        className={cn(
                          'py-2 px-2 rounded-xl border-2 transition-all flex items-center justify-center text-xs font-black uppercase tracking-wider',
                          formData.creditType === 'KMI'
                            ? 'bg-indigo-50 border-indigo-500 text-indigo-700 shadow-sm'
                            : 'bg-white border-slate-100 text-slate-400'
                        )}
                      >
                        {t.modal.kmi}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                        {t.modal.amount} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={formatCurrencyDisplay(formData.amount)}
                        onChange={(e) => setFormData(p => ({ ...p, amount: parseCurrencyInput(e.target.value) }))}
                        required
                        disabled={isReadOnly}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-sm font-black tabular-nums"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                        {t.modal.startDate} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        value={formData.startDate}
                        onChange={(e) => setFormData(p => ({ ...p, startDate: e.target.value }))}
                        required
                        disabled={isReadOnly}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-sm font-medium"
                      />
                    </div>
                  </div>
                </div>

                {/* Terms Column */}
                <div className="space-y-5">
                  <div className="flex items-center gap-2 mb-2 pb-1 border-b border-slate-100">
                    <CreditCard size={16} className="text-indigo-500" />
                    <span className="text-xs font-black text-slate-800 uppercase tracking-widest">Ketentuan Pinjaman</span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                        {t.modal.tenor} ({t.modal.tenorUnit}) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        value={formData.tenor}
                        onChange={(e) => setFormData(p => ({ ...p, tenor: parseInt(e.target.value) }))}
                        required
                        disabled={isReadOnly}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-sm font-black"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                        {t.modal.interestRate} <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.01"
                          value={formData.interestRate}
                          onChange={(e) => setFormData(p => ({ ...p, interestRate: e.target.value }))}
                          required
                          disabled={isReadOnly}
                          className="w-full pr-10 pl-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-sm font-black tabular-nums"
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-black text-xs">%</div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      {t.modal.interestType} <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        disabled={isReadOnly}
                        onClick={() => setFormData(p => ({ ...p, interestType: 'flat' }))}
                        className={cn(
                          'py-2.5 rounded-xl border-2 transition-all flex items-center justify-center gap-2 text-xs font-black uppercase tracking-wider',
                          formData.interestType === 'flat'
                            ? 'bg-indigo-50 border-indigo-500 text-indigo-700 shadow-sm'
                            : 'bg-white border-slate-100 text-slate-400'
                        )}
                      >
                        <TrendingUp size={16} />
                        {t.interestType.flat}
                      </button>
                      <button
                        type="button"
                        disabled={isReadOnly}
                        onClick={() => setFormData(p => ({ ...p, interestType: 'effective' }))}
                        className={cn(
                          'py-2.5 rounded-xl border-2 transition-all flex items-center justify-center gap-2 text-xs font-black uppercase tracking-wider',
                          formData.interestType === 'effective'
                            ? 'bg-indigo-50 border-indigo-500 text-indigo-700 shadow-sm'
                            : 'bg-white border-slate-100 text-slate-400'
                        )}
                      >
                        <TrendingDown size={16} />
                        {t.interestType.effective}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      {t.modal.alertMinDays} <span className="text-slate-400 text-[10px] font-medium ml-1">({t.modal.alertMinDaysHint})</span>
                    </label>
                    <input
                      type="number"
                      value={formData.alertMinDays}
                      onChange={(e) => setFormData(p => ({ ...p, alertMinDays: parseInt(e.target.value) }))}
                      disabled={isReadOnly}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-sm font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Installment Schedule Section */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-indigo-500" />
                    <span className="text-xs font-black text-slate-800 uppercase tracking-widest">{t.installment.sectionTitle}</span>
                  </div>
                  {formData.interestType === 'effective' && !isReadOnly && (
                    <div className="text-[10px] text-slate-400 font-medium italic">
                      {t.installment.effectiveInputHint}
                    </div>
                  )}
                </div>

                <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
                  <div className="max-h-[300px] overflow-y-auto overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm">
                          <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">{t.installment.tableHead.no}</th>
                          <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">{t.installment.tableHead.installmentDate}</th>
                          <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">{t.installment.tableHead.amount}</th>
                          <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">{t.installment.tableHead.status}</th>
                          <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">{t.installment.tableHead.actions}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {installments.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="px-4 py-8 text-center text-slate-400 font-bold italic">
                              {t.installment.noInstallments}
                            </td>
                          </tr>
                        ) : (
                          installments.map((inst, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-4 py-3 text-slate-500 font-bold">{idx + 1}</td>
                              <td className="px-4 py-3">
                                {isReadOnly || (editingId && inst.status === 'paid') ? (
                                  <span className="text-slate-800 font-bold">
                                    {new Date(inst.installmentDate).toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', {
                                      year: 'numeric', month: 'short', day: 'numeric'
                                    })}
                                  </span>
                                ) : (
                                  <input
                                    type="date"
                                    value={inst.installmentDate.split('T')[0]}
                                    onChange={(e) => {
                                      const newInsts = [...installments];
                                      newInsts[idx].installmentDate = e.target.value;
                                      setInstallments(newInsts);
                                    }}
                                    className="px-2 py-1 bg-white border border-slate-200 rounded-md focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none text-xs font-bold"
                                  />
                                )}
                              </td>
                              <td className="px-4 py-3 text-right">
                                {isReadOnly || (editingId && inst.status === 'paid') ? (
                                  <span className="text-slate-800 font-black tabular-nums">
                                    {new Intl.NumberFormat(language === 'id' ? 'id-ID' : 'en-US').format(Number(inst.amount))}
                                  </span>
                                ) : (
                                  <div className="flex items-center justify-end">
                                    <input
                                      type="text"
                                      inputMode="numeric"
                                      value={formatCurrencyDisplay(inst.amount)}
                                      onChange={(e) => {
                                        const newInsts = [...installments];
                                        newInsts[idx].amount = parseCurrencyInput(e.target.value);
                                        setInstallments(newInsts);
                                      }}
                                      className="w-28 px-2 py-1 bg-white border border-slate-200 rounded-md focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none text-xs font-black text-right tabular-nums"
                                    />
                                  </div>
                                )}
                              </td>
                              <td className="px-4 py-3 text-center">
                                <div className={cn(
                                  'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black tracking-wider uppercase border',
                                  inst.status === 'paid'
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                    : 'bg-slate-50 text-slate-500 border-slate-100'
                                )}>
                                  {inst.status === 'paid' ? <CheckCircle2 size={10} /> : <AlertCircle size={10} />}
                                  {inst.status === 'paid' ? t.installmentStatus.paid : t.installmentStatus.unpaid}
                                </div>
                              </td>
                              <td className="px-4 py-3 text-right">
                                {editingId && inst.status === 'unpaid' && (
                                  <button
                                    type="button"
                                    onClick={() => setMarkPaidConfirmId(inst.id || null)}
                                    className="text-[10px] font-black text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-2 py-1 rounded transition-all cursor-pointer border border-indigo-100"
                                  >
                                    {t.installment.markPaid}
                                  </button>
                                )}
                                {inst.status === 'paid' && inst.paidDate && (
                                  <span className="text-[10px] text-slate-400 font-medium italic">
                                    {t.installment.tableHead.paidDate}: {new Date(inst.paidDate).toLocaleDateString()}
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                  {/* Summary Footer */}
                  {formData.amount && (
                    <div className="bg-slate-50/80 px-4 py-3 border-t border-slate-100">
                      <div className="flex flex-col">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{t.installment.totalLabel}</span>
                        <span className={cn(
                          'text-xs font-black tabular-nums',
                          Math.abs(installments.reduce((sum, i) => sum + parseFloat(i.amount.toString()), 0) - parseFloat(formData.amount)) < 1
                            ? 'text-emerald-600'
                            : 'text-rose-600'
                        )}>
                          {new Intl.NumberFormat(language === 'id' ? 'id-ID' : 'en-US').format(installments.reduce((sum, i) => sum + parseFloat(i.amount.toString() || '0'), 0))}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

            </form>
          </Modal>
        )}
      </AnimatePresence>

      {/* Mark Paid Confirm Dialog */}
      <AlertDialog open={!!markPaidConfirmId} onOpenChange={(open) => !open && setMarkPaidConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.installment.markPaidConfirmTitle}</AlertDialogTitle>
            <AlertDialogDescription>{t.installment.markPaidConfirmDesc}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{common.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => markPaidConfirmId && handleMarkAsPaid(markPaidConfirmId)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {t.installment.markPaidConfirm}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirm Dialog */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.alerts.deleteTitle}</AlertDialogTitle>
            <AlertDialogDescription>{t.alerts.deleteDesc}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>{common.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
              disabled={isDeleting}
              className="bg-rose-600 hover:bg-rose-700 text-white"
            >
              {isDeleting ? common.deleting : t.alerts.deleteConfirm}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

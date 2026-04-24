import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  Plus, Search, Edit2, Trash2, Eye,
  ChevronLeft, ChevronRight, Target, X, AlertCircle, CheckCircle2,
  RefreshCw, FilterX, Calendar, Info, Building2, User,
  TrendingUp, TrendingDown, Layers, Trash, ChevronDown, ChevronUp
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
import { targetI18n } from '../../../i18n/target';
import { formatRupiah } from '../../../utils/format';
import { SearchableSelect } from '../shared/SearchableSelect';

interface TargetSummary {
  department_id: string;
  department_name: string;
  project_id: string | null;
  project_name: string | null;
  project_description?: string;
  fiscal_year: number;
  total_revenue: string;
  total_cost: string;
}

interface RevenueDetail {
  month: number;
  amount: string;
  notes?: string;
}

interface CostDetail {
  month: number;
  costCenter: string;
  amount: string;
  notes?: string;
}

const YEAR_OPTIONS = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 1 + i);

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
    xl: 'max-w-5xl'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className={cn("bg-white rounded-2xl shadow-2xl w-full overflow-hidden flex flex-col max-h-[95vh]", sizeClasses[size])}
      >
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <div className="p-1.5 bg-indigo-100 text-indigo-600 rounded-lg">
              <Target size={18} />
            </div>
            {title}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <X size={20} className="text-slate-500" />
          </button>
        </div>
        <div className="overflow-y-auto p-6">
          {children}
        </div>
      </motion.div>
    </div>
  );
};

const SectionHeader: React.FC<{ title: string; icon: React.ReactNode; color: string; children?: React.ReactNode }> = ({ title, icon, color, children }) => (
  <div className={cn("flex items-center justify-between mb-4 pb-2 border-b-2", color)}>
    <div className="flex items-center gap-2">
      <div className="p-1.5 rounded-lg bg-white shadow-sm border border-slate-100/50">
        {icon}
      </div>
      <h4 className="font-black text-[10px] text-slate-600 tracking-widest uppercase">{title}</h4>
    </div>
    {children}
  </div>
);

const FormField: React.FC<{
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}> = ({ label, error, required, children }) => (
  <div className="space-y-1.5">
    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    {children}
    {error && <p className="text-[10px] text-red-500 font-bold ml-1 flex items-center gap-1">
      <AlertCircle size={10} /> {error}
    </p>}
  </div>
);

// --- Main Component ---

export const TargetManager: React.FC = () => {
  const { hasPermission, language } = useAuth();
  const t = targetI18n[language];

  const canWrite = hasPermission('public.targets.write');
  const canDelete = hasPermission('public.targets.delete');

  // Master Data State
  const [departments, setDepartments] = useState<{ id: string, name: string, corporateName?: string }[]>([]);
  const [projects, setProjects] = useState<{ id: string, name: string, departmentId: string, code?: string }[]>([]);
  const [costCenters, setCostCenters] = useState<{ code: string, label: { id: string, en: string } }[]>([]);

  // List State
  const [summaries, setSummaries] = useState<TargetSummary[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterDepartmentId, setFilterDepartmentId] = useState('');
  const [appliedFilters, setAppliedFilters] = useState({ search: '', departmentId: '' });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewOnly, setIsViewOnly] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [editingSummary, setEditingSummary] = useState<TargetSummary | null>(null);

  const [formData, setFormData] = useState({
    departmentId: '',
    projectId: null as string | null,
    fiscalYear: new Date().getFullYear(),
    relatedToProject: false,
    revenueDetails: [] as RevenueDetail[],
    costDetails: [] as CostDetail[],
    notes: ''
  });

  const [targetToDelete, setTargetToDelete] = useState<TargetSummary | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchMasterData = useCallback(async () => {
    try {
      const [dRes, pRes, cRes] = await Promise.all([
        apiFetch('/api/departments/dropdown-items'),
        apiFetch('/api/projects/dropdown-items'),
        apiFetch('/api/system-configs/cost_center_categories')
      ]);
      if (dRes.ok) {
        const data = await dRes.json();
        setDepartments(Array.isArray(data) ? data : []);
      }
      if (pRes.ok) {
        const data = await pRes.json();
        setProjects(Array.isArray(data) ? data : (data.records || []));
      }
      if (cRes.ok) {
        const data = await cRes.json();
        setCostCenters(data.value || []);
      }
    } catch (err) {
      console.error('Failed to fetch master data:', err);
    }
  }, []);

  const fetchSummaries = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setIsRefreshing(true);

    try {
      const query = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
        search: appliedFilters.search.trim(),
      });
      if (appliedFilters.departmentId) query.set('departmentId', appliedFilters.departmentId);

      const res = await apiFetch(`/api/targets?${query.toString()}`);
      if (!res.ok) throw new Error(t.alerts.errorFetch);

      const data = await res.json();
      setSummaries(data.records);
      setTotalCount(data.totalCount);
    } catch (err: any) {
      toast.error(err.message || t.alerts.errorFetch);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [page, pageSize, appliedFilters, t.alerts.errorFetch]);

  useEffect(() => {
    fetchMasterData();
  }, [fetchMasterData]);

  useEffect(() => {
    fetchSummaries();
  }, [fetchSummaries]);

  const handleApplyFilter = () => {
    setAppliedFilters({ search: search, departmentId: filterDepartmentId });
    setPage(1);
  };

  const handleClearFilter = () => {
    setSearch('');
    setFilterDepartmentId('');
    setAppliedFilters({ search: '', departmentId: '' });
    setPage(1);
  };

  const loadDetails = async (deptId: string, projId: string | null, year: number) => {
    setIsSaving(true);
    try {
      const projParam = projId ? `&projectId=${projId}` : '';
      const res = await apiFetch(`/api/targets/details?departmentId=${deptId}&fiscalYear=${year}${projParam}`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.months) {
          // Convert from legacy months structure to split structure
          const revs: RevenueDetail[] = [];
          const costs: CostDetail[] = [];

          data.months.forEach((m: any) => {
            if (parseFloat(m.revenue) !== 0) {
              revs.push({ month: m.fiscalMonth, amount: m.revenue, notes: m.notes });
            }
            if (parseFloat(m.cost) !== 0) {
              costs.push({ month: m.fiscalMonth, costCenter: m.costCenter || 'operational', amount: m.cost, notes: m.notes });
            }
          });

          setFormData(prev => ({
            ...prev,
            revenueDetails: revs,
            costDetails: costs
          }));
        }
      }
    } catch (err) {
      console.error('Failed to load details:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenModal = (s?: TargetSummary, viewOnly = false) => {
    setIsViewOnly(viewOnly);
    if (s) {
      setEditingSummary(s);
      setFormData({
        departmentId: s.department_id,
        projectId: s.project_id,
        fiscalYear: s.fiscal_year,
        relatedToProject: !!s.project_id,
        revenueDetails: [],
        costDetails: [],
        notes: ''
      });
      loadDetails(s.department_id, s.project_id, s.fiscal_year);
    } else {
      setEditingSummary(null);
      setFormData({
        departmentId: departments[0]?.id || '',
        projectId: null,
        fiscalYear: new Date().getFullYear(),
        relatedToProject: false,
        revenueDetails: [{ month: 1, amount: '0', notes: '' }],
        costDetails: [{ month: 1, costCenter: 'operational', amount: '0', notes: '' }],
        notes: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    if (isSaving) return;
    setIsModalOpen(false);
    setEditingSummary(null);
    setIsViewOnly(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isViewOnly) return;
    if (!formData.departmentId) {
      setFormError('Department is required');
      return;
    }

    // Deduplication checks
    const revMonths = formData.revenueDetails.map(r => r.month);
    if (new Set(revMonths).size !== revMonths.length) {
      toast.error(t.alerts.duplicateMonth + ' (Revenue)');
      return;
    }

    const costKeys = formData.costDetails.map(c => `${c.month}-${c.costCenter}`);
    if (new Set(costKeys).size !== costKeys.length) {
      toast.error(t.alerts.duplicateMonth + ' (Cost)');
      return;
    }

    setIsSaving(true);

    try {
      const res = await apiFetch('/api/targets/batch', {
        method: 'POST',
        body: JSON.stringify({
          departmentId: formData.departmentId,
          projectId: formData.relatedToProject ? formData.projectId : null,
          fiscalYear: formData.fiscalYear,
          revenueDetails: formData.revenueDetails,
          costDetails: formData.costDetails,
          notes: formData.notes
        })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || t.alerts.errorSave);
      }

      toast.success(t.alerts.successSave);
      setIsModalOpen(false);
      fetchSummaries(true);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (target: TargetSummary) => {
    setIsDeleting(true);

    try {
      const projParam = target.project_id ? `&projectId=${target.project_id}` : '';
      const res = await apiFetch(`/api/targets?departmentId=${target.department_id}&fiscalYear=${target.fiscal_year}${projParam}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        toast.success(t.alerts.successDelete);
        setTargetToDelete(null);
        fetchSummaries(true);
      } else {
        const errorData = await res.json();
        toast.error(errorData.error || t.alerts.errorDelete);
        setTargetToDelete(null);
      }
    } catch {
      toast.error(t.alerts.errorNetwork);
      setTargetToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  // Pagination Helpers
  const totalPages = Math.ceil(totalCount / pageSize);
  const showingFrom = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const showingTo = Math.min(page * pageSize, totalCount);

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-100">
              <Target size={24} />
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
            onClick={() => handleOpenModal()}
            className="px-4 py-2 text-sm font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-lg shadow-indigo-100 active:scale-95 cursor-pointer"
          >
            <Plus size={18} />
            {t.addNew}
          </button>
        )}
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200/60 flex flex-wrap items-center gap-4">
        <div className="w-full md:w-52 relative group">
          <select
            value={filterDepartmentId}
            onChange={(e) => setFilterDepartmentId(e.target.value)}
            className="w-full pl-4 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all cursor-pointer appearance-none"
          >
            <option value="">{t.filter.allDepartments}</option>
            {departments.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
        </div>

        <div className="flex-1 min-w-[200px] relative group">
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

      {/* Datatable section */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/40 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.tableHead.entity}</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.tableHead.type}</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.tableHead.year}</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">{t.fields.revenueTarget}</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">{t.fields.costTarget}</th>
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
                      <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-32" /></td>
                      <td className="px-6 py-4"><div className="h-6 bg-slate-100 rounded-full w-20" /></td>
                      <td className="px-6 py-4"><div className="h-6 bg-slate-100 rounded-lg w-12" /></td>
                      <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-28 ml-auto" /></td>
                      <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-28 ml-auto" /></td>
                      <td className="px-6 py-4"><div className="h-8 bg-slate-100 rounded-lg w-24 ml-auto" /></td>
                    </motion.tr>
                  ))
                ) : summaries.length === 0 ? (
                  <motion.tr
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <td colSpan={6}>
                      <div className="py-20 flex flex-col items-center justify-center gap-4 text-center">
                        <div className="p-4 bg-slate-50 rounded-full text-slate-300">
                          <Target size={48} />
                        </div>
                        <div>
                          <p className="text-slate-800 font-bold text-lg">{t.status.empty}</p>
                          <p className="text-slate-500 text-sm mt-1">{t.status.emptyDesc}</p>
                        </div>
                      </div>
                    </td>
                  </motion.tr>
                ) : (
                  summaries.map((s, idx) => (
                    <motion.tr
                      key={`${s.department_id}-${s.project_id}-${s.fiscal_year}`}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: idx * 0.03 }}
                      className="hover:bg-slate-50/50 transition-colors group font-bold"
                    >
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-bold text-slate-800 text-sm tracking-tight truncate max-w-[200px]">
                            {s.project_name || s.department_name}
                          </p>
                          {s.project_name && (
                            <p className="text-[10px] text-indigo-500 font-bold uppercase mt-0.5">{s.department_name}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className={cn(
                          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black tracking-wider uppercase border",
                          s.project_id
                            ? "bg-teal-50 text-teal-700 border-teal-100"
                            : "bg-purple-50 text-purple-700 border-purple-100"
                        )}>
                          {s.project_id ? t.types.project : t.types.department}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-black border border-slate-200">
                          {s.fiscal_year}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex flex-col items-end gap-0.5">
                          <div className="text-xs font-black text-emerald-600 flex items-center gap-1">
                            <TrendingUp size={10} strokeWidth={3} />
                            {formatRupiah(parseFloat(s.total_revenue))}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex flex-col items-end gap-0.5">
                          <div className="text-xs font-black text-red-500 flex items-center gap-1">
                            <TrendingDown size={10} strokeWidth={3} />
                            {formatRupiah(parseFloat(s.total_cost))}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleOpenModal(s, true)}
                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all cursor-pointer"
                            title="View Details"
                          >
                            <Eye size={16} />
                          </button>
                          {canWrite && (
                            <button
                              onClick={() => handleOpenModal(s)}
                              className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all cursor-pointer"
                              title="Edit Target"
                            >
                              <Edit2 size={16} />
                            </button>
                          )}
                          {canDelete && (
                            <button
                              onClick={() => setTargetToDelete(s)}
                              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                              title="Delete Target"
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
                {t.pagination.showing} <span className="text-slate-800 mx-0.5">{showingFrom}</span> - <span className="text-slate-800 mx-0.5">{showingTo}</span> {t.pagination.of} <span className="text-slate-800 mx-0.5">{totalCount}</span> {t.pagination.entries}
              </span>

              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  {t.pagination.rowsPerPage}
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
            title={isViewOnly ? t.modal.viewTitle : (editingSummary ? t.modal.editTitle : t.modal.createTitle)}
            size="xl"
          >
            <form onSubmit={handleSubmit} onInvalid={() => toast.error(t.alerts.errorRequired, { id: 'errorRequired' })} className="space-y-8">

              {/* Entity Selection Section */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                <div className="md:col-span-1">
                  <SectionHeader title={t.modal.contextTitle} icon={<Layers size={14} className="text-indigo-600" />} color="border-indigo-100" />
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-loose pr-4">
                    {t.modal.contextDesc}
                  </p>
                </div>

                <div className="md:col-span-3 grid grid-cols-1 sm:grid-cols-12 gap-6 items-start">
                  <div className="sm:col-span-6">
                    <FormField label={t.fields.department} required>
                      <SearchableSelect
                        options={departments.map(d => ({
                          value: d.id,
                          label: d.name,
                          sublabel: d.corporateName
                        }))}
                        value={formData.departmentId}
                        onChange={(val) => {
                          setFormData({ ...formData, departmentId: val });
                        }}
                        disabled={!!editingSummary || isViewOnly}
                        placeholder={t.modal.selectEntity}
                      />
                    </FormField>
                  </div>

                  <div className="sm:col-span-3">
                    <FormField label={t.fields.year} required>
                      <div className="relative">
                        <select
                          value={formData.fiscalYear}
                          onChange={(e) => {
                            const yr = parseInt(e.target.value);
                            setFormData({ ...formData, fiscalYear: yr });
                          }}
                          disabled={!!editingSummary || isViewOnly}
                          className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all appearance-none cursor-pointer"
                        >
                          {YEAR_OPTIONS.map(yr => (
                            <option key={yr} value={yr}>{yr}</option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                      </div>
                    </FormField>
                  </div>

                  <div className="sm:col-span-3 flex flex-col gap-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                      {t.modal.relatedToProject}
                    </label>
                    <button
                      type="button"
                      disabled={!!editingSummary || isViewOnly}
                      onClick={() => setFormData({ ...formData, relatedToProject: !formData.relatedToProject, projectId: null })}
                      className={cn(
                        "relative w-12 h-6 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-50 cursor-pointer",
                        formData.relatedToProject ? "bg-indigo-600" : "bg-slate-200"
                      )}
                    >
                      <div className={cn(
                        "absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform duration-200",
                        formData.relatedToProject && "translate-x-6"
                      )} />
                    </button>
                  </div>

                  {formData.relatedToProject && (
                    <div className="sm:col-span-6">
                      <FormField label={t.fields.project} required={formData.relatedToProject}>
                        <SearchableSelect
                          options={projects.filter(p => p.departmentId === formData.departmentId).map(p => ({
                            value: p.id,
                            label: p.name,
                            sublabel: p.code
                          }))}
                          value={formData.projectId || ''}
                          onChange={(val) => {
                            setFormData({ ...formData, projectId: val });
                          }}
                          disabled={!!editingSummary || isViewOnly}
                          placeholder={t.modal.selectEntity}
                        />
                      </FormField>
                    </div>
                  )}
                </div>
              </div>

              {/* Master-Detail Grid */}
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                {/* Revenue Table */}
                <div className="xl:col-span-5 space-y-4">
                  <SectionHeader title={t.fields.revenueTarget} icon={<TrendingUp size={14} className="text-emerald-600" />} color="border-emerald-100">
                    {!isViewOnly && (
                      <button
                        type="button"
                        onClick={() => setFormData({
                          ...formData,
                          revenueDetails: [...formData.revenueDetails, { month: formData.revenueDetails.length + 1, amount: '0' }]
                        })}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 text-[10px] font-black rounded-lg hover:bg-emerald-100 transition-all border border-emerald-100 tracking-wider cursor-pointer"
                      >
                        <Plus size={12} strokeWidth={3} />
                        {t.modal.addRow}
                      </button>
                    )}
                  </SectionHeader>

                  <div className="bg-white border border-slate-100 rounded-lg overflow-hidden shadow-sm">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-slate-50/50 border-b border-slate-50">
                          <th className="px-2 py-2 text-[9px] font-black text-slate-400 uppercase tracking-widest w-32">{t.fields.month}</th>
                          <th className="px-2 py-2 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">{t.fields.revenue}</th>
                          {!isViewOnly && <th className="px-2 py-2 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center w-12">Aksi</th>}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {formData.revenueDetails.map((r, idx) => (
                          <tr key={idx} className="group hover:bg-slate-50/50 transition-colors">
                            <td className="px-1.5 py-1">
                              <div className="relative">
                                <select
                                  value={r.month}
                                  disabled={isViewOnly}
                                  onChange={(e) => {
                                    const newRevs = [...formData.revenueDetails];
                                    newRevs[idx].month = parseInt(e.target.value);
                                    setFormData({ ...formData, revenueDetails: newRevs });
                                  }}
                                  className="w-full bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-700 focus:ring-0 cursor-pointer pl-2 pr-7 py-1 appearance-none"
                                >
                                  {t.months.map((name, mIdx) => (
                                    <option key={mIdx + 1} value={mIdx + 1}>{name}</option>
                                  ))}
                                </select>
                                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={12} />
                              </div>
                            </td>
                            <td className="px-1.5 py-1">
                              <div className="relative group/input flex items-center">
                                <input
                                  type="text"
                                  value={r.amount === '0' ? '' : (parseInt(r.amount) || 0).toLocaleString('id-ID')}
                                  disabled={isViewOnly}
                                  onChange={(e) => {
                                    const rawValue = e.target.value.replace(/\D/g, '');
                                    const newRevs = [...formData.revenueDetails];
                                    newRevs[idx].amount = rawValue || '0';
                                    setFormData({ ...formData, revenueDetails: newRevs });
                                  }}
                                  className="w-full bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-right text-slate-700 focus:ring-0 pl-2 pr-5 py-1 font-mono"
                                  placeholder="0"
                                />
                                {!isViewOnly && (
                                  <div className="absolute right-1 flex flex-col -gap-1 opacity-0 group-hover/input:opacity-100 transition-opacity">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const val = (parseInt(r.amount) || 0) + 1000000;
                                        const newRevs = [...formData.revenueDetails];
                                        newRevs[idx].amount = val.toString();
                                        setFormData({ ...formData, revenueDetails: newRevs });
                                      }}
                                      className="p-0.5 hover:text-indigo-600 transition-colors"
                                    >
                                      <ChevronUp size={10} />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const val = Math.max(0, (parseInt(r.amount) || 0) - 1000000);
                                        const newRevs = [...formData.revenueDetails];
                                        newRevs[idx].amount = val.toString();
                                        setFormData({ ...formData, revenueDetails: newRevs });
                                      }}
                                      className="p-0.5 hover:text-indigo-600 transition-colors"
                                    >
                                      <ChevronDown size={10} />
                                    </button>
                                  </div>
                                )}
                              </div>
                            </td>
                            {!isViewOnly && (
                              <td className="px-1 py-1 text-center">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newRevs = formData.revenueDetails.filter((_, i) => i !== idx);
                                    setFormData({ ...formData, revenueDetails: newRevs });
                                  }}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                                >
                                  <Trash size={12} />
                                </button>
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Cost Table */}
                <div className="xl:col-span-7 space-y-4">
                  <SectionHeader title={t.fields.costTarget} icon={<TrendingDown size={14} className="text-red-600" />} color="border-red-100">
                    {!isViewOnly && (
                      <button
                        type="button"
                        onClick={() => setFormData({
                          ...formData,
                          costDetails: [...formData.costDetails, { month: formData.costDetails.length + 1, costCenter: 'operational', amount: '0' }]
                        })}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-700 text-[10px] font-black rounded-lg hover:bg-red-100 transition-all border border-red-100 tracking-wider cursor-pointer"
                      >
                        <Plus size={12} strokeWidth={3} />
                        {t.modal.addRow}
                      </button>
                    )}
                  </SectionHeader>

                  <div className="bg-white border border-slate-100 rounded-lg overflow-hidden shadow-sm">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-slate-50/50 border-b border-slate-50">
                          <th className="px-2 py-2 text-[9px] font-black text-slate-400 uppercase tracking-widest w-32">{t.fields.month}</th>
                          <th className="px-2 py-2 text-[9px] font-black text-slate-400 uppercase tracking-widest w-54">Cost Center</th>
                          <th className="px-2 py-2 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">{t.fields.cost}</th>
                          {!isViewOnly && <th className="px-2 py-2 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center w-12">Aksi</th>}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {formData.costDetails.map((c, idx) => (
                          <tr key={idx} className="group hover:bg-slate-50/50 transition-colors">
                            <td className="px-1.5 py-1">
                              <div className="relative">
                                <select
                                  value={c.month}
                                  disabled={isViewOnly}
                                  onChange={(e) => {
                                    const newCosts = [...formData.costDetails];
                                    newCosts[idx].month = parseInt(e.target.value);
                                    setFormData({ ...formData, costDetails: newCosts });
                                  }}
                                  className="w-full bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-700 focus:ring-0 cursor-pointer pl-2 pr-7 py-1 appearance-none"
                                >
                                  {t.months.map((name, mIdx) => (
                                    <option key={mIdx + 1} value={mIdx + 1}>{name}</option>
                                  ))}
                                </select>
                                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={12} />
                              </div>
                            </td>
                            <td className="px-1.5 py-1">
                              <div className="relative">
                                <select
                                  value={c.costCenter}
                                  disabled={isViewOnly}
                                  onChange={(e) => {
                                    const newCosts = [...formData.costDetails];
                                    newCosts[idx].costCenter = e.target.value;
                                    setFormData({ ...formData, costDetails: newCosts });
                                  }}
                                  className="w-full bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-700 focus:ring-0 cursor-pointer pl-2 pr-7 py-1 appearance-none"
                                >
                                  {costCenters.map(cat => (
                                    <option key={cat.code} value={cat.code}>
                                      {cat.label[language as keyof typeof cat.label]}
                                    </option>
                                  ))}
                                </select>
                                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={12} />
                              </div>
                            </td>
                            <td className="px-1.5 py-1">
                              <div className="relative group/input flex items-center">
                                <input
                                  type="text"
                                  value={c.amount === '0' ? '' : (parseInt(c.amount) || 0).toLocaleString('id-ID')}
                                  disabled={isViewOnly}
                                  onChange={(e) => {
                                    const rawValue = e.target.value.replace(/\D/g, '');
                                    const newCosts = [...formData.costDetails];
                                    newCosts[idx].amount = rawValue || '0';
                                    setFormData({ ...formData, costDetails: newCosts });
                                  }}
                                  className="w-full bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-right text-slate-700 focus:ring-0 pl-2 pr-5 py-1 font-mono"
                                  placeholder="0"
                                />
                                {!isViewOnly && (
                                  <div className="absolute right-1 flex flex-col -gap-1 opacity-0 group-hover/input:opacity-100 transition-opacity">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const val = (parseInt(c.amount) || 0) + 1000000;
                                        const newCosts = [...formData.costDetails];
                                        newCosts[idx].amount = val.toString();
                                        setFormData({ ...formData, costDetails: newCosts });
                                      }}
                                      className="p-0.5 hover:text-indigo-600 transition-colors"
                                    >
                                      <ChevronUp size={10} />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const val = Math.max(0, (parseInt(c.amount) || 0) - 1000000);
                                        const newCosts = [...formData.costDetails];
                                        newCosts[idx].amount = val.toString();
                                        setFormData({ ...formData, costDetails: newCosts });
                                      }}
                                      className="p-0.5 hover:text-indigo-600 transition-colors"
                                    >
                                      <ChevronDown size={10} />
                                    </button>
                                  </div>
                                )}
                              </div>
                            </td>
                            {!isViewOnly && (
                              <td className="px-1 py-1 text-center">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newCosts = formData.costDetails.filter((_, i) => i !== idx);
                                    setFormData({ ...formData, costDetails: newCosts });
                                  }}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                                >
                                  <Trash size={12} />
                                </button>
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">{t.modal.notes}</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  disabled={isViewOnly}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all min-h-[80px]"
                  placeholder={t.modal.notesPlaceholder}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-4 pt-6 border-t border-slate-100">
                <div className="mr-auto hidden sm:block">
                  <div className="flex items-center gap-4 px-6 py-3 bg-slate-50 rounded-2xl border border-slate-100">
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{t.modal.total} {t.fields.revenueTarget}</p>
                      <p className="text-sm font-black text-emerald-600">
                        {formatRupiah(formData.revenueDetails.reduce((acc, r) => acc + (parseFloat(r.amount) || 0), 0))}
                      </p>
                    </div>
                    <div className="w-px h-8 bg-slate-200" />
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{t.modal.total} {t.fields.costTarget}</p>
                      <p className="text-sm font-black text-red-500">
                        {formatRupiah(formData.costDetails.reduce((acc, c) => acc + (parseFloat(c.amount) || 0), 0))}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    disabled={isSaving}
                    className="px-8 py-3 bg-slate-100 text-sm font-bold text-slate-500 rounded-xl hover:bg-slate-200 transition-all active:scale-95"
                  >
                    {t.modal.cancel}
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving || isViewOnly}
                    className={cn(
                      "px-10 py-3 text-sm font-bold text-white rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 min-w-[180px]",
                      isViewOnly ? "bg-slate-300 cursor-not-allowed shadow-none" : "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100"
                    )}
                  >
                    {isSaving ? <RefreshCw className="animate-spin" size={18} /> : <CheckCircle2 size={18} />}
                    {isSaving ? t.status.submitting : t.modal.submit}
                  </button>
                </div>
              </div>
            </form>
          </Modal>
        )}
      </AnimatePresence>

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!targetToDelete}
        onOpenChange={(open) => !open && setTargetToDelete(null)}
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
              onClick={() => setTargetToDelete(null)}
              className="rounded-xl border-slate-200 font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
            >
              {t.alerts.deleteCancel}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => targetToDelete && handleDelete(targetToDelete)}
              className="rounded-xl bg-rose-600 hover:bg-rose-700 font-bold shadow-lg shadow-rose-100 transition-all active:scale-95 cursor-pointer"
            >
              {isDeleting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              {isDeleting ? t.alerts.deleteDeleting : t.alerts.deleteConfirm}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

// ApprovalMonitor — Datatable for monitoring all approval requests.
// Columns: Tanggal | Permohonan (workflow.name) | Judul (approval.title) | Status | Pemohon | Aksi
// Filters: global search (title) + status dropdown
// Pagination: same pattern as CorporateManager

import React, { useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertCircle, RefreshCw, Eye, ChevronLeft, ChevronRight,
  ClipboardList, Search, FilterX,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '../../../utils/cn';
import { apiFetch } from '../../../services/financial/apiFetch';
import { useAuth } from '../../../hooks/financial/useAuth';
import { commonsI18n } from '../../../i18n/commons';
import { approvalI18n } from '../../../i18n/approval';
import { getErrorMessage } from '../../../utils/errorUtils';
import { ApprovalDetailModal } from './ApprovalDetailModal';

// ── Types ─────────────────────────────────────────────────────────────────────

interface ApprovalRecord {
  id: string;
  status: string;
  title?: string;
  requestedBy: string;
  currentStepId?: string;
  approvedBy?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt?: string;
  workflow?: {
    id: string;
    name: string;
    nameEn?: string;
    module: string;
    entityType: string;
    action: string;
  };
  requester?: {
    id: string;
    fullName: string;
    email: string;
  };
  currentStepRole?: {
    roleId: string;
    roleName?: string | null;
    roleDescription?: string | null;
  } | null;
  approvedByUser?: {
    id: string;
    fullName: string;
  } | null;
}

// ── Status Badge ──────────────────────────────────────────────────────────────

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const { language } = useAuth();
  const t = approvalI18n[language];
  const variants: Record<string, string> = {
    draft: 'bg-slate-100 text-slate-600',
    pending: 'bg-amber-100 text-amber-700',
    approved: 'bg-emerald-100 text-emerald-700',
    rejected: 'bg-rose-100 text-rose-700',
    cancelled: 'bg-slate-200 text-slate-500',
  };
  const labels: Record<string, string> = {
    draft: t.status.draft,
    pending: t.status.pending,
    approved: t.status.approved,
    rejected: t.status.rejected,
    cancelled: t.status.cancelled,
  };
  return (
    <span className={cn('px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest', variants[status] ?? 'bg-slate-100 text-slate-600')}>
      {labels[status] ?? status}
    </span>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────

export const ApprovalMonitor: React.FC = () => {
  const { language } = useAuth();
  const t = approvalI18n[language];
  const common = commonsI18n[language];

  const [data, setData] = useState<ApprovalRecord[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [filterStatus, setFilterStatus] = useState('');
  const [filterSearch, setFilterSearch] = useState('');
  const [appliedStatus, setAppliedStatus] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Detail modal
  const [selectedApprovalId, setSelectedApprovalId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (appliedStatus) params.set('status', appliedStatus);
      if (appliedSearch) params.set('search', appliedSearch);
      params.set('page', String(currentPage));
      params.set('pageSize', String(pageSize));

      const res = await apiFetch(`/api/frs/approvals?${params.toString()}`);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(getErrorMessage(err.error?.code, language));
      }
      const d = await res.json();
      setData(d.records ?? []);
      setTotalCount(d.totalCount ?? 0);
    } catch (err: any) {
      setError(err.message ?? common.errorLoadTable);
      toast.error(err.message ?? common.errorLoadTable);
    } finally {
      setIsLoading(false);
    }
  }, [appliedStatus, appliedSearch, currentPage, pageSize, language, refreshKey]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleApplyFilter = () => {
    setAppliedStatus(filterStatus);
    setAppliedSearch(filterSearch);
    setCurrentPage(1);
    // Increment refreshKey agar fetchData selalu dipanggil ulang,
    // bahkan jika filter tidak berubah (berfungsi sebagai refresh)
    setRefreshKey(k => k + 1);
  };

  const handleClearFilter = () => {
    setFilterStatus('');
    setFilterSearch('');
    setAppliedStatus('');
    setAppliedSearch('');
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  const statusOptions = [
    { value: '', label: t.filters.allStatus },
    { value: 'draft', label: t.status.draft },
    { value: 'pending', label: t.status.pending },
    { value: 'approved', label: t.status.approved },
    { value: 'rejected', label: t.status.rejected },
    { value: 'cancelled', label: t.status.cancelled },
  ];

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-100">
              <ClipboardList size={24} />
            </div>
            {t.title}
          </h1>
          <p className="text-sm text-slate-500 mt-1 ml-1">{t.subtitle}</p>
        </div>
      </div>

      {/* Filters — full width */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200/60">
        <div className="flex flex-wrap items-center gap-3">
          {/* Global search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={filterSearch}
              onChange={e => setFilterSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleApplyFilter()}
              placeholder={t.filters.searchPlaceholder}
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50/50"
            />
          </div>

          {/* Status dropdown */}
          <div className="relative">
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="appearance-none bg-white border border-slate-200 rounded-xl pl-3 pr-8 py-2 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 cursor-pointer"
            >
              {statusOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center">
              <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          {/* Apply & Clear */}
          <button
            onClick={handleApplyFilter}
            className="flex items-center gap-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-4 py-2 rounded-xl text-xs font-black transition-all active:scale-95 border border-indigo-200/50 cursor-pointer"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
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
      <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/60 border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest w-32">{t.tableHead.date}</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{language === 'id' ? 'Permohonan' : 'Request'}</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">{t.tableHead.status}</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.tableHead.requester}</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{language === 'id' ? 'Disetujui Oleh' : 'Approved By'}</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">{t.tableHead.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-sm">
              <AnimatePresence>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <motion.tr key={`sk-${i}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="animate-pulse">
                      <td className="px-6 py-4"><div className="h-5 bg-slate-100 rounded w-20" /></td>
                      <td className="px-6 py-4"><div className="h-5 bg-slate-100 rounded w-48" /></td>
                      <td className="px-6 py-4"><div className="h-5 bg-slate-100 rounded w-20 mx-auto" /></td>
                      <td className="px-6 py-4"><div className="h-5 bg-slate-100 rounded w-32" /></td>
                      <td className="px-6 py-4"><div className="h-5 bg-slate-100 rounded w-32" /></td>
                      <td className="px-6 py-4"><div className="h-5 bg-slate-100 rounded w-16 ml-auto" /></td>
                    </motion.tr>
                  ))
                ) : error ? (
                  <motion.tr key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <td colSpan={6}>
                      <div className="py-16 flex flex-col items-center gap-4 text-center">
                        <AlertCircle size={40} className="text-rose-400" />
                        <p className="text-slate-600 font-bold">{common.errorLoadTable}</p>
                        <button onClick={fetchData} className="px-5 py-2 bg-indigo-600 text-white text-xs font-black rounded-xl cursor-pointer flex items-center gap-2">
                          <RefreshCw size={13} />
                          {common.retry}
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ) : data.length === 0 ? (
                  <motion.tr key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <td colSpan={6} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <ClipboardList size={40} className="text-slate-300" />
                        <p className="text-slate-600 font-bold">{t.empty}</p>
                        <p className="text-slate-400 text-sm">{t.emptyDesc}</p>
                      </div>
                    </td>
                  </motion.tr>
                ) : (
                  data.map((item, idx) => {
                    const workflowName = language === 'en' && item.workflow?.nameEn
                      ? item.workflow.nameEn
                      : (item.workflow?.name ?? '—');

                    const approverRoleLabel = item.currentStepRole
                      ? (item.currentStepRole.roleDescription || item.currentStepRole.roleName || '—')
                      : null;

                    return (
                      <motion.tr
                        key={item.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: idx * 0.02 }}
                        className="hover:bg-slate-50/50 transition-colors group"
                      >
                        {/* Tanggal */}
                        <td className="px-6 py-4">
                          <span className="text-xs text-slate-500">
                            {new Date(item.createdAt).toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', {
                              day: '2-digit', month: 'short', year: 'numeric',
                            })}
                          </span>
                        </td>

                        {/* Permohonan — workflow.name + approval.title */}
                        <td className="px-6 py-4">
                          <p className="text-sm font-bold text-slate-700">{workflowName}</p>
                          <p className="text-xs text-slate-400 mt-0.5">{item.title ?? '—'}</p>
                        </td>

                        {/* Status + approver role jika pending */}
                        <td className="px-6 py-4 text-center">
                          <StatusBadge status={item.status} />
                          {item.status === 'pending' && approverRoleLabel && (
                            <p className="text-[10px] text-amber-600 font-bold mt-1">
                              {language === 'id' ? 'Menunggu' : 'Awaiting'}: {approverRoleLabel}
                            </p>
                          )}
                        </td>

                        {/* Pemohon */}
                        <td className="px-6 py-4">
                          <span className="text-sm font-bold text-slate-700">{item.requester?.fullName ?? '—'}</span>
                        </td>

                        {/* Disetujui Oleh */}
                        <td className="px-6 py-4">
                          {item.approvedByUser ? (
                            <div>
                              <p className="text-sm font-bold text-slate-700">{item.approvedByUser.fullName}</p>
                              {item.completedAt && (
                                <p className="text-[10px] text-slate-400 mt-0.5">
                                  {new Date(item.completedAt).toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', {
                                    day: '2-digit', month: 'short', year: 'numeric',
                                  })}
                                </p>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-slate-300">—</span>
                          )}
                        </td>

                        {/* Aksi */}
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => setSelectedApprovalId(item.id)}
                              className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all cursor-pointer"
                              title={common.view}
                            >
                              <Eye size={16} />
                            </button>
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

        {/* Pagination — same pattern as CorporateManager */}
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
                  'p-2 rounded-lg transition-all',
                  currentPage === 1 ? 'text-slate-300 cursor-not-allowed' : 'text-slate-600 hover:bg-white hover:shadow-sm active:scale-90 cursor-pointer',
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
                          'w-8 h-8 flex items-center justify-center rounded-lg text-xs font-black transition-all cursor-pointer',
                          currentPage === pageNum
                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100 scale-110'
                            : 'bg-white text-slate-600 border border-slate-200 hover:border-indigo-300',
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
                  'p-2 rounded-lg transition-all',
                  currentPage === totalPages ? 'text-slate-300 cursor-not-allowed' : 'text-slate-600 hover:bg-white hover:shadow-sm active:scale-90 cursor-pointer',
                )}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedApprovalId && (
          <ApprovalDetailModal
            approvalId={selectedApprovalId}
            onClose={() => setSelectedApprovalId(null)}
            onRefresh={fetchData}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default ApprovalMonitor;

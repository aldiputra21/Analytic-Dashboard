// UploadHistoryView.tsx — Upload history view with server-side pagination and detail modal
// Requirements: 18.1-18.10
// Task 14: Frontend Components — UploadHistoryView

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Download,
  FileSpreadsheet,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  Search,
  ChevronUp,
  ChevronDown,
  Clock,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../../hooks/financial/useAuth';
import { apiFetch } from '../../../services/financial/apiFetch';
import { exportUploadI18n } from '../../../i18n/exportUpload';
import { commonsI18n } from '../../../i18n/commons';
import { cn } from '../../../utils/cn';

// ============================================================================
// Types
// ============================================================================

export interface UploadHistoryViewProps {
  entityType: string; // e.g., "balance_sheet", "income_statement"
  hideTitle?: boolean; // Hide the title when embedded in a dialog
}

interface UploadSession {
  id: string;
  fileName: string;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  status: 'pending_review' | 'confirmed' | 'approved' | 'failed' | 'cancelled';
  createdBy: string;
  createdAt: string;
  uploaderName?: string;
}

interface UploadSessionsResponse {
  records: UploadSession[];
  totalCount: number;
  page: number;
  pageSize: number;
}

interface StagingRow {
  id?: string;
  rowNumber: number;
  rowData: Record<string, any>;
  isValid: boolean;
  errorMessages?: string[];
}

interface StagingRowsResponse {
  records: StagingRow[];
  totalCount: number;
  page: number;
  pageSize: number;
}

type SortField = 'createdAt' | 'fileName' | 'totalRows' | 'status';
type SortOrder = 'asc' | 'desc';

// ============================================================================
// Component
// ============================================================================

export const UploadHistoryView: React.FC<UploadHistoryViewProps> = ({
  entityType,
  hideTitle = false,
}) => {
  const { language } = useAuth();
  const t = exportUploadI18n[language];
  const common = commonsI18n[language];

  // ── State: Sessions List ───────────────────────────────────────────────
  const [sessions, setSessions] = useState<UploadSession[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [sortBy, setSortBy] = useState<SortField>('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [isLoading, setIsLoading] = useState(false);

  // ── State: Detail Modal ────────────────────────────────────────────────
  const [selectedSession, setSelectedSession] = useState<UploadSession | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // ── State: Detail Modal - Staging Rows ────────────────────────────────
  const [stagingRows, setStagingRows] = useState<StagingRow[]>([]);
  const [stagingTotalCount, setStagingTotalCount] = useState(0);
  const [stagingPage, setStagingPage] = useState(1);
  const [stagingPageSize] = useState(20);
  const [stagingSearch, setStagingSearch] = useState('');
  const [isLoadingStagingRows, setIsLoadingStagingRows] = useState(false);

  // ── Fetch Sessions ─────────────────────────────────────────────────────
  const fetchSessions = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
        sortBy,
        sortOrder,
      });

      const res = await apiFetch(
        `/api/frs/upload/history/${entityType}?${params.toString()}`
      );

      if (!res.ok) {
        toast.error(common.error);
        return;
      }

      const data: UploadSessionsResponse = await res.json();
      setSessions(data.records);
      setTotalCount(data.totalCount);
    } catch {
      toast.error(common.error);
    } finally {
      setIsLoading(false);
    }
  }, [entityType, page, pageSize, sortBy, sortOrder, common.error]);

  // Fetch sessions on mount and when dependencies change
  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  // ── Fetch Staging Rows (Detail Modal) ─────────────────────────────────
  const fetchStagingRows = useCallback(async () => {
    if (!selectedSession) return;

    setIsLoadingStagingRows(true);
    try {
      const params = new URLSearchParams({
        page: stagingPage.toString(),
        pageSize: stagingPageSize.toString(),
        context: 'history',
        ...(stagingSearch ? { search: stagingSearch } : {}),
      });

      const res = await apiFetch(
        `/api/frs/upload/sessions/${selectedSession.id}/rows?${params.toString()}`
      );

      if (!res.ok) {
        toast.error(common.error);
        return;
      }

      const data: StagingRowsResponse = await res.json();
      setStagingRows(data.records);
      setStagingTotalCount(data.totalCount);
    } catch {
      toast.error(common.error);
    } finally {
      setIsLoadingStagingRows(false);
    }
  }, [selectedSession, stagingPage, stagingPageSize, stagingSearch, common.error]);

  // Fetch staging rows when modal opens or dependencies change
  useEffect(() => {
    if (isDetailModalOpen && selectedSession) {
      fetchStagingRows();
    }
  }, [isDetailModalOpen, selectedSession, stagingPage, stagingSearch, fetchStagingRows]);

  // ── Handlers: Sessions List ───────────────────────────────────────────

  const handleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
    setPage(1); // Reset to first page on sort change
  };

  const handleViewDetail = (session: UploadSession) => {
    setSelectedSession(session);
    setStagingPage(1);
    setStagingSearch('');
    setIsDetailModalOpen(true);
  };

  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedSession(null);
    setStagingRows([]);
    setStagingTotalCount(0);
    setStagingPage(1);
    setStagingSearch('');
  };

  // ── Handlers: Detail Modal ─────────────────────────────────────────────

  const handleDownloadFile = async () => {
    if (!selectedSession) return;

    try {
      const res = await apiFetch(
        `/api/frs/upload/file/${selectedSession.id}?context=history`
      );

      if (!res.ok) {
        toast.error(common.error);
        return;
      }

      // Derive filename from Content-Disposition header
      const disposition = res.headers.get('Content-Disposition') ?? '';
      const filenameMatch = disposition.match(/filename[^;=\n]*=(['"]?)([^'";\n]+)\1/);
      const filename = filenameMatch ? filenameMatch[2] : selectedSession.fileName;

      // Trigger browser file download
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);
    } catch {
      toast.error(common.error);
    }
  };

  const handleStagingSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStagingSearch(e.target.value);
    setStagingPage(1); // Reset to first page on search
  };

  // ── Render Helpers ─────────────────────────────────────────────────────

  const renderStatusBadge = (status: UploadSession['status']) => {
    const statusConfig = {
      pending_review: {
        label: t.history.statusPendingReview,
        className: 'bg-amber-100 text-amber-700',
        icon: Clock,
      },
      confirmed: {
        label: t.history.statusConfirmed,
        className: 'bg-blue-100 text-blue-700',
        icon: Clock,
      },
      approved: {
        label: t.history.statusApproved,
        className: 'bg-emerald-100 text-emerald-700',
        icon: CheckCircle,
      },
      failed: {
        label: t.history.statusFailed,
        className: 'bg-rose-100 text-rose-700',
        icon: XCircle,
      },
      cancelled: {
        label: t.history.statusCancelled,
        className: 'bg-slate-100 text-slate-700',
        icon: XCircle,
      },
    };

    const config = statusConfig[status];
    const Icon = config.icon;

    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold',
          config.className
        )}
      >
        <Icon size={12} />
        {config.label}
      </span>
    );
  };

  const renderSortIcon = (field: SortField) => {
    if (sortBy !== field) return null;
    return sortOrder === 'asc' ? (
      <ChevronUp size={14} className="inline ml-1" />
    ) : (
      <ChevronDown size={14} className="inline ml-1" />
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString(language === 'id' ? 'id-ID' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // ── Render: Sessions List ──────────────────────────────────────────────

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="space-y-6">
      {/* Header */}
      {!hideTitle && (
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-black text-slate-800">{t.history.title}</h2>
        </div>
      )}

      {/* Sessions Table */}
      <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th
                  className="px-4 py-3 text-left text-xs font-black text-slate-600 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors"
                  onClick={() => handleSort('createdAt')}
                >
                  {t.history.uploadedAt}
                  {renderSortIcon('createdAt')}
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-black text-slate-600 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors"
                  onClick={() => handleSort('fileName')}
                >
                  {t.history.fileName}
                  {renderSortIcon('fileName')}
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-black text-slate-600 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors"
                  onClick={() => handleSort('totalRows')}
                >
                  {t.history.totalRows}
                  {renderSortIcon('totalRows')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-black text-slate-600 uppercase tracking-wider">
                  {t.history.validRows}
                </th>
                <th className="px-4 py-3 text-left text-xs font-black text-slate-600 uppercase tracking-wider">
                  {t.history.invalidRows}
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-black text-slate-600 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors"
                  onClick={() => handleSort('status')}
                >
                  {t.history.status}
                  {renderSortIcon('status')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-black text-slate-600 uppercase tracking-wider">
                  {t.history.uploadedBy}
                </th>
                <th className="px-4 py-3 text-left text-xs font-black text-slate-600 uppercase tracking-wider">
                  {common.actions}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center">
                    <Loader2 size={24} className="animate-spin mx-auto text-slate-400" />
                  </td>
                </tr>
              ) : sessions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-sm text-slate-500">
                    {common.noData}
                  </td>
                </tr>
              ) : (
                sessions.map((session) => (
                  <tr key={session.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-sm text-slate-700">
                      {formatDate(session.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700 font-medium">
                      {session.fileName}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700">
                      {session.totalRows}
                    </td>
                    <td className="px-4 py-3 text-sm text-emerald-700 font-bold">
                      {session.validRows}
                    </td>
                    <td className="px-4 py-3 text-sm text-rose-700 font-bold">
                      {session.invalidRows}
                    </td>
                    <td className="px-4 py-3">{renderStatusBadge(session.status)}</td>
                    <td className="px-4 py-3 text-sm text-slate-700">
                      {session.uploaderName || session.createdBy}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => handleViewDetail(session)}
                        className="text-sm font-bold text-indigo-600 hover:text-indigo-700 hover:underline transition-colors cursor-pointer"
                      >
                        {t.history.viewDetail}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-t border-slate-200">
            <p className="text-xs text-slate-500">
              {common.pagination.showing} {(page - 1) * pageSize + 1} -{' '}
              {Math.min(page * pageSize, totalCount)} {common.pagination.of} {totalCount}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-white border border-slate-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {common.pagination.previous}
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-white border border-slate-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {common.pagination.next}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {isDetailModalOpen && selectedSession && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
                <h2 className="text-xl font-black text-slate-800">
                  {t.history.detailTitle}
                </h2>
                <button
                  type="button"
                  onClick={handleCloseDetailModal}
                  className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
                {/* File Info and Download */}
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="flex items-center gap-3">
                    <FileSpreadsheet size={24} className="text-emerald-600" />
                    <div>
                      <p className="text-sm font-bold text-slate-700">
                        {t.upload.uploadedFile}
                      </p>
                      <p className="text-xs text-slate-500">{selectedSession.fileName}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleDownloadFile}
                    disabled={selectedSession.status === 'cancelled'}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-indigo-600 hover:bg-indigo-50 border border-indigo-200 transition-all text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <Download size={14} />
                    {t.upload.downloadFile}
                  </button>
                </div>

                {/* Summary Stats */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <p className="text-xs text-slate-500 mb-1">{t.upload.totalRows}</p>
                    <p className="text-2xl font-black text-slate-700">
                      {selectedSession.totalRows}
                    </p>
                  </div>
                  <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                    <p className="text-xs text-emerald-600 mb-1">{t.upload.validRows}</p>
                    <p className="text-2xl font-black text-emerald-700">
                      {selectedSession.validRows}
                    </p>
                  </div>
                  <div className="p-4 bg-rose-50 rounded-xl border border-rose-200">
                    <p className="text-xs text-rose-600 mb-1">{t.upload.invalidRows}</p>
                    <p className="text-2xl font-black text-rose-700">
                      {selectedSession.invalidRows}
                    </p>
                  </div>
                </div>

                {/* Search */}
                <div className="relative">
                  <Search
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="text"
                    value={stagingSearch}
                    onChange={handleStagingSearchChange}
                    placeholder={t.upload.searchRows}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                  />
                </div>

                {/* Staging Rows Table */}
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <div className="overflow-x-auto max-h-96">
                    <table className="w-full">
                      <thead className="bg-slate-50 sticky top-0">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-black text-slate-600 uppercase tracking-wider">
                            {t.upload.rowNumber}
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-black text-slate-600 uppercase tracking-wider">
                            {t.upload.validationStatus}
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-black text-slate-600 uppercase tracking-wider">
                            {t.upload.rowData}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {isLoadingStagingRows ? (
                          <tr>
                            <td colSpan={3} className="px-4 py-8 text-center">
                              <Loader2
                                size={24}
                                className="animate-spin mx-auto text-slate-400"
                              />
                            </td>
                          </tr>
                        ) : stagingRows.length === 0 ? (
                          <tr>
                            <td
                              colSpan={3}
                              className="px-4 py-8 text-center text-sm text-slate-500"
                            >
                              {common.noData}
                            </td>
                          </tr>
                        ) : (
                          stagingRows.map((row) => (
                            <tr key={row.id || row.rowNumber} className="hover:bg-slate-50">
                              <td className="px-4 py-3 text-sm text-slate-700">
                                {row.rowNumber}
                              </td>
                              <td className="px-4 py-3">
                                {row.isValid ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">
                                    <CheckCircle size={12} />
                                    {t.upload.rowValid}
                                  </span>
                                ) : (
                                  <div className="space-y-1">
                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-rose-100 text-rose-700 text-xs font-bold">
                                      <XCircle size={12} />
                                      {t.upload.rowInvalid}
                                    </span>
                                    {row.errorMessages && row.errorMessages.length > 0 && (
                                      <div className="text-xs text-rose-600 space-y-0.5">
                                        {row.errorMessages.map((msg, idx) => (
                                          <div
                                            key={idx}
                                            className="flex items-start gap-1"
                                          >
                                            <AlertCircle
                                              size={12}
                                              className="mt-0.5 shrink-0"
                                            />
                                            <span>{msg}</span>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </td>
                              <td className="px-4 py-3 text-xs text-slate-600 font-mono">
                                {JSON.stringify(row.rowData, null, 2).slice(0, 100)}...
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Staging Rows Pagination */}
                  {Math.ceil(stagingTotalCount / stagingPageSize) > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-t border-slate-200">
                      <p className="text-xs text-slate-500">
                        {common.pagination.showing}{' '}
                        {(stagingPage - 1) * stagingPageSize + 1} -{' '}
                        {Math.min(stagingPage * stagingPageSize, stagingTotalCount)}{' '}
                        {common.pagination.of} {stagingTotalCount}
                      </p>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setStagingPage((p) => Math.max(1, p - 1))}
                          disabled={stagingPage === 1}
                          className="px-3 py-1.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-white border border-slate-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                        >
                          {common.pagination.previous}
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setStagingPage((p) =>
                              Math.min(
                                Math.ceil(stagingTotalCount / stagingPageSize),
                                p + 1
                              )
                            )
                          }
                          disabled={
                            stagingPage ===
                            Math.ceil(stagingTotalCount / stagingPageSize)
                          }
                          className="px-3 py-1.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-white border border-slate-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                        >
                          {common.pagination.next}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end px-6 py-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={handleCloseDetailModal}
                  className="px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 border border-slate-200 transition-all font-medium text-sm cursor-pointer"
                >
                  {common.close}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UploadHistoryView;

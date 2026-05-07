// UploadDetailModal.tsx — Modal to display upload details from audit log
// Requirements: 9.7, 9.8
// Task 19.1: Add "View Detail" link for upload actions in AuditLog

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
} from 'lucide-react';
import { toast } from 'sonner';
import { apiFetch } from '../../../services/financial/apiFetch';
import { exportUploadI18n } from '../../../i18n/exportUpload';
import { commonsI18n } from '../../../i18n/commons';
import { cn } from '../../../utils/cn';

// ============================================================================
// Types
// ============================================================================

interface UploadDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  metadata: AuditLogMetadata;
  language: 'id' | 'en';
}

interface AuditLogMetadata {
  fileName: string;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  status: string;
  rows?: Array<{
    rowNumber: number;
    status: string;
    data: Record<string, any>;
  }>;
  sessionId?: string;
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

// ============================================================================
// Component
// ============================================================================

export const UploadDetailModal: React.FC<UploadDetailModalProps> = ({
  isOpen,
  onClose,
  metadata,
  language,
}) => {
  const t = exportUploadI18n[language];
  const common = commonsI18n[language];

  // ── State: Staging Rows ────────────────────────────────────────────────
  const [stagingRows, setStagingRows] = useState<StagingRow[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // ── Fetch Staging Rows ─────────────────────────────────────────────────
  const fetchStagingRows = useCallback(async () => {
    // If we have rows in metadata, use them directly (for completed uploads)
    if (metadata.rows && metadata.rows.length > 0) {
      // Convert metadata rows to staging row format
      const convertedRows: StagingRow[] = metadata.rows.map((row) => ({
        rowNumber: row.rowNumber,
        rowData: row.data,
        isValid: row.status === 'inserted',
        errorMessages: row.status !== 'inserted' ? [row.status] : undefined,
      }));

      // Apply search filter
      const filteredRows = search
        ? convertedRows.filter((row) =>
            JSON.stringify(row.rowData).toLowerCase().includes(search.toLowerCase())
          )
        : convertedRows;

      // Apply pagination
      const startIdx = (page - 1) * pageSize;
      const endIdx = startIdx + pageSize;
      const paginatedRows = filteredRows.slice(startIdx, endIdx);

      setStagingRows(paginatedRows);
      setTotalCount(filteredRows.length);
      return;
    }

    // If sessionId is available, fetch from backend
    if (!metadata.sessionId) {
      setStagingRows([]);
      setTotalCount(0);
      return;
    }

    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
        context: 'history',
        ...(search ? { search } : {}),
      });

      const res = await apiFetch(
        `/api/frs/upload/sessions/${metadata.sessionId}/rows?${params.toString()}`
      );

      if (!res.ok) {
        toast.error(common.error);
        return;
      }

      const data: StagingRowsResponse = await res.json();
      setStagingRows(data.records);
      setTotalCount(data.totalCount);
    } catch {
      toast.error(common.error);
    } finally {
      setIsLoading(false);
    }
  }, [metadata, page, pageSize, search, common.error]);

  // Fetch staging rows when modal opens or dependencies change
  useEffect(() => {
    if (isOpen) {
      fetchStagingRows();
    }
  }, [isOpen, fetchStagingRows]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setPage(1);
      setSearch('');
      setStagingRows([]);
      setTotalCount(0);
    }
  }, [isOpen]);

  // ── Handlers ───────────────────────────────────────────────────────────

  const handleDownloadFile = async () => {
    if (!metadata.sessionId) {
      toast.error(t.upload.error);
      return;
    }

    try {
      const res = await apiFetch(
        `/api/frs/upload/file/${metadata.sessionId}?context=history`
      );

      if (!res.ok) {
        toast.error(common.error);
        return;
      }

      // Derive filename from Content-Disposition header
      const disposition = res.headers.get('Content-Disposition') ?? '';
      const filenameMatch = disposition.match(/filename[^;=\n]*=(['"]?)([^'";\n]+)\1/);
      const downloadFilename = filenameMatch ? filenameMatch[2] : metadata.fileName;

      // Trigger browser file download
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = downloadFilename;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);
    } catch {
      toast.error(common.error);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1); // Reset to first page on search
  };

  // ── Render ─────────────────────────────────────────────────────────────

  const totalPages = Math.ceil(totalCount / pageSize);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
            <h2 className="text-xl font-black text-slate-800">
              {t.history.detailTitle}
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X size={20} className="text-slate-500" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* File Info and Download */}
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex items-center gap-3">
                <FileSpreadsheet size={24} className="text-emerald-600" />
                <div>
                  <p className="text-sm font-bold text-slate-700">
                    {t.upload.uploadedFile}
                  </p>
                  <p className="text-xs text-slate-500">{metadata.fileName}</p>
                </div>
              </div>
              {metadata.sessionId && (
                <button
                  type="button"
                  onClick={handleDownloadFile}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-indigo-600 hover:bg-indigo-50 border border-indigo-200 transition-all text-sm font-medium"
                >
                  <Download size={14} />
                  {t.upload.downloadFile}
                </button>
              )}
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <p className="text-xs text-slate-500 mb-1">{t.upload.totalRows}</p>
                <p className="text-2xl font-black text-slate-700">
                  {metadata.totalRows}
                </p>
              </div>
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                <p className="text-xs text-emerald-600 mb-1">{t.upload.validRows}</p>
                <p className="text-2xl font-black text-emerald-700">
                  {metadata.validRows}
                </p>
              </div>
              <div className="p-4 bg-rose-50 rounded-xl border border-rose-200">
                <p className="text-xs text-rose-600 mb-1">{t.upload.invalidRows}</p>
                <p className="text-2xl font-black text-rose-700">
                  {metadata.invalidRows}
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
                value={search}
                onChange={handleSearchChange}
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
                    {isLoading ? (
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
                        <tr
                          key={row.id || row.rowNumber}
                          className="hover:bg-slate-50"
                        >
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
                                      <div key={idx} className="flex items-start gap-1">
                                        <AlertCircle size={12} className="mt-0.5 shrink-0" />
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

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-t border-slate-200">
                  <p className="text-xs text-slate-500">
                    {common.pagination.showing} {(page - 1) * pageSize + 1} -{' '}
                    {Math.min(page * pageSize, totalCount)} {common.pagination.of}{' '}
                    {totalCount}
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="px-3 py-1.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-white border border-slate-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {common.pagination.previous}
                    </button>
                    <button
                      type="button"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="px-3 py-1.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-white border border-slate-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {common.pagination.next}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              {common.close}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default UploadDetailModal;

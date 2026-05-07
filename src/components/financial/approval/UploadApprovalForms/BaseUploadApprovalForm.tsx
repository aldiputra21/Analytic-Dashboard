// BaseUploadApprovalForm.tsx — Shared base component for all Upload Approval Forms
// Requirements: 17.1-17.7
// Task 18.1: Create Upload Approval Form components

import React, { useState, useEffect, useCallback } from 'react';
import {
  Download,
  FileSpreadsheet,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  Search,
} from 'lucide-react';
import { toast } from 'sonner';
import { apiFetch } from '../../../../services/financial/apiFetch';
import { exportUploadI18n } from '../../../../i18n/exportUpload';
import { commonsI18n } from '../../../../i18n/commons';
import { cn } from '../../../../utils/cn';
import type { ApprovalFormProps } from '../formRegistry';

// ============================================================================
// Types
// ============================================================================

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

export const BaseUploadApprovalForm: React.FC<ApprovalFormProps> = ({
  payload,
  readOnly,
  language,
}) => {
  const t = exportUploadI18n[language];
  const common = commonsI18n[language];

  // Extract session data from payload
  const sessionId = payload.sessionId as string;
  const fileName = payload.fileName as string;
  const totalRows = payload.totalRows as number;
  const validRows = payload.validRows as number;
  const invalidRows = payload.invalidRows as number;

  // ── State: Staging Rows ────────────────────────────────────────────────
  const [stagingRows, setStagingRows] = useState<StagingRow[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // ── Fetch Staging Rows ─────────────────────────────────────────────────
  const fetchStagingRows = useCallback(async () => {
    if (!sessionId) return;

    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
        context: 'review',
        ...(search ? { search } : {}),
      });

      const res = await apiFetch(
        `/api/frs/upload/sessions/${sessionId}/rows?${params.toString()}`
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
  }, [sessionId, page, pageSize, search, common.error]);

  // Fetch staging rows on mount and when dependencies change
  useEffect(() => {
    fetchStagingRows();
  }, [fetchStagingRows]);

  // ── Handlers ───────────────────────────────────────────────────────────

  const handleDownloadFile = async () => {
    if (!sessionId) return;

    try {
      const res = await apiFetch(
        `/api/frs/upload/file/${sessionId}?context=review`
      );

      if (!res.ok) {
        toast.error(common.error);
        return;
      }

      // Derive filename from Content-Disposition header
      const disposition = res.headers.get('Content-Disposition') ?? '';
      const filenameMatch = disposition.match(/filename[^;=\n]*=(['"]?)([^'";\n]+)\1/);
      const downloadFilename = filenameMatch ? filenameMatch[2] : fileName;

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

  return (
    <div className="space-y-6">
      {/* File Info and Download */}
      <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
        <div className="flex items-center gap-3">
          <FileSpreadsheet size={24} className="text-emerald-600" />
          <div>
            <p className="text-sm font-bold text-slate-700">{t.upload.uploadedFile}</p>
            <p className="text-xs text-slate-500">{fileName}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleDownloadFile}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-indigo-600 hover:bg-indigo-50 border border-indigo-200 transition-all text-sm font-medium"
        >
          <Download size={14} />
          {t.upload.downloadFile}
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
          <p className="text-xs text-slate-500 mb-1">{t.upload.totalRows}</p>
          <p className="text-2xl font-black text-slate-700">{totalRows}</p>
        </div>
        <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
          <p className="text-xs text-emerald-600 mb-1">{t.upload.validRows}</p>
          <p className="text-2xl font-black text-emerald-700">{validRows}</p>
        </div>
        <div className="p-4 bg-rose-50 rounded-xl border border-rose-200">
          <p className="text-xs text-rose-600 mb-1">{t.upload.invalidRows}</p>
          <p className="text-2xl font-black text-rose-700">{invalidRows}</p>
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
          disabled={readOnly}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm disabled:bg-slate-50 disabled:cursor-not-allowed"
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
                    <Loader2 size={24} className="animate-spin mx-auto text-slate-400" />
                  </td>
                </tr>
              ) : stagingRows.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-sm text-slate-500">
                    {common.noData}
                  </td>
                </tr>
              ) : (
                stagingRows.map((row) => (
                  <tr key={row.id || row.rowNumber} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-sm text-slate-700">{row.rowNumber}</td>
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
              {Math.min(page * pageSize, totalCount)} {common.pagination.of} {totalCount}
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
  );
};

export default BaseUploadApprovalForm;

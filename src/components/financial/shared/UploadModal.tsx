// UploadModal.tsx — 3-step modal for bulk data upload via Excel template
// Requirements: 3.4-3.10, 6.1-6.12, 7.1, 12.1-12.2
// Task 13: Frontend Components — UploadModal

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Upload,
  Download,
  FileSpreadsheet,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  Search,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../../hooks/financial/useAuth';
import { useApproval } from '../../../hooks/financial/useApproval';
import { apiFetch } from '../../../services/financial/apiFetch';
import { exportUploadI18n } from '../../../i18n/exportUpload';
import { commonsI18n } from '../../../i18n/commons';
import { cn } from '../../../utils/cn';

// ============================================================================
// Types
// ============================================================================

interface UploadModalProps {
  entityType: string;
  isOpen: boolean;
  onClose: () => void;
  onUploadComplete: () => void;
}

interface UploadSession {
  sessionId: string;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  preview: StagingRow[];
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

type Step = 'select' | 'review' | 'approval';

// ============================================================================
// Component
// ============================================================================

export const UploadModal: React.FC<UploadModalProps> = ({
  entityType,
  isOpen,
  onClose,
  onUploadComplete,
}) => {
  const { language } = useAuth();
  const t = exportUploadI18n[language];
  const common = commonsI18n[language];

  // Check if approval workflow is active
  const { hasWorkflow, isChecking: isCheckingWorkflow } = useApproval(
    'cfd',
    `${entityType}_upload`,
    'upload'
  );

  // ── State ──────────────────────────────────────────────────────────────
  const [currentStep, setCurrentStep] = useState<Step>('select');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

  // Upload session data
  const [session, setSession] = useState<UploadSession | null>(null);

  // Review step - pagination and search
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [search, setSearch] = useState('');
  const [stagingRows, setStagingRows] = useState<StagingRow[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoadingRows, setIsLoadingRows] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Reset state when modal closes ─────────────────────────────────────
  useEffect(() => {
    if (!isOpen) {
      // Reset all state when modal closes
      setCurrentStep('select');
      setSelectedFile(null);
      setSession(null);
      setPage(1);
      setSearch('');
      setStagingRows([]);
      setTotalCount(0);
    }
  }, [isOpen]);

  // ── Fetch staging rows (Step 2) ───────────────────────────────────────
  const fetchStagingRows = useCallback(async () => {
    if (!session) return;

    setIsLoadingRows(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
        ...(search ? { search } : {}),
      });

      const res = await apiFetch(
        `/api/frs/upload/sessions/${session.sessionId}/rows?${params.toString()}`
      );

      if (!res.ok) {
        toast.error(t.upload.error);
        return;
      }

      const data: StagingRowsResponse = await res.json();
      setStagingRows(data.records);
      setTotalCount(data.totalCount);
    } catch {
      toast.error(t.upload.error);
    } finally {
      setIsLoadingRows(false);
    }
  }, [session, page, pageSize, search, t.upload.error]);

  // Fetch rows when session, page, or search changes
  useEffect(() => {
    if (currentStep === 'review' && session) {
      fetchStagingRows();
    }
  }, [currentStep, session, page, search, fetchStagingRows]);

  // ── Step 1: File Selection Handlers ───────────────────────────────────

  const handleDownloadTemplate = async () => {
    setIsDownloadingTemplate(true);
    try {
      const res = await apiFetch(`/api/frs/upload/template/${entityType}`);

      if (!res.ok) {
        toast.error(t.upload.errorTemplateFileNotFound);
        return;
      }

      // Derive filename from Content-Disposition header
      const disposition = res.headers.get('Content-Disposition') ?? '';
      const filenameMatch = disposition.match(/filename[^;=\n]*=(['"]?)([^'";\n]+)\1/);
      const filename = filenameMatch
        ? filenameMatch[2]
        : `${entityType}_template.xlsx`;

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
      toast.error(t.upload.errorTemplateFileNotFound);
    } finally {
      setIsDownloadingTemplate(false);
    }
  };

  const validateFile = (file: File): boolean => {
    // Requirement 3.9: validate extension
    const ext = file.name.toLowerCase().split('.').pop();
    if (ext !== 'xlsx') {
      toast.error(t.upload.errorInvalidExtension);
      return false;
    }

    // Requirement 3.10: validate size (10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error(t.upload.errorFileTooLarge);
      return false;
    }

    return true;
  };

  const handleFileSelect = (file: File) => {
    if (!validateFile(file)) return;
    setSelectedFile(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleUploadFile = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const res = await apiFetch(`/api/frs/upload/${entityType}`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const error = await res.json();
        if (error.error?.code === 'INVALID_INPUT') {
          toast.error(t.upload.errorAllRowsInvalid);
        } else {
          toast.error(t.upload.error);
        }
        return;
      }

      const data: UploadSession = await res.json();
      setSession(data);
      setCurrentStep('review');
    } catch {
      toast.error(t.upload.error);
    } finally {
      setIsUploading(false);
    }
  };

  // ── Step 2: Review Handlers ───────────────────────────────────────────

  const handleDownloadUploadedFile = async () => {
    if (!session) return;

    try {
      const res = await apiFetch(
        `/api/frs/upload/file/${session.sessionId}?context=review`
      );

      if (!res.ok) {
        toast.error(common.error);
        return;
      }

      // Derive filename from Content-Disposition header
      const disposition = res.headers.get('Content-Disposition') ?? '';
      const filenameMatch = disposition.match(/filename[^;=\n]*=(['"]?)([^'";\n]+)\1/);
      const filename = filenameMatch ? filenameMatch[2] : selectedFile?.name ?? 'upload.xlsx';

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

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1); // Reset to first page on search
  };

  const handleConfirmUpload = async () => {
    if (!session) return;

    // Requirement 6.9: disable confirm if invalid rows exist
    if (session.invalidRows > 0) {
      toast.error(t.upload.invalidRowsWarning);
      return;
    }

    setIsConfirming(true);
    try {
      const res = await apiFetch(
        `/api/frs/upload/sessions/${session.sessionId}/confirm`,
        {
          method: 'POST',
        }
      );

      if (!res.ok) {
        toast.error(t.upload.error);
        return;
      }

      const data = await res.json();

      // Requirement 7.1: if workflow active, redirect to approval
      if (data.approvalId && hasWorkflow) {
        toast.success(t.upload.success);
        // Step 3: Approval - in this case, we just close the modal
        // The user can view the approval in the Approval Management page
        onClose();
        onUploadComplete();
      } else {
        // Direct insert completed
        toast.success(t.upload.success);
        onClose();
        onUploadComplete();
      }
    } catch {
      toast.error(t.upload.error);
    } finally {
      setIsConfirming(false);
    }
  };

  const handleCancel = async () => {
    // Requirement 6.12: if no session, just close modal
    if (!session) {
      onClose();
      return;
    }

    // Requirement 6.11: delete session and staging rows
    setIsCancelling(true);
    try {
      const res = await apiFetch(
        `/api/frs/upload/sessions/${session.sessionId}/cancel`,
        {
          method: 'POST',
        }
      );

      if (!res.ok) {
        toast.error(t.upload.cancelError);
        return;
      }

      toast.success(t.upload.cancelSuccess);
      onClose();
    } catch {
      toast.error(t.upload.cancelError);
    } finally {
      setIsCancelling(false);
    }
  };

  // ── Render Helpers ─────────────────────────────────────────────────────

  const renderStepIndicator = () => {
    const steps = [
      { key: 'select', label: t.upload.stepSelectFile },
      { key: 'review', label: t.upload.stepReview },
    ];

    return (
      <div className="flex items-center justify-center gap-2 mb-6">
        {steps.map((step, index) => {
          const isActive = currentStep === step.key;
          const isCompleted =
            (step.key === 'select' && currentStep !== 'select') ||
            (step.key === 'review' && currentStep === 'approval');

          return (
            <React.Fragment key={step.key}>
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all',
                    isActive && 'bg-emerald-500 text-white',
                    isCompleted && 'bg-emerald-100 text-emerald-700',
                    !isActive && !isCompleted && 'bg-slate-100 text-slate-400'
                  )}
                >
                  {isCompleted ? <CheckCircle size={16} /> : index + 1}
                </div>
                <span
                  className={cn(
                    'text-sm font-medium transition-all',
                    isActive && 'text-slate-800',
                    !isActive && 'text-slate-400'
                  )}
                >
                  {step.label}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    'w-12 h-0.5 transition-all',
                    isCompleted ? 'bg-emerald-500' : 'bg-slate-200'
                  )}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    );
  };

  const renderStep1FileSelection = () => (
    <div className="space-y-6">
      {/* Download Template Button */}
      <div className="flex justify-center">
        <button
          type="button"
          onClick={handleDownloadTemplate}
          disabled={isDownloadingTemplate}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm cursor-pointer"
        >
          {isDownloadingTemplate ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Download size={16} />
          )}
          {t.upload.downloadTemplate}
        </button>
      </div>

      {/* Drag and Drop Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          'border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all',
          isDragging
            ? 'border-emerald-500 bg-emerald-50'
            : 'border-slate-300 bg-slate-50 hover:border-emerald-400 hover:bg-emerald-50/50'
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx"
          onChange={handleFileInputChange}
          className="hidden"
        />

        <div className="flex flex-col items-center gap-4">
          <div
            className={cn(
              'w-16 h-16 rounded-full flex items-center justify-center transition-all',
              isDragging ? 'bg-emerald-100' : 'bg-slate-100'
            )}
          >
            <Upload
              size={32}
              className={cn(
                'transition-all',
                isDragging ? 'text-emerald-600' : 'text-slate-400'
              )}
            />
          </div>

          <div>
            <p className="text-base font-bold text-slate-700 mb-1">
              {t.upload.selectFile}
            </p>
            <p className="text-sm text-slate-500">{t.upload.fileInfo}</p>
          </div>

          {selectedFile && (
            <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg border border-slate-200">
              <FileSpreadsheet size={20} className="text-emerald-600" />
              <div className="text-left">
                <p className="text-sm font-medium text-slate-700">
                  {selectedFile.name}
                </p>
                <p className="text-xs text-slate-500">
                  {(selectedFile.size / 1024).toFixed(2)} KB
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Upload Button */}
      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 border border-slate-200 transition-all font-medium text-sm cursor-pointer"
        >
          {common.cancel}
        </button>
        <button
          type="button"
          onClick={handleUploadFile}
          disabled={!selectedFile || isUploading}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm cursor-pointer"
        >
          {isUploading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              {common.loading}
            </>
          ) : (
            <>
              <Upload size={16} />
              {common.submit}
            </>
          )}
        </button>
      </div>
    </div>
  );

  const renderStep2Review = () => {
    if (!session) return null;

    const totalPages = Math.ceil(totalCount / pageSize);

    return (
      <div className="space-y-6">
        {/* File Info and Download */}
        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
          <div className="flex items-center gap-3">
            <FileSpreadsheet size={24} className="text-emerald-600" />
            <div>
              <p className="text-sm font-bold text-slate-700">
                {t.upload.uploadedFile}
              </p>
              <p className="text-xs text-slate-500">{selectedFile?.name}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleDownloadUploadedFile}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-indigo-600 hover:bg-indigo-50 border border-indigo-200 transition-all text-sm font-medium cursor-pointer"
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
              {session.totalRows}
            </p>
          </div>
          <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
            <p className="text-xs text-emerald-600 mb-1">{t.upload.validRows}</p>
            <p className="text-2xl font-black text-emerald-700">
              {session.validRows}
            </p>
          </div>
          <div className="p-4 bg-rose-50 rounded-xl border border-rose-200">
            <p className="text-xs text-rose-600 mb-1">{t.upload.invalidRows}</p>
            <p className="text-2xl font-black text-rose-700">
              {session.invalidRows}
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
                {isLoadingRows ? (
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

        {/* Warning for invalid rows */}
        {session.invalidRows > 0 && (
          <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-xl border border-amber-200">
            <AlertCircle size={20} className="text-amber-600 shrink-0 mt-0.5" />
            <p className="text-sm text-amber-700">{t.upload.invalidRowsWarning}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={handleCancel}
            disabled={isCancelling}
            className="px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 border border-slate-200 transition-all font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isCancelling ? (
              <>
                <Loader2 size={16} className="animate-spin inline mr-2" />
                {t.upload.cancelling}
              </>
            ) : (
              common.cancel
            )}
          </button>
          <button
            type="button"
            onClick={handleConfirmUpload}
            disabled={session.invalidRows > 0 || isConfirming || isCheckingWorkflow}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm cursor-pointer"
          >
            {isConfirming ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                {common.saving}
              </>
            ) : (
              <>
                <CheckCircle size={16} />
                {t.upload.confirmUpload}
              </>
            )}
          </button>
        </div>
      </div>
    );
  };

  // ── Main Render ────────────────────────────────────────────────────────

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
            <h2 className="text-xl font-black text-slate-800">
              {t.upload.title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-6 py-6">
            {renderStepIndicator()}

            {currentStep === 'select' && renderStep1FileSelection()}
            {currentStep === 'review' && renderStep2Review()}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default UploadModal;

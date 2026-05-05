// ApprovalDetailModal — 3-tab modal for viewing/acting on an approval.
// Tab 1: Form Data (editable in draft, read-only otherwise)
// Tab 2: Approval History (timeline)
// Tab 3: Data Change History (payload versions)

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, CheckCircle, XCircle, Clock, FileText, History,
  GitCompare, RefreshCw, AlertCircle, ChevronRight, User,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '../../../utils/cn';
import { apiFetch } from '../../../services/financial/apiFetch';
import { useAuth } from '../../../hooks/financial/useAuth';
import { commonsI18n } from '../../../i18n/commons';
import { approvalI18n } from '../../../i18n/approval';
import { FORM_REGISTRY } from './formRegistry';
import { getErrorMessage } from '../../../utils/errorUtils';

// ── Types ─────────────────────────────────────────────────────────────────────

interface ApprovalHistory {
  id: string;
  action: string;
  actedBy: string;
  comments?: string;
  payload?: Record<string, unknown>;
  createdAt: string;
  actor?: { id: string; fullName: string; email: string } | null;
  stepId?: string;
}

interface ApprovalStep {
  id: string;
  stepOrder: number;
  stepType: string;
  requiredRole: string;
  isActive: boolean;
}

interface ApprovalWorkflow {
  id: string;
  name: string;
  module: string;
  entityType: string;
  action: string;
  viewComponent: string;
}

interface ApprovalDetail {
  id: string;
  status: string;
  title?: string;
  payload: Record<string, unknown>;
  originalData?: Record<string, unknown>;
  subject: Record<string, unknown>;
  requestedBy: string;
  currentStepId?: string;
  corporateId?: string;
  createdAt: string;
  updatedAt?: string;
  completedAt?: string;
  rejectionNotes?: string;
  workflow?: ApprovalWorkflow;
  steps?: ApprovalStep[];
  histories?: ApprovalHistory[];
  // Computed by backend based on current user's roles
  canApprove?: boolean;
  canCancel?: boolean;
}

interface Props {
  approvalId: string;
  onClose: () => void;
  onRefresh?: () => void;
}

// ── Status Badge ──────────────────────────────────────────────────────────────

const StatusBadge: React.FC<{ status: string; t: ReturnType<typeof approvalI18n['id']['status']['draft'] extends string ? () => typeof approvalI18n['id'] : never> }> = ({ status }) => {
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
    <span className={cn('px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest', variants[status] ?? 'bg-slate-100 text-slate-600')}>
      {labels[status] ?? status}
    </span>
  );
};

// ── Timeline Item ─────────────────────────────────────────────────────────────

const TimelineItem: React.FC<{ history: ApprovalHistory; t: typeof approvalI18n['id'] }> = ({ history, t }) => {
  const actionColors: Record<string, string> = {
    created: 'bg-slate-100 text-slate-600',
    submit: 'bg-blue-100 text-blue-700',
    approve: 'bg-emerald-100 text-emerald-700',
    reject: 'bg-rose-100 text-rose-700',
    cancel: 'bg-slate-200 text-slate-500',
  };
  const actionLabels: Record<string, string> = {
    created: t.timeline.created,
    submit: t.timeline.submit,
    approve: t.timeline.approve,
    reject: t.timeline.reject,
    cancel: t.timeline.cancel,
  };

  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div className={cn('w-8 h-8 rounded-full flex items-center justify-center shrink-0', actionColors[history.action] ?? 'bg-slate-100 text-slate-600')}>
          <User size={14} />
        </div>
        <div className="w-px flex-1 bg-slate-200 mt-1" />
      </div>
      <div className="pb-6 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold text-sm text-slate-800">{history.actor?.fullName ?? history.actedBy.slice(0, 8)}</span>
          <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-black uppercase', actionColors[history.action] ?? 'bg-slate-100')}>
            {actionLabels[history.action] ?? history.action}
          </span>
          <span className="text-xs text-slate-400">{new Date(history.createdAt).toLocaleString()}</span>
        </div>
        {history.comments && (
          <p className="mt-1 text-sm text-slate-600 bg-slate-50 rounded-lg px-3 py-2 border border-slate-100">{history.comments}</p>
        )}
      </div>
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────

export const ApprovalDetailModal: React.FC<Props> = ({ approvalId, onClose, onRefresh }) => {
  const { user, language, hasPermission } = useAuth();
  const t = approvalI18n[language];
  const common = commonsI18n[language];

  const [detail, setDetail] = useState<ApprovalDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'form' | 'history' | 'data-history'>('form');
  const [activeSubTab, setActiveSubTab] = useState<'request' | 'original'>('request');

  // Action states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);

  // Modal states for reject/cancel
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [rejectNotes, setRejectNotes] = useState('');
  const [cancelNotes, setCancelNotes] = useState('');

  // Diff modal state
  const [diffEntry, setDiffEntry] = useState<{
    current: Record<string, unknown>;
    previous: Record<string, unknown> | null;
    submittedBy: string;
    submittedAt: string;
    version: number;
  } | null>(null);
  const [diffSubTab, setDiffSubTab] = useState<'current' | 'previous'>('current');

  // Editable payload for draft mode
  const [editablePayload, setEditablePayload] = useState<Record<string, unknown>>({});

  const fetchDetail = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiFetch(`/api/frs/approvals/${approvalId}`);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(getErrorMessage(err.error?.code, language));
      }
      const data: ApprovalDetail = await res.json();
      setDetail(data);
      setEditablePayload({ ...(data.payload ?? {}) });
    } catch (err: any) {
      setError(err.message ?? common.errorLoadTable);
    } finally {
      setIsLoading(false);
    }
  }, [approvalId, language]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const isOwner = detail?.requestedBy === user?.id;
  const isDraft = detail?.status === 'draft';
  const isPending = detail?.status === 'pending';

  // canApprove & canCancel dihitung di backend berdasarkan role user — bukan permission key
  const canApproveCurrentStep = detail?.canApprove ?? false;
  const canCancelApproval = detail?.canCancel ?? false;

  const handleFieldChange = (field: string, value: unknown) => {
    setEditablePayload(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!detail) return;
    setIsSubmitting(true);
    try {
      const res = await apiFetch(`/api/frs/approvals/${approvalId}/submit`, {
        method: 'POST',
        body: JSON.stringify({ payload: editablePayload }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(getErrorMessage(err.error?.code, language) || t.toast.errorSubmit);
      }
      toast.success(t.toast.submitted);
      onRefresh?.();
      fetchDetail();
    } catch (err: any) {
      toast.error(err.message ?? t.toast.errorSubmit);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApprove = async () => {
    setIsApproving(true);
    try {
      const res = await apiFetch(`/api/frs/approvals/${approvalId}/approve`, {
        method: 'POST',
        body: JSON.stringify({}),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(getErrorMessage(err.error?.code, language) || t.toast.errorApprove);
      }
      toast.success(t.toast.approved);
      onRefresh?.();
      fetchDetail();
    } catch (err: any) {
      toast.error(err.message ?? t.toast.errorApprove);
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async () => {
    if (!rejectNotes.trim()) {
      toast.error(t.validation.notesRequired);
      return;
    }
    setIsRejecting(true);
    try {
      const res = await apiFetch(`/api/frs/approvals/${approvalId}/reject`, {
        method: 'POST',
        body: JSON.stringify({ notes: rejectNotes }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(getErrorMessage(err.error?.code, language) || t.toast.errorReject);
      }
      toast.success(t.toast.rejected);
      setShowRejectModal(false);
      setRejectNotes('');
      onRefresh?.();
      fetchDetail();
    } catch (err: any) {
      toast.error(err.message ?? t.toast.errorReject);
    } finally {
      setIsRejecting(false);
    }
  };

  const handleCancel = async () => {
    if (!cancelNotes.trim()) {
      toast.error(t.validation.notesRequired);
      return;
    }
    setIsCancelling(true);
    try {
      const res = await apiFetch(`/api/frs/approvals/${approvalId}/cancel`, {
        method: 'POST',
        body: JSON.stringify({ notes: cancelNotes }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(getErrorMessage(err.error?.code, language) || t.toast.errorCancel);
      }
      toast.success(t.toast.cancelled);
      setShowCancelModal(false);
      setCancelNotes('');
      onRefresh?.();
      onClose();
    } catch (err: any) {
      toast.error(err.message ?? t.toast.errorCancel);
    } finally {
      setIsCancelling(false);
    }
  };

  // Resolve form component from registry
  const FormComponent = detail?.workflow?.viewComponent
    ? FORM_REGISTRY[detail.workflow.viewComponent]
    : null;

  // Payload histories (only submit/resubmit actions)
  const payloadHistories = detail?.histories?.filter(h => h.payload != null) ?? [];

  const tabs = [
    { id: 'form' as const, label: t.tabs.formData, icon: FileText },
    { id: 'history' as const, label: t.tabs.approvalHistory, icon: History },
    { id: 'data-history' as const, label: t.tabs.dataHistory, icon: GitCompare },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px]">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-indigo-100 text-indigo-600 rounded-lg">
              <CheckCircle size={18} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">{detail?.title ?? t.title}</h3>
              {detail && <StatusBadge status={detail.status} t={undefined as any} />}
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors cursor-pointer">
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-100 bg-white shrink-0 px-6">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 transition-colors cursor-pointer',
                  activeTab === tab.id
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700',
                )}
              >
                <Icon size={15} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="p-8 flex items-center justify-center">
              <RefreshCw size={24} className="animate-spin text-indigo-400" />
            </div>
          ) : error ? (
            <div className="p-8 flex flex-col items-center gap-4 text-center">
              <AlertCircle size={40} className="text-rose-400" />
              <p className="text-slate-600 font-medium">{error}</p>
              <button onClick={fetchDetail} className="px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-xl cursor-pointer">
                {common.retry}
              </button>
            </div>
          ) : detail ? (
            <>
              {/* Tab 1: Form Data */}
              {activeTab === 'form' && (
                <div className="px-6 pb-6">
                  {/* Sub-tabs for edit action */}
                  {detail.originalData && (
                    <div className="flex gap-2 mb-6 pt-6">
                      {(['request', 'original'] as const).map(sub => (
                        <button
                          key={sub}
                          onClick={() => setActiveSubTab(sub)}
                          className={cn(
                            'px-4 py-2 text-sm font-bold rounded-xl transition-colors cursor-pointer',
                            activeSubTab === sub ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
                          )}
                        >
                          {sub === 'request' ? t.subTabs.requestData : t.subTabs.originalData}
                        </button>
                      ))}
                    </div>
                  )}

                  {FormComponent ? (
                    <div className={detail.originalData ? '' : 'pt-6'}>
                      <FormComponent
                        payload={activeSubTab === 'original' && detail.originalData ? detail.originalData : (isDraft ? editablePayload : detail.payload)}
                        originalData={detail.originalData}
                        onChange={isDraft && isOwner ? handleFieldChange : undefined}
                        readOnly={!isDraft || !isOwner || activeSubTab === 'original'}
                        language={language}
                      />
                    </div>
                  ) : (
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 mt-6">
                      <p className="text-xs font-bold text-slate-500 uppercase mb-2">Payload</p>
                      <pre className="text-xs text-slate-700 overflow-auto">{JSON.stringify(detail.payload, null, 2)}</pre>
                    </div>
                  )}

                  {/* Rejection notes banner */}
                  {detail.rejectionNotes && isDraft && (
                    <div className="mt-4 p-4 bg-rose-50 border border-rose-200 rounded-xl flex gap-3">
                      <XCircle size={18} className="text-rose-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-bold text-rose-700">Alasan Penolakan</p>
                        <p className="text-sm text-rose-600 mt-1">{detail.rejectionNotes}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 2: Approval History */}
              {activeTab === 'history' && (
                <div className="p-6">
                  {(detail.histories?.length ?? 0) === 0 ? (
                    <p className="text-slate-500 text-sm text-center py-8">{t.empty}</p>
                  ) : (
                    <div className="space-y-0">
                      {detail.histories!.map(h => (
                        <TimelineItem key={h.id} history={h} t={t} />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Tab 3: Data Change History */}
              {activeTab === 'data-history' && (
                <div className="p-6">
                  {payloadHistories.length === 0 ? (
                    <p className="text-slate-500 text-sm text-center py-8">{t.modal.noPayloadHistory}</p>
                  ) : (
                    <div className="space-y-3">
                      {payloadHistories.map((h, idx) => (
                        <div key={h.id} className="bg-slate-50 rounded-xl border border-slate-200 p-4 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="w-7 h-7 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center text-xs font-black">
                              {idx + 1}
                            </span>
                            <div>
                              <p className="text-sm font-bold text-slate-700">{h.actor?.fullName ?? h.actedBy.slice(0, 8)}</p>
                              <p className="text-xs text-slate-400">{new Date(h.createdAt).toLocaleString()}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              const prev = payloadHistories[idx - 1]?.payload ?? null;
                              setDiffEntry({
                                current: h.payload!,
                                previous: prev,
                                submittedBy: h.actor?.fullName ?? h.actedBy.slice(0, 8),
                                submittedAt: h.createdAt,
                                version: idx + 1,
                              });
                              setDiffSubTab('current');
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-xs font-bold text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                          >
                            <GitCompare size={13} />
                            {t.actions.viewDiff}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          ) : null}
        </div>

        {/* Action Bar */}
        {detail && (
          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2">
              {/* Cancel button — only draft + canCancel */}
              {isDraft && canCancelApproval && (
                <button
                  onClick={() => setShowCancelModal(true)}
                  disabled={isCancelling}
                  className="px-4 py-2 text-sm font-bold text-rose-600 bg-rose-50 border border-rose-200 rounded-xl hover:bg-rose-100 transition-all cursor-pointer"
                >
                  {t.actions.cancelApproval}
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="px-5 py-2.5 bg-white border border-slate-200 text-sm font-bold text-slate-600 rounded-xl hover:bg-slate-50 transition-all cursor-pointer"
              >
                {common.close}
              </button>

              {/* Submit / Resubmit — draft + owner */}
              {isDraft && isOwner && (
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="px-6 py-2.5 text-sm font-black text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all active:scale-95 flex items-center gap-2 cursor-pointer disabled:cursor-not-allowed"
                >
                  {isSubmitting ? <RefreshCw size={16} className="animate-spin" /> : <ChevronRight size={16} />}
                  {detail.histories?.some(h => h.action === 'reject') ? t.actions.resubmit : t.actions.submitRequest}
                </button>
              )}

              {/* Approve / Reject — pending + approver */}
              {isPending && canApproveCurrentStep && (
                <>
                  <button
                    onClick={() => setShowRejectModal(true)}
                    disabled={isRejecting}
                    className="px-5 py-2.5 text-sm font-bold text-rose-600 bg-rose-50 border border-rose-200 rounded-xl hover:bg-rose-100 transition-all cursor-pointer"
                  >
                    {common.reject}
                  </button>
                  <button
                    onClick={handleApprove}
                    disabled={isApproving}
                    className="px-6 py-2.5 text-sm font-black text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 shadow-lg shadow-emerald-100 transition-all active:scale-95 flex items-center gap-2 cursor-pointer disabled:cursor-not-allowed"
                  >
                    {isApproving ? <RefreshCw size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                    {common.approve}
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </motion.div>

      {/* Reject Modal */}
      <AnimatePresence>
        {showRejectModal && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6"
            >
              <h4 className="text-lg font-bold text-slate-800 mb-4">{t.modal.rejectTitle}</h4>
              <label className="text-xs font-bold text-slate-500 uppercase">{t.modal.rejectNotesLabel}</label>
              <textarea
                value={rejectNotes}
                onChange={e => setRejectNotes(e.target.value)}
                placeholder={t.modal.rejectNotesPlaceholder}
                rows={4}
                className="w-full mt-2 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none resize-none"
              />
              <div className="flex justify-end gap-2 mt-4">
                <button onClick={() => { setShowRejectModal(false); setRejectNotes(''); }} className="px-4 py-2 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-xl cursor-pointer">
                  {common.cancel}
                </button>
                <button onClick={handleReject} disabled={isRejecting} className="px-5 py-2 text-sm font-black text-white bg-rose-600 rounded-xl hover:bg-rose-700 cursor-pointer flex items-center gap-2">
                  {isRejecting ? <RefreshCw size={14} className="animate-spin" /> : null}
                  {common.reject}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Cancel Modal */}
      <AnimatePresence>
        {showCancelModal && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6"
            >
              <h4 className="text-lg font-bold text-slate-800 mb-4">{t.modal.cancelTitle}</h4>
              <label className="text-xs font-bold text-slate-500 uppercase">{t.modal.cancelNotesLabel}</label>
              <textarea
                value={cancelNotes}
                onChange={e => setCancelNotes(e.target.value)}
                placeholder={t.modal.cancelNotesPlaceholder}
                rows={4}
                className="w-full mt-2 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-slate-500/20 focus:border-slate-500 outline-none resize-none"
              />
              <div className="flex justify-end gap-2 mt-4">
                <button onClick={() => { setShowCancelModal(false); setCancelNotes(''); }} className="px-4 py-2 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-xl cursor-pointer">
                  {common.cancel}
                </button>
                <button onClick={handleCancel} disabled={isCancelling} className="px-5 py-2 text-sm font-black text-white bg-slate-700 rounded-xl hover:bg-slate-800 cursor-pointer flex items-center gap-2">
                  {isCancelling ? <RefreshCw size={14} className="animate-spin" /> : null}
                  {t.actions.cancelApproval}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Diff Modal — tampilkan payload versi tertentu dalam FormComponent */}
      <AnimatePresence>
        {diffEntry && FormComponent && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 bg-indigo-100 text-indigo-600 rounded-lg">
                    <GitCompare size={16} />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-slate-800">{t.modal.diffTitle}</h4>
                    <p className="text-xs text-slate-400">
                      {t.tableHead.version} {diffEntry.version} · {diffEntry.submittedBy} · {new Date(diffEntry.submittedAt).toLocaleString()}
                    </p>
                  </div>
                </div>
                <button onClick={() => setDiffEntry(null)} className="p-2 hover:bg-slate-200 rounded-full transition-colors cursor-pointer">
                  <X size={18} className="text-slate-500" />
                </button>
              </div>

              {/* Sub-tabs: Versi Ini vs Versi Sebelumnya */}
              <div className="flex border-b border-slate-100 bg-white shrink-0 px-6">
                <button
                  onClick={() => setDiffSubTab('current')}
                  className={cn(
                    'px-4 py-3 text-sm font-bold border-b-2 transition-colors cursor-pointer',
                    diffSubTab === 'current' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700',
                  )}
                >
                  {t.modal.compareVersion} ({t.tableHead.version} {diffEntry.version})
                </button>
                {diffEntry.previous && (
                  <button
                    onClick={() => setDiffSubTab('previous')}
                    className={cn(
                      'px-4 py-3 text-sm font-bold border-b-2 transition-colors cursor-pointer',
                      diffSubTab === 'previous' ? 'border-slate-600 text-slate-600' : 'border-transparent text-slate-500 hover:text-slate-700',
                    )}
                  >
                    {t.modal.previousVersion} ({t.tableHead.version} {diffEntry.version - 1})
                  </button>
                )}
              </div>

              {/* Form content — read-only */}
              <div className="flex-1 overflow-y-auto p-6">
                <FormComponent
                  payload={diffSubTab === 'previous' && diffEntry.previous ? diffEntry.previous : diffEntry.current}
                  readOnly
                  language={language}
                />
              </div>

              <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-end shrink-0">
                <button
                  onClick={() => setDiffEntry(null)}
                  className="px-5 py-2.5 bg-white border border-slate-200 text-sm font-bold text-slate-600 rounded-xl hover:bg-slate-50 cursor-pointer"
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

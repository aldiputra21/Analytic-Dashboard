// useApproval — Hook for integrating modules with the dynamic approval system.
//
// Scope check (corporateId/departmentId) dilakukan sepenuhnya di backend
// berdasarkan accessContext user dari JWT — BUKAN dari konten form.
// Ini memastikan scope selalu berdasarkan identitas user, bukan input form,
// sehingga modul yang tidak punya field corporateId/departmentId tetap bisa
// diintegrasikan dengan benar.
//
// Usage: const { hasWorkflow, isChecking, createDraft, submitDraft } =
//          useApproval('cfd', 'balance_sheet', 'create');

import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../../services/financial/apiFetch';

export interface ApprovalWorkflow {
  id: string;
  module: string;
  entityType: string;
  action: string;
  name: string;
  viewComponent: string;
  subjectFields: Array<{
    field: string;
    label: string;
    type: 'string' | 'currency' | 'date' | 'number';
  }>;
  isActive: boolean;
}

export interface CreateDraftParams {
  payload: Record<string, unknown>;
  entityId?: string;
  originalData?: Record<string, unknown>;
  files?: File[];
}

export interface SubmitDraftParams {
  payload: Record<string, unknown>;
  files?: File[];
  removedFileIds?: string[];
}

export function useApproval(module: string, entityType: string, action: string) {
  const [workflow, setWorkflow] = useState<ApprovalWorkflow | null>(null);
  const [canCreate, setCanCreate] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(() => {
    setIsChecking(true);
    setError(null);

    const params = new URLSearchParams({ module, entityType, action });

    apiFetch(`/api/frs/approval-configs/can-create?${params.toString()}`)
      .then(res => res.json())
      .then((data: { canCreate: boolean; workflow: ApprovalWorkflow | null }) => {
        setCanCreate(data.canCreate);
        setWorkflow(data.workflow);
      })
      .catch(err => {
        setError(err?.message ?? 'Failed to check approval workflow');
        setCanCreate(false);
        setWorkflow(null);
      })
      .finally(() => {
        setIsChecking(false);
      });
  }, [module, entityType, action]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  /**
   * Create a new approval draft.
   * corporateId/departmentId TIDAK dikirim — backend mengambilnya dari accessContext user.
   */
  const createDraft = useCallback(async (params: CreateDraftParams) => {
    if (!workflow) throw new Error('No active workflow found');

    const hasFiles = params.files && params.files.length > 0;

    if (hasFiles) {
      const formData = new FormData();
      formData.append('workflowId', workflow.id);
      formData.append('payload', JSON.stringify(params.payload));
      if (params.entityId) formData.append('entityId', params.entityId);
      if (params.originalData) formData.append('originalData', JSON.stringify(params.originalData));
      params.files!.forEach(f => formData.append('files', f));

      const res = await apiFetch('/api/frs/approvals', { method: 'POST', body: formData });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message ?? 'Failed to create draft');
      }
      return res.json();
    } else {
      const res = await apiFetch('/api/frs/approvals', {
        method: 'POST',
        body: JSON.stringify({
          workflowId: workflow.id,
          payload: params.payload,
          entityId: params.entityId,
          originalData: params.originalData,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message ?? 'Failed to create draft');
      }
      return res.json();
    }
  }, [workflow]);

  /**
   * Submit an existing draft to the approver.
   */
  const submitDraft = useCallback(async (approvalId: string, params: SubmitDraftParams) => {
    const hasFiles = params.files && params.files.length > 0;

    if (hasFiles) {
      const formData = new FormData();
      formData.append('payload', JSON.stringify(params.payload));
      if (params.removedFileIds) formData.append('removedFileIds', JSON.stringify(params.removedFileIds));
      params.files!.forEach(f => formData.append('files', f));

      const res = await apiFetch(`/api/frs/approvals/${approvalId}/submit`, { method: 'POST', body: formData });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message ?? 'Failed to submit draft');
      }
      return res.json();
    } else {
      const res = await apiFetch(`/api/frs/approvals/${approvalId}/submit`, {
        method: 'POST',
        body: JSON.stringify({ payload: params.payload }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message ?? 'Failed to submit draft');
      }
      return res.json();
    }
  }, []);

  return {
    workflow,
    // hasWorkflow = true hanya jika workflow aktif DAN user punya makerRole di scope yang sesuai
    hasWorkflow: canCreate && !!workflow?.isActive,
    isChecking,
    error,
    createDraft,
    submitDraft,
    /** Re-fetch status dari server — panggil saat modal dibuka untuk memastikan state terkini */
    recheck: fetchStatus,
  };
}

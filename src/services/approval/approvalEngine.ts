// Approval Engine
// Core lifecycle functions for the dynamic approval system.
// All approval state transitions go through this engine.
// Access control is role-based via approval_workflows.maker_role and
// approval_workflow_steps.required_role, validated against user_corporate_accesses
// (role + corporate/department scope).

import { and, asc, eq, or } from 'drizzle-orm';
import { db } from '../../db/connection';
import {
  approvals,
  approvalWorkflows,
  approvalWorkflowSteps,
  approvalHistories,
  userCorporateAccesses,
} from '../../db/schema';
import { invokeCallback } from './callbackRegistry';
import { notifyApprovers, notifyMaker } from './approvalNotificationService';
import { AppError, ErrorCode } from '../../utils/errors';

// ── Types ────────────────────────────────────────────────────────────────────

export interface CreateDraftParams {
  workflowKey: {
    module: string;
    entityType: string;
    action: string;
  };
  entityId?: string;
  payload: Record<string, unknown>;
  originalData?: Record<string, unknown>;
  requestedBy: string;
  departmentId?: string;
  corporateId?: string;
}

export interface SubmitDraftParams {
  approvalId: string;
  payload: Record<string, unknown>;
  requestedBy: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Extract subject values from payload using dot-notation field paths.
 * Builds a flat subject object and a human-readable title string.
 */
function buildSubjectAndTitle(
  workflow: typeof approvalWorkflows.$inferSelect,
  payload: Record<string, unknown>,
): { subject: Record<string, unknown>; title: string } {
  const subjectFields = (workflow.subjectFields ?? []) as Array<{
    field: string;
    label: string;
    type: 'string' | 'currency' | 'date' | 'number';
  }>;

  const subject: Record<string, unknown> = {};
  const titleParts: string[] = [workflow.name];

  for (const sf of subjectFields) {
    // Support dot-notation: "corporate.name"
    const keys = sf.field.split('.');
    let value: unknown = payload;
    for (const key of keys) {
      if (value && typeof value === 'object') {
        value = (value as Record<string, unknown>)[key];
      } else {
        value = undefined;
        break;
      }
    }
    if (value !== undefined && value !== null) {
      subject[sf.field] = value;
      titleParts.push(String(value));
    }
  }

  return {
    subject,
    title: titleParts.join(' - '),
  };
}

/**
 * Verify that a user has a specific role within the correct scope.
 *
 * Scope resolution:
 * - If departmentId is provided → check role at department scope
 * - Else if corporateId is provided → check role at corporate OR system scope
 * - Else → check role at system scope only
 *
 * This mirrors how user_corporate_accesses works: a user can have the same
 * role at different scopes (system / corporate / department).
 */
async function verifyUserHasRole(
  userId: string,
  roleId: string,
  corporateId?: string | null,
  departmentId?: string | null,
): Promise<boolean> {
  // Build scope conditions — user must have the role in a scope that covers
  // the approval's corporate/department context.
  const scopeConditions = [];

  // System scope always covers everything
  scopeConditions.push(
    and(
      eq(userCorporateAccesses.scope, 'system'),
    )!,
  );

  if (corporateId) {
    // Corporate scope covers this corporate (and all its departments)
    scopeConditions.push(
      and(
        eq(userCorporateAccesses.scope, 'corporate'),
        eq(userCorporateAccesses.corporateId, corporateId),
      )!,
    );
  }

  if (departmentId) {
    // Department scope — must match both corporate and department
    const deptConditions = [
      eq(userCorporateAccesses.scope, 'department'),
      eq(userCorporateAccesses.departmentId, departmentId),
    ];
    if (corporateId) {
      deptConditions.push(eq(userCorporateAccesses.corporateId, corporateId));
    }
    scopeConditions.push(and(...deptConditions)!);
  }

  const [access] = await db.select({ id: userCorporateAccesses.id })
    .from(userCorporateAccesses)
    .where(and(
      eq(userCorporateAccesses.userId, userId),
      eq(userCorporateAccesses.roleId, roleId),
      or(...scopeConditions),
    ))
    .limit(1);

  return !!access;
}

// ── Core Lifecycle Functions ─────────────────────────────────────────────────

/**
 * Create a new approval draft.
 * Validates that requestedBy has the makerRole for this workflow
 * within the correct corporate/department scope.
 * Status: 'draft'
 */
export async function createDraft(params: CreateDraftParams) {
  const { workflowKey, entityId, payload, originalData, requestedBy, departmentId, corporateId } = params;

  // Lookup workflow
  const [workflow] = await db.select()
    .from(approvalWorkflows)
    .where(and(
      eq(approvalWorkflows.module, workflowKey.module),
      eq(approvalWorkflows.entityType, workflowKey.entityType),
      eq(approvalWorkflows.action, workflowKey.action),
      eq(approvalWorkflows.isActive, true),
    ))
    .limit(1);

  if (!workflow) {
    throw AppError.notFound(
      ErrorCode.NOT_FOUND,
      `No active workflow found for ${workflowKey.module}.${workflowKey.entityType}.${workflowKey.action}`,
    );
  }

  // Verify maker role + scope
  const isMaker = await verifyUserHasRole(requestedBy, workflow.makerRole, corporateId, departmentId);
  if (!isMaker) {
    throw AppError.forbidden(
      ErrorCode.ACCESS_DENIED,
      'You do not have the required role to create a draft for this workflow',
    );
  }

  const { subject, title } = buildSubjectAndTitle(workflow, payload);

  const [draft] = await db.insert(approvals).values({
    workflowId: workflow.id,
    entityId: entityId ?? null,
    payload,
    originalData: originalData ?? null,
    subject,
    title,
    status: 'draft',
    requestedBy,
    departmentId: departmentId ?? null,
    corporateId: corporateId ?? null,
  }).returning();

  // Record 'created' history (no step yet — draft has no active approver step)
  await db.insert(approvalHistories).values({
    approvalId: draft.id,
    stepId: null,
    action: 'created',
    actedBy: requestedBy,
    payload: null,
  });

  return draft;
}

/**
 * Submit a draft to the first approver step.
 * Validates ownership AND maker role + scope.
 * Status: 'draft' → 'pending'
 */
export async function submitDraft(params: SubmitDraftParams) {
  const { approvalId, payload, requestedBy } = params;

  const [approval] = await db.select().from(approvals).where(eq(approvals.id, approvalId)).limit(1);
  if (!approval) {
    throw AppError.notFound(ErrorCode.NOT_FOUND, 'Approval not found');
  }

  // Ownership check
  if (approval.requestedBy !== requestedBy) {
    throw AppError.forbidden(ErrorCode.ACCESS_DENIED, 'Only the maker can submit this approval');
  }

  if (approval.status !== 'draft') {
    throw AppError.badRequest(
      ErrorCode.VALIDATION_ERROR,
      `Cannot submit approval with status '${approval.status}'. Only 'draft' can be submitted.`,
    );
  }

  // Get workflow
  const [workflow] = await db.select()
    .from(approvalWorkflows)
    .where(eq(approvalWorkflows.id, approval.workflowId))
    .limit(1);
  if (!workflow) throw AppError.notFound(ErrorCode.NOT_FOUND, 'Workflow not found');

  // Re-verify maker role + scope (in case role was revoked between draft and submit)
  const isMaker = await verifyUserHasRole(
    requestedBy,
    workflow.makerRole,
    approval.corporateId,
    approval.departmentId,
  );
  if (!isMaker) {
    throw AppError.forbidden(
      ErrorCode.ACCESS_DENIED,
      'You no longer have the required role to submit this approval',
    );
  }

  // Get first active step
  const steps = await db.select()
    .from(approvalWorkflowSteps)
    .where(and(
      eq(approvalWorkflowSteps.workflowId, approval.workflowId),
      eq(approvalWorkflowSteps.isActive, true),
    ))
    .orderBy(asc(approvalWorkflowSteps.stepOrder));

  if (steps.length === 0) {
    throw AppError.badRequest(ErrorCode.VALIDATION_ERROR, 'Workflow has no active steps');
  }

  const firstStep = steps[0];

  // Recompute subject + title from new payload
  const { subject, title } = buildSubjectAndTitle(workflow, payload);

  const [updated] = await db.update(approvals)
    .set({
      payload,
      subject,
      title,
      status: 'pending',
      currentStepId: firstStep.id,
      updatedAt: new Date(),
    })
    .where(eq(approvals.id, approvalId))
    .returning();

  // Record 'submit' history with payload snapshot
  await db.insert(approvalHistories).values({
    approvalId,
    stepId: firstStep.id,
    action: 'submit',
    actedBy: requestedBy,
    payload,
  });

  // Notify approvers
  await notifyApprovers(approvalId, firstStep.id);

  return updated;
}

/**
 * Approve the current step.
 * Validates approver role + scope.
 * If last step: finalize → invoke callback.
 * If not last step: advance to next step.
 */
export async function processApprove(
  approvalId: string,
  actedBy: string,
  comments?: string,
) {
  const [approval] = await db.select().from(approvals).where(eq(approvals.id, approvalId)).limit(1);
  if (!approval) throw AppError.notFound(ErrorCode.NOT_FOUND, 'Approval not found');
  if (approval.status !== 'pending') {
    throw AppError.badRequest(ErrorCode.VALIDATION_ERROR, `Cannot approve approval with status '${approval.status}'`);
  }
  if (!approval.currentStepId) {
    throw AppError.badRequest(ErrorCode.VALIDATION_ERROR, 'Approval has no current step');
  }

  const [currentStep] = await db.select()
    .from(approvalWorkflowSteps)
    .where(eq(approvalWorkflowSteps.id, approval.currentStepId))
    .limit(1);
  if (!currentStep) throw AppError.notFound(ErrorCode.NOT_FOUND, 'Current step not found');

  // Verify approver role + scope
  const hasRole = await verifyUserHasRole(
    actedBy,
    currentStep.requiredRole,
    approval.corporateId,
    approval.departmentId,
  );
  if (!hasRole) {
    throw AppError.forbidden(
      ErrorCode.ACCESS_DENIED,
      'You do not have the required role to approve this step',
    );
  }

  // Deduplication: check if this step was already approved
  const [alreadyApproved] = await db.select({ id: approvalHistories.id })
    .from(approvalHistories)
    .where(and(
      eq(approvalHistories.approvalId, approvalId),
      eq(approvalHistories.stepId, approval.currentStepId),
      eq(approvalHistories.action, 'approve'),
    ))
    .limit(1);

  if (alreadyApproved) {
    throw AppError.badRequest(ErrorCode.VALIDATION_ERROR, 'This step has already been approved');
  }

  // Get all steps to determine if this is the last one
  const allSteps = await db.select()
    .from(approvalWorkflowSteps)
    .where(and(
      eq(approvalWorkflowSteps.workflowId, approval.workflowId),
      eq(approvalWorkflowSteps.isActive, true),
    ))
    .orderBy(asc(approvalWorkflowSteps.stepOrder));

  const currentIndex = allSteps.findIndex(s => s.id === approval.currentStepId);
  const nextStep = allSteps[currentIndex + 1];

  if (nextStep) {
    // Not final step — record history + advance step in one transaction
    const updated = await db.transaction(async (tx) => {
      await tx.insert(approvalHistories).values({
        approvalId,
        stepId: approval.currentStepId!,
        action: 'approve',
        actedBy,
        comments: comments ?? null,
        payload: null,
      });

      const [result] = await tx.update(approvals)
        .set({ currentStepId: nextStep.id, updatedAt: new Date() })
        .where(eq(approvals.id, approvalId))
        .returning();

      return result;
    });

    await notifyApprovers(approvalId, nextStep.id);
    return updated;
  } else {
    // Final step — record history + update status + invoke callback, all atomic.
    // If callback fails, the transaction rolls back so status stays 'pending'.
    const [workflow] = await db.select()
      .from(approvalWorkflows)
      .where(eq(approvalWorkflows.id, approval.workflowId))
      .limit(1);

    const finalized = await db.transaction(async (tx) => {
      // 1. Record approve history
      await tx.insert(approvalHistories).values({
        approvalId,
        stepId: approval.currentStepId!,
        action: 'approve',
        actedBy,
        comments: comments ?? null,
        payload: null,
      });

      // 2. Update approval status to 'approved'
      const [result] = await tx.update(approvals)
        .set({
          status: 'approved',
          approvedBy: actedBy,
          completedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(approvals.id, approvalId))
        .returning();

      // 3. Invoke callback — if this throws, the entire transaction rolls back
      if (workflow) {
        await invokeCallback(
          workflow.callbackHandler,
          approval.payload as Record<string, unknown>,
          approval.entityId ?? undefined,
          undefined,
          approval.requestedBy,
        );
      }

      return result;
    });

    await notifyMaker(approvalId, 'approved', actedBy);
    return finalized;
  }
}

/**
 * Reject the current step.
 * Validates approver role + scope.
 * Status: 'pending' → 'draft' (back to maker for revision)
 */
export async function processReject(
  approvalId: string,
  actedBy: string,
  comments: string,
) {
  const [approval] = await db.select().from(approvals).where(eq(approvals.id, approvalId)).limit(1);
  if (!approval) throw AppError.notFound(ErrorCode.NOT_FOUND, 'Approval not found');
  if (approval.status !== 'pending') {
    throw AppError.badRequest(ErrorCode.VALIDATION_ERROR, `Cannot reject approval with status '${approval.status}'`);
  }
  if (!approval.currentStepId) {
    throw AppError.badRequest(ErrorCode.VALIDATION_ERROR, 'Approval has no current step');
  }

  const [currentStep] = await db.select()
    .from(approvalWorkflowSteps)
    .where(eq(approvalWorkflowSteps.id, approval.currentStepId))
    .limit(1);
  if (!currentStep) throw AppError.notFound(ErrorCode.NOT_FOUND, 'Current step not found');

  // Verify approver role + scope
  const hasRole = await verifyUserHasRole(
    actedBy,
    currentStep.requiredRole,
    approval.corporateId,
    approval.departmentId,
  );
  if (!hasRole) {
    throw AppError.forbidden(
      ErrorCode.ACCESS_DENIED,
      'You do not have the required role to reject this step',
    );
  }

  await db.insert(approvalHistories).values({
    approvalId,
    stepId: approval.currentStepId,
    action: 'reject',
    actedBy,
    comments,
    payload: null,
  });

  const [updated] = await db.update(approvals)
    .set({
      status: 'draft',
      rejectionNotes: comments,
      currentStepId: null,
      updatedAt: new Date(),
    })
    .where(eq(approvals.id, approvalId))
    .returning();

  await notifyMaker(approvalId, 'rejected', actedBy);
  return updated;
}

/**
 * Cancel an approval.
 * Validates ownership AND maker role + scope.
 * Only allowed in 'draft' status.
 */
export async function cancelApproval(
  approvalId: string,
  cancelledBy: string,
  notes: string,
) {
  const [approval] = await db.select().from(approvals).where(eq(approvals.id, approvalId)).limit(1);
  if (!approval) throw AppError.notFound(ErrorCode.NOT_FOUND, 'Approval not found');

  if (approval.status === 'pending') {
    throw AppError.badRequest(
      ErrorCode.VALIDATION_ERROR,
      'Cannot cancel a pending approval. Please reject it first.',
    );
  }
  if (approval.status !== 'draft') {
    throw AppError.badRequest(
      ErrorCode.VALIDATION_ERROR,
      `Cannot cancel approval with status '${approval.status}'`,
    );
  }

  // Ownership check
  if (approval.requestedBy !== cancelledBy) {
    throw AppError.forbidden(ErrorCode.ACCESS_DENIED, 'Only the maker can cancel this approval');
  }

  // Re-verify maker role + scope
  const [workflow] = await db.select()
    .from(approvalWorkflows)
    .where(eq(approvalWorkflows.id, approval.workflowId))
    .limit(1);

  if (workflow) {
    const isMaker = await verifyUserHasRole(
      cancelledBy,
      workflow.makerRole,
      approval.corporateId,
      approval.departmentId,
    );
    if (!isMaker) {
      throw AppError.forbidden(
        ErrorCode.ACCESS_DENIED,
        'You no longer have the required role to cancel this approval',
      );
    }
  }

  await db.insert(approvalHistories).values({
    approvalId,
    stepId: null,
    action: 'cancel',
    actedBy: cancelledBy,
    comments: notes,
    payload: null,
  });

  const [updated] = await db.update(approvals)
    .set({ status: 'cancelled', updatedAt: new Date() })
    .where(eq(approvals.id, approvalId))
    .returning();

  await notifyMaker(approvalId, 'cancelled', cancelledBy);
  return updated;
}

/**
 * Check if a user can create a draft for a given workflow.
 * Used by frontend hook to determine if approval flow is applicable.
 */
export async function canUserCreateDraft(
  userId: string,
  module: string,
  entityType: string,
  action: string,
  corporateId?: string,
  departmentId?: string,
): Promise<{ canCreate: boolean; workflow: typeof approvalWorkflows.$inferSelect | null }> {
  const [workflow] = await db.select()
    .from(approvalWorkflows)
    .where(and(
      eq(approvalWorkflows.module, module),
      eq(approvalWorkflows.entityType, entityType),
      eq(approvalWorkflows.action, action),
      eq(approvalWorkflows.isActive, true),
    ))
    .limit(1);

  if (!workflow) return { canCreate: false, workflow: null };

  const canCreate = await verifyUserHasRole(userId, workflow.makerRole, corporateId, departmentId);
  return { canCreate, workflow };
}

/**
 * Get approval detail with histories and workflow info.
 */
export async function getApprovalDetail(approvalId: string) {
  const [approval] = await db.select().from(approvals).where(eq(approvals.id, approvalId)).limit(1);
  if (!approval) return null;

  const [workflow] = await db.select()
    .from(approvalWorkflows)
    .where(eq(approvalWorkflows.id, approval.workflowId))
    .limit(1);

  const steps = await db.select()
    .from(approvalWorkflowSteps)
    .where(eq(approvalWorkflowSteps.workflowId, approval.workflowId))
    .orderBy(asc(approvalWorkflowSteps.stepOrder));

  const histories = await db.select()
    .from(approvalHistories)
    .where(eq(approvalHistories.approvalId, approvalId))
    .orderBy(asc(approvalHistories.createdAt));

  return { approval, workflow, steps, histories };
}

// Approval Notification Service
// Sends notifications to approvers and makers based on approval lifecycle events.

import { and, eq, inArray } from 'drizzle-orm';
import { db } from '../../db/connection';
import {
  approvals,
  approvalWorkflows,
  approvalWorkflowSteps,
  approvalHistories,
  userCorporateAccesses,
  users,
} from '../../db/schema';
import { createNotification } from '../financial/notificationService';

/**
 * Notify all users with the required role for the current step.
 * Deduplicates: if someone already approved this step, skip sending.
 */
export async function notifyApprovers(approvalId: string, stepId: string): Promise<void> {
  try {
    const [approval] = await db.select().from(approvals).where(eq(approvals.id, approvalId)).limit(1);
    if (!approval) return;

    const [step] = await db.select().from(approvalWorkflowSteps).where(eq(approvalWorkflowSteps.id, stepId)).limit(1);
    if (!step) return;

    // Ambil workflow name untuk templateVars
    const [workflow] = await db.select({ name: approvalWorkflows.name, nameEn: approvalWorkflows.nameEn })
      .from(approvalWorkflows)
      .where(eq(approvalWorkflows.id, approval.workflowId))
      .limit(1);

    // Check if this step was already approved (deduplication)
    const existingApprove = await db.select({ id: approvalHistories.id })
      .from(approvalHistories)
      .where(and(
        eq(approvalHistories.approvalId, approvalId),
        eq(approvalHistories.stepId, stepId),
        eq(approvalHistories.action, 'approve'),
      ))
      .limit(1);

    if (existingApprove.length > 0) return; // Already approved, skip

    // Find all users with the required role in the same scope
    const roleConditions = [eq(userCorporateAccesses.roleId, step.requiredRole)];
    if (approval.corporateId) {
      roleConditions.push(eq(userCorporateAccesses.corporateId, approval.corporateId));
    }

    const approverUsers = await db.selectDistinct({ userId: userCorporateAccesses.userId })
      .from(userCorporateAccesses)
      .innerJoin(users, and(
        eq(users.id, userCorporateAccesses.userId),
        eq(users.isActive, true),
      ))
      .where(and(...roleConditions));

    // Send notification to each approver
    for (const { userId } of approverUsers) {
      if (userId === approval.requestedBy) continue; // Don't notify the maker
      await createNotification({
        sourceModule: 'approval',
        sourceEntityType: 'approval',
        sourceEntityId: approvalId,
        recipientUserId: userId,
        category: 'approval',
        templateKey: 'approval.pending_review',
        templateVars: {
          approvalId,
          workflowName: workflow?.name ?? '',
          workflowNameEn: workflow?.nameEn ?? workflow?.name ?? '',
          title: approval.title ?? '',
          stepName: step.requiredRole,
        },
        payload: { approvalId, stepId },
        severity: 'medium',
        createdBy: approval.requestedBy,
      }).catch(() => { /* ignore duplicate notification errors */ });
    }
  } catch (err) {
    console.error('[ApprovalNotification] notifyApprovers error:', err);
  }
}

/**
 * Notify the maker about approval outcome (approved / rejected / cancelled).
 */
export async function notifyMaker(
  approvalId: string,
  action: 'approved' | 'rejected' | 'cancelled',
  actedBy: string,
): Promise<void> {
  try {
    const [approval] = await db.select().from(approvals).where(eq(approvals.id, approvalId)).limit(1);
    if (!approval) return;

    // Ambil workflow name untuk templateVars
    const [workflow] = await db.select({ name: approvalWorkflows.name, nameEn: approvalWorkflows.nameEn })
      .from(approvalWorkflows)
      .where(eq(approvalWorkflows.id, approval.workflowId))
      .limit(1);

    const templateKey = `approval.${action}`;

    await createNotification({
      sourceModule: 'approval',
      sourceEntityType: 'approval',
      sourceEntityId: approvalId,
      recipientUserId: approval.requestedBy,
      category: 'approval',
      templateKey,
      templateVars: {
        approvalId,
        workflowName: workflow?.name ?? '',
        workflowNameEn: workflow?.nameEn ?? workflow?.name ?? '',
        title: approval.title ?? '',
        action,
      },
      payload: { approvalId, action },
      severity: action === 'rejected' ? 'high' : 'medium',
      createdBy: actedBy,
    }).catch(() => { /* ignore duplicate notification errors */ });
  } catch (err) {
    console.error('[ApprovalNotification] notifyMaker error:', err);
  }
}

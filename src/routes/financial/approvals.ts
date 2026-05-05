// Approvals Router
// Access control is role-based via approval_workflows.maker_role and
// approval_workflow_steps.required_role — NOT via permission keys.
// The only permission used is 'approvals.read' for the monitoring menu.
//
// Monitoring visibility rules:
// - User hanya melihat approval yang relevan dengan role mereka:
//   maker_role (bisa buat/lihat draft) ATAU required_role di salah satu step (bisa approve)
// - System scope: lihat semua
// - Corporate/Department scope: filter berdasarkan corporate_id/department_id

import { Router, Request, Response } from 'express';
import { and, asc, desc, eq, ilike, inArray, isNull, or, sql } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../../db/connection';
import {
  approvals,
  approvalWorkflows,
  approvalWorkflowSteps,
  userCorporateAccesses,
  users,
} from '../../db/schema';
import { requirePermission } from '../../middleware/rbac';
import { asyncHandler } from '../../utils/asyncHandler';
import { AppError, ErrorCode } from '../../utils/errors';
import {
  createDraft,
  submitDraft,
  processApprove,
  processReject,
  cancelApproval,
  getApprovalDetail,
} from '../../services/approval/approvalEngine';

// ── Helper: verify user has a role in the correct scope ──────────────────────

async function verifyUserHasRoleForApproval(
  userId: string,
  roleId: string,
  corporateId?: string | null,
  departmentId?: string | null,
): Promise<boolean> {
  const scopeConditions = [and(eq(userCorporateAccesses.scope, 'system'))!];
  if (corporateId) {
    scopeConditions.push(and(eq(userCorporateAccesses.scope, 'corporate'), eq(userCorporateAccesses.corporateId, corporateId))!);
  }
  if (departmentId) {
    const deptConds = [eq(userCorporateAccesses.scope, 'department'), eq(userCorporateAccesses.departmentId, departmentId)];
    if (corporateId) deptConds.push(eq(userCorporateAccesses.corporateId, corporateId));
    scopeConditions.push(and(...deptConds)!);
  }
  const [access] = await db.select({ id: userCorporateAccesses.id })
    .from(userCorporateAccesses)
    .where(and(eq(userCorporateAccesses.userId, userId), eq(userCorporateAccesses.roleId, roleId), or(...scopeConditions)))
    .limit(1);
  return !!access;
}

// ── Validation Schemas ────────────────────────────────────────────────────────

const createDraftSchema = z.object({
  workflowId: z.string().uuid().optional(),
  module: z.string().optional(),
  entityType: z.string().optional(),
  action: z.string().optional(),
  entityId: z.string().uuid().optional(),
  payload: z.record(z.string(), z.unknown()),
  originalData: z.record(z.string(), z.unknown()).optional(),
  // corporateId & departmentId TIDAK diterima dari body — diambil dari accessContext user
});

const submitSchema = z.object({
  payload: z.record(z.string(), z.unknown()),
});

const approveSchema = z.object({
  comments: z.string().optional(),
});

const rejectSchema = z.object({
  notes: z.string().min(1, 'Rejection notes are required'),
});

const cancelSchema = z.object({
  notes: z.string().min(1, 'Cancellation notes are required'),
});

// ── Helper: get role IDs accessible by user ───────────────────────────────────

async function getUserRoleIds(userId: string): Promise<string[]> {
  const accesses = await db.select({ roleId: userCorporateAccesses.roleId })
    .from(userCorporateAccesses)
    .where(eq(userCorporateAccesses.userId, userId));
  return [...new Set(accesses.map(a => a.roleId))];
}

// ── Router ────────────────────────────────────────────────────────────────────

export function createApprovalsRouter(): Router {
  const router = Router();

  // GET /api/frs/approvals
  // Monitoring — requires 'approvals.read'.
  // Filter: hanya approval yang relevan dengan role user (maker_role atau required_role di steps).
  router.get('/', requirePermission('approvals.read'), asyncHandler(async (req: Request, res: Response) => {
    const {
      status,
      search,
      page = '1',
      pageSize = '20',
    } = req.query;

    const userId = req.user!.userId;
    const access = req.accessContext;
    const conditions = [];

    // ── Role-based visibility filter ──────────────────────────────────────────
    // User hanya melihat approval dari workflow di mana mereka punya maker_role
    // ATAU required_role di salah satu step.
    if (access?.scope !== 'system') {
      const userRoleIds = await getUserRoleIds(userId);

      if (userRoleIds.length > 0) {
        // Workflow IDs di mana user punya maker_role
        const makerWorkflows = await db.select({ id: approvalWorkflows.id })
          .from(approvalWorkflows)
          .where(inArray(approvalWorkflows.makerRole, userRoleIds));

        // Workflow IDs di mana user punya required_role di salah satu step
        const approverWorkflows = await db.selectDistinct({ workflowId: approvalWorkflowSteps.workflowId })
          .from(approvalWorkflowSteps)
          .where(inArray(approvalWorkflowSteps.requiredRole, userRoleIds));

        const visibleWorkflowIds = [
          ...new Set([
            ...makerWorkflows.map(w => w.id),
            ...approverWorkflows.map(w => w.workflowId),
          ]),
        ];

        if (visibleWorkflowIds.length === 0) {
          // User tidak punya role apapun yang relevan — return empty
          res.json({ records: [], totalCount: 0, page: 1, pageSize: parseInt(String(pageSize)) });
          return;
        }

        conditions.push(inArray(approvals.workflowId, visibleWorkflowIds));
      } else {
        // User tidak punya akses apapun
        res.json({ records: [], totalCount: 0, page: 1, pageSize: parseInt(String(pageSize)) });
        return;
      }
    }

    // ── Scope filter (corporate/department) ───────────────────────────────────
    if (access?.scope === 'corporate' && access.corporateIds.length > 0) {
      conditions.push(
        or(
          inArray(approvals.corporateId, access.corporateIds),
          isNull(approvals.corporateId),
        )!,
      );
    } else if (access?.scope === 'department' && access.departmentIds.length > 0) {
      conditions.push(
        or(
          inArray(approvals.departmentId, access.departmentIds),
          and(
            isNull(approvals.departmentId),
            access.corporateIds.length > 0
              ? inArray(approvals.corporateId, access.corporateIds)
              : isNull(approvals.corporateId),
          ),
        )!,
      );
    }

    // ── User-provided filters ─────────────────────────────────────────────────
    if (status) conditions.push(eq(approvals.status, String(status)));

    // Global search: berdasarkan approvals.title (case-insensitive)
    if (search && String(search).trim()) {
      conditions.push(ilike(approvals.title, `%${String(search).trim()}%`));
    }

    const pageNum = Math.max(1, parseInt(String(page)));
    const pageSizeNum = Math.min(100, Math.max(1, parseInt(String(pageSize))));
    const offset = (pageNum - 1) * pageSizeNum;

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const records = await db.select({
      approval: approvals,
      workflow: {
        id: approvalWorkflows.id,
        name: approvalWorkflows.name,
        nameEn: approvalWorkflows.nameEn,
        module: approvalWorkflows.module,
        entityType: approvalWorkflows.entityType,
        action: approvalWorkflows.action,
        viewComponent: approvalWorkflows.viewComponent,
      },
      requester: {
        id: users.id,
        fullName: users.fullName,
        email: users.email,
      },
    })
      .from(approvals)
      .leftJoin(approvalWorkflows, eq(approvals.workflowId, approvalWorkflows.id))
      .leftJoin(users, eq(approvals.requestedBy, users.id))
      .where(whereClause)
      .orderBy(desc(approvals.createdAt))
      .limit(pageSizeNum)
      .offset(offset);

    // Count total
    const [{ count }] = await db.select({ count: sql<number>`count(*)::int` })
      .from(approvals)
      .where(whereClause);

    // Enrich: current step role info + approved_by user info
    const stepIds = records.map(r => r.approval.currentStepId).filter(Boolean) as string[];
    const approvedByIds = records.map(r => r.approval.approvedBy).filter(Boolean) as string[];

    const { roles } = await import('../../db/schema');

    // Fetch steps with role info — use separate queries to avoid UUID/varchar type mismatch
    const stepsData = stepIds.length > 0
      ? await db.select({
          stepId: approvalWorkflowSteps.id,
          requiredRole: approvalWorkflowSteps.requiredRole,
        })
          .from(approvalWorkflowSteps)
          .where(inArray(approvalWorkflowSteps.id, stepIds))
      : [];

    // Fetch role names for the required roles
    const requiredRoleIds = [...new Set(stepsData.map(s => s.requiredRole).filter(Boolean))];
    const rolesData = requiredRoleIds.length > 0
      ? await db.select({ id: roles.id, name: roles.name, description: roles.description })
          .from(roles)
          .where(inArray(roles.id, requiredRoleIds))
      : [];

    const roleInfoMap = new Map(rolesData.map(r => [r.id, r]));
    const stepRoleMap = new Map(stepsData.map(s => [s.stepId, {
      roleId: s.requiredRole,
      roleName: roleInfoMap.get(s.requiredRole)?.name ?? null,
      roleDescription: roleInfoMap.get(s.requiredRole)?.description ?? null,
    }]));

    const approvedByUsers = approvedByIds.length > 0
      ? await db.select({ id: users.id, fullName: users.fullName })
          .from(users)
          .where(inArray(users.id, approvedByIds))
      : [];

    const approvedByMap = new Map(approvedByUsers.map(u => [u.id, u]));

    res.json({
      records: records.map(r => {
        const stepRole = r.approval.currentStepId ? stepRoleMap.get(r.approval.currentStepId) : null;
        const approvedByUser = r.approval.approvedBy ? approvedByMap.get(r.approval.approvedBy) : null;
        return {
          ...r.approval,
          workflow: r.workflow,
          requester: r.requester,
          currentStepRole: stepRole ? {
            roleId: stepRole.roleId,
            roleName: stepRole.roleName,
            roleDescription: stepRole.roleDescription,
          } : null,
          approvedByUser: approvedByUser ?? null,
        };
      }),
      totalCount: count,
      page: pageNum,
      pageSize: pageSizeNum,
    });
  }));

  // GET /api/frs/approvals/:id
  // Detail — requires 'approvals.read' OR ownership (maker bisa akses draft miliknya)
  // Juga hanya boleh diakses jika user punya maker_role atau required_role di workflow ini.
  router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
    const detail = await getApprovalDetail(req.params.id);
    if (!detail) throw AppError.notFound(ErrorCode.NOT_FOUND, 'Approval not found');

    const userId = req.user!.userId;
    const isOwner = detail.approval.requestedBy === userId;
    const hasReadPermission = req.user?.permissions?.includes('approvals.read') ?? false;

    if (!hasReadPermission && !isOwner) {
      throw AppError.forbidden(ErrorCode.ACCESS_DENIED, 'Access denied. Required permissions: approvals.read');
    }

    // Scope check untuk non-owner
    if (hasReadPermission && !isOwner) {
      const access = req.accessContext;
      if (access?.scope !== 'system') {
        const approval = detail.approval;
        const allowed =
          (access?.scope === 'corporate' &&
            approval.corporateId != null &&
            access.corporateIds.includes(approval.corporateId)) ||
          (access?.scope === 'department' &&
            ((approval.departmentId != null && access.departmentIds.includes(approval.departmentId)) ||
             (approval.corporateId != null && access.corporateIds.includes(approval.corporateId))));

        if (!allowed && approval.corporateId != null) {
          throw AppError.forbidden(ErrorCode.ACCESS_DENIED, 'You do not have access to this approval');
        }

        // Role check: user harus punya maker_role atau required_role di workflow ini
        const userRoleIds = await getUserRoleIds(userId);
        if (userRoleIds.length > 0 && detail.workflow) {
          const hasMakerRole = userRoleIds.includes(detail.workflow.makerRole);
          const hasApproverRole = detail.steps.some(s => userRoleIds.includes(s.requiredRole));
          if (!hasMakerRole && !hasApproverRole) {
            throw AppError.forbidden(ErrorCode.ACCESS_DENIED, 'You do not have a relevant role for this approval');
          }
        }
      }
    }

    const actorIds = [...new Set(detail.histories.map(h => h.actedBy))];
    const actorUsers = actorIds.length > 0
      ? await db.select({ id: users.id, fullName: users.fullName, email: users.email })
          .from(users)
          .where(inArray(users.id, actorIds))
      : [];

    const actorMap = new Map(actorUsers.map(u => [u.id, u]));
    const enrichedHistories = detail.histories.map(h => ({
      ...h,
      actor: actorMap.get(h.actedBy) ?? null,
    }));

    // Compute canApprove: user punya required_role di current step + scope sesuai
    let canApprove = false;
    if (detail.approval.status === 'pending' && detail.approval.currentStepId) {
      const currentStep = detail.steps.find(s => s.id === detail.approval.currentStepId);
      if (currentStep) {
        canApprove = await verifyUserHasRoleForApproval(
          userId,
          currentStep.requiredRole,
          detail.approval.corporateId,
          detail.approval.departmentId,
        );
      }
    }

    // Compute canCancel: user adalah maker DAN punya maker_role
    let canCancel = false;
    if (detail.approval.status === 'draft' && detail.approval.requestedBy === userId && detail.workflow) {
      canCancel = await verifyUserHasRoleForApproval(
        userId,
        detail.workflow.makerRole,
        detail.approval.corporateId,
        detail.approval.departmentId,
      );
    }

    res.json({
      ...detail.approval,
      workflow: detail.workflow,
      steps: detail.steps,
      histories: enrichedHistories,
      canApprove,
      canCancel,
    });
  }));

  // POST /api/frs/approvals
  // Create draft — corporateId & departmentId diambil dari accessContext user (bukan dari body)
  router.post('/', asyncHandler(async (req: Request, res: Response) => {
    let body = req.body;
    if (req.headers['content-type']?.includes('multipart/form-data')) {
      body = {
        ...body,
        payload: typeof body.payload === 'string' ? JSON.parse(body.payload) : body.payload,
        originalData: body.originalData
          ? (typeof body.originalData === 'string' ? JSON.parse(body.originalData) : body.originalData)
          : undefined,
      };
    }

    const parsed = createDraftSchema.safeParse(body);
    if (!parsed.success) {
      throw AppError.badRequest(ErrorCode.VALIDATION_ERROR, parsed.error.issues.map(i => i.message).join('; '));
    }

    const { workflowId, module: mod, entityType, action, ...rest } = parsed.data;

    let workflowKey: { module: string; entityType: string; action: string };
    if (workflowId) {
      const [wf] = await db.select().from(approvalWorkflows).where(eq(approvalWorkflows.id, workflowId)).limit(1);
      if (!wf) throw AppError.notFound(ErrorCode.NOT_FOUND, 'Workflow not found');
      workflowKey = { module: wf.module, entityType: wf.entityType, action: wf.action };
    } else if (mod && entityType && action) {
      workflowKey = { module: mod, entityType, action };
    } else {
      throw AppError.badRequest(ErrorCode.VALIDATION_ERROR, 'Either workflowId or module+entityType+action is required');
    }

    const access = req.accessContext;
    const userCorporateId = access?.corporateIds?.[0] ?? undefined;
    const userDepartmentId = access?.departmentIds?.[0] ?? undefined;

    const draft = await createDraft({
      workflowKey,
      entityId: rest.entityId,
      payload: rest.payload,
      originalData: rest.originalData,
      requestedBy: req.user!.userId,
      corporateId: userCorporateId,
      departmentId: userDepartmentId,
    });

    res.status(201).json(draft);
  }));

  // POST /api/frs/approvals/:id/submit
  router.post('/:id/submit', asyncHandler(async (req: Request, res: Response) => {
    let body = req.body;
    if (req.headers['content-type']?.includes('multipart/form-data')) {
      body = {
        ...body,
        payload: typeof body.payload === 'string' ? JSON.parse(body.payload) : body.payload,
      };
    }

    const parsed = submitSchema.safeParse(body);
    if (!parsed.success) {
      throw AppError.badRequest(ErrorCode.VALIDATION_ERROR, parsed.error.issues.map(i => i.message).join('; '));
    }

    const updated = await submitDraft({
      approvalId: req.params.id,
      payload: parsed.data.payload,
      requestedBy: req.user!.userId,
    });

    res.json(updated);
  }));

  // POST /api/frs/approvals/:id/approve
  // Role check (required_role di current step) dilakukan di dalam processApprove()
  router.post('/:id/approve', asyncHandler(async (req: Request, res: Response) => {
    const parsed = approveSchema.safeParse(req.body);
    if (!parsed.success) {
      throw AppError.badRequest(ErrorCode.VALIDATION_ERROR, parsed.error.issues.map(i => i.message).join('; '));
    }

    const updated = await processApprove(req.params.id, req.user!.userId, parsed.data.comments);
    res.json(updated);
  }));

  // POST /api/frs/approvals/:id/reject
  // Role check (required_role di current step) dilakukan di dalam processReject()
  router.post('/:id/reject', asyncHandler(async (req: Request, res: Response) => {
    const parsed = rejectSchema.safeParse(req.body);
    if (!parsed.success) {
      throw AppError.badRequest(ErrorCode.VALIDATION_ERROR, parsed.error.issues.map(i => i.message).join('; '));
    }

    const updated = await processReject(req.params.id, req.user!.userId, parsed.data.notes);
    res.json(updated);
  }));

  // POST /api/frs/approvals/:id/cancel
  // Role check (maker_role) dilakukan di dalam cancelApproval()
  router.post('/:id/cancel', asyncHandler(async (req: Request, res: Response) => {
    const parsed = cancelSchema.safeParse(req.body);
    if (!parsed.success) {
      throw AppError.badRequest(ErrorCode.VALIDATION_ERROR, parsed.error.issues.map(i => i.message).join('; '));
    }

    const updated = await cancelApproval(req.params.id, req.user!.userId, parsed.data.notes);
    res.json(updated);
  }));

  return router;
}

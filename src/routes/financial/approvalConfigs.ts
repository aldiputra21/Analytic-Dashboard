// Approval Configs Router
// CRUD for approval_workflows + approval_workflow_steps
// Read: 'approvals.read' (same permission used for monitoring menu)
// Write/Delete: requires 'public.approval_configs.write/delete'

import { Router, Request, Response } from 'express';
import { and, asc, eq, ilike, inArray, or } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../../db/connection';
import { approvalWorkflows, approvalWorkflowSteps, roles } from '../../db/schema';
import { requirePermission } from '../../middleware/rbac';
import { asyncHandler } from '../../utils/asyncHandler';
import { AppError, ErrorCode } from '../../utils/errors';
import { canUserCreateDraft } from '../../services/approval/approvalEngine';

// ── Validation Schemas ────────────────────────────────────────────────────────

const stepSchema = z.object({
  stepOrder: z.number().int().min(1),
  stepType: z.string().min(1).max(20),
  requiredRole: z.string().min(1).max(50),
  condition: z.object({
    field: z.string(),
    operator: z.string(),
    value: z.number(),
  }).nullable().optional(),
  isActive: z.boolean().optional().default(true),
});

const workflowCreateSchema = z.object({
  module: z.string().min(1).max(50),
  entityType: z.string().min(1).max(50),
  action: z.string().min(1).max(20),
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  callbackHandler: z.string().min(1).max(100),
  viewComponent: z.string().min(1).max(100),
  makerRole: z.string().min(1).max(50),
  subjectFields: z.array(z.object({
    field: z.string(),
    label: z.string(),
    type: z.enum(['string', 'currency', 'date', 'number']),
  })).optional().default([]),
  isActive: z.boolean().optional().default(true),
  steps: z.array(stepSchema).min(1),
});

const workflowUpdateSchema = workflowCreateSchema.partial().extend({
  steps: z.array(stepSchema).optional(),
});

// ── Helper: enrich steps & workflow with role name/description ────────────────

async function enrichWithRoles(
  workflows: (typeof approvalWorkflows.$inferSelect)[],
  allSteps: (typeof approvalWorkflowSteps.$inferSelect)[],
) {
  // Collect all unique role IDs (makerRole + requiredRole dari steps)
  const roleIds = [
    ...new Set([
      ...workflows.map(w => w.makerRole).filter(Boolean),
      ...allSteps.map(s => s.requiredRole).filter(Boolean),
    ]),
  ];

  const roleRows = roleIds.length > 0
    ? await db.select({ id: roles.id, name: roles.name, description: roles.description })
        .from(roles)
        .where(inArray(roles.id, roleIds))
    : [];

  const roleMap = new Map(roleRows.map(r => [r.id, r]));

  return workflows.map(w => ({
    ...w,
    makerRoleInfo: roleMap.get(w.makerRole) ?? null,
    steps: allSteps
      .filter(s => s.workflowId === w.id)
      .map(s => ({
        ...s,
        requiredRoleInfo: roleMap.get(s.requiredRole) ?? null,
      })),
  }));
}

// ── Router ────────────────────────────────────────────────────────────────────

export function createApprovalConfigsRouter(): Router {
  const router = Router();

  // GET /api/frs/approval-configs/can-create
  // Cek apakah user saat ini bisa membuat draft untuk workflow tertentu.
  // Scope (corporateId/departmentId) diambil dari accessContext user — BUKAN dari query params.
  // Query params: module, entityType, action
  router.get('/can-create', asyncHandler(async (req: Request, res: Response) => {
    const { module: mod, entityType, action } = req.query;

    if (!mod || !entityType || !action) {
      res.json({ canCreate: false, workflow: null });
      return;
    }

    // Ambil scope dari accessContext user
    const access = req.accessContext;
    const userCorporateId = access?.corporateIds?.[0] ?? undefined;
    const userDepartmentId = access?.departmentIds?.[0] ?? undefined;

    const { canCreate, workflow } = await canUserCreateDraft(
      req.user!.userId,
      String(mod),
      String(entityType),
      String(action),
      userCorporateId,
      userDepartmentId,
    );

    res.json({
      canCreate,
      workflow: workflow ? {
        id: workflow.id,
        name: workflow.name,
        module: workflow.module,
        entityType: workflow.entityType,
        action: workflow.action,
        viewComponent: workflow.viewComponent,
        subjectFields: workflow.subjectFields,
        isActive: workflow.isActive,
      } : null,
    });
  }));

  // GET /api/frs/approval-configs
  router.get('/', requirePermission('approvals.read', 'public.approval_configs.read'), asyncHandler(async (req: Request, res: Response) => {    const { module: mod, entityType, action, activeOnly, search } = req.query;

    const conditions = [];
    if (mod) conditions.push(eq(approvalWorkflows.module, String(mod)));
    if (entityType) conditions.push(eq(approvalWorkflows.entityType, String(entityType)));
    if (action) conditions.push(eq(approvalWorkflows.action, String(action)));
    if (activeOnly === 'true') conditions.push(eq(approvalWorkflows.isActive, true));
    if (search && String(search).trim()) {
      conditions.push(
        or(
          ilike(approvalWorkflows.name, `%${String(search).trim()}%`),
          ilike(approvalWorkflows.entityType, `%${String(search).trim()}%`),
        )!,
      );
    }

    const workflows = await db.select()
      .from(approvalWorkflows)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(asc(approvalWorkflows.module), asc(approvalWorkflows.entityType));

    const workflowIds = workflows.map(w => w.id);
    const allSteps = workflowIds.length > 0
      ? await db.select().from(approvalWorkflowSteps)
          .where(inArray(approvalWorkflowSteps.workflowId, workflowIds))
          .orderBy(asc(approvalWorkflowSteps.stepOrder))
      : [];

    const result = await enrichWithRoles(workflows, allSteps);

    if (mod && entityType && action) {
      res.json({ record: result[0] ?? null });
    } else {
      res.json({ records: result, totalCount: result.length });
    }
  }));

  // GET /api/frs/approval-configs/:id
  router.get('/:id', requirePermission('approvals.read', 'public.approval_configs.read'), asyncHandler(async (req: Request, res: Response) => {
    const [workflow] = await db.select().from(approvalWorkflows).where(eq(approvalWorkflows.id, req.params.id)).limit(1);
    if (!workflow) throw AppError.notFound(ErrorCode.NOT_FOUND, 'Workflow not found');

    const steps = await db.select()
      .from(approvalWorkflowSteps)
      .where(eq(approvalWorkflowSteps.workflowId, workflow.id))
      .orderBy(asc(approvalWorkflowSteps.stepOrder));

    const [enriched] = await enrichWithRoles([workflow], steps);
    res.json(enriched);
  }));

  // POST /api/frs/approval-configs — requires write permission
  router.post('/', requirePermission('public.approval_configs.write'), asyncHandler(async (req: Request, res: Response) => {
    const parsed = workflowCreateSchema.safeParse(req.body);
    if (!parsed.success) {
      throw AppError.badRequest(ErrorCode.VALIDATION_ERROR, parsed.error.issues.map(i => i.message).join('; '));
    }

    const { steps, ...workflowData } = parsed.data;
    const userId = req.user!.userId;

    const result = await db.transaction(async (tx) => {
      const [workflow] = await tx.insert(approvalWorkflows).values({
        ...workflowData,
        createdBy: userId,
      }).returning();

      const stepRecords = await tx.insert(approvalWorkflowSteps).values(
        steps.map(s => ({ ...s, workflowId: workflow.id }))
      ).returning();

      return { ...workflow, steps: stepRecords };
    });

    res.status(201).json(result);
  }));

  // PUT /api/frs/approval-configs/:id — requires write permission
  router.put('/:id', requirePermission('public.approval_configs.write'), asyncHandler(async (req: Request, res: Response) => {
    const parsed = workflowUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      throw AppError.badRequest(ErrorCode.VALIDATION_ERROR, parsed.error.issues.map(i => i.message).join('; '));
    }

    const { steps, ...workflowData } = parsed.data;
    const userId = req.user!.userId;

    const [existing] = await db.select().from(approvalWorkflows).where(eq(approvalWorkflows.id, req.params.id)).limit(1);
    if (!existing) throw AppError.notFound(ErrorCode.NOT_FOUND, 'Workflow not found');

    const result = await db.transaction(async (tx) => {
      const [updated] = await tx.update(approvalWorkflows)
        .set({ ...workflowData, updatedBy: userId, updatedAt: new Date() })
        .where(eq(approvalWorkflows.id, req.params.id))
        .returning();

      let stepRecords = await tx.select()
        .from(approvalWorkflowSteps)
        .where(eq(approvalWorkflowSteps.workflowId, req.params.id))
        .orderBy(asc(approvalWorkflowSteps.stepOrder));

      if (steps && steps.length > 0) {
        await tx.delete(approvalWorkflowSteps).where(eq(approvalWorkflowSteps.workflowId, req.params.id));
        stepRecords = await tx.insert(approvalWorkflowSteps).values(
          steps.map(s => ({ ...s, workflowId: req.params.id }))
        ).returning();
      }

      return { ...updated, steps: stepRecords };
    });

    res.json(result);
  }));

  // DELETE /api/frs/approval-configs/:id — requires delete permission
  router.delete('/:id', requirePermission('public.approval_configs.delete'), asyncHandler(async (req: Request, res: Response) => {
    const [existing] = await db.select().from(approvalWorkflows).where(eq(approvalWorkflows.id, req.params.id)).limit(1);
    if (!existing) throw AppError.notFound(ErrorCode.NOT_FOUND, 'Workflow not found');

    await db.transaction(async (tx) => {
      await tx.delete(approvalWorkflowSteps).where(eq(approvalWorkflowSteps.workflowId, req.params.id));
      await tx.delete(approvalWorkflows).where(eq(approvalWorkflows.id, req.params.id));
    });

    res.status(204).send();
  }));

  return router;
}

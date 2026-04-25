import { Router, Request, Response } from 'express';
import { requirePermission } from '../../middleware/rbac';
import { logCreate, logUpdate, logTransition } from '../../helpers/crmAuditLog';
import { asyncHandler } from '../../utils/asyncHandler';
import {
  CreateOpportunityInput,
  TransitionStageInput,
  PipelineStage,
  STAGE_PROBABILITY,
} from '../../types/crm';
import {
  validateStageTransition,
  buildKanbanData,
  buildFunnelData,
  calculateWeightedForecast,
  isOpportunityStale,
  PIPELINE_STAGES,
} from '../../services/crm/pipelineEngine';
import { db } from '../../db/connection';
import {
  opportunities,
  customers,
  opportunityValueHistory,
  stageTransitions,
} from '../../db/schema/crm';
import { eq, desc, sql, and } from 'drizzle-orm';

// ============================================================
// Opportunity & Pipeline Routes
// Requirements: 2.1–2.10
// ============================================================

export function createOpportunityRouter(): Router {
  const router = Router();

  // POST /api/crm/opportunities - Create new opportunity
  router.post(
    '/',
    requirePermission('crm.opportunities.write'),
    asyncHandler(async (req: Request, res: Response): Promise<void> => {
      const userId = req.user!.userId;
      const body = req.body as CreateOpportunityInput;

      const errors: Record<string, string[]> = {};
      if (!body.name?.trim()) errors.name = ['Nama opportunity wajib diisi'];
      if (!body.customerId?.trim()) errors.customerId = ['Customer wajib dipilih'];
      if (!body.assignedTo?.trim()) errors.assignedTo = ['Sales Executive wajib dipilih'];
      if (!body.corporateId?.trim()) errors.corporateId = ['Corporate ID wajib diisi'];

      if (Object.keys(errors).length > 0) {
        res.status(400).json({
          error: { code: 'VALIDATION_ERROR', message: 'Data tidak lengkap', details: errors },
        });
        return;
      }

      // Validate customer exists
      const [customer] = await db
        .select({ id: customers.id })
        .from(customers)
        .where(eq(customers.id, body.customerId))
        .limit(1);
      if (!customer) {
        res.status(404).json({
          error: { code: 'NOT_FOUND', message: 'Pelanggan tidak ditemukan' },
        });
        return;
      }

      const probability = STAGE_PROBABILITY['Lead'];

      const [created] = await db.insert(opportunities).values({
        name: body.name.trim(),
        customerId: body.customerId,
        corporateId: body.corporateId,
        stage: 'Lead',
        status: 'Active',
        estimatedValue: body.estimatedValue ? String(body.estimatedValue) : null,
        probability,
        assignedTo: body.assignedTo,
        description: body.description ?? null,
        tenderName: body.tenderName ?? null,
        tenderEstimatedValue: body.tenderEstimatedValue ? String(body.tenderEstimatedValue) : null,
        tenderAnnouncementDate: body.tenderAnnouncementDate ? new Date(body.tenderAnnouncementDate) : null,
        createdBy: userId,
      }).returning();

      // Record initial value history if value provided (Req 2.5)
      if (body.estimatedValue) {
        await db.insert(opportunityValueHistory).values({
          opportunityId: created.id,
          oldValue: null,
          newValue: String(body.estimatedValue),
          changedBy: userId,
        });
      }

      await logCreate(userId, 'opportunity', created.id, {
        name: body.name,
        customerId: body.customerId,
        stage: 'Lead',
      });

      const [opp] = (await db.execute(sql`
        SELECT o.*, c.company_name FROM crm.opportunities o
        LEFT JOIN crm.customers c ON o.customer_id = c.id
        WHERE o.id = ${created.id}
      `)).rows;

      const stale = await isOpportunityStale(created.id);
      res.status(201).json(mapOpportunity(opp, stale));
    })
  );

  // GET /api/crm/opportunities - List opportunities
  router.get(
    '/',
    requirePermission('crm.opportunities.read'),
    asyncHandler(async (req: Request, res: Response): Promise<void> => {
      const { stage, status, assignedTo, search } = req.query;
      const userId = req.user!.userId;
      const role = req.user!.role;

      const conditions = [sql`1=1`];

      // For now, simplify filtering: non-owner/bod/managers see only their own if not explicitly searching others
      // In a real system, this would be driven by a specific 'crm.opportunities.read_all' permission
      if (role !== 'owner' && role !== 'bod' && role !== 'subsidiary_manager') {
        conditions.push(sql`o.assigned_to = ${userId}`);
      } else if (assignedTo) {
        conditions.push(sql`o.assigned_to = ${assignedTo as string}`);
      }

      if (stage) conditions.push(sql`o.stage = ${stage as string}`);
      if (status) conditions.push(sql`o.status = ${status as string}`);
      if (search) {
        const term = `%${search}%`;
        conditions.push(sql`(o.name ILIKE ${term} OR c.company_name ILIKE ${term})`);
      }

      const where = sql.join(conditions, sql` AND `);

      const rows = (await db.execute(sql`
        SELECT o.*, c.company_name,
          (SELECT MAX(i.interaction_date)
           FROM crm.interactions i
           WHERE i.entity_id = o.id AND i.entity_type = 'opportunity') AS last_activity
        FROM crm.opportunities o
        LEFT JOIN crm.customers c ON o.customer_id = c.id
        WHERE ${where}
        ORDER BY o.updated_at DESC
      `)).rows as Record<string, unknown>[];

      res.json(
        rows.map((r) => mapOpportunity(r, isStaleFromLastActivity(r.last_activity as string | null)))
      );
    })
  );

  // GET /api/crm/opportunities/:id - Get opportunity detail
  router.get(
    '/:id',
    requirePermission('crm.opportunities.read'),
    asyncHandler(async (req: Request, res: Response): Promise<void> => {
      const [opp] = (await db.execute(sql`
        SELECT o.*, c.company_name,
          (SELECT MAX(i.interaction_date)
           FROM crm.interactions i
           WHERE i.entity_id = o.id AND i.entity_type = 'opportunity') AS last_activity
        FROM crm.opportunities o
        LEFT JOIN crm.customers c ON o.customer_id = c.id
        WHERE o.id = ${req.params.id}
      `)).rows;

      if (!opp) {
        res.status(404).json({
          error: { code: 'NOT_FOUND', message: 'Opportunity tidak ditemukan' },
        });
        return;
      }

      // Include value history
      const valueHistory = await db
        .select()
        .from(opportunityValueHistory)
        .where(eq(opportunityValueHistory.opportunityId, req.params.id))
        .orderBy(desc(opportunityValueHistory.changedAt));

      // Include stage transitions
      const transitions = await db
        .select()
        .from(stageTransitions)
        .where(eq(stageTransitions.opportunityId, req.params.id))
        .orderBy(desc(stageTransitions.transitionedAt));

      res.json({
        ...mapOpportunity(opp, isStaleFromLastActivity(opp.last_activity as string | null)),
        valueHistory: valueHistory.map(mapValueHistory),
        stageTransitions: transitions.map(mapTransition),
      });
    })
  );

  // PUT /api/crm/opportunities/:id - Update opportunity
  router.put(
    '/:id',
    requirePermission('crm.opportunities.write'),
    asyncHandler(async (req: Request, res: Response): Promise<void> => {
      const userId = req.user!.userId;
      const [opp] = await db
        .select()
        .from(opportunities)
        .where(eq(opportunities.id, req.params.id))
        .limit(1);

      if (!opp) {
        res.status(404).json({
          error: { code: 'NOT_FOUND', message: 'Opportunity tidak ditemukan' },
        });
        return;
      }

      const body = req.body;
      const oldValues = { ...opp };

      // Track value change (Req 2.5)
      const newValue = body.estimatedValue !== undefined ? String(body.estimatedValue) : opp.estimatedValue;
      if (newValue !== opp.estimatedValue) {
        await db.insert(opportunityValueHistory).values({
          opportunityId: req.params.id,
          oldValue: opp.estimatedValue,
          newValue: newValue!,
          changedBy: userId,
        });
      }

      await db.update(opportunities).set({
        name: body.name?.trim() ?? opp.name,
        estimatedValue: newValue ?? null,
        probability: body.probability ?? opp.probability,
        assignedTo: body.assignedTo ?? opp.assignedTo,
        description: body.description !== undefined ? body.description : opp.description,
        tenderName: body.tenderName !== undefined ? body.tenderName : opp.tenderName,
        tenderEstimatedValue: body.tenderEstimatedValue !== undefined ? String(body.tenderEstimatedValue) : opp.tenderEstimatedValue,
        tenderAnnouncementDate: body.tenderAnnouncementDate !== undefined
          ? (body.tenderAnnouncementDate ? new Date(body.tenderAnnouncementDate) : null)
          : opp.tenderAnnouncementDate,
        updatedAt: new Date(),
        updatedBy: userId,
      }).where(eq(opportunities.id, req.params.id));

      await logUpdate(userId, 'opportunity', req.params.id, oldValues, body);

      const [updated] = (await db.execute(sql`
        SELECT o.*, c.company_name FROM crm.opportunities o
        LEFT JOIN crm.customers c ON o.customer_id = c.id
        WHERE o.id = ${req.params.id}
      `)).rows;

      const stale = await isOpportunityStale(req.params.id);
      res.json(mapOpportunity(updated, stale));
    })
  );

  // POST /api/crm/opportunities/:id/transition - Transition stage
  router.post(
    '/:id/transition',
    requirePermission('crm.opportunities.write'),
    asyncHandler(async (req: Request, res: Response): Promise<void> => {
      const userId = req.user!.userId;
      const body = req.body as TransitionStageInput;

      const [opp] = await db
        .select()
        .from(opportunities)
        .where(eq(opportunities.id, req.params.id))
        .limit(1);

      if (!opp) {
        res.status(404).json({
          error: { code: 'NOT_FOUND', message: 'Opportunity tidak ditemukan' },
        });
        return;
      }

      if (!body.toStage || !PIPELINE_STAGES.includes(body.toStage)) {
        res.status(400).json({
          error: {
            code: 'INVALID_STAGE',
            message: `Stage tidak valid. Pilih salah satu: ${PIPELINE_STAGES.join(', ')}`,
          },
        });
        return;
      }

      if (opp.status !== 'Active') {
        res.status(422).json({
          error: {
            code: 'OPPORTUNITY_CLOSED',
            message: 'Opportunity yang sudah ditutup tidak dapat dipindahkan stage-nya.',
          },
        });
        return;
      }

      // Validate transition requirements (Req 2.2, 2.3)
      const validation = await validateStageTransition(req.params.id, body.toStage);
      if (!validation.valid) {
        res.status(422).json({
          error: {
            code: 'TRANSITION_REQUIREMENTS_NOT_MET',
            message: 'Kriteria wajib untuk transisi stage belum terpenuhi.',
            details: { missingCriteria: validation.missingCriteria },
          },
        });
        return;
      }

      const fromStage = opp.stage as PipelineStage;
      const newProbability = STAGE_PROBABILITY[body.toStage];

      await db.update(opportunities).set({
        stage: body.toStage,
        probability: newProbability,
        updatedAt: new Date(),
      }).where(eq(opportunities.id, req.params.id));

      // Record stage transition
      await db.insert(stageTransitions).values({
        opportunityId: req.params.id,
        fromStage,
        toStage: body.toStage,
        transitionedBy: userId,
        notes: body.notes ?? null,
      });

      await logTransition(userId, 'opportunity', req.params.id, { stage: fromStage }, { stage: body.toStage });

      const [updated] = (await db.execute(sql`
        SELECT o.*, c.company_name FROM crm.opportunities o
        LEFT JOIN crm.customers c ON o.customer_id = c.id
        WHERE o.id = ${req.params.id}
      `)).rows;

      const stale = await isOpportunityStale(req.params.id);
      res.json(mapOpportunity(updated, stale));
    })
  );

  return router;
}

// ============================================================
// Pipeline Routes (Kanban, Funnel, Forecast)
// ============================================================

export function createPipelineRouter(): Router {
  const router = Router();

  // GET /api/crm/pipeline/kanban - Kanban board data (Req 2.7)
  router.get(
    '/kanban',
    requirePermission('crm.pipeline.read'),
    asyncHandler(async (req: Request, res: Response): Promise<void> => {
      const userId = req.user!.userId;
      const role = req.user!.role;
      const { assignedTo, corporateId } = req.query;

      const filters: { assignedTo?: string; corporateId?: string } = {};

      if (role !== 'owner' && role !== 'bod' && role !== 'subsidiary_manager') {
        filters.assignedTo = userId;
      } else if (assignedTo) {
        filters.assignedTo = assignedTo as string;
      }

      if (corporateId) filters.corporateId = corporateId as string;

      const columns = await buildKanbanData(filters);
      res.json(columns);
    })
  );

  // GET /api/crm/pipeline/funnel - Funnel chart data
  router.get(
    '/funnel',
    requirePermission('crm.pipeline.read'),
    asyncHandler(async (req: Request, res: Response): Promise<void> => {
      const userId = req.user!.userId;
      const role = req.user!.role;
      const { assignedTo, corporateId } = req.query;

      const filters: { assignedTo?: string; corporateId?: string } = {};

      if (role !== 'owner' && role !== 'bod' && role !== 'subsidiary_manager') {
        filters.assignedTo = userId;
      } else if (assignedTo) {
        filters.assignedTo = assignedTo as string;
      }

      if (corporateId) filters.corporateId = corporateId as string;

      const funnel = await buildFunnelData(filters);
      res.json(funnel);
    })
  );

  // GET /api/crm/pipeline/forecast - Sales forecast (Req 2.8)
  router.get(
    '/forecast',
    requirePermission('crm.pipeline.read'),
    asyncHandler(async (req: Request, res: Response): Promise<void> => {
      const userId = req.user!.userId;
      const role = req.user!.role;
      const { assignedTo, corporateId, period } = req.query;

      const filters: { assignedTo?: string; corporateId?: string; period?: string } = {};

      if (role !== 'owner' && role !== 'bod' && role !== 'subsidiary_manager') {
        filters.assignedTo = userId;
      } else if (assignedTo) {
        filters.assignedTo = assignedTo as string;
      }

      if (corporateId) filters.corporateId = corporateId as string;
      if (period) filters.period = period as string;

      const forecast = await calculateWeightedForecast(filters);
      res.json(forecast);
    })
  );

  return router;
}

// ============================================================
// Mappers
// ============================================================

function mapOpportunity(row: any, isStale: boolean) {
  return {
    id: row.id,
    name: row.name,
    customerId: row.customerId ?? row.customer_id,
    customerName: row.customerName ?? row.company_name ?? null,
    stage: row.stage,
    status: row.status,
    estimatedValue: row.estimatedValue ?? row.estimated_value,
    probability: row.probability,
    assignedTo: row.assignedTo ?? row.assigned_to,
    corporateId: row.corporateId ?? row.corporate_id,
    description: row.description,
    tenderName: row.tenderName ?? row.tender_name,
    tenderEstimatedValue: row.tenderEstimatedValue ?? row.tender_estimated_value,
    tenderAnnouncementDate: row.tenderAnnouncementDate ?? row.tender_announcement_date,
    closeReason: row.closeReason ?? row.close_reason,
    closeCategory: row.closeCategory ?? row.close_category,
    closedAt: row.closedAt ?? row.closed_at,
    closedBy: row.closedBy ?? row.closed_by,
    isStale,
    createdBy: row.createdBy ?? row.created_by,
    createdAt: row.createdAt ?? row.created_at,
    updatedAt: row.updatedAt ?? row.updated_at,
  };
}

function mapValueHistory(row: any) {
  return {
    id: row.id,
    opportunityId: row.opportunityId ?? row.opportunity_id,
    oldValue: row.oldValue ?? row.old_value,
    newValue: row.newValue ?? row.new_value,
    changedBy: row.changedBy ?? row.changed_by,
    changedAt: row.changedAt ?? row.changed_at,
  };
}

function mapTransition(row: any) {
  return {
    id: row.id,
    opportunityId: row.opportunityId ?? row.opportunity_id,
    fromStage: row.fromStage ?? row.from_stage,
    toStage: row.toStage ?? row.to_stage,
    transitionedBy: row.transitionedBy ?? row.transitioned_by,
    transitionedAt: row.transitionedAt ?? row.transitioned_at,
    notes: row.notes,
  };
}

function isStaleFromLastActivity(lastActivity: string | null): boolean {
  if (!lastActivity) return true;
  const last = new Date(lastActivity);
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 14);
  return last < cutoff;
}

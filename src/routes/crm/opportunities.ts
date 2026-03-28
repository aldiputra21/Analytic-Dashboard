import { Router, Request, Response } from 'express';
import Database from 'better-sqlite3';
import { requireCRMPermission, canAccessOpportunity } from '../../middleware/crmRbac';
import { logCreate, logUpdate, logTransition } from '../../helpers/crmAuditLog';
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

// ============================================================
// Opportunity & Pipeline Routes
// Requirements: 2.1–2.10
// ============================================================

function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export function createOpportunityRouter(db: Database.Database): Router {
  const router = Router();

  // POST /api/crm/opportunities - Create new opportunity
  router.post(
    '/',
    requireCRMPermission('crm:write:lead', 'crm:write:all'),
    (req: Request, res: Response): void => {
      const userId = req.userId!;
      const body = req.body as CreateOpportunityInput;

      const errors: Record<string, string[]> = {};
      if (!body.name?.trim()) errors.name = ['Nama opportunity wajib diisi'];
      if (!body.customerId?.trim()) errors.customerId = ['Customer wajib dipilih'];
      if (!body.assignedTo?.trim()) errors.assignedTo = ['Sales Executive wajib dipilih'];
      if (!body.companyId?.trim()) errors.companyId = ['Company ID wajib diisi'];

      if (Object.keys(errors).length > 0) {
        res.status(400).json({
          error: { code: 'VALIDATION_ERROR', message: 'Data tidak lengkap', details: errors },
        });
        return;
      }

      // Validate customer exists
      const customer = db
        .prepare('SELECT id FROM crm_customers WHERE id = ?')
        .get(body.customerId);
      if (!customer) {
        res.status(404).json({
          error: { code: 'NOT_FOUND', message: 'Pelanggan tidak ditemukan' },
        });
        return;
      }

      const opportunityId = generateId('OPP');
      const probability = STAGE_PROBABILITY['Lead'];

      db.prepare(
        `INSERT INTO crm_opportunities 
         (id, name, customer_id, stage, status, estimated_value, probability, assigned_to, 
          company_id, description, tender_name, tender_estimated_value, tender_announcement_date, created_by)
         VALUES (?, ?, ?, 'Lead', 'Active', ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(
        opportunityId,
        body.name.trim(),
        body.customerId,
        body.estimatedValue ?? null,
        probability,
        body.assignedTo,
        body.companyId,
        body.description ?? null,
        body.tenderName ?? null,
        body.tenderEstimatedValue ?? null,
        body.tenderAnnouncementDate ?? null,
        userId
      );

      // Record initial value history if value provided (Req 2.5)
      if (body.estimatedValue) {
        db.prepare(
          `INSERT INTO crm_opportunity_value_history (id, opportunity_id, old_value, new_value, changed_by)
           VALUES (?, ?, NULL, ?, ?)`
        ).run(generateId('VH'), opportunityId, body.estimatedValue, userId);
      }

      logCreate(db, userId, 'opportunity', opportunityId, {
        name: body.name,
        customerId: body.customerId,
        stage: 'Lead',
      });

      const opp = db
        .prepare(
          `SELECT o.*, c.company_name FROM crm_opportunities o
           LEFT JOIN crm_customers c ON o.customer_id = c.id
           WHERE o.id = ?`
        )
        .get(opportunityId) as any;

      res.status(201).json(mapOpportunity(opp, isOpportunityStale(db, opportunityId)));
    }
  );

  // GET /api/crm/opportunities - List opportunities
  router.get(
    '/',
    requireCRMPermission('crm:read:all', 'crm:read:own'),
    (req: Request, res: Response): void => {
      const { stage, status, assignedTo, search } = req.query;
      const userPerms = req.crmPermissions ?? [];

      let query = `
        SELECT o.*, c.company_name,
          (SELECT MAX(i.interaction_date) 
           FROM crm_interactions i 
           WHERE i.entity_id = o.id AND i.entity_type = 'opportunity') as last_activity
        FROM crm_opportunities o
        LEFT JOIN crm_customers c ON o.customer_id = c.id
        WHERE 1=1
      `;
      const params: any[] = [];

      // Sales_Executive can only see their own (Req 2.10)
      if (!userPerms.includes('crm:read:all')) {
        query += ' AND o.assigned_to = ?';
        params.push(req.userId);
      } else if (assignedTo) {
        query += ' AND o.assigned_to = ?';
        params.push(assignedTo);
      }

      if (stage) {
        query += ' AND o.stage = ?';
        params.push(stage);
      }
      if (status) {
        query += ' AND o.status = ?';
        params.push(status);
      }
      if (search) {
        query += ' AND (o.name LIKE ? OR c.company_name LIKE ?)';
        params.push(`%${search}%`, `%${search}%`);
      }

      query += ' ORDER BY o.updated_at DESC';

      const rows = db.prepare(query).all(...params) as any[];

      res.json(
        rows.map((r) => mapOpportunity(r, isStaleFromLastActivity(r.last_activity)))
      );
    }
  );

  // GET /api/crm/opportunities/:id - Get opportunity detail
  router.get(
    '/:id',
    requireCRMPermission('crm:read:all', 'crm:read:own'),
    (req: Request, res: Response): void => {
      const opp = db
        .prepare(
          `SELECT o.*, c.company_name,
            (SELECT MAX(i.interaction_date) 
             FROM crm_interactions i 
             WHERE i.entity_id = o.id AND i.entity_type = 'opportunity') as last_activity
           FROM crm_opportunities o
           LEFT JOIN crm_customers c ON o.customer_id = c.id
           WHERE o.id = ?`
        )
        .get(req.params.id) as any;

      if (!opp) {
        res.status(404).json({
          error: { code: 'NOT_FOUND', message: 'Opportunity tidak ditemukan' },
        });
        return;
      }

      if (!canAccessOpportunity(req, opp.assigned_to)) {
        res.status(403).json({
          error: {
            code: 'CRM_FORBIDDEN',
            message: 'Akses ditolak. Anda hanya dapat mengakses opportunity yang ditugaskan kepada Anda.',
          },
        });
        return;
      }

      // Include value history
      const valueHistory = db
        .prepare(
          `SELECT * FROM crm_opportunity_value_history 
           WHERE opportunity_id = ? ORDER BY changed_at DESC`
        )
        .all(req.params.id) as any[];

      // Include stage transitions
      const transitions = db
        .prepare(
          `SELECT * FROM crm_stage_transitions 
           WHERE opportunity_id = ? ORDER BY transitioned_at DESC`
        )
        .all(req.params.id) as any[];

      res.json({
        ...mapOpportunity(opp, isStaleFromLastActivity(opp.last_activity)),
        valueHistory: valueHistory.map(mapValueHistory),
        stageTransitions: transitions.map(mapTransition),
      });
    }
  );

  // PUT /api/crm/opportunities/:id - Update opportunity
  router.put(
    '/:id',
    requireCRMPermission('crm:write:opportunity:own', 'crm:write:all'),
    (req: Request, res: Response): void => {
      const userId = req.userId!;
      const opp = db
        .prepare('SELECT * FROM crm_opportunities WHERE id = ?')
        .get(req.params.id) as any;

      if (!opp) {
        res.status(404).json({
          error: { code: 'NOT_FOUND', message: 'Opportunity tidak ditemukan' },
        });
        return;
      }

      if (!canAccessOpportunity(req, opp.assigned_to)) {
        res.status(403).json({
          error: {
            code: 'CRM_FORBIDDEN',
            message: 'Akses ditolak.',
          },
        });
        return;
      }

      const body = req.body;
      const oldValues = { ...opp };

      // Track value change (Req 2.5)
      const newValue = body.estimatedValue !== undefined ? body.estimatedValue : opp.estimated_value;
      if (newValue !== opp.estimated_value) {
        db.prepare(
          `INSERT INTO crm_opportunity_value_history (id, opportunity_id, old_value, new_value, changed_by)
           VALUES (?, ?, ?, ?, ?)`
        ).run(generateId('VH'), req.params.id, opp.estimated_value, newValue, userId);
      }

      db.prepare(
        `UPDATE crm_opportunities
         SET name = ?, estimated_value = ?, probability = ?, assigned_to = ?,
             description = ?, tender_name = ?, tender_estimated_value = ?,
             tender_announcement_date = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`
      ).run(
        body.name?.trim() ?? opp.name,
        newValue ?? null,
        body.probability ?? opp.probability,
        body.assignedTo ?? opp.assigned_to,
        body.description !== undefined ? body.description : opp.description,
        body.tenderName !== undefined ? body.tenderName : opp.tender_name,
        body.tenderEstimatedValue !== undefined ? body.tenderEstimatedValue : opp.tender_estimated_value,
        body.tenderAnnouncementDate !== undefined ? body.tenderAnnouncementDate : opp.tender_announcement_date,
        req.params.id
      );

      logUpdate(db, userId, 'opportunity', req.params.id, oldValues, body);

      const updated = db
        .prepare(
          `SELECT o.*, c.company_name FROM crm_opportunities o
           LEFT JOIN crm_customers c ON o.customer_id = c.id
           WHERE o.id = ?`
        )
        .get(req.params.id) as any;

      res.json(mapOpportunity(updated, isOpportunityStale(db, req.params.id)));
    }
  );

  // POST /api/crm/opportunities/:id/transition - Transition stage
  router.post(
    '/:id/transition',
    requireCRMPermission('crm:write:opportunity:own', 'crm:write:all'),
    (req: Request, res: Response): void => {
      const userId = req.userId!;
      const body = req.body as TransitionStageInput;

      const opp = db
        .prepare('SELECT * FROM crm_opportunities WHERE id = ?')
        .get(req.params.id) as any;

      if (!opp) {
        res.status(404).json({
          error: { code: 'NOT_FOUND', message: 'Opportunity tidak ditemukan' },
        });
        return;
      }

      if (!canAccessOpportunity(req, opp.assigned_to)) {
        res.status(403).json({
          error: { code: 'CRM_FORBIDDEN', message: 'Akses ditolak.' },
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
      const validation = validateStageTransition(db, req.params.id, body.toStage);
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

      db.prepare(
        `UPDATE crm_opportunities
         SET stage = ?, probability = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`
      ).run(body.toStage, newProbability, req.params.id);

      // Record stage transition
      db.prepare(
        `INSERT INTO crm_stage_transitions (id, opportunity_id, from_stage, to_stage, transitioned_by, notes)
         VALUES (?, ?, ?, ?, ?, ?)`
      ).run(
        generateId('ST'),
        req.params.id,
        fromStage,
        body.toStage,
        userId,
        body.notes ?? null
      );

      logTransition(db, userId, 'opportunity', req.params.id, { stage: fromStage }, { stage: body.toStage });

      const updated = db
        .prepare(
          `SELECT o.*, c.company_name FROM crm_opportunities o
           LEFT JOIN crm_customers c ON o.customer_id = c.id
           WHERE o.id = ?`
        )
        .get(req.params.id) as any;

      res.json(mapOpportunity(updated, isOpportunityStale(db, req.params.id)));
    }
  );

  return router;
}

// ============================================================
// Pipeline Routes (Kanban, Funnel, Forecast)
// ============================================================

export function createPipelineRouter(db: Database.Database): Router {
  const router = Router();

  // GET /api/crm/pipeline/kanban - Kanban board data (Req 2.7)
  router.get(
    '/kanban',
    requireCRMPermission('crm:read:all', 'crm:read:own'),
    (req: Request, res: Response): void => {
      const userPerms = req.crmPermissions ?? [];
      const { assignedTo, companyId } = req.query;

      const filters: { assignedTo?: string; companyId?: string } = {};

      // Sales_Executive sees only their own (Req 2.10)
      if (!userPerms.includes('crm:read:all')) {
        filters.assignedTo = req.userId;
      } else if (assignedTo) {
        filters.assignedTo = assignedTo as string;
      }

      if (companyId) filters.companyId = companyId as string;

      const columns = buildKanbanData(db, filters);
      res.json(columns);
    }
  );

  // GET /api/crm/pipeline/funnel - Funnel chart data
  router.get(
    '/funnel',
    requireCRMPermission('crm:read:all', 'crm:read:own'),
    (req: Request, res: Response): void => {
      const userPerms = req.crmPermissions ?? [];
      const { assignedTo, companyId } = req.query;

      const filters: { assignedTo?: string; companyId?: string } = {};

      if (!userPerms.includes('crm:read:all')) {
        filters.assignedTo = req.userId;
      } else if (assignedTo) {
        filters.assignedTo = assignedTo as string;
      }

      if (companyId) filters.companyId = companyId as string;

      const funnel = buildFunnelData(db, filters);
      res.json(funnel);
    }
  );

  // GET /api/crm/pipeline/forecast - Sales forecast (Req 2.8)
  router.get(
    '/forecast',
    requireCRMPermission('crm:read:all', 'crm:read:own'),
    (req: Request, res: Response): void => {
      const userPerms = req.crmPermissions ?? [];
      const { assignedTo, companyId, period } = req.query;

      const filters: { assignedTo?: string; companyId?: string; period?: string } = {};

      if (!userPerms.includes('crm:read:all')) {
        filters.assignedTo = req.userId;
      } else if (assignedTo) {
        filters.assignedTo = assignedTo as string;
      }

      if (companyId) filters.companyId = companyId as string;
      if (period) filters.period = period as string;

      const forecast = calculateWeightedForecast(db, filters);
      res.json(forecast);
    }
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
    customerId: row.customer_id,
    customerName: row.company_name ?? null,
    stage: row.stage,
    status: row.status,
    estimatedValue: row.estimated_value,
    probability: row.probability,
    assignedTo: row.assigned_to,
    companyId: row.company_id,
    description: row.description,
    tenderName: row.tender_name,
    tenderEstimatedValue: row.tender_estimated_value,
    tenderAnnouncementDate: row.tender_announcement_date,
    closeReason: row.close_reason,
    closeCategory: row.close_category,
    closedAt: row.closed_at,
    closedBy: row.closed_by,
    isStale,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapValueHistory(row: any) {
  return {
    id: row.id,
    opportunityId: row.opportunity_id,
    oldValue: row.old_value,
    newValue: row.new_value,
    changedBy: row.changed_by,
    changedAt: row.changed_at,
  };
}

function mapTransition(row: any) {
  return {
    id: row.id,
    opportunityId: row.opportunity_id,
    fromStage: row.from_stage,
    toStage: row.to_stage,
    transitionedBy: row.transitioned_by,
    transitionedAt: row.transitioned_at,
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

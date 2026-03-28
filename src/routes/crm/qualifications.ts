import { Router, Request, Response } from 'express';
import Database from 'better-sqlite3';
import { requireCRMPermission, hasCRMRole } from '../../middleware/crmRbac';
import { logCreate, logUpdate, logApprove, logReject } from '../../helpers/crmAuditLog';
import { CreateQualificationInput, ResourcePlanItem } from '../../types/crm';
import { calculateFeasibility, FEASIBILITY_THRESHOLDS } from '../../services/crm/feasibilityCalculator';

// ============================================================
// Qualification & Feasibility Routes
// Requirements: 3.1–3.7
// ============================================================

function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export function createQualificationRouter(db: Database.Database): Router {
  const router = Router({ mergeParams: true });

  // POST /api/crm/opportunities/:id/qualification
  // Create or update qualification (creates new version each time)
  router.post(
    '/',
    requireCRMPermission('crm:write:qualification', 'crm:write:all'),
    (req: Request, res: Response): void => {
      const userId = req.userId!;
      const opportunityId = req.params.id;

      const opp = db
        .prepare('SELECT id, stage FROM crm_opportunities WHERE id = ?')
        .get(opportunityId) as any;

      if (!opp) {
        res.status(404).json({
          error: { code: 'NOT_FOUND', message: 'Opportunity tidak ditemukan' },
        });
        return;
      }

      const body = req.body as CreateQualificationInput;

      // Calculate feasibility score and recommendation (Req 3.2, 3.3)
      const { feasibilityScore, recommendation } = calculateFeasibility(body);

      // Get current max version for this opportunity
      const maxVersion = (
        db
          .prepare(
            'SELECT COALESCE(MAX(version), 0) as max_v FROM crm_qualifications WHERE opportunity_id = ?'
          )
          .get(opportunityId) as { max_v: number }
      ).max_v;

      const newVersion = maxVersion + 1;
      const qualId = generateId('QUAL');

      db.prepare(
        `INSERT INTO crm_qualifications
         (id, opportunity_id, version, technical_capability_score, resource_availability_score,
          contract_value_score, estimated_margin_score, risk_score,
          feasibility_score, recommendation, notes, resource_plan, status, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Draft', ?)`
      ).run(
        qualId,
        opportunityId,
        newVersion,
        body.technicalCapabilityScore ?? null,
        body.resourceAvailabilityScore ?? null,
        body.contractValueScore ?? null,
        body.estimatedMarginScore ?? null,
        body.riskScore ?? null,
        feasibilityScore,
        recommendation,
        body.notes ?? null,
        body.resourcePlan ? JSON.stringify(body.resourcePlan) : null,
        userId
      );

      logCreate(db, userId, 'qualification', qualId, {
        opportunityId,
        version: newVersion,
        feasibilityScore,
        recommendation,
      });

      const qual = db
        .prepare('SELECT * FROM crm_qualifications WHERE id = ?')
        .get(qualId) as any;

      res.status(201).json(mapQualification(qual));
    }
  );

  // GET /api/crm/opportunities/:id/qualification
  // Get latest qualification for an opportunity
  router.get(
    '/',
    requireCRMPermission('crm:read:all', 'crm:read:own'),
    (req: Request, res: Response): void => {
      const opportunityId = req.params.id;

      const opp = db
        .prepare('SELECT id FROM crm_opportunities WHERE id = ?')
        .get(opportunityId);

      if (!opp) {
        res.status(404).json({
          error: { code: 'NOT_FOUND', message: 'Opportunity tidak ditemukan' },
        });
        return;
      }

      const qual = db
        .prepare(
          `SELECT * FROM crm_qualifications
           WHERE opportunity_id = ?
           ORDER BY version DESC LIMIT 1`
        )
        .get(opportunityId) as any;

      if (!qual) {
        res.status(404).json({
          error: { code: 'NOT_FOUND', message: 'Analisis kualifikasi belum dibuat' },
        });
        return;
      }

      res.json(mapQualification(qual));
    }
  );

  // POST /api/crm/opportunities/:id/qualification/approve
  // BD_Manager approves the latest qualification (Req 3.6)
  router.post(
    '/approve',
    requireCRMPermission('crm:approve:qualification', 'crm:write:all'),
    (req: Request, res: Response): void => {
      const userId = req.userId!;
      const opportunityId = req.params.id;

      // Only BD_Manager can approve (Req 3.6, 9.4)
      if (!hasCRMRole(req, 'BD_Manager') && !hasCRMRole(req, 'Sales_Manager')) {
        res.status(403).json({
          error: {
            code: 'CRM_FORBIDDEN',
            message: 'Hanya BD_Manager atau Sales_Manager yang dapat menyetujui kualifikasi.',
          },
        });
        return;
      }

      const qual = db
        .prepare(
          `SELECT * FROM crm_qualifications
           WHERE opportunity_id = ?
           ORDER BY version DESC LIMIT 1`
        )
        .get(opportunityId) as any;

      if (!qual) {
        res.status(404).json({
          error: { code: 'NOT_FOUND', message: 'Analisis kualifikasi tidak ditemukan' },
        });
        return;
      }

      if (qual.status === 'Approved') {
        res.status(422).json({
          error: { code: 'ALREADY_APPROVED', message: 'Kualifikasi sudah disetujui' },
        });
        return;
      }

      const { action } = req.body as { action?: 'approve' | 'reject'; notes?: string };
      const isApprove = action !== 'reject';

      const newStatus = isApprove ? 'Approved' : 'Rejected';

      db.prepare(
        `UPDATE crm_qualifications
         SET status = ?, approved_by = ?, approved_at = CURRENT_TIMESTAMP
         WHERE id = ?`
      ).run(newStatus, userId, qual.id);

      if (isApprove) {
        logApprove(db, userId, 'qualification', qual.id, { status: newStatus });
      } else {
        logReject(db, userId, 'qualification', qual.id, { status: newStatus });
      }

      const updated = db
        .prepare('SELECT * FROM crm_qualifications WHERE id = ?')
        .get(qual.id) as any;

      res.json(mapQualification(updated));
    }
  );

  // GET /api/crm/opportunities/:id/qualification/history
  // Get all versions of qualification for an opportunity (Req 3.7)
  router.get(
    '/history',
    requireCRMPermission('crm:read:all', 'crm:read:own'),
    (req: Request, res: Response): void => {
      const opportunityId = req.params.id;

      const opp = db
        .prepare('SELECT id FROM crm_opportunities WHERE id = ?')
        .get(opportunityId);

      if (!opp) {
        res.status(404).json({
          error: { code: 'NOT_FOUND', message: 'Opportunity tidak ditemukan' },
        });
        return;
      }

      const history = db
        .prepare(
          `SELECT * FROM crm_qualifications
           WHERE opportunity_id = ?
           ORDER BY version ASC`
        )
        .all(opportunityId) as any[];

      res.json(history.map(mapQualification));
    }
  );

  return router;
}

// ============================================================
// Mapper
// ============================================================

function mapQualification(row: any) {
  return {
    id: row.id,
    opportunityId: row.opportunity_id,
    version: row.version,
    technicalCapabilityScore: row.technical_capability_score,
    resourceAvailabilityScore: row.resource_availability_score,
    contractValueScore: row.contract_value_score,
    estimatedMarginScore: row.estimated_margin_score,
    riskScore: row.risk_score,
    feasibilityScore: row.feasibility_score,
    recommendation: row.recommendation,
    notes: row.notes,
    resourcePlan: row.resource_plan ? JSON.parse(row.resource_plan) as ResourcePlanItem[] : null,
    status: row.status,
    createdBy: row.created_by,
    createdAt: row.created_at,
    approvedBy: row.approved_by,
    approvedAt: row.approved_at,
    // Convenience flag for pipeline engine
    isApproved: row.status === 'Approved',
    // Warn if score is below reject threshold (Req 3.4)
    requiresConfirmation: row.feasibility_score < FEASIBILITY_THRESHOLDS.REJECT_MAX,
  };
}

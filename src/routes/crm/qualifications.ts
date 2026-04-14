import { Router, Request, Response } from 'express';
import { requireCRMPermission, hasCRMRole } from '../../middleware/crmRbac';
import { logCreate, logApprove, logReject } from '../../helpers/crmAuditLog';
import { CreateQualificationInput, ResourcePlanItem } from '../../types/crm';
import { calculateFeasibility, FEASIBILITY_THRESHOLDS } from '../../services/crm/feasibilityCalculator';
import { db } from '../../db/connection';
import { qualifications, opportunities } from '../../db/schema/crm';
import { eq, desc, asc, max } from 'drizzle-orm';

// ============================================================
// Qualification & Feasibility Routes
// Requirements: 3.1–3.7
// ============================================================

export function createQualificationRouter(): Router {
  const router = Router({ mergeParams: true });

  // POST /api/crm/opportunities/:id/qualification
  // Create or update qualification (creates new version each time)
  router.post(
    '/',
    requireCRMPermission('crm:write:qualification', 'crm:write:all'),
    async (req: Request, res: Response): Promise<void> => {
      const userId = req.userId!;
      const opportunityId = req.params.id;

      const [opp] = await db
        .select({ id: opportunities.id, stage: opportunities.stage })
        .from(opportunities)
        .where(eq(opportunities.id, opportunityId))
        .limit(1);

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
      const [maxResult] = await db
        .select({ maxV: max(qualifications.version) })
        .from(qualifications)
        .where(eq(qualifications.opportunityId, opportunityId));
      const newVersion = (maxResult?.maxV ?? 0) + 1;

      const [created] = await db.insert(qualifications).values({
        opportunityId,
        version: newVersion,
        technicalCapabilityScore: body.technicalCapabilityScore ?? null,
        resourceAvailabilityScore: body.resourceAvailabilityScore ?? null,
        contractValueScore: body.contractValueScore ?? null,
        estimatedMarginScore: body.estimatedMarginScore ?? null,
        riskScore: body.riskScore ?? null,
        feasibilityScore: String(feasibilityScore),
        recommendation,
        notes: body.notes ?? null,
        resourcePlan: body.resourcePlan ? JSON.stringify(body.resourcePlan) : null,
        status: 'Draft',
        createdBy: userId,
      }).returning();

      await logCreate(userId, 'qualification', created.id, {
        opportunityId,
        version: newVersion,
        feasibilityScore,
        recommendation,
      });

      res.status(201).json(mapQualification(created));
    }
  );

  // GET /api/crm/opportunities/:id/qualification
  // Get latest qualification for an opportunity
  router.get(
    '/',
    requireCRMPermission('crm:read:all', 'crm:read:own'),
    async (req: Request, res: Response): Promise<void> => {
      const opportunityId = req.params.id;

      const [opp] = await db
        .select({ id: opportunities.id })
        .from(opportunities)
        .where(eq(opportunities.id, opportunityId))
        .limit(1);

      if (!opp) {
        res.status(404).json({
          error: { code: 'NOT_FOUND', message: 'Opportunity tidak ditemukan' },
        });
        return;
      }

      const [qual] = await db
        .select()
        .from(qualifications)
        .where(eq(qualifications.opportunityId, opportunityId))
        .orderBy(desc(qualifications.version))
        .limit(1);

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
    async (req: Request, res: Response): Promise<void> => {
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

      const [qual] = await db
        .select()
        .from(qualifications)
        .where(eq(qualifications.opportunityId, opportunityId))
        .orderBy(desc(qualifications.version))
        .limit(1);

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

      const [updated] = await db
        .update(qualifications)
        .set({ status: newStatus, updatedAt: new Date() })
        .where(eq(qualifications.id, qual.id))
        .returning();

      if (isApprove) {
        await logApprove(userId, 'qualification', qual.id, { status: newStatus });
      } else {
        await logReject(userId, 'qualification', qual.id, { status: newStatus });
      }

      res.json(mapQualification(updated));
    }
  );

  // GET /api/crm/opportunities/:id/qualification/history
  // Get all versions of qualification for an opportunity (Req 3.7)
  router.get(
    '/history',
    requireCRMPermission('crm:read:all', 'crm:read:own'),
    async (req: Request, res: Response): Promise<void> => {
      const opportunityId = req.params.id;

      const [opp] = await db
        .select({ id: opportunities.id })
        .from(opportunities)
        .where(eq(opportunities.id, opportunityId))
        .limit(1);

      if (!opp) {
        res.status(404).json({
          error: { code: 'NOT_FOUND', message: 'Opportunity tidak ditemukan' },
        });
        return;
      }

      const history = await db
        .select()
        .from(qualifications)
        .where(eq(qualifications.opportunityId, opportunityId))
        .orderBy(asc(qualifications.version));

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
    opportunityId: row.opportunityId ?? row.opportunity_id,
    version: row.version,
    technicalCapabilityScore: row.technicalCapabilityScore ?? row.technical_capability_score,
    resourceAvailabilityScore: row.resourceAvailabilityScore ?? row.resource_availability_score,
    contractValueScore: row.contractValueScore ?? row.contract_value_score,
    estimatedMarginScore: row.estimatedMarginScore ?? row.estimated_margin_score,
    riskScore: row.riskScore ?? row.risk_score,
    feasibilityScore: parseFloat(row.feasibilityScore ?? row.feasibility_score ?? '0'),
    recommendation: row.recommendation,
    notes: row.notes,
    resourcePlan: typeof row.resourcePlan === 'string'
      ? JSON.parse(row.resourcePlan) as ResourcePlanItem[]
      : (row.resourcePlan ?? (row.resource_plan ? JSON.parse(row.resource_plan) : null)),
    status: row.status,
    createdBy: row.createdBy ?? row.created_by,
    createdAt: row.createdAt ?? row.created_at,
    updatedAt: row.updatedAt ?? row.updated_at,
    isApproved: row.status === 'Approved',
    requiresConfirmation: parseFloat(row.feasibilityScore ?? row.feasibility_score ?? '0') < FEASIBILITY_THRESHOLDS.REJECT_MAX,
  };
}

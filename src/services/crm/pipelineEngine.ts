import { sql } from 'drizzle-orm';
import { db } from '../../db/connection';
import {
  PipelineStage,
  OpportunityStatus,
  STAGE_TRANSITION_REQUIREMENTS,
  STAGE_PROBABILITY,
  KanbanColumn,
  FunnelStageData,
  SalesForecast,
  OpportunitySummary,
} from '../../types/crm';

// ============================================================
// Pipeline Engine
// Drizzle ORM PostgreSQL implementation.
// Validates stage transitions and computes pipeline analytics.
// ============================================================

export const PIPELINE_STAGES: PipelineStage[] = [
  'Lead',
  'Qualification',
  'Tender',
  'Proposal',
  'Negotiation',
  'Contract',
];

/** Number of days without activity before an opportunity is considered stale */
export const STALE_THRESHOLD_DAYS = 14;

export interface TransitionValidationResult {
  valid: boolean;
  missingCriteria: string[];
}

/**
 * Validates whether an opportunity can transition to the target stage.
 */
export async function validateStageTransition(
  opportunityId: string,
  toStage: PipelineStage,
): Promise<TransitionValidationResult> {
  const requirements = STAGE_TRANSITION_REQUIREMENTS[toStage];

  if (!requirements || requirements.length === 0) {
    return { valid: true, missingCriteria: [] };
  }

  const [opportunity] = (await db.execute(sql`
    SELECT * FROM crm.opportunities WHERE id = ${opportunityId}
  `)).rows;

  if (!opportunity) {
    return { valid: false, missingCriteria: ['opportunity_not_found'] };
  }

  const missing: string[] = [];

  for (const req of requirements) {
    switch (req) {
      case 'customer_id':
        if (!opportunity.customer_id) missing.push('customer_id');
        break;

      case 'estimated_value':
        if (!opportunity.estimated_value || parseFloat(String(opportunity.estimated_value)) <= 0)
          missing.push('estimated_value');
        break;

      case 'assigned_to':
        if (!opportunity.assigned_to) missing.push('assigned_to');
        break;

      case 'qualification_approved': {
        const [qual] = (await db.execute(sql`
          SELECT id FROM crm.qualifications
          WHERE opportunity_id = ${opportunityId} AND status = 'Approved'
          ORDER BY version DESC LIMIT 1
        `)).rows;
        if (!qual) missing.push('qualification_approved');
        break;
      }

      case 'tender_documents_received': {
        const [hasProposal] = (await db.execute(sql`
          SELECT id FROM crm.proposals WHERE opportunity_id = ${opportunityId} LIMIT 1
        `)).rows;
        if (!hasProposal) missing.push('tender_documents_received');
        break;
      }

      case 'proposal_submitted': {
        const [submitted] = (await db.execute(sql`
          SELECT id FROM crm.proposals
          WHERE opportunity_id = ${opportunityId} AND status = 'Submitted' LIMIT 1
        `)).rows;
        if (!submitted) missing.push('proposal_submitted');
        break;
      }

      case 'negotiation_complete': {
        if (opportunity.stage !== 'Negotiation') missing.push('negotiation_complete');
        break;
      }

      default:
        break;
    }
  }

  return { valid: missing.length === 0, missingCriteria: missing };
}

/**
 * Checks whether an opportunity is stale (no interaction in last 14 days).
 */
export async function isOpportunityStale(
  opportunityId: string,
): Promise<boolean> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - STALE_THRESHOLD_DAYS);

  const [recent] = (await db.execute(sql`
    SELECT id FROM crm.interactions
    WHERE entity_id = ${opportunityId} AND entity_type = 'opportunity'
      AND interaction_date >= ${cutoff}
    LIMIT 1
  `)).rows;

  return !recent;
}

/**
 * Calculates total pipeline value per stage for active opportunities.
 */
export async function calculatePipelineValueByStage(
  filters: { assignedTo?: string; corporateId?: string } = {},
): Promise<Record<PipelineStage, number>> {
  const conditions = [sql`status = 'Active'`];
  if (filters.assignedTo) conditions.push(sql`assigned_to = ${filters.assignedTo}`);
  if (filters.corporateId) conditions.push(sql`corporate_id = ${filters.corporateId}`);

  const where = sql.join(conditions, sql` AND `);

  const rows = (await db.execute(sql`
    SELECT stage, SUM(COALESCE(estimated_value, 0))::text AS total
    FROM crm.opportunities
    WHERE ${where}
    GROUP BY stage
  `)).rows as { stage: PipelineStage; total: string }[];

  const result = {} as Record<PipelineStage, number>;
  for (const stage of PIPELINE_STAGES) result[stage] = 0;
  for (const row of rows) result[row.stage] = parseFloat(row.total) || 0;

  return result;
}

/**
 * Calculates weighted sales forecast = sum(value * probability / 100).
 */
export async function calculateWeightedForecast(
  filters: { assignedTo?: string; corporateId?: string; period?: string } = {},
): Promise<SalesForecast> {
  const conditions = [sql`status = 'Active'`];
  if (filters.assignedTo) conditions.push(sql`assigned_to = ${filters.assignedTo}`);
  if (filters.corporateId) conditions.push(sql`corporate_id = ${filters.corporateId}`);

  const where = sql.join(conditions, sql` AND `);

  const rows = (await db.execute(sql`
    SELECT stage,
           COUNT(*)::text AS cnt,
           SUM(COALESCE(estimated_value, 0))::text AS total_value,
           SUM(COALESCE(estimated_value, 0) * probability / 100.0)::text AS weighted_value
    FROM crm.opportunities
    WHERE ${where}
    GROUP BY stage
  `)).rows as {
    stage: PipelineStage;
    cnt: string;
    total_value: string;
    weighted_value: string;
  }[];

  let totalWeighted = 0;
  let totalCount = 0;

  const byStage = PIPELINE_STAGES.map((stage) => {
    const row = rows.find((r) => r.stage === stage);
    const count = parseInt(row?.cnt ?? '0') || 0;
    const totalValue = parseFloat(row?.total_value ?? '0') || 0;
    const weightedValue = parseFloat(row?.weighted_value ?? '0') || 0;
    totalWeighted += weightedValue;
    totalCount += count;
    return { stage, count, totalValue, weightedValue };
  });

  return {
    period: filters.period ?? new Date().toISOString().slice(0, 7),
    weightedPipelineValue: totalWeighted,
    expectedRevenue: totalWeighted,
    opportunityCount: totalCount,
    byStage,
  };
}

/**
 * Builds Kanban board data grouped by stage.
 */
export async function buildKanbanData(
  filters: { assignedTo?: string; corporateId?: string } = {},
): Promise<KanbanColumn[]> {
  const conditions = [sql`o.status = 'Active'`];
  if (filters.assignedTo) conditions.push(sql`o.assigned_to = ${filters.assignedTo}`);
  if (filters.corporateId) conditions.push(sql`o.corporate_id = ${filters.corporateId}`);

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

  const columns: KanbanColumn[] = PIPELINE_STAGES.map((stage) => {
    const stageOpps = rows.filter((r) => r.stage === stage);
    const opportunities: OpportunitySummary[] = stageOpps.map((r) =>
      mapToOpportunitySummary(r, isStaleFromLastActivity(r.last_activity as string | null)),
    );
    const totalValue = stageOpps.reduce(
      (sum, r) => sum + (parseFloat(String(r.estimated_value ?? '0')) || 0),
      0,
    );
    return { stage, opportunities, totalValue, count: stageOpps.length };
  });

  return columns;
}

/**
 * Builds funnel chart data showing conversion rates between stages.
 */
export async function buildFunnelData(
  filters: { assignedTo?: string; corporateId?: string } = {},
): Promise<FunnelStageData[]> {
  const conditions = [sql`status IN ('Active', 'Won', 'Lost', 'Cancelled')`];
  if (filters.assignedTo) conditions.push(sql`assigned_to = ${filters.assignedTo}`);
  if (filters.corporateId) conditions.push(sql`corporate_id = ${filters.corporateId}`);

  const where = sql.join(conditions, sql` AND `);

  const rows = (await db.execute(sql`
    SELECT stage, COUNT(*)::text AS cnt, SUM(COALESCE(estimated_value, 0))::text AS total_value
    FROM crm.opportunities
    WHERE ${where}
    GROUP BY stage
  `)).rows as {
    stage: PipelineStage;
    cnt: string;
    total_value: string;
  }[];

  const countByStage: Record<string, number> = {};
  for (const row of rows) countByStage[row.stage] = parseInt(row.cnt) || 0;

  return PIPELINE_STAGES.map((stage, idx) => {
    const count = countByStage[stage] ?? 0;
    const totalValue = parseFloat(rows.find((r) => r.stage === stage)?.total_value ?? '0') || 0;
    const prevCount = idx > 0 ? (countByStage[PIPELINE_STAGES[idx - 1]] ?? 0) : count;
    const conversionRate = prevCount > 0 ? (count / prevCount) * 100 : 0;
    return { stage, count, totalValue, conversionRate };
  });
}

// ============================================================
// Helpers
// ============================================================

function isStaleFromLastActivity(lastActivity: string | null): boolean {
  if (!lastActivity) return true;
  const last = new Date(lastActivity);
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - STALE_THRESHOLD_DAYS);
  return last < cutoff;
}

function mapToOpportunitySummary(row: Record<string, unknown>, isStale: boolean): OpportunitySummary {
  return {
    id: String(row.id),
    name: String(row.name),
    customerName: String(row.company_name ?? ''),
    estimatedValue: parseFloat(String(row.estimated_value ?? '0')) || 0,
    stage: row.stage as PipelineStage,
    assignedTo: String(row.assigned_to),
    lastActivityDate: row.last_activity ? new Date(String(row.last_activity)) : undefined,
    isStale,
    probability: (row.probability as number) ?? STAGE_PROBABILITY[row.stage as PipelineStage],
  };
}

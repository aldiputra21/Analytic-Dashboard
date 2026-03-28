import Database from 'better-sqlite3';
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
// Validates stage transitions and computes pipeline analytics.
// Requirements: 2.1, 2.2, 2.3, 2.5, 2.6, 2.8, 2.9
// ============================================================

export const PIPELINE_STAGES: PipelineStage[] = [
  'Lead',
  'Qualification',
  'Tender',
  'Proposal',
  'Negotiation',
  'Contract',
];

/** Number of days without activity before an opportunity is considered stale (Req 2.9) */
export const STALE_THRESHOLD_DAYS = 14;

export interface TransitionValidationResult {
  valid: boolean;
  missingCriteria: string[];
}

/**
 * Validates whether an opportunity can transition to the target stage.
 * Checks STAGE_TRANSITION_REQUIREMENTS for the target stage.
 * Requirements: 2.1, 2.2, 2.3
 */
export function validateStageTransition(
  db: Database.Database,
  opportunityId: string,
  toStage: PipelineStage
): TransitionValidationResult {
  const requirements = STAGE_TRANSITION_REQUIREMENTS[toStage];

  if (!requirements || requirements.length === 0) {
    return { valid: true, missingCriteria: [] };
  }

  const opportunity = db
    .prepare('SELECT * FROM crm_opportunities WHERE id = ?')
    .get(opportunityId) as any;

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
        if (!opportunity.estimated_value || opportunity.estimated_value <= 0)
          missing.push('estimated_value');
        break;

      case 'assigned_to':
        if (!opportunity.assigned_to) missing.push('assigned_to');
        break;

      case 'qualification_approved': {
        // Check that a qualification exists and is approved (Req 3.6)
        const qual = db
          .prepare(
            `SELECT id FROM crm_qualifications 
             WHERE opportunity_id = ? AND status = 'Approved'
             ORDER BY version DESC LIMIT 1`
          )
          .get(opportunityId);
        if (!qual) missing.push('qualification_approved');
        break;
      }

      case 'tender_documents_received': {
        // Check that at least one proposal document or tender info exists
        const hasProposal = db
          .prepare(
            `SELECT id FROM crm_proposals WHERE opportunity_id = ? LIMIT 1`
          )
          .get(opportunityId);
        if (!hasProposal) missing.push('tender_documents_received');
        break;
      }

      case 'proposal_submitted': {
        const submitted = db
          .prepare(
            `SELECT id FROM crm_proposals 
             WHERE opportunity_id = ? AND status = 'Submitted' LIMIT 1`
          )
          .get(opportunityId);
        if (!submitted) missing.push('proposal_submitted');
        break;
      }

      case 'negotiation_complete': {
        // Negotiation complete is signaled by the user explicitly — we check
        // that the opportunity is currently in Negotiation stage
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
 * Requirements: 2.9
 */
export function isOpportunityStale(
  db: Database.Database,
  opportunityId: string
): boolean {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - STALE_THRESHOLD_DAYS);
  const cutoffStr = cutoff.toISOString().split('T')[0];

  const recent = db
    .prepare(
      `SELECT id FROM crm_interactions
       WHERE entity_id = ? AND entity_type = 'opportunity'
         AND interaction_date >= ?
       LIMIT 1`
    )
    .get(opportunityId, cutoffStr);

  return !recent;
}

/**
 * Calculates total pipeline value per stage for active opportunities.
 * Requirements: 2.6
 */
export function calculatePipelineValueByStage(
  db: Database.Database,
  filters: { assignedTo?: string; companyId?: string } = {}
): Record<PipelineStage, number> {
  let query = `
    SELECT stage, SUM(COALESCE(estimated_value, 0)) as total
    FROM crm_opportunities
    WHERE status = 'Active'
  `;
  const params: any[] = [];

  if (filters.assignedTo) {
    query += ' AND assigned_to = ?';
    params.push(filters.assignedTo);
  }
  if (filters.companyId) {
    query += ' AND company_id = ?';
    params.push(filters.companyId);
  }

  query += ' GROUP BY stage';

  const rows = db.prepare(query).all(...params) as { stage: PipelineStage; total: number }[];

  const result = {} as Record<PipelineStage, number>;
  for (const stage of PIPELINE_STAGES) {
    result[stage] = 0;
  }
  for (const row of rows) {
    result[row.stage] = row.total ?? 0;
  }

  return result;
}

/**
 * Calculates weighted sales forecast = sum(value * probability / 100).
 * Requirements: 2.8
 */
export function calculateWeightedForecast(
  db: Database.Database,
  filters: { assignedTo?: string; companyId?: string; period?: string } = {}
): SalesForecast {
  let query = `
    SELECT stage, 
           COUNT(*) as cnt,
           SUM(COALESCE(estimated_value, 0)) as total_value,
           SUM(COALESCE(estimated_value, 0) * probability / 100.0) as weighted_value
    FROM crm_opportunities
    WHERE status = 'Active'
  `;
  const params: any[] = [];

  if (filters.assignedTo) {
    query += ' AND assigned_to = ?';
    params.push(filters.assignedTo);
  }
  if (filters.companyId) {
    query += ' AND company_id = ?';
    params.push(filters.companyId);
  }

  query += ' GROUP BY stage';

  const rows = db.prepare(query).all(...params) as {
    stage: PipelineStage;
    cnt: number;
    total_value: number;
    weighted_value: number;
  }[];

  let totalWeighted = 0;
  let totalCount = 0;

  const byStage = PIPELINE_STAGES.map((stage) => {
    const row = rows.find((r) => r.stage === stage);
    const count = row?.cnt ?? 0;
    const totalValue = row?.total_value ?? 0;
    const weightedValue = row?.weighted_value ?? 0;
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
 * Requirements: 2.7
 */
export function buildKanbanData(
  db: Database.Database,
  filters: { assignedTo?: string; companyId?: string } = {}
): KanbanColumn[] {
  let query = `
    SELECT o.*, c.company_name,
      (SELECT MAX(i.interaction_date) 
       FROM crm_interactions i 
       WHERE i.entity_id = o.id AND i.entity_type = 'opportunity') as last_activity
    FROM crm_opportunities o
    LEFT JOIN crm_customers c ON o.customer_id = c.id
    WHERE o.status = 'Active'
  `;
  const params: any[] = [];

  if (filters.assignedTo) {
    query += ' AND o.assigned_to = ?';
    params.push(filters.assignedTo);
  }
  if (filters.companyId) {
    query += ' AND o.company_id = ?';
    params.push(filters.companyId);
  }

  query += ' ORDER BY o.updated_at DESC';

  const rows = db.prepare(query).all(...params) as any[];

  const columns: KanbanColumn[] = PIPELINE_STAGES.map((stage) => {
    const stageOpps = rows.filter((r) => r.stage === stage);
    const opportunities: OpportunitySummary[] = stageOpps.map((r) =>
      mapToOpportunitySummary(r, isStaleFromLastActivity(r.last_activity))
    );
    const totalValue = stageOpps.reduce(
      (sum, r) => sum + (r.estimated_value ?? 0),
      0
    );
    return { stage, opportunities, totalValue, count: stageOpps.length };
  });

  return columns;
}

/**
 * Builds funnel chart data showing conversion rates between stages.
 */
export function buildFunnelData(
  db: Database.Database,
  filters: { assignedTo?: string; companyId?: string } = {}
): FunnelStageData[] {
  let query = `
    SELECT stage, COUNT(*) as cnt, SUM(COALESCE(estimated_value, 0)) as total_value
    FROM crm_opportunities
    WHERE status IN ('Active', 'Won', 'Lost', 'Cancelled')
  `;
  const params: any[] = [];

  if (filters.assignedTo) {
    query += ' AND assigned_to = ?';
    params.push(filters.assignedTo);
  }
  if (filters.companyId) {
    query += ' AND company_id = ?';
    params.push(filters.companyId);
  }

  query += ' GROUP BY stage';

  const rows = db.prepare(query).all(...params) as {
    stage: PipelineStage;
    cnt: number;
    total_value: number;
  }[];

  const countByStage: Record<string, number> = {};
  for (const row of rows) {
    countByStage[row.stage] = row.cnt;
  }

  return PIPELINE_STAGES.map((stage, idx) => {
    const count = countByStage[stage] ?? 0;
    const totalValue = rows.find((r) => r.stage === stage)?.total_value ?? 0;
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

function mapToOpportunitySummary(row: any, isStale: boolean): OpportunitySummary {
  return {
    id: row.id,
    name: row.name,
    customerName: row.company_name ?? '',
    estimatedValue: row.estimated_value ?? 0,
    stage: row.stage as PipelineStage,
    assignedTo: row.assigned_to,
    lastActivityDate: row.last_activity ? new Date(row.last_activity) : undefined,
    isStale,
    probability: row.probability ?? STAGE_PROBABILITY[row.stage as PipelineStage],
  };
}

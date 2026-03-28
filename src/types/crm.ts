// CRM Module Types for MAFINDA
// Extends the existing MAFINDA type system

// ============================================================
// CRM Role Types
// ============================================================

export type CRMRole = 'Sales_Manager' | 'Sales_Executive' | 'BD_Manager';

export type PipelineStage =
  | 'Lead'
  | 'Qualification'
  | 'Tender'
  | 'Proposal'
  | 'Negotiation'
  | 'Contract';

export type OpportunityStatus = 'Active' | 'Won' | 'Lost' | 'On_Hold' | 'Cancelled';

export type ContractStatus =
  | 'Draft'
  | 'Internal_Review'
  | 'Approved'
  | 'Pending_Client_Signature'
  | 'Signed'
  | 'Active'
  | 'Completed'
  | 'Terminated';

export type InteractionType = 'Visit' | 'Phone' | 'Email' | 'Meeting' | 'Other';

export type ContactRole = 'PIC' | 'Decision_Maker' | 'Technical' | 'Other';

export type QualificationStatus = 'Draft' | 'Approved' | 'Rejected';

export type QualificationRecommendation = 'Proceed' | 'Hold' | 'Reject';

export type ProposalStatus =
  | 'Draft'
  | 'In_Review'
  | 'Approved'
  | 'Submitted'
  | 'Revision_Required';

export type IntegrationStatus = 'Pending' | 'Success' | 'Failed';

export type AuditAction =
  | 'create'
  | 'update'
  | 'delete'
  | 'transition'
  | 'approve'
  | 'reject';

export type CloseCategory = 'Harga' | 'Teknis' | 'Kompetitor' | 'Waktu' | 'Lainnya';

// ============================================================
// Stage Probability Defaults
// ============================================================

export const STAGE_PROBABILITY: Record<PipelineStage, number> = {
  Lead: 10,
  Qualification: 25,
  Tender: 40,
  Proposal: 55,
  Negotiation: 75,
  Contract: 90,
};

// ============================================================
// Stage Transition Validation Requirements
// ============================================================

export const STAGE_TRANSITION_REQUIREMENTS: Record<PipelineStage, string[]> = {
  Lead: [],
  Qualification: ['customer_id', 'estimated_value', 'assigned_to'],
  Tender: ['qualification_approved'],
  Proposal: ['tender_documents_received'],
  Negotiation: ['proposal_submitted'],
  Contract: ['negotiation_complete'],
};

// ============================================================
// CRM Role Permissions
// ============================================================

export const CRM_ROLE_PERMISSIONS: Record<CRMRole, string[]> = {
  Sales_Manager: [
    'crm:read:all',
    'crm:write:all',
    'crm:approve:proposal',
    'crm:approve:contract',
    'crm:manage:targets',
    'crm:view:reports',
    'crm:configure:margin',
  ],
  Sales_Executive: [
    'crm:read:own',
    'crm:write:lead',
    'crm:write:opportunity:own',
    'crm:write:proposal:own',
    'crm:write:interaction',
    'crm:write:customer',
  ],
  BD_Manager: [
    'crm:read:all',
    'crm:approve:qualification',
    'crm:approve:contract',
    'crm:write:qualification',
  ],
};

// ============================================================
// Entity Interfaces
// ============================================================

export interface CRMUserRole {
  id: string;
  userId: string;
  crmRole: CRMRole;
  assignedAt: Date;
  assignedBy: string;
}

export interface Customer {
  id: string;
  companyName: string;
  industry: string;
  address?: string;
  npwp?: string;
  status: 'Active' | 'Inactive';
  contacts: Contact[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Contact {
  id: string;
  customerId: string;
  name: string;
  title?: string;
  phone?: string;
  email?: string;
  role: ContactRole;
  isPrimary: boolean;
  createdAt: Date;
}

export interface Interaction {
  id: string;
  entityId: string;
  entityType: 'customer' | 'opportunity';
  type: InteractionType;
  interactionDate: Date;
  summary: string;
  nextAction?: string;
  nextActionDate?: Date;
  createdBy: string;
  createdAt: Date;
}

export interface Opportunity {
  id: string;
  name: string;
  customerId: string;
  customerName?: string;
  stage: PipelineStage;
  status: OpportunityStatus;
  estimatedValue?: number;
  probability: number;
  assignedTo: string;
  companyId: string;
  description?: string;
  tenderName?: string;
  tenderEstimatedValue?: number;
  tenderAnnouncementDate?: Date;
  closeReason?: string;
  closeCategory?: CloseCategory;
  closedAt?: Date;
  closedBy?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  lastActivityDate?: Date;
}

export interface OpportunitySummary {
  id: string;
  name: string;
  customerName: string;
  estimatedValue: number;
  stage: PipelineStage;
  assignedTo: string;
  lastActivityDate?: Date;
  isStale: boolean; // true if no activity for > 14 days
  probability: number;
}

export interface OpportunityValueHistory {
  id: string;
  opportunityId: string;
  oldValue?: number;
  newValue: number;
  changedBy: string;
  changedAt: Date;
}

export interface StageTransition {
  id: string;
  opportunityId: string;
  fromStage?: PipelineStage;
  toStage: PipelineStage;
  transitionedBy: string;
  transitionedAt: Date;
  notes?: string;
}

export interface Competitor {
  id: string;
  opportunityId: string;
  competitorName: string;
  estimatedBidValue?: number;
  notes?: string;
  createdBy: string;
  createdAt: Date;
}

export interface Qualification {
  id: string;
  opportunityId: string;
  version: number;
  // Technical dimensions (0-10 per criterion)
  technicalCapabilityScore?: number;
  resourceAvailabilityScore?: number;
  // Business dimensions (0-10 per criterion)
  contractValueScore?: number;
  estimatedMarginScore?: number;
  riskScore?: number;
  // Results
  feasibilityScore: number; // 0-100
  recommendation: QualificationRecommendation;
  notes?: string;
  resourcePlan?: ResourcePlanItem[];
  status: QualificationStatus;
  createdBy: string;
  createdAt: Date;
  approvedBy?: string;
  approvedAt?: Date;
}

export interface ResourcePlanItem {
  position: string;
  count: number;
  durationMonths: number;
}

export interface Proposal {
  id: string;
  opportunityId: string;
  version: string; // e.g., "v1.0", "v1.1"
  title: string;
  templateId?: string;
  content?: string;
  status: ProposalStatus;
  submissionDeadline?: Date;
  submittedAt?: Date;
  submittedBy?: string;
  submissionMethod?: string;
  clientFeedback?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProposalDocument {
  id: string;
  proposalId: string;
  fileName: string;
  filePath: string;
  fileSize: number; // bytes
  fileType: 'pdf' | 'docx' | 'xlsx';
  uploadedBy: string;
  uploadedAt: Date;
}

export interface ProposalVersion {
  id: string;
  proposalId: string;
  version: string;
  snapshot: string; // JSON snapshot of proposal
  createdBy: string;
  createdAt: Date;
}

export interface CostEstimation {
  id: string;
  opportunityId: string;
  version: number;
  materialCost: number;
  laborCost: number;
  equipmentCost: number;
  subcontractorCost: number;
  overheadCost: number;
  totalCost: number;
  opportunityValue: number;
  marginPercentage: number; // (value - cost) / value * 100
  resourcePlan?: ResourcePlanItem[];
  notes?: string;
  createdBy: string;
  createdAt: Date;
}

export interface Contract {
  id: string;
  opportunityId: string;
  contractNumber?: string;
  title: string;
  customerId: string;
  value: number;
  startDate?: Date;
  endDate?: Date;
  scopeOfWork?: string;
  status: ContractStatus;
  // Approval tracking
  bdManagerApprovedBy?: string;
  bdManagerApprovedAt?: Date;
  salesManagerApprovedBy?: string;
  salesManagerApprovedAt?: Date;
  // Signing
  signedAt?: Date;
  signedBy?: string;
  // MAFINDA integration
  mafindaProjectId?: string;
  integrationStatus?: IntegrationStatus;
  integrationError?: string;
  // Metadata
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ContractDocument {
  id: string;
  contractId: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  version: number;
  uploadedBy: string;
  uploadedAt: Date;
}

export interface SalesTarget {
  id: string;
  userId: string;
  period: string; // format: YYYY-MM, YYYY-QN, or YYYY
  targetRevenue: number;
  targetDeals?: number;
  setBy: string;
  createdAt: Date;
}

export interface CRMAuditLog {
  id: string;
  userId: string;
  action: AuditAction;
  entityType: string;
  entityId: string;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  createdAt: Date;
}

// ============================================================
// API Input Types
// ============================================================

export interface CreateCustomerInput {
  companyName: string;
  industry: string;
  address?: string;
  npwp?: string;
  contacts: CreateContactInput[];
}

export interface CreateContactInput {
  name: string;
  title?: string;
  phone?: string;
  email?: string;
  role: ContactRole;
  isPrimary?: boolean;
}

export interface CreateInteractionInput {
  entityId: string;
  entityType: 'customer' | 'opportunity';
  type: InteractionType;
  interactionDate: Date;
  summary: string;
  nextAction?: string;
  nextActionDate?: Date;
}

export interface CreateOpportunityInput {
  name: string;
  customerId: string;
  estimatedValue?: number;
  assignedTo: string;
  companyId: string;
  description?: string;
  tenderName?: string;
  tenderEstimatedValue?: number;
  tenderAnnouncementDate?: Date;
}

export interface TransitionStageInput {
  toStage: PipelineStage;
  notes?: string;
}

export interface CloseOpportunityInput {
  status: 'Won' | 'Lost' | 'Cancelled';
  closeReason?: string;
  closeCategory?: CloseCategory;
}

export interface CreateQualificationInput {
  technicalCapabilityScore?: number;
  resourceAvailabilityScore?: number;
  contractValueScore?: number;
  estimatedMarginScore?: number;
  riskScore?: number;
  notes?: string;
  resourcePlan?: ResourcePlanItem[];
}

export interface CreateProposalInput {
  title: string;
  templateId?: string;
  content?: string;
  submissionDeadline?: Date;
}

export interface CreateCostEstimationInput {
  materialCost: number;
  laborCost: number;
  equipmentCost: number;
  subcontractorCost: number;
  overheadCost: number;
  opportunityValue: number;
  resourcePlan?: ResourcePlanItem[];
  notes?: string;
}

export interface CreateContractInput {
  title: string;
  value: number;
  startDate?: Date;
  endDate?: Date;
  scopeOfWork?: string;
}

// ============================================================
// Dashboard / Analytics Types
// ============================================================

export interface DashboardMetrics {
  totalPipelineValue: number;
  activeOpportunities: number;
  winRate: number; // current period
  revenueForecast: number;
  newLeadsThisMonth: number;
  overdueOpportunities: number;
}

export interface KanbanColumn {
  stage: PipelineStage;
  opportunities: OpportunitySummary[];
  totalValue: number;
  count: number;
}

export interface FunnelStageData {
  stage: PipelineStage;
  count: number;
  totalValue: number;
  conversionRate: number; // % from previous stage
}

export interface SalesForecast {
  period: string;
  weightedPipelineValue: number; // sum(value * probability / 100)
  expectedRevenue: number;
  opportunityCount: number;
  byStage: {
    stage: PipelineStage;
    count: number;
    totalValue: number;
    weightedValue: number;
  }[];
}

export interface SalesKPI {
  userId: string;
  userName: string;
  newLeads: number;
  activeOpportunities: number;
  wonDeals: number;
  lostDeals: number;
  winRate: number;
  totalRevenue: number;
  target: number;
  achievementPercentage: number;
}

export interface WinLossAnalysis {
  period: string;
  userId?: string;
  totalWon: number;
  totalLost: number;
  winRate: number;
  byCategory: Record<CloseCategory, number>;
}

// ============================================================
// Error Response Type
// ============================================================

export interface CRMErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
}

import {
  boolean,
  integer,
  jsonb,
  numeric,
  pgSchema,
  text,
  timestamp,
  unique,
  uuid,
  varchar,
  AnyPgColumn,
} from 'drizzle-orm/pg-core';
import { corporates, users } from './public';

// ============================================================================
// crm schema — 13 tables
// ============================================================================

export const crmSchema = pgSchema('crm');

// --- 1. customers -----------------------------------------------------------

export const customers = crmSchema.table('customers', {
  id: uuid().primaryKey().defaultRandom(),
  companyName: varchar('company_name', { length: 200 }).notNull(),
  industry: varchar({ length: 100 }).notNull(),
  address: text(),
  npwp: varchar({ length: 30 }),
  parentCustomerId: uuid('parent_customer_id').references((): AnyPgColumn => customers.id, { onDelete: 'set null' }),
  status: varchar({ length: 20 }).notNull().default('Active'),
  createdBy: uuid('created_by').notNull().references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedBy: varchar('updated_by', { length: 100 }),
  updatedAt: timestamp('updated_at', { withTimezone: true }),
}, (table) => [
  unique('uq_customer_name_npwp').on(table.companyName, table.npwp),
]);

// --- 2. contacts ------------------------------------------------------------

export const contacts = crmSchema.table('contacts', {
  id: uuid().primaryKey().defaultRandom(),
  customerId: uuid('customer_id').notNull().references(() => customers.id, { onDelete: 'cascade' }),
  name: varchar({ length: 100 }).notNull(),
  title: varchar({ length: 100 }),
  phone: varchar({ length: 30 }),
  email: varchar({ length: 255 }),
  role: varchar({ length: 20 }),
  isPrimary: boolean('is_primary').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// --- 3. interactions --------------------------------------------------------

export const interactions = crmSchema.table('interactions', {
  id: uuid().primaryKey().defaultRandom(),
  entityId: uuid('entity_id').notNull(),
  entityType: varchar('entity_type', { length: 20 }).notNull(),
  type: varchar({ length: 20 }).notNull(),
  interactionDate: timestamp('interaction_date', { mode: 'date' }).notNull(),
  summary: text().notNull(),
  nextAction: text('next_action'),
  nextActionDate: timestamp('next_action_date', { mode: 'date' }),
  createdBy: uuid('created_by').notNull().references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// --- 4. opportunities -------------------------------------------------------

export const opportunities = crmSchema.table('opportunities', {
  id: uuid().primaryKey().defaultRandom(),
  name: varchar({ length: 200 }).notNull(),
  customerId: uuid('customer_id').notNull().references(() => customers.id),
  corporateId: uuid('corporate_id').notNull().references(() => corporates.id),
  stage: varchar({ length: 20 }).notNull().default('Lead'),
  status: varchar({ length: 20 }).notNull().default('Active'),
  estimatedValue: numeric('estimated_value', { precision: 18, scale: 2 }),
  probability: integer().notNull().default(10),
  assignedTo: uuid('assigned_to').notNull().references(() => users.id),
  description: text(),
  tenderName: varchar('tender_name', { length: 200 }),
  tenderEstimatedValue: numeric('tender_estimated_value', { precision: 18, scale: 2 }),
  tenderAnnouncementDate: timestamp('tender_announcement_date', { mode: 'date' }),
  closeReason: text('close_reason'),
  closeCategory: varchar('close_category', { length: 20 }),
  closedAt: timestamp('closed_at', { withTimezone: true }),
  closedBy: uuid('closed_by').references(() => users.id),
  createdBy: uuid('created_by').notNull().references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedBy: varchar('updated_by', { length: 100 }),
  updatedAt: timestamp('updated_at', { withTimezone: true }),
});

// --- 5. opportunity_value_history -------------------------------------------

export const opportunityValueHistory = crmSchema.table('opportunity_value_history', {
  id: uuid().primaryKey().defaultRandom(),
  opportunityId: uuid('opportunity_id').notNull().references(() => opportunities.id),
  oldValue: numeric('old_value', { precision: 18, scale: 2 }),
  newValue: numeric('new_value', { precision: 18, scale: 2 }).notNull(),
  changedBy: uuid('changed_by').notNull().references(() => users.id),
  changedAt: timestamp('changed_at', { withTimezone: true }).notNull().defaultNow(),
});

// --- 6. stage_transitions ---------------------------------------------------

export const stageTransitions = crmSchema.table('stage_transitions', {
  id: uuid().primaryKey().defaultRandom(),
  opportunityId: uuid('opportunity_id').notNull().references(() => opportunities.id),
  fromStage: varchar('from_stage', { length: 20 }),
  toStage: varchar('to_stage', { length: 20 }).notNull(),
  transitionedBy: uuid('transitioned_by').notNull().references(() => users.id),
  transitionedAt: timestamp('transitioned_at', { withTimezone: true }).notNull().defaultNow(),
  notes: text(),
});

// --- 7. competitors ---------------------------------------------------------

export const competitors = crmSchema.table('competitors', {
  id: uuid().primaryKey().defaultRandom(),
  opportunityId: uuid('opportunity_id').notNull().references(() => opportunities.id),
  competitorName: varchar('competitor_name', { length: 200 }).notNull(),
  estimatedBidValue: numeric('estimated_bid_value', { precision: 18, scale: 2 }),
  notes: text(),
  createdBy: uuid('created_by').notNull().references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// --- 8. qualifications ------------------------------------------------------

export const qualifications = crmSchema.table('qualifications', {
  id: uuid().primaryKey().defaultRandom(),
  opportunityId: uuid('opportunity_id').notNull().references(() => opportunities.id),
  version: integer().notNull().default(1),
  technicalCapabilityScore: integer('technical_capability_score'),
  resourceAvailabilityScore: integer('resource_availability_score'),
  contractValueScore: integer('contract_value_score'),
  estimatedMarginScore: integer('estimated_margin_score'),
  riskScore: integer('risk_score'),
  feasibilityScore: numeric('feasibility_score', { precision: 5, scale: 2 }).notNull(),
  recommendation: varchar({ length: 20 }),
  notes: text(),
  resourcePlan: text('resource_plan'),
  status: varchar({ length: 20 }).notNull().default('Draft'),
  createdBy: uuid('created_by').notNull().references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }),
});

// --- 9. proposals -----------------------------------------------------------

export const proposals = crmSchema.table('proposals', {
  id: uuid().primaryKey().defaultRandom(),
  opportunityId: uuid('opportunity_id').notNull().references(() => opportunities.id),
  version: varchar({ length: 10 }).notNull().default('v1.0'),
  title: varchar({ length: 200 }).notNull(),
  templateId: uuid('template_id'),
  content: text(),
  status: varchar({ length: 30 }).notNull().default('Draft'),
  submissionDeadline: timestamp('submission_deadline', { mode: 'date' }),
  submittedAt: timestamp('submitted_at', { withTimezone: true }),
  submittedBy: uuid('submitted_by').references(() => users.id),
  submissionMethod: varchar('submission_method', { length: 50 }),
  clientFeedback: text('client_feedback'),
  createdBy: uuid('created_by').notNull().references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedBy: varchar('updated_by', { length: 100 }),
  updatedAt: timestamp('updated_at', { withTimezone: true }),
});

// --- 10. proposal_documents -------------------------------------------------

export const proposalDocuments = crmSchema.table('proposal_documents', {
  id: uuid().primaryKey().defaultRandom(),
  proposalId: uuid('proposal_id').notNull().references(() => proposals.id, { onDelete: 'cascade' }),
  fileName: varchar('file_name', { length: 255 }).notNull(),
  filePath: text('file_path').notNull(),
  fileSize: integer('file_size').notNull(),
  fileType: varchar('file_type', { length: 10 }),
  uploadedBy: uuid('uploaded_by').notNull().references(() => users.id),
  uploadedAt: timestamp('uploaded_at', { withTimezone: true }).notNull().defaultNow(),
});

// --- 11. proposal_versions --------------------------------------------------

export const proposalVersions = crmSchema.table('proposal_versions', {
  id: uuid().primaryKey().defaultRandom(),
  proposalId: uuid('proposal_id').notNull().references(() => proposals.id),
  version: varchar({ length: 10 }).notNull(),
  snapshot: jsonb().notNull(),
  createdBy: uuid('created_by').notNull().references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// --- 12. cost_estimations ---------------------------------------------------

export const costEstimations = crmSchema.table('cost_estimations', {
  id: uuid().primaryKey().defaultRandom(),
  opportunityId: uuid('opportunity_id').notNull().references(() => opportunities.id),
  version: integer().notNull().default(1),
  materialCost: numeric('material_cost', { precision: 18, scale: 2 }).notNull().default('0'),
  laborCost: numeric('labor_cost', { precision: 18, scale: 2 }).notNull().default('0'),
  equipmentCost: numeric('equipment_cost', { precision: 18, scale: 2 }).notNull().default('0'),
  subcontractorCost: numeric('subcontractor_cost', { precision: 18, scale: 2 }).notNull().default('0'),
  overheadCost: numeric('overhead_cost', { precision: 18, scale: 2 }).notNull().default('0'),
  totalCost: numeric('total_cost', { precision: 18, scale: 2 }).notNull(),
  opportunityValue: numeric('opportunity_value', { precision: 18, scale: 2 }).notNull(),
  marginPercentage: numeric('margin_percentage', { precision: 5, scale: 2 }).notNull(),
  resourcePlan: text('resource_plan'),
  notes: text(),
  createdBy: uuid('created_by').notNull().references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// --- 13. contracts ----------------------------------------------------------

export const contracts = crmSchema.table('contracts', {
  id: uuid().primaryKey().defaultRandom(),
  opportunityId: uuid('opportunity_id').notNull().references(() => opportunities.id),
  contractNumber: varchar('contract_number', { length: 50 }).unique(),
  title: varchar({ length: 200 }).notNull(),
  customerId: uuid('customer_id').notNull().references(() => customers.id),
  value: numeric({ precision: 18, scale: 2 }).notNull(),
  startDate: timestamp('start_date', { mode: 'date' }),
  endDate: timestamp('end_date', { mode: 'date' }),
  scopeOfWork: text('scope_of_work'),
  status: varchar({ length: 30 }).notNull().default('Draft'),
  signedAt: timestamp('signed_at', { withTimezone: true }),
  signedBy: varchar('signed_by', { length: 100 }),
  createdBy: uuid('created_by').notNull().references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedBy: varchar('updated_by', { length: 100 }),
  updatedAt: timestamp('updated_at', { withTimezone: true }),
});

// --- 14. contract_documents -------------------------------------------------

export const contractDocuments = crmSchema.table('contract_documents', {
  id: uuid().primaryKey().defaultRandom(),
  contractId: uuid('contract_id').notNull().references(() => contracts.id, { onDelete: 'cascade' }),
  fileName: varchar('file_name', { length: 255 }).notNull(),
  filePath: text('file_path').notNull(),
  fileSize: integer('file_size').notNull(),
  version: integer().notNull().default(1),
  uploadedBy: uuid('uploaded_by').notNull().references(() => users.id),
  uploadedAt: timestamp('uploaded_at', { withTimezone: true }).notNull().defaultNow(),
});

// --- 15. sales_targets ------------------------------------------------------

export const salesTargets = crmSchema.table('sales_targets', {
  id: uuid().primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  period: varchar({ length: 10 }).notNull(),
  targetRevenue: numeric('target_revenue', { precision: 18, scale: 2 }).notNull(),
  targetDeals: integer('target_deals'),
  setBy: uuid('set_by').notNull().references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  unique('uq_sales_target_user_period').on(table.userId, table.period),
]);

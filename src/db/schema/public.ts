import { sql } from 'drizzle-orm';
import {
  boolean,
  check,
  inet,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

// ============================================================================
// public schema — 12 tables
// ============================================================================

// --- 1. roles ---------------------------------------------------------------

export const roles = pgTable('roles', {
  id: uuid().primaryKey().defaultRandom(),
  name: varchar({ length: 50 }).notNull().unique(),
  scope: varchar({ length: 20 }).notNull(),
  permissions: jsonb().notNull().$type<string[]>(),
  description: text(),
  isActive: boolean('is_active').notNull().default(true),
  createdBy: varchar('created_by', { length: 100 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedBy: varchar('updated_by', { length: 100 }),
  updatedAt: timestamp('updated_at', { withTimezone: true }),
});

// --- 2. users ---------------------------------------------------------------

export const users = pgTable('users', {
  id: uuid().primaryKey().defaultRandom(),
  username: varchar({ length: 50 }).unique(),
  email: varchar({ length: 255 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  passwordResetTokenHash: text('password_reset_token_hash'),
  passwordResetExpiresAt: timestamp('password_reset_expires_at', { withTimezone: true }),
  fullName: varchar('full_name', { length: 100 }).notNull(),
  avatarUrl: text('avatar_url'),
  isActive: boolean('is_active').notNull().default(true),
  passwordChangedAt: timestamp('password_changed_at', { withTimezone: true }),
  failedLoginAttempts: integer('failed_login_attempts').notNull().default(0),
  lockedUntil: timestamp('locked_until', { withTimezone: true }),
  lastLogin: timestamp('last_login', { withTimezone: true }),
  createdBy: varchar('created_by', { length: 100 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedBy: varchar('updated_by', { length: 100 }),
  updatedAt: timestamp('updated_at', { withTimezone: true }),
});

// --- 3. corporates ----------------------------------------------------------

export const corporates = pgTable('corporates', {
  id: uuid().primaryKey().defaultRandom(),
  name: varchar({ length: 100 }).notNull(),
  code: varchar({ length: 10 }).notNull().unique(),
  logo: text(),
  industry: varchar({ length: 50 }),
  fiscalYearStartMonth: integer('fiscal_year_start_month').notNull().default(1),
  currency: varchar({ length: 10 }).notNull().default('IDR'),
  taxRate: numeric('tax_rate', { precision: 5, scale: 2 }),
  isActive: boolean('is_active').notNull().default(true),
  createdBy: varchar('created_by', { length: 100 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedBy: varchar('updated_by', { length: 100 }),
  updatedAt: timestamp('updated_at', { withTimezone: true }),
}, (table) => [
  check('fiscal_month_check', sql`${table.fiscalYearStartMonth} >= 1 AND ${table.fiscalYearStartMonth} <= 12`),
]);

// --- 4. departments ---------------------------------------------------------

export const departments = pgTable('departments', {
  id: uuid().primaryKey().defaultRandom(),
  corporateId: uuid('corporate_id').notNull().references(() => corporates.id),
  name: varchar({ length: 100 }).notNull(),
  code: varchar({ length: 20 }).notNull(),
  description: text(),
  headName: varchar('head_name', { length: 100 }),
  isActive: boolean('is_active').notNull().default(true),
  createdBy: varchar('created_by', { length: 100 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedBy: varchar('updated_by', { length: 100 }),
  updatedAt: timestamp('updated_at', { withTimezone: true }),
}, (table) => [
  unique('uq_dept_corporate_code').on(table.corporateId, table.code),
]);

// --- 5. projects ------------------------------------------------------------

export const projects = pgTable('projects', {
  id: uuid().primaryKey().defaultRandom(),
  departmentId: uuid('department_id').notNull().references(() => departments.id),
  code: varchar({ length: 20 }).notNull(),
  name: varchar({ length: 100 }).notNull(),
  description: text(),
  sourceType: varchar('source_type', { length: 20 }).notNull().default('manual'),
  sourceId: uuid('source_id'),
  status: varchar({ length: 20 }).notNull().default('active'),
  startDate: timestamp('start_date', { mode: 'date' }),
  endDate: timestamp('end_date', { mode: 'date' }),
  isActive: boolean('is_active').notNull().default(true),
  createdBy: varchar('created_by', { length: 100 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedBy: varchar('updated_by', { length: 100 }),
  updatedAt: timestamp('updated_at', { withTimezone: true }),
}, (table) => [
  unique('uq_project_dept_code').on(table.departmentId, table.code),
]);

// --- 6. user_corporate_accesses ---------------------------------------------

export const userCorporateAccesses = pgTable('user_corporate_accesses', {
  id: uuid().primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  roleId: uuid('role_id').notNull().references(() => roles.id),
  scope: varchar({ length: 20 }).notNull(),
  corporateId: uuid('corporate_id').references(() => corporates.id),
  departmentId: uuid('department_id').references(() => departments.id),
  grantedBy: uuid('granted_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  check('chk_scope', sql`
    (${table.scope} = 'system' AND ${table.corporateId} IS NULL AND ${table.departmentId} IS NULL) OR
    (${table.scope} = 'corporate' AND ${table.corporateId} IS NOT NULL AND ${table.departmentId} IS NULL) OR
    (${table.scope} = 'department' AND ${table.corporateId} IS NOT NULL AND ${table.departmentId} IS NOT NULL)
  `),
  uniqueIndex('uq_uca_dept').on(table.userId, table.roleId, table.departmentId)
    .where(sql`${table.scope} = 'department'`),
  uniqueIndex('uq_uca_corporate').on(table.userId, table.roleId, table.corporateId)
    .where(sql`${table.scope} = 'corporate'`),
  uniqueIndex('uq_uca_system').on(table.userId, table.roleId)
    .where(sql`${table.scope} = 'system'`),
]);

// --- 7. audit_logs ----------------------------------------------------------

export const auditLogs = pgTable('audit_logs', {
  id: uuid().primaryKey().defaultRandom(),
  departmentId: uuid('department_id').references(() => departments.id),
  userId: uuid('user_id').references(() => users.id),
  module: varchar({ length: 50 }),
  action: varchar({ length: 50 }).notNull(),
  entityType: varchar('entity_type', { length: 50 }).notNull(),
  entityId: uuid('entity_id'),
  oldValues: jsonb('old_values'),
  newValues: jsonb('new_values'),
  justification: text(),
  ipAddress: inet('ip_address'),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// --- 8. system_configs ------------------------------------------------------

export const systemConfigs = pgTable('system_configs', {
  key: varchar({ length: 100 }).primaryKey(),
  value: jsonb().notNull(),
  description: text(),
  createdBy: varchar('created_by', { length: 100 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedBy: varchar('updated_by', { length: 100 }),
  updatedAt: timestamp('updated_at', { withTimezone: true }),
});

// --- 9. approval_workflows --------------------------------------------------

export const approvalWorkflows = pgTable('approval_workflows', {
  id: uuid().primaryKey().defaultRandom(),
  module: varchar({ length: 50 }).notNull(),
  entityType: varchar('entity_type', { length: 50 }).notNull(),
  action: varchar({ length: 20 }).notNull(),
  name: varchar({ length: 100 }).notNull(),
  description: text(),
  callbackHandler: varchar('callback_handler', { length: 100 }).notNull(),
  isActive: boolean('is_active').notNull().default(true),
  createdBy: varchar('created_by', { length: 100 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedBy: varchar('updated_by', { length: 100 }),
  updatedAt: timestamp('updated_at', { withTimezone: true }),
}, (table) => [
  unique('uq_workflow_module_entity_action').on(table.module, table.entityType, table.action),
]);

// --- 10. approval_workflow_steps --------------------------------------------

export const approvalWorkflowSteps = pgTable('approval_workflow_steps', {
  id: uuid().primaryKey().defaultRandom(),
  workflowId: uuid('workflow_id').notNull().references(() => approvalWorkflows.id),
  stepOrder: integer('step_order').notNull(),
  stepType: varchar('step_type', { length: 20 }).notNull(),
  requiredRole: varchar('required_role', { length: 50 }).notNull(),
  condition: jsonb().$type<{ field: string; operator: string; value: number } | null>(),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  unique('uq_workflow_step_order').on(table.workflowId, table.stepOrder),
]);

// --- 11. approvals ----------------------------------------------------------

export const approvals = pgTable('approvals', {
  id: uuid().primaryKey().defaultRandom(),
  workflowId: uuid('workflow_id').notNull().references(() => approvalWorkflows.id),
  currentStepId: uuid('current_step_id').references(() => approvalWorkflowSteps.id),
  module: varchar({ length: 50 }).notNull(),
  entityType: varchar('entity_type', { length: 50 }).notNull(),
  entityId: uuid('entity_id'),
  payload: jsonb().notNull(),
  status: varchar({ length: 20 }).notNull().default('pending'),
  requestedBy: uuid('requested_by').notNull().references(() => users.id),
  approvedBy: uuid('approved_by').references(() => users.id),
  departmentId: uuid('department_id').references(() => departments.id),
  metadata: jsonb(),
  rejectionNotes: text('rejection_notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
});

// --- 12. approval_histories -------------------------------------------------

export const approvalHistories = pgTable('approval_histories', {
  id: uuid().primaryKey().defaultRandom(),
  approvalId: uuid('approval_id').notNull().references(() => approvals.id),
  stepId: uuid('step_id').notNull().references(() => approvalWorkflowSteps.id),
  action: varchar({ length: 20 }).notNull(),
  actedBy: uuid('acted_by').notNull().references(() => users.id),
  comments: text(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

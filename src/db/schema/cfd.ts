import { sql } from 'drizzle-orm';
import {
  boolean,
  check,
  integer,
  jsonb,
  numeric,
  pgSchema,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { corporates, departments, projects, users } from './public';

// ============================================================================
// cfd schema — 8 tables
// ============================================================================

export const cfdSchema = pgSchema('cfd');

// --- 1. target_headers (master) ---------------------------------------------

export const targetHeaders = cfdSchema.table('target_headers', {
  id: uuid().primaryKey().defaultRandom(),
  departmentId: uuid('department_id').notNull().references(() => departments.id),
  projectId: uuid('project_id').references(() => projects.id),
  fiscalYear: integer('fiscal_year').notNull(),
  fiscalMonth: integer('fiscal_month').notNull(),
  notes: text(),
  createdBy: varchar('created_by', { length: 100 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedBy: varchar('updated_by', { length: 100 }),
  updatedAt: timestamp('updated_at', { withTimezone: true }),
}, (table) => [
  unique('uq_target_header').on(table.departmentId, table.projectId, table.fiscalYear, table.fiscalMonth),
  check('fiscal_month_check', sql`${table.fiscalMonth} >= 1 AND ${table.fiscalMonth} <= 12`),
]);

// --- 2. target_details (detail) ---------------------------------------------

export const targetDetails = cfdSchema.table('target_details', {
  id: uuid().primaryKey().defaultRandom(),
  targetHeaderId: uuid('target_header_id').notNull().references(() => targetHeaders.id, { onDelete: 'cascade' }),
  targetType: varchar('target_type', { length: 20 }).notNull(),
  costCenter: varchar('cost_center', { length: 100 }),
  amount: numeric({ precision: 18, scale: 2 }).notNull(),
  notes: text(),
}, (table) => [
  unique('uq_target_detail').on(table.targetHeaderId, table.targetType, table.costCenter),
]);

// --- 3. weekly_cash_flows ---------------------------------------------------

export const weeklyCashFlows = cfdSchema.table('weekly_cash_flows', {
  id: uuid().primaryKey().defaultRandom(),
  departmentId: uuid('department_id').notNull().references(() => departments.id),
  entityType: varchar('entity_type', { length: 20 }).notNull(),
  entityId: uuid('entity_id').notNull(),
  period: varchar({ length: 7 }).notNull(),
  week: varchar({ length: 2 }).notNull(),
  operatingCashIn: numeric('operating_cash_in', { precision: 18, scale: 2 }).notNull().default('0'),
  operatingCashOut: numeric('operating_cash_out', { precision: 18, scale: 2 }).notNull().default('0'),
  investingCashIn: numeric('investing_cash_in', { precision: 18, scale: 2 }).notNull().default('0'),
  investingCashOut: numeric('investing_cash_out', { precision: 18, scale: 2 }).notNull().default('0'),
  financingCashIn: numeric('financing_cash_in', { precision: 18, scale: 2 }).notNull().default('0'),
  financingCashOut: numeric('financing_cash_out', { precision: 18, scale: 2 }).notNull().default('0'),
  notes: text(),
  createdBy: varchar('created_by', { length: 100 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedBy: varchar('updated_by', { length: 100 }),
  updatedAt: timestamp('updated_at', { withTimezone: true }),
}, (table) => [
  unique('uq_cash_flow_entity_period_week').on(table.entityType, table.entityId, table.period, table.week),
  check('week_check', sql`${table.week} IN ('W1', 'W2', 'W3', 'W4', 'W5')`),
  check('entity_type_check', sql`${table.entityType} IN ('department', 'project')`),
]);

// --- 4. balance_sheets ------------------------------------------------------

export const balanceSheets = cfdSchema.table('balance_sheets', {
  id: uuid().primaryKey().defaultRandom(),
  departmentId: uuid('department_id').notNull().references(() => departments.id),
  period: varchar({ length: 7 }).notNull(),

  // Aktiva Lancar (Current Assets)
  cashAndBank: numeric('cash_and_bank', { precision: 18, scale: 2 }).notNull().default('0'),
  accountsReceivable: numeric('accounts_receivable', { precision: 18, scale: 2 }).notNull().default('0'),
  workInProgress: numeric('work_in_progress', { precision: 18, scale: 2 }).notNull().default('0'),
  inventory: numeric({ precision: 18, scale: 2 }).notNull().default('0'),
  prepaidExpenses: numeric('prepaid_expenses', { precision: 18, scale: 2 }).notNull().default('0'),

  // Aktiva Tetap (Fixed Assets)
  land: numeric({ precision: 18, scale: 2 }).notNull().default('0'),
  building: numeric({ precision: 18, scale: 2 }).notNull().default('0'),
  equipment: numeric({ precision: 18, scale: 2 }).notNull().default('0'),
  otherFixedAssets: numeric('other_fixed_assets', { precision: 18, scale: 2 }).notNull().default('0'),

  // Kewajiban Lancar (Current Liabilities)
  accountsPayable: numeric('accounts_payable', { precision: 18, scale: 2 }).notNull().default('0'),
  bankLoanCurrent: numeric('bank_loan_current', { precision: 18, scale: 2 }).notNull().default('0'),
  otherCurrentLiabilities: numeric('other_current_liabilities', { precision: 18, scale: 2 }).notNull().default('0'),

  // Kewajiban Jangka Panjang (Non-Current Liabilities)
  bankLoanLongTerm: numeric('bank_loan_long_term', { precision: 18, scale: 2 }).notNull().default('0'),
  otherLongTermLiabilities: numeric('other_long_term_liabilities', { precision: 18, scale: 2 }).notNull().default('0'),
  shareholderLoan: numeric('shareholder_loan', { precision: 18, scale: 2 }).notNull().default('0'),

  // Ekuitas (Equity)
  capital: numeric({ precision: 18, scale: 2 }).notNull().default('0'),
  earningsAfterTax: numeric('earnings_after_tax', { precision: 18, scale: 2 }).notNull().default('0'),
  retainedEarnings: numeric('retained_earnings', { precision: 18, scale: 2 }).notNull().default('0'),
  dividends: numeric({ precision: 18, scale: 2 }).notNull().default('0'),

  notes: text(),
  createdBy: varchar('created_by', { length: 100 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedBy: varchar('updated_by', { length: 100 }),
  updatedAt: timestamp('updated_at', { withTimezone: true }),
}, (table) => [
  unique('uq_balance_sheet_dept_period').on(table.departmentId, table.period),
]);

// --- 5. income_statements ---------------------------------------------------

export const incomeStatements = cfdSchema.table('income_statements', {
  id: uuid().primaryKey().defaultRandom(),
  departmentId: uuid('department_id').notNull().references(() => departments.id),
  period: varchar({ length: 7 }).notNull(),
  revenue: numeric({ precision: 18, scale: 2 }).notNull().default('0'),
  cogs: numeric({ precision: 18, scale: 2 }).notNull().default('0'),
  operatingExpenses: numeric('operating_expenses', { precision: 18, scale: 2 }).notNull().default('0'),
  interestExpense: numeric('interest_expense', { precision: 18, scale: 2 }).notNull().default('0'),
  taxExpense: numeric('tax_expense', { precision: 18, scale: 2 }).notNull().default('0'),
  notes: text(),
  createdBy: varchar('created_by', { length: 100 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedBy: varchar('updated_by', { length: 100 }),
  updatedAt: timestamp('updated_at', { withTimezone: true }),
}, (table) => [
  unique('uq_income_stmt_dept_period').on(table.departmentId, table.period),
]);

// --- 6. thresholds ----------------------------------------------------------

interface ThresholdValues {
  healthy_min?: number;
  moderate_min?: number;
  risky_max?: number;
  healthy_max?: number;
  moderate_max?: number;
  risky_min?: number;
}

export const thresholds = cfdSchema.table('thresholds', {
  id: uuid().primaryKey().defaultRandom(),
  corporateId: uuid('corporate_id').notNull().references(() => corporates.id),
  ratioName: varchar('ratio_name', { length: 50 }).notNull(),
  thresholds: jsonb().notNull().$type<ThresholdValues>(),
  isDefault: boolean('is_default').notNull().default(false),
  createdBy: varchar('created_by', { length: 100 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedBy: varchar('updated_by', { length: 100 }),
  updatedAt: timestamp('updated_at', { withTimezone: true }),
}, (table) => [
  unique('uq_threshold_corporate_ratio').on(table.corporateId, table.ratioName),
]);

// --- 7. alerts --------------------------------------------------------------

export const alerts = cfdSchema.table('alerts', {
  id: uuid().primaryKey().defaultRandom(),
  corporateId: uuid('corporate_id').notNull().references(() => corporates.id),
  departmentId: uuid('department_id').references(() => departments.id),
  ratioName: varchar('ratio_name', { length: 50 }).notNull(),
  severity: varchar({ length: 20 }).notNull(),
  currentValue: numeric('current_value', { precision: 10, scale: 4 }).notNull(),
  thresholdValue: numeric('threshold_value', { precision: 10, scale: 4 }).notNull(),
  message: text().notNull(),
  status: varchar({ length: 20 }).notNull().default('active'),
  acknowledgedAt: timestamp('acknowledged_at', { withTimezone: true }),
  acknowledgedBy: uuid('acknowledged_by').references(() => users.id),
  period: varchar({ length: 7 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

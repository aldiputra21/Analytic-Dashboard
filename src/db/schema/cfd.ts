import { sql } from 'drizzle-orm';
import {
  boolean,
  check,
  date,
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
  type AnyPgColumn,
} from 'drizzle-orm/pg-core';
import { banks, corporates, costCenterCategories, departments, projects } from './public';

// ============================================================================
// cfd schema — 8 tables
// ============================================================================

export const cfdSchema = pgSchema('cfd');

// --- 0. cost_centers --------------------------------------------------------

export const costCenters = cfdSchema.table('cost_centers', {
  id: uuid().primaryKey().defaultRandom(),
  corporateId: uuid('corporate_id').notNull().references(() => corporates.id),
  parentId: uuid('parent_id').references((): AnyPgColumn => costCenters.id),
  category: varchar({ length: 50 }).notNull().references(() => costCenterCategories.code),
  name: varchar({ length: 100 }).notNull(),
  code: varchar({ length: 20 }).notNull(),
  description: text(),
  isActive: boolean('is_active').notNull().default(true),
  createdBy: uuid('created_by'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedBy: uuid('updated_by'),
  updatedAt: timestamp('updated_at', { withTimezone: true }),
}, (table) => [
  unique('uq_cost_center_corp_code').on(table.corporateId, table.code),
]);

// --- 1. target_headers (master) ---------------------------------------------

export const targetHeaders = cfdSchema.table('target_headers', {
  id: uuid().primaryKey().defaultRandom(),
  departmentId: uuid('department_id').notNull().references(() => departments.id),
  projectId: uuid('project_id').references(() => projects.id),
  fiscalYear: integer('fiscal_year').notNull(),
  notes: text(),
  createdBy: uuid('created_by').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedBy: uuid('updated_by'),
  updatedAt: timestamp('updated_at', { withTimezone: true }),
}, (table) => [
  unique('uq_target_header').on(table.departmentId, table.projectId, table.fiscalYear),
]);

// --- 2. target_details (detail) ---------------------------------------------

export const targetDetails = cfdSchema.table('target_details', {
  id: uuid().primaryKey().defaultRandom(),
  targetHeaderId: uuid('target_header_id').notNull().references(() => targetHeaders.id, { onDelete: 'cascade' }),
  targetType: varchar('target_type', { length: 20 }).notNull(),
  month: integer('month').notNull(),
  costCenter: varchar('cost_center', { length: 100 }),
  amount: numeric({ precision: 18, scale: 2 }).notNull(),
  notes: text(),
}, (table) => [
  unique('uq_target_detail').on(table.targetHeaderId, table.targetType, table.costCenter, table.month),
  check('detail_month_check', sql`${table.month} >= 1 AND ${table.month} <= 12`),
]);

// --- 3. weekly_cash_flows ---------------------------------------------------

export const weeklyCashFlows = cfdSchema.table('weekly_cash_flows', {
  id: uuid().primaryKey().defaultRandom(),
  corporateId: uuid('corporate_id').notNull().references(() => corporates.id),
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
  createdBy: uuid('created_by').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedBy: uuid('updated_by'),
  updatedAt: timestamp('updated_at', { withTimezone: true }),
}, (table) => [
  unique('uq_cash_flow_entity_period_week').on(table.entityType, table.entityId, table.period, table.week),
  check('week_check', sql`${table.week} IN ('W1', 'W2', 'W3', 'W4', 'W5')`),
  check('entity_type_check', sql`${table.entityType} IN ('corporate', 'project')`),
]);

// --- 4. balance_sheets ------------------------------------------------------

export const balanceSheets = cfdSchema.table('balance_sheets', {
  id: uuid().primaryKey().defaultRandom(),
  corporateId: uuid('corporate_id').notNull().references(() => corporates.id),
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
  createdBy: uuid('created_by').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedBy: uuid('updated_by'),
  updatedAt: timestamp('updated_at', { withTimezone: true }),
}, (table) => [
  unique('uq_balance_sheet_corp_period').on(table.corporateId, table.period),
]);

// --- 5. income_statements ---------------------------------------------------

export const incomeStatements = cfdSchema.table('income_statements', {
  id: uuid().primaryKey().defaultRandom(),
  corporateId: uuid('corporate_id').notNull().references(() => corporates.id),
  period: varchar({ length: 7 }).notNull(),
  revenue: numeric({ precision: 18, scale: 2 }).notNull().default('0'),
  cogs: numeric({ precision: 18, scale: 2 }).notNull().default('0'),
  operatingExpenses: numeric('operating_expenses', { precision: 18, scale: 2 }).notNull().default('0'),
  interestExpense: numeric('interest_expense', { precision: 18, scale: 2 }).notNull().default('0'),
  taxExpense: numeric('tax_expense', { precision: 18, scale: 2 }).notNull().default('0'),
  otherIncome: numeric('other_income', { precision: 18, scale: 2 }).notNull().default('0'),
  otherExpense: numeric('other_expense', { precision: 18, scale: 2 }).notNull().default('0'),
  notes: text(),
  createdBy: uuid('created_by').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedBy: uuid('updated_by'),
  updatedAt: timestamp('updated_at', { withTimezone: true }),
}, (table) => [
  unique('uq_income_stmt_corp_period').on(table.corporateId, table.period),
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
  createdBy: uuid('created_by').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedBy: uuid('updated_by'),
  updatedAt: timestamp('updated_at', { withTimezone: true }),
}, (table) => [
  unique('uq_threshold_corporate_ratio').on(table.corporateId, table.ratioName),
]);


// ============================================================================
// cfd schema — CFD Financial Enhancements additions
// ============================================================================

// --- 7. cash_realizations ---------------------------------------------------

export const cashRealizations = cfdSchema.table('cash_realizations', {
  id: uuid().primaryKey().defaultRandom(),
  entityType: varchar('entity_type', { length: 20 }).notNull(),
  departmentId: uuid('department_id').notNull().references(() => departments.id),
  projectId: uuid('project_id').references(() => projects.id),
  costCenterId: uuid('cost_center_id').references(() => costCenters.id),
  transactionDate: date('transaction_date').notNull(),
  category: varchar({ length: 20 }).notNull(),
  amount: numeric({ precision: 18, scale: 2 }).notNull(),
  notes: text(),
  createdBy: uuid('created_by').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedBy: uuid('updated_by'),
  updatedAt: timestamp('updated_at', { withTimezone: true }),
}, (table) => [
  check('chk_realization_entity_type', sql`${table.entityType} IN ('department', 'project')`),
  check('chk_realization_category', sql`${table.category} IN ('cash-in', 'cash-out')`),
  check('chk_realization_project_required',
    sql`NOT (${table.entityType} = 'project' AND ${table.projectId} IS NULL)`),
]);

// --- 8. bank_loans ----------------------------------------------------------

export const bankLoans = cfdSchema.table('bank_loans', {
  id: uuid().primaryKey().defaultRandom(),
  bankId: uuid('bank_id').notNull().references(() => banks.id),
  corporateId: uuid('corporate_id').notNull().references(() => corporates.id),
  amount: numeric({ precision: 18, scale: 2 }).notNull(),
  startDate: date('start_date').notNull(),
  tenor: integer().notNull(),
  interestType: varchar('interest_type', { length: 20 }).notNull(),
  interestRate: numeric('interest_rate', { precision: 5, scale: 4 }).notNull(),
  status: varchar({ length: 20 }).notNull().default('ongoing'),
  alertMinDays: integer('alert_min_days').notNull().default(5),
  creditType: varchar('credit_type', { length: 20 }).notNull().default('KMK'),
  createdBy: uuid('created_by').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedBy: uuid('updated_by'),
  updatedAt: timestamp('updated_at', { withTimezone: true }),
}, (table) => [
  check('chk_loan_interest_type', sql`${table.interestType} IN ('flat', 'effective')`),
  check('chk_loan_status', sql`${table.status} IN ('ongoing', 'paid')`),
  check('chk_loan_tenor_positive', sql`${table.tenor} > 0`),
  check('chk_loan_credit_type', sql`${table.creditType} IN ('KMK', 'KMI')`),
]);

// --- 9. bank_loan_installments ----------------------------------------------

export const bankLoanInstallments = cfdSchema.table('bank_loan_installments', {
  id: uuid().primaryKey().defaultRandom(),
  bankLoanId: uuid('bank_loan_id').notNull().references(() => bankLoans.id, { onDelete: 'cascade' }),
  installmentDate: date('installment_date').notNull(),
  amount: numeric({ precision: 18, scale: 2 }).notNull(),
  status: varchar({ length: 20 }).notNull().default('unpaid'),
  paidDate: date('paid_date'),
}, (table) => [
  check('chk_installment_status', sql`${table.status} IN ('paid', 'unpaid')`),
]);

// --- 10. cash_flow_projection_headers ---------------------------------------

export const cashFlowProjectionHeaders = cfdSchema.table('cash_flow_projection_headers', {
  id: uuid().primaryKey().defaultRandom(),
  corporateId: uuid('corporate_id').notNull().references(() => corporates.id),
  fiscalYear: integer('fiscal_year').notNull(),
  initialBalance: numeric('initial_balance', { precision: 18, scale: 2 }).notNull().default('0'),
  notes: text(),
  createdBy: uuid('created_by').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedBy: uuid('updated_by'),
  updatedAt: timestamp('updated_at', { withTimezone: true }),
}, (table) => [
  unique('uq_cf_projection_header').on(table.corporateId, table.fiscalYear),
]);

// --- 11. cash_flow_projection_details ---------------------------------------

export const cashFlowProjectionDetails = cfdSchema.table('cash_flow_projection_details', {
  id: uuid().primaryKey().defaultRandom(),
  headerId: uuid('header_id').notNull().references(() => cashFlowProjectionHeaders.id, { onDelete: 'cascade' }),
  month: integer('month').notNull(),
  group: varchar({ length: 50 }).notNull(), // 'operating', 'investing', 'financing'
  type: varchar({ length: 20 }).notNull(),  // 'cash-in', 'cash-out'
  category: varchar({ length: 100 }).notNull(), // e.g., 'Collection', 'Payroll'
  amount: numeric({ precision: 18, scale: 2 }).notNull().default('0'),
  notes: text(),
}, (table) => [
  check('chk_projection_month', sql`${table.month} >= 1 AND ${table.month} <= 12`),
  check('chk_projection_group', sql`${table.group} IN ('operating', 'investing', 'financing')`),
  check('chk_projection_type', sql`${table.type} IN ('cash-in', 'cash-out')`),
]);

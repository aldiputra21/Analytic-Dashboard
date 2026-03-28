// Financial Statement Service — MAFINDA Dashboard Enhancement
// Requirements: 8.1, 8.2, 8.3, 8.6, 8.7, 8.8, 8.9, 8.10

import Database from 'better-sqlite3';

// ─── Error Classes ────────────────────────────────────────────────────────────

export class ValidationError extends Error {
  statusCode = 400;
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends Error {
  statusCode = 404;
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BalanceSheet {
  id: string;
  period: string;
  currentAssets: number;
  fixedAssets: number;
  otherAssets: number;
  shortTermLiabilities: number;
  longTermLiabilities: number;
  paidInCapital: number;
  retainedEarnings: number;
  otherEquity: number;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface BalanceSheetInput {
  period: string;
  currentAssets: number;
  fixedAssets: number;
  otherAssets: number;
  shortTermLiabilities: number;
  longTermLiabilities: number;
  paidInCapital: number;
  retainedEarnings: number;
  otherEquity: number;
}

export interface IncomeStatement {
  id: string;
  period: string;
  revenue: number;
  costOfGoodsSold: number;
  operationalExpenses: number;
  interestExpense: number;
  tax: number;
  netProfit: number;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface IncomeStatementInput {
  period: string;
  revenue: number;
  costOfGoodsSold: number;
  operationalExpenses: number;
  interestExpense: number;
  tax: number;
  netProfit: number;
}

export interface CashFlow {
  id: string;
  period: string;
  departmentId?: string;
  projectId?: string;
  operatingCashIn: number;
  operatingCashOut: number;
  investingCashIn: number;
  investingCashOut: number;
  financingCashIn: number;
  financingCashOut: number;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface CashFlowInput {
  period: string;
  departmentId?: string;
  projectId?: string;
  operatingCashIn: number;
  operatingCashOut: number;
  investingCashIn: number;
  investingCashOut: number;
  financingCashIn: number;
  financingCashOut: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

/** Throws ValidationError if any of the provided values are negative. */
function assertNonNegative(fields: Record<string, number>): void {
  for (const [key, value] of Object.entries(fields)) {
    if (value < 0) {
      throw new ValidationError(`Field "${key}" tidak boleh bernilai negatif`);
    }
  }
}

// ─── Balance Sheet ────────────────────────────────────────────────────────────

function mapBalanceSheetRow(row: any): BalanceSheet {
  return {
    id: row.id,
    period: row.period,
    currentAssets: row.current_assets,
    fixedAssets: row.fixed_assets,
    otherAssets: row.other_assets,
    shortTermLiabilities: row.short_term_liabilities,
    longTermLiabilities: row.long_term_liabilities,
    paidInCapital: row.paid_in_capital,
    retainedEarnings: row.retained_earnings,
    otherEquity: row.other_equity,
    version: row.version,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Saves a balance sheet record. If a record for the period already exists,
 * it is overwritten and the version is incremented.
 * Validates that all financial fields are non-negative.
 * Requirements: 8.1, 8.6, 8.7, 8.10
 */
export function saveBalanceSheet(db: Database.Database, input: BalanceSheetInput): BalanceSheet {
  assertNonNegative({
    currentAssets: input.currentAssets,
    fixedAssets: input.fixedAssets,
    otherAssets: input.otherAssets,
    shortTermLiabilities: input.shortTermLiabilities,
    longTermLiabilities: input.longTermLiabilities,
    paidInCapital: input.paidInCapital,
    retainedEarnings: input.retainedEarnings,
    otherEquity: input.otherEquity,
  });

  const existing = db
    .prepare('SELECT id, version FROM mafinda_balance_sheets WHERE period = ?')
    .get(input.period) as any;

  const now = new Date().toISOString();

  if (existing) {
    db.prepare(`
      UPDATE mafinda_balance_sheets
      SET current_assets = ?, fixed_assets = ?, other_assets = ?,
          short_term_liabilities = ?, long_term_liabilities = ?,
          paid_in_capital = ?, retained_earnings = ?, other_equity = ?,
          version = version + 1, updated_at = ?
      WHERE id = ?
    `).run(
      input.currentAssets, input.fixedAssets, input.otherAssets,
      input.shortTermLiabilities, input.longTermLiabilities,
      input.paidInCapital, input.retainedEarnings, input.otherEquity,
      now, existing.id
    );

    return mapBalanceSheetRow(
      db.prepare('SELECT * FROM mafinda_balance_sheets WHERE id = ?').get(existing.id)
    );
  }

  const id = generateId('bs');
  db.prepare(`
    INSERT INTO mafinda_balance_sheets
      (id, period, current_assets, fixed_assets, other_assets,
       short_term_liabilities, long_term_liabilities,
       paid_in_capital, retained_earnings, other_equity,
       version, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
  `).run(
    id, input.period,
    input.currentAssets, input.fixedAssets, input.otherAssets,
    input.shortTermLiabilities, input.longTermLiabilities,
    input.paidInCapital, input.retainedEarnings, input.otherEquity,
    now, now
  );

  return mapBalanceSheetRow(
    db.prepare('SELECT * FROM mafinda_balance_sheets WHERE id = ?').get(id)
  );
}

/**
 * Returns balance sheets, optionally filtered by period.
 * Requirements: 8.7
 */
export function getBalanceSheets(
  db: Database.Database,
  filter?: { period?: string }
): BalanceSheet[] {
  if (filter?.period) {
    const rows = db
      .prepare('SELECT * FROM mafinda_balance_sheets WHERE period = ? ORDER BY period DESC')
      .all(filter.period) as any[];
    return rows.map(mapBalanceSheetRow);
  }
  const rows = db
    .prepare('SELECT * FROM mafinda_balance_sheets ORDER BY period DESC')
    .all() as any[];
  return rows.map(mapBalanceSheetRow);
}

// ─── Income Statement ─────────────────────────────────────────────────────────

function mapIncomeStatementRow(row: any): IncomeStatement {
  return {
    id: row.id,
    period: row.period,
    revenue: row.revenue,
    costOfGoodsSold: row.cost_of_goods_sold,
    operationalExpenses: row.operational_expenses,
    interestExpense: row.interest_expense,
    tax: row.tax,
    netProfit: row.net_profit,
    version: row.version,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Saves an income statement record. If a record for the period already exists,
 * it is overwritten and the version is incremented.
 * Validates that all financial fields are non-negative.
 * Requirements: 8.2, 8.6, 8.8, 8.10
 */
export function saveIncomeStatement(
  db: Database.Database,
  input: IncomeStatementInput
): IncomeStatement {
  assertNonNegative({
    revenue: input.revenue,
    costOfGoodsSold: input.costOfGoodsSold,
    operationalExpenses: input.operationalExpenses,
    interestExpense: input.interestExpense,
    tax: input.tax,
    netProfit: input.netProfit,
  });

  const existing = db
    .prepare('SELECT id, version FROM mafinda_income_statements WHERE period = ?')
    .get(input.period) as any;

  const now = new Date().toISOString();

  if (existing) {
    db.prepare(`
      UPDATE mafinda_income_statements
      SET revenue = ?, cost_of_goods_sold = ?, operational_expenses = ?,
          interest_expense = ?, tax = ?, net_profit = ?,
          version = version + 1, updated_at = ?
      WHERE id = ?
    `).run(
      input.revenue, input.costOfGoodsSold, input.operationalExpenses,
      input.interestExpense, input.tax, input.netProfit,
      now, existing.id
    );

    return mapIncomeStatementRow(
      db.prepare('SELECT * FROM mafinda_income_statements WHERE id = ?').get(existing.id)
    );
  }

  const id = generateId('is');
  db.prepare(`
    INSERT INTO mafinda_income_statements
      (id, period, revenue, cost_of_goods_sold, operational_expenses,
       interest_expense, tax, net_profit, version, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
  `).run(
    id, input.period,
    input.revenue, input.costOfGoodsSold, input.operationalExpenses,
    input.interestExpense, input.tax, input.netProfit,
    now, now
  );

  return mapIncomeStatementRow(
    db.prepare('SELECT * FROM mafinda_income_statements WHERE id = ?').get(id)
  );
}

/**
 * Returns income statements, optionally filtered by period.
 * Requirements: 8.8
 */
export function getIncomeStatements(
  db: Database.Database,
  filter?: { period?: string }
): IncomeStatement[] {
  if (filter?.period) {
    const rows = db
      .prepare('SELECT * FROM mafinda_income_statements WHERE period = ? ORDER BY period DESC')
      .all(filter.period) as any[];
    return rows.map(mapIncomeStatementRow);
  }
  const rows = db
    .prepare('SELECT * FROM mafinda_income_statements ORDER BY period DESC')
    .all() as any[];
  return rows.map(mapIncomeStatementRow);
}

// ─── Cash Flow ────────────────────────────────────────────────────────────────

function mapCashFlowRow(row: any): CashFlow {
  return {
    id: row.id,
    period: row.period,
    departmentId: row.department_id ?? undefined,
    projectId: row.project_id ?? undefined,
    operatingCashIn: row.operating_cash_in,
    operatingCashOut: row.operating_cash_out,
    investingCashIn: row.investing_cash_in,
    investingCashOut: row.investing_cash_out,
    financingCashIn: row.financing_cash_in,
    financingCashOut: row.financing_cash_out,
    version: row.version,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Saves a cash flow record. If a record for the same (period, departmentId, projectId)
 * already exists, it is overwritten and the version is incremented.
 * Validates that all cash values are non-negative.
 * Requirements: 8.3, 8.6, 8.9, 8.10
 */
export function saveCashFlow(db: Database.Database, input: CashFlowInput): CashFlow {
  assertNonNegative({
    operatingCashIn: input.operatingCashIn,
    operatingCashOut: input.operatingCashOut,
    investingCashIn: input.investingCashIn,
    investingCashOut: input.investingCashOut,
    financingCashIn: input.financingCashIn,
    financingCashOut: input.financingCashOut,
  });

  const deptId = input.departmentId ?? null;
  const projId = input.projectId ?? null;

  const existing = db.prepare(`
    SELECT id, version FROM mafinda_cash_flows
    WHERE period = ?
      AND (department_id IS ? OR (department_id IS NULL AND ? IS NULL))
      AND (project_id IS ? OR (project_id IS NULL AND ? IS NULL))
  `).get(input.period, deptId, deptId, projId, projId) as any;

  const now = new Date().toISOString();

  if (existing) {
    db.prepare(`
      UPDATE mafinda_cash_flows
      SET operating_cash_in = ?, operating_cash_out = ?,
          investing_cash_in = ?, investing_cash_out = ?,
          financing_cash_in = ?, financing_cash_out = ?,
          version = version + 1, updated_at = ?
      WHERE id = ?
    `).run(
      input.operatingCashIn, input.operatingCashOut,
      input.investingCashIn, input.investingCashOut,
      input.financingCashIn, input.financingCashOut,
      now, existing.id
    );

    return mapCashFlowRow(
      db.prepare('SELECT * FROM mafinda_cash_flows WHERE id = ?').get(existing.id)
    );
  }

  const id = generateId('cf');
  db.prepare(`
    INSERT INTO mafinda_cash_flows
      (id, period, department_id, project_id,
       operating_cash_in, operating_cash_out,
       investing_cash_in, investing_cash_out,
       financing_cash_in, financing_cash_out,
       version, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
  `).run(
    id, input.period, deptId, projId,
    input.operatingCashIn, input.operatingCashOut,
    input.investingCashIn, input.investingCashOut,
    input.financingCashIn, input.financingCashOut,
    now, now
  );

  return mapCashFlowRow(
    db.prepare('SELECT * FROM mafinda_cash_flows WHERE id = ?').get(id)
  );
}

/**
 * Returns cash flow records, optionally filtered by period and/or departmentId.
 * Requirements: 8.9
 */
export function getCashFlows(
  db: Database.Database,
  filter?: { period?: string; departmentId?: string; projectId?: string }
): CashFlow[] {
  const conditions: string[] = [];
  const params: any[] = [];

  if (filter?.period) {
    conditions.push('period = ?');
    params.push(filter.period);
  }
  if (filter?.departmentId !== undefined) {
    conditions.push('department_id = ?');
    params.push(filter.departmentId);
  }
  if (filter?.projectId !== undefined) {
    conditions.push('project_id = ?');
    params.push(filter.projectId);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const rows = db
    .prepare(`SELECT * FROM mafinda_cash_flows ${where} ORDER BY period DESC`)
    .all(...params) as any[];

  return rows.map(mapCashFlowRow);
}

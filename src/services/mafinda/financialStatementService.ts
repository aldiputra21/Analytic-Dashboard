// Financial Statement Service — MAFINDA Dashboard Enhancement
// Drizzle ORM PostgreSQL implementation

import { eq, and, desc } from 'drizzle-orm';
import { db } from '../../db/connection';
import { balanceSheets, incomeStatements, weeklyCashFlows } from '../../db/schema';

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
  departmentId: string;
  period: string;
  // Aktiva Lancar
  cashAndBank: string;
  accountsReceivable: string;
  workInProgress: string;
  inventory: string;
  prepaidExpenses: string;
  // Aktiva Tetap
  land: string;
  building: string;
  equipment: string;
  otherFixedAssets: string;
  // Kewajiban Lancar
  accountsPayable: string;
  bankLoanCurrent: string;
  otherCurrentLiabilities: string;
  // Kewajiban Jangka Panjang
  bankLoanLongTerm: string;
  otherLongTermLiabilities: string;
  shareholderLoan: string;
  // Ekuitas
  capital: string;
  earningsAfterTax: string;
  retainedEarnings: string;
  dividends: string;
  notes?: string;
  createdBy: string;
  createdAt: string;
  updatedBy?: string;
  updatedAt?: string;
}

export interface BalanceSheetInput {
  departmentId: string;
  period: string;
  cashAndBank?: string;
  accountsReceivable?: string;
  workInProgress?: string;
  inventory?: string;
  prepaidExpenses?: string;
  land?: string;
  building?: string;
  equipment?: string;
  otherFixedAssets?: string;
  accountsPayable?: string;
  bankLoanCurrent?: string;
  otherCurrentLiabilities?: string;
  bankLoanLongTerm?: string;
  otherLongTermLiabilities?: string;
  shareholderLoan?: string;
  capital?: string;
  earningsAfterTax?: string;
  retainedEarnings?: string;
  dividends?: string;
  notes?: string;
}

export interface IncomeStatement {
  id: string;
  departmentId: string;
  period: string;
  revenue: string;
  cogs: string;
  operatingExpenses: string;
  interestExpense: string;
  taxExpense: string;
  notes?: string;
  createdBy: string;
  createdAt: string;
  updatedBy?: string;
  updatedAt?: string;
}

export interface IncomeStatementInput {
  departmentId: string;
  period: string;
  revenue?: string;
  cogs?: string;
  operatingExpenses?: string;
  interestExpense?: string;
  taxExpense?: string;
  notes?: string;
}

export interface CashFlow {
  id: string;
  departmentId: string;
  entityType: string;
  entityId: string;
  period: string;
  week: string;
  operatingCashIn: string;
  operatingCashOut: string;
  investingCashIn: string;
  investingCashOut: string;
  financingCashIn: string;
  financingCashOut: string;
  notes?: string;
  createdBy: string;
  createdAt: string;
  updatedBy?: string;
  updatedAt?: string;
}

export interface CashFlowInput {
  departmentId: string;
  entityType: string;
  entityId: string;
  period: string;
  week: string;
  operatingCashIn?: string;
  operatingCashOut?: string;
  investingCashIn?: string;
  investingCashOut?: string;
  financingCashIn?: string;
  financingCashOut?: string;
  notes?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Throws ValidationError if any of the provided values are negative. */
function assertNonNegative(fields: Record<string, string | undefined>): void {
  for (const [key, value] of Object.entries(fields)) {
    if (value !== undefined && parseFloat(value) < 0) {
      throw new ValidationError(`Field "${key}" tidak boleh bernilai negatif`);
    }
  }
}

// ─── Balance Sheet ────────────────────────────────────────────────────────────

function mapBalanceSheetRow(row: typeof balanceSheets.$inferSelect): BalanceSheet {
  return {
    id: row.id,
    departmentId: row.departmentId,
    period: row.period,
    cashAndBank: row.cashAndBank,
    accountsReceivable: row.accountsReceivable,
    workInProgress: row.workInProgress,
    inventory: row.inventory,
    prepaidExpenses: row.prepaidExpenses,
    land: row.land,
    building: row.building,
    equipment: row.equipment,
    otherFixedAssets: row.otherFixedAssets,
    accountsPayable: row.accountsPayable,
    bankLoanCurrent: row.bankLoanCurrent,
    otherCurrentLiabilities: row.otherCurrentLiabilities,
    bankLoanLongTerm: row.bankLoanLongTerm,
    otherLongTermLiabilities: row.otherLongTermLiabilities,
    shareholderLoan: row.shareholderLoan,
    capital: row.capital,
    earningsAfterTax: row.earningsAfterTax,
    retainedEarnings: row.retainedEarnings,
    dividends: row.dividends,
    notes: row.notes ?? undefined,
    createdBy: row.createdBy,
    createdAt: row.createdAt.toISOString(),
    updatedBy: row.updatedBy ?? undefined,
    updatedAt: row.updatedAt?.toISOString(),
  };
}

/**
 * Saves a balance sheet record. If a record for the (departmentId, period)
 * already exists, it is updated.
 */
export async function saveBalanceSheet(input: BalanceSheetInput, createdBy: string): Promise<BalanceSheet> {
  assertNonNegative({
    cashAndBank: input.cashAndBank,
    accountsReceivable: input.accountsReceivable,
    inventory: input.inventory,
  });

  const [existing] = await db.select().from(balanceSheets)
    .where(and(
      eq(balanceSheets.departmentId, input.departmentId),
      eq(balanceSheets.period, input.period),
    ))
    .limit(1);

  if (existing) {
    const [updated] = await db.update(balanceSheets).set({
      cashAndBank: input.cashAndBank ?? existing.cashAndBank,
      accountsReceivable: input.accountsReceivable ?? existing.accountsReceivable,
      workInProgress: input.workInProgress ?? existing.workInProgress,
      inventory: input.inventory ?? existing.inventory,
      prepaidExpenses: input.prepaidExpenses ?? existing.prepaidExpenses,
      land: input.land ?? existing.land,
      building: input.building ?? existing.building,
      equipment: input.equipment ?? existing.equipment,
      otherFixedAssets: input.otherFixedAssets ?? existing.otherFixedAssets,
      accountsPayable: input.accountsPayable ?? existing.accountsPayable,
      bankLoanCurrent: input.bankLoanCurrent ?? existing.bankLoanCurrent,
      otherCurrentLiabilities: input.otherCurrentLiabilities ?? existing.otherCurrentLiabilities,
      bankLoanLongTerm: input.bankLoanLongTerm ?? existing.bankLoanLongTerm,
      otherLongTermLiabilities: input.otherLongTermLiabilities ?? existing.otherLongTermLiabilities,
      shareholderLoan: input.shareholderLoan ?? existing.shareholderLoan,
      capital: input.capital ?? existing.capital,
      earningsAfterTax: input.earningsAfterTax ?? existing.earningsAfterTax,
      retainedEarnings: input.retainedEarnings ?? existing.retainedEarnings,
      dividends: input.dividends ?? existing.dividends,
      notes: input.notes !== undefined ? input.notes : existing.notes,
      updatedBy: createdBy,
      updatedAt: new Date(),
    }).where(eq(balanceSheets.id, existing.id)).returning();

    return mapBalanceSheetRow(updated);
  }

  const [inserted] = await db.insert(balanceSheets).values({
    departmentId: input.departmentId,
    period: input.period,
    cashAndBank: input.cashAndBank ?? '0',
    accountsReceivable: input.accountsReceivable ?? '0',
    workInProgress: input.workInProgress ?? '0',
    inventory: input.inventory ?? '0',
    prepaidExpenses: input.prepaidExpenses ?? '0',
    land: input.land ?? '0',
    building: input.building ?? '0',
    equipment: input.equipment ?? '0',
    otherFixedAssets: input.otherFixedAssets ?? '0',
    accountsPayable: input.accountsPayable ?? '0',
    bankLoanCurrent: input.bankLoanCurrent ?? '0',
    otherCurrentLiabilities: input.otherCurrentLiabilities ?? '0',
    bankLoanLongTerm: input.bankLoanLongTerm ?? '0',
    otherLongTermLiabilities: input.otherLongTermLiabilities ?? '0',
    shareholderLoan: input.shareholderLoan ?? '0',
    capital: input.capital ?? '0',
    earningsAfterTax: input.earningsAfterTax ?? '0',
    retainedEarnings: input.retainedEarnings ?? '0',
    dividends: input.dividends ?? '0',
    notes: input.notes,
    createdBy,
  }).returning();

  return mapBalanceSheetRow(inserted);
}

/**
 * Returns balance sheets, optionally filtered by departmentId and/or period.
 */
export async function getBalanceSheets(
  filter?: { departmentId?: string; period?: string },
): Promise<BalanceSheet[]> {
  const conditions = [];
  if (filter?.departmentId) conditions.push(eq(balanceSheets.departmentId, filter.departmentId));
  if (filter?.period) conditions.push(eq(balanceSheets.period, filter.period));

  const rows = await db.select().from(balanceSheets)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(balanceSheets.period));

  return rows.map(mapBalanceSheetRow);
}

// ─── Income Statement ─────────────────────────────────────────────────────────

function mapIncomeStatementRow(row: typeof incomeStatements.$inferSelect): IncomeStatement {
  return {
    id: row.id,
    departmentId: row.departmentId,
    period: row.period,
    revenue: row.revenue,
    cogs: row.cogs,
    operatingExpenses: row.operatingExpenses,
    interestExpense: row.interestExpense,
    taxExpense: row.taxExpense,
    notes: row.notes ?? undefined,
    createdBy: row.createdBy,
    createdAt: row.createdAt.toISOString(),
    updatedBy: row.updatedBy ?? undefined,
    updatedAt: row.updatedAt?.toISOString(),
  };
}

/**
 * Saves an income statement record. If a record for the (departmentId, period)
 * already exists, it is updated.
 */
export async function saveIncomeStatement(
  input: IncomeStatementInput,
  createdBy: string,
): Promise<IncomeStatement> {
  assertNonNegative({
    revenue: input.revenue,
    cogs: input.cogs,
    operatingExpenses: input.operatingExpenses,
    interestExpense: input.interestExpense,
    taxExpense: input.taxExpense,
  });

  const [existing] = await db.select().from(incomeStatements)
    .where(and(
      eq(incomeStatements.departmentId, input.departmentId),
      eq(incomeStatements.period, input.period),
    ))
    .limit(1);

  if (existing) {
    const [updated] = await db.update(incomeStatements).set({
      revenue: input.revenue ?? existing.revenue,
      cogs: input.cogs ?? existing.cogs,
      operatingExpenses: input.operatingExpenses ?? existing.operatingExpenses,
      interestExpense: input.interestExpense ?? existing.interestExpense,
      taxExpense: input.taxExpense ?? existing.taxExpense,
      notes: input.notes !== undefined ? input.notes : existing.notes,
      updatedBy: createdBy,
      updatedAt: new Date(),
    }).where(eq(incomeStatements.id, existing.id)).returning();

    return mapIncomeStatementRow(updated);
  }

  const [inserted] = await db.insert(incomeStatements).values({
    departmentId: input.departmentId,
    period: input.period,
    revenue: input.revenue ?? '0',
    cogs: input.cogs ?? '0',
    operatingExpenses: input.operatingExpenses ?? '0',
    interestExpense: input.interestExpense ?? '0',
    taxExpense: input.taxExpense ?? '0',
    notes: input.notes,
    createdBy,
  }).returning();

  return mapIncomeStatementRow(inserted);
}

/**
 * Returns income statements, optionally filtered by departmentId and/or period.
 */
export async function getIncomeStatements(
  filter?: { departmentId?: string; period?: string },
): Promise<IncomeStatement[]> {
  const conditions = [];
  if (filter?.departmentId) conditions.push(eq(incomeStatements.departmentId, filter.departmentId));
  if (filter?.period) conditions.push(eq(incomeStatements.period, filter.period));

  const rows = await db.select().from(incomeStatements)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(incomeStatements.period));

  return rows.map(mapIncomeStatementRow);
}

// ─── Cash Flow (Weekly) ─────────────────────────────────────────────────────

function mapCashFlowRow(row: typeof weeklyCashFlows.$inferSelect): CashFlow {
  return {
    id: row.id,
    departmentId: row.departmentId,
    entityType: row.entityType,
    entityId: row.entityId,
    period: row.period,
    week: row.week,
    operatingCashIn: row.operatingCashIn,
    operatingCashOut: row.operatingCashOut,
    investingCashIn: row.investingCashIn,
    investingCashOut: row.investingCashOut,
    financingCashIn: row.financingCashIn,
    financingCashOut: row.financingCashOut,
    notes: row.notes ?? undefined,
    createdBy: row.createdBy,
    createdAt: row.createdAt.toISOString(),
    updatedBy: row.updatedBy ?? undefined,
    updatedAt: row.updatedAt?.toISOString(),
  };
}

/**
 * Saves a cash flow record. If a record for the same (entityType, entityId, period, week)
 * already exists, it is updated.
 */
export async function saveCashFlow(input: CashFlowInput, createdBy: string): Promise<CashFlow> {
  assertNonNegative({
    operatingCashIn: input.operatingCashIn,
    operatingCashOut: input.operatingCashOut,
    investingCashIn: input.investingCashIn,
    investingCashOut: input.investingCashOut,
    financingCashIn: input.financingCashIn,
    financingCashOut: input.financingCashOut,
  });

  const [existing] = await db.select().from(weeklyCashFlows)
    .where(and(
      eq(weeklyCashFlows.entityType, input.entityType),
      eq(weeklyCashFlows.entityId, input.entityId),
      eq(weeklyCashFlows.period, input.period),
      eq(weeklyCashFlows.week, input.week),
    ))
    .limit(1);

  if (existing) {
    const [updated] = await db.update(weeklyCashFlows).set({
      operatingCashIn: input.operatingCashIn ?? existing.operatingCashIn,
      operatingCashOut: input.operatingCashOut ?? existing.operatingCashOut,
      investingCashIn: input.investingCashIn ?? existing.investingCashIn,
      investingCashOut: input.investingCashOut ?? existing.investingCashOut,
      financingCashIn: input.financingCashIn ?? existing.financingCashIn,
      financingCashOut: input.financingCashOut ?? existing.financingCashOut,
      notes: input.notes !== undefined ? input.notes : existing.notes,
      updatedBy: createdBy,
      updatedAt: new Date(),
    }).where(eq(weeklyCashFlows.id, existing.id)).returning();

    return mapCashFlowRow(updated);
  }

  const [inserted] = await db.insert(weeklyCashFlows).values({
    departmentId: input.departmentId,
    entityType: input.entityType,
    entityId: input.entityId,
    period: input.period,
    week: input.week,
    operatingCashIn: input.operatingCashIn ?? '0',
    operatingCashOut: input.operatingCashOut ?? '0',
    investingCashIn: input.investingCashIn ?? '0',
    investingCashOut: input.investingCashOut ?? '0',
    financingCashIn: input.financingCashIn ?? '0',
    financingCashOut: input.financingCashOut ?? '0',
    notes: input.notes,
    createdBy,
  }).returning();

  return mapCashFlowRow(inserted);
}

/**
 * Returns cash flow records, optionally filtered.
 */
export async function getCashFlows(
  filter?: { departmentId?: string; entityType?: string; entityId?: string; period?: string },
): Promise<CashFlow[]> {
  const conditions = [];
  if (filter?.departmentId) conditions.push(eq(weeklyCashFlows.departmentId, filter.departmentId));
  if (filter?.entityType) conditions.push(eq(weeklyCashFlows.entityType, filter.entityType));
  if (filter?.entityId) conditions.push(eq(weeklyCashFlows.entityId, filter.entityId));
  if (filter?.period) conditions.push(eq(weeklyCashFlows.period, filter.period));

  const rows = await db.select().from(weeklyCashFlows)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(weeklyCashFlows.period));

  return rows.map(mapCashFlowRow);
}

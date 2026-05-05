// Financial Statement Service — MAFINDA Dashboard Enhancement
// Drizzle ORM PostgreSQL implementation

import { eq, and, desc, sql, count, gte, lte } from 'drizzle-orm';
import { db } from '../../db/connection';
import { balanceSheets, incomeStatements, weeklyCashFlows } from '../../db/schema/index.js';
import { reevaluateAlertsForSubsidiary } from '../financial/alertEngine';
import { AppError, ErrorCode } from '../../utils/errors.js';

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
  corporateId: string;
  corporateName?: string;
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
  id?: string;
  corporateId: string;
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
  padding?: string; // Add if needed, or ignore
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
  corporateId: string;
  corporateName?: string;
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
  id?: string;
  corporateId: string;
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
  corporateId: string;
  corporateName?: string;
  entityType: 'corporate' | 'project';
  entityId: string;
  entityName?: string;
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
  id?: string;
  corporateId: string;
  entityType: 'corporate' | 'project';
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

function mapBalanceSheetRow(row: typeof balanceSheets.$inferSelect & { corporateName?: string }): BalanceSheet {
  return {
    id: row.id,
    corporateId: row.corporateId,
    corporateName: row.corporateName,
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
 * Saves a balance sheet record.
 * Throws ValidationError if a record for the (corporateId, period) already exists
 * for a different ID (deduplication check).
 */
export async function saveBalanceSheet(input: BalanceSheetInput, userId: string): Promise<BalanceSheet> {
  assertNonNegative({
    cashAndBank: input.cashAndBank,
    accountsReceivable: input.accountsReceivable,
    inventory: input.inventory,
  });

  // Check for deduplication: same corporate and period
  const [existing] = await db.select().from(balanceSheets)
    .where(and(
      eq(balanceSheets.corporateId, input.corporateId),
      eq(balanceSheets.period, input.period),
    ))
    .limit(1);

  if (existing && existing.id !== input.id) {
    throw AppError.badRequest(ErrorCode.DUPLICATE_ENTRY, `Data Neraca untuk perusahaan ini pada periode ${input.period} sudah ada.`);
  }

  // If input.id is provided, check if it exists for explicit update
  const effectiveId = input.id;
  
  if (effectiveId) {
    const [target] = await db.select().from(balanceSheets).where(eq(balanceSheets.id, effectiveId)).limit(1);
    if (!target) throw new NotFoundError('Data neraca tidak ditemukan');

    const [updated] = await db.update(balanceSheets).set({
      corporateId: input.corporateId, // Allow changing corporate if needed, though usually fixed
      period: input.period,
      cashAndBank: input.cashAndBank ?? target.cashAndBank,
      accountsReceivable: input.accountsReceivable ?? target.accountsReceivable,
      workInProgress: input.workInProgress ?? target.workInProgress,
      inventory: input.inventory ?? target.inventory,
      prepaidExpenses: input.prepaidExpenses ?? target.prepaidExpenses,
      land: input.land ?? target.land,
      building: input.building ?? target.building,
      equipment: input.equipment ?? target.equipment,
      otherFixedAssets: input.otherFixedAssets ?? target.otherFixedAssets,
      accountsPayable: input.accountsPayable ?? target.accountsPayable,
      bankLoanCurrent: input.bankLoanCurrent ?? target.bankLoanCurrent,
      otherCurrentLiabilities: input.otherCurrentLiabilities ?? target.otherCurrentLiabilities,
      bankLoanLongTerm: input.bankLoanLongTerm ?? target.bankLoanLongTerm,
      otherLongTermLiabilities: input.otherLongTermLiabilities ?? target.otherLongTermLiabilities,
      shareholderLoan: input.shareholderLoan ?? target.shareholderLoan,
      capital: input.capital ?? target.capital,
      earningsAfterTax: input.earningsAfterTax ?? target.earningsAfterTax,
      retainedEarnings: input.retainedEarnings ?? target.retainedEarnings,
      dividends: input.dividends ?? target.dividends,
      notes: input.notes !== undefined ? input.notes : target.notes,
      updatedBy: userId,
      updatedAt: new Date(),
    }).where(eq(balanceSheets.id, target.id)).returning();

    const result = mapBalanceSheetRow(updated);
    // Background re-evaluation
    reevaluateAlertsForSubsidiary(input.corporateId).catch(console.error);
    return result;
  }

  // Insert new record
  const [inserted] = await db.insert(balanceSheets).values({
    corporateId: input.corporateId,
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
    createdBy: userId,
  }).returning();

  const result = mapBalanceSheetRow(inserted);
  // Background re-evaluation
  reevaluateAlertsForSubsidiary(input.corporateId).catch(console.error);
  return result;
}

/**
 * Returns balance sheets, optionally filtered by corporateId and/or period.
 * Results are restricted based on user's corporate access.
 */
export async function getBalanceSheets(
  access: { scope: string; corporateIds: string[] },
  filter?: { 
    corporateId?: string; 
    period?: string; 
    periodStart?: string; 
    periodEnd?: string; 
    page?: number; 
    pageSize?: number 
  },
): Promise<{ data: BalanceSheet[]; records: BalanceSheet[]; totalCount: number }> {
  const { corporates } = await import('../../db/schema/public.js');
  const { inArray } = await import('drizzle-orm');

  const conditions = [];

  // Apply corporate filter with respect to user access
  if (filter?.corporateId) {
    if (access.scope === 'system' || access.corporateIds.includes(filter.corporateId)) {
      conditions.push(eq(balanceSheets.corporateId, filter.corporateId));
    } else {
      return { data: [], records: [], totalCount: 0 };
    }
  } else if (access.scope !== 'system') {
    if (access.corporateIds.length === 0) return { data: [], records: [], totalCount: 0 };
    conditions.push(inArray(balanceSheets.corporateId, access.corporateIds));
  }

  if (filter?.period) conditions.push(eq(balanceSheets.period, filter.period));
  if (filter?.periodStart) conditions.push(gte(balanceSheets.period, filter.periodStart));
  if (filter?.periodEnd) conditions.push(lte(balanceSheets.period, filter.periodEnd));

  const page = filter?.page ?? 1;
  const pageSize = filter?.pageSize ?? 10;
  const offset = (page - 1) * pageSize;

  // 1. Get total count
  const [totalRes] = await db.select({ total: count() })
    .from(balanceSheets)
    .where(conditions.length > 0 ? and(...conditions) : undefined);
  
  const totalCount = Number(totalRes?.total ?? 0);

  // 2. Get paginated results
  const rows = await db.select({
    data: balanceSheets,
    corporateName: corporates.name,
  }).from(balanceSheets)
    .leftJoin(corporates, eq(corporates.id, balanceSheets.corporateId))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(balanceSheets.period))
    .limit(pageSize)
    .offset(offset);

  return {
    records: rows.map(r => mapBalanceSheetRow({ ...r.data, corporateName: r.corporateName ?? undefined })),
    data: rows.map(r => mapBalanceSheetRow({ ...r.data, corporateName: r.corporateName ?? undefined })),
    totalCount
  };
}

/** Deletes a balance sheet by ID with corporate context check. */
export async function deleteBalanceSheet(id: string, corporateId: string): Promise<void> {
  const result = await db.delete(balanceSheets)
    .where(and(
      eq(balanceSheets.id, id),
      eq(balanceSheets.corporateId, corporateId)
    ));
  
  if (result.rowCount === 0) {
    throw new NotFoundError('Data neraca tidak ditemukan atau Anda tidak memiliki akses');
  }
}

// ─── Income Statement ─────────────────────────────────────────────────────────

function mapIncomeStatementRow(row: typeof incomeStatements.$inferSelect & { corporateName?: string }): IncomeStatement {
  return {
    id: row.id,
    corporateId: row.corporateId,
    corporateName: row.corporateName,
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
 * Saves an income statement record.
 * Throws ValidationError if a record for the (corporateId, period) already exists
 * for a different ID (deduplication check).
 */
export async function saveIncomeStatement(
  input: IncomeStatementInput,
  userId: string,
): Promise<IncomeStatement> {
  assertNonNegative({
    revenue: input.revenue,
    cogs: input.cogs,
    operatingExpenses: input.operatingExpenses,
    interestExpense: input.interestExpense,
    taxExpense: input.taxExpense,
  });

  // Check for deduplication
  const [existing] = await db.select().from(incomeStatements)
    .where(and(
      eq(incomeStatements.corporateId, input.corporateId),
      eq(incomeStatements.period, input.period),
    ))
    .limit(1);

  if (existing && existing.id !== input.id) {
    throw AppError.badRequest(ErrorCode.DUPLICATE_ENTRY, `Data Laba Rugi untuk perusahaan ini pada periode ${input.period} sudah ada.`);
  }

  if (input.id) {
    const [target] = await db.select().from(incomeStatements).where(eq(incomeStatements.id, input.id)).limit(1);
    if (!target) throw new NotFoundError('Data laba rugi tidak ditemukan');

    const [updated] = await db.update(incomeStatements).set({
      corporateId: input.corporateId,
      period: input.period,
      revenue: input.revenue ?? target.revenue,
      cogs: input.cogs ?? target.cogs,
      operatingExpenses: input.operatingExpenses ?? target.operatingExpenses,
      interestExpense: input.interestExpense ?? target.interestExpense,
      taxExpense: input.taxExpense ?? target.taxExpense,
      notes: input.notes !== undefined ? input.notes : target.notes,
      updatedBy: userId,
      updatedAt: new Date(),
    }).where(eq(incomeStatements.id, input.id)).returning();

    const result = mapIncomeStatementRow(updated);
    // Background re-evaluation
    reevaluateAlertsForSubsidiary(input.corporateId).catch(console.error);
    return result;
  }

  const [inserted] = await db.insert(incomeStatements).values({
    corporateId: input.corporateId,
    period: input.period,
    revenue: input.revenue ?? '0',
    cogs: input.cogs ?? '0',
    operatingExpenses: input.operatingExpenses ?? '0',
    interestExpense: input.interestExpense ?? '0',
    taxExpense: input.taxExpense ?? '0',
    notes: input.notes,
    createdBy: userId,
  }).returning();

  const result = mapIncomeStatementRow(inserted);
  // Background re-evaluation
  reevaluateAlertsForSubsidiary(input.corporateId).catch(console.error);
  return result;
}

/**
 * Returns income statements, optionally filtered by corporateId and/or period.
 * Results are restricted based on user's corporate access.
 */
export async function getIncomeStatements(
  access: { scope: string; corporateIds: string[] },
  filter?: { 
    corporateId?: string; 
    period?: string; 
    periodStart?: string; 
    periodEnd?: string; 
    page?: number; 
    pageSize?: number 
  },
): Promise<{ data: IncomeStatement[]; records: IncomeStatement[]; totalCount: number }> {
  const { corporates } = await import('../../db/schema/public.js');
  const { inArray } = await import('drizzle-orm');

  const conditions = [];

  // Apply corporate filter with respect to user access
  if (filter?.corporateId) {
    if (access.scope === 'system' || access.corporateIds.includes(filter.corporateId)) {
      conditions.push(eq(incomeStatements.corporateId, filter.corporateId));
    } else {
      return { data: [], records: [], totalCount: 0 };
    }
  } else if (access.scope !== 'system') {
    if (access.corporateIds.length === 0) return { data: [], records: [], totalCount: 0 };
    conditions.push(inArray(incomeStatements.corporateId, access.corporateIds));
  }

  if (filter?.period) conditions.push(eq(incomeStatements.period, filter.period));
  if (filter?.periodStart) conditions.push(gte(incomeStatements.period, filter.periodStart));
  if (filter?.periodEnd) conditions.push(lte(incomeStatements.period, filter.periodEnd));

  const page = filter?.page ?? 1;
  const pageSize = filter?.pageSize ?? 10;
  const offset = (page - 1) * pageSize;

  // 1. Get total count
  const [totalRes] = await db.select({ total: count() })
    .from(incomeStatements)
    .where(conditions.length > 0 ? and(...conditions) : undefined);
  
  const totalCount = Number(totalRes?.total ?? 0);

  // 2. Get paginated results
  const rows = await db.select({
    data: incomeStatements,
    corporateName: corporates.name,
  }).from(incomeStatements)
    .leftJoin(corporates, eq(corporates.id, incomeStatements.corporateId))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(incomeStatements.period))
    .limit(pageSize)
    .offset(offset);

  return {
    records: rows.map(r => mapIncomeStatementRow({ ...r.data, corporateName: r.corporateName ?? undefined })),
    data: rows.map(r => mapIncomeStatementRow({ ...r.data, corporateName: r.corporateName ?? undefined })),
    totalCount
  };
}

/** Deletes an income statement by ID with corporate context check. */
export async function deleteIncomeStatement(id: string, corporateId: string): Promise<void> {
  const result = await db.delete(incomeStatements)
    .where(and(
      eq(incomeStatements.id, id),
      eq(incomeStatements.corporateId, corporateId)
    ));

  if (result.rowCount === 0) {
    throw new NotFoundError('Data laba rugi tidak ditemukan atau Anda tidak memiliki akses');
  }
}

// ─── Cash Flow (Weekly) ─────────────────────────────────────────────────────

function mapCashFlowRow(row: typeof weeklyCashFlows.$inferSelect & { corporateName?: string; entityName?: string }): CashFlow {
  return {
    id: row.id,
    corporateId: row.corporateId,
    corporateName: row.corporateName,
    entityType: row.entityType as 'corporate' | 'project',
    entityId: row.entityId,
    entityName: row.entityName,
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
 * Saves a cash flow record.
 * Throws ValidationError if a record for the same (entityType, entityId, period, week)
 * already exists for a different ID (deduplication check).
 */
export async function saveCashFlow(input: CashFlowInput, userId: string): Promise<CashFlow> {
  assertNonNegative({
    operatingCashIn: input.operatingCashIn,
    operatingCashOut: input.operatingCashOut,
    investingCashIn: input.investingCashIn,
    investingCashOut: input.investingCashOut,
    financingCashIn: input.financingCashIn,
    financingCashOut: input.financingCashOut,
  });

  // Check for deduplication
  const [existing] = await db.select().from(weeklyCashFlows)
    .where(and(
      eq(weeklyCashFlows.entityType, input.entityType),
      eq(weeklyCashFlows.entityId, input.entityId),
      eq(weeklyCashFlows.period, input.period),
      eq(weeklyCashFlows.week, input.week),
    ))
    .limit(1);

  if (existing && existing.id !== input.id) {
    throw AppError.badRequest(ErrorCode.DUPLICATE_ENTRY, `Data Arus Kas untuk entitas ini pada periode ${input.period} ${input.week} sudah ada.`);
  }

  if (input.id) {
    const [target] = await db.select().from(weeklyCashFlows).where(eq(weeklyCashFlows.id, input.id)).limit(1);
    if (!target) throw new NotFoundError('Data arus kas tidak ditemukan');

    const [updated] = await db.update(weeklyCashFlows).set({
      corporateId: input.corporateId,
      entityType: input.entityType,
      entityId: input.entityId,
      period: input.period,
      week: input.week,
      operatingCashIn: input.operatingCashIn ?? target.operatingCashIn,
      operatingCashOut: input.operatingCashOut ?? target.operatingCashOut,
      investingCashIn: input.investingCashIn ?? target.investingCashIn,
      investingCashOut: input.investingCashOut ?? target.investingCashOut,
      financingCashIn: input.financingCashIn ?? target.financingCashIn,
      financingCashOut: input.financingCashOut ?? target.financingCashOut,
      notes: input.notes !== undefined ? input.notes : target.notes,
      updatedBy: userId,
      updatedAt: new Date(),
    }).where(eq(weeklyCashFlows.id, target.id)).returning();

    return mapCashFlowRow(updated);
  }

  const [inserted] = await db.insert(weeklyCashFlows).values({
    corporateId: input.corporateId,
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
    createdBy: userId,
  }).returning();

  return mapCashFlowRow(inserted);
}

/**
 * Returns cash flow records, optionally filtered.
 * Results are restricted based on user's corporate access.
 */
export async function getCashFlows(
  access: { scope: string; corporateIds: string[] },
  filter?: { 
    corporateId?: string; 
    entityType?: string; 
    entityId?: string; 
    period?: string; 
    periodStart?: string; 
    periodEnd?: string; 
    search?: string;
    page?: number; 
    pageSize?: number 
  },
): Promise<{ data: CashFlow[]; records: CashFlow[]; totalCount: number }> {
  const { corporates, projects } = await import('../../db/schema/public.js');
  const { inArray, or } = await import('drizzle-orm');

  const conditions = [];

  // Apply corporate filter with respect to user access
  if (filter?.corporateId) {
    if (access.scope === 'system' || access.corporateIds.includes(filter.corporateId)) {
      conditions.push(eq(weeklyCashFlows.corporateId, filter.corporateId));
    } else {
      return { data: [], records: [], totalCount: 0 };
    }
  } else if (access.scope !== 'system') {
    if (access.corporateIds.length === 0) return { data: [], records: [], totalCount: 0 };
    conditions.push(inArray(weeklyCashFlows.corporateId, access.corporateIds));
  }

  if (filter?.entityType) conditions.push(eq(weeklyCashFlows.entityType, filter.entityType));
  if (filter?.entityId) conditions.push(eq(weeklyCashFlows.entityId, filter.entityId));
  if (filter?.period) conditions.push(eq(weeklyCashFlows.period, filter.period));
  if (filter?.periodStart) conditions.push(gte(weeklyCashFlows.period, filter.periodStart));
  if (filter?.periodEnd) conditions.push(lte(weeklyCashFlows.period, filter.periodEnd));

  const { ilike } = await import('drizzle-orm');
  if (filter?.search) {
    conditions.push(or(
      ilike(projects.name, `%${filter.search}%`),
      ilike(projects.description, `%${filter.search}%`)
    ));
  }

  const page = filter?.page ?? 1;
  const pageSize = filter?.pageSize ?? 10;
  const offset = (page - 1) * pageSize;

  // 1. Get total count
  let countQuery = db.select({ total: count() }).from(weeklyCashFlows);
  
  if (filter?.search) {
    // Join projects for search logic in count
    countQuery = countQuery.leftJoin(
      projects, 
      and(eq(weeklyCashFlows.entityType, 'project'), eq(projects.id, weeklyCashFlows.entityId))
    ) as any;
  }

  const [totalRes] = await countQuery
    .where(conditions.length > 0 ? and(...conditions) : undefined);
  
  const totalCount = Number(totalRes?.total ?? 0);

  // 2. Get paginated results
  const rows = await db.select({
    data: weeklyCashFlows,
    corporateName: corporates.name,
    projectName: projects.name,
    entityCorpName: corporates.name, 
  }).from(weeklyCashFlows)
    .leftJoin(corporates, eq(corporates.id, weeklyCashFlows.corporateId))
    .leftJoin(projects, and(eq(weeklyCashFlows.entityType, 'project'), eq(projects.id, weeklyCashFlows.entityId)))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(weeklyCashFlows.period))
    .limit(pageSize)
    .offset(offset);

  const data = rows.map(r => {
    let entityName = 'N/A';
    if (r.data.entityType === 'project') entityName = r.projectName ?? 'Unknown Project';
    else if (r.data.entityType === 'corporate') entityName = r.corporateName ?? 'Unknown Corporate';
    
    return mapCashFlowRow({ 
      ...r.data, 
      corporateName: r.corporateName ?? undefined,
      entityName,
    });
  });

  return {
    records: data,
    data: data,
    totalCount
  };
}

/** Deletes a cash flow record by ID with corporate context check. */
export async function deleteCashFlow(id: string, corporateId: string): Promise<void> {
  const result = await db.delete(weeklyCashFlows)
    .where(and(
      eq(weeklyCashFlows.id, id),
      eq(weeklyCashFlows.corporateId, corporateId)
    ));

  if (result.rowCount === 0) {
    throw new NotFoundError('Data arus kas tidak ditemukan atau Anda tidak memiliki akses');
  }
}


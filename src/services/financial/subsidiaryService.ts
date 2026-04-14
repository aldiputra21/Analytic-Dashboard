// Subsidiary (Corporate) Service
// Drizzle ORM PostgreSQL implementation

import { eq, asc, sql } from 'drizzle-orm';
import { db } from '../../db/connection';
import { corporates, balanceSheets, incomeStatements } from '../../db/schema/index.js';
import { Subsidiary, CreateSubsidiaryInput, UpdateSubsidiaryInput } from '../../types/financial/subsidiary';

const MAX_SUBSIDIARIES = 5;

function mapRowToSubsidiary(row: typeof corporates.$inferSelect): Subsidiary {
  return {
    id: row.id,
    name: row.name,
    industrySector: row.industry ?? '',
    fiscalYearStartMonth: row.fiscalYearStartMonth,
    currency: row.currency,
    taxRate: row.taxRate ? parseFloat(row.taxRate) : 0,
    isActive: row.isActive,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt ?? row.createdAt,
    createdBy: row.createdBy,
  };
}

/**
 * Creates a new corporate (subsidiary). Enforces max 5 limit.
 */
export async function createSubsidiary(
  input: CreateSubsidiaryInput,
  createdBy: string,
): Promise<{ subsidiary?: Subsidiary; error?: string }> {
  const [{ count }] = await db.select({ count: sql<number>`COUNT(*)` }).from(corporates);
  if (count >= MAX_SUBSIDIARIES) {
    return { error: `Maximum of ${MAX_SUBSIDIARIES} subsidiaries allowed` };
  }

  const code = input.name.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10);

  const [inserted] = await db.insert(corporates).values({
    name: input.name,
    code,
    industry: input.industrySector,
    fiscalYearStartMonth: input.fiscalYearStartMonth,
    currency: input.currency ?? 'IDR',
    taxRate: input.taxRate?.toString(),
    createdBy,
  }).returning();

  return { subsidiary: mapRowToSubsidiary(inserted) };
}

/**
 * Lists all corporates with optional active filter.
 */
export async function listSubsidiaries(activeOnly?: boolean): Promise<Subsidiary[]> {
  const rows = activeOnly
    ? await db.select().from(corporates).where(eq(corporates.isActive, true)).orderBy(asc(corporates.createdAt))
    : await db.select().from(corporates).orderBy(asc(corporates.createdAt));
  return rows.map(mapRowToSubsidiary);
}

/**
 * Gets a corporate by ID.
 */
export async function getSubsidiaryById(id: string): Promise<Subsidiary | null> {
  const [row] = await db.select().from(corporates).where(eq(corporates.id, id)).limit(1);
  return row ? mapRowToSubsidiary(row) : null;
}

/**
 * Updates a corporate's profile.
 */
export async function updateSubsidiary(
  id: string,
  input: UpdateSubsidiaryInput,
): Promise<Subsidiary | null> {
  const [existing] = await db.select().from(corporates).where(eq(corporates.id, id)).limit(1);
  if (!existing) return null;

  const [updated] = await db.update(corporates).set({
    name: input.name ?? existing.name,
    industry: input.industrySector ?? existing.industry,
    fiscalYearStartMonth: input.fiscalYearStartMonth ?? existing.fiscalYearStartMonth,
    currency: input.currency ?? existing.currency,
    taxRate: input.taxRate !== undefined ? input.taxRate.toString() : existing.taxRate,
    updatedAt: new Date(),
  }).where(eq(corporates.id, id)).returning();

  return mapRowToSubsidiary(updated);
}

/**
 * Toggles corporate active status.
 */
export async function setSubsidiaryStatus(
  id: string,
  isActive: boolean,
): Promise<Subsidiary | null> {
  const [existing] = await db.select().from(corporates).where(eq(corporates.id, id)).limit(1);
  if (!existing) return null;

  const [updated] = await db.update(corporates).set({
    isActive,
    updatedAt: new Date(),
  }).where(eq(corporates.id, id)).returning();

  return mapRowToSubsidiary(updated);
}

/**
 * Deletes a corporate. Rejects if it has financial data (balance sheets or income statements).
 */
export async function deleteSubsidiary(
  id: string,
): Promise<{ success: boolean; error?: string }> {
  const [existing] = await db.select().from(corporates).where(eq(corporates.id, id)).limit(1);
  if (!existing) return { success: false, error: 'Subsidiary not found' };

  // Check for financial data via departments → balance_sheets / income_statements
  // For now, check if any departments exist under this corporate
  const { departments } = await import('../../db/schema/index.js');
  const [dept] = await db.select({ id: departments.id }).from(departments)
    .where(eq(departments.corporateId, id)).limit(1);

  if (dept) {
    return { success: false, error: 'Cannot delete subsidiary with existing departments/financial data' };
  }

  await db.delete(corporates).where(eq(corporates.id, id));
  return { success: true };
}


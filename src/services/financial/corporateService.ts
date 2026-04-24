// Corporate Service
// Drizzle ORM PostgreSQL implementation

import { eq, asc, sql } from 'drizzle-orm';
import { db } from '../../db/connection';
import { corporates, departments } from '../../db/schema/index.js';
import { Corporate, CreateCorporateInput, UpdateCorporateInput } from '../../types/financial/corporate';

import { createFRSAuditLog } from './auditLogService';

function mapRowToCorporate(row: typeof corporates.$inferSelect): Corporate {
  return {
    id: row.id,
    name: row.name,
    code: row.code,
    logo: row.logo,
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
 * Creates a new corporate.
 */
export async function createCorporate(
  input: CreateCorporateInput,
  createdBy: string,
  context?: { ip?: string; userAgent?: string }
): Promise<{ corporate?: Corporate; error?: string }> {
  // Check if code exists
  const [existing] = await db.select().from(corporates).where(eq(corporates.code, input.code)).limit(1);
  if (existing) {
    return { error: `Corporate code '${input.code}' already exists` };
  }

  const [inserted] = await db.insert(corporates).values({
    name: input.name,
    code: input.code,
    logo: input.logo,
    industry: input.industrySector,
    fiscalYearStartMonth: input.fiscalYearStartMonth,
    currency: input.currency ?? 'IDR',
    taxRate: input.taxRate?.toString(),
    createdBy: createdBy,
    updatedBy: createdBy, // Set updatedBy to createdBy initially
  }).returning();

  const corporate = mapRowToCorporate(inserted);

  await createFRSAuditLog({
    userId: createdBy,
    action: 'create',
    entityType: 'corporate',
    entityId: corporate.id,
    newValues: JSON.parse(JSON.stringify(corporate)),
    ipAddress: context?.ip,
    userAgent: context?.userAgent,
  });

  return { corporate };
}

/**
 * Lists all corporates with pagination and filtering.
 */
export async function listCorporates(options: { 
  activeOnly?: boolean; 
  search?: string; 
  page?: number; 
  pageSize?: number;
} = {}): Promise<{ records: Corporate[]; totalCount: number }> {
  const { activeOnly, search, page = 1, pageSize = 0 } = options;
  
  let baseQuery = db.select().from(corporates);
  let countQuery = db.select({ count: sql<number>`count(*)` }).from(corporates);

  const filters = [];
  if (activeOnly) {
    filters.push(eq(corporates.isActive, true));
  }
  if (search) {
    filters.push(sql`(${corporates.name} ILIKE ${'%' + search + '%'} OR ${corporates.code} ILIKE ${'%' + search + '%'})`);
  }

  if (filters.length > 0) {
    baseQuery = baseQuery.where(sql.join(filters, sql` AND `)) as any;
    countQuery = countQuery.where(sql.join(filters, sql` AND `)) as any;
  }

  // Get total count
  const [countResult] = await countQuery;
  const totalCount = Number(countResult.count);

  // Apply pagination
  let finalQuery = baseQuery.orderBy(asc(corporates.name));
  if (pageSize > 0) {
    finalQuery = finalQuery.limit(pageSize).offset((page - 1) * pageSize) as any;
  }

  const rows = await finalQuery;
  return {
    records: rows.map(mapRowToCorporate),
    totalCount,
  };
}

/**
 * Gets all active corporates for dropdowns/items.
 */
export async function getActiveCorporates(): Promise<Corporate[]> {
  const rows = await db.select().from(corporates)
    .where(eq(corporates.isActive, true))
    .orderBy(asc(corporates.name));
  
  return rows.map(mapRowToCorporate);
}

/**
 * Gets a corporate by ID.
 */
export async function getCorporateById(id: string): Promise<Corporate | null> {
  const [row] = await db.select().from(corporates).where(eq(corporates.id, id)).limit(1);
  return row ? mapRowToCorporate(row) : null;
}

/**
 * Updates a corporate profile.
 */
export async function updateCorporate(
  id: string,
  input: UpdateCorporateInput,
  updatedBy: string,
  context?: { ip?: string; userAgent?: string }
): Promise<Corporate | null> {
  const [existing] = await db.select().from(corporates).where(eq(corporates.id, id)).limit(1);
  if (!existing) return null;

  const oldValues = mapRowToCorporate(existing);

  const [updated] = await db.update(corporates).set({
    name: input.name ?? existing.name,
    code: input.code ?? existing.code,
    logo: input.logo ?? existing.logo,
    industry: input.industrySector ?? existing.industry,
    fiscalYearStartMonth: input.fiscalYearStartMonth ?? existing.fiscalYearStartMonth,
    currency: input.currency ?? existing.currency,
    taxRate: input.taxRate !== undefined ? input.taxRate.toString() : existing.taxRate,
    isActive: input.isActive !== undefined ? input.isActive : existing.isActive,
    updatedBy: updatedBy,
    updatedAt: new Date(),
  }).where(eq(corporates.id, id)).returning();

  const corporate = mapRowToCorporate(updated);

  await createFRSAuditLog({
    userId: updatedBy,
    action: 'update',
    entityType: 'corporate',
    entityId: id,
    oldValues: JSON.parse(JSON.stringify(oldValues)),
    newValues: JSON.parse(JSON.stringify(corporate)),
    ipAddress: context?.ip,
    userAgent: context?.userAgent,
  });

  return corporate;
}

/**
 * Toggles corporate active status.
 */
export async function setCorporateStatus(
  id: string,
  isActive: boolean,
  updatedBy: string,
  context?: { ip?: string; userAgent?: string }
): Promise<Corporate | null> {
  return updateCorporate(id, { isActive }, updatedBy, context);
}

/**
 * Deletes a corporate history. Rejects if it has departments.
 */
export async function deleteCorporate(
  id: string,
  deletedBy: string,
  context?: { ip?: string; userAgent?: string }
): Promise<{ success: boolean; error?: string }> {
  const [existing] = await db.select().from(corporates).where(eq(corporates.id, id)).limit(1);
  if (!existing) return { success: false, error: 'Corporate not found' };

  const [dept] = await db.select({ id: departments.id }).from(departments)
    .where(eq(departments.corporateId, id)).limit(1);

  if (dept) {
    return { success: false, error: 'Cannot delete corporate with existing departments/financial data' };
  }

  await createFRSAuditLog({
    userId: deletedBy,
    action: 'delete',
    entityType: 'corporate',
    entityId: id,
    oldValues: JSON.parse(JSON.stringify(mapRowToCorporate(existing))),
    ipAddress: context?.ip,
    userAgent: context?.userAgent,
  });

  await db.delete(corporates).where(eq(corporates.id, id));
  return { success: true };
}

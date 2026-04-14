// Target Service — MAFINDA Dashboard Enhancement
// Drizzle ORM PostgreSQL implementation (target_headers + target_details master-detail)

import { eq, and, desc, sql } from 'drizzle-orm';
import { db } from '../../db/connection';
import { targetHeaders, targetDetails } from '../../db/schema';
import { NotFoundError } from './departmentService';

export interface TargetDetail {
  id: string;
  targetHeaderId: string;
  targetType: string;
  costCenter?: string;
  amount: string;
  notes?: string;
}

export interface FinancialTarget {
  id: string;
  departmentId: string;
  projectId?: string;
  fiscalYear: number;
  fiscalMonth: number;
  notes?: string;
  createdBy: string;
  createdAt: string;
  updatedBy?: string;
  updatedAt?: string;
  details: TargetDetail[];
}

export interface GetTargetsFilter {
  departmentId?: string;
  projectId?: string;
  fiscalYear?: number;
  fiscalMonth?: number;
}

function mapHeaderRow(row: typeof targetHeaders.$inferSelect, details: TargetDetail[]): FinancialTarget {
  return {
    id: row.id,
    departmentId: row.departmentId,
    projectId: row.projectId ?? undefined,
    fiscalYear: row.fiscalYear,
    fiscalMonth: row.fiscalMonth,
    notes: row.notes ?? undefined,
    createdBy: row.createdBy,
    createdAt: row.createdAt.toISOString(),
    updatedBy: row.updatedBy ?? undefined,
    updatedAt: row.updatedAt?.toISOString(),
    details,
  };
}

function mapDetailRow(row: typeof targetDetails.$inferSelect): TargetDetail {
  return {
    id: row.id,
    targetHeaderId: row.targetHeaderId,
    targetType: row.targetType,
    costCenter: row.costCenter ?? undefined,
    amount: row.amount,
    notes: row.notes ?? undefined,
  };
}

/**
 * Returns targets (with details), optionally filtered.
 */
export async function getTargets(filter: GetTargetsFilter = {}): Promise<FinancialTarget[]> {
  const conditions = [];
  if (filter.departmentId) conditions.push(eq(targetHeaders.departmentId, filter.departmentId));
  if (filter.projectId) conditions.push(eq(targetHeaders.projectId, filter.projectId));
  if (filter.fiscalYear) conditions.push(eq(targetHeaders.fiscalYear, filter.fiscalYear));
  if (filter.fiscalMonth) conditions.push(eq(targetHeaders.fiscalMonth, filter.fiscalMonth));

  const headers = await db.select().from(targetHeaders)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(targetHeaders.fiscalYear), desc(targetHeaders.fiscalMonth));

  if (headers.length === 0) return [];

  const headerIds = headers.map((h) => h.id);
  const allDetails = await db.select().from(targetDetails)
    .where(sql`${targetDetails.targetHeaderId} IN ${headerIds}`);

  const detailsByHeader = new Map<string, TargetDetail[]>();
  for (const d of allDetails) {
    const list = detailsByHeader.get(d.targetHeaderId) ?? [];
    list.push(mapDetailRow(d));
    detailsByHeader.set(d.targetHeaderId, list);
  }

  return headers.map((h) => mapHeaderRow(h, detailsByHeader.get(h.id) ?? []));
}

/**
 * Upserts a target header with its details.
 * If a header with the same (departmentId, projectId, fiscalYear, fiscalMonth) exists, it is updated.
 * Details are replaced (delete + re-insert).
 */
export async function upsertTarget(
  data: {
    departmentId: string;
    projectId?: string;
    fiscalYear: number;
    fiscalMonth: number;
    notes?: string;
    details: Array<{ targetType: string; costCenter?: string; amount: string; notes?: string }>;
  },
  createdBy: string,
): Promise<FinancialTarget> {
  return await db.transaction(async (tx) => {
    // Check if header exists
    const conditions = [
      eq(targetHeaders.departmentId, data.departmentId),
      eq(targetHeaders.fiscalYear, data.fiscalYear),
      eq(targetHeaders.fiscalMonth, data.fiscalMonth),
    ];
    if (data.projectId) {
      conditions.push(eq(targetHeaders.projectId, data.projectId));
    } else {
      conditions.push(sql`${targetHeaders.projectId} IS NULL`);
    }

    const [existing] = await tx.select().from(targetHeaders)
      .where(and(...conditions))
      .limit(1);

    let headerId: string;

    if (existing) {
      // Update header
      await tx.update(targetHeaders).set({
        notes: data.notes,
        updatedBy: createdBy,
        updatedAt: new Date(),
      }).where(eq(targetHeaders.id, existing.id));
      headerId = existing.id;

      // Delete old details
      await tx.delete(targetDetails).where(eq(targetDetails.targetHeaderId, headerId));
    } else {
      // Insert header
      const [inserted] = await tx.insert(targetHeaders).values({
        departmentId: data.departmentId,
        projectId: data.projectId,
        fiscalYear: data.fiscalYear,
        fiscalMonth: data.fiscalMonth,
        notes: data.notes,
        createdBy,
      }).returning();
      headerId = inserted.id;
    }

    // Insert details
    if (data.details.length > 0) {
      await tx.insert(targetDetails).values(
        data.details.map((d) => ({
          targetHeaderId: headerId,
          targetType: d.targetType,
          costCenter: d.costCenter,
          amount: d.amount,
          notes: d.notes,
        })),
      );
    }

    // Re-fetch full record
    const [header] = await tx.select().from(targetHeaders)
      .where(eq(targetHeaders.id, headerId));
    const details = await tx.select().from(targetDetails)
      .where(eq(targetDetails.targetHeaderId, headerId));

    return mapHeaderRow(header, details.map(mapDetailRow));
  });
}

/**
 * Deletes a target (header + cascaded details) by id.
 * Throws NotFoundError if not found.
 */
export async function deleteTarget(id: string): Promise<{ success: boolean }> {
  const [existing] = await db.select({ id: targetHeaders.id }).from(targetHeaders)
    .where(eq(targetHeaders.id, id))
    .limit(1);
  if (!existing) throw new NotFoundError('Target tidak ditemukan');

  // Details cascade via ON DELETE CASCADE
  await db.delete(targetHeaders).where(eq(targetHeaders.id, id));
  return { success: true };
}

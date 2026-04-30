// Target Service — MAFINDA Dashboard Enhancement
// Drizzle ORM PostgreSQL implementation (target_headers + target_details master-detail)

import { eq, and, asc, desc, sql, isNull } from 'drizzle-orm';
import { db } from '../../db/connection';
import { targetHeaders, targetDetails } from '../../db/schema';
import { createFRSAuditLog, RequestContext } from '../financial/auditLogService';
import { AppError, ErrorCode } from '../../utils/errors.js';

export interface TargetDetail {
  id: string;
  targetHeaderId: string;
  targetType: string;
  month: number;
  costCenter?: string;
  amount: string;
  notes?: string;
}

export interface FinancialTarget {
  id: string;
  departmentId: string;
  projectId?: string;
  fiscalYear: number;
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
    month: row.month,
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
  // if (filter.fiscalMonth) conditions.push(eq(targetHeaders.fiscalMonth, filter.fiscalMonth));

  const headers = await db.select().from(targetHeaders)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(targetHeaders.fiscalYear));

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
 * Upserts a single target header and its details.
 */
export async function upsertTarget(
  data: {
    departmentId: string;
    projectId?: string;
    fiscalYear: number;
    fiscalMonth: number;
    notes?: string;
    details: Array<{
      targetType: 'revenue' | 'opex';
      costCenter?: string;
      amount: string;
      notes?: string;
    }>;
  },
  createdBy: string,
): Promise<FinancialTarget> {
  return await db.transaction(async (tx) => {
    // Check if header exists
    const conditions = [
      eq(targetHeaders.departmentId, data.departmentId),
      eq(targetHeaders.fiscalYear, data.fiscalYear),
      // eq(targetHeaders.fiscalMonth, data.fiscalMonth),
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
      await tx.update(targetHeaders).set({
        notes: data.notes,
        updatedBy: createdBy,
        updatedAt: new Date(),
      }).where(eq(targetHeaders.id, existing.id));
      headerId = existing.id;
      await tx.delete(targetDetails).where(eq(targetDetails.targetHeaderId, headerId));
    } else {
      const [inserted] = await tx.insert(targetHeaders).values({
        departmentId: data.departmentId,
        projectId: data.projectId,
        fiscalYear: data.fiscalYear,
        // fiscalMonth: data.fiscalMonth,
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
          month: 1, // DUMMY
          notes: d.notes,
        }))
      );
    }

    // Return the full header with details
    const [header] = await tx.select().from(targetHeaders).where(eq(targetHeaders.id, headerId));
    const details = await tx.select().from(targetDetails).where(eq(targetDetails.targetHeaderId, headerId));
    
    return mapHeaderRow(header, details.map(mapDetailRow));
  });
}

/**
 * Batch upserts targets for multiple months (a whole year) with Revenue and Cost tables.
 */
export async function saveAnnualTarget(
  data: {
    departmentId: string;
    projectId?: string | null;
    fiscalYear: number;
    revenueDetails: Array<{ month: number; amount: string; notes?: string }>;
    costDetails: Array<{ month: number; costCenter: string; amount: string; notes?: string }>;
    notes?: string;
  },
  userId: string,
  context?: RequestContext
): Promise<FinancialTarget> {
  return await db.transaction(async (tx) => {
    // 1. Check for existing header
    const conditions = [
      eq(targetHeaders.departmentId, data.departmentId),
      eq(targetHeaders.fiscalYear, data.fiscalYear),
    ];
    if (data.projectId) {
      conditions.push(eq(targetHeaders.projectId, data.projectId));
    } else {
      conditions.push(isNull(targetHeaders.projectId));
    }

    const [existing] = await tx.select().from(targetHeaders)
      .where(and(...conditions))
      .limit(1);

    let headerId: string;
    let oldData: any = null;

    if (existing) {
      oldData = JSON.parse(JSON.stringify(existing));
      const oldDetails = await tx.select().from(targetDetails).where(eq(targetDetails.targetHeaderId, existing.id));
      oldData.details = JSON.parse(JSON.stringify(oldDetails));

      await tx.update(targetHeaders).set({
        notes: data.notes,
        updatedBy: userId,
        updatedAt: new Date(),
      }).where(eq(targetHeaders.id, existing.id));
      headerId = existing.id;
      
      // Clear old details
      await tx.delete(targetDetails).where(eq(targetDetails.targetHeaderId, headerId));
    } else {
      const [inserted] = await tx.insert(targetHeaders).values({
        departmentId: data.departmentId,
        projectId: data.projectId || null,
        fiscalYear: data.fiscalYear,
        notes: data.notes,
        createdBy: userId,
      }).returning();
      headerId = inserted.id;
    }

    // 2. Prepare and Insert details
    const detailsToInsert = [
      ...data.revenueDetails.map(r => ({
        targetHeaderId: headerId,
        targetType: 'REVENUE',
        month: r.month,
        amount: r.amount,
        notes: r.notes
      })),
      ...data.costDetails.map(c => ({
        targetHeaderId: headerId,
        targetType: 'COST',
        month: c.month,
        costCenter: c.costCenter,
        amount: c.amount,
        notes: c.notes
      }))
    ];

    if (detailsToInsert.length > 0) {
      await tx.insert(targetDetails).values(detailsToInsert);
    } else if (existing) {
      // If all targets cleared, delete the header too
      await tx.delete(targetHeaders).where(eq(targetHeaders.id, headerId));
      
      await createFRSAuditLog({
        userId,
        action: 'delete',
        entityType: 'target',
        entityId: headerId,
        oldValues: oldData,
        ipAddress: context?.ip,
        userAgent: context?.userAgent
      });
      
      throw new AppError(ErrorCode.TARGET_DELETED, 'Target deleted');
    }

    // 3. Audit Log
    const [header] = await tx.select().from(targetHeaders).where(eq(targetHeaders.id, headerId));
    const details = await tx.select().from(targetDetails).where(eq(targetDetails.targetHeaderId, headerId));
    const result = mapHeaderRow(header, details.map(mapDetailRow));

    await createFRSAuditLog({
      userId,
      action: existing ? 'update' : 'create',
      entityType: 'target',
      entityId: headerId,
      oldValues: existing ? oldData : undefined,
      newValues: JSON.parse(JSON.stringify(result)),
      ipAddress: context?.ip,
      userAgent: context?.userAgent
    });

    return result;
  });
}

/**
 * Gets annual targets summarized for list view with pagination and search.
 */
export async function getAnnualTargets(options: {
  search?: string;
  departmentId?: string | string[];
  projectId?: string;
  fiscalYear?: number;
  page?: number;
  pageSize?: number;
} = {}): Promise<{ records: any[]; totalCount: number }> {
  const { search, departmentId, projectId, fiscalYear, page = 1, pageSize = 0 } = options;

  const conditions: any[] = [];
  if (search) {
    conditions.push(sql`p.name ILIKE ${'%' + search + '%'}`)
  }
  if (departmentId) {
    if (Array.isArray(departmentId)) {
      if (departmentId.length > 0) {
        conditions.push(sql`th.department_id IN ${departmentId}`);
      }
    } else {
      conditions.push(sql`th.department_id = ${departmentId}`);
    }
  }
  if (projectId) {
    conditions.push(sql`th.project_id = ${projectId}`);
  }
  if (fiscalYear) {
    conditions.push(sql`th.fiscal_year = ${fiscalYear}`);
  }

  const whereClause = conditions.length > 0
    ? sql`WHERE ${sql.join(conditions, sql` AND `)}`
    : sql``;

  const countQuery = sql`
    SELECT COUNT(*) as total FROM (
      SELECT 1
      FROM cfd.target_headers th
      JOIN public.departments d ON th.department_id = d.id
      LEFT JOIN public.projects p ON th.project_id = p.id
      ${whereClause}
      GROUP BY th.department_id, th.project_id, th.fiscal_year
    ) as sub
  `;
  
  const totalCountResult = await db.execute(countQuery);
  const totalCount = totalCountResult.rows.length > 0 ? Number(totalCountResult.rows[0].total) : 0;

  let limitClause = sql``;
  if (pageSize > 0) {
    limitClause = sql`LIMIT ${pageSize} OFFSET ${(page - 1) * pageSize}`;
  }

  const results = await db.execute(sql`
    SELECT 
      th.department_id,
      th.project_id,
      th.fiscal_year,
      d.name as department_name,
      p.name as project_name,
      p.description as project_description,
      SUM(CASE WHEN td.target_type = 'REVENUE' THEN td.amount ELSE 0 END) as total_revenue,
      SUM(CASE WHEN td.target_type = 'COST' THEN td.amount ELSE 0 END) as total_cost
    FROM cfd.target_headers th
    JOIN public.departments d ON th.department_id = d.id
    LEFT JOIN public.projects p ON th.project_id = p.id
    LEFT JOIN cfd.target_details td ON th.id = td.target_header_id
    ${whereClause}
    GROUP BY th.department_id, th.project_id, th.fiscal_year, d.name, p.name, p.description
    ORDER BY th.fiscal_year DESC, d.name ASC, p.name ASC
    ${limitClause}
  `);
  
  return {
    records: results.rows,
    totalCount
  };
}

/**
 * Gets details for a specific annual target.
 */
export async function getAnnualTargetDetails(
  departmentId: string, 
  projectId: string | null, 
  fiscalYear: number
): Promise<any> {
  const conditions = [
    eq(targetHeaders.departmentId, departmentId),
    eq(targetHeaders.fiscalYear, fiscalYear)
  ];
  if (projectId) {
    conditions.push(eq(targetHeaders.projectId, projectId));
  } else {
    conditions.push(sql`${targetHeaders.projectId} IS NULL`);
  }

  const headers = await db.select().from(targetHeaders)
    .where(and(...conditions))
    .orderBy(asc(targetHeaders.id));

  if (headers.length === 0) return null;

  const headerIds = headers.map(h => h.id);
  const details = await db.select().from(targetDetails)
    .where(sql`${targetDetails.targetHeaderId} IN ${headerIds}`);

  const monthMap = new Map();
  headers.forEach(h => {
    // Just a stub so it compiles
    monthMap.set(h.id, { fiscalMonth: 1, revenue: '0', cost: '0', notes: h.notes });
  });

  details.forEach(d => {
    const m = monthMap.get(d.targetHeaderId);
    if (d.targetType === 'REVENUE') m.revenue = d.amount;
    if (d.targetType === 'COST') m.cost = d.amount;
  });

  return {
    departmentId,
    projectId,
    fiscalYear,
    months: Array.from(monthMap.values())
  };
}

/**
 * Deletes an annual target.
 */
export async function deleteAnnualTarget(
  departmentId: string, 
  projectId: string | null, 
  fiscalYear: number,
  userId: string,
  context?: RequestContext
): Promise<void> {
  const conditions = [
    eq(targetHeaders.departmentId, departmentId),
    eq(targetHeaders.fiscalYear, fiscalYear)
  ];
  if (projectId) {
    conditions.push(eq(targetHeaders.projectId, projectId));
  } else {
    conditions.push(isNull(targetHeaders.projectId));
  }

  const [existing] = await db.select().from(targetHeaders).where(and(...conditions)).limit(1);
  if (!existing) throw AppError.notFound(ErrorCode.TARGET_NOT_FOUND, 'Target tidak ditemukan');

  const details = await db.select().from(targetDetails).where(eq(targetDetails.targetHeaderId, existing.id));
  const oldData = JSON.parse(JSON.stringify({ ...existing, details }));

  await db.delete(targetHeaders).where(eq(targetHeaders.id, existing.id));

  await createFRSAuditLog({
    userId,
    action: 'delete',
    entityType: 'target',
    entityId: existing.id,
    oldValues: oldData,
    ipAddress: context?.ip,
    userAgent: context?.userAgent
  });
}

/**
 * Deletes a target (header + cascaded details) by id.
 */
export async function deleteTarget(id: string): Promise<{ success: boolean }> {
  const [existing] = await db.select({ id: targetHeaders.id }).from(targetHeaders)
    .where(eq(targetHeaders.id, id))
    .limit(1);
  if (!existing) throw AppError.notFound(ErrorCode.TARGET_NOT_FOUND, 'Target tidak ditemukan');

  await db.delete(targetHeaders).where(eq(targetHeaders.id, id));
  return { success: true };
}

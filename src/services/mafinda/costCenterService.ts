// src/services/mafinda/costCenterService.ts
import { eq, asc, desc, sql, and, or, ilike } from 'drizzle-orm';
import { db } from '../../db/connection';
import { costCenters } from '../../db/schema/cfd';
import { CostCenter, CreateCostCenterInput, UpdateCostCenterInput } from '../../types/financial/costCenter';
import { createFRSAuditLog } from '../financial/auditLogService';
import { RequestContext } from '../financial/auditLogService';
import { AppError, ErrorCode } from '../../utils/errors.js';

function mapRowToCostCenter(row: typeof costCenters.$inferSelect): CostCenter {
  return {
    id: row.id,
    corporateId: row.corporateId,
    parentId: row.parentId,
    category: row.category,
    name: row.name,
    code: row.code,
    description: row.description,
    isActive: row.isActive,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    createdBy: row.createdBy,
  };
}

export async function createCostCenter(input: CreateCostCenterInput, createdBy: string, context?: RequestContext): Promise<CostCenter> {
  let category = input.category;

  // If parent is provided, inherit category from parent if parent has it
  if (input.parentId) {
    const [parent] = await db.select().from(costCenters).where(eq(costCenters.id, input.parentId)).limit(1);
    if (parent) {
      category = parent.category;
    }
  }

  const [inserted] = await db.insert(costCenters).values({
    corporateId: input.corporateId,
    parentId: input.parentId,
    category,
    name: input.name,
    code: input.code,
    description: input.description,
    isActive: input.isActive ?? true,
    createdBy: createdBy,
    updatedBy: createdBy,
  }).returning();

  const costCenter = mapRowToCostCenter(inserted);

  await createFRSAuditLog({
    userId: createdBy,
    action: 'create',
    entityType: 'cost_center',
    entityId: costCenter.id,
    newValues: JSON.parse(JSON.stringify(costCenter)),
    ipAddress: context?.ip,
    userAgent: context?.userAgent,
  });

  return costCenter;
}

export async function listCostCenters(options: { 
  corporateId?: string;
  search?: string; 
  activeOnly?: boolean;
  page?: number;
  pageSize?: number;
} = {}): Promise<{ records: CostCenter[]; totalCount: number }> {
  const { corporateId, search, activeOnly, page = 1, pageSize = 0 } = options;
  
  let baseFilters: any[] = [];
  if (corporateId) {
    baseFilters.push(eq(costCenters.corporateId, corporateId));
  }
  if (activeOnly) {
    baseFilters.push(eq(costCenters.isActive, true));
  }
  if (search) {
    baseFilters.push(or(
      ilike(costCenters.name, `%${search}%`),
      ilike(costCenters.code, `%${search}%`)
    ));
  }

  const whereClause = baseFilters.length > 0 ? and(...baseFilters) : undefined;

  // Get total count
  const [countResult] = await db.select({ count: sql<number>`count(*)` }).from(costCenters).where(whereClause);
  const totalCount = Number(countResult.count);

  let query = db.select().from(costCenters).where(whereClause);
  
  if (pageSize > 0) {
    query = query.limit(pageSize).offset((page - 1) * pageSize) as any;
  }

  const rows = await query.orderBy(asc(costCenters.code));
    
  return {
    records: rows.map(mapRowToCostCenter),
    totalCount,
  };
}

export async function getCostCenterById(id: string): Promise<CostCenter | null> {
  const [row] = await db.select().from(costCenters).where(eq(costCenters.id, id)).limit(1);
  return row ? mapRowToCostCenter(row) : null;
}

export async function updateCostCenter(id: string, input: UpdateCostCenterInput, updatedBy: string, context?: RequestContext): Promise<CostCenter | null> {
  const [existing] = await db.select().from(costCenters).where(eq(costCenters.id, id)).limit(1);
  if (!existing) return null;

  let category = input.category ?? existing.category;
  if (input.parentId && input.parentId !== existing.parentId) {
    const [parent] = await db.select().from(costCenters).where(eq(costCenters.id, input.parentId)).limit(1);
    if (parent) {
      category = parent.category;
    }
  }

  const [updated] = await db.update(costCenters).set({
    parentId: input.parentId !== undefined ? input.parentId : existing.parentId,
    category,
    name: input.name ?? existing.name,
    code: input.code ?? existing.code,
    description: input.description !== undefined ? input.description : existing.description,
    isActive: input.isActive !== undefined ? input.isActive : existing.isActive,
    updatedBy: updatedBy,
    updatedAt: new Date(),
  }).where(eq(costCenters.id, id)).returning();

  const costCenter = mapRowToCostCenter(updated);
  const oldValues = mapRowToCostCenter(existing);

  await createFRSAuditLog({
    userId: updatedBy,
    action: 'update',
    entityType: 'cost_center',
    entityId: id,
    oldValues: JSON.parse(JSON.stringify(oldValues)),
    newValues: JSON.parse(JSON.stringify(costCenter)),
    ipAddress: context?.ip,
    userAgent: context?.userAgent,
  });

  return costCenter;
}

export async function deleteCostCenter(id: string, deletedBy?: string, context?: RequestContext): Promise<boolean> {
  // Check if it's a parent to others
  const [child] = await db.select({ id: costCenters.id }).from(costCenters).where(eq(costCenters.parentId, id)).limit(1);
  if (child) {
    throw AppError.unprocessable(ErrorCode.DELETE_PROTECTED, 'Cannot delete cost center that has sub-centers');
  }

  const [existing] = await db.select().from(costCenters).where(eq(costCenters.id, id)).limit(1);
  if (!existing) return false;
 
  const result = await db.delete(costCenters).where(eq(costCenters.id, id)).returning();
  
  if (result.length > 0) {
    await createFRSAuditLog({
      userId: deletedBy || '',
      action: 'delete',
      entityType: 'cost_center',
      entityId: id,
      oldValues: JSON.parse(JSON.stringify(mapRowToCostCenter(existing))),
      ipAddress: context?.ip,
      userAgent: context?.userAgent,
    });
  }
 
  return result.length > 0;
}

export async function getActiveCostCenters(corporateId?: string, parentId?: string | null): Promise<CostCenter[]> {
  const conditions = [eq(costCenters.isActive, true)];
  if (corporateId) {
    conditions.push(eq(costCenters.corporateId, corporateId));
  }
  if (parentId !== undefined) {
    if (parentId === null) {
      conditions.push(sql`${costCenters.parentId} IS NULL`);
    } else {
      conditions.push(eq(costCenters.parentId, parentId));
    }
  }

  const rows = await db
    .select()
    .from(costCenters)
    .where(and(...conditions))
    .orderBy(asc(costCenters.code));

  return rows.map(mapRowToCostCenter);
}

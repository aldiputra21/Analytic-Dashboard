import { eq, and, desc, sql, ilike, count, inArray } from 'drizzle-orm';
import { db } from '../../db/connection';
import { cashFlowProjectionHeaders, cashFlowProjectionDetails } from '../../db/schema/cfd';
import { corporates as corporatesTable } from '../../db/schema/public';
import { createFRSAuditLog } from './auditLogService';
import { AppError, ErrorCode } from '../../utils/errors.js';

export interface CashFlowProjectionDetailInput {
  month: number;
  type: 'cash-in' | 'cash-out';
  group: 'operating' | 'investing' | 'financing';
  category: string;
  amount: number;
  notes?: string | null;
}

export interface CreateCashFlowProjectionInput {
  corporateId: string;
  fiscalYear: number;
  initialBalance: number;
  notes?: string | null;
  details: CashFlowProjectionDetailInput[];
}

export interface UpdateCashFlowProjectionInput {
  initialBalance?: number;
  notes?: string | null;
  details?: CashFlowProjectionDetailInput[];
}

export class CashFlowProjectionService {
  /**
   * List projections for one or more corporates
   */
  static async listProjections(params: {
    corporateIds?: string[];
    search?: string;
    page?: number;
    pageSize?: number;
    year?: string | number;
  }) {
    const { corporateIds, search, page = 1, pageSize = 10, year } = params;
    const offset = (page - 1) * pageSize;

    const conditions = [];
    if (corporateIds && corporateIds.length > 0) {
      conditions.push(inArray(cashFlowProjectionHeaders.corporateId, corporateIds));
    }
    
    if (search) {
      conditions.push(ilike(cashFlowProjectionHeaders.notes, `%${search}%`));
    }

    if (year) {
      conditions.push(eq(cashFlowProjectionHeaders.fiscalYear, typeof year === 'string' ? parseInt(year) : year));
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [records, [{ totalCount }]] = await Promise.all([
      db
        .select({
          id: cashFlowProjectionHeaders.id,
          corporateId: cashFlowProjectionHeaders.corporateId,
          corporateName: corporatesTable.name,
          fiscalYear: cashFlowProjectionHeaders.fiscalYear,
          initialBalance: cashFlowProjectionHeaders.initialBalance,
          notes: cashFlowProjectionHeaders.notes,
          createdAt: cashFlowProjectionHeaders.createdAt,
          createdBy: cashFlowProjectionHeaders.createdBy,
        })
        .from(cashFlowProjectionHeaders)
        .leftJoin(corporatesTable, eq(cashFlowProjectionHeaders.corporateId, corporatesTable.id))
        .where(where)
        .orderBy(desc(cashFlowProjectionHeaders.fiscalYear))
        .limit(pageSize)
        .offset(offset),
      db.select({ totalCount: count() }).from(cashFlowProjectionHeaders).where(where),
    ]);

    const recordsWithNumber = records.map(r => ({
      ...r,
      initialBalance: Number(r.initialBalance)
    }));

    return {
      records: recordsWithNumber,
      totalCount: Number(totalCount),
    };
  }

  /**
   * Get projection by ID with details
   */
  static async getProjectionById(id: string) {
    const [header] = await db
      .select()
      .from(cashFlowProjectionHeaders)
      .where(eq(cashFlowProjectionHeaders.id, id))
      .limit(1);

    if (!header) {
      throw AppError.notFound(ErrorCode.NOT_FOUND, 'Cash flow projection not found');
    }

    const details = await db
      .select()
      .from(cashFlowProjectionDetails)
      .where(eq(cashFlowProjectionDetails.headerId, id))
      .orderBy(cashFlowProjectionDetails.month, cashFlowProjectionDetails.type);

    return {
      ...header,
      initialBalance: Number(header.initialBalance),
      details: details.map(d => ({
        ...d,
        amount: Number(d.amount),
      })),
    };
  }

  /**
   * Create new projection with details
   */
  static async createProjection(input: CreateCashFlowProjectionInput, userId: string) {
    // Check for duplicate year
    const [existing] = await db
      .select({ id: cashFlowProjectionHeaders.id })
      .from(cashFlowProjectionHeaders)
      .where(
        and(
          eq(cashFlowProjectionHeaders.corporateId, input.corporateId),
          eq(cashFlowProjectionHeaders.fiscalYear, input.fiscalYear)
        )
      )
      .limit(1);

    if (existing) {
      throw AppError.badRequest(ErrorCode.DUPLICATE_ENTRY, 'Projection for this year already exists');
    }

    return await db.transaction(async (tx) => {
      // 1. Insert Header
      const [header] = await tx
        .insert(cashFlowProjectionHeaders)
        .values({
          corporateId: input.corporateId,
          fiscalYear: input.fiscalYear,
          initialBalance: String(input.initialBalance),
          notes: input.notes,
          createdBy: userId,
        })
        .returning();

      // 2. Insert Details
      if (input.details && input.details.length > 0) {
        await tx.insert(cashFlowProjectionDetails).values(
          input.details.map((d) => ({
            headerId: header.id,
            month: d.month,
            type: d.type,
            group: d.group,
            category: d.category,
            amount: String(d.amount),
            notes: d.notes,
          }))
        );
      }

      await createFRSAuditLog({
        userId,
        action: 'create',
        entityType: 'cash_flow_projection',
        entityId: header.id,
        newValues: { corporateId: input.corporateId, fiscalYear: input.fiscalYear, initialBalance: input.initialBalance },
      });

      return header;
    });
  }

  /**
   * Update projection header and details
   */
  static async updateProjection(id: string, input: UpdateCashFlowProjectionInput, userId: string) {
    const [existing] = await db
      .select()
      .from(cashFlowProjectionHeaders)
      .where(eq(cashFlowProjectionHeaders.id, id))
      .limit(1);

    if (!existing) {
      throw AppError.notFound(ErrorCode.NOT_FOUND, 'Cash flow projection not found');
    }

    return await db.transaction(async (tx) => {
      // 1. Update Header if needed
      if (input.initialBalance !== undefined || input.notes !== undefined) {
        await tx
          .update(cashFlowProjectionHeaders)
          .set({
            initialBalance: input.initialBalance !== undefined ? String(input.initialBalance) : undefined,
            notes: input.notes !== undefined ? input.notes : undefined,
            updatedBy: userId,
            updatedAt: new Date(),
          })
          .where(eq(cashFlowProjectionHeaders.id, id));
      }

      // 2. Update Details if provided (Replace Strategy)
      if (input.details) {
        // Delete old details
        await tx.delete(cashFlowProjectionDetails).where(eq(cashFlowProjectionDetails.headerId, id));

        // Insert new details
        if (input.details.length > 0) {
          await tx.insert(cashFlowProjectionDetails).values(
            input.details.map((d) => ({
              headerId: id,
              month: d.month,
              type: d.type,
              group: d.group,
              category: d.category,
              amount: String(d.amount),
              notes: d.notes,
            }))
          );
        }
      }

      await createFRSAuditLog({
        userId,
        action: 'update',
        entityType: 'cash_flow_projection',
        entityId: id,
        oldValues: { initialBalance: existing.initialBalance, notes: existing.notes },
        newValues: { initialBalance: input.initialBalance, notes: input.notes },
      });

      return { id, success: true };
    });
  }

  /**
   * Delete projection
   */
  static async deleteProjection(id: string, userId?: string) {
    // Details will be deleted automatically due to CASCADE
    const result = await db.delete(cashFlowProjectionHeaders).where(eq(cashFlowProjectionHeaders.id, id));

    if (result.rowCount > 0) {
      await createFRSAuditLog({
        userId: userId ?? '',
        action: 'delete',
        entityType: 'cash_flow_projection',
        entityId: id,
      });
    }

    return { success: result.rowCount > 0 };
  }
}

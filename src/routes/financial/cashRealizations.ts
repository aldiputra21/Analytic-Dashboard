// src/routes/financial/cashRealizations.ts
// Cash Realizations CRUD Routes + Attachment Upload
// Requirements: 1.1–1.8, 2.1–2.9

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { eq, ilike, and, count, gte, lte } from 'drizzle-orm';
import { db } from '../../db/connection';
import { cashRealizations } from '../../db/schema/cfd';
import { attachments, departments } from '../../db/schema/public';
import { requirePermission, injectAccessContext } from '../../middleware/rbac';
import { asyncHandler } from '../../utils/asyncHandler';
import { AppError, ErrorCode } from '../../utils/errors.js';
import {
  getAttachmentConfig,
  createMulterUpload,
  saveAttachment,
} from '../../services/financial/attachmentService';

// ---------------------------------------------------------------------------
// Zod Schemas
// ---------------------------------------------------------------------------

const createRealizationSchema = z
  .object({
    entityType: z.enum(['department', 'project']),
    departmentId: z.string().uuid(),
    projectId: z.string().uuid().optional().nullable(),
    transactionDate: z.string().date(),
    category: z.enum(['cash-in', 'cash-out']),
    amount: z.number().positive(),
    notes: z.string().optional(),
  })
  .refine((data) => data.entityType !== 'project' || !!data.projectId, {
    message: 'project_id is required when entity_type is project',
    path: ['projectId'],
  });

const updateRealizationSchema = z
  .object({
    entityType: z.enum(['department', 'project']).optional(),
    departmentId: z.string().uuid().optional(),
    projectId: z.string().uuid().optional().nullable(),
    transactionDate: z.string().date().optional(),
    category: z.enum(['cash-in', 'cash-out']).optional(),
    amount: z.number().positive().optional(),
    notes: z.string().optional().nullable(),
  })
  .refine(
    (data) => {
      // Only enforce if entityType is explicitly set to 'project'
      if (data.entityType === 'project') return !!data.projectId;
      return true;
    },
    {
      message: 'project_id is required when entity_type is project',
      path: ['projectId'],
    },
  );

// ---------------------------------------------------------------------------
// ENTITY_TYPE constant
// ---------------------------------------------------------------------------

const ENTITY_TYPE = 'cash_realization';

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------

export function createCashRealizationsRouter(): Router {
  const router = Router();

  /**
   * GET /api/cash-realizations
   * List realizations with filters: entityType, category, dateFrom, dateTo, search, pagination.
   * Also includes attachment count per record.
   */
  router.get('/', requirePermission('cfd.realizations.read'), injectAccessContext, asyncHandler(async (req: Request, res: Response) => {
    const search = req.query.search as string | undefined;
    const entityType = req.query.entityType as string | undefined;
    const category = req.query.category as string | undefined;
    const dateFrom = req.query.dateFrom as string | undefined;
    const dateTo = req.query.dateTo as string | undefined;
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize as string) || 20));
    const offset = (page - 1) * pageSize;

    const conditions = [];

    if (search) {
      conditions.push(ilike(cashRealizations.notes, `%${search}%`));
    }

    if (entityType === 'department' || entityType === 'project') {
      conditions.push(eq(cashRealizations.entityType, entityType));
    }

    if (category === 'cash-in' || category === 'cash-out') {
      conditions.push(eq(cashRealizations.category, category));
    }

    if (dateFrom) {
      conditions.push(gte(cashRealizations.transactionDate, dateFrom));
    }

    if (dateTo) {
      conditions.push(lte(cashRealizations.transactionDate, dateTo));
    }

    const access = req.accessContext!;
    if (access.scope !== 'system') {
      const { inArray } = await import('drizzle-orm');
      if (access.scope === 'department') {
        if (access.departmentIds.length === 0) return res.json({ records: [], totalCount: 0 });
        conditions.push(inArray(cashRealizations.departmentId, access.departmentIds));
      } else if (access.scope === 'corporate') {
        const { departments } = await import('../../db/schema/public.js');
        if (access.corporateIds.length === 0) return res.json({ records: [], totalCount: 0 });
        const deptSubquery = db.select({ id: departments.id })
          .from(departments)
          .where(inArray(departments.corporateId, access.corporateIds));
        conditions.push(inArray(cashRealizations.departmentId, deptSubquery));
      }
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [records, [{ totalCount }], attachmentCounts] = await Promise.all([
      db
        .select()
        .from(cashRealizations)
        .where(where)
        .orderBy(cashRealizations.transactionDate)
        .limit(pageSize)
        .offset(offset),
      db.select({ totalCount: count() }).from(cashRealizations).where(where),
      db
        .select({
          entityId: attachments.entityId,
          attachmentCount: count(),
        })
        .from(attachments)
        .where(eq(attachments.entityType, ENTITY_TYPE))
        .groupBy(attachments.entityId),
    ]);

    // Build a lookup map for attachment counts
    const countMap = new Map<string, number>();
    for (const row of attachmentCounts) {
      countMap.set(row.entityId, Number(row.attachmentCount));
    }

    const enriched = records.map((r) => ({
      ...r,
      attachmentCount: countMap.get(r.id) ?? 0,
    }));

    res.json({ records: enriched, totalCount: Number(totalCount) });
  }));

  /**
   * POST /api/cash-realizations
   * Create a new cash realization.
   */
  router.post('/', requirePermission('cfd.realizations.write'), injectAccessContext, asyncHandler(async (req: Request, res: Response) => {
    const data = createRealizationSchema.parse(req.body);
    const { entityType, departmentId, projectId, transactionDate, category, amount, notes } =
      data;

    const access = req.accessContext!;
    if (access.scope !== 'system') {
      if (access.scope === 'department' && !access.departmentIds.includes(departmentId)) {
        throw AppError.forbidden(ErrorCode.DEPARTMENT_ACCESS_DENIED, 'Access denied to this department');
      }
      if (access.scope === 'corporate') {
        const [dept] = await db.select({ corporateId: departments.corporateId })
          .from(departments).where(eq(departments.id, departmentId)).limit(1);
        if (!dept || !access.corporateIds.includes(dept.corporateId)) {
          throw AppError.forbidden(ErrorCode.CORPORATE_ACCESS_DENIED, 'Access denied to this corporate');
        }
      }
    }

    const [record] = await db
      .insert(cashRealizations)
      .values({
        entityType,
        departmentId,
        projectId: projectId ?? null,
        transactionDate,
        category,
        amount: String(amount),
        notes: notes ?? null,
        createdBy: req.user!.userId,
      })
      .returning();

    return res.status(201).json(record);
  }));

  /**
   * GET /api/cash-realizations/:id
   * Get a single realization by ID, including its attachments.
   */
  router.get('/:id', requirePermission('cfd.realizations.read'), injectAccessContext, asyncHandler(async (req: Request, res: Response) => {
    const [record] = await db
      .select()
      .from(cashRealizations)
      .where(eq(cashRealizations.id, req.params.id))
      .limit(1);

    if (!record) {
      throw AppError.notFound(ErrorCode.NOT_FOUND, 'Cash realization not found');
    }

    const access = req.accessContext!;
    if (access.scope !== 'system') {
      if (access.scope === 'department' && !access.departmentIds.includes(record.departmentId)) {
        throw AppError.forbidden(ErrorCode.DEPARTMENT_ACCESS_DENIED, 'Access denied to this department');
      }
      if (access.scope === 'corporate') {
        const { departments } = await import('../../db/schema/public.js');
        const [dept] = await db.select({ corporateId: departments.corporateId })
          .from(departments).where(eq(departments.id, record.departmentId)).limit(1);
        if (!dept || !access.corporateIds.includes(dept.corporateId)) {
          throw AppError.forbidden(ErrorCode.CORPORATE_ACCESS_DENIED, 'Access denied to this corporate');
        }
      }
    }

    const recordAttachments = await db
      .select()
      .from(attachments)
      .where(
        and(
          eq(attachments.entityType, ENTITY_TYPE),
          eq(attachments.entityId, record.id),
        ),
      )
      .orderBy(attachments.createdAt);

    return res.json({ ...record, attachments: recordAttachments });
  }));

  /**
   * PUT /api/cash-realizations/:id
   * Update a cash realization.
   */
  router.put('/:id', requirePermission('cfd.realizations.write'), injectAccessContext, asyncHandler(async (req: Request, res: Response) => {
    const data = updateRealizationSchema.parse(req.body);

    const [existing] = await db
      .select()
      .from(cashRealizations)
      .where(eq(cashRealizations.id, req.params.id))
      .limit(1);

    if (!existing) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Cash realization not found' },
      });
    }

    // Context Validation
    const access = req.accessContext!;
    if (access.scope !== 'system') {
      if (access.scope === 'department' && !access.departmentIds.includes(existing.departmentId)) {
        return res.status(403).json({ error: 'Access denied to this department' });
      }
      if (access.scope === 'corporate') {
        const { departments } = await import('../../db/schema/public.js');
        const [dept] = await db.select({ corporateId: departments.corporateId })
          .from(departments).where(eq(departments.id, existing.departmentId)).limit(1);
        if (!dept || !access.corporateIds.includes(dept.corporateId)) {
          return res.status(403).json({ error: 'Access denied to this corporate' });
        }
      }
    }

    const updateData: Record<string, unknown> = {
      updatedBy: req.user!.userId,
      updatedAt: new Date(),
    };

    if (data.entityType !== undefined) updateData.entityType = data.entityType;
    if (data.departmentId !== undefined) updateData.departmentId = data.departmentId;
    if ('projectId' in data) updateData.projectId = data.projectId ?? null;
    if (data.transactionDate !== undefined) updateData.transactionDate = data.transactionDate;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.amount !== undefined) updateData.amount = String(data.amount);
    if ('notes' in data) updateData.notes = data.notes ?? null;

    const [updated] = await db
      .update(cashRealizations)
      .set(updateData)
      .where(eq(cashRealizations.id, req.params.id))
      .returning();

    return res.json(updated);
  }));

  /**
   * DELETE /api/cash-realizations/:id
   * Delete a cash realization.
   */
  router.delete('/:id', requirePermission('cfd.realizations.delete'), injectAccessContext, asyncHandler(async (req: Request, res: Response) => {
    const [existing] = await db
      .select()
      .from(cashRealizations)
      .where(eq(cashRealizations.id, req.params.id))
      .limit(1);

    if (!existing) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Cash realization not found' },
      });
    }

    // Context Validation
    const access = req.accessContext!;
    if (access.scope !== 'system') {
      if (access.scope === 'department' && !access.departmentIds.includes(existing.departmentId)) {
        return res.status(403).json({ error: 'Access denied to this department' });
      }
      if (access.scope === 'corporate') {
        const { departments } = await import('../../db/schema/public.js');
        const [dept] = await db.select({ corporateId: departments.corporateId })
          .from(departments).where(eq(departments.id, existing.departmentId)).limit(1);
        if (!dept || !access.corporateIds.includes(dept.corporateId)) {
          return res.status(403).json({ error: 'Access denied to this corporate' });
        }
      }
    }

    await db.delete(cashRealizations).where(eq(cashRealizations.id, req.params.id));

    return res.json({ success: true });
  }));

  /**
   * POST /api/cash-realizations/:id/attachments
   * Upload one or more files as attachments for a realization.
   * Uses multer with config from DB (allowed extensions + max size).
   */
  router.post(
    '/:id/attachments',
    requirePermission('cfd.realizations.write'),
    injectAccessContext,
    asyncHandler(async (req: Request, res: Response) => {
      // Verify the realization exists first
      const [existing] = await db
        .select()
        .from(cashRealizations)
        .where(eq(cashRealizations.id, req.params.id))
        .limit(1);

      if (!existing) {
        throw AppError.notFound(ErrorCode.NOT_FOUND, 'Cash realization not found');
      }

      // Load config and create multer instance dynamically
      const config = await getAttachmentConfig();
      const upload = await createMulterUpload(config);

      // Process multipart upload
      upload.array('files')(req, res, async (err) => {
        if (err) {
          const code =
            (err as Error & { code?: string }).code === 'LIMIT_FILE_SIZE'
              ? ErrorCode.INVALID_INPUT
              : ErrorCode.INTERNAL_SERVER_ERROR;

          return res.status(422).json({
            error: { code, message: err.message },
          });
        }

        const files = req.files as Express.Multer.File[] | undefined;
        if (!files || files.length === 0) {
          throw AppError.badRequest(ErrorCode.INVALID_INPUT, 'No files were uploaded');
        }

        const saved = [];
        const errors = [];

        for (const file of files) {
          try {
            const record = await saveAttachment(
              db,
              ENTITY_TYPE,
              req.params.id,
              {
                originalname: file.originalname,
                mimetype: file.mimetype,
                size: file.size,
                path: file.path,
              },
              req.user!.userId,
            );
            saved.push(record);
          } catch (saveErr) {
            errors.push({
              file: file.originalname,
              message: (saveErr as Error).message,
            });
          }
        }

        if (saved.length === 0) {
          throw AppError.internal('All file uploads failed', { errors });
        }

        return res.status(201).json({ saved, errors: errors.length > 0 ? errors : undefined });
      });
    })
  );

  return router;
}

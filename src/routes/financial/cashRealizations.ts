// src/routes/financial/cashRealizations.ts
// Cash Realizations CRUD Routes + Attachment Upload
// Requirements: 1.1–1.8, 2.1–2.9

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { eq, ilike, and, count, gte, lte } from 'drizzle-orm';
import { db } from '../../db/connection';
import { cashRealizations } from '../../db/schema/cfd';
import { attachments } from '../../db/schema/public';
import { requirePermission } from '../../middleware/rbac';
import { asyncHandler } from '../../utils/asyncHandler';
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
    projectId: z.string().uuid().optional(),
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
  router.get('/', requirePermission('cfd.realizations.read'), asyncHandler(async (req: Request, res: Response) => {
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
  router.post('/', requirePermission('cfd.realizations.write'), asyncHandler(async (req: Request, res: Response) => {
    const parsed = createRealizationSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: parsed.error.issues.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        },
      });
    }

    const { entityType, departmentId, projectId, transactionDate, category, amount, notes } =
      parsed.data;

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
  router.get('/:id', requirePermission('cfd.realizations.read'), asyncHandler(async (req: Request, res: Response) => {
    const [record] = await db
      .select()
      .from(cashRealizations)
      .where(eq(cashRealizations.id, req.params.id))
      .limit(1);

    if (!record) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Cash realization not found' },
      });
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
  router.put('/:id', requirePermission('cfd.realizations.write'), asyncHandler(async (req: Request, res: Response) => {
    const parsed = updateRealizationSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: parsed.error.issues.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        },
      });
    }

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

    const updateData: Record<string, unknown> = {
      updatedBy: req.user!.userId,
      updatedAt: new Date(),
    };

    if (parsed.data.entityType !== undefined) updateData.entityType = parsed.data.entityType;
    if (parsed.data.departmentId !== undefined) updateData.departmentId = parsed.data.departmentId;
    if ('projectId' in parsed.data) updateData.projectId = parsed.data.projectId ?? null;
    if (parsed.data.transactionDate !== undefined) updateData.transactionDate = parsed.data.transactionDate;
    if (parsed.data.category !== undefined) updateData.category = parsed.data.category;
    if (parsed.data.amount !== undefined) updateData.amount = String(parsed.data.amount);
    if ('notes' in parsed.data) updateData.notes = parsed.data.notes ?? null;

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
  router.delete('/:id', requirePermission('cfd.realizations.delete'), asyncHandler(async (req: Request, res: Response) => {
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
    asyncHandler(async (req: Request, res: Response) => {
      // Verify the realization exists first
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

      // Load config and create multer instance dynamically
      const config = await getAttachmentConfig(db);
      const upload = createMulterUpload(config);

      // Process multipart upload
      upload.array('files')(req, res, async (err) => {
        if (err) {
          const code =
            (err as Error & { code?: string }).code === 'LIMIT_FILE_SIZE'
              ? 'FILE_TOO_LARGE'
              : (err as Error & { code?: string }).code ?? 'UPLOAD_ERROR';

          return res.status(422).json({
            error: { code, message: err.message },
          });
        }

        const files = req.files as Express.Multer.File[] | undefined;
        if (!files || files.length === 0) {
          return res.status(400).json({
            error: { code: 'NO_FILES', message: 'No files were uploaded' },
          });
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
          return res.status(422).json({
            error: { code: 'UPLOAD_FAILED', message: 'All file uploads failed', details: errors },
          });
        }

        return res.status(201).json({ saved, errors: errors.length > 0 ? errors : undefined });
      });
    })
  );

  return router;
}

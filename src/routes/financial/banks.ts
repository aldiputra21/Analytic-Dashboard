// src/routes/financial/banks.ts
// Master Banks CRUD Routes
// Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { eq, ilike, or, and, count } from 'drizzle-orm';
import { db } from '../../db/connection';
import { banks } from '../../db/schema/public';
import { requirePermission } from '../../middleware/rbac';
import { asyncHandler } from '../../utils/asyncHandler';

// ---------------------------------------------------------------------------
// Zod Schemas
// ---------------------------------------------------------------------------

const createBankSchema = z.object({
  code: z.string().min(1).max(20).transform((v) => v.toUpperCase()),
  name: z.string().min(1).max(100),
  swiftCode: z.string().max(20).optional().nullable(),
  status: z.enum(['active', 'inactive']).default('active'),
});

const updateBankSchema = z.object({
  code: z.string().min(1).max(20).transform((v) => v.toUpperCase()).optional(),
  name: z.string().min(1).max(100).optional(),
  swiftCode: z.string().max(20).optional().nullable(),
  status: z.enum(['active', 'inactive']).optional(),
});

// ---------------------------------------------------------------------------
// Helper: detect unique constraint violation
// ---------------------------------------------------------------------------

function isUniqueViolation(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    (err as { code: string }).code === '23505'
  );
}

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------

export function createBanksRouter(): Router {
  const router = Router();

  /**
   * GET /api/banks
   * List banks with optional search, status filter, and pagination.
   */
  router.get('/', requirePermission('public.banks.read'), asyncHandler(async (req: Request, res: Response) => {
    const search = req.query.search as string | undefined;
    const status = req.query.status as string | undefined;
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize as string) || 20));
    const offset = (page - 1) * pageSize;

    // Build where conditions
    const conditions = [];

    if (search) {
      conditions.push(
        or(
          ilike(banks.name, `%${search}%`),
          ilike(banks.code, `%${search}%`),
        ),
      );
    }

    if (status === 'active' || status === 'inactive') {
      conditions.push(eq(banks.status, status));
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [records, [{ totalCount }]] = await Promise.all([
      db
        .select()
        .from(banks)
        .where(where)
        .orderBy(banks.name)
        .limit(pageSize)
        .offset(offset),
      db
        .select({ totalCount: count() })
        .from(banks)
        .where(where),
    ]);

    res.json({ records, totalCount: Number(totalCount) });
  }));

  /**
   * POST /api/banks
   * Create a new bank.
   */
  router.post('/', requirePermission('public.banks.write'), asyncHandler(async (req: Request, res: Response) => {
    const parsed = createBankSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: parsed.error.issues.map((e) => ({ field: e.path.join('.'), message: e.message })),
        },
      });
    }

    const { code, name, swiftCode, status } = parsed.data;

    try {
      const [bank] = await db
        .insert(banks)
        .values({
          code,
          name,
          swiftCode: swiftCode ?? null,
          status,
          createdBy: req.user!.userId,
        })
        .returning();

      return res.status(201).json(bank);
    } catch (err) {
      if (isUniqueViolation(err)) {
        return res.status(409).json({
          error: {
            code: 'CONFLICT',
            message: `A bank with code '${code}' already exists`,
          },
        });
      }
      throw err;
    }
  }));

  /**
   * GET /api/banks/:id
   * Get a single bank by ID.
   */
  router.get('/:id', requirePermission('public.banks.read'), asyncHandler(async (req: Request, res: Response) => {
    const [bank] = await db
      .select()
      .from(banks)
      .where(eq(banks.id, req.params.id))
      .limit(1);

    if (!bank) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Bank not found' },
      });
    }

    return res.json(bank);
  }));

  /**
   * PUT /api/banks/:id
   * Update a bank.
   */
  router.put('/:id', requirePermission('public.banks.write'), asyncHandler(async (req: Request, res: Response) => {
    const parsed = updateBankSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: parsed.error.issues.map((e) => ({ field: e.path.join('.'), message: e.message })),
        },
      });
    }

    const [existing] = await db
      .select()
      .from(banks)
      .where(eq(banks.id, req.params.id))
      .limit(1);

    if (!existing) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Bank not found' },
      });
    }

    try {
      const [updated] = await db
        .update(banks)
        .set({
          ...parsed.data,
          updatedBy: req.user!.userId,
          updatedAt: new Date(),
        })
        .where(eq(banks.id, req.params.id))
        .returning();

      return res.json(updated);
    } catch (err) {
      if (isUniqueViolation(err)) {
        return res.status(409).json({
          error: {
            code: 'CONFLICT',
            message: `A bank with code '${parsed.data.code}' already exists`,
          },
        });
      }
      throw err;
    }
  }));

  /**
   * DELETE /api/banks/:id
   * Delete a bank.
   */
  router.delete('/:id', requirePermission('public.banks.delete'), asyncHandler(async (req: Request, res: Response) => {
    const [existing] = await db
      .select()
      .from(banks)
      .where(eq(banks.id, req.params.id))
      .limit(1);

    if (!existing) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Bank not found' },
      });
    }

    await db.delete(banks).where(eq(banks.id, req.params.id));

    return res.json({ success: true });
  }));

  return router;
}

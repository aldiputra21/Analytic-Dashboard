// src/routes/financial/currencies.ts
// Master Currencies CRUD Routes
// Requirements: 8.1, 8.2, 8.3, 8.4, 8.5

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { eq, ilike, or, and, count } from 'drizzle-orm';
import { db } from '../../db/connection';
import { currencies } from '../../db/schema/public';
import { requirePermission } from '../../middleware/rbac';
import { asyncHandler } from '../../utils/asyncHandler';

// ---------------------------------------------------------------------------
// Zod Schemas
// ---------------------------------------------------------------------------

const createCurrencySchema = z.object({
  code: z.string().min(1).max(10).transform((v) => v.toUpperCase()),
  label: z.string().min(1).max(50),
  status: z.enum(['active', 'inactive']).default('active'),
});

const updateCurrencySchema = z.object({
  code: z.string().min(1).max(10).transform((v) => v.toUpperCase()).optional(),
  label: z.string().min(1).max(50).optional(),
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

export function createCurrenciesRouter(): Router {
  const router = Router();

  /**
   * GET /api/currencies
   * List currencies with optional search, status filter, and pagination.
   */
  router.get('/', requirePermission('public.currencies.read'), asyncHandler(async (req: Request, res: Response) => {
    const search = req.query.search as string | undefined;
    const status = req.query.status as string | undefined;
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize as string) || 20));
    const offset = (page - 1) * pageSize;

    const conditions = [];

    if (search) {
      conditions.push(
        or(
          ilike(currencies.label, `%${search}%`),
          ilike(currencies.code, `%${search}%`),
        ),
      );
    }

    if (status === 'active' || status === 'inactive') {
      conditions.push(eq(currencies.status, status));
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [records, [{ totalCount }]] = await Promise.all([
      db
        .select()
        .from(currencies)
        .where(where)
        .orderBy(currencies.code)
        .limit(pageSize)
        .offset(offset),
      db
        .select({ totalCount: count() })
        .from(currencies)
        .where(where),
    ]);

    res.json({ records, totalCount: Number(totalCount) });
  }));

  /**
   * POST /api/currencies
   * Create a new currency.
   */
  router.post('/', requirePermission('public.currencies.write'), asyncHandler(async (req: Request, res: Response) => {
    const parsed = createCurrencySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: parsed.error.issues.map((e) => ({ field: e.path.join('.'), message: e.message })),
        },
      });
    }

    const { code, label, status } = parsed.data;

    try {
      const [currency] = await db
        .insert(currencies)
        .values({
          code,
          label,
          status,
          createdBy: req.user!.userId,
        })
        .returning();

      return res.status(201).json(currency);
    } catch (err) {
      if (isUniqueViolation(err)) {
        return res.status(409).json({
          error: {
            code: 'CONFLICT',
            message: `A currency with code '${code}' already exists`,
          },
        });
      }
      throw err;
    }
  }));

  /**
   * GET /api/currencies/dropdown-items
   * Fetch active currencies for dropdown selection.
   */
  router.get('/dropdown-items', requirePermission('public.currencies.read'), asyncHandler(async (req: Request, res: Response) => {
    const records = await db
      .select()
      .from(currencies)
      .where(eq(currencies.status, 'active'))
      .orderBy(currencies.code);

    res.json(records);
  }));

  /**
   * GET /api/currencies/:id
   * Get a single currency by ID.
   */
  router.get('/:id', requirePermission('public.currencies.read'), asyncHandler(async (req: Request, res: Response) => {
    const [currency] = await db
      .select()
      .from(currencies)
      .where(eq(currencies.id, req.params.id))
      .limit(1);

    if (!currency) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Currency not found' },
      });
    }

    return res.json(currency);
  }));

  /**
   * PUT /api/currencies/:id
   * Update a currency.
   */
  router.put('/:id', requirePermission('public.currencies.write'), asyncHandler(async (req: Request, res: Response) => {
    const parsed = updateCurrencySchema.safeParse(req.body);
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
      .from(currencies)
      .where(eq(currencies.id, req.params.id))
      .limit(1);

    if (!existing) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Currency not found' },
      });
    }

    try {
      const [updated] = await db
        .update(currencies)
        .set({
          ...parsed.data,
          updatedBy: req.user!.userId,
          updatedAt: new Date(),
        })
        .where(eq(currencies.id, req.params.id))
        .returning();

      return res.json(updated);
    } catch (err) {
      if (isUniqueViolation(err)) {
        return res.status(409).json({
          error: {
            code: 'CONFLICT',
            message: `A currency with code '${parsed.data.code}' already exists`,
          },
        });
      }
      throw err;
    }
  }));

  /**
   * DELETE /api/currencies/:id
   * Delete a currency.
   */
  router.delete('/:id', requirePermission('public.currencies.delete'), asyncHandler(async (req: Request, res: Response) => {
    const [existing] = await db
      .select()
      .from(currencies)
      .where(eq(currencies.id, req.params.id))
      .limit(1);

    if (!existing) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Currency not found' },
      });
    }

    await db.delete(currencies).where(eq(currencies.id, req.params.id));

    return res.json({ success: true });
  }));

  return router;
}

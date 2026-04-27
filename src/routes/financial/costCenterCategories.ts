// src/routes/financial/costCenterCategories.ts
// Master Cost Center Categories CRUD Routes
// Requirements: 9.1, 9.2, 9.3, 9.4, 9.5

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { eq, ilike, or, and, count } from 'drizzle-orm';
import { db } from '../../db/connection';
import { costCenterCategories } from '../../db/schema/public';
import { requirePermission, injectAccessContext, requireScope } from '../../middleware/rbac';
import { asyncHandler } from '../../utils/asyncHandler';

// ---------------------------------------------------------------------------
// Zod Schemas
// ---------------------------------------------------------------------------

const createCategorySchema = z.object({
  code: z.string().min(1).max(50).transform((v) => v.toUpperCase()),
  labelId: z.string().min(1).max(100),
  labelEn: z.string().min(1).max(100),
  status: z.enum(['active', 'inactive']).default('active'),
});

const updateCategorySchema = z.object({
  code: z.string().min(1).max(50).transform((v) => v.toUpperCase()).optional(),
  labelId: z.string().min(1).max(100).optional(),
  labelEn: z.string().min(1).max(100).optional(),
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

export function createCostCenterCategoriesRouter(): Router {
  const router = Router();

  /**
   * GET /api/cost-center-categories
   * List cost center categories with optional search, status filter, and pagination.
   */
  router.get('/', requirePermission('public.cost_center_categories.read'), injectAccessContext, asyncHandler(async (req: Request, res: Response) => {
    const search = req.query.search as string | undefined;
    const status = req.query.status as string | undefined;
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize as string) || 20));
    const offset = (page - 1) * pageSize;

    const conditions = [];

    if (search) {
      conditions.push(
        or(
          ilike(costCenterCategories.labelId, `%${search}%`),
          ilike(costCenterCategories.labelEn, `%${search}%`),
          ilike(costCenterCategories.code, `%${search}%`),
        ),
      );
    }

    if (status === 'active' || status === 'inactive') {
      conditions.push(eq(costCenterCategories.status, status));
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [records, [{ totalCount }]] = await Promise.all([
      db
        .select()
        .from(costCenterCategories)
        .where(where)
        .orderBy(costCenterCategories.labelId)
        .limit(pageSize)
        .offset(offset),
      db
        .select({ totalCount: count() })
        .from(costCenterCategories)
        .where(where),
    ]);

    res.json({ records, totalCount: Number(totalCount) });
  }));

  /**
   * POST /api/cost-center-categories
   * Create a new cost center category.
   */
  router.post('/', 
    requirePermission('public.cost_center_categories.write'), 
    injectAccessContext, 
    requireScope('system'), 
    asyncHandler(async (req: Request, res: Response) => {
    const parsed = createCategorySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: parsed.error.issues.map((e) => ({ field: e.path.join('.'), message: e.message })),
        },
      });
    }

    const { code, labelId, labelEn, status } = parsed.data;

    try {
      const [category] = await db
        .insert(costCenterCategories)
        .values({
          code,
          labelId,
          labelEn,
          status,
          createdBy: req.user!.userId,
        })
        .returning();

      return res.status(201).json(category);
    } catch (err) {
      if (isUniqueViolation(err)) {
        return res.status(409).json({
          error: {
            code: 'CONFLICT',
            message: `A cost center category with code '${code}' already exists`,
          },
        });
      }
      throw err;
    }
  }));

  /**
   * GET /api/cost-center-categories/dropdown-items
   * Fetch active categories for dropdown selection.
   */
  router.get('/dropdown-items', requirePermission('public.cost_center_categories.read'), injectAccessContext, asyncHandler(async (req: Request, res: Response) => {
    const records = await db
      .select()
      .from(costCenterCategories)
      .where(eq(costCenterCategories.status, 'active'))
      .orderBy(costCenterCategories.labelId);

    res.json(records);
  }));

  /**
   * GET /api/cost-center-categories/:id
   * Get a single cost center category by ID.
   */
  router.get('/:id', requirePermission('public.cost_center_categories.read'), injectAccessContext, asyncHandler(async (req: Request, res: Response) => {
    const [category] = await db
      .select()
      .from(costCenterCategories)
      .where(eq(costCenterCategories.id, req.params.id))
      .limit(1);

    if (!category) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Cost center category not found' },
      });
    }

    return res.json(category);
  }));

  /**
   * PUT /api/cost-center-categories/:id
   * Update a cost center category.
   */
  router.put('/:id', 
    requirePermission('public.cost_center_categories.write'), 
    injectAccessContext, 
    requireScope('system'), 
    asyncHandler(async (req: Request, res: Response) => {
    const parsed = updateCategorySchema.safeParse(req.body);
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
      .from(costCenterCategories)
      .where(eq(costCenterCategories.id, req.params.id))
      .limit(1);

    if (!existing) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Cost center category not found' },
      });
    }

    try {
      const [updated] = await db
        .update(costCenterCategories)
        .set({
          ...parsed.data,
          updatedBy: req.user!.userId,
          updatedAt: new Date(),
        })
        .where(eq(costCenterCategories.id, req.params.id))
        .returning();

      return res.json(updated);
    } catch (err) {
      if (isUniqueViolation(err)) {
        return res.status(409).json({
          error: {
            code: 'CONFLICT',
            message: `A cost center category with code '${parsed.data.code}' already exists`,
          },
        });
      }
      throw err;
    }
  }));

  /**
   * DELETE /api/cost-center-categories/:id
   * Delete a cost center category.
   */
  router.delete('/:id', 
    requirePermission('public.cost_center_categories.delete'), 
    injectAccessContext, 
    requireScope('system'), 
    asyncHandler(async (req: Request, res: Response) => {
    const [existing] = await db
      .select()
      .from(costCenterCategories)
      .where(eq(costCenterCategories.id, req.params.id))
      .limit(1);

    if (!existing) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Cost center category not found' },
      });
    }

    await db.delete(costCenterCategories).where(eq(costCenterCategories.id, req.params.id));

    return res.json({ success: true });
  }));

  return router;
}

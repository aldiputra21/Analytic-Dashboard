// src/routes/financial/costCenterCategories.ts
// Master Cost Center Categories CRUD Routes
// Requirements: 9.1, 9.2, 9.3, 9.4, 9.5

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { eq, ilike, or, and, count } from 'drizzle-orm';
import { db } from '../../db/connection';
import { costCenterCategories } from '../../db/schema/public';
import { costCenters } from '../../db/schema/cfd';
import { requirePermission, injectAccessContext, requireScope } from '../../middleware/rbac';
import { asyncHandler } from '../../utils/asyncHandler';
import { AppError, ErrorCode } from '../../utils/errors';

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
// Router
// ---------------------------------------------------------------------------

export function createCostCenterCategoriesRouter(): Router {
  const router = Router();

  /**
   * GET /api/cost-center-categories
   * List cost center categories with optional search, status filter, and pagination.
   */
  router.get('/', 
    requirePermission('public.cost_center_categories.read'), 
    injectAccessContext, 
    asyncHandler(async (req: Request, res: Response) => {
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
    const data = createCategorySchema.parse(req.body);
    const { code, labelId, labelEn, status } = data;

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
  }));

  /**
   * GET /api/cost-center-categories/dropdown-items
   * Fetch active categories for dropdown selection.
   */
  router.get('/dropdown-items', 
    requirePermission('public.cost_center_categories.read', 'cfd.cost_centers.read', 'cfd.cost_centers.write'), 
    injectAccessContext, 
    asyncHandler(async (req: Request, res: Response) => {
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
  router.get('/:id', 
    requirePermission('public.cost_center_categories.read'), 
    injectAccessContext, 
    asyncHandler(async (req: Request, res: Response) => {
    const [category] = await db
      .select()
      .from(costCenterCategories)
      .where(eq(costCenterCategories.id, req.params.id))
      .limit(1);

    if (!category) {
      throw AppError.notFound(ErrorCode.COST_CENTER_CATEGORY_NOT_FOUND, 'Cost center category not found');
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
    const data = updateCategorySchema.parse(req.body);

    const [existing] = await db
      .select()
      .from(costCenterCategories)
      .where(eq(costCenterCategories.id, req.params.id))
      .limit(1);

    if (!existing) {
      throw AppError.notFound(ErrorCode.COST_CENTER_CATEGORY_NOT_FOUND, 'Cost center category not found');
    }

    const [updated] = await db
      .update(costCenterCategories)
      .set({
        ...data,
        updatedBy: req.user!.userId,
        updatedAt: new Date(),
      })
      .where(eq(costCenterCategories.id, req.params.id))
      .returning();

    return res.json(updated);
  }));

  /**
   * DELETE /api/cost-center-categories/:id
   * Delete a cost center category. Blocked if used by any cost center.
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
      throw AppError.notFound(ErrorCode.COST_CENTER_CATEGORY_NOT_FOUND, 'Cost center category not found');
    }

    // Block: cfd.cost_centers.category references this category code
    const [cc] = await db.select({ id: costCenters.id })
      .from(costCenters)
      .where(eq(costCenters.category, existing.code))
      .limit(1);
    if (cc) {
      throw AppError.unprocessable(ErrorCode.DELETE_PROTECTED, 'Kategori cost center tidak dapat dihapus karena masih digunakan oleh cost center');
    }

    await db.delete(costCenterCategories).where(eq(costCenterCategories.id, req.params.id));

    return res.json({ success: true });
  }));

  return router;
}

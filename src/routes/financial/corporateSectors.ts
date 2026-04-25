// src/routes/financial/corporateSectors.ts
// Master Corporate Sectors CRUD Routes
// Requirements: 7.1, 7.2, 7.3, 7.4, 7.5

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { eq, ilike, or, and, count } from 'drizzle-orm';
import { db } from '../../db/connection';
import { corporateSectors } from '../../db/schema/public';
import { requirePermission } from '../../middleware/rbac';

// ---------------------------------------------------------------------------
// Zod Schemas
// ---------------------------------------------------------------------------

const createSectorSchema = z.object({
  code: z.string().min(1).max(50).transform((v) => v.toUpperCase()),
  labelId: z.string().min(1).max(100),
  labelEn: z.string().min(1).max(100),
  status: z.enum(['active', 'inactive']).default('active'),
});

const updateSectorSchema = z.object({
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

export function createCorporateSectorsRouter(): Router {
  const router = Router();

  /**
   * GET /api/corporate-sectors
   * List corporate sectors with optional search, status filter, and pagination.
   */
  router.get('/', requirePermission('public.corporate_sectors.read'), async (req: Request, res: Response) => {
    const search = req.query.search as string | undefined;
    const status = req.query.status as string | undefined;
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize as string) || 20));
    const offset = (page - 1) * pageSize;

    const conditions = [];

    if (search) {
      conditions.push(
        or(
          ilike(corporateSectors.labelId, `%${search}%`),
          ilike(corporateSectors.labelEn, `%${search}%`),
          ilike(corporateSectors.code, `%${search}%`),
        ),
      );
    }

    if (status === 'active' || status === 'inactive') {
      conditions.push(eq(corporateSectors.status, status));
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [records, [{ totalCount }]] = await Promise.all([
      db
        .select()
        .from(corporateSectors)
        .where(where)
        .orderBy(corporateSectors.labelId)
        .limit(pageSize)
        .offset(offset),
      db
        .select({ totalCount: count() })
        .from(corporateSectors)
        .where(where),
    ]);

    res.json({ records, totalCount: Number(totalCount) });
  });

  /**
   * POST /api/corporate-sectors
   * Create a new corporate sector.
   */
  router.post('/', requirePermission('public.corporate_sectors.write'), async (req: Request, res: Response) => {
    const parsed = createSectorSchema.safeParse(req.body);
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
      const [sector] = await db
        .insert(corporateSectors)
        .values({
          code,
          labelId,
          labelEn,
          status,
          createdBy: req.user!.userId,
        })
        .returning();

      return res.status(201).json(sector);
    } catch (err) {
      if (isUniqueViolation(err)) {
        return res.status(409).json({
          error: {
            code: 'CONFLICT',
            message: `A corporate sector with code '${code}' already exists`,
          },
        });
      }
      throw err;
    }
  });

  /**
   * GET /api/corporate-sectors/:id
   * Get a single corporate sector by ID.
   */
  router.get('/:id', requirePermission('public.corporate_sectors.read'), async (req: Request, res: Response) => {
    const [sector] = await db
      .select()
      .from(corporateSectors)
      .where(eq(corporateSectors.id, req.params.id))
      .limit(1);

    if (!sector) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Corporate sector not found' },
      });
    }

    return res.json(sector);
  });

  /**
   * PUT /api/corporate-sectors/:id
   * Update a corporate sector.
   */
  router.put('/:id', requirePermission('public.corporate_sectors.write'), async (req: Request, res: Response) => {
    const parsed = updateSectorSchema.safeParse(req.body);
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
      .from(corporateSectors)
      .where(eq(corporateSectors.id, req.params.id))
      .limit(1);

    if (!existing) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Corporate sector not found' },
      });
    }

    try {
      const [updated] = await db
        .update(corporateSectors)
        .set({
          ...parsed.data,
          updatedBy: req.user!.userId,
          updatedAt: new Date(),
        })
        .where(eq(corporateSectors.id, req.params.id))
        .returning();

      return res.json(updated);
    } catch (err) {
      if (isUniqueViolation(err)) {
        return res.status(409).json({
          error: {
            code: 'CONFLICT',
            message: `A corporate sector with code '${parsed.data.code}' already exists`,
          },
        });
      }
      throw err;
    }
  });

  /**
   * DELETE /api/corporate-sectors/:id
   * Delete a corporate sector.
   */
  router.delete('/:id', requirePermission('public.corporate_sectors.delete'), async (req: Request, res: Response) => {
    const [existing] = await db
      .select()
      .from(corporateSectors)
      .where(eq(corporateSectors.id, req.params.id))
      .limit(1);

    if (!existing) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Corporate sector not found' },
      });
    }

    await db.delete(corporateSectors).where(eq(corporateSectors.id, req.params.id));

    return res.json({ success: true });
  });

  return router;
}

// src/routes/financial/currencies.ts
// Master Currencies CRUD Routes
// Requirements: 8.1, 8.2, 8.3, 8.4, 8.5

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { eq, ilike, or, and, count } from 'drizzle-orm';
import { db } from '../../db/connection';
import { currencies, corporates } from '../../db/schema/public';
import { requirePermission, injectAccessContext, requireScope } from '../../middleware/rbac';
import { asyncHandler } from '../../utils/asyncHandler';
import { createFRSAuditLog } from '../../services/financial/auditLogService';
import { AppError, ErrorCode } from '../../utils/errors';

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
// Router
// ---------------------------------------------------------------------------

export function createCurrenciesRouter(): Router {
  const router = Router();

  /**
   * GET /api/currencies
   * List currencies with optional search, status filter, and pagination.
   */
  router.get('/', requirePermission('public.currencies.read'), injectAccessContext, asyncHandler(async (req: Request, res: Response) => {
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
  router.post('/', 
    requirePermission('public.currencies.write'), 
    injectAccessContext, 
    requireScope('system'), 
    asyncHandler(async (req: Request, res: Response) => {
    const data = createCurrencySchema.parse(req.body);
    const { code, label, status } = data;

    const [currency] = await db
      .insert(currencies)
      .values({
        code,
        label,
        status,
        createdBy: req.user!.userId,
      })
      .returning();

    await createFRSAuditLog({
      userId: req.user!.userId,
      action: 'create',
      entityType: 'currency',
      entityId: currency.id,
      newValues: { code, label, status },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return res.status(201).json(currency);
  }));

  /**
   * GET /api/currencies/dropdown-items
   * Fetch active currencies for dropdown selection.
   */
  router.get('/dropdown-items', requirePermission('public.currencies.read'), injectAccessContext, asyncHandler(async (req: Request, res: Response) => {
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
  router.get('/:id', requirePermission('public.currencies.read'), injectAccessContext, asyncHandler(async (req: Request, res: Response) => {
    const [currency] = await db
      .select()
      .from(currencies)
      .where(eq(currencies.id, req.params.id))
      .limit(1);

    if (!currency) {
      throw AppError.notFound(ErrorCode.CURRENCY_NOT_FOUND, 'Currency not found');
    }

    return res.json(currency);
  }));

  /**
   * PUT /api/currencies/:id
   * Update a currency.
   */
  router.put('/:id', 
    requirePermission('public.currencies.write'), 
    injectAccessContext, 
    requireScope('system'), 
    asyncHandler(async (req: Request, res: Response) => {
    const data = updateCurrencySchema.parse(req.body);

    const [existing] = await db
      .select()
      .from(currencies)
      .where(eq(currencies.id, req.params.id))
      .limit(1);

    if (!existing) {
      throw AppError.notFound(ErrorCode.CURRENCY_NOT_FOUND, 'Currency not found');
    }

    const [updated] = await db
      .update(currencies)
      .set({
        ...data,
        updatedBy: req.user!.userId,
        updatedAt: new Date(),
      })
      .where(eq(currencies.id, req.params.id))
      .returning();

    await createFRSAuditLog({
      userId: req.user!.userId,
      action: 'update',
      entityType: 'currency',
      entityId: req.params.id,
      oldValues: { code: existing.code, label: existing.label, status: existing.status },
      newValues: data,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return res.json(updated);
  }));

  /**
   * DELETE /api/currencies/:id
   * Delete a currency. Blocked if used by any corporate.
   */
  router.delete('/:id', 
    requirePermission('public.currencies.delete'), 
    injectAccessContext, 
    requireScope('system'), 
    asyncHandler(async (req: Request, res: Response) => {
    const [existing] = await db
      .select()
      .from(currencies)
      .where(eq(currencies.id, req.params.id))
      .limit(1);

    if (!existing) {
      throw AppError.notFound(ErrorCode.CURRENCY_NOT_FOUND, 'Currency not found');
    }

    // Block: corporates.currency references this currency code
    const [corp] = await db.select({ id: corporates.id })
      .from(corporates)
      .where(eq(corporates.currency, existing.code))
      .limit(1);
    if (corp) {
      throw AppError.unprocessable(ErrorCode.DELETE_PROTECTED, 'Mata uang tidak dapat dihapus karena masih digunakan oleh perusahaan');
    }

    await db.delete(currencies).where(eq(currencies.id, req.params.id));

    await createFRSAuditLog({
      userId: req.user!.userId,
      action: 'delete',
      entityType: 'currency',
      entityId: req.params.id,
      oldValues: { code: existing.code, label: existing.label },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return res.json({ success: true });
  }));

  return router;
}

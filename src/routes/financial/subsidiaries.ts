// Subsidiary CRUD Routes
// Requirements: 1.1, 1.2, 1.3, 1.5, 1.6

import { Router, Request, Response } from 'express';
import { requirePermission, requireSubsidiaryAccess } from '../../middleware/rbac';
import {
  createSubsidiary,
  listSubsidiaries,
  getSubsidiaryById,
  updateSubsidiary,
  setSubsidiaryStatus,
  deleteSubsidiary,
} from '../../services/financial/subsidiaryService';
import { initDefaultThresholds } from '../../services/financial/thresholdService';
import { createFRSAuditLog } from '../../services/financial/auditLogService';
import { db } from '../../db/connection';
import { userCorporateAccesses } from '../../db/schema/public';
import { eq } from 'drizzle-orm';
import { asyncHandler } from '../../utils/asyncHandler';
import { AppError, ErrorCode } from '../../utils/errors';

export function createSubsidiariesRouter(): Router {
  const router = Router();

  /**
   * POST /api/frs/subsidiaries
   * Create a new subsidiary (Owner only). Max 5 limit enforced.
   */
  router.post('/', requirePermission('cfd.subsidiaries.write'), asyncHandler(async (req: Request, res: Response) => {
    const { name, industrySector, fiscalYearStartMonth, currency, taxRate } = req.body;

    if (!name || !industrySector || !fiscalYearStartMonth || taxRate == null) {
      throw AppError.badRequest(ErrorCode.MISSING_REQUIRED_FIELD, 'Name, industry sector, fiscal year start month, and tax rate are required');
    }

    if (fiscalYearStartMonth < 1 || fiscalYearStartMonth > 12) {
      throw AppError.badRequest(ErrorCode.INVALID_PERIOD_FORMAT, 'Fiscal year start month must be between 1 and 12');
    }

    const result = await createSubsidiary({ name, industrySector, fiscalYearStartMonth, currency, taxRate }, req.user!.userId);

    if (result.error) {
      throw AppError.unprocessable(ErrorCode.RATE_LIMIT_EXCEEDED, result.error);
    }

    const subsidiary = result.subsidiary!;

    // Initialize default thresholds for all 9 ratios
    await initDefaultThresholds(subsidiary.id, industrySector, req.user!.userId);

    await createFRSAuditLog({
      userId: req.user!.userId,
      action: 'create',
      entityType: 'subsidiary',
      entityId: subsidiary.id,
      newValues: { name, industrySector },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.status(201).json(subsidiary);
  }));

  /**
   * GET /api/frs/subsidiaries
   * List subsidiaries. Optional ?active=true filter.
   */
  router.get('/', requirePermission('cfd.subsidiaries.read'), asyncHandler(async (req: Request, res: Response) => {
    const activeOnly = req.query.active === 'true';
    let subsidiaries = await listSubsidiaries(activeOnly);

    // Context Filtering
    const access = req.accessContext!;
    if (access.scope !== 'system') {
      const allowed = new Set(access.corporateIds);
      subsidiaries = subsidiaries.filter((s) => allowed.has(s.id));
    }

    res.json(subsidiaries);
  }));

  /**
   * GET /api/frs/subsidiaries/:id
   * Get subsidiary details.
   */
  router.get('/:id', requirePermission('cfd.subsidiaries.read'), requireSubsidiaryAccess(), asyncHandler(async (req: Request, res: Response) => {
    const subsidiary = await getSubsidiaryById(req.params.id);
    if (!subsidiary) {
      throw AppError.notFound(ErrorCode.SUBSIDIARY_NOT_FOUND, 'Subsidiary not found');
    }
    res.json(subsidiary);
  }));

  /**
   * PUT /api/frs/subsidiaries/:id
   * Update subsidiary profile (Owner only).
   */
  router.put('/:id', requirePermission('cfd.subsidiaries.write'), asyncHandler(async (req: Request, res: Response) => {
    const { name, industrySector, fiscalYearStartMonth, currency, taxRate } = req.body;

    const existing = await getSubsidiaryById(req.params.id);
    if (!existing) {
      throw AppError.notFound(ErrorCode.SUBSIDIARY_NOT_FOUND, 'Subsidiary not found');
    }

    const updated = await updateSubsidiary(req.params.id, { name, industrySector, fiscalYearStartMonth, currency, taxRate });

    await createFRSAuditLog({
      userId: req.user!.userId,
      action: 'update',
      entityType: 'subsidiary',
      entityId: req.params.id,
      oldValues: { name: existing.name, industrySector: existing.industrySector },
      newValues: { name, industrySector },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.json(updated);
  }));

  /**
   * PATCH /api/frs/subsidiaries/:id/status
   * Activate or deactivate a subsidiary (Owner only).
   */
  router.patch('/:id/status', requirePermission('cfd.subsidiaries.configure'), asyncHandler(async (req: Request, res: Response) => {
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
      throw AppError.badRequest(ErrorCode.MISSING_REQUIRED_FIELD, 'isActive (boolean) is required');
    }

    const updated = await setSubsidiaryStatus(req.params.id, isActive);
    if (!updated) {
      throw AppError.notFound(ErrorCode.SUBSIDIARY_NOT_FOUND, 'Subsidiary not found');
    }

    await createFRSAuditLog({
      userId: req.user!.userId,
      action: 'update',
      entityType: 'subsidiary',
      entityId: req.params.id,
      newValues: { isActive },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.json(updated);
  }));

  /**
   * DELETE /api/frs/subsidiaries/:id
   * Delete a subsidiary. Rejected if it has financial data.
   */
  router.delete('/:id', requirePermission('cfd.subsidiaries.delete'), asyncHandler(async (req: Request, res: Response) => {
    const result = await deleteSubsidiary(req.params.id);

    if (!result.success) {
      if (result.error === 'Subsidiary not found') {
        throw AppError.notFound(ErrorCode.SUBSIDIARY_NOT_FOUND, result.error);
      }
      throw AppError.unprocessable(ErrorCode.DELETE_PROTECTED, result.error);
    }

    createFRSAuditLog({
      userId: req.user!.userId,
      action: 'delete',
      entityType: 'subsidiary',
      entityId: req.params.id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.json({ success: true });
  }));

  return router;
}

// Subsidiary CRUD Routes
// Requirements: 1.1, 1.2, 1.3, 1.5, 1.6

import { Router, Request, Response } from 'express';
import Database from 'better-sqlite3';
import { requireFRSAuth } from '../../middleware/frsAuth';
import { authorize, requireSubsidiaryAccess } from '../../middleware/frsRbac';
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

export function createSubsidiariesRouter(db: Database.Database): Router {
  const router = Router();

  // All routes require authentication
  router.use(requireFRSAuth);

  /**
   * POST /api/frs/subsidiaries
   * Create a new subsidiary (Owner only). Max 5 limit enforced.
   */
  router.post('/', authorize('subsidiaries', 'write', db), (req: Request, res: Response) => {
    const { name, industrySector, fiscalYearStartMonth, currency, taxRate } = req.body;

    if (!name || !industrySector || !fiscalYearStartMonth || taxRate == null) {
      res.status(400).json({
        error: { code: 'FRS_VALIDATION_ERROR', message: 'name, industrySector, fiscalYearStartMonth, and taxRate are required', timestamp: new Date().toISOString(), requestId: '' },
      });
      return;
    }

    if (fiscalYearStartMonth < 1 || fiscalYearStartMonth > 12) {
      res.status(400).json({
        error: { code: 'FRS_VALIDATION_ERROR', message: 'fiscalYearStartMonth must be between 1 and 12', timestamp: new Date().toISOString(), requestId: '' },
      });
      return;
    }

    const result = createSubsidiary(db, { name, industrySector, fiscalYearStartMonth, currency, taxRate }, req.frsUser!.userId);

    if (result.error) {
      res.status(422).json({
        error: { code: 'FRS_LIMIT_EXCEEDED', message: result.error, timestamp: new Date().toISOString(), requestId: '' },
      });
      return;
    }

    const subsidiary = result.subsidiary!;

    // Initialize default thresholds for all 9 ratios x 3 period types
    initDefaultThresholds(db, subsidiary.id, industrySector, req.frsUser!.userId);

    createFRSAuditLog(db, {
      userId: req.frsUser!.userId,
      action: 'create',
      entityType: 'subsidiary',
      entityId: subsidiary.id,
      newValues: { name, industrySector },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.status(201).json(subsidiary);
  });

  /**
   * GET /api/frs/subsidiaries
   * List subsidiaries. Optional ?active=true filter.
   */
  router.get('/', authorize('subsidiaries', 'read', db), (req: Request, res: Response) => {
    const activeOnly = req.query.active === 'true';
    let subsidiaries = listSubsidiaries(db, activeOnly);

    // subsidiary_manager: filter to only their assigned subsidiaries
    if (req.frsUser!.role === 'subsidiary_manager') {
      const accessRows = db
        .prepare('SELECT subsidiary_id FROM frs_user_subsidiary_access WHERE user_id = ?')
        .all(req.frsUser!.userId) as any[];
      const allowed = new Set(accessRows.map((r) => r.subsidiary_id));
      subsidiaries = subsidiaries.filter((s) => allowed.has(s.id));
    }

    res.json(subsidiaries);
  });

  /**
   * GET /api/frs/subsidiaries/:id
   * Get subsidiary details.
   */
  router.get('/:id', authorize('subsidiaries', 'read', db), requireSubsidiaryAccess(db), (req: Request, res: Response) => {
    const subsidiary = getSubsidiaryById(db, req.params.id);
    if (!subsidiary) {
      res.status(404).json({
        error: { code: 'FRS_NOT_FOUND', message: 'Subsidiary not found', timestamp: new Date().toISOString(), requestId: '' },
      });
      return;
    }
    res.json(subsidiary);
  });

  /**
   * PUT /api/frs/subsidiaries/:id
   * Update subsidiary profile (Owner only).
   */
  router.put('/:id', authorize('subsidiaries', 'write', db), (req: Request, res: Response) => {
    const { name, industrySector, fiscalYearStartMonth, currency, taxRate } = req.body;

    const existing = getSubsidiaryById(db, req.params.id);
    if (!existing) {
      res.status(404).json({
        error: { code: 'FRS_NOT_FOUND', message: 'Subsidiary not found', timestamp: new Date().toISOString(), requestId: '' },
      });
      return;
    }

    const updated = updateSubsidiary(db, req.params.id, { name, industrySector, fiscalYearStartMonth, currency, taxRate });

    createFRSAuditLog(db, {
      userId: req.frsUser!.userId,
      action: 'update',
      entityType: 'subsidiary',
      entityId: req.params.id,
      oldValues: { name: existing.name, industrySector: existing.industrySector },
      newValues: { name, industrySector },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.json(updated);
  });

  /**
   * PATCH /api/frs/subsidiaries/:id/status
   * Activate or deactivate a subsidiary (Owner only).
   */
  router.patch('/:id/status', authorize('subsidiaries', 'configure', db), (req: Request, res: Response) => {
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
      res.status(400).json({
        error: { code: 'FRS_VALIDATION_ERROR', message: 'isActive (boolean) is required', timestamp: new Date().toISOString(), requestId: '' },
      });
      return;
    }

    const updated = setSubsidiaryStatus(db, req.params.id, isActive);
    if (!updated) {
      res.status(404).json({
        error: { code: 'FRS_NOT_FOUND', message: 'Subsidiary not found', timestamp: new Date().toISOString(), requestId: '' },
      });
      return;
    }

    createFRSAuditLog(db, {
      userId: req.frsUser!.userId,
      action: 'update',
      entityType: 'subsidiary',
      entityId: req.params.id,
      newValues: { isActive },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.json(updated);
  });

  /**
   * DELETE /api/frs/subsidiaries/:id
   * Delete a subsidiary. Rejected if it has financial data.
   */
  router.delete('/:id', authorize('subsidiaries', 'delete', db), (req: Request, res: Response) => {
    const result = deleteSubsidiary(db, req.params.id);

    if (!result.success) {
      const isNotFound = result.error === 'Subsidiary not found';
      res.status(isNotFound ? 404 : 422).json({
        error: {
          code: isNotFound ? 'FRS_NOT_FOUND' : 'FRS_DELETE_PROTECTED',
          message: result.error,
          timestamp: new Date().toISOString(),
          requestId: '',
        },
      });
      return;
    }

    createFRSAuditLog(db, {
      userId: req.frsUser!.userId,
      action: 'delete',
      entityType: 'subsidiary',
      entityId: req.params.id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.json({ success: true });
  });

  return router;
}

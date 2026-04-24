// Threshold Configuration API Routes
// Requirements: 5.10, 15.1, 15.5, 15.6

import { Router, Request, Response } from 'express';
import { requirePermission, requireSubsidiaryAccess } from '../../middleware/rbac';
import {
  getThresholds,
  updateThresholds,
  resetThresholdsToDefaults,
  getThresholdHistory,
} from '../../services/financial/thresholdService';
import { getSubsidiaryById } from '../../services/financial/subsidiaryService';
import { createFRSAuditLog } from '../../services/financial/auditLogService';
import { reevaluateAlertsForSubsidiary } from '../../services/financial/alertEngine';
import { RatioName } from '../../types/financial/ratio';

const VALID_RATIO_NAMES: RatioName[] = ['roa', 'roe', 'npm', 'der', 'currentRatio', 'quickRatio', 'cashRatio', 'ocfRatio', 'dscr'];

export function createThresholdsRouter(): Router {
  const router = Router();

  /**
   * GET /api/frs/thresholds/history
   * Get threshold change history (Owner only).
   * Requirements: 15.5
   */
  router.get('/history', requirePermission('cfd.thresholds.read'), async (req: Request, res: Response) => {
    const { corporateId, limit, offset } = req.query;

    if (!corporateId) {
      res.status(400).json({
        error: { code: 'FRS_VALIDATION_ERROR', message: 'corporateId query param is required', timestamp: new Date().toISOString(), requestId: '' },
      });
      return;
    }

    const history = await getThresholdHistory(
      corporateId as string,
      limit ? parseInt(limit as string, 10) : 100,
      offset ? parseInt(offset as string, 10) : 0
    );

    res.json(history);
  });

  /**
   * GET /api/frs/thresholds/:corporateId
   * Get thresholds for a corporate.
   * Requirements: 15.1
   */
  router.get('/:corporateId', requirePermission('cfd.thresholds.read'), requireSubsidiaryAccess(), async (req: Request, res: Response) => {
    const { corporateId } = req.params;

    const subsidiary = await getSubsidiaryById(corporateId);
    if (!subsidiary) {
      res.status(404).json({
        error: { code: 'FRS_NOT_FOUND', message: 'Corporate not found', timestamp: new Date().toISOString(), requestId: '' },
      });
      return;
    }

    const thresholds = await getThresholds(corporateId);
    res.json(thresholds);
  });

  /**
   * PUT /api/frs/thresholds/:corporateId
   * Update custom thresholds for a corporate (Owner only).
   * Requirements: 15.1, 15.3, 15.5
   */
  router.put('/:corporateId', requirePermission('cfd.thresholds.write'), async (req: Request, res: Response) => {
    const { corporateId } = req.params;
    const { thresholds } = req.body;

    if (!Array.isArray(thresholds) || thresholds.length === 0) {
      res.status(400).json({
        error: { code: 'FRS_VALIDATION_ERROR', message: 'thresholds array is required', timestamp: new Date().toISOString(), requestId: '' },
      });
      return;
    }

    const subsidiary = await getSubsidiaryById(corporateId);
    if (!subsidiary) {
      res.status(404).json({
        error: { code: 'FRS_NOT_FOUND', message: 'Corporate not found', timestamp: new Date().toISOString(), requestId: '' },
      });
      return;
    }

    // Validate each threshold entry
    for (const t of thresholds) {
      if (!VALID_RATIO_NAMES.includes(t.ratioName)) {
        res.status(400).json({
          error: { code: 'FRS_VALIDATION_ERROR', message: `Invalid ratioName: ${t.ratioName}`, timestamp: new Date().toISOString(), requestId: '' },
        });
        return;
      }
    }

    const updates = thresholds.map((t: any) => ({
      ratioName: t.ratioName,
      healthyMin: t.healthyMin,
      moderateMin: t.moderateMin,
      riskyMax: t.riskyMax,
      healthyMax: t.healthyMax,
      moderateMax: t.moderateMax,
      riskyMin: t.riskyMin,
    }));

    const result = await updateThresholds(corporateId, updates, req.user!.userId);

    if (!result.success) {
      res.status(400).json({
        error: { code: 'FRS_VALIDATION_ERROR', message: result.error, timestamp: new Date().toISOString(), requestId: '' },
      });
      return;
    }

    await createFRSAuditLog({
      userId: req.user!.userId,
      action: 'update',
      entityType: 'threshold',
      newValues: { corporateId, count: updates.length },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    // Re-evaluate all current ratio values against new thresholds (Req 15.4)
    await reevaluateAlertsForSubsidiary(corporateId);

    const updated = await getThresholds(corporateId);
    res.json(updated);
  });

  /**
   * POST /api/frs/thresholds/:corporateId/reset
   * Reset thresholds to industry defaults (Owner only).
   * Requirements: 15.6
   */
  router.post('/:corporateId/reset', requirePermission('cfd.thresholds.configure'), async (req: Request, res: Response) => {
    const { corporateId } = req.params;

    const subsidiary = await getSubsidiaryById(corporateId);
    if (!subsidiary) {
      res.status(404).json({
        error: { code: 'FRS_NOT_FOUND', message: 'Corporate not found', timestamp: new Date().toISOString(), requestId: '' },
      });
      return;
    }

    await resetThresholdsToDefaults(corporateId, subsidiary.industrySector, req.user!.userId);

    await createFRSAuditLog({
      userId: req.user!.userId,
      action: 'update',
      entityType: 'threshold',
      newValues: { corporateId, action: 'reset_to_defaults', industrySector: subsidiary.industrySector },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    // Re-evaluate alerts after reset (Req 15.4)
    await reevaluateAlertsForSubsidiary(corporateId);

    const updatedThresholds = await getThresholds(corporateId);
    res.json({ message: 'Thresholds reset to industry defaults', thresholds: updatedThresholds });
  });

  return router;
}

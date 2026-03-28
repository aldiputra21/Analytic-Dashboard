// Threshold Configuration API Routes
// Requirements: 5.10, 15.1, 15.5, 15.6

import { Router, Request, Response } from 'express';
import Database from 'better-sqlite3';
import { requireFRSAuth } from '../../middleware/frsAuth';
import { authorize, requireSubsidiaryAccess } from '../../middleware/frsRbac';
import {
  getThresholds,
  updateThresholds,
  resetThresholdsToDefaults,
  getThresholdHistory,
} from '../../services/financial/thresholdService';
import { getSubsidiaryById } from '../../services/financial/subsidiaryService';
import { createFRSAuditLog } from '../../services/financial/auditLogService';
import { reevaluateAlertsForSubsidiary } from '../../services/financial/alertEngine';
import { CreateThresholdInput } from '../../types/financial/threshold';
import { RatioName } from '../../types/financial/ratio';
import { PeriodType } from '../../types/financial/financialData';

const VALID_RATIO_NAMES: RatioName[] = ['roa', 'roe', 'npm', 'der', 'currentRatio', 'quickRatio', 'cashRatio', 'ocfRatio', 'dscr'];
const VALID_PERIOD_TYPES: PeriodType[] = ['monthly', 'quarterly', 'annual'];

export function createThresholdsRouter(db: Database.Database): Router {
  const router = Router();

  router.use(requireFRSAuth);

  /**
   * GET /api/frs/thresholds/history
   * Get threshold change history (Owner only).
   * Requirements: 15.5
   */
  router.get('/history', authorize('thresholds', 'read', db), (req: Request, res: Response) => {
    const { subsidiaryId, limit, offset } = req.query;

    if (!subsidiaryId) {
      res.status(400).json({
        error: { code: 'FRS_VALIDATION_ERROR', message: 'subsidiaryId query param is required', timestamp: new Date().toISOString(), requestId: '' },
      });
      return;
    }

    const history = getThresholdHistory(
      db,
      subsidiaryId as string,
      limit ? parseInt(limit as string, 10) : 100,
      offset ? parseInt(offset as string, 10) : 0
    );

    res.json(history);
  });

  /**
   * GET /api/frs/thresholds/:subsidiaryId
   * Get thresholds for a subsidiary, optionally filtered by period type.
   * Requirements: 15.1
   */
  router.get('/:subsidiaryId', authorize('thresholds', 'read', db), requireSubsidiaryAccess(db), (req: Request, res: Response) => {
    const { subsidiaryId } = req.params;
    const periodType = req.query.periodType as PeriodType | undefined;

    if (periodType && !VALID_PERIOD_TYPES.includes(periodType)) {
      res.status(400).json({
        error: { code: 'FRS_VALIDATION_ERROR', message: `periodType must be one of: ${VALID_PERIOD_TYPES.join(', ')}`, timestamp: new Date().toISOString(), requestId: '' },
      });
      return;
    }

    const subsidiary = getSubsidiaryById(db, subsidiaryId);
    if (!subsidiary) {
      res.status(404).json({
        error: { code: 'FRS_NOT_FOUND', message: 'Subsidiary not found', timestamp: new Date().toISOString(), requestId: '' },
      });
      return;
    }

    const thresholds = getThresholds(db, subsidiaryId, periodType);
    res.json(thresholds);
  });

  /**
   * PUT /api/frs/thresholds/:subsidiaryId
   * Update custom thresholds for a subsidiary (Owner only).
   * Requirements: 15.1, 15.3, 15.5
   */
  router.put('/:subsidiaryId', authorize('thresholds', 'write', db), (req: Request, res: Response) => {
    const { subsidiaryId } = req.params;
    const { thresholds } = req.body;

    if (!Array.isArray(thresholds) || thresholds.length === 0) {
      res.status(400).json({
        error: { code: 'FRS_VALIDATION_ERROR', message: 'thresholds array is required', timestamp: new Date().toISOString(), requestId: '' },
      });
      return;
    }

    const subsidiary = getSubsidiaryById(db, subsidiaryId);
    if (!subsidiary) {
      res.status(404).json({
        error: { code: 'FRS_NOT_FOUND', message: 'Subsidiary not found', timestamp: new Date().toISOString(), requestId: '' },
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
      if (!VALID_PERIOD_TYPES.includes(t.periodType)) {
        res.status(400).json({
          error: { code: 'FRS_VALIDATION_ERROR', message: `Invalid periodType: ${t.periodType}`, timestamp: new Date().toISOString(), requestId: '' },
        });
        return;
      }
    }

    const inputs: CreateThresholdInput[] = thresholds.map((t: any) => ({
      subsidiaryId,
      ratioName: t.ratioName,
      periodType: t.periodType,
      healthyMin: t.healthyMin,
      moderateMin: t.moderateMin,
      riskyMax: t.riskyMax,
      healthyMax: t.healthyMax,
      moderateMax: t.moderateMax,
      riskyMin: t.riskyMin,
    }));

    const result = updateThresholds(db, subsidiaryId, inputs, req.frsUser!.userId);

    if (!result.success) {
      res.status(400).json({
        error: { code: 'FRS_VALIDATION_ERROR', message: result.error, timestamp: new Date().toISOString(), requestId: '' },
      });
      return;
    }

    createFRSAuditLog(db, {
      userId: req.frsUser!.userId,
      action: 'update',
      entityType: 'threshold',
      subsidiaryId,
      newValues: { count: inputs.length },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    // Re-evaluate all current ratio values against new thresholds (Req 15.4)
    reevaluateAlertsForSubsidiary(db, subsidiaryId);

    const updated = getThresholds(db, subsidiaryId);
    res.json(updated);
  });

  /**
   * POST /api/frs/thresholds/:subsidiaryId/reset
   * Reset thresholds to industry defaults (Owner only).
   * Requirements: 15.6
   */
  router.post('/:subsidiaryId/reset', authorize('thresholds', 'configure', db), (req: Request, res: Response) => {
    const { subsidiaryId } = req.params;

    const subsidiary = getSubsidiaryById(db, subsidiaryId);
    if (!subsidiary) {
      res.status(404).json({
        error: { code: 'FRS_NOT_FOUND', message: 'Subsidiary not found', timestamp: new Date().toISOString(), requestId: '' },
      });
      return;
    }

    resetThresholdsToDefaults(db, subsidiaryId, subsidiary.industrySector, req.frsUser!.userId);

    createFRSAuditLog(db, {
      userId: req.frsUser!.userId,
      action: 'update',
      entityType: 'threshold',
      subsidiaryId,
      newValues: { action: 'reset_to_defaults', industrySector: subsidiary.industrySector },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    // Re-evaluate alerts after reset (Req 15.4)
    reevaluateAlertsForSubsidiary(db, subsidiaryId);

    const thresholds = getThresholds(db, subsidiaryId);
    res.json({ message: 'Thresholds reset to industry defaults', thresholds });
  });

  return router;
}

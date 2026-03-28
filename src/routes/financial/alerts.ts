// Alert Management API Routes
// Requirements: 5.8, 5.9

import { Router, Request, Response } from 'express';
import Database from 'better-sqlite3';
import { requireFRSAuth } from '../../middleware/frsAuth';
import { authorize } from '../../middleware/frsRbac';
import {
  listAlerts,
  getAlertById,
  acknowledgeAlert,
  getAlertHistory,
} from '../../services/financial/alertEngine';

export function createAlertsRouter(db: Database.Database): Router {
  const router = Router();

  router.use(requireFRSAuth);

  /**
   * GET /api/frs/alerts/history
   * Get alert history (non-active alerts).
   * Requirements: 5.8, 5.9
   */
  router.get('/history', authorize('alerts', 'read', db), (req: Request, res: Response) => {
    const { subsidiaryId, severity, limit, offset } = req.query as any;

    // subsidiary_manager: restrict to their subsidiaries
    let effectiveSubsidiaryId = subsidiaryId;
    if (req.frsUser!.role === 'subsidiary_manager' && !subsidiaryId) {
      const accessRows = db
        .prepare('SELECT subsidiary_id FROM frs_user_subsidiary_access WHERE user_id = ?')
        .all(req.frsUser!.userId) as any[];
      if (accessRows.length === 0) {
        res.json([]);
        return;
      }
      const allAlerts = accessRows.flatMap((r) =>
        getAlertHistory(db, { subsidiaryId: r.subsidiary_id, severity })
      );
      res.json(allAlerts);
      return;
    }

    const alerts = getAlertHistory(db, {
      subsidiaryId: effectiveSubsidiaryId,
      severity,
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined,
    });

    res.json(alerts);
  });

  /**
   * GET /api/frs/alerts
   * List active alerts with filters.
   * Requirements: 5.8
   */
  router.get('/', authorize('alerts', 'read', db), (req: Request, res: Response) => {
    const { subsidiaryId, severity, status, limit, offset } = req.query as any;

    // subsidiary_manager: restrict to their subsidiaries
    let effectiveSubsidiaryId = subsidiaryId;
    if (req.frsUser!.role === 'subsidiary_manager' && !subsidiaryId) {
      const accessRows = db
        .prepare('SELECT subsidiary_id FROM frs_user_subsidiary_access WHERE user_id = ?')
        .all(req.frsUser!.userId) as any[];
      if (accessRows.length === 0) {
        res.json([]);
        return;
      }
      const allAlerts = accessRows.flatMap((r) =>
        listAlerts(db, { subsidiaryId: r.subsidiary_id, severity, status: status ?? 'active' })
      );
      res.json(allAlerts);
      return;
    }

    const alerts = listAlerts(db, {
      subsidiaryId: effectiveSubsidiaryId,
      severity,
      status: status ?? 'active',
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined,
    });

    res.json(alerts);
  });

  /**
   * GET /api/frs/alerts/:id
   * Get alert details.
   * Requirements: 5.9
   */
  router.get('/:id', authorize('alerts', 'read', db), (req: Request, res: Response) => {
    const alert = getAlertById(db, req.params.id);
    if (!alert) {
      res.status(404).json({
        error: { code: 'FRS_NOT_FOUND', message: 'Alert not found', timestamp: new Date().toISOString(), requestId: '' },
      });
      return;
    }

    // subsidiary_manager: check access
    if (req.frsUser!.role === 'subsidiary_manager') {
      const hasAccess = db
        .prepare('SELECT id FROM frs_user_subsidiary_access WHERE user_id = ? AND subsidiary_id = ?')
        .get(req.frsUser!.userId, alert.subsidiaryId);
      if (!hasAccess) {
        res.status(403).json({
          error: { code: 'FRS_FORBIDDEN', message: 'Access denied', timestamp: new Date().toISOString(), requestId: '' },
        });
        return;
      }
    }

    res.json(alert);
  });

  /**
   * PATCH /api/frs/alerts/:id/acknowledge
   * Acknowledge an alert.
   * Requirements: 5.9
   */
  router.patch('/:id/acknowledge', authorize('alerts', 'write', db), (req: Request, res: Response) => {
    const alert = getAlertById(db, req.params.id);
    if (!alert) {
      res.status(404).json({
        error: { code: 'FRS_NOT_FOUND', message: 'Alert not found', timestamp: new Date().toISOString(), requestId: '' },
      });
      return;
    }

    if (alert.status !== 'active') {
      res.status(422).json({
        error: { code: 'FRS_INVALID_STATE', message: `Alert is already ${alert.status}`, timestamp: new Date().toISOString(), requestId: '' },
      });
      return;
    }

    const updated = acknowledgeAlert(db, req.params.id, req.frsUser!.userId);
    res.json(updated);
  });

  return router;
}

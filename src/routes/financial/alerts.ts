// Alert Management API Routes
// Requirements: 5.8, 5.9

import { Router, Request, Response } from 'express';
import { requirePermission, injectAccessContext } from '../../middleware/rbac';
import { asyncHandler } from '../../utils/asyncHandler';
import {
  listAlerts,
  getUserAlertById,
  acknowledgeAlert,
  getAlertHistory,
} from '../../services/financial/alertEngine';

export function createAlertsRouter(): Router {
  const router = Router();

  /**
   * GET /api/frs/alerts/history
   * Get alert history (non-active alerts).
   * Requirements: 5.8, 5.9
   */
  router.get(
    '/history', 
    requirePermission('cfd.alerts.read'), 
    injectAccessContext,
    asyncHandler(async (req: Request, res: Response) => {
      const { corporateId, severity, limit, offset } = req.query as any;

      const access = req.accessContext!;
      
      if (access.scope !== 'system' && corporateId && !access.corporateIds.includes(corporateId)) {
        return res.status(403).json({ error: 'Access denied to this corporate' });
      }

      const alerts = await getAlertHistory({
        corporateId: corporateId || (access.scope !== 'system' ? access.corporateIds : undefined),
        severity,
        recipientUserId: req.user!.userId,
        limit: limit ? parseInt(limit) : undefined,
        offset: offset ? parseInt(offset) : undefined,
      });

      res.json(alerts);
    })
  );

  /**
   * GET /api/frs/alerts
   * List active alerts with filters.
   * Requirements: 5.8
   */
  router.get(
    '/', 
    requirePermission('cfd.alerts.read'), 
    injectAccessContext,
    asyncHandler(async (req: Request, res: Response) => {
      const { corporateId, severity, status, limit, offset } = req.query as any;

      const access = req.accessContext!;
      
      if (access.scope !== 'system' && corporateId && !access.corporateIds.includes(corporateId)) {
        return res.status(403).json({ error: 'Access denied to this corporate' });
      }

      const alerts = await listAlerts({
        corporateId: corporateId || (access.scope !== 'system' ? access.corporateIds : undefined),
        severity,
        status: status ?? 'active',
        recipientUserId: req.user!.userId,
        limit: limit ? parseInt(limit) : undefined,
        offset: offset ? parseInt(offset) : undefined,
      });

      res.json(alerts);
    })
  );

  /**
   * GET /api/frs/alerts/:id
   * Get alert details.
   * Requirements: 5.9
   */
  router.get(
    '/:id', 
    requirePermission('cfd.alerts.read'), 
    injectAccessContext,
    asyncHandler(async (req: Request, res: Response) => {
      const alert = await getUserAlertById(req.params.id, req.user!.userId);
      if (!alert) {
        res.status(404).json({
          error: { code: 'FRS_NOT_FOUND', message: 'Alert not found' },
        });
        return;
      }

      res.json(alert);
    })
  );

  /**
   * PATCH /api/frs/alerts/:id/acknowledge
   * Acknowledge an alert.
   * Requirements: 5.9
   */
  router.patch(
    '/:id/acknowledge', 
    requirePermission('cfd.alerts.write'), 
    injectAccessContext,
    asyncHandler(async (req: Request, res: Response) => {
      const alert = await getUserAlertById(req.params.id, req.user!.userId);
      if (!alert) {
        res.status(404).json({
          error: { code: 'FRS_NOT_FOUND', message: 'Alert not found' },
        });
        return;
      }

      if (alert.status !== 'active') {
        res.status(422).json({
          error: { code: 'FRS_INVALID_STATE', message: `Alert is already ${alert.status}` },
        });
        return;
      }

      const updated = await acknowledgeAlert(req.params.id, req.user!.userId);
      res.json(updated);
    })
  );

  return router;
}

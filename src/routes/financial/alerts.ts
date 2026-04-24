// Alert Management API Routes
// Requirements: 5.8, 5.9

import { Router, Request, Response } from 'express';
import { requirePermission } from '../../middleware/rbac';
import {
  listAlerts,
  getUserAlertById,
  acknowledgeAlert,
  getAlertHistory,
} from '../../services/financial/alertEngine';
import { db } from '../../db/connection';
import { userCorporateAccesses } from '../../db/schema/public';
import { eq } from 'drizzle-orm';

export function createAlertsRouter(): Router {
  const router = Router();

  /**
   * GET /api/frs/alerts/history
   * Get alert history (non-active alerts).
   * Requirements: 5.8, 5.9
   */
  router.get('/history', requirePermission('cfd.alerts.read'), async (req: Request, res: Response) => {
    const { corporateId, severity, limit, offset } = req.query as any;

    // subsidiary_manager: restrict to their corporates
    if (req.user!.role === 'subsidiary_manager' && !corporateId) {
      const accessRows = await db
        .select({ corporateId: userCorporateAccesses.corporateId })
        .from(userCorporateAccesses)
        .where(eq(userCorporateAccesses.userId, req.user!.userId));
      if (accessRows.length === 0) {
        res.json([]);
        return;
      }
      const allAlerts: any[] = [];
      for (const r of accessRows) {
        const alerts = await getAlertHistory({ corporateId: r.corporateId, severity, recipientUserId: req.user!.userId });
        allAlerts.push(...alerts);
      }
      res.json(allAlerts);
      return;
    }

    const alerts = await getAlertHistory({
      corporateId,
      severity,
      recipientUserId: req.user!.userId,
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
  router.get('/', requirePermission('cfd.alerts.read'), async (req: Request, res: Response) => {
    const { corporateId, severity, status, limit, offset } = req.query as any;

    // subsidiary_manager: restrict to their corporates
    if (req.user!.role === 'subsidiary_manager' && !corporateId) {
      const accessRows = await db
        .select({ corporateId: userCorporateAccesses.corporateId })
        .from(userCorporateAccesses)
        .where(eq(userCorporateAccesses.userId, req.user!.userId));
      if (accessRows.length === 0) {
        res.json([]);
        return;
      }
      const allAlerts: any[] = [];
      for (const r of accessRows) {
        const alerts = await listAlerts({ corporateId: r.corporateId, severity, status: status ?? 'active', recipientUserId: req.user!.userId });
        allAlerts.push(...alerts);
      }
      res.json(allAlerts);
      return;
    }

    const alerts = await listAlerts({
      corporateId,
      severity,
      status: status ?? 'active',
      recipientUserId: req.user!.userId,
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
  router.get('/:id', requirePermission('cfd.alerts.read'), async (req: Request, res: Response) => {
    const alert = await getUserAlertById(req.params.id, req.user!.userId);
    if (!alert) {
      res.status(404).json({
        error: { code: 'FRS_NOT_FOUND', message: 'Alert not found', timestamp: new Date().toISOString(), requestId: '' },
      });
      return;
    }

    res.json(alert);
  });

  /**
   * PATCH /api/frs/alerts/:id/acknowledge
   * Acknowledge an alert.
   * Requirements: 5.9
   */
  router.patch('/:id/acknowledge', requirePermission('cfd.alerts.write'), async (req: Request, res: Response) => {
    const alert = await getUserAlertById(req.params.id, req.user!.userId);
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

    const updated = await acknowledgeAlert(req.params.id, req.user!.userId);
    res.json(updated);
  });

  return router;
}

// Alert Management API Routes
// Requirements: 5.8, 5.9

import { Router, Request, Response } from 'express';
import { requireFRSAuth } from '../../middleware/frsAuth';
import { authorize } from '../../middleware/frsRbac';
import {
  listAlerts,
  getAlertById,
  acknowledgeAlert,
  getAlertHistory,
} from '../../services/financial/alertEngine';
import { db } from '../../db/connection';
import { userCorporateAccesses } from '../../db/schema/public';
import { eq, and } from 'drizzle-orm';

export function createAlertsRouter(): Router {
  const router = Router();

  router.use(requireFRSAuth);

  /**
   * GET /api/frs/alerts/history
   * Get alert history (non-active alerts).
   * Requirements: 5.8, 5.9
   */
  router.get('/history', authorize('alerts', 'read'), async (req: Request, res: Response) => {
    const { corporateId, severity, limit, offset } = req.query as any;

    // subsidiary_manager: restrict to their corporates
    if (req.frsUser!.role === 'subsidiary_manager' && !corporateId) {
      const accessRows = await db
        .select({ corporateId: userCorporateAccesses.corporateId })
        .from(userCorporateAccesses)
        .where(eq(userCorporateAccesses.userId, req.frsUser!.userId));
      if (accessRows.length === 0) {
        res.json([]);
        return;
      }
      const allAlerts: any[] = [];
      for (const r of accessRows) {
        const alerts = await getAlertHistory({ corporateId: r.corporateId, severity });
        allAlerts.push(...alerts);
      }
      res.json(allAlerts);
      return;
    }

    const alerts = await getAlertHistory({
      corporateId,
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
  router.get('/', authorize('alerts', 'read'), async (req: Request, res: Response) => {
    const { corporateId, severity, status, limit, offset } = req.query as any;

    // subsidiary_manager: restrict to their corporates
    if (req.frsUser!.role === 'subsidiary_manager' && !corporateId) {
      const accessRows = await db
        .select({ corporateId: userCorporateAccesses.corporateId })
        .from(userCorporateAccesses)
        .where(eq(userCorporateAccesses.userId, req.frsUser!.userId));
      if (accessRows.length === 0) {
        res.json([]);
        return;
      }
      const allAlerts: any[] = [];
      for (const r of accessRows) {
        const alerts = await listAlerts({ corporateId: r.corporateId, severity, status: status ?? 'active' });
        allAlerts.push(...alerts);
      }
      res.json(allAlerts);
      return;
    }

    const alerts = await listAlerts({
      corporateId,
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
  router.get('/:id', authorize('alerts', 'read'), async (req: Request, res: Response) => {
    const alert = await getAlertById(req.params.id);
    if (!alert) {
      res.status(404).json({
        error: { code: 'FRS_NOT_FOUND', message: 'Alert not found', timestamp: new Date().toISOString(), requestId: '' },
      });
      return;
    }

    // subsidiary_manager: check access
    if (req.frsUser!.role === 'subsidiary_manager') {
      const accessRows = await db
        .select({ corporateId: userCorporateAccesses.corporateId })
        .from(userCorporateAccesses)
        .where(and(
          eq(userCorporateAccesses.userId, req.frsUser!.userId),
          eq(userCorporateAccesses.corporateId, (alert as any).corporateId)
        ));
      if (accessRows.length === 0) {
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
  router.patch('/:id/acknowledge', authorize('alerts', 'write'), async (req: Request, res: Response) => {
    const alert = await getAlertById(req.params.id);
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

    const updated = await acknowledgeAlert(req.params.id, req.frsUser!.userId);
    res.json(updated);
  });

  return router;
}

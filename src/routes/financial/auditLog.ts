// Audit Log API Routes
// Requirements: 10.7, 11.7

import { Router, Request, Response } from 'express';
import Database from 'better-sqlite3';
import { requireFRSAuth } from '../../middleware/frsAuth';
import { authorize } from '../../middleware/frsRbac';
import { getFRSAuditLog } from '../../services/financial/auditLogService';

export function createAuditLogRouter(db: Database.Database): Router {
  const router = Router();
  router.use(requireFRSAuth);

  /**
   * GET /api/frs/audit-log
   * Retrieve audit log entries with optional filters.
   * Supports filtering by action='export' for export history (Req 10.7).
   * Requirements: 10.7, 11.7
   */
  router.get('/', authorize('audit_log', 'read', db), (req: Request, res: Response) => {
    const {
      userId,
      subsidiaryId,
      entityType,
      action,
      startDate,
      endDate,
      limit,
      offset,
    } = req.query as Record<string, string>;

    const entries = getFRSAuditLog(db, {
      userId,
      subsidiaryId,
      entityType,
      action,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      limit: limit ? parseInt(limit, 10) : 100,
      offset: offset ? parseInt(offset, 10) : 0,
    });

    res.json(entries);
  });

  return router;
}

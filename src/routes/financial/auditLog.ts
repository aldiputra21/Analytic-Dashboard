// Audit Log API Routes
// Requirements: 10.7, 11.7

import { Router, Request, Response } from 'express';
import { requirePermission } from '../../middleware/rbac';
import { getFRSAuditLog } from '../../services/financial/auditLogService';

export function createAuditLogRouter(): Router {
  const router = Router();

  /**
   * GET /api/frs/audit-log
   * Retrieve audit log entries with optional filters.
   * Supports filtering by action='export' for export history (Req 10.7).
   * Requirements: 10.7, 11.7
   */
  router.get('/', requirePermission('cfd.audit_log.read'), async (req: Request, res: Response) => {
    const {
      userId,
      departmentId,
      entityType,
      action,
      startDate,
      endDate,
      limit,
      offset,
    } = req.query as Record<string, string>;

    const entries = await getFRSAuditLog({
      userId,
      departmentId,
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

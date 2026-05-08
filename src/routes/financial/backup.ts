// Backup and Restore API Routes
// Requirements: 14.1, 14.3, 14.6, 14.8

import { Router, Request, Response } from 'express';
import { requirePermission } from '../../middleware/rbac';
import { listBackups } from '../../services/financial/backupService';

export function createBackupRouter(): Router {
  const router = Router();

  /**
   * POST /api/frs/backup — INACTIVE
   * Backup was previously SQLite-based and has been decommissioned.
   */
  router.post('/', requirePermission('cfd.config.write'), (_req: Request, res: Response) => {
    res.status(501).json({ error: { code: 'NOT_IMPLEMENTED', message: 'Backup endpoint is currently inactive' } });
  });

  /**
   * GET /api/frs/backup
   * List available backups (Owner only).
   * Requirements: 14.1
   */
  router.get('/', requirePermission('cfd.config.read'), (_req: Request, res: Response) => {
    const backups = listBackups();
    res.json(backups);
  });

  /**
   * POST /api/frs/backup/restore — INACTIVE
   * Restore was previously SQLite-based and has been decommissioned.
   */
  router.post('/restore', requirePermission('cfd.config.write'), (_req: Request, res: Response) => {
    res.status(501).json({ error: { code: 'NOT_IMPLEMENTED', message: 'Restore endpoint is currently inactive' } });
  });

  return router;
}

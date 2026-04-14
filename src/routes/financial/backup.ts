// Backup and Restore API Routes
// Requirements: 14.1, 14.3, 14.6, 14.8

import { Router, Request, Response } from 'express';
import { requireFRSAuth } from '../../middleware/frsAuth';
import { authorize } from '../../middleware/frsRbac';
import {
  backupDatabase,
  restoreDatabase,
  listBackups,
  logBackupOperation,
} from '../../services/financial/backupService';

export function createBackupRouter(): Router {
  const router = Router();
  router.use(requireFRSAuth);

  /**
   * POST /api/frs/backup
   * Trigger a manual database backup (Owner only).
   * Requirements: 14.1, 14.3, 14.6
   */
  router.post('/', authorize('config', 'read'), async (req: Request, res: Response) => {
    const result = await backupDatabase();
    await logBackupOperation('backup', req.frsUser!.userId, result);

    if (!result.success) {
      res.status(500).json({
        error: {
          code: 'FRS_BACKUP_ERROR',
          message: result.error ?? 'Backup failed',
          timestamp: new Date().toISOString(),
          requestId: Math.random().toString(36).slice(2),
        },
      });
      return;
    }

    res.json({
      success: true,
      backupPath: result.backupPath,
      timestamp: result.timestamp,
    });
  });

  /**
   * GET /api/frs/backup
   * List available backups (Owner only).
   * Requirements: 14.1
   */
  router.get('/', authorize('config', 'read'), (_req: Request, res: Response) => {
    const backups = listBackups();
    res.json(backups);
  });

  /**
   * POST /api/frs/backup/restore
   * Restore database from a backup file (Owner only).
   * Requirements: 14.6, 14.8
   */
  router.post('/restore', authorize('config', 'read'), async (req: Request, res: Response) => {
    const { filename } = req.body;

    if (!filename) {
      res.status(400).json({
        error: {
          code: 'FRS_VALIDATION_ERROR',
          message: 'filename is required',
          timestamp: new Date().toISOString(),
          requestId: Math.random().toString(36).slice(2),
        },
      });
      return;
    }

    const result = await restoreDatabase(filename);
    await logBackupOperation('restore', req.frsUser!.userId, result);

    if (!result.success) {
      res.status(500).json({
        error: {
          code: 'FRS_RESTORE_ERROR',
          message: result.error ?? 'Restore failed',
          timestamp: new Date().toISOString(),
          requestId: Math.random().toString(36).slice(2),
        },
      });
      return;
    }

    res.json({ success: true, timestamp: result.timestamp });
  });

  return router;
}

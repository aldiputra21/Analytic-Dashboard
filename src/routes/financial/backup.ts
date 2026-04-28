// Backup and Restore API Routes
// Requirements: 14.1, 14.3, 14.6, 14.8

import { Router, Request, Response } from 'express';
import { requirePermission } from '../../middleware/rbac';
import { asyncHandler } from '../../utils/asyncHandler';
import {
  backupDatabase,
  restoreDatabase,
  listBackups,
  logBackupOperation,
} from '../../services/financial/backupService';
import { AppError, ErrorCode } from '../../utils/errors.js';

export function createBackupRouter(): Router {
  const router = Router();

  /**
   * POST /api/frs/backup
   * Trigger a manual database backup (Owner only).
   * Requirements: 14.1, 14.3, 14.6
   */
  router.post('/', requirePermission('cfd.config.write'), asyncHandler(async (req: Request, res: Response) => {
    const result = await backupDatabase();
    await logBackupOperation('backup', req.user!.userId, result);

    if (!result.success) {
      throw AppError.internal(result.error ?? 'Backup failed');
    }

    res.json({
      success: true,
      backupPath: result.backupPath,
      timestamp: result.timestamp,
    });
  }));

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
   * POST /api/frs/backup/restore
   * Restore database from a backup file (Owner only).
   * Requirements: 14.6, 14.8
   */
  router.post('/restore', requirePermission('cfd.config.write'), asyncHandler(async (req: Request, res: Response) => {
    const { filename } = req.body;

    if (!filename) {
      throw AppError.badRequest(ErrorCode.VALIDATION_ERROR, 'filename is required');
    }

    const result = await restoreDatabase(filename);
    await logBackupOperation('restore', req.user!.userId, result);

    if (!result.success) {
      throw AppError.internal(result.error ?? 'Restore failed');
    }

    res.json({ success: true, timestamp: result.timestamp });
  }));

  return router;
}

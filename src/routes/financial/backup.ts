// Backup and Restore API Routes
// Requirements: 14.1, 14.3, 14.6, 14.8

import { Router, Request, Response } from 'express';
import Database from 'better-sqlite3';
import { requireFRSAuth } from '../../middleware/frsAuth';
import { authorize } from '../../middleware/frsRbac';
import {
  backupDatabase,
  restoreDatabase,
  listBackups,
  logBackupOperation,
} from '../../services/financial/backupService';

const DB_PATH = process.env.DATABASE_URL ?? './finance.db';

export function createBackupRouter(db: Database.Database): Router {
  const router = Router();
  router.use(requireFRSAuth);

  /**
   * POST /api/frs/backup
   * Trigger a manual database backup (Owner only).
   * Requirements: 14.1, 14.3, 14.6
   */
  router.post('/', authorize('config', 'read', db), async (req: Request, res: Response) => {
    const result = await backupDatabase(db, DB_PATH);
    logBackupOperation(db, 'backup', req.frsUser!.userId, result);

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
  router.get('/', authorize('config', 'read', db), (_req: Request, res: Response) => {
    const backups = listBackups();
    res.json(backups);
  });

  /**
   * POST /api/frs/backup/restore
   * Restore database from a backup file (Owner only).
   * Requirements: 14.6, 14.8
   */
  router.post('/restore', authorize('config', 'read', db), (req: Request, res: Response) => {
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

    const backupDir = process.env.BACKUP_LOCATION ?? './backups';
    const backupFilePath = `${backupDir}/${filename}`;

    const result = restoreDatabase(backupFilePath, DB_PATH);
    logBackupOperation(db, 'restore', req.frsUser!.userId, result);

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

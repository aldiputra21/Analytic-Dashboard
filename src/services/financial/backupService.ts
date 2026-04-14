// Backup and Restore Service
// PostgreSQL implementation — Neon Cloud manages automated backups.
// This module provides manual backup/restore via pg_dump/pg_restore
// and audit-logging of backup operations.

import { sql } from 'drizzle-orm';
import { db } from '../../db/connection';
import { auditLogs } from '../../db/schema';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';

const execAsync = promisify(exec);
const BACKUP_DIR = process.env.BACKUP_LOCATION ?? './backups';

export interface BackupResult {
  success: boolean;
  backupPath?: string;
  error?: string;
  timestamp: string;
}

export interface RestoreResult {
  success: boolean;
  error?: string;
  timestamp: string;
}

/**
 * Performs a PostgreSQL backup using pg_dump.
 * Requires pg_dump to be available in PATH and DATABASE_URL env var.
 */
export async function backupDatabase(): Promise<BackupResult> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFileName = `cfd-backup-${timestamp}.sql.gz`;

  try {
    if (!fs.existsSync(BACKUP_DIR)) {
      fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }

    const backupPath = path.join(BACKUP_DIR, backupFileName);
    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
      return { success: false, error: 'DATABASE_URL not configured', timestamp: new Date().toISOString() };
    }

    await execAsync(`pg_dump "${databaseUrl}" | gzip > "${backupPath}"`);

    return { success: true, backupPath, timestamp: new Date().toISOString() };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: message, timestamp: new Date().toISOString() };
  }
}

/**
 * Restores the database from a pg_dump backup file.
 * WARNING: This drops and recreates all objects. Use with caution.
 */
export async function restoreDatabase(backupFilePath: string): Promise<RestoreResult> {
  try {
    if (!fs.existsSync(backupFilePath)) {
      return { success: false, error: 'Backup file not found', timestamp: new Date().toISOString() };
    }

    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      return { success: false, error: 'DATABASE_URL not configured', timestamp: new Date().toISOString() };
    }

    const isGzip = backupFilePath.endsWith('.gz');
    const cmd = isGzip
      ? `gunzip -c "${backupFilePath}" | psql "${databaseUrl}"`
      : `psql "${databaseUrl}" < "${backupFilePath}"`;

    await execAsync(cmd);

    return { success: true, timestamp: new Date().toISOString() };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: message, timestamp: new Date().toISOString() };
  }
}

/**
 * Lists available backup files.
 */
export function listBackups(): Array<{ filename: string; size: number; createdAt: Date }> {
  if (!fs.existsSync(BACKUP_DIR)) return [];

  return fs
    .readdirSync(BACKUP_DIR)
    .filter((f) => f.endsWith('.sql.gz') || f.endsWith('.sql'))
    .map((filename) => {
      const stat = fs.statSync(path.join(BACKUP_DIR, filename));
      return { filename, size: stat.size, createdAt: stat.birthtime };
    })
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

/**
 * Logs a backup or restore operation to the audit log.
 */
export async function logBackupOperation(
  action: 'backup' | 'restore',
  userId: string,
  result: BackupResult | RestoreResult,
): Promise<void> {
  try {
    await db.insert(auditLogs).values({
      userId,
      action,
      module: 'frs',
      entityType: 'database_backup',
      newValues: {
        success: result.success,
        timestamp: result.timestamp,
        ...(result.success && 'backupPath' in result ? { backupPath: result.backupPath } : {}),
        ...(!result.success ? { error: result.error } : {}),
      },
    });
  } catch (err) {
    console.error('[Backup] Failed to log operation:', err);
  }
}

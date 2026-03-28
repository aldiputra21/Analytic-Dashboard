// Backup and Restore Service
// Requirements: 14.1, 14.3, 14.6, 14.8

import Database from 'better-sqlite3';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

const BACKUP_DIR = process.env.BACKUP_LOCATION ?? './backups';
const ENCRYPTION_KEY_HEX = process.env.BACKUP_ENCRYPTION_KEY ?? '';
const ALGORITHM = 'aes-256-cbc';

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
 * Derives a 32-byte key from the configured encryption key.
 */
function getEncryptionKey(): Buffer {
  if (ENCRYPTION_KEY_HEX.length >= 64) {
    return Buffer.from(ENCRYPTION_KEY_HEX.slice(0, 64), 'hex');
  }
  // Derive key using SHA-256 if not a proper hex key
  return crypto.createHash('sha256').update(ENCRYPTION_KEY_HEX || 'default-backup-key').digest();
}

/**
 * Encrypts a buffer using AES-256-CBC.
 * Requirements: 14.3
 */
function encryptBuffer(data: Buffer): Buffer {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);
  // Prepend IV to encrypted data
  return Buffer.concat([iv, encrypted]);
}

/**
 * Decrypts a buffer using AES-256-CBC.
 * Requirements: 14.3
 */
function decryptBuffer(data: Buffer): Buffer {
  const key = getEncryptionKey();
  const iv = data.slice(0, 16);
  const encrypted = data.slice(16);
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]);
}

/**
 * Performs a backup of the SQLite database with AES-256 encryption.
 * Requirements: 14.1, 14.3
 */
export async function backupDatabase(
  db: Database.Database,
  dbPath: string
): Promise<BackupResult> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFileName = `frs-backup-${timestamp}.db.enc`;

  try {
    // Ensure backup directory exists
    if (!fs.existsSync(BACKUP_DIR)) {
      fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }

    const backupPath = path.join(BACKUP_DIR, backupFileName);

    // Use SQLite's built-in backup API for consistency
    await db.backup(backupPath.replace('.enc', '.tmp'));

    // Read the temp backup and encrypt it
    const rawData = fs.readFileSync(backupPath.replace('.enc', '.tmp'));
    const encrypted = encryptBuffer(rawData);
    fs.writeFileSync(backupPath, encrypted);

    // Remove temp file
    fs.unlinkSync(backupPath.replace('.enc', '.tmp'));

    return {
      success: true,
      backupPath,
      timestamp: new Date().toISOString(),
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Restores the database from an encrypted backup file.
 * Requirements: 14.6
 */
export function restoreDatabase(
  backupFilePath: string,
  targetDbPath: string
): RestoreResult {
  try {
    if (!fs.existsSync(backupFilePath)) {
      return { success: false, error: 'Backup file not found', timestamp: new Date().toISOString() };
    }

    const encrypted = fs.readFileSync(backupFilePath);
    const decrypted = decryptBuffer(encrypted);

    // Write decrypted data to target path
    fs.writeFileSync(targetDbPath, decrypted);

    return { success: true, timestamp: new Date().toISOString() };
  } catch (err: any) {
    return { success: false, error: err.message, timestamp: new Date().toISOString() };
  }
}

/**
 * Lists available backup files.
 */
export function listBackups(): Array<{ filename: string; size: number; createdAt: Date }> {
  if (!fs.existsSync(BACKUP_DIR)) return [];

  return fs
    .readdirSync(BACKUP_DIR)
    .filter((f) => f.endsWith('.db.enc'))
    .map((filename) => {
      const stat = fs.statSync(path.join(BACKUP_DIR, filename));
      return { filename, size: stat.size, createdAt: stat.birthtime };
    })
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

/**
 * Logs a backup or restore operation to the audit log.
 * Requirements: 14.8
 */
export function logBackupOperation(
  db: Database.Database,
  action: 'backup' | 'restore',
  userId: string,
  result: BackupResult | RestoreResult
): void {
  try {
    db.prepare(`
      INSERT INTO frs_audit_log (id, user_id, action, entity_type, new_values, created_at)
      VALUES (?, ?, ?, 'database_backup', ?, CURRENT_TIMESTAMP)
    `).run(
      `al_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      userId,
      action,
      JSON.stringify({
        success: result.success,
        timestamp: result.timestamp,
        ...(result.success && 'backupPath' in result ? { backupPath: result.backupPath } : {}),
        ...(!result.success ? { error: result.error } : {}),
      }),
    );
  } catch (err) {
    console.error('[Backup] Failed to log operation:', err);
  }
}

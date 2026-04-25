// Attachment Service
// Handles file upload validation, storage, and metadata persistence for CFD realizations.

import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { eq } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { attachments, systemConfigs } from '../../db/schema/index.js';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AttachmentConfig {
  allowedExtensions: string[];
  maxFileSize: number; // bytes
}

export interface AttachmentRecord {
  id: string;
  entityType: string;
  entityId: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  createdBy: string;
  createdAt: Date;
  updatedBy: string | null;
  updatedAt: Date | null;
}

export interface UploadedFile {
  originalname: string;
  mimetype: string;
  size: number;
  path: string;
  buffer?: Buffer;
}

// ─── Defaults ─────────────────────────────────────────────────────────────────

const DEFAULT_ALLOWED_EXTENSIONS = ['png', 'jpg', 'doc', 'docx', 'xls', 'xlsx', 'pdf'];
const DEFAULT_MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

const BASE_UPLOAD_DIR = 'assets/attachments/realisasi';

// ─── Config ───────────────────────────────────────────────────────────────────

/**
 * Reads attachment configuration from system_configs.
 * Falls back to defaults if keys are not found.
 */
export async function getAttachmentConfig(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  db: NodePgDatabase<any>,
): Promise<AttachmentConfig> {
  const rows = await db
    .select()
    .from(systemConfigs)
    .where(
      eq(systemConfigs.key, 'attachment_config'),
    );

  if (rows.length > 0) {
    const value = rows[0].value as Record<string, unknown>;
    const allowedExtensions = Array.isArray(value.allowed_extensions)
      ? (value.allowed_extensions as string[])
      : DEFAULT_ALLOWED_EXTENSIONS;
    const maxFileSize =
      typeof value.max_file_size === 'number'
        ? value.max_file_size
        : DEFAULT_MAX_FILE_SIZE;
    return { allowedExtensions, maxFileSize };
  }

  // Try separate keys for backward compatibility
  const [extRow, sizeRow] = await Promise.all([
    db.select().from(systemConfigs).where(eq(systemConfigs.key, 'allowed_extensions')),
    db.select().from(systemConfigs).where(eq(systemConfigs.key, 'max_file_size')),
  ]);

  const allowedExtensions =
    extRow.length > 0 && Array.isArray(extRow[0].value)
      ? (extRow[0].value as string[])
      : DEFAULT_ALLOWED_EXTENSIONS;

  const maxFileSize =
    sizeRow.length > 0 && typeof sizeRow[0].value === 'number'
      ? (sizeRow[0].value as number)
      : DEFAULT_MAX_FILE_SIZE;

  return { allowedExtensions, maxFileSize };
}

// ─── Validation ───────────────────────────────────────────────────────────────

/**
 * Validates a file against the given config.
 * Throws a descriptive error object if validation fails.
 */
export function validateFile(
  file: Pick<UploadedFile, 'originalname' | 'size'>,
  config: AttachmentConfig,
): void {
  const ext = path.extname(file.originalname).replace('.', '').toLowerCase();

  if (!config.allowedExtensions.includes(ext)) {
    const err = new Error(
      `File extension '.${ext}' is not allowed. Allowed: ${config.allowedExtensions.join(', ')}`,
    );
    (err as Error & { code: string }).code = 'INVALID_FILE';
    throw err;
  }

  if (file.size > config.maxFileSize) {
    const fileMB = (file.size / (1024 * 1024)).toFixed(1);
    const maxMB = (config.maxFileSize / (1024 * 1024)).toFixed(0);
    const err = new Error(
      `File size ${fileMB}MB exceeds maximum allowed size of ${maxMB}MB`,
    );
    (err as Error & { code: string }).code = 'FILE_TOO_LARGE';
    throw err;
  }
}

// ─── Save ─────────────────────────────────────────────────────────────────────

/**
 * Saves a file to disk and inserts metadata into public.attachments.
 * The file must already be on disk at `file.path` (disk storage) or
 * provided as `file.buffer` (memory storage).
 */
export async function saveAttachment(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  db: NodePgDatabase<any>,
  entityType: string,
  entityId: string,
  file: UploadedFile,
  userId: string,
): Promise<AttachmentRecord> {
  const destDir = path.join(BASE_UPLOAD_DIR, entityId);
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }

  // Build a unique filename to avoid collisions
  const ext = path.extname(file.originalname);
  const baseName = path.basename(file.originalname, ext);
  const uniqueName = `${baseName}-${Date.now()}${ext}`;
  const destPath = path.join(destDir, uniqueName);

  if (file.buffer) {
    // Memory storage — write buffer to disk
    fs.writeFileSync(destPath, file.buffer);
  } else if (file.path && file.path !== destPath) {
    // Disk storage — move from temp location
    fs.renameSync(file.path, destPath);
  }

  const [record] = await db
    .insert(attachments)
    .values({
      entityType,
      entityId,
      fileName: file.originalname,
      filePath: destPath,
      fileSize: file.size,
      mimeType: file.mimetype,
      createdBy: userId,
    })
    .returning();

  return record as AttachmentRecord;
}

// ─── Delete ───────────────────────────────────────────────────────────────────

/**
 * Deletes an attachment record from DB and removes the file from disk.
 */
export async function deleteAttachment(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  db: NodePgDatabase<any>,
  attachmentId: string,
): Promise<void> {
  const rows = await db
    .select()
    .from(attachments)
    .where(eq(attachments.id, attachmentId));

  if (rows.length === 0) {
    const err = new Error(`Attachment with id '${attachmentId}' not found`);
    (err as Error & { code: string }).code = 'NOT_FOUND';
    throw err;
  }

  const record = rows[0];

  // Remove file from disk (ignore if already gone)
  if (record.filePath && fs.existsSync(record.filePath)) {
    fs.unlinkSync(record.filePath);
  }

  await db.delete(attachments).where(eq(attachments.id, attachmentId));
}

// ─── Multer Factory ───────────────────────────────────────────────────────────

/**
 * Creates a multer upload instance configured with the given AttachmentConfig.
 * Uses disk storage — files are written to a temp directory first, then moved
 * by `saveAttachment()` to the final destination.
 */
export function createMulterUpload(config: AttachmentConfig): multer.Multer {
  const tempDir = path.join(BASE_UPLOAD_DIR, '_tmp');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
      cb(null, tempDir);
    },
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname);
      const base = path.basename(file.originalname, ext);
      cb(null, `${base}-${Date.now()}${ext}`);
    },
  });

  const fileFilter: multer.Options['fileFilter'] = (_req, file, cb) => {
    const ext = path.extname(file.originalname).replace('.', '').toLowerCase();
    if (config.allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      const err = new Error(
        `File extension '.${ext}' is not allowed. Allowed: ${config.allowedExtensions.join(', ')}`,
      ) as Error & { code: string };
      err.code = 'INVALID_FILE';
      cb(err);
    }
  };

  return multer({
    storage,
    fileFilter,
    limits: {
      fileSize: config.maxFileSize,
    },
  });
}

// src/routes/financial/attachments.ts
// Attachment Download and Delete Routes
// Requirements: 2.6, 2.7

import fs from 'fs';
import path from 'path';
import { Router, Request, Response } from 'express';
import { eq } from 'drizzle-orm';
import { db } from '../../db/connection';
import { attachments } from '../../db/schema/public';
import { requirePermission } from '../../middleware/rbac';
import { deleteAttachment } from '../../services/financial/attachmentService';
import { asyncHandler } from '../../utils/asyncHandler';
import { AppError, ErrorCode } from '../../utils/errors.js';

export function createAttachmentsRouter(): Router {
  const router = Router();

  /**
   * GET /api/attachments/:id/download
   * Stream the attachment file to the client.
   * Requires auth + cfd.realizations.read permission.
   * Returns 404 if record or file not found.
   */
  router.get(
    '/:id/download',
    requirePermission('cfd.realizations.read'),
    asyncHandler(async (req: Request, res: Response) => {
      const [record] = await db
        .select()
        .from(attachments)
        .where(eq(attachments.id, req.params.id))
        .limit(1);

      if (!record) {
        throw AppError.notFound(ErrorCode.NOT_FOUND, 'Attachment not found');
      }

      const absolutePath = path.resolve(record.filePath);

      if (!fs.existsSync(absolutePath)) {
        throw AppError.notFound(ErrorCode.NOT_FOUND, 'File not found on disk');
      }

      res.setHeader('Content-Type', record.mimeType);
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${encodeURIComponent(record.fileName)}"`,
      );

      const stream = fs.createReadStream(absolutePath);
      stream.on('error', () => {
        if (!res.headersSent) {
          throw AppError.internal('Failed to stream file');
        }
      });

      return stream.pipe(res);
    })
  );

  /**
   * DELETE /api/attachments/:id
   * Delete attachment metadata from DB and the physical file from disk.
   * Requires auth + cfd.realizations.delete permission.
   */
  router.delete(
    '/:id',
    requirePermission('cfd.realizations.delete'),
    asyncHandler(async (req: Request, res: Response) => {
      try {
        await deleteAttachment(db, req.params.id);
        return res.json({ success: true });
      } catch (err) {
        const code = (err as Error & { code?: string }).code;
        if (code === 'NOT_FOUND') {
          throw AppError.notFound(ErrorCode.NOT_FOUND, 'Attachment not found');
        }
        throw err;
      }
    })
  );

  return router;
}

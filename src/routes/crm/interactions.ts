import { Router, Request, Response } from 'express';
import { requireCRMPermission } from '../../middleware/crmRbac';
import { logCreate } from '../../helpers/crmAuditLog';
import { CreateInteractionInput } from '../../types/crm';
import { db } from '../../db/connection';
import { interactions, customers, opportunities } from '../../db/schema/crm';
import { eq, desc, and, sql } from 'drizzle-orm';

// ============================================================
// Interactions Routes
// Requirements: 1.6, 1.7
// ============================================================

export function createInteractionRouter(): Router {
  const router = Router();

  // POST /api/crm/interactions - Log a new interaction
  router.post(
    '/',
    requireCRMPermission('crm:write:interaction', 'crm:write:all'),
    async (req: Request, res: Response): Promise<void> => {
      const userId = req.userId!;
      const body = req.body as CreateInteractionInput;

      // Validate required fields (Req 1.6, 1.7)
      const errors: Record<string, string[]> = {};
      if (!body.entityId?.trim()) errors.entityId = ['Entity ID wajib diisi'];
      if (!body.entityType) errors.entityType = ['Entity type wajib diisi'];
      if (!body.type) errors.type = ['Jenis interaksi wajib diisi'];
      if (!body.interactionDate) errors.interactionDate = ['Tanggal interaksi wajib diisi'];
      if (!body.summary?.trim()) errors.summary = ['Ringkasan interaksi wajib diisi'];

      if (Object.keys(errors).length > 0) {
        res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Data tidak lengkap',
            details: errors,
          },
        });
        return;
      }

      // Validate entity exists
      if (body.entityType === 'customer') {
        const [entity] = await db
          .select({ id: customers.id })
          .from(customers)
          .where(eq(customers.id, body.entityId))
          .limit(1);
        if (!entity) {
          res.status(404).json({
            error: { code: 'NOT_FOUND', message: 'Pelanggan tidak ditemukan' },
          });
          return;
        }
      } else if (body.entityType === 'opportunity') {
        const [entity] = await db
          .select({ id: opportunities.id })
          .from(opportunities)
          .where(eq(opportunities.id, body.entityId))
          .limit(1);
        if (!entity) {
          res.status(404).json({
            error: { code: 'NOT_FOUND', message: 'Opportunity tidak ditemukan' },
          });
          return;
        }
      }

      const [created] = await db.insert(interactions).values({
        entityId: body.entityId.trim(),
        entityType: body.entityType,
        type: body.type,
        interactionDate: new Date(body.interactionDate),
        summary: body.summary.trim(),
        nextAction: body.nextAction ?? null,
        nextActionDate: body.nextActionDate ? new Date(body.nextActionDate) : null,
        createdBy: userId,
      }).returning();

      await logCreate(userId, 'interaction', created.id, {
        entityId: body.entityId,
        entityType: body.entityType,
        type: body.type,
        interactionDate: body.interactionDate,
      });

      res.status(201).json(created);
    }
  );

  // GET /api/crm/interactions - List interactions with filters
  router.get(
    '/',
    requireCRMPermission('crm:read:all', 'crm:read:own'),
    async (req: Request, res: Response): Promise<void> => {
      const { entityId, entityType, type } = req.query;

      const conditions: ReturnType<typeof sql>[] = [];
      if (entityId) conditions.push(eq(interactions.entityId, entityId as string));
      if (entityType) conditions.push(eq(interactions.entityType, entityType as string));
      if (type) conditions.push(eq(interactions.type, type as string));

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const rows = await db
        .select()
        .from(interactions)
        .where(whereClause)
        .orderBy(desc(interactions.interactionDate), desc(interactions.createdAt));

      res.json(rows);
    }
  );

  return router;
}

import { Router, Request, Response } from 'express';
import Database from 'better-sqlite3';
import { requireCRMPermission } from '../../middleware/crmRbac';
import { logCreate } from '../../helpers/crmAuditLog';
import { CreateInteractionInput } from '../../types/crm';

// ============================================================
// Interactions Routes
// Requirements: 1.6, 1.7
// ============================================================

function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export function createInteractionRouter(db: Database.Database): Router {
  const router = Router();

  // POST /api/crm/interactions - Log a new interaction
  router.post(
    '/',
    requireCRMPermission('crm:write:interaction', 'crm:write:all'),
    (req: Request, res: Response): void => {
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
        const entity = db
          .prepare('SELECT id FROM crm_customers WHERE id = ?')
          .get(body.entityId);
        if (!entity) {
          res.status(404).json({
            error: { code: 'NOT_FOUND', message: 'Pelanggan tidak ditemukan' },
          });
          return;
        }
      } else if (body.entityType === 'opportunity') {
        const entity = db
          .prepare('SELECT id FROM crm_opportunities WHERE id = ?')
          .get(body.entityId);
        if (!entity) {
          res.status(404).json({
            error: { code: 'NOT_FOUND', message: 'Opportunity tidak ditemukan' },
          });
          return;
        }
      }

      const interactionId = generateId('INT');

      db.prepare(
        `INSERT INTO crm_interactions 
         (id, entity_id, entity_type, type, interaction_date, summary, next_action, next_action_date, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(
        interactionId,
        body.entityId.trim(),
        body.entityType,
        body.type,
        body.interactionDate,
        body.summary.trim(),
        body.nextAction ?? null,
        body.nextActionDate ?? null,
        userId
      );

      logCreate(db, userId, 'interaction', interactionId, {
        entityId: body.entityId,
        entityType: body.entityType,
        type: body.type,
        interactionDate: body.interactionDate,
      });

      const interaction = db
        .prepare('SELECT * FROM crm_interactions WHERE id = ?')
        .get(interactionId) as any;

      res.status(201).json(mapInteraction(interaction));
    }
  );

  // GET /api/crm/interactions - List interactions with filters
  router.get(
    '/',
    requireCRMPermission('crm:read:all', 'crm:read:own'),
    (req: Request, res: Response): void => {
      const { entityId, entityType, type } = req.query;

      let query = 'SELECT * FROM crm_interactions WHERE 1=1';
      const params: any[] = [];

      if (entityId) {
        query += ' AND entity_id = ?';
        params.push(entityId);
      }
      if (entityType) {
        query += ' AND entity_type = ?';
        params.push(entityType);
      }
      if (type) {
        query += ' AND type = ?';
        params.push(type);
      }

      query += ' ORDER BY interaction_date DESC, created_at DESC';

      const interactions = db.prepare(query).all(...params) as any[];
      res.json(interactions.map(mapInteraction));
    }
  );

  return router;
}

function mapInteraction(row: any) {
  return {
    id: row.id,
    entityId: row.entity_id,
    entityType: row.entity_type,
    type: row.type,
    interactionDate: row.interaction_date,
    summary: row.summary,
    nextAction: row.next_action,
    nextActionDate: row.next_action_date,
    createdBy: row.created_by,
    createdAt: row.created_at,
  };
}

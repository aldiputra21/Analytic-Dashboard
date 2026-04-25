// src/routes/financial/notificationConfigs.ts
// Notification Configs CRUD Routes
// Requirements: 6.5, 6.6, 6.7

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { eq, and, count } from 'drizzle-orm';
import { db } from '../../db/connection';
import { notificationConfigs, roles } from '../../db/schema/public';
import { requirePermission } from '../../middleware/rbac';

// ---------------------------------------------------------------------------
// Zod Schemas
// ---------------------------------------------------------------------------

const createNotificationConfigSchema = z.object({
  module: z.string().min(1).max(50),
  eventType: z.string().min(1).max(100),
  roleId: z.string().uuid(),
  isActive: z.boolean().default(true),
});

const updateNotificationConfigSchema = z.object({
  module: z.string().min(1).max(50).optional(),
  eventType: z.string().min(1).max(100).optional(),
  roleId: z.string().uuid().optional(),
  isActive: z.boolean().optional(),
});

// ---------------------------------------------------------------------------
// Helper: detect unique constraint violation
// ---------------------------------------------------------------------------

function isUniqueViolation(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    (err as { code: string }).code === '23505'
  );
}

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------

export function createNotificationConfigsRouter(): Router {
  const router = Router();

  /**
   * GET /api/notification-configs
   * List notification configs with optional module, eventType filter, and pagination.
   */
  router.get('/', requirePermission('public.notification_configs.read'), async (req: Request, res: Response) => {
    const module = req.query.module as string | undefined;
    const eventType = req.query.eventType as string | undefined;
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize as string) || 20));
    const offset = (page - 1) * pageSize;

    const conditions = [];

    if (module) {
      conditions.push(eq(notificationConfigs.module, module));
    }

    if (eventType) {
      conditions.push(eq(notificationConfigs.eventType, eventType));
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [records, [{ totalCount }]] = await Promise.all([
      db
        .select({
          id: notificationConfigs.id,
          module: notificationConfigs.module,
          eventType: notificationConfigs.eventType,
          roleId: notificationConfigs.roleId,
          roleName: roles.name,
          roleDescription: roles.description,
          isActive: notificationConfigs.isActive,
          createdBy: notificationConfigs.createdBy,
          createdAt: notificationConfigs.createdAt,
          updatedBy: notificationConfigs.updatedBy,
          updatedAt: notificationConfigs.updatedAt,
        })
        .from(notificationConfigs)
        .leftJoin(roles, eq(roles.id, notificationConfigs.roleId))
        .where(where)
        .orderBy(notificationConfigs.module, notificationConfigs.eventType)
        .limit(pageSize)
        .offset(offset),
      db
        .select({ totalCount: count() })
        .from(notificationConfigs)
        .where(where),
    ]);

    res.json({ records, totalCount: Number(totalCount) });
  });

  /**
   * POST /api/notification-configs
   * Create a new notification config. Owner-only.
   */
  router.post('/', requirePermission('public.notification_configs.write'), async (req: Request, res: Response) => {
    const parsed = createNotificationConfigSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: parsed.error.issues.map((e) => ({ field: e.path.join('.'), message: e.message })),
        },
      });
    }

    const { module, eventType, roleId, isActive } = parsed.data;

    try {
      const [config] = await db
        .insert(notificationConfigs)
        .values({
          module,
          eventType,
          roleId,
          isActive,
          createdBy: req.user!.userId,
        })
        .returning();

      return res.status(201).json(config);
    } catch (err) {
      if (isUniqueViolation(err)) {
        return res.status(409).json({
          error: {
            code: 'CONFLICT',
            message: `A notification config for module '${module}', event '${eventType}', and this role already exists`,
          },
        });
      }
      throw err;
    }
  });

  /**
   * GET /api/notification-configs/:id
   * Get a single notification config by ID.
   */
  router.get('/:id', requirePermission('public.notification_configs.read'), async (req: Request, res: Response) => {
    const [config] = await db
      .select()
      .from(notificationConfigs)
      .where(eq(notificationConfigs.id, req.params.id))
      .limit(1);

    if (!config) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Notification config not found' },
      });
    }

    return res.json(config);
  });

  /**
   * PUT /api/notification-configs/:id
   * Update a notification config. Owner-only.
   */
  router.put('/:id', requirePermission('public.notification_configs.write'), async (req: Request, res: Response) => {
    const parsed = updateNotificationConfigSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: parsed.error.issues.map((e) => ({ field: e.path.join('.'), message: e.message })),
        },
      });
    }

    const [existing] = await db
      .select()
      .from(notificationConfigs)
      .where(eq(notificationConfigs.id, req.params.id))
      .limit(1);

    if (!existing) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Notification config not found' },
      });
    }

    try {
      const [updated] = await db
        .update(notificationConfigs)
        .set({
          ...parsed.data,
          updatedBy: req.user!.userId,
          updatedAt: new Date(),
        })
        .where(eq(notificationConfigs.id, req.params.id))
        .returning();

      return res.json(updated);
    } catch (err) {
      if (isUniqueViolation(err)) {
        return res.status(409).json({
          error: {
            code: 'CONFLICT',
            message: `A notification config for this module, event type, and role combination already exists`,
          },
        });
      }
      throw err;
    }
  });

  /**
   * DELETE /api/notification-configs/:id
   * Delete a notification config. Owner-only.
   */
  router.delete('/:id', requirePermission('public.notification_configs.delete'), async (req: Request, res: Response) => {
    const [existing] = await db
      .select()
      .from(notificationConfigs)
      .where(eq(notificationConfigs.id, req.params.id))
      .limit(1);

    if (!existing) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Notification config not found' },
      });
    }

    await db.delete(notificationConfigs).where(eq(notificationConfigs.id, req.params.id));

    return res.json({ success: true });
  });

  return router;
}

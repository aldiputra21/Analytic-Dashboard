// src/routes/financial/notificationConfigs.ts
// Notification Configs CRUD Routes
// Requirements: 6.5, 6.6, 6.7

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { eq, and, count } from 'drizzle-orm';
import { db } from '../../db/connection';
import { notificationConfigs, roles } from '../../db/schema/public';
import { requirePermission, injectAccessContext, requireScope } from '../../middleware/rbac';
import { asyncHandler } from '../../utils/asyncHandler';
import { AppError, ErrorCode } from '../../utils/errors';

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
// Router
// ---------------------------------------------------------------------------

export function createNotificationConfigsRouter(): Router {
  const router = Router();

  /**
   * GET /api/notification-configs
   * List notification configs with optional module, eventType filter, and pagination.
   */
  router.get('/', requirePermission('public.notification_configs.read'), injectAccessContext, asyncHandler(async (req: Request, res: Response) => {
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
  }));

  /**
   * POST /api/notification-configs
   * Create a new notification config. Owner-only.
   */
  router.post('/', 
    requirePermission('public.notification_configs.write'), 
    injectAccessContext, 
    requireScope('system'), 
    asyncHandler(async (req: Request, res: Response) => {
    const data = createNotificationConfigSchema.parse(req.body);

    const { module, eventType, roleId, isActive } = data;

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
  }));

  /**
   * GET /api/notification-configs/:id
   * Get a single notification config by ID.
   */
  router.get('/:id', requirePermission('public.notification_configs.read'), injectAccessContext, asyncHandler(async (req: Request, res: Response) => {
    const [config] = await db
      .select()
      .from(notificationConfigs)
      .where(eq(notificationConfigs.id, req.params.id))
      .limit(1);

    if (!config) {
      throw AppError.notFound(ErrorCode.NOTIFICATION_CONFIG_NOT_FOUND, 'Notification config not found');
    }

    return res.json(config);
  }));

  /**
   * PUT /api/notification-configs/:id
   * Update a notification config. Owner-only.
   */
  router.put('/:id', 
    requirePermission('public.notification_configs.write'), 
    injectAccessContext, 
    requireScope('system'), 
    asyncHandler(async (req: Request, res: Response) => {
    const data = updateNotificationConfigSchema.parse(req.body);

    const [existing] = await db
      .select()
      .from(notificationConfigs)
      .where(eq(notificationConfigs.id, req.params.id))
      .limit(1);

    if (!existing) {
      throw AppError.notFound(ErrorCode.NOTIFICATION_CONFIG_NOT_FOUND, 'Notification config not found');
    }

    const [updated] = await db
      .update(notificationConfigs)
      .set({
        ...data,
        updatedBy: req.user!.userId,
        updatedAt: new Date(),
      })
      .where(eq(notificationConfigs.id, req.params.id))
      .returning();

    return res.json(updated);
  }));

  /**
   * DELETE /api/notification-configs/:id
   * Delete a notification config. Owner-only.
   */
  router.delete('/:id', 
    requirePermission('public.notification_configs.delete'), 
    injectAccessContext, 
    requireScope('system'), 
    asyncHandler(async (req: Request, res: Response) => {
    const [existing] = await db
      .select()
      .from(notificationConfigs)
      .where(eq(notificationConfigs.id, req.params.id))
      .limit(1);

    if (!existing) {
      throw AppError.notFound(ErrorCode.NOT_FOUND, 'Notification config not found');
    }

    await db.delete(notificationConfigs).where(eq(notificationConfigs.id, req.params.id));

    return res.json({ success: true });
  }));

  return router;
}

import { Router, Request, Response } from 'express';
import { and, eq } from 'drizzle-orm';
import { db } from '../../db/connection';
import { users } from '../../db/schema';
import {
  archiveNotification,
  listUserNotifications,
  markNotificationAsRead,
  subscribeNotificationEvents,
  type NotificationStatus,
} from '../../services/financial/notificationService';
import { requirePermission } from '../../middleware/rbac';
import { verifyToken } from '../../services/financial/authService';
import { asyncHandler } from '../../utils/asyncHandler';
import type { JWTPayload } from '../../types/financial/user';

const VALID_STATUSES: NotificationStatus[] = ['unread', 'read', 'archived', 'dismissed'];

function parseStatus(value: unknown): NotificationStatus | undefined {
  if (typeof value !== 'string') return undefined;
  if (VALID_STATUSES.includes(value as NotificationStatus)) {
    return value as NotificationStatus;
  }
  return undefined;
}

async function validateStreamUser(streamToken: string | null): Promise<JWTPayload | null> {
  if (!streamToken) return null;

  const payload = verifyToken(streamToken);
  if (!payload) return null;

  const [user] = await db.select({
    id: users.id,
    isActive: users.isActive,
    authzVersion: users.authzVersion,
  }).from(users)
    .where(and(eq(users.id, payload.userId), eq(users.isActive, true)))
    .limit(1);

  if (!user || user.authzVersion !== (payload.authzVersion ?? 1)) {
    return null;
  }

  return payload;
}

export function createNotificationsRouter(): Router {
  const router = Router();

  router.get('/stream', asyncHandler(async (req: Request, res: Response) => {
    const streamToken = typeof req.query.token === 'string' ? req.query.token : null;
    const streamUser = await validateStreamUser(streamToken);

    if (!streamUser) {
      res.status(401).json({
        error: {
          code: 'FRS_UNAUTHORIZED',
          message: 'Authentication required',
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] ?? '',
        },
      });
      return;
    }

    const userId = streamUser.userId;

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const writeSseEvent = (event: string, data: unknown): void => {
      res.write(`event: ${event}\n`);
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    writeSseEvent('connected', {
      connectedAt: new Date().toISOString(),
      fallback: '/api/frs/notifications',
    });

    const unsubscribe = subscribeNotificationEvents(userId, (event) => {
      writeSseEvent('notification', event);
    });

    const heartbeat = setInterval(() => {
      res.write(': heartbeat\n\n');
    }, 25000);

    req.on('close', () => {
      clearInterval(heartbeat);
      unsubscribe();
      res.end();
    });
  }));

  router.get('/', requirePermission('cfd.notifications.read'), asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const status = parseStatus(req.query.status);
    const before = typeof req.query.before === 'string' ? req.query.before : undefined;
    const limitRaw = typeof req.query.limit === 'string' ? Number(req.query.limit) : undefined;

    const notifications = await listUserNotifications({
      userId,
      status,
      before,
      limit: Number.isFinite(limitRaw) ? limitRaw : undefined,
    });

    res.json(notifications);
  }));

  router.patch('/:id/read', requirePermission('cfd.notifications.write'), asyncHandler(async (req: Request, res: Response) => {
    const updated = await markNotificationAsRead(req.params.id, req.user!.userId);
    if (!updated) {
      res.status(404).json({
        error: {
          code: 'FRS_NOTIFICATION_NOT_FOUND',
          message: 'Notification not found',
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] ?? '',
        },
      });
      return;
    }

    res.json(updated);
  }));

  router.patch('/:id/archive', requirePermission('cfd.notifications.write'), asyncHandler(async (req: Request, res: Response) => {
    const updated = await archiveNotification(req.params.id, req.user!.userId);
    if (!updated) {
      res.status(404).json({
        error: {
          code: 'FRS_NOTIFICATION_NOT_FOUND',
          message: 'Notification not found',
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] ?? '',
        },
      });
      return;
    }

    res.json(updated);
  }));

  return router;
}

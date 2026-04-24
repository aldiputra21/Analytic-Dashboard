import { EventEmitter } from 'events';
import { and, desc, eq, lt } from 'drizzle-orm';
import { db } from '../../db/connection';
import { notifications } from '../../db/schema';

export type NotificationStatus = 'unread' | 'read' | 'archived' | 'dismissed';
export type NotificationSeverity = 'low' | 'medium' | 'high';
export type NotificationEventType = 'created' | 'read' | 'archived';

export interface NotificationRealtimeEvent {
  type: NotificationEventType;
  userId: string;
  notificationId: string;
  occurredAt: string;
}

interface ListNotificationsParams {
  userId: string;
  status?: NotificationStatus;
  limit?: number;
  before?: string;
}

interface CreateNotificationInput {
  sourceModule: string;
  sourceEntityType: string;
  sourceEntityId: string;
  recipientUserId: string;
  recipientRoleId?: string;
  category: string;
  templateKey: string;
  templateVars?: Record<string, unknown>;
  payload?: Record<string, unknown>;
  severity?: NotificationSeverity;
  createdBy?: string;
}

const notificationEvents = new EventEmitter();
notificationEvents.setMaxListeners(0);

function toEventChannel(userId: string): string {
  return `notifications:${userId}`;
}

function emitNotificationEvent(event: NotificationRealtimeEvent): void {
  notificationEvents.emit(toEventChannel(event.userId), event);
}

export function subscribeNotificationEvents(
  userId: string,
  listener: (event: NotificationRealtimeEvent) => void,
): () => void {
  const channel = toEventChannel(userId);
  notificationEvents.on(channel, listener);
  return () => {
    notificationEvents.off(channel, listener);
  };
}

export async function listUserNotifications(params: ListNotificationsParams) {
  const { userId, status, limit = 50, before } = params;
  const safeLimit = Math.min(Math.max(limit, 1), 100);

  const conditions = [eq(notifications.recipientUserId, userId)];
  if (status) {
    conditions.push(eq(notifications.status, status));
  }

  if (before) {
    const beforeDate = new Date(before);
    if (!Number.isNaN(beforeDate.getTime())) {
      conditions.push(lt(notifications.createdAt, beforeDate));
    }
  }

  return db.select().from(notifications)
    .where(and(...conditions))
    .orderBy(desc(notifications.createdAt))
    .limit(safeLimit);
}

export async function createNotification(input: CreateNotificationInput) {
  const [created] = await db.insert(notifications).values({
    sourceModule: input.sourceModule,
    sourceEntityType: input.sourceEntityType,
    sourceEntityId: input.sourceEntityId,
    recipientUserId: input.recipientUserId,
    recipientRoleId: input.recipientRoleId,
    category: input.category,
    templateKey: input.templateKey,
    templateVars: input.templateVars ?? {},
    payload: input.payload ?? {},
    severity: input.severity ?? 'medium',
    status: 'unread',
    createdBy: input.createdBy,
  }).returning();

  if (created) {
    emitNotificationEvent({
      type: 'created',
      userId: created.recipientUserId,
      notificationId: created.id,
      occurredAt: new Date().toISOString(),
    });
  }

  return created;
}

export async function markNotificationAsRead(notificationId: string, userId: string) {
  const [updated] = await db.update(notifications)
    .set({
      status: 'read',
      readAt: new Date(),
      readBy: userId,
      updatedBy: userId,
      updatedAt: new Date(),
    })
    .where(and(
      eq(notifications.id, notificationId),
      eq(notifications.recipientUserId, userId),
    ))
    .returning();

  if (updated) {
    emitNotificationEvent({
      type: 'read',
      userId,
      notificationId,
      occurredAt: new Date().toISOString(),
    });
  }

  return updated;
}

export async function archiveNotification(notificationId: string, userId: string) {
  const [updated] = await db.update(notifications)
    .set({
      status: 'archived',
      updatedBy: userId,
      updatedAt: new Date(),
    })
    .where(and(
      eq(notifications.id, notificationId),
      eq(notifications.recipientUserId, userId),
    ))
    .returning();

  if (updated) {
    emitNotificationEvent({
      type: 'archived',
      userId,
      notificationId,
      occurredAt: new Date().toISOString(),
    });
  }

  return updated;
}

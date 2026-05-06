import { EventEmitter } from 'events';
import { and, desc, eq, lt, inArray, sql } from 'drizzle-orm';
import { db } from '../../db/connection';
import { notifications, notificationBroadcasts, users, userCorporateAccesses } from '../../db/schema';

export type NotificationStatus = 'unread' | 'read' | 'archived' | 'dismissed';
export type NotificationSeverity = 'low' | 'medium' | 'high';
export type NotificationEventType = 'created' | 'read' | 'archived';

export interface BroadcastNotificationInput {
  message: string;
  severity: NotificationSeverity;
  targetRoles?: string[];
  targetUsers?: string[];
  targetCorporates?: string[];
  targetDepartments?: string[];
  sentBy: string;
}

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

export async function upsertNotification(input: CreateNotificationInput & { conflictEntityId?: string; conflictEntityType?: string }) {
  const sourceEntityType = input.conflictEntityType ?? input.sourceEntityType;
  const sourceEntityId = input.conflictEntityId ?? input.sourceEntityId;

  const [existing] = await db.select().from(notifications)
    .where(and(
      eq(notifications.sourceModule, input.sourceModule),
      eq(notifications.sourceEntityType, sourceEntityType),
      eq(notifications.sourceEntityId, sourceEntityId),
      eq(notifications.recipientUserId, input.recipientUserId)
    ))
    .limit(1);

  if (existing) {
    const [updated] = await db.update(notifications)
      .set({
        templateKey: input.templateKey,
        templateVars: input.templateVars ?? {},
        payload: input.payload ?? {},
        severity: input.severity ?? 'medium',
        status: 'unread',
        updatedBy: input.createdBy,
        updatedAt: new Date(),
      })
      .where(eq(notifications.id, existing.id))
      .returning();

    if (updated) {
      emitNotificationEvent({
        type: 'created', // Treat update to unread as a new notification for the user
        userId: updated.recipientUserId,
        notificationId: updated.id,
        occurredAt: new Date().toISOString(),
      });
    }
    return updated;
  }

  return createNotification(input);
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

export async function broadcastNotification(input: BroadcastNotificationInput) {
  return db.transaction(async (tx) => {
    // 1. Determine recipients
    const conditions = [eq(users.isActive, true)];

    // Inclusive Target (User OR Role)
    const targetConditions = [];
    if (input.targetUsers && input.targetUsers.length > 0) {
      targetConditions.push(inArray(users.id, input.targetUsers));
    }
    if (input.targetRoles && input.targetRoles.length > 0) {
      targetConditions.push(inArray(userCorporateAccesses.roleId, input.targetRoles));
    }

    if (targetConditions.length > 0) {
      conditions.push(sql`(${sql.join(targetConditions, sql` OR `)})`);
    }

    // Context Filters (AND Corporate AND Department)
    if (input.targetCorporates && input.targetCorporates.length > 0) {
      conditions.push(inArray(userCorporateAccesses.corporateId, input.targetCorporates));
    }
    if (input.targetDepartments && input.targetDepartments.length > 0) {
      conditions.push(inArray(userCorporateAccesses.departmentId, input.targetDepartments));
    }

    const recipientIds = (await tx.selectDistinct({ id: users.id })
      .from(users)
      .leftJoin(userCorporateAccesses, eq(users.id, userCorporateAccesses.userId))
      .where(and(...conditions))).map(r => r.id);

    if (recipientIds.length === 0) {
      throw new Error('No recipients found for the specified broadcast criteria');
    }

    // 2. Insert into notification_broadcasts
    const [broadcast] = await tx.insert(notificationBroadcasts).values({
      message: input.message,
      severity: input.severity,
      targetRoles: input.targetRoles ?? [],
      targetUsers: input.targetUsers ?? [],
      targetCorporates: input.targetCorporates ?? [],
      targetDepartments: input.targetDepartments ?? [],
      recipientCount: recipientIds.length,
      sentBy: input.sentBy,
      createdBy: input.sentBy,
    }).returning();

    // 3. Insert into notifications (Bulk)
    const notificationEntries = recipientIds.map(userId => ({
      sourceModule: 'public',
      sourceEntityType: 'broadcast',
      sourceEntityId: broadcast.id,
      recipientUserId: userId,
      category: 'system',
      templateKey: 'broadcast_message',
      payload: { message: input.message },
      severity: input.severity,
      status: 'unread' as const,
      createdBy: input.sentBy,
    }));

    await tx.insert(notifications).values(notificationEntries);

    // 4. Emit real-time events
    recipientIds.forEach(userId => {
      emitNotificationEvent({
        type: 'created',
        userId,
        notificationId: broadcast.id,
        occurredAt: new Date().toISOString(),
      });
    });

    return broadcast;
  });
}

export async function listBroadcastHistory(limit = 20) {
  return db.select()
    .from(notificationBroadcasts)
    .orderBy(desc(notificationBroadcasts.createdAt))
    .limit(limit);
}

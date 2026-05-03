// Alert Engine Service
// Drizzle ORM PostgreSQL implementation

import { eq, and, ne, desc, sql, inArray } from 'drizzle-orm';
import { db } from '../../db/connection';
import { randomUUID } from 'node:crypto';
import { notifications, permissions, rolePermissions, userCorporateAccesses, notificationConfigs } from '../../db/schema/index.js';
import { CalculatedRatios, RatioName } from '../../types/financial/ratio';
import { Alert, AlertSeverity } from '../../types/financial/alert';
import { Threshold } from '../../types/financial/threshold';
import { getThreshold } from './thresholdService';
import { createNotification } from './notificationService';
import { queryFinancialData } from './financialDataService';
import { calculateRatios } from './ratioCalculator';

type NotificationRow = typeof notifications.$inferSelect;

interface NotificationAlertDraft {
  sourceEntityId: string;
  corporateId: string;
  departmentId: string | null;
  ratioName: RatioName;
  severity: AlertSeverity;
  currentValue: number;
  thresholdValue: number;
  messageKey: string; // Key for thresholdI18n.messages
  templateVars: Record<string, any>;
  period: string;
  createdAt: Date;
}

function mapDraftToAlert(draft: NotificationAlertDraft): Alert {
  return {
    id: draft.sourceEntityId,
    subsidiaryId: draft.corporateId,
    financialDataId: undefined,
    ratioName: draft.ratioName,
    severity: draft.severity,
    currentValue: draft.currentValue,
    thresholdValue: draft.thresholdValue,
    message: draft.messageKey, // Use key as message for frontend mapping
    status: 'active',
    createdAt: draft.createdAt,
  };
}

function mapNotificationToAlert(row: NotificationRow): Alert {
  const payload = (row.payload ?? {}) as Record<string, unknown>;
  const rawStatus = String((row as unknown as { status?: string }).status ?? 'unread');
  const legacyAcknowledgedAt = (row as unknown as { acknowledgedAt?: Date | null }).acknowledgedAt;
  const legacyAcknowledgedBy = (row as unknown as { acknowledgedBy?: string | null }).acknowledgedBy;

  const mappedStatus: Alert['status'] = rawStatus === 'unread' || rawStatus === 'active'
    ? 'active'
    : rawStatus === 'read' || rawStatus === 'acknowledged'
      ? 'acknowledged'
      : 'resolved';

  return {
    id: row.id,
    subsidiaryId: String(payload.corporateId ?? ''),
    financialDataId: String(payload.financialDataId ?? ''),
    ratioName: String(payload.ratioName ?? row.category) as RatioName,
    severity: row.severity as AlertSeverity,
    currentValue: Number(payload.currentValue ?? 0),
    thresholdValue: Number(payload.thresholdValue ?? 0),
    message: String(payload.message ?? row.templateKey),
    status: mappedStatus,
    acknowledgedAt: row.readAt ?? legacyAcknowledgedAt ?? undefined,
    acknowledgedBy: row.readBy ?? legacyAcknowledgedBy ?? undefined,
    createdAt: row.createdAt,
  };
}

async function resolveRatioAlertIfHealthy(
  corporateId: string,
  ratioName: RatioName,
): Promise<void> {
  await db.update(notifications).set({
    status: 'archived',
    updatedAt: new Date(),
  }).where(and(
    eq(notifications.sourceModule, 'cfd'),
    eq(notifications.sourceEntityType, 'dashboard-alert'),
    sql`${notifications.payload} ->> 'corporateId' = ${corporateId}`,
    sql`${notifications.payload} ->> 'ratioName' = ${ratioName}`,
    sql`${notifications.status} IN ('unread', 'read')`,
  ));
}

async function fanOutAlertNotification(draft: NotificationAlertDraft): Promise<void> {
  // 1. Get the notification configuration for ratio breach
  const [config] = await db.select()
    .from(notificationConfigs)
    .where(and(
      eq(notificationConfigs.module, 'cfd'),
      eq(notificationConfigs.eventType, 'ratio-breach'),
      eq(notificationConfigs.isActive, true)
    ))
    .limit(1);

  if (!config || !config.targetRoles || config.targetRoles.length === 0) {
    console.warn('⚠️ No active notification configuration found for cfd:ratio-breach. Alerts will not be sent.');
    return;
  }

  // 2. Resolve users who have the target roles and correct corporate scope
  const recipientRows = await db.select({
    userId: userCorporateAccesses.userId,
    roleId: userCorporateAccesses.roleId,
  })
    .from(userCorporateAccesses)
    .where(and(
      sql`
        (
          ${userCorporateAccesses.scope} = 'system'
          OR ${userCorporateAccesses.corporateId} = ${draft.corporateId}
        )
      `,
      inArray(userCorporateAccesses.roleId, config.targetRoles)
    ));

  await Promise.all(recipientRows.map(async (recipient) => {
    // Check if an existing dashboard-alert for this ratio exists for this user
    const [existing] = await db.select()
      .from(notifications)
      .where(and(
        eq(notifications.sourceModule, 'cfd'),
        eq(notifications.sourceEntityType, 'dashboard-alert'),
        eq(notifications.recipientUserId, recipient.userId),
        sql`${notifications.payload} ->> 'ratioName' = ${draft.ratioName}`,
        sql`${notifications.payload} ->> 'corporateId' = ${draft.corporateId}`
      ))
      .limit(1);

    if (existing) {
      // Re-trigger if already breached
      await db.update(notifications).set({
        status: 'unread',
        severity: draft.severity,
        templateKey: `cfd.threshold.${draft.messageKey}`,
        payload: {
          ...draft,
          updatedAt: new Date()
        },
        templateVars: draft.templateVars,
        updatedAt: new Date(),
      }).where(eq(notifications.id, existing.id));
    } else {
      // Create new
      await createNotification({
        sourceModule: 'cfd',
        sourceEntityType: 'dashboard-alert',
        sourceEntityId: draft.sourceEntityId,
        recipientUserId: recipient.userId,
        recipientRoleId: recipient.roleId,
        category: 'alert',
        templateKey: `cfd.threshold.${draft.messageKey}`,
        templateVars: draft.templateVars,
        payload: {
          corporateId: draft.corporateId,
          departmentId: draft.departmentId,
          ratioName: draft.ratioName,
          currentValue: draft.currentValue,
          thresholdValue: draft.thresholdValue,
          messageKey: draft.messageKey,
          period: draft.period,
        },
        severity: draft.severity,
      });
    }
  }));
}

function buildAlertDraft(
  corporateId: string,
  period: string,
  ratioName: RatioName,
  severity: AlertSeverity,
  currentValue: number,
  thresholdValue: number,
  messageKey: string,
  templateVars: Record<string, any>,
  departmentId?: string,
): NotificationAlertDraft {
  return {
    sourceEntityId: randomUUID(),
    corporateId,
    departmentId: departmentId ?? null,
    ratioName,
    severity,
    currentValue,
    thresholdValue,
    messageKey,
    templateVars,
    period,
    createdAt: new Date(),
  };
}

// ============================================================
// Threshold Evaluation
// ============================================================

function evaluateThresholdBreach(
  ratioName: RatioName,
  value: number,
  threshold: Threshold,
): { severity: AlertSeverity; thresholdValue: number; messageKey: string } | null {
  // "Higher is better" ratios
  if (threshold.healthyMin != null || threshold.moderateMin != null) {
    const healthyMin = threshold.healthyMin ?? Infinity;
    const moderateMin = threshold.moderateMin ?? -Infinity;

    if (value < moderateMin) {
      return {
        severity: 'high',
        thresholdValue: moderateMin,
        messageKey: 'criticallyBelow',
      };
    }
    if (value < healthyMin) {
      return {
        severity: 'medium',
        thresholdValue: healthyMin,
        messageKey: 'belowHealthy',
      };
    }
    return null;
  }

  // "Lower is better" ratios (DER)
  if (threshold.healthyMax != null || threshold.moderateMax != null) {
    const healthyMax = threshold.healthyMax ?? -Infinity;
    const moderateMax = threshold.moderateMax ?? Infinity;

    if (value > moderateMax) {
      return {
        severity: 'high',
        thresholdValue: moderateMax,
        messageKey: 'criticallyAbove',
      };
    }
    if (value > healthyMax) {
      return {
        severity: 'medium',
        thresholdValue: healthyMax,
        messageKey: 'aboveHealthy',
      };
    }
    return null;
  }

  return null;
}



// ============================================================
// Main Alert Evaluation
// ============================================================

/**
 * Evaluates ratio values against thresholds and syncs alerts (create/update/resolve).
 */
export async function evaluateAlerts(
  corporateId: string,
  period: string,
  ratios: CalculatedRatios,
  departmentId?: string,
): Promise<Alert[]> {
  const syncResults: Alert[] = [];
  const ratioNames: RatioName[] = ['roa', 'roe', 'npm', 'der', 'currentRatio', 'quickRatio', 'cashRatio', 'ocfRatio', 'dscr'];

  // Threshold-based evaluation
  for (const ratioName of ratioNames) {
    const value = ratios[ratioName] as number | null;
    
    // 1. Evaluate Breach
    const threshold = await getThreshold(corporateId, ratioName);
    const breach = (value !== null && threshold) 
      ? evaluateThresholdBreach(ratioName, value, threshold) 
      : null;

    if (breach) {
      // 2a. Sync active breach
      const draft = buildAlertDraft(
        corporateId,
        period,
        ratioName,
        breach.severity,
        value!,
        breach.thresholdValue,
        breach.messageKey,
        {
          ratio: ratioName,
          value: value!.toFixed(2),
          threshold: breach.thresholdValue.toFixed(2),
          period,
        },
        departmentId,
      );
      await fanOutAlertNotification(draft);
      syncResults.push(mapDraftToAlert(draft));
    } else {
      // 2b. Auto-resolve if no longer breached
      await resolveRatioAlertIfHealthy(corporateId, ratioName);
    }
  }

  return syncResults;
}


// ============================================================
// Negative OCF Detection
// ============================================================

export async function checkNegativeOCF(
  corporateId: string,
  period: string,
  operatingCashFlow: number,
  departmentId?: string,
): Promise<Alert | null> {
  if (operatingCashFlow >= 0) return null;

  const draft = buildAlertDraft(
    corporateId,
    period,
    'ocfRatio',
    'high',
    operatingCashFlow,
    0,
    'negativeOcf',
    {
      value: operatingCashFlow.toLocaleString(),
      period,
    },
    departmentId,
  );

  await fanOutAlertNotification(draft);

  return mapDraftToAlert(draft);
}

// ============================================================
// Declining Trend Detection
// ============================================================

/**
 * Detects 3 consecutive periods of declining ROA, ROE, or NPM.
 * Uses v_financial_ratios view via raw SQL.
 */
export async function detectDecliningTrend(
  corporateId: string,
  period: string,
  departmentId?: string,
): Promise<Alert[]> {
  const profitabilityRatios: RatioName[] = ['roa', 'roe', 'npm'];
  const result: Alert[] = [];

  for (const ratioName of profitabilityRatios) {
    const rows = (await db.execute(sql`
      SELECT ${sql.raw(ratioName)} as ratio_value, period
      FROM cfd.v_financial_ratios
      WHERE corporate_id = ${corporateId}
        AND ${sql.raw(ratioName)} IS NOT NULL
      ORDER BY period DESC
      LIMIT 3
    `)).rows as { ratio_value: string; period: string }[];

    if (rows.length < 3) continue;

    const [latest, middle, oldest] = rows.map(r => parseFloat(r.ratio_value));
    if (!(latest < middle && middle < oldest)) continue;

    const [existingNotification] = await db
      .select({ id: notifications.id })
      .from(notifications)
      .where(and(
        eq(notifications.sourceModule, 'cfd'),
        eq(notifications.sourceEntityType, 'dashboard-alert'),
        sql`${notifications.status} IN ('unread', 'read')`,
        sql`${notifications.payload} ->> 'corporateId' = ${corporateId}`,
        sql`${notifications.payload} ->> 'ratioName' = ${ratioName}`,
      ))
      .limit(1);

    if (existingNotification) continue;

    const draft = buildAlertDraft(
      corporateId,
      period,
      ratioName,
      'medium',
      latest,
      oldest,
      'decliningTrend',
      {
        ratio: ratioName,
        latest: latest.toFixed(2),
        middle: middle.toFixed(2),
        oldest: oldest.toFixed(2),
        period,
      },
      departmentId,
    );

    await fanOutAlertNotification(draft);

    result.push(mapDraftToAlert(draft));
  }

  return result;
}

// ============================================================
// Re-evaluation
// ============================================================

export async function reevaluateAlertsForSubsidiary(
  corporateId: string,
): Promise<void> {
  // Get the most recent period from the financial ratios view
  const rows = (await db.execute(sql`
    SELECT *
    FROM cfd.v_financial_ratios
    WHERE corporate_id = ${corporateId}
    ORDER BY period DESC
    LIMIT 1
  `)).rows as {
    period: string;
    roa: string | null; roe: string | null; npm: string | null;
    der: string | null; current_ratio: string | null; quick_ratio: string | null;
    cash_ratio: string | null;
  }[];

  for (const entry of rows) {
    const ratios: CalculatedRatios = {
      id: '',
      financialDataId: '',
      subsidiaryId: corporateId,
      roa: entry.roa ? parseFloat(entry.roa) : null,
      roe: entry.roe ? parseFloat(entry.roe) : null,
      npm: entry.npm ? parseFloat(entry.npm) : null,
      der: entry.der ? parseFloat(entry.der) : null,
      currentRatio: entry.current_ratio ? parseFloat(entry.current_ratio) : null,
      quickRatio: entry.quick_ratio ? parseFloat(entry.quick_ratio) : null,
      cashRatio: entry.cash_ratio ? parseFloat(entry.cash_ratio) : null,
      ocfRatio: null,
      dscr: null,
      healthScore: 0,
      calculatedAt: new Date(),
    };

    await evaluateAlerts(corporateId, entry.period, ratios);
  }
}

// ============================================================
// Alert Queries
// ============================================================

export interface AlertFilters {
  corporateId?: string | string[];
  severity?: string;
  status?: string;
  limit?: number;
  offset?: number;
  recipientUserId?: string;
}

export async function listAlerts(filters: AlertFilters): Promise<Alert[]> {
  const conditions = [
    eq(notifications.sourceModule, 'cfd'),
    eq(notifications.sourceEntityType, 'dashboard-alert'),
  ];

  if (filters.recipientUserId) {
    conditions.push(eq(notifications.recipientUserId, filters.recipientUserId));
  }

  if (filters.severity) conditions.push(eq(notifications.severity, filters.severity));
  if (filters.status === 'active') conditions.push(eq(notifications.status, 'unread'));
  if (filters.status === 'acknowledged') conditions.push(eq(notifications.status, 'read'));
  if (filters.status === 'resolved') conditions.push(eq(notifications.status, 'archived'));
  
  if (filters.corporateId) {
    if (Array.isArray(filters.corporateId)) {
      const { inArray } = await import('drizzle-orm');
      if (filters.corporateId.length > 0) {
        conditions.push(inArray(sql`${notifications.payload} ->> 'corporateId'`, filters.corporateId));
      }
    } else {
      conditions.push(eq(sql`${notifications.payload} ->> 'corporateId'`, filters.corporateId));
    }
  }

  const rows = await db.select().from(notifications)
    .where(and(...conditions))
    .orderBy(desc(notifications.createdAt))
    .limit(filters.limit ?? 50)
    .offset(filters.offset ?? 0);

  return rows.map(mapNotificationToAlert);
}

export async function getAlertById(id: string): Promise<Alert | null> {
  const [notificationRow] = await db.select().from(notifications)
    .where(and(
      eq(notifications.id, id),
      eq(notifications.sourceModule, 'cfd'),
      eq(notifications.sourceEntityType, 'dashboard-alert'),
    ))
    .limit(1);

  if (notificationRow) {
    return mapNotificationToAlert(notificationRow);
  }

  return null;
}

export async function getUserAlertById(
  id: string,
  userId: string,
): Promise<Alert | null> {
  const [notificationRow] = await db.select().from(notifications)
    .where(and(
      eq(notifications.id, id),
      eq(notifications.recipientUserId, userId),
      eq(notifications.sourceModule, 'cfd'),
      eq(notifications.sourceEntityType, 'dashboard-alert'),
    ))
    .limit(1);

  if (notificationRow) {
    return mapNotificationToAlert(notificationRow);
  }

  return null;
}

export async function acknowledgeAlert(
  id: string,
  userId: string,
): Promise<Alert | null> {
  const [notificationRow] = await db.select().from(notifications)
    .where(and(
      eq(notifications.id, id),
      eq(notifications.recipientUserId, userId),
      eq(notifications.sourceModule, 'cfd'),
      eq(notifications.sourceEntityType, 'dashboard-alert'),
    ))
    .limit(1);

  if (notificationRow) {
    const [updatedNotification] = await db.update(notifications).set({
      status: 'read',
      readAt: new Date(),
      readBy: userId,
      updatedAt: new Date(),
      updatedBy: userId,
    }).where(eq(notifications.id, id)).returning();

    return updatedNotification ? mapNotificationToAlert(updatedNotification) : null;
  }

  return null;
}

export async function getAlertHistory(filters: AlertFilters): Promise<Alert[]> {
  const conditions = [
    eq(notifications.sourceModule, 'cfd'),
    eq(notifications.sourceEntityType, 'dashboard-alert'),
    ne(notifications.status, 'unread'),
  ];

  if (filters.recipientUserId) {
    conditions.push(eq(notifications.recipientUserId, filters.recipientUserId));
  }

  if (filters.corporateId) {
    if (Array.isArray(filters.corporateId)) {
      const { inArray } = await import('drizzle-orm');
      if (filters.corporateId.length > 0) {
        conditions.push(inArray(sql`${notifications.payload} ->> 'corporateId'`, filters.corporateId));
      }
    } else {
      conditions.push(eq(sql`${notifications.payload} ->> 'corporateId'`, filters.corporateId));
    }
  }

  if (filters.severity) conditions.push(eq(notifications.severity, filters.severity));

  const rows = await db.select().from(notifications)
    .where(and(...conditions))
    .orderBy(desc(notifications.createdAt))
    .limit(filters.limit ?? 50)
    .offset(filters.offset ?? 0);

  return rows.map(mapNotificationToAlert);
}


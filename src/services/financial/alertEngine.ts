// Alert Engine Service
// Drizzle ORM PostgreSQL implementation

import { eq, and, ne, desc, sql } from 'drizzle-orm';
import { db } from '../../db/connection';
import { randomUUID } from 'node:crypto';
import { notifications, permissions, rolePermissions, userCorporateAccesses } from '../../db/schema/index.js';
import { CalculatedRatios, RatioName } from '../../types/financial/ratio';
import { Alert, AlertSeverity } from '../../types/financial/alert';
import { Threshold } from '../../types/financial/threshold';
import { getThreshold } from './thresholdService';
import { createNotification } from './notificationService';

type NotificationRow = typeof notifications.$inferSelect;

interface NotificationAlertDraft {
  sourceEntityId: string;
  corporateId: string;
  departmentId: string | null;
  ratioName: RatioName;
  severity: AlertSeverity;
  currentValue: number;
  thresholdValue: number;
  message: string;
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
    message: draft.message,
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

async function resolveActiveNotificationsForPeriod(
  corporateId: string,
  period: string,
): Promise<void> {
  await db.update(notifications).set({
    status: 'archived',
    updatedAt: new Date(),
  }).where(and(
    eq(notifications.sourceModule, 'cfd'),
    eq(notifications.sourceEntityType, 'alert'),
    sql`${notifications.payload} ->> 'corporateId' = ${corporateId}`,
    sql`${notifications.payload} ->> 'period' = ${period}`,
    sql`${notifications.status} IN ('unread', 'read')`,
  ));
}

async function fanOutAlertNotification(draft: NotificationAlertDraft): Promise<void> {
  const recipientRows = await db.select({
    userId: userCorporateAccesses.userId,
    roleId: userCorporateAccesses.roleId,
  })
    .from(userCorporateAccesses)
    .where(sql`
      (
        ${userCorporateAccesses.scope} = 'system'
        OR ${userCorporateAccesses.corporateId} = ${draft.corporateId}
      )
      AND EXISTS (
        SELECT 1
        FROM ${rolePermissions} rp
        INNER JOIN ${permissions} p ON p.id = rp.permission_id
        WHERE rp.role_id = ${userCorporateAccesses.roleId}
          AND p.key = 'cfd.alerts.read'
      )
    `);

  await Promise.all(recipientRows.map((recipient) => createNotification({
    sourceModule: 'cfd',
    sourceEntityType: 'alert',
    sourceEntityId: draft.sourceEntityId,
    recipientUserId: recipient.userId,
    recipientRoleId: recipient.roleId,
    category: 'alert',
    templateKey: 'cfd.ratio.breach',
    templateVars: {
      ratioName: draft.ratioName,
      currentValue: draft.currentValue,
      thresholdValue: draft.thresholdValue,
      period: draft.period,
    },
    payload: {
      corporateId: draft.corporateId,
      departmentId: draft.departmentId,
      ratioName: draft.ratioName,
      currentValue: draft.currentValue,
      thresholdValue: draft.thresholdValue,
      message: draft.message,
      period: draft.period,
    },
    severity: draft.severity,
  })));
}

function buildAlertDraft(
  corporateId: string,
  period: string,
  ratioName: RatioName,
  severity: AlertSeverity,
  currentValue: number,
  thresholdValue: number,
  message: string,
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
    message,
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
): { severity: AlertSeverity; thresholdValue: number; message: string } | null {
  // "Higher is better" ratios
  if (threshold.healthyMin != null || threshold.moderateMin != null) {
    const healthyMin = threshold.healthyMin ?? Infinity;
    const moderateMin = threshold.moderateMin ?? -Infinity;

    if (value < moderateMin) {
      return {
        severity: 'high',
        thresholdValue: moderateMin,
        message: `${ratioName} value ${value.toFixed(2)} is critically below threshold ${moderateMin.toFixed(2)}`,
      };
    }
    if (value < healthyMin) {
      return {
        severity: 'medium',
        thresholdValue: healthyMin,
        message: `${ratioName} value ${value.toFixed(2)} is below healthy threshold ${healthyMin.toFixed(2)}`,
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
        message: `${ratioName} value ${value.toFixed(2)} critically exceeds threshold ${moderateMax.toFixed(2)}`,
      };
    }
    if (value > healthyMax) {
      return {
        severity: 'medium',
        thresholdValue: healthyMax,
        message: `${ratioName} value ${value.toFixed(2)} exceeds healthy threshold ${healthyMax.toFixed(2)}`,
      };
    }
    return null;
  }

  return null;
}

// ============================================================
// Specific Alert Rules
// ============================================================

interface AlertCandidate {
  ratioName: RatioName;
  severity: AlertSeverity;
  currentValue: number;
  thresholdValue: number;
  message: string;
}

function buildSpecificAlerts(ratios: CalculatedRatios): AlertCandidate[] {
  const result: AlertCandidate[] = [];

  if (ratios.der !== null && ratios.der > 2.0) {
    result.push({
      ratioName: 'der',
      severity: 'high',
      currentValue: ratios.der,
      thresholdValue: 2.0,
      message: `DER ${ratios.der.toFixed(2)} exceeds critical threshold of 2.0`,
    });
  }

  if (ratios.currentRatio !== null && ratios.currentRatio < 1.0) {
    result.push({
      ratioName: 'currentRatio',
      severity: 'high',
      currentValue: ratios.currentRatio,
      thresholdValue: 1.0,
      message: `Current Ratio ${ratios.currentRatio.toFixed(2)} is below critical threshold of 1.0`,
    });
  }

  if (ratios.npm !== null && ratios.npm < 5) {
    result.push({
      ratioName: 'npm',
      severity: 'medium',
      currentValue: ratios.npm,
      thresholdValue: 5,
      message: `NPM ${ratios.npm.toFixed(2)}% is below moderate threshold of 5%`,
    });
  }

  return result;
}

// ============================================================
// Main Alert Evaluation
// ============================================================

/**
 * Evaluates ratio values against thresholds and generates alerts.
 */
export async function evaluateAlerts(
  corporateId: string,
  period: string,
  ratios: CalculatedRatios,
  departmentId?: string,
): Promise<Alert[]> {
  const generatedAlerts: Alert[] = [];

  await resolveActiveNotificationsForPeriod(corporateId, period);

  const ratioNames: RatioName[] = ['roa', 'roe', 'npm', 'der', 'currentRatio', 'quickRatio', 'cashRatio', 'ocfRatio', 'dscr'];

  // Threshold-based evaluation
  for (const ratioName of ratioNames) {
    const value = ratios[ratioName] as number | null;
    if (value === null) continue;

    const threshold = await getThreshold(corporateId, ratioName);
    if (!threshold) continue;

    const breach = evaluateThresholdBreach(ratioName, value, threshold);
    if (!breach) continue;

    const draft = buildAlertDraft(
      corporateId,
      period,
      ratioName,
      breach.severity,
      value,
      breach.thresholdValue,
      breach.message,
      departmentId,
    );

    await fanOutAlertNotification(draft);

    generatedAlerts.push(mapDraftToAlert(draft));
  }

  // Specific hard-coded alert rules
  const specificAlerts = buildSpecificAlerts(ratios);
  for (const candidate of specificAlerts) {
    const alreadyCreated = generatedAlerts.some((a) => a.ratioName === candidate.ratioName);
    if (alreadyCreated) continue;

    const draft = buildAlertDraft(
      corporateId,
      period,
      candidate.ratioName,
      candidate.severity,
      candidate.currentValue,
      candidate.thresholdValue,
      candidate.message,
      departmentId,
    );

    await fanOutAlertNotification(draft);

    generatedAlerts.push(mapDraftToAlert(draft));
  }

  return generatedAlerts;
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
    `Negative Operating Cash Flow: ${operatingCashFlow.toFixed(2)}`,
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
        eq(notifications.sourceEntityType, 'alert'),
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
      `${ratioName.toUpperCase()} shows declining trend over 3 consecutive periods: ${oldest.toFixed(2)} -> ${middle.toFixed(2)} -> ${latest.toFixed(2)}`,
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
    SELECT DISTINCT ON (department_id) *
    FROM cfd.v_financial_ratios
    WHERE corporate_id = ${corporateId}
    ORDER BY department_id, period DESC
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
    eq(notifications.sourceEntityType, 'alert'),
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
      eq(notifications.sourceEntityType, 'alert'),
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
      eq(notifications.sourceEntityType, 'alert'),
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
      eq(notifications.sourceEntityType, 'alert'),
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
    eq(notifications.sourceEntityType, 'alert'),
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


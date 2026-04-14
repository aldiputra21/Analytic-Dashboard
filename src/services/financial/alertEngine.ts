// Alert Engine Service
// Drizzle ORM PostgreSQL implementation

import { eq, and, ne, desc, sql } from 'drizzle-orm';
import { db } from '../../db/connection';
import { alerts } from '../../db/schema/index.js';
import { CalculatedRatios, RatioName } from '../../types/financial/ratio';
import { Alert, AlertSeverity } from '../../types/financial/alert';
import { Threshold } from '../../types/financial/threshold';
import { getThreshold } from './thresholdService';

type AlertRow = typeof alerts.$inferSelect;

function mapRowToAlert(row: AlertRow): Alert {
  return {
    id: row.id,
    subsidiaryId: row.corporateId,
    financialDataId: undefined,
    ratioName: row.ratioName as RatioName,
    severity: row.severity as AlertSeverity,
    currentValue: parseFloat(row.currentValue),
    thresholdValue: parseFloat(row.thresholdValue),
    message: row.message,
    status: row.status as Alert['status'],
    acknowledgedAt: row.acknowledgedAt ?? undefined,
    acknowledgedBy: row.acknowledgedBy ?? undefined,
    createdAt: row.createdAt,
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

  // Resolve existing active alerts for this corporate+period
  await db.update(alerts).set({ status: 'resolved' }).where(
    and(eq(alerts.corporateId, corporateId), eq(alerts.period, period), eq(alerts.status, 'active')),
  );

  const ratioNames: RatioName[] = ['roa', 'roe', 'npm', 'der', 'currentRatio', 'quickRatio', 'cashRatio', 'ocfRatio', 'dscr'];

  // Threshold-based evaluation
  for (const ratioName of ratioNames) {
    const value = ratios[ratioName] as number | null;
    if (value === null) continue;

    const threshold = await getThreshold(corporateId, ratioName);
    if (!threshold) continue;

    const breach = evaluateThresholdBreach(ratioName, value, threshold);
    if (!breach) continue;

    const [inserted] = await db.insert(alerts).values({
      corporateId,
      departmentId: departmentId ?? null,
      ratioName,
      severity: breach.severity,
      currentValue: value.toString(),
      thresholdValue: breach.thresholdValue.toString(),
      message: breach.message,
      status: 'active',
      period,
    }).returning();

    generatedAlerts.push(mapRowToAlert(inserted));
  }

  // Specific hard-coded alert rules
  const specificAlerts = buildSpecificAlerts(ratios);
  for (const candidate of specificAlerts) {
    const alreadyCreated = generatedAlerts.some((a) => a.ratioName === candidate.ratioName);
    if (alreadyCreated) continue;

    const [inserted] = await db.insert(alerts).values({
      corporateId,
      departmentId: departmentId ?? null,
      ratioName: candidate.ratioName,
      severity: candidate.severity,
      currentValue: candidate.currentValue.toString(),
      thresholdValue: candidate.thresholdValue.toString(),
      message: candidate.message,
      status: 'active',
      period,
    }).returning();

    generatedAlerts.push(mapRowToAlert(inserted));
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

  const [inserted] = await db.insert(alerts).values({
    corporateId,
    departmentId: departmentId ?? null,
    ratioName: 'ocfRatio',
    severity: 'high',
    currentValue: operatingCashFlow.toString(),
    thresholdValue: '0',
    message: `Negative Operating Cash Flow: ${operatingCashFlow.toFixed(2)}`,
    status: 'active',
    period,
  }).returning();

  return mapRowToAlert(inserted);
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

    // Check for existing declining trend alert
    const [existing] = await db
      .select({ id: alerts.id })
      .from(alerts)
      .where(and(
        eq(alerts.corporateId, corporateId),
        eq(alerts.ratioName, ratioName),
        eq(alerts.status, 'active'),
      ))
      .limit(1);

    if (existing) continue;

    const [inserted] = await db.insert(alerts).values({
      corporateId,
      departmentId: departmentId ?? null,
      ratioName,
      severity: 'medium',
      currentValue: latest.toString(),
      thresholdValue: oldest.toString(),
      message: `${ratioName.toUpperCase()} shows declining trend over 3 consecutive periods: ${oldest.toFixed(2)} → ${middle.toFixed(2)} → ${latest.toFixed(2)}`,
      status: 'active',
      period,
    }).returning();

    result.push(mapRowToAlert(inserted));
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
  corporateId?: string;
  severity?: string;
  status?: string;
  limit?: number;
  offset?: number;
}

export async function listAlerts(filters: AlertFilters): Promise<Alert[]> {
  const conditions = [];

  if (filters.corporateId) conditions.push(eq(alerts.corporateId, filters.corporateId));
  if (filters.severity) conditions.push(eq(alerts.severity, filters.severity));
  if (filters.status) conditions.push(eq(alerts.status, filters.status));

  const limit = filters.limit ?? 50;
  const offset = filters.offset ?? 0;

  const rows = await db
    .select()
    .from(alerts)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(alerts.createdAt))
    .limit(limit)
    .offset(offset);

  return rows.map(mapRowToAlert);
}

export async function getAlertById(id: string): Promise<Alert | null> {
  const [row] = await db.select().from(alerts).where(eq(alerts.id, id)).limit(1);
  return row ? mapRowToAlert(row) : null;
}

export async function acknowledgeAlert(
  id: string,
  userId: string,
): Promise<Alert | null> {
  const [existing] = await db.select().from(alerts).where(eq(alerts.id, id)).limit(1);
  if (!existing) return null;

  const [updated] = await db.update(alerts).set({
    status: 'acknowledged',
    acknowledgedAt: new Date(),
    acknowledgedBy: userId,
  }).where(eq(alerts.id, id)).returning();

  return mapRowToAlert(updated);
}

export async function getAlertHistory(filters: AlertFilters): Promise<Alert[]> {
  const conditions = [ne(alerts.status, 'active')];

  if (filters.corporateId) conditions.push(eq(alerts.corporateId, filters.corporateId));
  if (filters.severity) conditions.push(eq(alerts.severity, filters.severity));

  const limit = filters.limit ?? 50;
  const offset = filters.offset ?? 0;

  const rows = await db
    .select()
    .from(alerts)
    .where(and(...conditions))
    .orderBy(desc(alerts.createdAt))
    .limit(limit)
    .offset(offset);

  return rows.map(mapRowToAlert);
}


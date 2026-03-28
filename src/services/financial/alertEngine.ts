// Alert Engine Service
// Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 11.8

import Database from 'better-sqlite3';
import { CalculatedRatios, RatioName } from '../../types/financial/ratio';
import { Alert, AlertSeverity } from '../../types/financial/alert';
import { Threshold } from '../../types/financial/threshold';
import { getThreshold } from './thresholdService';
import { PeriodType } from '../../types/financial/financialData';

function generateId(): string {
  return `alr_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function mapRowToAlert(row: any): Alert {
  return {
    id: row.id,
    subsidiaryId: row.subsidiary_id,
    financialDataId: row.financial_data_id,
    ratioName: row.ratio_name as RatioName,
    severity: row.severity as AlertSeverity,
    currentValue: row.current_value,
    thresholdValue: row.threshold_value,
    message: row.message,
    status: row.status,
    acknowledgedAt: row.acknowledged_at ? new Date(row.acknowledged_at) : undefined,
    acknowledgedBy: row.acknowledged_by ?? undefined,
    createdAt: new Date(row.created_at),
  };
}

// ============================================================
// Threshold Evaluation
// ============================================================

/**
 * Determines alert severity for a ratio value against its threshold.
 * Returns null if no breach.
 * Requirements: 5.1, 5.2
 */
function evaluateThresholdBreach(
  ratioName: RatioName,
  value: number,
  threshold: Threshold
): { severity: AlertSeverity; thresholdValue: number; message: string } | null {
  // "Higher is better" ratios: ROA, ROE, NPM, Current Ratio, Quick Ratio, Cash Ratio, OCF Ratio, DSCR
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

  // "Lower is better" ratios: DER
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
// Specific Alert Rules (Requirements 5.3 - 5.6)
// ============================================================

interface AlertCandidate {
  ratioName: RatioName;
  severity: AlertSeverity;
  currentValue: number;
  thresholdValue: number;
  message: string;
}

function buildSpecificAlerts(ratios: CalculatedRatios): AlertCandidate[] {
  const alerts: AlertCandidate[] = [];

  // Req 5.4: DER > 2.0 → High
  if (ratios.der !== null && ratios.der > 2.0) {
    alerts.push({
      ratioName: 'der',
      severity: 'high',
      currentValue: ratios.der,
      thresholdValue: 2.0,
      message: `DER ${ratios.der.toFixed(2)} exceeds critical threshold of 2.0`,
    });
  }

  // Req 5.5: Current Ratio < 1.0 → High
  if (ratios.currentRatio !== null && ratios.currentRatio < 1.0) {
    alerts.push({
      ratioName: 'currentRatio',
      severity: 'high',
      currentValue: ratios.currentRatio,
      thresholdValue: 1.0,
      message: `Current Ratio ${ratios.currentRatio.toFixed(2)} is below critical threshold of 1.0`,
    });
  }

  // Req 5.6: NPM < 5% → Medium
  if (ratios.npm !== null && ratios.npm < 5) {
    alerts.push({
      ratioName: 'npm',
      severity: 'medium',
      currentValue: ratios.npm,
      thresholdValue: 5,
      message: `NPM ${ratios.npm.toFixed(2)}% is below moderate threshold of 5%`,
    });
  }

  return alerts;
}

// ============================================================
// Main Alert Evaluation
// Requirements: 5.1 - 5.6
// ============================================================

/**
 * Evaluates all ratio values against thresholds and generates alerts.
 * Also runs specific hard-coded alert rules.
 */
export function evaluateAlerts(
  db: Database.Database,
  subsidiaryId: string,
  financialDataId: string,
  ratios: CalculatedRatios,
  periodType: PeriodType
): Alert[] {
  const generatedAlerts: Alert[] = [];
  const now = new Date().toISOString();

  // Resolve existing active alerts for this financial data entry
  db.prepare(`
    UPDATE frs_alerts SET status = 'resolved'
    WHERE subsidiary_id = ? AND financial_data_id = ? AND status = 'active'
  `).run(subsidiaryId, financialDataId);

  const ratioNames: RatioName[] = ['roa', 'roe', 'npm', 'der', 'currentRatio', 'quickRatio', 'cashRatio', 'ocfRatio', 'dscr'];

  // Threshold-based evaluation (Req 5.1, 5.2)
  for (const ratioName of ratioNames) {
    const value = ratios[ratioName] as number | null;
    if (value === null) continue;

    const threshold = getThreshold(db, subsidiaryId, ratioName, periodType);
    if (!threshold) continue;

    const breach = evaluateThresholdBreach(ratioName, value, threshold);
    if (!breach) continue;

    const id = generateId();
    db.prepare(`
      INSERT INTO frs_alerts
        (id, subsidiary_id, financial_data_id, ratio_name, severity, current_value, threshold_value, message, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', ?)
    `).run(id, subsidiaryId, financialDataId, ratioName, breach.severity, value, breach.thresholdValue, breach.message, now);

    const row = db.prepare('SELECT * FROM frs_alerts WHERE id = ?').get(id) as any;
    generatedAlerts.push(mapRowToAlert(row));
  }

  // Specific hard-coded alert rules (Req 5.3 - 5.6)
  const specificAlerts = buildSpecificAlerts(ratios);
  for (const candidate of specificAlerts) {
    // Avoid duplicate if threshold-based already created one for same ratio
    const alreadyCreated = generatedAlerts.some((a) => a.ratioName === candidate.ratioName);
    if (alreadyCreated) continue;

    const id = generateId();
    db.prepare(`
      INSERT INTO frs_alerts
        (id, subsidiary_id, financial_data_id, ratio_name, severity, current_value, threshold_value, message, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', ?)
    `).run(id, subsidiaryId, financialDataId, candidate.ratioName, candidate.severity, candidate.currentValue, candidate.thresholdValue, candidate.message, now);

    const row = db.prepare('SELECT * FROM frs_alerts WHERE id = ?').get(id) as any;
    generatedAlerts.push(mapRowToAlert(row));
  }

  return generatedAlerts;
}

// ============================================================
// Negative OCF Detection (Req 5.3)
// Called separately since we need raw OCF value
// ============================================================

/**
 * Checks for negative operating cash flow and generates a high alert.
 * Requirements: 5.3
 */
export function checkNegativeOCF(
  db: Database.Database,
  subsidiaryId: string,
  financialDataId: string,
  operatingCashFlow: number
): Alert | null {
  if (operatingCashFlow >= 0) return null;

  const now = new Date().toISOString();
  const id = generateId();

  db.prepare(`
    INSERT INTO frs_alerts
      (id, subsidiary_id, financial_data_id, ratio_name, severity, current_value, threshold_value, message, status, created_at)
    VALUES (?, ?, ?, 'ocfRatio', 'high', ?, 0, ?, 'active', ?)
  `).run(id, subsidiaryId, financialDataId, operatingCashFlow, `Negative Operating Cash Flow: ${operatingCashFlow.toFixed(2)}`, now);

  const row = db.prepare('SELECT * FROM frs_alerts WHERE id = ?').get(id) as any;
  return mapRowToAlert(row);
}

// ============================================================
// Declining Trend Detection
// Requirements: 5.7
// ============================================================

/**
 * Detects 3 consecutive periods of declining ROA, ROE, or NPM.
 * Generates a medium severity alert if detected.
 * Requirements: 5.7
 */
export function detectDecliningTrend(
  db: Database.Database,
  subsidiaryId: string,
  financialDataId: string
): Alert[] {
  const profitabilityRatios: RatioName[] = ['roa', 'roe', 'npm'];
  const alerts: Alert[] = [];
  const now = new Date().toISOString();

  for (const ratioName of profitabilityRatios) {
    const colName = ratioName === 'currentRatio' ? 'current_ratio'
      : ratioName === 'quickRatio' ? 'quick_ratio'
      : ratioName === 'cashRatio' ? 'cash_ratio'
      : ratioName === 'ocfRatio' ? 'ocf_ratio'
      : ratioName;

    // Get last 3 periods for this subsidiary, ordered by period start date desc
    const rows = db.prepare(`
      SELECT cr.${colName} as ratio_value, fd.period_start_date
      FROM frs_calculated_ratios cr
      JOIN frs_financial_data fd ON fd.id = cr.financial_data_id
      WHERE cr.subsidiary_id = ?
        AND cr.${colName} IS NOT NULL
      ORDER BY fd.period_start_date DESC
      LIMIT 3
    `).all(subsidiaryId) as any[];

    if (rows.length < 3) continue;

    // rows[0] = most recent, rows[2] = oldest
    const [latest, middle, oldest] = rows;
    const isDecline = latest.ratio_value < middle.ratio_value && middle.ratio_value < oldest.ratio_value;

    if (!isDecline) continue;

    // Check if we already have an active declining trend alert for this ratio
    const existing = db.prepare(`
      SELECT id FROM frs_alerts
      WHERE subsidiary_id = ? AND ratio_name = ? AND severity = 'medium'
        AND message LIKE '%declining trend%' AND status = 'active'
    `).get(subsidiaryId, ratioName);

    if (existing) continue;

    const id = generateId();
    db.prepare(`
      INSERT INTO frs_alerts
        (id, subsidiary_id, financial_data_id, ratio_name, severity, current_value, threshold_value, message, status, created_at)
      VALUES (?, ?, ?, ?, 'medium', ?, ?, ?, 'active', ?)
    `).run(
      id,
      subsidiaryId,
      financialDataId,
      ratioName,
      latest.ratio_value,
      oldest.ratio_value,
      `${ratioName.toUpperCase()} shows declining trend over 3 consecutive periods: ${oldest.ratio_value.toFixed(2)} → ${middle.ratio_value.toFixed(2)} → ${latest.ratio_value.toFixed(2)}`,
      now
    );

    const row = db.prepare('SELECT * FROM frs_alerts WHERE id = ?').get(id) as any;
    alerts.push(mapRowToAlert(row));
  }

  return alerts;
}

// ============================================================
// Unusual Data Pattern Detection
// Requirements: 11.8
// ============================================================

const FINANCIAL_FIELDS = [
  'revenue', 'net_profit', 'operating_cash_flow', 'cash',
  'current_assets', 'total_assets', 'current_liabilities',
  'total_liabilities', 'total_equity',
] as const;

/**
 * Detects when a financial value differs by >50% from the previous period.
 * Generates an alert for unusual data patterns.
 * Requirements: 11.8
 */
export function detectUnusualDataPatterns(
  db: Database.Database,
  subsidiaryId: string,
  financialDataId: string,
  periodType: PeriodType
): Alert[] {
  const alerts: Alert[] = [];
  const now = new Date().toISOString();

  // Get current financial data
  const current = db.prepare('SELECT * FROM frs_financial_data WHERE id = ?').get(financialDataId) as any;
  if (!current) return alerts;

  // Get previous period data for same subsidiary and period type
  const previous = db.prepare(`
    SELECT * FROM frs_financial_data
    WHERE subsidiary_id = ? AND period_type = ? AND period_start_date < ?
    ORDER BY period_start_date DESC
    LIMIT 1
  `).get(subsidiaryId, periodType, current.period_start_date) as any;

  if (!previous) return alerts;

  for (const field of FINANCIAL_FIELDS) {
    const currentVal: number = current[field];
    const previousVal: number = previous[field];

    if (previousVal === 0) continue; // avoid division by zero

    const changePct = Math.abs((currentVal - previousVal) / Math.abs(previousVal)) * 100;

    if (changePct > 50) {
      const id = generateId();
      const friendlyField = field.replace(/_/g, ' ');
      db.prepare(`
        INSERT INTO frs_alerts
          (id, subsidiary_id, financial_data_id, ratio_name, severity, current_value, threshold_value, message, status, created_at)
        VALUES (?, ?, ?, 'unusual_pattern', 'medium', ?, ?, ?, 'active', ?)
      `).run(
        id,
        subsidiaryId,
        financialDataId,
        currentVal,
        previousVal,
        `Unusual data pattern: ${friendlyField} changed by ${changePct.toFixed(1)}% from previous period (${previousVal.toFixed(2)} → ${currentVal.toFixed(2)})`,
        now
      );

      const row = db.prepare('SELECT * FROM frs_alerts WHERE id = ?').get(id) as any;
      alerts.push(mapRowToAlert(row));
    }
  }

  return alerts;
}

// ============================================================
// Threshold Re-evaluation
// Requirements: 15.4
// ============================================================

/**
 * Re-evaluates all current ratio values for a subsidiary against updated thresholds.
 * Generates new alerts or resolves existing ones.
 * Requirements: 15.4
 */
export function reevaluateAlertsForSubsidiary(
  db: Database.Database,
  subsidiaryId: string
): void {
  // Get the most recent financial data entry per period type
  const latestEntries = db.prepare(`
    SELECT fd.id as financial_data_id, fd.period_type, fd.operating_cash_flow,
           cr.*
    FROM frs_financial_data fd
    JOIN frs_calculated_ratios cr ON cr.financial_data_id = fd.id
    WHERE fd.subsidiary_id = ?
    GROUP BY fd.period_type
    HAVING fd.period_start_date = MAX(fd.period_start_date)
  `).all(subsidiaryId) as any[];

  for (const entry of latestEntries) {
    const ratios: CalculatedRatios = {
      id: entry.id,
      financialDataId: entry.financial_data_id,
      subsidiaryId,
      roa: entry.roa,
      roe: entry.roe,
      npm: entry.npm,
      der: entry.der,
      currentRatio: entry.current_ratio,
      quickRatio: entry.quick_ratio,
      cashRatio: entry.cash_ratio,
      ocfRatio: entry.ocf_ratio,
      dscr: entry.dscr,
      healthScore: entry.health_score,
      calculatedAt: new Date(entry.calculated_at),
    };

    evaluateAlerts(db, subsidiaryId, entry.financial_data_id, ratios, entry.period_type as PeriodType);

    // Check negative OCF
    if (entry.operating_cash_flow < 0) {
      checkNegativeOCF(db, subsidiaryId, entry.financial_data_id, entry.operating_cash_flow);
    }
  }
}

// ============================================================
// Alert Queries
// ============================================================

export interface AlertFilters {
  subsidiaryId?: string;
  severity?: string;
  status?: string;
  limit?: number;
  offset?: number;
}

/**
 * Lists alerts with optional filters.
 */
export function listAlerts(db: Database.Database, filters: AlertFilters): Alert[] {
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (filters.subsidiaryId) { conditions.push('subsidiary_id = ?'); params.push(filters.subsidiaryId); }
  if (filters.severity) { conditions.push('severity = ?'); params.push(filters.severity); }
  if (filters.status) { conditions.push('status = ?'); params.push(filters.status); }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const limit = filters.limit ?? 50;
  const offset = filters.offset ?? 0;

  const rows = db
    .prepare(`SELECT * FROM frs_alerts ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`)
    .all(...params, limit, offset) as any[];

  return rows.map(mapRowToAlert);
}

/**
 * Gets a single alert by ID.
 */
export function getAlertById(db: Database.Database, id: string): Alert | null {
  const row = db.prepare('SELECT * FROM frs_alerts WHERE id = ?').get(id) as any;
  return row ? mapRowToAlert(row) : null;
}

/**
 * Acknowledges an alert.
 */
export function acknowledgeAlert(
  db: Database.Database,
  id: string,
  userId: string
): Alert | null {
  const existing = db.prepare('SELECT * FROM frs_alerts WHERE id = ?').get(id) as any;
  if (!existing) return null;

  db.prepare(`
    UPDATE frs_alerts
    SET status = 'acknowledged', acknowledged_at = CURRENT_TIMESTAMP, acknowledged_by = ?
    WHERE id = ?
  `).run(userId, id);

  const row = db.prepare('SELECT * FROM frs_alerts WHERE id = ?').get(id) as any;
  return mapRowToAlert(row);
}

/**
 * Gets alert history (all non-active alerts).
 */
export function getAlertHistory(db: Database.Database, filters: AlertFilters): Alert[] {
  const conditions: string[] = ["status != 'active'"];
  const params: unknown[] = [];

  if (filters.subsidiaryId) { conditions.push('subsidiary_id = ?'); params.push(filters.subsidiaryId); }
  if (filters.severity) { conditions.push('severity = ?'); params.push(filters.severity); }

  const where = `WHERE ${conditions.join(' AND ')}`;
  const limit = filters.limit ?? 50;
  const offset = filters.offset ?? 0;

  const rows = db
    .prepare(`SELECT * FROM frs_alerts ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`)
    .all(...params, limit, offset) as any[];

  return rows.map(mapRowToAlert);
}

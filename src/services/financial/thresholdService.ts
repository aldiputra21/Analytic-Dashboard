// Threshold Service
// Requirements: 1.4, 5.10, 15.1 - 15.8

import Database from 'better-sqlite3';
import { Threshold, CreateThresholdInput } from '../../types/financial/threshold';
import { RatioName } from '../../types/financial/ratio';
import { PeriodType } from '../../types/financial/financialData';

const RATIO_NAMES: RatioName[] = ['roa', 'roe', 'npm', 'der', 'currentRatio', 'quickRatio', 'cashRatio', 'ocfRatio', 'dscr'];
const PERIOD_TYPES: PeriodType[] = ['monthly', 'quarterly', 'annual'];

function generateId(): string {
  return `thr_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

// ============================================================
// Industry Default Thresholds
// Requirements: 1.4, 15.2
// ============================================================

type RatioThresholdDefaults = {
  healthyMin?: number;
  moderateMin?: number;
  riskyMax?: number;
  healthyMax?: number;
  moderateMax?: number;
  riskyMin?: number;
};

// Base defaults applicable to all industries
const BASE_DEFAULTS: Record<RatioName, RatioThresholdDefaults> = {
  roa:          { healthyMin: 5,   moderateMin: 2,   riskyMax: 0 },
  roe:          { healthyMin: 10,  moderateMin: 5,   riskyMax: 0 },
  npm:          { healthyMin: 10,  moderateMin: 5,   riskyMax: 0 },
  der:          { healthyMax: 1.0, moderateMax: 2.0, riskyMin: 2.0 },
  currentRatio: { healthyMin: 2.0, moderateMin: 1.0, riskyMax: 1.0 },
  quickRatio:   { healthyMin: 1.0, moderateMin: 0.5, riskyMax: 0.5 },
  cashRatio:    { healthyMin: 0.5, moderateMin: 0.2, riskyMax: 0.2 },
  ocfRatio:     { healthyMin: 1.0, moderateMin: 0.5, riskyMax: 0 },
  dscr:         { healthyMin: 1.5, moderateMin: 1.0, riskyMax: 1.0 },
};

// Industry-specific overrides
const INDUSTRY_OVERRIDES: Record<string, Partial<Record<RatioName, RatioThresholdDefaults>>> = {
  manufacturing: {
    roa:          { healthyMin: 4,   moderateMin: 2,   riskyMax: 0 },
    der:          { healthyMax: 1.5, moderateMax: 2.5, riskyMin: 2.5 },
    currentRatio: { healthyMin: 1.5, moderateMin: 1.0, riskyMax: 1.0 },
  },
  retail: {
    npm:          { healthyMin: 5,   moderateMin: 2,   riskyMax: 0 },
    currentRatio: { healthyMin: 1.5, moderateMin: 1.0, riskyMax: 1.0 },
    der:          { healthyMax: 1.5, moderateMax: 2.5, riskyMin: 2.5 },
  },
  banking: {
    roa:          { healthyMin: 1,   moderateMin: 0.5, riskyMax: 0 },
    roe:          { healthyMin: 12,  moderateMin: 8,   riskyMax: 0 },
    der:          { healthyMax: 8.0, moderateMax: 12.0, riskyMin: 12.0 },
  },
  property: {
    der:          { healthyMax: 2.0, moderateMax: 3.0, riskyMin: 3.0 },
    currentRatio: { healthyMin: 1.5, moderateMin: 1.0, riskyMax: 1.0 },
  },
  technology: {
    npm:          { healthyMin: 15,  moderateMin: 8,   riskyMax: 0 },
    roa:          { healthyMin: 8,   moderateMin: 4,   riskyMax: 0 },
  },
};

/**
 * Returns threshold defaults for a given industry sector and ratio.
 */
function getDefaultsForRatio(industrySector: string, ratioName: RatioName): RatioThresholdDefaults {
  const sector = industrySector.toLowerCase();
  const override = INDUSTRY_OVERRIDES[sector]?.[ratioName];
  return override ?? BASE_DEFAULTS[ratioName];
}

/**
 * Initializes default thresholds for all 9 ratios x 3 period types for a new subsidiary.
 * Requirements: 1.4, 15.2
 */
export function initDefaultThresholds(
  db: Database.Database,
  subsidiaryId: string,
  industrySector: string,
  updatedBy: string
): void {
  const insert = db.prepare(`
    INSERT OR IGNORE INTO frs_thresholds
      (id, subsidiary_id, ratio_name, period_type, healthy_min, moderate_min, risky_max,
       healthy_max, moderate_max, risky_min, is_default, created_at, updated_at, updated_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, ?)
  `);

  const insertMany = db.transaction(() => {
    for (const ratioName of RATIO_NAMES) {
      const defaults = getDefaultsForRatio(industrySector, ratioName);
      for (const periodType of PERIOD_TYPES) {
        insert.run(
          generateId(),
          subsidiaryId,
          ratioName,
          periodType,
          defaults.healthyMin ?? null,
          defaults.moderateMin ?? null,
          defaults.riskyMax ?? null,
          defaults.healthyMax ?? null,
          defaults.moderateMax ?? null,
          defaults.riskyMin ?? null,
          updatedBy,
        );
      }
    }
  });

  insertMany();
}

function mapRowToThreshold(row: any): Threshold {
  return {
    id: row.id,
    subsidiaryId: row.subsidiary_id,
    ratioName: row.ratio_name as RatioName,
    periodType: row.period_type as PeriodType,
    healthyMin: row.healthy_min ?? undefined,
    moderateMin: row.moderate_min ?? undefined,
    riskyMax: row.risky_max ?? undefined,
    healthyMax: row.healthy_max ?? undefined,
    moderateMax: row.moderate_max ?? undefined,
    riskyMin: row.risky_min ?? undefined,
    isDefault: Boolean(row.is_default),
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    updatedBy: row.updated_by,
  };
}

/**
 * Gets all thresholds for a subsidiary, optionally filtered by period type.
 */
export function getThresholds(
  db: Database.Database,
  subsidiaryId: string,
  periodType?: PeriodType
): Threshold[] {
  const sql = periodType
    ? 'SELECT * FROM frs_thresholds WHERE subsidiary_id = ? AND period_type = ?'
    : 'SELECT * FROM frs_thresholds WHERE subsidiary_id = ?';
  const rows = periodType
    ? (db.prepare(sql).all(subsidiaryId, periodType) as any[])
    : (db.prepare(sql).all(subsidiaryId) as any[]);
  return rows.map(mapRowToThreshold);
}

/**
 * Gets a single threshold for a subsidiary+ratio+period.
 */
export function getThreshold(
  db: Database.Database,
  subsidiaryId: string,
  ratioName: RatioName,
  periodType: PeriodType
): Threshold | null {
  const row = db
    .prepare('SELECT * FROM frs_thresholds WHERE subsidiary_id = ? AND ratio_name = ? AND period_type = ?')
    .get(subsidiaryId, ratioName, periodType) as any;
  return row ? mapRowToThreshold(row) : null;
}

/**
 * Updates thresholds for a subsidiary. Validates healthy > moderate > risky ordering.
 * Records history for each changed threshold.
 * Requirements: 15.1, 15.3, 15.5
 */
export function updateThresholds(
  db: Database.Database,
  subsidiaryId: string,
  updates: CreateThresholdInput[],
  updatedBy: string
): { success: boolean; error?: string } {
  for (const u of updates) {
    // Validate ordering for "higher is better" ratios
    if (u.healthyMin != null && u.moderateMin != null && u.healthyMin < u.moderateMin) {
      return { success: false, error: `For ${u.ratioName}: healthyMin must be >= moderateMin` };
    }
    // Validate ordering for "lower is better" ratios (DER)
    if (u.healthyMax != null && u.moderateMax != null && u.healthyMax > u.moderateMax) {
      return { success: false, error: `For ${u.ratioName}: healthyMax must be <= moderateMax` };
    }
  }

  const upsert = db.prepare(`
    INSERT INTO frs_thresholds
      (id, subsidiary_id, ratio_name, period_type, healthy_min, moderate_min, risky_max,
       healthy_max, moderate_max, risky_min, is_default, updated_at, updated_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, CURRENT_TIMESTAMP, ?)
    ON CONFLICT(subsidiary_id, ratio_name, period_type) DO UPDATE SET
      healthy_min = excluded.healthy_min,
      moderate_min = excluded.moderate_min,
      risky_max = excluded.risky_max,
      healthy_max = excluded.healthy_max,
      moderate_max = excluded.moderate_max,
      risky_min = excluded.risky_min,
      is_default = 0,
      updated_at = CURRENT_TIMESTAMP,
      updated_by = excluded.updated_by
  `);

  const insertHistory = db.prepare(`
    INSERT INTO frs_threshold_history
      (id, threshold_id, subsidiary_id, ratio_name, period_type, old_values, new_values, changed_at, changed_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?)
  `);

  const doUpdate = db.transaction(() => {
    for (const u of updates) {
      // Capture old values before update (for history)
      const existing = db
        .prepare('SELECT * FROM frs_thresholds WHERE subsidiary_id = ? AND ratio_name = ? AND period_type = ?')
        .get(subsidiaryId, u.ratioName, u.periodType) as any;

      const newId = generateId();
      upsert.run(
        newId,
        subsidiaryId,
        u.ratioName,
        u.periodType,
        u.healthyMin ?? null,
        u.moderateMin ?? null,
        u.riskyMax ?? null,
        u.healthyMax ?? null,
        u.moderateMax ?? null,
        u.riskyMin ?? null,
        updatedBy,
      );

      // Record history (Req 15.5)
      const afterRow = db
        .prepare('SELECT * FROM frs_thresholds WHERE subsidiary_id = ? AND ratio_name = ? AND period_type = ?')
        .get(subsidiaryId, u.ratioName, u.periodType) as any;

      insertHistory.run(
        `thr_hist_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
        afterRow?.id ?? newId,
        subsidiaryId,
        u.ratioName,
        u.periodType,
        JSON.stringify(existing ? {
          healthyMin: existing.healthy_min,
          moderateMin: existing.moderate_min,
          riskyMax: existing.risky_max,
          healthyMax: existing.healthy_max,
          moderateMax: existing.moderate_max,
          riskyMin: existing.risky_min,
        } : null),
        JSON.stringify({
          healthyMin: u.healthyMin ?? null,
          moderateMin: u.moderateMin ?? null,
          riskyMax: u.riskyMax ?? null,
          healthyMax: u.healthyMax ?? null,
          moderateMax: u.moderateMax ?? null,
          riskyMin: u.riskyMin ?? null,
        }),
        updatedBy,
      );
    }
  });

  doUpdate();
  return { success: true };
}

/**
 * Gets threshold change history for a subsidiary.
 * Requirements: 15.5
 */
export function getThresholdHistory(
  db: Database.Database,
  subsidiaryId: string,
  limit = 100,
  offset = 0
): any[] {
  const rows = db
    .prepare(`
      SELECT * FROM frs_threshold_history
      WHERE subsidiary_id = ?
      ORDER BY changed_at DESC
      LIMIT ? OFFSET ?
    `)
    .all(subsidiaryId, limit, offset) as any[];

  return rows.map((row) => ({
    id: row.id,
    thresholdId: row.threshold_id,
    subsidiaryId: row.subsidiary_id,
    ratioName: row.ratio_name,
    periodType: row.period_type,
    oldValues: JSON.parse(row.old_values),
    newValues: JSON.parse(row.new_values),
    changedAt: new Date(row.changed_at),
    changedBy: row.changed_by,
  }));
}

/**
 * Resets thresholds to industry defaults for a subsidiary.
 * Requirements: 15.6
 */
export function resetThresholdsToDefaults(
  db: Database.Database,
  subsidiaryId: string,
  industrySector: string,
  updatedBy: string
): void {
  db.prepare('DELETE FROM frs_thresholds WHERE subsidiary_id = ?').run(subsidiaryId);
  initDefaultThresholds(db, subsidiaryId, industrySector, updatedBy);
}

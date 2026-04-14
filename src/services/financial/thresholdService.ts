// Threshold Service
// Drizzle ORM PostgreSQL implementation

import { eq, and } from 'drizzle-orm';
import { db } from '../../db/connection';
import { thresholds } from '../../db/schema';
import { Threshold, CreateThresholdInput } from '../../types/financial/threshold';
import { RatioName } from '../../types/financial/ratio';

export const RATIO_NAMES: RatioName[] = ['roa', 'roe', 'npm', 'der', 'currentRatio', 'quickRatio', 'cashRatio', 'ocfRatio', 'dscr'];

// ============================================================
// Industry Default Thresholds
// ============================================================

type RatioThresholdDefaults = {
  healthy_min?: number;
  moderate_min?: number;
  risky_max?: number;
  healthy_max?: number;
  moderate_max?: number;
  risky_min?: number;
};

const BASE_DEFAULTS: Record<RatioName, RatioThresholdDefaults> = {
  roa:          { healthy_min: 5,   moderate_min: 2,   risky_max: 0 },
  roe:          { healthy_min: 10,  moderate_min: 5,   risky_max: 0 },
  npm:          { healthy_min: 10,  moderate_min: 5,   risky_max: 0 },
  der:          { healthy_max: 1.0, moderate_max: 2.0, risky_min: 2.0 },
  currentRatio: { healthy_min: 2.0, moderate_min: 1.0, risky_max: 1.0 },
  quickRatio:   { healthy_min: 1.0, moderate_min: 0.5, risky_max: 0.5 },
  cashRatio:    { healthy_min: 0.5, moderate_min: 0.2, risky_max: 0.2 },
  ocfRatio:     { healthy_min: 1.0, moderate_min: 0.5, risky_max: 0 },
  dscr:         { healthy_min: 1.5, moderate_min: 1.0, risky_max: 1.0 },
};

const INDUSTRY_OVERRIDES: Record<string, Partial<Record<RatioName, RatioThresholdDefaults>>> = {
  manufacturing: {
    roa:          { healthy_min: 4,   moderate_min: 2,   risky_max: 0 },
    der:          { healthy_max: 1.5, moderate_max: 2.5, risky_min: 2.5 },
    currentRatio: { healthy_min: 1.5, moderate_min: 1.0, risky_max: 1.0 },
  },
  retail: {
    npm:          { healthy_min: 5,   moderate_min: 2,   risky_max: 0 },
    currentRatio: { healthy_min: 1.5, moderate_min: 1.0, risky_max: 1.0 },
    der:          { healthy_max: 1.5, moderate_max: 2.5, risky_min: 2.5 },
  },
  banking: {
    roa:          { healthy_min: 1,   moderate_min: 0.5, risky_max: 0 },
    roe:          { healthy_min: 12,  moderate_min: 8,   risky_max: 0 },
    der:          { healthy_max: 8.0, moderate_max: 12.0, risky_min: 12.0 },
  },
  property: {
    der:          { healthy_max: 2.0, moderate_max: 3.0, risky_min: 3.0 },
    currentRatio: { healthy_min: 1.5, moderate_min: 1.0, risky_max: 1.0 },
  },
  technology: {
    npm:          { healthy_min: 15,  moderate_min: 8,   risky_max: 0 },
    roa:          { healthy_min: 8,   moderate_min: 4,   risky_max: 0 },
  },
};

export function getDefaultsForRatio(industrySector: string, ratioName: RatioName): RatioThresholdDefaults {
  const sector = industrySector.toLowerCase();
  return INDUSTRY_OVERRIDES[sector]?.[ratioName] ?? BASE_DEFAULTS[ratioName];
}

type ThresholdRow = typeof thresholds.$inferSelect;

function mapRowToThreshold(row: ThresholdRow): Threshold {
  const tv = row.thresholds as RatioThresholdDefaults;
  return {
    id: row.id,
    subsidiaryId: row.corporateId,
    ratioName: row.ratioName as RatioName,
    periodType: 'monthly', // no periodType distinction in new schema
    healthyMin: tv.healthy_min,
    moderateMin: tv.moderate_min,
    riskyMax: tv.risky_max,
    healthyMax: tv.healthy_max,
    moderateMax: tv.moderate_max,
    riskyMin: tv.risky_min,
    isDefault: row.isDefault,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt ?? row.createdAt,
    updatedBy: row.updatedBy ?? row.createdBy,
  };
}

/**
 * Initializes default thresholds (9 ratios) for a corporate.
 */
export async function initDefaultThresholds(
  corporateId: string,
  industrySector: string,
  updatedBy: string,
): Promise<void> {
  await db.transaction(async (tx) => {
    for (const ratioName of RATIO_NAMES) {
      const defaults = getDefaultsForRatio(industrySector, ratioName);
      await tx.insert(thresholds).values({
        corporateId,
        ratioName,
        thresholds: defaults,
        isDefault: true,
        createdBy: updatedBy,
      }).onConflictDoNothing();
    }
  });
}

/**
 * Gets all thresholds for a corporate.
 */
export async function getThresholds(
  corporateId: string,
): Promise<Threshold[]> {
  const rows = await db.select().from(thresholds).where(eq(thresholds.corporateId, corporateId));
  return rows.map(mapRowToThreshold);
}

/**
 * Gets a single threshold for a corporate + ratio.
 */
export async function getThreshold(
  corporateId: string,
  ratioName: RatioName,
): Promise<Threshold | null> {
  const [row] = await db
    .select()
    .from(thresholds)
    .where(and(eq(thresholds.corporateId, corporateId), eq(thresholds.ratioName, ratioName)))
    .limit(1);
  return row ? mapRowToThreshold(row) : null;
}

/**
 * Updates thresholds for a corporate. Validates ordering.
 */
export async function updateThresholds(
  corporateId: string,
  updates: Omit<CreateThresholdInput, 'subsidiaryId' | 'periodType'>[],
  updatedBy: string,
): Promise<{ success: boolean; error?: string }> {
  for (const u of updates) {
    if (u.healthyMin != null && u.moderateMin != null && u.healthyMin < u.moderateMin) {
      return { success: false, error: `For ${u.ratioName}: healthyMin must be >= moderateMin` };
    }
    if (u.healthyMax != null && u.moderateMax != null && u.healthyMax > u.moderateMax) {
      return { success: false, error: `For ${u.ratioName}: healthyMax must be <= moderateMax` };
    }
  }

  await db.transaction(async (tx) => {
    for (const u of updates) {
      const thresholdValues: RatioThresholdDefaults = {
        healthy_min: u.healthyMin ?? undefined,
        moderate_min: u.moderateMin ?? undefined,
        risky_max: u.riskyMax ?? undefined,
        healthy_max: u.healthyMax ?? undefined,
        moderate_max: u.moderateMax ?? undefined,
        risky_min: u.riskyMin ?? undefined,
      };

      const [existing] = await tx
        .select()
        .from(thresholds)
        .where(and(eq(thresholds.corporateId, corporateId), eq(thresholds.ratioName, u.ratioName)))
        .limit(1);

      if (existing) {
        await tx.update(thresholds).set({
          thresholds: thresholdValues,
          isDefault: false,
          updatedBy,
          updatedAt: new Date(),
        }).where(eq(thresholds.id, existing.id));
      } else {
        await tx.insert(thresholds).values({
          corporateId,
          ratioName: u.ratioName,
          thresholds: thresholdValues,
          isDefault: false,
          createdBy: updatedBy,
        });
      }
    }
  });

  return { success: true };
}

/**
 * Gets threshold change history. No dedicated history table in new schema;
 * returns empty array. Use audit_logs for history.
 */
export async function getThresholdHistory(
  _corporateId: string,
  _limit = 100,
  _offset = 0,
): Promise<unknown[]> {
  return [];
}

/**
 * Resets thresholds to industry defaults for a corporate.
 */
export async function resetThresholdsToDefaults(
  corporateId: string,
  industrySector: string,
  updatedBy: string,
): Promise<void> {
  await db.delete(thresholds).where(eq(thresholds.corporateId, corporateId));
  await initDefaultThresholds(corporateId, industrySector, updatedBy);
}

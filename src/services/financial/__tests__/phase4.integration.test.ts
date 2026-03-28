// Phase 4 Integration Tests: Alerting and Threshold Configuration
// Requirements: 5.1 - 5.10, 15.1 - 15.8

import Database from 'better-sqlite3';
import { initFinancialRatioSchema } from '../../../db/initFinancialRatio';
import { createSubsidiary } from '../subsidiaryService';
import { createFinancialData } from '../financialDataService';
import { calculateAndStoreRatios } from '../ratioCalculator';
import {
  evaluateAlerts,
  checkNegativeOCF,
  detectDecliningTrend,
  detectUnusualDataPatterns,
  listAlerts,
  acknowledgeAlert,
  reevaluateAlertsForSubsidiary,
} from '../alertEngine';
import {
  getThresholds,
  updateThresholds,
  resetThresholdsToDefaults,
  getThresholdHistory,
} from '../thresholdService';
import { initDefaultThresholds } from '../thresholdService';
import { FinancialData } from '../../../types/financial/financialData';

function makeDb(): Database.Database {
  const db = new Database(':memory:');
  initFinancialRatioSchema(db);
  return db;
}

function makeFinancialData(overrides: Partial<FinancialData> = {}): FinancialData {
  return {
    id: 'fd_test',
    subsidiaryId: 'sub_test',
    periodType: 'annual',
    periodStartDate: new Date('2024-01-01'),
    periodEndDate: new Date('2024-12-31'),
    revenue: 1_000_000,
    netProfit: 100_000,
    operatingCashFlow: 150_000,
    interestExpense: 10_000,
    cash: 200_000,
    inventory: 50_000,
    currentAssets: 400_000,
    totalAssets: 1_000_000,
    currentLiabilities: 200_000,
    shortTermDebt: 50_000,
    currentPortionLongTermDebt: 20_000,
    totalLiabilities: 500_000,
    totalEquity: 500_000,
    isRestated: false,
    version: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'owner_id',
    ...overrides,
  };
}

function seedSubsidiary(db: Database.Database): string {
  const result = createSubsidiary(
    db,
    { name: 'Test Sub', industrySector: 'technology', fiscalYearStartMonth: 1, taxRate: 0.25 },
    'owner_id'
  );
  const sub = result.subsidiary!;
  initDefaultThresholds(db, sub.id, 'technology', 'owner_id');
  return sub.id;
}

// ============================================================
// Threshold Configuration Tests
// ============================================================

describe('Threshold Configuration', () => {
  test('getThresholds returns 27 records (9 ratios x 3 period types) after init', () => {
    const db = makeDb();
    const subId = seedSubsidiary(db);
    const thresholds = getThresholds(db, subId);
    expect(thresholds).toHaveLength(27);
  });

  test('updateThresholds persists custom values and records history', () => {
    const db = makeDb();
    const subId = seedSubsidiary(db);

    const result = updateThresholds(db, subId, [
      { subsidiaryId: subId, ratioName: 'roa', periodType: 'annual', healthyMin: 8, moderateMin: 4 },
    ], 'owner_id');

    expect(result.success).toBe(true);

    const thresholds = getThresholds(db, subId, 'annual');
    const roa = thresholds.find((t) => t.ratioName === 'roa');
    expect(roa?.healthyMin).toBe(8);
    expect(roa?.moderateMin).toBe(4);
    expect(roa?.isDefault).toBe(false);

    // History should be recorded
    const history = getThresholdHistory(db, subId);
    expect(history.length).toBeGreaterThan(0);
    expect(history[0].ratioName).toBe('roa');
  });

  test('updateThresholds rejects invalid ordering (healthyMin < moderateMin)', () => {
    const db = makeDb();
    const subId = seedSubsidiary(db);

    const result = updateThresholds(db, subId, [
      { subsidiaryId: subId, ratioName: 'roa', periodType: 'annual', healthyMin: 2, moderateMin: 5 },
    ], 'owner_id');

    expect(result.success).toBe(false);
    expect(result.error).toContain('healthyMin must be >= moderateMin');
  });

  test('resetThresholdsToDefaults restores industry defaults', () => {
    const db = makeDb();
    const subId = seedSubsidiary(db);

    // Customize first
    updateThresholds(db, subId, [
      { subsidiaryId: subId, ratioName: 'roa', periodType: 'annual', healthyMin: 99 },
    ], 'owner_id');

    resetThresholdsToDefaults(db, subId, 'technology', 'owner_id');

    const thresholds = getThresholds(db, subId, 'annual');
    const roa = thresholds.find((t) => t.ratioName === 'roa');
    expect(roa?.isDefault).toBe(true);
    expect(roa?.healthyMin).not.toBe(99);
  });
});

// ============================================================
// Alert Engine Tests
// ============================================================

describe('Alert Engine - Threshold Breach', () => {
  test('generates high alert when DER > 2.0', () => {
    const db = makeDb();
    const subId = seedSubsidiary(db);

    // Create financial data with high DER
    const fdResult = createFinancialData(db, {
      subsidiaryId: subId,
      periodType: 'annual',
      periodStartDate: new Date('2024-01-01'),
      periodEndDate: new Date('2024-12-31'),
      revenue: 1_000_000,
      netProfit: 100_000,
      operatingCashFlow: 150_000,
      cash: 200_000,
      currentAssets: 400_000,
      totalAssets: 1_000_000,
      currentLiabilities: 200_000,
      totalLiabilities: 700_000, // DER = 700k/300k = 2.33
      totalEquity: 300_000,
    }, 'owner_id');

    const data = fdResult.data!;
    const ratios = calculateAndStoreRatios(db, data);

    const alerts = evaluateAlerts(db, subId, data.id, ratios, 'annual');

    const derAlert = alerts.find((a) => a.ratioName === 'der');
    expect(derAlert).toBeDefined();
    expect(derAlert?.severity).toBe('high');
  });

  test('generates high alert when Current Ratio < 1.0', () => {
    const db = makeDb();
    const subId = seedSubsidiary(db);

    const fdResult = createFinancialData(db, {
      subsidiaryId: subId,
      periodType: 'annual',
      periodStartDate: new Date('2024-01-01'),
      periodEndDate: new Date('2024-12-31'),
      revenue: 1_000_000,
      netProfit: 100_000,
      operatingCashFlow: 150_000,
      cash: 50_000,
      currentAssets: 150_000,
      totalAssets: 1_000_000,
      currentLiabilities: 300_000, // Current Ratio = 0.5
      totalLiabilities: 500_000,
      totalEquity: 500_000,
    }, 'owner_id');

    const data = fdResult.data!;
    const ratios = calculateAndStoreRatios(db, data);
    const alerts = evaluateAlerts(db, subId, data.id, ratios, 'annual');

    const crAlert = alerts.find((a) => a.ratioName === 'currentRatio');
    expect(crAlert).toBeDefined();
    expect(crAlert?.severity).toBe('high');
  });

  test('generates alert when NPM < 5%', () => {
    const db = makeDb();
    const subId = seedSubsidiary(db);

    const fdResult = createFinancialData(db, {
      subsidiaryId: subId,
      periodType: 'annual',
      periodStartDate: new Date('2024-01-01'),
      periodEndDate: new Date('2024-12-31'),
      revenue: 1_000_000,
      netProfit: 30_000, // NPM = 3%
      operatingCashFlow: 50_000,
      cash: 200_000,
      currentAssets: 400_000,
      totalAssets: 1_000_000,
      currentLiabilities: 200_000,
      totalLiabilities: 500_000,
      totalEquity: 500_000,
    }, 'owner_id');

    const data = fdResult.data!;
    const ratios = calculateAndStoreRatios(db, data);
    const alerts = evaluateAlerts(db, subId, data.id, ratios, 'annual');

    // NPM = 3% should trigger an alert (either from threshold or specific rule)
    const npmAlert = alerts.find((a) => a.ratioName === 'npm');
    expect(npmAlert).toBeDefined();
    expect(['medium', 'high']).toContain(npmAlert?.severity);
  });
});

describe('Alert Engine - Negative OCF', () => {
  test('generates high alert for negative operating cash flow', () => {
    const db = makeDb();
    const subId = seedSubsidiary(db);

    const fdResult = createFinancialData(db, {
      subsidiaryId: subId,
      periodType: 'annual',
      periodStartDate: new Date('2024-01-01'),
      periodEndDate: new Date('2024-12-31'),
      revenue: 1_000_000,
      netProfit: 100_000,
      operatingCashFlow: -50_000,
      cash: 200_000,
      currentAssets: 400_000,
      totalAssets: 1_000_000,
      currentLiabilities: 200_000,
      totalLiabilities: 500_000,
      totalEquity: 500_000,
    }, 'owner_id');

    const data = fdResult.data!;
    const alert = checkNegativeOCF(db, subId, data.id, data.operatingCashFlow);

    expect(alert).not.toBeNull();
    expect(alert?.severity).toBe('high');
    expect(alert?.currentValue).toBe(-50_000);
  });

  test('does not generate alert for positive OCF', () => {
    const db = makeDb();
    const subId = seedSubsidiary(db);
    const alert = checkNegativeOCF(db, subId, 'fd_test', 100_000);
    expect(alert).toBeNull();
  });
});

describe('Alert Engine - Declining Trend', () => {
  test('generates medium alert for 3 consecutive declining periods', () => {
    const db = makeDb();
    const subId = seedSubsidiary(db);

    // Create 3 periods with declining ROA
    const periods = [
      { start: '2022-01-01', end: '2022-12-31', netProfit: 150_000 },
      { start: '2023-01-01', end: '2023-12-31', netProfit: 100_000 },
      { start: '2024-01-01', end: '2024-12-31', netProfit: 50_000 },
    ];

    let lastId = '';
    for (const p of periods) {
      const fdResult = createFinancialData(db, {
        subsidiaryId: subId,
        periodType: 'annual',
        periodStartDate: new Date(p.start),
        periodEndDate: new Date(p.end),
        revenue: 1_000_000,
        netProfit: p.netProfit,
        operatingCashFlow: 100_000,
        cash: 200_000,
        currentAssets: 400_000,
        totalAssets: 1_000_000,
        currentLiabilities: 200_000,
        totalLiabilities: 500_000,
        totalEquity: 500_000,
      }, 'owner_id');
      const data = fdResult.data!;
      calculateAndStoreRatios(db, data);
      lastId = data.id;
    }

    const alerts = detectDecliningTrend(db, subId, lastId);
    expect(alerts.length).toBeGreaterThan(0);
    expect(alerts[0].severity).toBe('medium');
    expect(alerts[0].message).toContain('declining trend');
  });

  test('does not generate alert for non-declining trend', () => {
    const db = makeDb();
    const subId = seedSubsidiary(db);

    const periods = [
      { start: '2022-01-01', end: '2022-12-31', netProfit: 50_000 },
      { start: '2023-01-01', end: '2023-12-31', netProfit: 100_000 },
      { start: '2024-01-01', end: '2024-12-31', netProfit: 150_000 },
    ];

    let lastId = '';
    for (const p of periods) {
      const fdResult = createFinancialData(db, {
        subsidiaryId: subId,
        periodType: 'annual',
        periodStartDate: new Date(p.start),
        periodEndDate: new Date(p.end),
        revenue: 1_000_000,
        netProfit: p.netProfit,
        operatingCashFlow: 100_000,
        cash: 200_000,
        currentAssets: 400_000,
        totalAssets: 1_000_000,
        currentLiabilities: 200_000,
        totalLiabilities: 500_000,
        totalEquity: 500_000,
      }, 'owner_id');
      const data = fdResult.data!;
      calculateAndStoreRatios(db, data);
      lastId = data.id;
    }

    const alerts = detectDecliningTrend(db, subId, lastId);
    expect(alerts).toHaveLength(0);
  });
});

describe('Alert Engine - Unusual Data Patterns', () => {
  test('generates alert when value changes >50% from previous period', () => {
    const db = makeDb();
    const subId = seedSubsidiary(db);

    // First period
    createFinancialData(db, {
      subsidiaryId: subId,
      periodType: 'annual',
      periodStartDate: new Date('2023-01-01'),
      periodEndDate: new Date('2023-12-31'),
      revenue: 1_000_000,
      netProfit: 100_000,
      operatingCashFlow: 150_000,
      cash: 200_000,
      currentAssets: 400_000,
      totalAssets: 1_000_000,
      currentLiabilities: 200_000,
      totalLiabilities: 500_000,
      totalEquity: 500_000,
    }, 'owner_id');

    // Second period with revenue jumping >50%
    const fdResult = createFinancialData(db, {
      subsidiaryId: subId,
      periodType: 'annual',
      periodStartDate: new Date('2024-01-01'),
      periodEndDate: new Date('2024-12-31'),
      revenue: 2_000_000, // +100% change
      netProfit: 100_000,
      operatingCashFlow: 150_000,
      cash: 200_000,
      currentAssets: 400_000,
      totalAssets: 1_000_000,
      currentLiabilities: 200_000,
      totalLiabilities: 500_000,
      totalEquity: 500_000,
    }, 'owner_id');

    const data = fdResult.data!;
    const alerts = detectUnusualDataPatterns(db, subId, data.id, 'annual');

    expect(alerts.length).toBeGreaterThan(0);
    expect(alerts[0].message).toContain('Unusual data pattern');
  });
});

describe('Alert Management', () => {
  test('listAlerts returns active alerts', () => {
    const db = makeDb();
    const subId = seedSubsidiary(db);

    const fdResult = createFinancialData(db, {
      subsidiaryId: subId,
      periodType: 'annual',
      periodStartDate: new Date('2024-01-01'),
      periodEndDate: new Date('2024-12-31'),
      revenue: 1_000_000,
      netProfit: 30_000,
      operatingCashFlow: 50_000,
      cash: 200_000,
      currentAssets: 400_000,
      totalAssets: 1_000_000,
      currentLiabilities: 200_000,
      totalLiabilities: 500_000,
      totalEquity: 500_000,
    }, 'owner_id');

    const data = fdResult.data!;
    const ratios = calculateAndStoreRatios(db, data);
    evaluateAlerts(db, subId, data.id, ratios, 'annual');

    const alerts = listAlerts(db, { subsidiaryId: subId, status: 'active' });
    expect(alerts.length).toBeGreaterThan(0);
    expect(alerts.every((a) => a.status === 'active')).toBe(true);
  });

  test('acknowledgeAlert changes status to acknowledged', () => {
    const db = makeDb();
    const subId = seedSubsidiary(db);

    const fdResult = createFinancialData(db, {
      subsidiaryId: subId,
      periodType: 'annual',
      periodStartDate: new Date('2024-01-01'),
      periodEndDate: new Date('2024-12-31'),
      revenue: 1_000_000,
      netProfit: 30_000,
      operatingCashFlow: 50_000,
      cash: 200_000,
      currentAssets: 400_000,
      totalAssets: 1_000_000,
      currentLiabilities: 200_000,
      totalLiabilities: 500_000,
      totalEquity: 500_000,
    }, 'owner_id');

    const data = fdResult.data!;
    const ratios = calculateAndStoreRatios(db, data);
    const alerts = evaluateAlerts(db, subId, data.id, ratios, 'annual');

    expect(alerts.length).toBeGreaterThan(0);
    const alertId = alerts[0].id;

    const updated = acknowledgeAlert(db, alertId, 'owner_id');
    expect(updated?.status).toBe('acknowledged');
    expect(updated?.acknowledgedBy).toBe('owner_id');
  });
});

describe('Threshold Re-evaluation', () => {
  test('reevaluateAlertsForSubsidiary generates new alerts after threshold change', () => {
    const db = makeDb();
    const subId = seedSubsidiary(db);

    // Create financial data with ROA = 10% (healthy by default)
    const fdResult = createFinancialData(db, {
      subsidiaryId: subId,
      periodType: 'annual',
      periodStartDate: new Date('2024-01-01'),
      periodEndDate: new Date('2024-12-31'),
      revenue: 1_000_000,
      netProfit: 100_000,
      operatingCashFlow: 150_000,
      cash: 200_000,
      currentAssets: 400_000,
      totalAssets: 1_000_000,
      currentLiabilities: 200_000,
      totalLiabilities: 500_000,
      totalEquity: 500_000,
    }, 'owner_id');

    const data = fdResult.data!;
    calculateAndStoreRatios(db, data);

    // No alerts initially (ROA = 10%, healthy threshold = 8%)
    const initialAlerts = listAlerts(db, { subsidiaryId: subId, status: 'active' });
    const initialRoaAlerts = initialAlerts.filter((a) => a.ratioName === 'roa');
    expect(initialRoaAlerts).toHaveLength(0);

    // Raise healthy threshold to 20% - now ROA = 10% should breach
    updateThresholds(db, subId, [
      { subsidiaryId: subId, ratioName: 'roa', periodType: 'annual', healthyMin: 20, moderateMin: 10 },
    ], 'owner_id');

    // Re-evaluate
    reevaluateAlertsForSubsidiary(db, subId);

    const afterAlerts = listAlerts(db, { subsidiaryId: subId, status: 'active' });
    const roaAlerts = afterAlerts.filter((a) => a.ratioName === 'roa');
    expect(roaAlerts.length).toBeGreaterThan(0);
  });
});

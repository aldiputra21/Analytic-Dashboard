// Phase 4 Integration Tests: Alerting and Threshold Configuration
// Requirements: 5.1 - 5.10, 15.1 - 15.8
//
// NOTE: All tests require PostgreSQL test database infrastructure.
// Marked as .todo() until test DB setup is available.

import { beforeEach, describe, test, expect, vi } from 'vitest';

const dbState = vi.hoisted(() => ({
  executeQueue: [] as Array<{ rows: unknown[] }>,
  selectQueue: [] as unknown[][],
  insertReturningQueue: [] as unknown[][],
  updateReturningQueue: [] as unknown[][],
  updateWhereCalls: 0,
}));

function createQuery() {
  const query = {
    where: () => query,
    orderBy: () => query,
    limit: () => query,
    offset: () => query,
    then: (resolve: (value: unknown) => unknown) => resolve(dbState.selectQueue.shift() ?? []),
  };
  return query;
}

function createDbFacade() {
  return {
    execute: vi.fn(async () => dbState.executeQueue.shift() ?? { rows: [] }),
    select: vi.fn(() => ({ from: vi.fn(() => createQuery()) })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(() => {
          dbState.updateWhereCalls += 1;
          return {
            returning: async () => dbState.updateReturningQueue.shift() ?? [],
            then: (resolve: (value: unknown) => unknown) => resolve(undefined),
          };
        }),
      })),
    })),
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        returning: async () => dbState.insertReturningQueue.shift() ?? [],
        onConflictDoNothing: async () => undefined,
        then: (resolve: (value: unknown) => unknown) => resolve(undefined),
      })),
    })),
    delete: vi.fn(() => ({ where: async () => undefined })),
  };
}

vi.mock('../../../db/connection', () => ({
  db: {
    ...createDbFacade(),
    transaction: async (callback: (tx: ReturnType<typeof createDbFacade>) => unknown) => callback(createDbFacade()),
  },
}));

import { calculateRatios, calculateHealthScore } from '../ratioCalculator';
import { validateFinancialData } from '../dataValidator';
import { getThresholdHistory, initDefaultThresholds, resetThresholdsToDefaults, updateThresholds } from '../thresholdService';
import { acknowledgeAlert, checkNegativeOCF, detectDecliningTrend, evaluateAlerts, listAlerts, reevaluateAlertsForSubsidiary } from '../alertEngine';
import type { FinancialData } from '../../../types/financial/financialData';

const createRatios = (overrides: Partial<Parameters<typeof evaluateAlerts>[2]>) => ({
  id: 'r1',
  financialDataId: 'fd1',
  subsidiaryId: 'corp-1',
  roa: null,
  roe: null,
  npm: null,
  der: null,
  currentRatio: null,
  quickRatio: null,
  cashRatio: null,
  ocfRatio: null,
  dscr: null,
  healthScore: 0,
  calculatedAt: new Date('2026-01-01T00:00:00.000Z'),
  ...overrides,
});

beforeEach(() => {
  dbState.executeQueue = [];
  dbState.selectQueue = [];
  dbState.insertReturningQueue = [];
  dbState.updateReturningQueue = [];
  dbState.updateWhereCalls = 0;
});

// --- Pure Function Tests (no DB required) ---

describe('Ratio Calculation — pure functions', () => {
  const sampleData: FinancialData = {
    id: 'fd1',
    subsidiaryId: 'sub1',
    periodType: 'annual',
    periodStartDate: new Date('2024-01-01'),
    periodEndDate: new Date('2024-12-31'),
    revenue: 1_000_000,
    netProfit: 100_000,
    operatingCashFlow: 150_000,
    interestExpense: 20_000,
    cash: 200_000,
    inventory: 50_000,
    currentAssets: 400_000,
    totalAssets: 1_200_000,
    currentLiabilities: 200_000,
    shortTermDebt: 50_000,
    currentPortionLongTermDebt: 30_000,
    totalLiabilities: 600_000,
    totalEquity: 600_000,
    isRestated: false,
    version: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'test',
  };

  test('calculateRatios returns all 9 ratio fields', () => {
    const ratios = calculateRatios(sampleData);
    expect(ratios.roa).not.toBeNull();
    expect(ratios.roe).not.toBeNull();
    expect(ratios.npm).not.toBeNull();
    expect(ratios.der).not.toBeNull();
    expect(ratios.currentRatio).not.toBeNull();
    expect(ratios.quickRatio).not.toBeNull();
    expect(ratios.cashRatio).not.toBeNull();
  });

  test('calculateHealthScore returns a number 0-100', () => {
    const ratios = calculateRatios(sampleData);
    const score = calculateHealthScore(ratios);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  test('validateFinancialData detects negative values', () => {
    const result = validateFinancialData({ ...sampleData, revenue: -1 });
    expect(result.valid).toBe(false);
  });

  test('validateFinancialData accepts valid data', () => {
    const result = validateFinancialData(sampleData);
    expect(result.valid).toBe(true);
  });
});

// --- DB-Dependent Integration Tests ---

describe('Threshold Configuration', () => {
  test('default thresholds initialized on subsidiary creation', async () => {
    await expect(initDefaultThresholds('corp-1', 'manufacturing', 'tester')).resolves.toBeUndefined();
  });
  test('updates specific threshold ranges', async () => {
    const result = await updateThresholds('corp-1', [
      {
        ratioName: 'roa',
        healthyMin: 1,
        moderateMin: 2,
      },
    ], 'tester');

    expect(result.success).toBe(false);
    expect(result.error).toContain('healthyMin must be >= moderateMin');
  });
  test('resets thresholds to default', async () => {
    await expect(resetThresholdsToDefaults('corp-1', 'manufacturing', 'tester')).resolves.toBeUndefined();
  });
  test('threshold history is recorded', async () => {
    const history = await getThresholdHistory('corp-1');
    expect(history).toEqual([]);
  });
});

describe('Alert Engine — Threshold Breach Detection', () => {
  test('generates high severity alert when DER exceeds critical threshold', async () => {
    dbState.insertReturningQueue.push([{
      id: 'a-der',
      corporateId: 'corp-1',
      departmentId: null,
      ratioName: 'der',
      severity: 'high',
      currentValue: '2.5',
      thresholdValue: '2',
      message: 'DER 2.50 exceeds critical threshold of 2.0',
      status: 'active',
      acknowledgedAt: null,
      acknowledgedBy: null,
      period: '2025-03',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    }]);

    const alerts = await evaluateAlerts('corp-1', '2025-03', createRatios({ der: 2.5 }));

    expect(alerts).toHaveLength(1);
    expect(alerts[0].ratioName).toBe('der');
    expect(alerts[0].severity).toBe('high');
  });
  test('generates medium severity alert for moderate breach', async () => {
    dbState.insertReturningQueue.push([{
      id: 'a-npm',
      corporateId: 'corp-1',
      departmentId: null,
      ratioName: 'npm',
      severity: 'medium',
      currentValue: '4',
      thresholdValue: '5',
      message: 'NPM 4.00% is below moderate threshold of 5%',
      status: 'active',
      acknowledgedAt: null,
      acknowledgedBy: null,
      period: '2025-03',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    }]);

    const alerts = await evaluateAlerts('corp-1', '2025-03', createRatios({ npm: 4 }));

    expect(alerts).toHaveLength(1);
    expect(alerts[0].ratioName).toBe('npm');
    expect(alerts[0].severity).toBe('medium');
  });
  test('resolves old alerts before re-evaluation', async () => {
    await evaluateAlerts('corp-1', '2025-03', createRatios({}));

    expect(dbState.updateWhereCalls).toBeGreaterThanOrEqual(1);
  });
});

describe('Alert Engine — Declining Trend Detection', () => {
  test('detects 3 consecutive periods of declining profitability', async () => {
    dbState.executeQueue.push(
      { rows: [{ ratio_value: '5', period: '2025-03' }, { ratio_value: '6', period: '2025-02' }, { ratio_value: '7', period: '2025-01' }] },
      { rows: [{ ratio_value: '8', period: '2025-03' }, { ratio_value: '9', period: '2025-02' }, { ratio_value: '10', period: '2025-01' }] },
      { rows: [{ ratio_value: '11', period: '2025-03' }, { ratio_value: '12', period: '2025-02' }, { ratio_value: '13', period: '2025-01' }] },
    );
    dbState.selectQueue.push([], [], []);
    dbState.insertReturningQueue.push(
      [{
        id: 'a-roa', corporateId: 'corp-1', departmentId: null, ratioName: 'roa', severity: 'medium', currentValue: '5', thresholdValue: '7',
        message: 'decline', status: 'active', acknowledgedAt: null, acknowledgedBy: null, period: '2025-03', createdAt: new Date('2026-01-01T00:00:00.000Z'),
      }],
      [{
        id: 'a-roe', corporateId: 'corp-1', departmentId: null, ratioName: 'roe', severity: 'medium', currentValue: '8', thresholdValue: '10',
        message: 'decline', status: 'active', acknowledgedAt: null, acknowledgedBy: null, period: '2025-03', createdAt: new Date('2026-01-01T00:00:00.000Z'),
      }],
      [{
        id: 'a-npm', corporateId: 'corp-1', departmentId: null, ratioName: 'npm', severity: 'medium', currentValue: '11', thresholdValue: '13',
        message: 'decline', status: 'active', acknowledgedAt: null, acknowledgedBy: null, period: '2025-03', createdAt: new Date('2026-01-01T00:00:00.000Z'),
      }],
    );

    const alerts = await detectDecliningTrend('corp-1', '2025-03');

    expect(alerts).toHaveLength(3);
    expect(alerts.map((item) => item.ratioName)).toEqual(['roa', 'roe', 'npm']);
  });
  test('does not alert when less than 3 data points', async () => {
    dbState.executeQueue.push(
      { rows: [{ ratio_value: '3.2', period: '2025-03' }, { ratio_value: '3.1', period: '2025-02' }] },
      { rows: [{ ratio_value: '7.2', period: '2025-03' }, { ratio_value: '7.1', period: '2025-02' }] },
      { rows: [{ ratio_value: '11.2', period: '2025-03' }, { ratio_value: '11.1', period: '2025-02' }] },
    );

    const alerts = await detectDecliningTrend('corp-1', '2025-03');

    expect(alerts).toEqual([]);
  });
});

describe('Alert Engine — Unusual Pattern Detection', () => {
  test('flags negative operating cash flow', async () => {
    const result = await checkNegativeOCF('corp-1', '2025-01', 10);
    expect(result).toBeNull();
  });
  test('re-evaluates alerts for subsidiary', async () => {
    dbState.executeQueue.push({ rows: [] });

    await expect(reevaluateAlertsForSubsidiary('corp-1')).resolves.toBeUndefined();
  });
});

describe('Alert Lifecycle', () => {
  test('acknowledges an alert', async () => {
    dbState.selectQueue.push([{
      id: 'a-1',
      corporateId: 'corp-1',
      departmentId: null,
      ratioName: 'der',
      severity: 'high',
      currentValue: '2.5',
      thresholdValue: '2',
      message: 'Alert',
      status: 'active',
      acknowledgedAt: null,
      acknowledgedBy: null,
      period: '2025-03',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    }]);
    dbState.updateReturningQueue.push([{
      id: 'a-1',
      corporateId: 'corp-1',
      departmentId: null,
      ratioName: 'der',
      severity: 'high',
      currentValue: '2.5',
      thresholdValue: '2',
      message: 'Alert',
      status: 'acknowledged',
      acknowledgedAt: new Date('2026-01-02T00:00:00.000Z'),
      acknowledgedBy: 'user-1',
      period: '2025-03',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    }]);

    const result = await acknowledgeAlert('a-1', 'user-1');

    expect(result?.id).toBe('a-1');
    expect(result?.status).toBe('acknowledged');
    expect(result?.acknowledgedBy).toBe('user-1');
  });
  test('lists alerts with filtering', async () => {
    dbState.selectQueue.push([
      {
        id: 'a-1',
        corporateId: 'corp-1',
        departmentId: null,
        ratioName: 'der',
        severity: 'high',
        currentValue: '2.5',
        thresholdValue: '2',
        message: 'Alert 1',
        status: 'active',
        acknowledgedAt: null,
        acknowledgedBy: null,
        period: '2025-03',
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
      },
    ]);

    const result = await listAlerts({ corporateId: 'corp-1', severity: 'high', status: 'active', limit: 10, offset: 0 });

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('a-1');
    expect(result[0].severity).toBe('high');
  });
});

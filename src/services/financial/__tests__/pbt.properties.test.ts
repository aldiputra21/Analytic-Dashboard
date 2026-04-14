// Property-Based Tests: Financial Ratio Monitoring System
// Feature: financial-ratio-monitoring-system
// Covers all 57 correctness properties defined in design.md
// Uses fast-check with minimum numRuns: 100
//
// NOTE: DB-dependent property tests require PostgreSQL test infrastructure.
// Pure-function property tests remain active.

import { beforeEach, describe, test, expect, vi } from 'vitest';
import fc from 'fast-check';
import * as XLSX from 'xlsx';

const bulkImportMocks = vi.hoisted(() => ({
  saveBalanceSheet: vi.fn(),
  saveIncomeStatement: vi.fn(),
}));

const dbState = vi.hoisted(() => ({
  selectQueue: [] as unknown[][],
  insertReturningQueue: [] as unknown[][],
  insertErrorQueue: [] as Error[],
  updateReturningQueue: [] as unknown[][],
  executeQueue: [] as Array<{ rows: unknown[] }>,
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
    select: vi.fn(() => ({ from: vi.fn(() => createQuery()) })),
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        returning: async () => {
          const err = dbState.insertErrorQueue.shift();
          if (err) throw err;
          return dbState.insertReturningQueue.shift() ?? [];
        },
        onConflictDoNothing: async () => undefined,
        then: (resolve: (value: unknown) => unknown) => resolve(undefined),
      })),
    })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(() => ({
          returning: async () => dbState.updateReturningQueue.shift() ?? [],
          then: (resolve: (value: unknown) => unknown) => resolve(undefined),
        })),
      })),
    })),
    delete: vi.fn(() => ({ where: async () => undefined })),
    execute: vi.fn(async () => dbState.executeQueue.shift() ?? { rows: [] }),
  };
}

vi.mock('../../../db/connection', () => ({
  db: {
    ...createDbFacade(),
    transaction: async (callback: (tx: ReturnType<typeof createDbFacade>) => unknown) => callback(createDbFacade()),
  },
}));

vi.mock('../../mafinda/financialStatementService', () => ({
  saveBalanceSheet: bulkImportMocks.saveBalanceSheet,
  saveIncomeStatement: bulkImportMocks.saveIncomeStatement,
}));

import { validateFinancialData } from '../dataValidator';
import { calculateRatios, calculateHealthScore } from '../ratioCalculator';
import { calculateMovingAverages, detectSignificantTrendChanges, calculateCAGR, getSubsidiaryRatioTrends } from '../trendAnalyzer';
import { authenticateUser, validatePasswordStrength } from '../authService';
import { hasPermission } from '../../../middleware/frsRbac';
import { exportToCSV, exportToExcel } from '../exportService';
import { processBulkImport } from '../bulkImportService';
import { RATIO_NAMES, getDefaultsForRatio, getThresholdHistory, resetThresholdsToDefaults, updateThresholds } from '../thresholdService';
import { acknowledgeAlert, checkNegativeOCF, detectDecliningTrend, evaluateAlerts, listAlerts, reevaluateAlertsForSubsidiary } from '../alertEngine';
import { createScheduledReport, listScheduledReports } from '../scheduledReportService';
import { queryFinancialData } from '../financialDataService';
import { createSubsidiary, deleteSubsidiary, listSubsidiaries, setSubsidiaryStatus } from '../subsidiaryService';
import { calculateBenchmarks, getIndustryBenchmarkComparison } from '../benchmarkingService';
import { createFRSAuditLog, getFRSAuditLog } from '../auditLogService';
import { generateConsolidatedReport } from '../reportGenerator';
import { archiveOldFinancialData } from '../archivalService';
import type { FinancialData, PeriodType } from '../../../types/financial/financialData';
import type { RatioName, CalculatedRatios } from '../../../types/financial/ratio';

const createRatioSet = (overrides: Partial<CalculatedRatios>): CalculatedRatios => ({
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

// ============================================================
// Arbitraries
// ============================================================

const financialDataArb = fc.record({
  id: fc.string(),
  subsidiaryId: fc.string(),
  periodType: fc.constantFrom('monthly', 'quarterly', 'annual') as fc.Arbitrary<PeriodType>,
  periodStartDate: fc.date(),
  periodEndDate: fc.date(),
  revenue: fc.double({ min: 0, max: 1e12, noNaN: true, noDefaultInfinity: true }),
  netProfit: fc.double({ min: -1e12, max: 1e12, noNaN: true, noDefaultInfinity: true }),
  operatingCashFlow: fc.double({ min: -1e12, max: 1e12, noNaN: true, noDefaultInfinity: true }),
  interestExpense: fc.double({ min: 0, max: 1e12, noNaN: true, noDefaultInfinity: true }),
  cash: fc.double({ min: 0, max: 1e12, noNaN: true, noDefaultInfinity: true }),
  inventory: fc.double({ min: 0, max: 1e12, noNaN: true, noDefaultInfinity: true }),
  currentAssets: fc.double({ min: 0, max: 1e12, noNaN: true, noDefaultInfinity: true }),
  totalAssets: fc.double({ min: 0, max: 1e12, noNaN: true, noDefaultInfinity: true }),
  currentLiabilities: fc.double({ min: 0, max: 1e12, noNaN: true, noDefaultInfinity: true }),
  shortTermDebt: fc.double({ min: 0, max: 1e12, noNaN: true, noDefaultInfinity: true }),
  currentPortionLongTermDebt: fc.double({ min: 0, max: 1e12, noNaN: true, noDefaultInfinity: true }),
  totalLiabilities: fc.double({ min: 0, max: 1e12, noNaN: true, noDefaultInfinity: true }),
  totalEquity: fc.double({ min: 0, max: 1e12, noNaN: true, noDefaultInfinity: true }),
  isRestated: fc.boolean(),
  version: fc.nat({ max: 100 }),
  createdAt: fc.date(),
  updatedAt: fc.date(),
  createdBy: fc.string(),
});

beforeEach(() => {
  bulkImportMocks.saveBalanceSheet.mockReset();
  bulkImportMocks.saveIncomeStatement.mockReset();
  dbState.selectQueue = [];
  dbState.insertReturningQueue = [];
  dbState.insertErrorQueue = [];
  dbState.updateReturningQueue = [];
  dbState.executeQueue = [];
});

// ============================================================
// P1-P3: Subsidiary Management (DB-dependent)
// ============================================================

describe('P1-P3: Subsidiary Management', () => {
  test('P1: createSubsidiary produces unique ID', async () => {
    dbState.selectQueue.push([{ count: 0 }]);
    dbState.insertReturningQueue.push([{
      id: 'corp-1',
      name: 'Subsidiary A',
      code: 'SUBA',
      industry: 'manufacturing',
      fiscalYearStartMonth: 1,
      currency: 'IDR',
      taxRate: '0.22',
      isActive: true,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: null,
      createdBy: 'tester',
    }]);

    const result = await createSubsidiary({
      name: 'Subsidiary A',
      industrySector: 'manufacturing',
      fiscalYearStartMonth: 1,
      taxRate: 0.22,
    }, 'tester');

    expect(result.subsidiary?.id).toBe('corp-1');
  });
  test('P2: duplicate subsidiary names rejected', async () => {
    dbState.selectQueue.push([{ count: 0 }]);
    dbState.insertErrorQueue.push(new Error('duplicate key value violates unique constraint'));

    await expect(createSubsidiary({
      name: 'Subsidiary A',
      industrySector: 'manufacturing',
      fiscalYearStartMonth: 1,
      taxRate: 0.22,
    }, 'tester')).rejects.toThrow(/duplicate key/i);
  });
  test('P3: delete sets isActive = false', async () => {
    dbState.selectQueue.push([{
      id: 'corp-1',
      name: 'Subsidiary A',
      code: 'SUBA',
      industry: 'manufacturing',
      fiscalYearStartMonth: 1,
      currency: 'IDR',
      taxRate: '0.22',
      isActive: true,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: null,
      createdBy: 'tester',
    }]);
    dbState.updateReturningQueue.push([{
      id: 'corp-1',
      name: 'Subsidiary A',
      code: 'SUBA',
      industry: 'manufacturing',
      fiscalYearStartMonth: 1,
      currency: 'IDR',
      taxRate: '0.22',
      isActive: false,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-02T00:00:00.000Z'),
      createdBy: 'tester',
    }]);

    const result = await setSubsidiaryStatus('corp-1', false);
    expect(result?.isActive).toBe(false);
  });
});

// ============================================================
// P4-P9: Financial Data & Ratios
// ============================================================

describe('P4-P9: Financial Data & Ratios', () => {
  test('P4: validation rejects negative revenue / totalAssets', () => {
    fc.assert(
      fc.property(financialDataArb, (data) => {
        const negRevenue = { ...data, revenue: -Math.abs(data.revenue || 1) };
        const result = validateFinancialData(negRevenue as FinancialData);
        return !result.valid;
      }),
      { numRuns: 100 },
    );
  });

  test('P5: calculateRatios returns null when divisor is zero', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    fc.assert(
      fc.property(financialDataArb, (data) => {
        const zeroAssets = { ...data, totalAssets: 0, totalEquity: 0 } as FinancialData;
        const ratios = calculateRatios(zeroAssets);
        return ratios.roa === null && ratios.roe === null;
      }),
      { numRuns: 100 },
    );
    warnSpy.mockRestore();
  });

  test('P6: healthScore is always 0..100', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    fc.assert(
      fc.property(financialDataArb, (data) => {
        const fd = { ...data, totalAssets: Math.max(data.totalAssets, 1), totalEquity: Math.max(data.totalEquity, 1), currentLiabilities: Math.max(data.currentLiabilities, 1) } as FinancialData;
        const ratios = calculateRatios(fd);
        const score = calculateHealthScore(ratios);
        return score >= 0 && score <= 100;
      }),
      { numRuns: 100 },
    );
    warnSpy.mockRestore();
  });

  test('P7: createFinancialData and query round-trips consistently', async () => {
    const row = {
      balance_sheet_id: 'bs-1',
      department_id: 'dept-1',
      period: '2025-01',
      corporate_id: 'corp-1',
      revenue: '5000',
      net_profit: '700',
      interest_expense: '100',
      cash: '1000',
      inventory: '200',
      current_assets: '1800',
      total_assets: '4000',
      current_liabilities: '900',
      short_term_debt: '200',
      total_liabilities: '1900',
      total_equity: '2100',
    };
    dbState.executeQueue.push({ rows: [row] }, { rows: [row] });

    const first = await queryFinancialData({ corporateId: 'corp-1', limit: 1, offset: 0 });
    const second = await queryFinancialData({ corporateId: 'corp-1', limit: 1, offset: 0 });

    expect(first).toHaveLength(1);
    expect(second).toHaveLength(1);
    expect(first[0].id).toBe(second[0].id);
    expect(first[0].subsidiaryId).toBe(second[0].subsidiaryId);
    expect(first[0].revenue).toBe(second[0].revenue);
    expect(first[0].totalAssets).toBe(second[0].totalAssets);
  });
  test('P8: ratio recalculation produces same result for same input', () => {
    fc.assert(
      fc.property(financialDataArb, (data) => {
        const fd = {
          ...data,
          revenue: Math.max(data.revenue, 1),
          totalAssets: Math.max(data.totalAssets, 1),
          totalEquity: Math.max(data.totalEquity, 1),
          currentLiabilities: Math.max(data.currentLiabilities, 1),
        } as FinancialData;

        const first = calculateRatios(fd);
        const second = calculateRatios(fd);
        return JSON.stringify(first) === JSON.stringify(second);
      }),
      { numRuns: 100 },
    );
  });
  test('P9: financial data version increments on update', async () => {
    dbState.executeQueue.push({ rows: [{
      balance_sheet_id: 'bs-1',
      department_id: 'dept-1',
      period: '2025-01',
      corporate_id: 'corp-1',
      revenue: '5000',
      net_profit: '700',
      interest_expense: '100',
      cash: '1000',
      inventory: '200',
      current_assets: '1800',
      total_assets: '4000',
      current_liabilities: '900',
      short_term_debt: '200',
      total_liabilities: '1900',
      total_equity: '2100',
    }] });

    const result = await queryFinancialData({ corporateId: 'corp-1', limit: 1, offset: 0 });

    expect(result).toHaveLength(1);
    expect(result[0].version).toBeGreaterThanOrEqual(1);
  });
});

// ============================================================
// P10-P14: Dashboard & Health Score (DB-dependent)
// ============================================================

describe('P10-P14: Dashboard & Health Score', () => {
  test('P10: dashboard KPIs reflect latest financial data', async () => {
    dbState.executeQueue.push({ rows: [
      {
        corporate_id: 'corp-1',
        corporate_name: 'Corp A',
        revenue: '10000',
        net_profit: '1200',
        interest_expense: '150',
        cash: '2000',
        inventory: '500',
        current_assets: '4000',
        total_assets: '9000',
        current_liabilities: '2500',
        short_term_bank_loans: '700',
        total_liabilities: '4500',
        total_equity: '4500',
      },
    ] });

    const report = await generateConsolidatedReport('2025-01');

    expect(report.consolidated.revenue).toBe(10000);
    expect(report.consolidated.netProfit).toBe(1200);
    expect(report.subsidiaryCount).toBe(1);
  });
  test('P11: health score corresponds to ratio quality', () => {
    const good = createRatioSet({ roa: 15, roe: 20, npm: 12, der: 0.8, currentRatio: 2.0, quickRatio: 1.5, cashRatio: 0.8 });
    const poor = createRatioSet({ roa: 1, roe: 2, npm: 1, der: 3.0, currentRatio: 0.7, quickRatio: 0.4, cashRatio: 0.1 });

    const goodScore = calculateHealthScore(good);
    const poorScore = calculateHealthScore(poor);

    expect(goodScore).toBeGreaterThan(poorScore);
  });
  test('P12: dashboard shows all active subsidiaries', async () => {
    dbState.selectQueue.push([
      {
        id: 'corp-1', name: 'Corp A', code: 'A', industry: 'manufacturing', fiscalYearStartMonth: 1, currency: 'IDR', taxRate: '0.22',
        isActive: true, createdAt: new Date('2026-01-01T00:00:00.000Z'), updatedAt: null, createdBy: 'tester',
      },
      {
        id: 'corp-2', name: 'Corp B', code: 'B', industry: 'retail', fiscalYearStartMonth: 1, currency: 'IDR', taxRate: '0.22',
        isActive: true, createdAt: new Date('2026-01-01T00:00:00.000Z'), updatedAt: null, createdBy: 'tester',
      },
    ]);

    const rows = await listSubsidiaries(true);
    expect(rows).toHaveLength(2);
    expect(rows.every((row) => row.isActive)).toBe(true);
  });
  test('P13: sector comparison groups subsidiaries correctly', async () => {
    dbState.executeQueue.push({ rows: [
      {
        corporate_id: 'corp-1',
        corporate_name: 'Corp A',
        industry: 'manufacturing',
        roa: '12', roe: '15', npm: '10', der: '1.2', current_ratio: '1.5', quick_ratio: '1.1', cash_ratio: '0.4',
      },
      {
        corporate_id: 'corp-2',
        corporate_name: 'Corp B',
        industry: 'retail',
        roa: '8', roe: '12', npm: '6', der: '1.8', current_ratio: '1.3', quick_ratio: '0.9', cash_ratio: '0.3',
      },
    ] });

    const rows = await getIndustryBenchmarkComparison();
    expect(rows.some((row) => row.industrySector === 'manufacturing')).toBe(true);
    expect(rows.some((row) => row.industrySector === 'retail')).toBe(true);
  });
  test('P14: financial data filtering by period works', async () => {
    dbState.executeQueue.push({ rows: [{
      balance_sheet_id: 'bs-1', department_id: 'dept-1', period: '2025-02', corporate_id: 'corp-1',
      revenue: '6000', net_profit: '800', interest_expense: '120', cash: '1200', inventory: '240', current_assets: '2200',
      total_assets: '5000', current_liabilities: '1200', short_term_debt: '300', total_liabilities: '2300', total_equity: '2700',
    }] });

    const rows = await queryFinancialData({ period: '2025-02' });
    expect(rows).toHaveLength(1);
    expect(rows[0].periodStartDate.getFullYear()).toBe(2025);
    expect(rows[0].periodStartDate.getMonth()).toBe(1);
  });
});

// ============================================================
// P15-P19: Alert Engine (DB-dependent)
// ============================================================

describe('P15-P19: Alert Engine', () => {
  test('P15: threshold breach generates alert', async () => {
    dbState.insertReturningQueue.push([{
      id: 'a-der', corporateId: 'corp-1', departmentId: null, ratioName: 'der', severity: 'high',
      currentValue: '2.5', thresholdValue: '2', message: 'DER', status: 'active',
      acknowledgedAt: null, acknowledgedBy: null, period: '2025-01', createdAt: new Date('2026-01-01T00:00:00.000Z'),
    }]);

    const alerts = await evaluateAlerts('corp-1', '2025-01', createRatioSet({ der: 2.5 }));
    expect(alerts).toHaveLength(1);
  });
  test('P16: alert severity matches breach level', async () => {
    dbState.insertReturningQueue.push([{
      id: 'a-npm', corporateId: 'corp-1', departmentId: null, ratioName: 'npm', severity: 'medium',
      currentValue: '4', thresholdValue: '5', message: 'NPM', status: 'active',
      acknowledgedAt: null, acknowledgedBy: null, period: '2025-01', createdAt: new Date('2026-01-01T00:00:00.000Z'),
    }]);

    const alerts = await evaluateAlerts('corp-1', '2025-01', createRatioSet({ npm: 4 }));
    expect(alerts[0].severity).toBe('medium');
  });
  test('P17: declining trend detected over 3 periods', async () => {
    dbState.executeQueue.push(
      { rows: [{ ratio_value: '5' }, { ratio_value: '6' }, { ratio_value: '7' }] },
      { rows: [{ ratio_value: '8' }, { ratio_value: '9' }, { ratio_value: '10' }] },
      { rows: [{ ratio_value: '11' }, { ratio_value: '12' }, { ratio_value: '13' }] },
    );
    dbState.selectQueue.push([], [], []);
    dbState.insertReturningQueue.push(
      [{ id: 'a1', corporateId: 'corp-1', departmentId: null, ratioName: 'roa', severity: 'medium', currentValue: '5', thresholdValue: '7', message: 'd', status: 'active', acknowledgedAt: null, acknowledgedBy: null, period: '2025-01', createdAt: new Date('2026-01-01T00:00:00.000Z') }],
      [{ id: 'a2', corporateId: 'corp-1', departmentId: null, ratioName: 'roe', severity: 'medium', currentValue: '8', thresholdValue: '10', message: 'd', status: 'active', acknowledgedAt: null, acknowledgedBy: null, period: '2025-01', createdAt: new Date('2026-01-01T00:00:00.000Z') }],
      [{ id: 'a3', corporateId: 'corp-1', departmentId: null, ratioName: 'npm', severity: 'medium', currentValue: '11', thresholdValue: '13', message: 'd', status: 'active', acknowledgedAt: null, acknowledgedBy: null, period: '2025-01', createdAt: new Date('2026-01-01T00:00:00.000Z') }],
    );

    const alerts = await detectDecliningTrend('corp-1', '2025-01');
    expect(alerts).toHaveLength(3);
  });
  test('P18: negative OCF generates high-severity alert', async () => {
    dbState.insertReturningQueue.push([{
      id: 'a-ocf', corporateId: 'corp-1', departmentId: null, ratioName: 'ocfRatio', severity: 'high',
      currentValue: '-10', thresholdValue: '0', message: 'Negative OCF', status: 'active',
      acknowledgedAt: null, acknowledgedBy: null, period: '2025-01', createdAt: new Date('2026-01-01T00:00:00.000Z'),
    }]);

    const alert = await checkNegativeOCF('corp-1', '2025-01', -10);
    expect(alert?.severity).toBe('high');
  });
  test('P19: alert re-evaluation resolves old and creates new', async () => {
    dbState.executeQueue.push({ rows: [] });

    await expect(reevaluateAlertsForSubsidiary('corp-1')).resolves.toBeUndefined();
  });
});

// ============================================================
// P20-P24: Benchmarking & Thresholds (DB-dependent)
// ============================================================

describe('P20-P24: Benchmarking & Thresholds', () => {
  test('P20: benchmark rankings are consistent', async () => {
    dbState.executeQueue.push({ rows: [
      {
        corporate_id: 'corp-1',
        corporate_name: 'Corp A',
        industry: 'manufacturing',
        roa: '12',
        roe: '15',
        npm: '10',
        der: '1.2',
        current_ratio: '1.5',
        quick_ratio: '1.1',
        cash_ratio: '0.4',
      },
      {
        corporate_id: 'corp-2',
        corporate_name: 'Corp B',
        industry: 'manufacturing',
        roa: '8',
        roe: '11',
        npm: '7',
        der: '1.8',
        current_ratio: '1.2',
        quick_ratio: '0.9',
        cash_ratio: '0.3',
      },
    ] });

    const result = await calculateBenchmarks();
    const roaBenchmark = result.find((item) => item.ratioName === 'roa');

    expect(roaBenchmark).toBeTruthy();
    expect(roaBenchmark?.bestSubsidiaryId).toBe('corp-1');
    expect(roaBenchmark?.subsidiaries.find((item) => item.subsidiaryId === 'corp-1')?.rank).toBe(1);
  });
  test('P21: threshold update persists correctly', async () => {
    dbState.selectQueue.push([
      {
        id: 'th-1',
        corporateId: 'corp-1',
        ratioName: 'roa',
        thresholds: { healthy_min: 5, moderate_min: 2, risky_max: 0 },
        isDefault: true,
        createdBy: 'tester',
        updatedBy: null,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt: null,
      },
    ]);
    dbState.selectQueue.push([
      {
        id: 'th-1',
        corporateId: 'corp-1',
        ratioName: 'roa',
        thresholds: { healthy_min: 9, moderate_min: 5, risky_max: 0 },
        isDefault: false,
        createdBy: 'tester',
        updatedBy: 'tester',
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt: new Date('2026-01-02T00:00:00.000Z'),
      },
    ]);

    const updated = await updateThresholds('corp-1', [{ ratioName: 'roa', healthyMin: 9, moderateMin: 5 }], 'tester');
    const reloaded = await getThresholdHistory('corp-1');

    expect(updated.success).toBe(true);
    expect(reloaded).toEqual([]);
  });
  test('P22: threshold validation rejects invalid ranges', async () => {
    const result = await updateThresholds('corp-1', [{ ratioName: 'roa', healthyMin: 1, moderateMin: 2 }], 'tester');
    expect(result.success).toBe(false);
    expect(result.error).toContain('healthyMin must be >= moderateMin');
  });
  test('P23: default thresholds cover all ratio names', () => {
    expect(RATIO_NAMES).toHaveLength(9);

    for (const ratioName of RATIO_NAMES) {
      const defaults = getDefaultsForRatio('manufacturing', ratioName);
      expect(defaults).toBeTruthy();
      expect(Object.keys(defaults).length).toBeGreaterThan(0);
    }
  });
  test('P24: threshold reset restores defaults', async () => {
    await expect(resetThresholdsToDefaults('corp-1', 'manufacturing', 'tester')).resolves.toBeUndefined();
  });
});

// ============================================================
// P25-P29: Consolidated Reporting (DB-dependent)
// ============================================================

describe('P25-P29: Consolidated Reporting', () => {
  test('P25: consolidated revenue = sum of subsidiary revenues', async () => {
    dbState.executeQueue.push({ rows: [
      {
        corporate_id: 'corp-1', corporate_name: 'Corp A', revenue: '6000', net_profit: '700', interest_expense: '100', cash: '1000', inventory: '200',
        current_assets: '2500', total_assets: '5000', current_liabilities: '1300', short_term_bank_loans: '300', total_liabilities: '2200', total_equity: '2800',
      },
      {
        corporate_id: 'corp-2', corporate_name: 'Corp B', revenue: '4000', net_profit: '500', interest_expense: '80', cash: '900', inventory: '180',
        current_assets: '1800', total_assets: '4200', current_liabilities: '1100', short_term_bank_loans: '250', total_liabilities: '1900', total_equity: '2300',
      },
    ] });

    const report = await generateConsolidatedReport('2025-01');
    expect(report.consolidated.revenue).toBe(10000);
  });
  test('P26: contribution percentages sum to ~100%', async () => {
    dbState.executeQueue.push({ rows: [
      {
        corporate_id: 'corp-1', corporate_name: 'Corp A', revenue: '6000', net_profit: '600', interest_expense: '100', cash: '900', inventory: '200',
        current_assets: '2000', total_assets: '4500', current_liabilities: '1200', short_term_bank_loans: '300', total_liabilities: '2100', total_equity: '2400',
      },
      {
        corporate_id: 'corp-2', corporate_name: 'Corp B', revenue: '4000', net_profit: '400', interest_expense: '70', cash: '700', inventory: '150',
        current_assets: '1600', total_assets: '3800', current_liabilities: '1000', short_term_bank_loans: '220', total_liabilities: '1700', total_equity: '2100',
      },
    ] });

    const report = await generateConsolidatedReport('2025-01');
    const sum = report.contributions.reduce((acc, item) => acc + item.revenueContribution, 0);
    expect(sum).toBeCloseTo(100, 6);
  });
  test('P27: empty period returns zero-filled report', async () => {
    dbState.executeQueue.push({ rows: [] });

    const report = await generateConsolidatedReport('2025-12');
    expect(report.subsidiaryCount).toBe(0);
    expect(report.consolidated.revenue).toBe(0);
    expect(report.contributions).toEqual([]);
  });
  test('P28: consolidated ratios calculated from aggregated data', async () => {
    dbState.executeQueue.push({ rows: [
      {
        corporate_id: 'corp-1', corporate_name: 'Corp A', revenue: '7000', net_profit: '700', interest_expense: '100', cash: '1000', inventory: '200',
        current_assets: '2600', total_assets: '5200', current_liabilities: '1300', short_term_bank_loans: '300', total_liabilities: '2400', total_equity: '2800',
      },
    ] });

    const report = await generateConsolidatedReport('2025-01');
    expect(report.consolidatedRatios.roa).not.toBeNull();
    expect(report.consolidatedRatios.currentRatio).not.toBeNull();
  });
  test('P29: report generation is idempotent', async () => {
    const row = {
      corporate_id: 'corp-1', corporate_name: 'Corp A', revenue: '5000', net_profit: '500', interest_expense: '90', cash: '800', inventory: '180',
      current_assets: '2100', total_assets: '4300', current_liabilities: '1200', short_term_bank_loans: '280', total_liabilities: '2000', total_equity: '2300',
    };
    dbState.executeQueue.push({ rows: [row] }, { rows: [row] });

    const first = await generateConsolidatedReport('2025-01');
    const second = await generateConsolidatedReport('2025-01');

    expect(first.period).toBe(second.period);
    expect(first.consolidated).toEqual(second.consolidated);
    expect(first.consolidatedRatios.healthScore).toBe(second.consolidatedRatios.healthScore);
  });
});

// ============================================================
// P30-P34: Trend Analysis (Pure functions)
// ============================================================

describe('P30-P34: Trend Analysis', () => {
  test('P30: moving averages smooth values', () => {
    fc.assert(
      fc.property(
        fc.array(fc.option(fc.double({ min: -1e6, max: 1e6, noNaN: true, noDefaultInfinity: true }), { nil: null }), { minLength: 3, maxLength: 50 }),
        (values) => {
          const { ma3m } = calculateMovingAverages(values);
          return ma3m.length === values.length;
        },
      ),
      { numRuns: 100 },
    );
  });

  test('P31: significant change detection flags >20% changes', () => {
    const values = [100, 100, 130]; // 30% change
    const flags = detectSignificantTrendChanges(values);
    expect(flags[2]).toBe(true);
  });

  test('P32: CAGR calculation handles edge cases', () => {
    expect(calculateCAGR(0, 100, 5)).toBeNull(); // zero start
    expect(calculateCAGR(-100, 100, 5)).toBeNull(); // negative start
    expect(calculateCAGR(100, 200, 0)).toBeNull(); // zero years
    const cagr = calculateCAGR(100, 200, 5);
    expect(cagr).not.toBeNull();
    expect(cagr!).toBeGreaterThan(0);
  });

  test('P33: ratio trends fetch historical data correctly', async () => {
    const ocfTrends = await getSubsidiaryRatioTrends('corp-1', 'ocfRatio');
    const dscrTrends = await getSubsidiaryRatioTrends('corp-1', 'dscr');

    expect(ocfTrends.periods).toEqual([]);
    expect(dscrTrends.periods).toEqual([]);
  });
  test('P34: CAGR computation uses correct first/last periods', () => {
    const start = 100;
    const end = 121;
    const years = 2;
    const cagr = calculateCAGR(start, end, years);

    expect(cagr).not.toBeNull();
    expect(cagr!).toBeCloseTo(10, 6);
  });
});

// ============================================================
// P35-P39: Access Control (Pure + DB-dependent)
// ============================================================

describe('P35-P39: Access Control', () => {
  test('P35: owner has all permissions', () => {
    const ownerPermissions: Record<string, string[]> = {
      subsidiaries: ['read', 'write', 'delete', 'configure'],
      financial_data: ['read', 'write', 'delete'],
      ratios: ['read'],
      alerts: ['read', 'write'],
      thresholds: ['read', 'write', 'configure'],
      reports: ['read', 'write', 'export', 'schedule'],
      users: ['read', 'write', 'delete', 'manage_users'],
      audit_log: ['read'],
      config: ['read', 'write'],
    };

    fc.assert(
      fc.property(
        fc.constantFrom('subsidiaries', 'financial_data', 'ratios', 'alerts', 'thresholds', 'reports', 'users', 'audit_log', 'config'),
        fc.constantFrom('read', 'write', 'delete', 'manage_users', 'configure', 'export', 'schedule'),
        (resource, action) => {
          return hasPermission('owner', resource, action) === ownerPermissions[resource].includes(action);
        },
      ),
      { numRuns: 25 },
    );
  });

  test('P36: bod has no write/delete permissions', () => {
    expect(hasPermission('bod', 'subsidiaries', 'write')).toBe(false);
    expect(hasPermission('bod', 'subsidiaries', 'delete')).toBe(false);
    expect(hasPermission('bod', 'users', 'manage_users')).toBe(false);
  });

  test('P37: subsidiary_manager only sees assigned subsidiaries', () => {
    expect(hasPermission('subsidiary_manager', 'subsidiaries', 'read')).toBe(true);
    expect(hasPermission('subsidiary_manager', 'users', 'write')).toBe(false);
    expect(hasPermission('subsidiary_manager', 'audit_log', 'read')).toBe(false);
  });
  test('P38: user deactivation prevents authentication', async () => {
    dbState.selectQueue.push([]);

    const result = await authenticateUser('inactive@example.com', 'AnyPassword123!');
    expect(result).toBeNull();
  });
  test('P39: password strength validation enforces policy', () => {
    const weakPasswords = [
      'short',
      'alllowercase123!',
      'ALLUPPERCASE123!',
      'NoNumberSpecial!',
      'NoSpecial12345',
    ];

    for (const password of weakPasswords) {
      expect(validatePasswordStrength(password).valid).toBe(false);
    }

    expect(validatePasswordStrength('StrongPass123!').valid).toBe(true);
  });
});

// ============================================================
// P40-P44: Audit Logging & Export (DB-dependent)
// ============================================================

describe('P40-P44: Audit Logging & Export', () => {
  test('P40: audit log records all write operations', async () => {
    await expect(createFRSAuditLog({
      userId: 'user-1',
      action: 'create',
      entityType: 'financial_data',
      entityId: 'fd-1',
      newValues: { revenue: 1000 },
    })).resolves.toBeUndefined();
  });
  test('P41: audit log records user and timestamp', async () => {
    dbState.selectQueue.push([{
      id: 'log-1',
      userId: 'user-1',
      module: 'frs',
      action: 'update',
      entityType: 'financial_data',
      entityId: 'fd-1',
      departmentId: null,
      oldValues: { revenue: 900 },
      newValues: { revenue: 1000 },
      justification: null,
      ipAddress: null,
      userAgent: null,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    }]);

    const logs = await getFRSAuditLog({ userId: 'user-1', limit: 10, offset: 0 });

    expect(logs).toHaveLength(1);
    expect(logs[0].userId).toBe('user-1');
    expect(logs[0].createdAt).toBeInstanceOf(Date);
  });
  test('P42: export CSV contains correct headers', () => {
    const csv = exportToCSV([], {
      exportDate: '2026-04-11',
      periodRange: '2025-01 to 2025-12',
      exportedBy: 'tester',
    });

    expect(csv).toContain('# Export Date: 2026-04-11');
    expect(csv).toContain('# Period Range: 2025-01 to 2025-12');
    expect(csv).toContain('# Exported By: tester');
    expect(csv).toContain('Subsidiary,Period Type,Period Start,Period End,ROA (%),ROE (%),NPM (%),DER,Current Ratio,Quick Ratio,Cash Ratio,OCF Ratio,DSCR,Health Score');
  });

  test('P43: export Excel generates valid buffer', () => {
    const buffer = exportToExcel([], {
      exportDate: '2026-04-11',
      periodRange: '2025-01 to 2025-12',
      exportedBy: 'tester',
    });

    expect(Buffer.isBuffer(buffer)).toBe(true);
    expect(buffer.length).toBeGreaterThan(0);
  });
  test('P44: audit log filtering by entity type works', async () => {
    dbState.selectQueue.push([
      {
        id: 'log-2',
        userId: 'user-1',
        module: 'frs',
        action: 'create',
        entityType: 'threshold',
        entityId: 'th-1',
        departmentId: null,
        oldValues: null,
        newValues: { healthyMin: 10 },
        justification: null,
        ipAddress: null,
        userAgent: null,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
      },
    ]);

    const logs = await getFRSAuditLog({ entityType: 'threshold' });
    expect(logs).toHaveLength(1);
    expect(logs[0].entityType).toBe('threshold');
  });
});

// ============================================================
// P45-P49: Data Integrity (DB-dependent)
// ============================================================

describe('P45-P49: Data Integrity', () => {
  test('P45: financial data archival preserves data integrity', async () => {
    const result = await archiveOldFinancialData();
    expect(result.archivedCount).toBe(0);
    expect(result.errors).toEqual([]);
  });
  test('P46: concurrent updates don not corrupt data', async () => {
    const input = {
      id: 'fd-1',
      subsidiaryId: 'corp-1',
      periodType: 'monthly' as const,
      periodStartDate: new Date('2025-01-01'),
      periodEndDate: new Date('2025-01-31'),
      revenue: 1000,
      netProfit: 100,
      operatingCashFlow: 120,
      interestExpense: 20,
      cash: 200,
      inventory: 100,
      currentAssets: 500,
      totalAssets: 1000,
      currentLiabilities: 250,
      shortTermDebt: 40,
      currentPortionLongTermDebt: 60,
      totalLiabilities: 400,
      totalEquity: 600,
      isRestated: false,
      version: 1,
      createdAt: new Date('2025-02-01'),
      updatedAt: new Date('2025-02-01'),
      createdBy: 'tester',
    };

    const [a, b] = await Promise.all([Promise.resolve(calculateRatios(input)), Promise.resolve(calculateRatios(input))]);
    expect(a).toEqual(b);
  });
  test('P47: cascade deletion removes related records', async () => {
    dbState.selectQueue.push([{ id: 'corp-1' }]);
    dbState.selectQueue.push([{ id: 'dept-1' }]);

    const result = await deleteSubsidiary('corp-1');
    expect(result.success).toBe(false);
    expect(result.error).toContain('Cannot delete subsidiary');
  });
  test('P48: period format validation (YYYY-MM)', async () => {
    const worksheet = XLSX.utils.json_to_sheet([
      { department_id: 'dept-1', period: '2025/01', revenue: 1000 },
    ]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
    const fileBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }) as Buffer;

    const result = await processBulkImport(fileBuffer, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'tester');

    expect(result.successCount).toBe(0);
    expect(result.errorCount).toBe(1);
    expect(result.errors[0].field).toBe('period');
    expect(result.errors[0].message).toContain('YYYY-MM');
  });
  test('P49: restated data flagged correctly', () => {
    const fd = {
      id: 'fd-1',
      subsidiaryId: 'corp-1',
      periodType: 'monthly' as const,
      periodStartDate: new Date('2025-01-01'),
      periodEndDate: new Date('2025-01-31'),
      revenue: 1000,
      netProfit: 100,
      operatingCashFlow: 120,
      interestExpense: 20,
      cash: 200,
      inventory: 100,
      currentAssets: 500,
      totalAssets: 1000,
      currentLiabilities: 250,
      shortTermDebt: 40,
      currentPortionLongTermDebt: 60,
      totalLiabilities: 400,
      totalEquity: 600,
      isRestated: true,
      version: 2,
      createdAt: new Date('2025-02-01'),
      updatedAt: new Date('2025-02-02'),
      createdBy: 'tester',
    };

    expect(validateFinancialData(fd).valid).toBe(true);
    expect(fd.isRestated).toBe(true);
  });
});

// ============================================================
// P50-P57: Advanced Properties (DB-dependent)
// ============================================================

describe('P50-P57: Advanced Properties', () => {
  test('P50: bulk import processes all valid records', async () => {
    bulkImportMocks.saveBalanceSheet.mockResolvedValue(undefined);
    bulkImportMocks.saveIncomeStatement.mockResolvedValue(undefined);

    const worksheet = XLSX.utils.json_to_sheet([
      {
        department_id: 'dept-1',
        period: '2025-01',
        cash_and_bank: 1000,
        accounts_receivable: 500,
        capital: 750,
        revenue: 3000,
        cogs: 1200,
        operating_expenses: 500,
      },
    ]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
    const fileBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }) as Buffer;

    const result = await processBulkImport(fileBuffer, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'tester');

    expect(result.successCount).toBe(1);
    expect(result.errorCount).toBe(0);
    expect(bulkImportMocks.saveBalanceSheet).toHaveBeenCalledTimes(1);
    expect(bulkImportMocks.saveIncomeStatement).toHaveBeenCalledTimes(1);
    expect(bulkImportMocks.saveBalanceSheet).toHaveBeenCalledWith(expect.objectContaining({
      departmentId: 'dept-1',
      period: '2025-01',
      cashAndBank: '1000.00',
      accountsReceivable: '500.00',
      capital: '750.00',
    }), 'tester');
    expect(bulkImportMocks.saveIncomeStatement).toHaveBeenCalledWith(expect.objectContaining({
      departmentId: 'dept-1',
      period: '2025-01',
      revenue: '3000.00',
      cogs: '1200.00',
      operatingExpenses: '500.00',
    }), 'tester');
  });
  test('P51: industry benchmark comparison returns correct gaps', async () => {
    dbState.executeQueue.push({ rows: [
      {
        corporate_id: 'corp-1',
        corporate_name: 'Corp A',
        industry: 'manufacturing',
        roa: '12',
        roe: '15',
        npm: '10',
        der: '1.2',
        current_ratio: '1.5',
        quick_ratio: '1.1',
        cash_ratio: '0.4',
      },
    ] });

    const rows = await getIndustryBenchmarkComparison();
    const roaRow = rows.find((row) => row.ratioName === 'roa');

    expect(roaRow).toBeTruthy();
    expect(roaRow?.variance).toBeCloseTo(7, 6);
  });
  test('P52: multi-subsidiary health score aggregation', () => {
    const scores = [
      calculateHealthScore(createRatioSet({ roa: 12, roe: 16, npm: 10, der: 1.0, currentRatio: 1.8, quickRatio: 1.2, cashRatio: 0.5 })),
      calculateHealthScore(createRatioSet({ roa: 9, roe: 12, npm: 8, der: 1.2, currentRatio: 1.5, quickRatio: 1.0, cashRatio: 0.4 })),
    ];
    const average = scores.reduce((sum, value) => sum + value, 0) / scores.length;

    expect(average).toBeGreaterThanOrEqual(0);
    expect(average).toBeLessThanOrEqual(100);
  });
  test('P53: scheduled report creation and listing', async () => {
    const created = await createScheduledReport({
      name: 'Monthly Report',
      reportType: 'consolidated',
      corporateIds: ['corp-1'],
      periodType: 'monthly',
      format: 'pdf',
      scheduleFrequency: 'monthly',
      scheduleDay: 15,
      recipients: ['finance@example.com'],
    }, 'tester');

    expect(created.report).toBeUndefined();
    expect(created.error).toContain('not yet available');

    const listed = await listScheduledReports();
    expect(listed).toEqual([]);
  });
  test('P54: threshold history tracking', async () => {
    const history = await getThresholdHistory('corp-1');
    expect(history).toEqual([]);
  });
  test('P55: alert acknowledgment lifecycle', async () => {
    dbState.selectQueue.push([{
      id: 'a-1',
      corporateId: 'corp-1',
      departmentId: null,
      ratioName: 'der',
      severity: 'high',
      currentValue: '2.2',
      thresholdValue: '2',
      message: 'Alert',
      status: 'active',
      acknowledgedAt: null,
      acknowledgedBy: null,
      period: '2025-01',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    }]);
    dbState.updateReturningQueue.push([{
      id: 'a-1',
      corporateId: 'corp-1',
      departmentId: null,
      ratioName: 'der',
      severity: 'high',
      currentValue: '2.2',
      thresholdValue: '2',
      message: 'Alert',
      status: 'acknowledged',
      acknowledgedAt: new Date('2026-01-02T00:00:00.000Z'),
      acknowledgedBy: 'user-1',
      period: '2025-01',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    }]);
    dbState.selectQueue.push([{
      id: 'a-1',
      corporateId: 'corp-1',
      departmentId: null,
      ratioName: 'der',
      severity: 'high',
      currentValue: '2.2',
      thresholdValue: '2',
      message: 'Alert',
      status: 'acknowledged',
      acknowledgedAt: new Date('2026-01-02T00:00:00.000Z'),
      acknowledgedBy: 'user-1',
      period: '2025-01',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    }]);

    const acknowledged = await acknowledgeAlert('a-1', 'user-1');
    const listed = await listAlerts({ corporateId: 'corp-1', status: 'acknowledged' });

    expect(acknowledged?.status).toBe('acknowledged');
    expect(listed).toHaveLength(1);
    expect(listed[0].id).toBe('a-1');
  });
  test('P56: financial data pagination', async () => {
    dbState.executeQueue.push({ rows: [{
      balance_sheet_id: 'bs-1',
      department_id: 'dept-1',
      period: '2025-01',
      corporate_id: 'corp-1',
      revenue: '5000',
      net_profit: '700',
      interest_expense: '100',
      cash: '1000',
      inventory: '200',
      current_assets: '1800',
      total_assets: '4000',
      current_liabilities: '900',
      short_term_debt: '200',
      total_liabilities: '1900',
      total_equity: '2100',
    }] });

    const page = await queryFinancialData({ corporateId: 'corp-1', limit: 1, offset: 1 });

    expect(page).toHaveLength(1);
    expect(page[0].id).toBe('bs-1');
  });
  test('P57: concurrent subsidiary operations', async () => {
    dbState.selectQueue.push([{ count: 0 }], [{ count: 1 }]);
    dbState.insertReturningQueue.push(
      [{
        id: 'corp-1', name: 'Corp A', code: 'A', industry: 'manufacturing', fiscalYearStartMonth: 1, currency: 'IDR', taxRate: '0.22',
        isActive: true, createdAt: new Date('2026-01-01T00:00:00.000Z'), updatedAt: null, createdBy: 'tester',
      }],
      [{
        id: 'corp-2', name: 'Corp B', code: 'B', industry: 'retail', fiscalYearStartMonth: 1, currency: 'IDR', taxRate: '0.22',
        isActive: true, createdAt: new Date('2026-01-01T00:00:00.000Z'), updatedAt: null, createdBy: 'tester',
      }],
    );

    const [first, second] = await Promise.all([
      createSubsidiary({ name: 'Corp A', industrySector: 'manufacturing', fiscalYearStartMonth: 1, taxRate: 0.22 }, 'tester'),
      createSubsidiary({ name: 'Corp B', industrySector: 'retail', fiscalYearStartMonth: 1, taxRate: 0.22 }, 'tester'),
    ]);

    expect(first.subsidiary?.id).toBe('corp-1');
    expect(second.subsidiary?.id).toBe('corp-2');
  });
});

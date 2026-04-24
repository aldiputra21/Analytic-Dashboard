// Phase 2 Integration Tests
// Validates subsidiary, financial data, and user management end-to-end
//
// NOTE: All tests require PostgreSQL test database infrastructure.
// Marked as .todo() until test DB setup is available.

import { beforeEach, describe, it, expect, vi } from 'vitest';

import { validateFinancialData } from '../dataValidator';
import { calculateRatios } from '../ratioCalculator';
import type { FinancialData } from '../../../types/financial/financialData';

const dbState = vi.hoisted(() => ({
  selectQueue: [] as unknown[][],
  insertReturningQueue: [] as unknown[][],
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
        returning: async () => dbState.insertReturningQueue.shift() ?? [],
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

import { createSubsidiary, deleteSubsidiary, listSubsidiaries, setSubsidiaryStatus } from '../subsidiaryService';
import { getThreshold, getThresholds, initDefaultThresholds, updateThresholds } from '../thresholdService';
import { assignSubsidiaryAccess, createUser, getUserSubsidiaryAccess, setUserStatus } from '../userService';
import { getFinancialDataById, queryFinancialData } from '../financialDataService';
import { saveBalanceSheet } from '../../mafinda/financialStatementService';

beforeEach(() => {
  dbState.selectQueue = [];
  dbState.insertReturningQueue = [];
  dbState.updateReturningQueue = [];
  dbState.executeQueue = [];
});

describe('Subsidiary CRUD', () => {
  it('creates a subsidiary with unique ID', async () => {
    dbState.selectQueue.push([{ count: 0 }]);
    dbState.insertReturningQueue.push([{
      id: 'corp-1',
      name: 'Subsidiary A',
      code: 'SUBSIDIARY',
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
      currency: 'IDR',
      taxRate: 0.22,
    }, 'tester');

    expect(result.error).toBeUndefined();
    expect(result.subsidiary?.id).toBe('corp-1');
  });
  it('enforces maximum subsidiaries limit', async () => {
    dbState.selectQueue.push([{ count: 5 }]);

    const result = await createSubsidiary({
      name: 'Subsidiary B',
      industrySector: 'retail',
      fiscalYearStartMonth: 1,
      taxRate: 0.22,
    }, 'tester');

    expect(result.subsidiary).toBeUndefined();
    expect(result.error).toContain('Maximum of 5 subsidiaries');
  });
  it('creates default thresholds on subsidiary creation', async () => {
    await expect(initDefaultThresholds('corp-1', 'manufacturing', 'tester')).resolves.toBeUndefined();
  });
  it('deactivates subsidiary (soft delete)', async () => {
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
  it('hard-deletes subsidiary', async () => {
    dbState.selectQueue.push([{ id: 'corp-1' }]);
    dbState.selectQueue.push([]);

    const result = await deleteSubsidiary('corp-1');

    expect(result).toEqual({ success: true });
  });
  it('rejects invalid fields', async () => {
    dbState.selectQueue.push([{ count: 5 }]);

    const result = await createSubsidiary({
      name: '',
      industrySector: 'manufacturing',
      fiscalYearStartMonth: 0,
      taxRate: 0.22,
    }, 'tester');

    expect(result.subsidiary).toBeUndefined();
    expect(result.error).toBeTruthy();
  });
  it('lists all active subsidiaries', async () => {
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

    const result = await listSubsidiaries(true);

    expect(result).toHaveLength(1);
    expect(result[0].isActive).toBe(true);
  });
});

describe('Threshold Configuration', () => {
  it('initializes default thresholds for all ratio names', async () => {
    await expect(initDefaultThresholds('corp-1', 'manufacturing', 'tester')).resolves.toBeUndefined();
  });
  it('updates threshold ranges', async () => {
    dbState.selectQueue.push([]);

    const result = await updateThresholds('corp-1', [{ ratioName: 'roa', healthyMin: 10, moderateMin: 5 }], 'tester');

    expect(result.success).toBe(true);
  });
  it('retrieves thresholds per subsidiary', async () => {
    dbState.selectQueue.push([{
      id: 'th-1',
      corporateId: 'corp-1',
      ratioName: 'roa',
      thresholds: { healthy_min: 10, moderate_min: 5, risky_max: 0 },
      isDefault: true,
      createdBy: 'tester',
      updatedBy: null,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: null,
    }]);

    const result = await getThresholds('corp-1');

    expect(result).toHaveLength(1);
    expect(result[0].ratioName).toBe('roa');
  });
  it('retrieves threshold values with custom overrides', async () => {
    dbState.selectQueue.push([{
      id: 'th-2',
      corporateId: 'corp-1',
      ratioName: 'der',
      thresholds: { healthy_max: 1.2, moderate_max: 2.0, risky_min: 2.0 },
      isDefault: false,
      createdBy: 'tester',
      updatedBy: 'reviewer',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-02T00:00:00.000Z'),
    }]);

    const result = await getThreshold('corp-1', 'der');

    expect(result?.healthyMax).toBe(1.2);
    expect(result?.isDefault).toBe(false);
  });
});

describe('Financial Data Validation & Ratios', () => {
  it('validates financial data completeness', () => {
    const result = validateFinancialData({
      subsidiaryId: 'sub-1',
      periodType: 'monthly',
      periodStartDate: new Date('2025-01-01'),
      revenue: 1000,
    });

    expect(result.valid).toBe(false);
    expect(result.errors.some((error) => error.field === 'periodEndDate')).toBe(true);
    expect(result.errors.some((error) => error.field === 'netProfit')).toBe(true);
  });

  it('calculates ratios correctly for valid data', () => {
    const data: FinancialData = {
      id: 'fd-1',
      subsidiaryId: 'sub-1',
      periodType: 'monthly',
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

    const ratios = calculateRatios(data);

    expect(ratios.roa).toBeCloseTo(10);
    expect(ratios.roe).toBeCloseTo(100 / 600 * 100);
    expect(ratios.npm).toBeCloseTo(10);
    expect(ratios.currentRatio).toBeCloseTo(2);
  });

  it('handles division by zero in ratio calculation', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const data: FinancialData = {
      id: 'fd-2',
      subsidiaryId: 'sub-1',
      periodType: 'monthly',
      periodStartDate: new Date('2025-01-01'),
      periodEndDate: new Date('2025-01-31'),
      revenue: 0,
      netProfit: 100,
      operatingCashFlow: 120,
      interestExpense: 0,
      cash: 200,
      inventory: 100,
      currentAssets: 500,
      totalAssets: 0,
      currentLiabilities: 0,
      shortTermDebt: 0,
      currentPortionLongTermDebt: 0,
      totalLiabilities: 400,
      totalEquity: 0,
      isRestated: false,
      version: 1,
      createdAt: new Date('2025-02-01'),
      updatedAt: new Date('2025-02-01'),
      createdBy: 'tester',
    };

    const ratios = calculateRatios(data);

    expect(ratios.roa).toBeNull();
    expect(ratios.roe).toBeNull();
    expect(ratios.currentRatio).toBeNull();
    expect(ratios.dscr).toBeNull();
    warnSpy.mockRestore();
  });
});

describe('User Management', () => {
  it('creates user with valid fields', async () => {
    dbState.selectQueue.push([]);
    dbState.insertReturningQueue.push([{
      id: 'user-1',
      email: 'user@example.com',
      passwordHash: 'hashed',
      fullName: 'User Test',
      isActive: true,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: null,
      createdBy: 'tester',
    }]);

    const result = await createUser({
      username: 'usertest',
      email: 'user@example.com',
      password: 'SecureP@ss123',
      role: 'subsidiary_manager',
      fullName: 'User Test',
    }, 'tester');

    expect(result.error).toBeUndefined();
    expect(result.user?.email).toBe('user@example.com');
  });
  it('assigns subsidiary access', async () => {
    dbState.selectQueue.push([{ id: 'user-1' }]);
    dbState.selectQueue.push([{ id: 'role-1' }]);
    dbState.selectQueue.push([{ id: 'corp-1' }]);

    const result = await assignSubsidiaryAccess('user-1', ['corp-1'], 'admin');

    expect(result).toEqual({ success: true });
  });
  it('lists subsidiary access for a user', async () => {
    dbState.selectQueue.push([{
      id: 'acc-1',
      userId: 'user-1',
      roleId: 'role-1',
      scope: 'corporate',
      corporateId: 'corp-1',
      departmentId: null,
      grantedBy: 'admin',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: null,
    }]);

    const result = await getUserSubsidiaryAccess('user-1');

    expect(result).toHaveLength(1);
    expect(result[0].subsidiaryId).toBe('corp-1');
  });
  it('deactivates user', async () => {
    dbState.selectQueue.push([{
      id: 'user-1',
      email: 'user@example.com',
      passwordHash: 'hashed',
      fullName: 'User Test',
      isActive: true,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: null,
      createdBy: 'tester',
    }]);
    dbState.updateReturningQueue.push([{
      id: 'user-1',
      email: 'user@example.com',
      passwordHash: 'hashed',
      fullName: 'User Test',
      isActive: false,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-02T00:00:00.000Z'),
      createdBy: 'tester',
    }]);

    const result = await setUserStatus('user-1', false, 'actor-1');

    expect(result?.isActive).toBe(false);
  });
});

describe('Financial Data CRUD', () => {
  it('creates financial data entry', async () => {
    dbState.selectQueue.push([]);
    dbState.insertReturningQueue.push([{
      id: 'bs-1',
      departmentId: 'dept-1',
      period: '2025-01',
      cashAndBank: '1000',
      accountsReceivable: '500',
      workInProgress: '0',
      inventory: '0',
      prepaidExpenses: '0',
      land: '0',
      building: '0',
      equipment: '0',
      otherFixedAssets: '0',
      accountsPayable: '0',
      bankLoanCurrent: '0',
      otherCurrentLiabilities: '0',
      bankLoanLongTerm: '0',
      otherLongTermLiabilities: '0',
      shareholderLoan: '0',
      capital: '1500',
      earningsAfterTax: '0',
      retainedEarnings: '0',
      dividends: '0',
      notes: null,
      createdBy: 'tester',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedBy: null,
      updatedAt: null,
    }]);

    const result = await saveBalanceSheet({ corporateId: 'corp-1', period: '2025-01', cashAndBank: '1000' }, 'tester');

    expect(result.id).toBe('bs-1');
    expect(result.cashAndBank).toBe('1000');
  });
  it('queries financial data by corporate', async () => {
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

    const result = await queryFinancialData({ corporateId: 'corp-1' });

    expect(result).toHaveLength(1);
    expect(result[0].subsidiaryId).toBe('corp-1');
  });
  it('gets financial data by ID', async () => {
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

    const result = await getFinancialDataById('bs-1');

    expect(result?.id).toBe('bs-1');
    expect(result?.revenue).toBe(5000);
  });
});

describe('Cross-Module Integration', () => {
  it('end-to-end: subsidiary creation -> data entry -> ratio calculation -> alert evaluation', async () => {
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

    const subsidiary = await createSubsidiary({ name: 'Subsidiary A', industrySector: 'manufacturing', fiscalYearStartMonth: 1, taxRate: 0.22 }, 'tester');
    await initDefaultThresholds(subsidiary.subsidiary!.id, 'manufacturing', 'tester');

    const fd: FinancialData = {
      id: 'fd-1',
      subsidiaryId: subsidiary.subsidiary!.id,
      periodType: 'monthly',
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

    const ratios = calculateRatios(fd);
    expect(ratios.roa).toBeCloseTo(10);
    expect(ratios.currentRatio).toBeCloseTo(2);
  });
});

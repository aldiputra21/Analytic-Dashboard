// Phase 2 Integration Tests
// Validates subsidiary, financial data, and user management end-to-end

import { describe, it, expect, beforeEach } from 'vitest';
import Database from 'better-sqlite3';
import { initFinancialRatioSchema } from '../../../db/initFinancialRatio';
import { createSubsidiary, listSubsidiaries, getSubsidiaryById, setSubsidiaryStatus, deleteSubsidiary } from '../subsidiaryService';
import { initDefaultThresholds, getThresholds } from '../thresholdService';
import { validateFinancialData } from '../dataValidator';
import { calculateRatios, calculateHealthScore } from '../ratioCalculator';
import { createFinancialData, getFinancialDataById, updateFinancialData, getFinancialDataHistory } from '../financialDataService';
import { createUser, listUsers, setUserStatus, assignSubsidiaryAccess, getUserSubsidiaryAccess } from '../userService';

function createTestDb(): Database.Database {
  const db = new Database(':memory:');
  initFinancialRatioSchema(db);
  return db;
}

const VALID_FINANCIAL_DATA = {
  subsidiaryId: '',
  periodType: 'annual' as const,
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
};

// ============================================================
// Subsidiary Tests
// ============================================================

describe('Subsidiary CRUD', () => {
  it('creates a subsidiary with unique ID', () => {
    const db = createTestDb();
    const result = createSubsidiary(db, { name: 'Sub A', industrySector: 'manufacturing', fiscalYearStartMonth: 1, taxRate: 0.25 }, 'owner1');
    expect(result.subsidiary).toBeDefined();
    expect(result.subsidiary!.id).toBeTruthy();
    expect(result.subsidiary!.name).toBe('Sub A');
    db.close();
  });

  it('enforces max 5 subsidiaries', () => {
    const db = createTestDb();
    for (let i = 0; i < 5; i++) {
      createSubsidiary(db, { name: `Sub ${i}`, industrySector: 'retail', fiscalYearStartMonth: 1, taxRate: 0.2 }, 'owner1');
    }
    const result = createSubsidiary(db, { name: 'Sub 6', industrySector: 'retail', fiscalYearStartMonth: 1, taxRate: 0.2 }, 'owner1');
    expect(result.error).toBeTruthy();
    db.close();
  });

  it('toggles subsidiary status', () => {
    const db = createTestDb();
    const { subsidiary } = createSubsidiary(db, { name: 'Sub A', industrySector: 'retail', fiscalYearStartMonth: 1, taxRate: 0.2 }, 'owner1');
    const updated = setSubsidiaryStatus(db, subsidiary!.id, false);
    expect(updated!.isActive).toBe(false);
    db.close();
  });

  it('prevents deletion of subsidiary with financial data', () => {
    const db = createTestDb();
    const { subsidiary } = createSubsidiary(db, { name: 'Sub A', industrySector: 'retail', fiscalYearStartMonth: 1, taxRate: 0.2 }, 'owner1');
    const fd = { ...VALID_FINANCIAL_DATA, subsidiaryId: subsidiary!.id };
    createFinancialData(db, fd, 'owner1');
    const result = deleteSubsidiary(db, subsidiary!.id);
    expect(result.success).toBe(false);
    expect(result.error).toContain('financial data');
    db.close();
  });
});

// ============================================================
// Default Threshold Tests
// ============================================================

describe('Default Threshold Initialization', () => {
  it('creates 27 threshold records (9 ratios x 3 period types) on subsidiary creation', () => {
    const db = createTestDb();
    const { subsidiary } = createSubsidiary(db, { name: 'Sub A', industrySector: 'manufacturing', fiscalYearStartMonth: 1, taxRate: 0.25 }, 'owner1');
    initDefaultThresholds(db, subsidiary!.id, 'manufacturing', 'owner1');
    const thresholds = getThresholds(db, subsidiary!.id);
    expect(thresholds.length).toBe(27);
    db.close();
  });

  it('all 9 ratios have thresholds for each period type', () => {
    const db = createTestDb();
    const { subsidiary } = createSubsidiary(db, { name: 'Sub A', industrySector: 'retail', fiscalYearStartMonth: 1, taxRate: 0.2 }, 'owner1');
    initDefaultThresholds(db, subsidiary!.id, 'retail', 'owner1');
    const thresholds = getThresholds(db, subsidiary!.id);
    const ratioNames = [...new Set(thresholds.map((t) => t.ratioName))];
    const periodTypes = [...new Set(thresholds.map((t) => t.periodType))];
    expect(ratioNames.length).toBe(9);
    expect(periodTypes.length).toBe(3);
    db.close();
  });
});

// ============================================================
// Financial Data Validation Tests
// ============================================================

describe('Financial Data Validation', () => {
  it('accepts valid financial data', () => {
    const result = validateFinancialData({ ...VALID_FINANCIAL_DATA, subsidiaryId: 'sub1' });
    expect(result.valid).toBe(true);
  });

  it('rejects missing required fields', () => {
    const result = validateFinancialData({ subsidiaryId: 'sub1' });
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('rejects when accounting equation is violated', () => {
    const result = validateFinancialData({
      ...VALID_FINANCIAL_DATA,
      subsidiaryId: 'sub1',
      totalAssets: 999_999, // should be 1_200_000
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.field === 'totalAssets')).toBe(true);
  });

  it('rejects duplicate subsidiary+period combination', () => {
    const db = createTestDb();
    const { subsidiary } = createSubsidiary(db, { name: 'Sub A', industrySector: 'retail', fiscalYearStartMonth: 1, taxRate: 0.2 }, 'owner1');
    const fd = { ...VALID_FINANCIAL_DATA, subsidiaryId: subsidiary!.id };
    createFinancialData(db, fd, 'owner1');
    const result = createFinancialData(db, fd, 'owner1');
    expect(result.error).toBeTruthy();
    db.close();
  });
});

// ============================================================
// Ratio Calculation Tests
// ============================================================

describe('Ratio Calculation Engine', () => {
  it('calculates all 9 ratios correctly', () => {
    const data = {
      ...VALID_FINANCIAL_DATA,
      id: 'fd1',
      subsidiaryId: 'sub1',
      isRestated: false,
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'owner1',
    };
    const ratios = calculateRatios(data);

    // ROA = (100000 / 1200000) * 100 ≈ 8.33
    expect(ratios.roa).toBeCloseTo(8.33, 1);
    // ROE = (100000 / 600000) * 100 ≈ 16.67
    expect(ratios.roe).toBeCloseTo(16.67, 1);
    // NPM = (100000 / 1000000) * 100 = 10
    expect(ratios.npm).toBeCloseTo(10, 1);
    // DER = 600000 / 600000 = 1.0
    expect(ratios.der).toBeCloseTo(1.0, 2);
    // Current Ratio = 400000 / 200000 = 2.0
    expect(ratios.currentRatio).toBeCloseTo(2.0, 2);
    // Quick Ratio = (400000 - 50000) / 200000 = 1.75
    expect(ratios.quickRatio).toBeCloseTo(1.75, 2);
    // Cash Ratio = 200000 / 200000 = 1.0
    expect(ratios.cashRatio).toBeCloseTo(1.0, 2);
    // OCF Ratio = 150000 / 200000 = 0.75
    expect(ratios.ocfRatio).toBeCloseTo(0.75, 2);
    // DSCR = 150000 / (20000 + 50000 + 30000) = 1.5
    expect(ratios.dscr).toBeCloseTo(1.5, 2);
  });

  it('returns null for zero denominator', () => {
    const data = {
      ...VALID_FINANCIAL_DATA,
      id: 'fd1',
      subsidiaryId: 'sub1',
      totalAssets: 0,
      totalEquity: 0,
      currentLiabilities: 0,
      totalLiabilities: 0,
      revenue: 0,
      isRestated: false,
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'owner1',
    };
    const ratios = calculateRatios(data);
    expect(ratios.roa).toBeNull();
    expect(ratios.roe).toBeNull();
    expect(ratios.npm).toBeNull();
    expect(ratios.currentRatio).toBeNull();
  });

  it('health score is between 0 and 100', () => {
    const data = {
      ...VALID_FINANCIAL_DATA,
      id: 'fd1',
      subsidiaryId: 'sub1',
      isRestated: false,
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'owner1',
    };
    const ratios = calculateRatios(data);
    expect(ratios.healthScore).toBeGreaterThanOrEqual(0);
    expect(ratios.healthScore).toBeLessThanOrEqual(100);
  });
});

// ============================================================
// Financial Data CRUD + Versioning Tests
// ============================================================

describe('Financial Data CRUD and Versioning', () => {
  it('creates financial data and stores it', () => {
    const db = createTestDb();
    const { subsidiary } = createSubsidiary(db, { name: 'Sub A', industrySector: 'retail', fiscalYearStartMonth: 1, taxRate: 0.2 }, 'owner1');
    const fd = { ...VALID_FINANCIAL_DATA, subsidiaryId: subsidiary!.id };
    const result = createFinancialData(db, fd, 'owner1');
    expect(result.data).toBeDefined();
    expect(result.data!.subsidiaryId).toBe(subsidiary!.id);
    db.close();
  });

  it('creates a history record on update', () => {
    const db = createTestDb();
    const { subsidiary } = createSubsidiary(db, { name: 'Sub A', industrySector: 'retail', fiscalYearStartMonth: 1, taxRate: 0.2 }, 'owner1');
    const currentYear = new Date().getFullYear();
    const fd = {
      ...VALID_FINANCIAL_DATA,
      subsidiaryId: subsidiary!.id,
      periodStartDate: new Date(`${currentYear}-01-01`),
      periodEndDate: new Date(`${currentYear}-12-31`),
    };
    const { data } = createFinancialData(db, fd, 'owner1');

    updateFinancialData(db, data!.id, { revenue: 1_100_000 }, 'owner1', 'owner');
    const history = getFinancialDataHistory(db, data!.id);
    expect(history.length).toBe(1);
    expect(history[0].revenue).toBe(1_000_000); // old value
    db.close();
  });

  it('blocks non-owner from modifying historical data', () => {
    const db = createTestDb();
    const { subsidiary } = createSubsidiary(db, { name: 'Sub A', industrySector: 'retail', fiscalYearStartMonth: 1, taxRate: 0.2 }, 'owner1');
    // Use a past year date
    const fd = {
      ...VALID_FINANCIAL_DATA,
      subsidiaryId: subsidiary!.id,
      periodStartDate: new Date('2020-01-01'),
      periodEndDate: new Date('2020-12-31'),
    };
    const { data } = createFinancialData(db, fd, 'owner1');
    const result = updateFinancialData(db, data!.id, { revenue: 999 }, 'bod1', 'bod');
    expect(result.error).toBeTruthy();
    db.close();
  });
});

// ============================================================
// User Management Tests
// ============================================================

describe('User Management', () => {
  it('creates a user with strong password', async () => {
    const db = createTestDb();
    const result = await createUser(db, {
      username: 'testuser',
      email: 'test@example.com',
      password: 'StrongPass@123',
      role: 'bod',
      fullName: 'Test User',
    }, 'owner1');
    expect(result.user).toBeDefined();
    expect(result.user!.username).toBe('testuser');
    db.close();
  });

  it('rejects weak password', async () => {
    const db = createTestDb();
    const result = await createUser(db, {
      username: 'testuser',
      email: 'test@example.com',
      password: 'weak',
      role: 'bod',
      fullName: 'Test User',
    }, 'owner1');
    expect(result.error).toBeTruthy();
    db.close();
  });

  it('assigns multiple subsidiary access to a user', () => {
    const db = createTestDb();
    const { subsidiary: sub1 } = createSubsidiary(db, { name: 'Sub A', industrySector: 'retail', fiscalYearStartMonth: 1, taxRate: 0.2 }, 'owner1');
    const { subsidiary: sub2 } = createSubsidiary(db, { name: 'Sub B', industrySector: 'retail', fiscalYearStartMonth: 1, taxRate: 0.2 }, 'owner1');

    db.prepare(`INSERT INTO frs_users (id, username, email, password_hash, role, full_name) VALUES ('mgr1', 'mgr1', 'mgr1@test.com', 'hash', 'subsidiary_manager', 'Manager')`).run();

    const result = assignSubsidiaryAccess(db, 'mgr1', [sub1!.id, sub2!.id], 'owner1');
    expect(result.success).toBe(true);

    const access = getUserSubsidiaryAccess(db, 'mgr1');
    expect(access.length).toBe(2);
    db.close();
  });
});

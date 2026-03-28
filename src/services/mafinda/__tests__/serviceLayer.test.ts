// Service Layer Tests — MAFINDA Dashboard Enhancement
// Covers: departmentService, projectService, targetService,
//         financialStatementService, dashboardService

import { describe, test, expect, beforeEach } from 'vitest';
import Database from 'better-sqlite3';
import { initMafindaDashboardSchema } from '../../../db/initMafindaDashboard';

import {
  getAllDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  ConflictError,
  NotFoundError as DeptNotFoundError,
} from '../departmentService';

import {
  getProjectsByDepartment,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
} from '../projectService';

import {
  getTargets,
  upsertTarget,
  deleteTarget,
} from '../targetService';

import {
  saveBalanceSheet,
  getBalanceSheets,
  saveIncomeStatement,
  getIncomeStatements,
  saveCashFlow,
  getCashFlows,
  ValidationError,
} from '../financialStatementService';

import {
  calculateAchievementRate,
  calculateNetCashFlow,
  buildAssetComposition,
  buildEquityLiabilityComposition,
  getDeptRevenueTarget,
  getRevenueCostSummary,
  getCashFlowData,
  getAssetComposition,
  getEquityLiabilityComposition,
  getHistoricalData,
} from '../dashboardService';

// ─── Test DB Setup ────────────────────────────────────────────────────────────

function makeDb(): Database.Database {
  const db = new Database(':memory:');
  initMafindaDashboardSchema(db);
  return db;
}

// ─── Department Service ───────────────────────────────────────────────────────

describe('departmentService', () => {
  let db: Database.Database;

  beforeEach(() => {
    db = makeDb();
  });

  test('createDepartment — creates and returns a department', () => {
    const dept = createDepartment(db, { name: 'Engineering', description: 'Eng dept' });
    expect(dept.id).toBeTruthy();
    expect(dept.name).toBe('Engineering');
    expect(dept.description).toBe('Eng dept');
    expect(dept.isActive).toBe(true);
  });

  test('createDepartment — throws ConflictError (409) on duplicate name', () => {
    createDepartment(db, { name: 'ONM' });
    expect(() => createDepartment(db, { name: 'ONM' })).toThrowError(ConflictError);
  });

  test('getAllDepartments — returns all departments ordered by name', () => {
    createDepartment(db, { name: 'Zebra' });
    createDepartment(db, { name: 'Alpha' });
    const depts = getAllDepartments(db);
    expect(depts.length).toBe(2);
    expect(depts[0].name).toBe('Alpha');
    expect(depts[1].name).toBe('Zebra');
  });

  test('getDepartmentById — returns null for unknown id', () => {
    expect(getDepartmentById(db, 'nonexistent')).toBeNull();
  });

  test('updateDepartment — updates name and description', () => {
    const dept = createDepartment(db, { name: 'Old Name' });
    const updated = updateDepartment(db, dept.id, { name: 'New Name', description: 'Updated' });
    expect(updated.name).toBe('New Name');
    expect(updated.description).toBe('Updated');
  });

  test('updateDepartment — throws NotFoundError for unknown id', () => {
    expect(() => updateDepartment(db, 'bad-id', { name: 'X' })).toThrowError(DeptNotFoundError);
  });

  test('updateDepartment — throws ConflictError when renaming to existing name', () => {
    createDepartment(db, { name: 'Dept A' });
    const b = createDepartment(db, { name: 'Dept B' });
    expect(() => updateDepartment(db, b.id, { name: 'Dept A' })).toThrowError(ConflictError);
  });

  test('deleteDepartment — deletes and returns affected active projects', () => {
    const dept = createDepartment(db, { name: 'Finance' });
    createProject(db, { departmentId: dept.id, name: 'Project X' });
    const result = deleteDepartment(db, dept.id);
    expect(result.success).toBe(true);
    expect(result.affectedProjects.length).toBe(1);
    expect(result.affectedProjects[0].name).toBe('Project X');
    expect(getDepartmentById(db, dept.id)).toBeNull();
  });

  test('deleteDepartment — throws NotFoundError for unknown id', () => {
    expect(() => deleteDepartment(db, 'bad-id')).toThrowError(DeptNotFoundError);
  });
});

// ─── Project Service ──────────────────────────────────────────────────────────

describe('projectService', () => {
  let db: Database.Database;
  let deptId: string;

  beforeEach(() => {
    db = makeDb();
    deptId = createDepartment(db, { name: 'Engineering' }).id;
  });

  test('createProject — creates and returns a project', () => {
    const proj = createProject(db, { departmentId: deptId, name: 'Alpha', description: 'First' });
    expect(proj.id).toBeTruthy();
    expect(proj.name).toBe('Alpha');
    expect(proj.departmentId).toBe(deptId);
  });

  test('createProject — throws ConflictError (409) on duplicate name in same department', () => {
    createProject(db, { departmentId: deptId, name: 'Alpha' });
    expect(() => createProject(db, { departmentId: deptId, name: 'Alpha' })).toThrowError(ConflictError);
  });

  test('createProject — allows same name in different departments', () => {
    const dept2 = createDepartment(db, { name: 'Finance' }).id;
    createProject(db, { departmentId: deptId, name: 'Alpha' });
    const proj2 = createProject(db, { departmentId: dept2, name: 'Alpha' });
    expect(proj2.id).toBeTruthy();
  });

  test('getProjectsByDepartment — returns projects for department', () => {
    createProject(db, { departmentId: deptId, name: 'P1' });
    createProject(db, { departmentId: deptId, name: 'P2' });
    const projects = getProjectsByDepartment(db, deptId);
    expect(projects.length).toBe(2);
  });

  test('getProjectById — returns null for unknown id', () => {
    expect(getProjectById(db, 'nonexistent')).toBeNull();
  });

  test('updateProject — updates project name', () => {
    const proj = createProject(db, { departmentId: deptId, name: 'Old' });
    const updated = updateProject(db, proj.id, { name: 'New' });
    expect(updated.name).toBe('New');
  });

  test('deleteProject — removes project', () => {
    const proj = createProject(db, { departmentId: deptId, name: 'ToDelete' });
    const result = deleteProject(db, proj.id);
    expect(result.success).toBe(true);
    expect(getProjectById(db, proj.id)).toBeNull();
  });
});

// ─── Target Service ───────────────────────────────────────────────────────────

describe('targetService', () => {
  let db: Database.Database;

  beforeEach(() => {
    db = makeDb();
  });

  test('upsertTarget — creates a new target', () => {
    const target = upsertTarget(db, {
      entityType: 'department',
      entityId: 'dept-001',
      period: '2025-01',
      periodType: 'monthly',
      revenueTarget: 5_000_000,
      operationalCostTarget: 2_000_000,
    });
    expect(target.id).toBeTruthy();
    expect(target.revenueTarget).toBe(5_000_000);
  });

  test('upsertTarget — updates existing target without creating duplicate', () => {
    const key = { entityType: 'department' as const, entityId: 'dept-001', period: '2025-01', periodType: 'monthly' as const };
    upsertTarget(db, { ...key, revenueTarget: 1_000, operationalCostTarget: 500 });
    upsertTarget(db, { ...key, revenueTarget: 2_000, operationalCostTarget: 800 });

    const targets = getTargets(db, { entityType: 'department', entityId: 'dept-001', period: '2025-01' });
    expect(targets.length).toBe(1);
    expect(targets[0].revenueTarget).toBe(2_000);
  });

  test('getTargets — filters by entityType and period', () => {
    upsertTarget(db, { entityType: 'department', entityId: 'd1', period: '2025-01', periodType: 'monthly', revenueTarget: 100, operationalCostTarget: 50 });
    upsertTarget(db, { entityType: 'project', entityId: 'p1', period: '2025-01', periodType: 'monthly', revenueTarget: 200, operationalCostTarget: 80 });

    const deptTargets = getTargets(db, { entityType: 'department' });
    expect(deptTargets.length).toBe(1);
    expect(deptTargets[0].entityType).toBe('department');
  });

  test('deleteTarget — removes target', () => {
    const target = upsertTarget(db, { entityType: 'department', entityId: 'd1', period: '2025-02', periodType: 'monthly', revenueTarget: 100, operationalCostTarget: 50 });
    const result = deleteTarget(db, target.id);
    expect(result.success).toBe(true);
    expect(getTargets(db, { entityId: 'd1' }).length).toBe(0);
  });
});

// ─── Financial Statement Service ─────────────────────────────────────────────

describe('financialStatementService', () => {
  let db: Database.Database;

  const validBS = {
    period: '2025-01',
    currentAssets: 1_000_000,
    fixedAssets: 2_000_000,
    otherAssets: 500_000,
    shortTermLiabilities: 400_000,
    longTermLiabilities: 600_000,
    paidInCapital: 1_500_000,
    retainedEarnings: 800_000,
    otherEquity: 200_000,
  };

  const validIS = {
    period: '2025-01',
    revenue: 3_000_000,
    costOfGoodsSold: 1_200_000,
    operationalExpenses: 500_000,
    interestExpense: 50_000,
    tax: 100_000,
    netProfit: 1_150_000,
  };

  const validCF = {
    period: '2025-01',
    operatingCashIn: 2_000_000,
    operatingCashOut: 1_500_000,
    investingCashIn: 300_000,
    investingCashOut: 400_000,
    financingCashIn: 100_000,
    financingCashOut: 50_000,
  };

  beforeEach(() => {
    db = makeDb();
  });

  // Balance Sheet
  test('saveBalanceSheet — saves and returns balance sheet', () => {
    const bs = saveBalanceSheet(db, validBS);
    expect(bs.id).toBeTruthy();
    expect(bs.period).toBe('2025-01');
    expect(bs.currentAssets).toBe(1_000_000);
    expect(bs.version).toBe(1);
  });

  test('saveBalanceSheet — increments version on update', () => {
    saveBalanceSheet(db, validBS);
    const updated = saveBalanceSheet(db, { ...validBS, currentAssets: 1_200_000 });
    expect(updated.version).toBe(2);
    expect(updated.currentAssets).toBe(1_200_000);
  });

  test('saveBalanceSheet — throws ValidationError for negative values', () => {
    expect(() => saveBalanceSheet(db, { ...validBS, currentAssets: -1 })).toThrowError(ValidationError);
  });

  test('getBalanceSheets — returns all balance sheets', () => {
    saveBalanceSheet(db, validBS);
    saveBalanceSheet(db, { ...validBS, period: '2025-02' });
    expect(getBalanceSheets(db).length).toBe(2);
  });

  test('getBalanceSheets — filters by period', () => {
    saveBalanceSheet(db, validBS);
    saveBalanceSheet(db, { ...validBS, period: '2025-02' });
    const result = getBalanceSheets(db, { period: '2025-01' });
    expect(result.length).toBe(1);
    expect(result[0].period).toBe('2025-01');
  });

  // Income Statement
  test('saveIncomeStatement — saves and returns income statement', () => {
    const is = saveIncomeStatement(db, validIS);
    expect(is.id).toBeTruthy();
    expect(is.revenue).toBe(3_000_000);
    expect(is.version).toBe(1);
  });

  test('saveIncomeStatement — increments version on update', () => {
    saveIncomeStatement(db, validIS);
    const updated = saveIncomeStatement(db, { ...validIS, revenue: 4_000_000 });
    expect(updated.version).toBe(2);
  });

  test('saveIncomeStatement — throws ValidationError for negative values', () => {
    expect(() => saveIncomeStatement(db, { ...validIS, revenue: -100 })).toThrowError(ValidationError);
  });

  test('getIncomeStatements — returns all income statements', () => {
    saveIncomeStatement(db, validIS);
    saveIncomeStatement(db, { ...validIS, period: '2025-02' });
    expect(getIncomeStatements(db).length).toBe(2);
  });

  // Cash Flow
  test('saveCashFlow — saves and returns cash flow', () => {
    const cf = saveCashFlow(db, validCF);
    expect(cf.id).toBeTruthy();
    expect(cf.operatingCashIn).toBe(2_000_000);
    expect(cf.version).toBe(1);
  });

  test('saveCashFlow — increments version on update', () => {
    saveCashFlow(db, validCF);
    const updated = saveCashFlow(db, { ...validCF, operatingCashIn: 2_500_000 });
    expect(updated.version).toBe(2);
  });

  test('saveCashFlow — throws ValidationError for negative values', () => {
    expect(() => saveCashFlow(db, { ...validCF, operatingCashIn: -1 })).toThrowError(ValidationError);
  });

  test('getCashFlows — filters by period', () => {
    saveCashFlow(db, validCF);
    saveCashFlow(db, { ...validCF, period: '2025-02' });
    const result = getCashFlows(db, { period: '2025-01' });
    expect(result.length).toBe(1);
  });
});

// ─── Dashboard Service ────────────────────────────────────────────────────────

describe('dashboardService — pure helpers', () => {
  test('calculateAchievementRate — correct formula', () => {
    expect(calculateAchievementRate(1000, 800)).toBeCloseTo(80);
    expect(calculateAchievementRate(1000, 1000)).toBeCloseTo(100);
    expect(calculateAchievementRate(1000, 1200)).toBeCloseTo(120);
  });

  test('calculateAchievementRate — returns 0 when target is 0', () => {
    expect(calculateAchievementRate(0, 500)).toBe(0);
  });

  test('calculateNetCashFlow — cashIn minus cashOut', () => {
    expect(calculateNetCashFlow(3_000_000, 2_000_000)).toBe(1_000_000);
    expect(calculateNetCashFlow(1_000, 1_500)).toBe(-500);
  });

  test('buildAssetComposition — totalAssets equals sum of components', () => {
    const comp = buildAssetComposition('2025-01', 1_000_000, 2_000_000, 500_000);
    expect(comp.totalAssets).toBe(3_500_000);
    expect(comp.currentAssets + comp.fixedAssets + comp.otherAssets).toBe(comp.totalAssets);
  });

  test('buildEquityLiabilityComposition — totalAssets equals totalEquity + totalLiabilities', () => {
    const comp = buildEquityLiabilityComposition('2025-01', 1_000_000, 500_000, 200_000, 300_000, 400_000);
    expect(comp.totalEquity).toBe(1_700_000);
    expect(comp.totalLiabilities).toBe(700_000);
    expect(comp.totalAssets).toBe(comp.totalEquity + comp.totalLiabilities);
  });
});

describe('dashboardService — DB-backed functions', () => {
  let db: Database.Database;

  beforeEach(() => {
    db = makeDb();
  });

  test('getDeptRevenueTarget — returns departments with achievementRate', () => {
    const dept = createDepartment(db, { name: 'ONM' });
    upsertTarget(db, { entityType: 'department', entityId: dept.id, period: '2025-01', periodType: 'monthly', revenueTarget: 1_000_000, operationalCostTarget: 0 });
    // Insert realization
    db.prepare(`INSERT INTO mafinda_revenue_realizations (id, entity_type, entity_id, period, period_type, revenue, operational_cost) VALUES (?, 'department', ?, '2025-01', 'monthly', ?, 0)`)
      .run('real-001', dept.id, 800_000);

    const result = getDeptRevenueTarget(db, '2025-01', 'monthly');
    expect(result.departments.length).toBe(1);
    expect(result.departments[0].achievementRate).toBeCloseTo(80);
  });

  test('getAssetComposition — returns null when no data', () => {
    expect(getAssetComposition(db, '2025-01')).toBeNull();
  });

  test('getAssetComposition — returns correct composition', () => {
    db.prepare(`INSERT INTO mafinda_balance_sheets (id, period, current_assets, fixed_assets, other_assets, short_term_liabilities, long_term_liabilities, paid_in_capital, retained_earnings, other_equity, version) VALUES (?, ?, ?, ?, ?, 0, 0, 0, 0, 0, 1)`)
      .run('bs-001', '2025-01', 1_000_000, 2_000_000, 500_000);

    const comp = getAssetComposition(db, '2025-01');
    expect(comp).not.toBeNull();
    expect(comp!.totalAssets).toBe(3_500_000);
  });

  test('getEquityLiabilityComposition — returns correct totals', () => {
    db.prepare(`INSERT INTO mafinda_balance_sheets (id, period, current_assets, fixed_assets, other_assets, short_term_liabilities, long_term_liabilities, paid_in_capital, retained_earnings, other_equity, version) VALUES (?, ?, 0, 0, 0, ?, ?, ?, ?, ?, 1)`)
      .run('bs-002', '2025-02', 300_000, 400_000, 1_000_000, 500_000, 200_000);

    const comp = getEquityLiabilityComposition(db, '2025-02');
    expect(comp).not.toBeNull();
    expect(comp!.totalAssets).toBe(comp!.totalEquity + comp!.totalLiabilities);
  });

  test('getCashFlowData — netCashFlow equals cashIn minus cashOut', () => {
    db.prepare(`INSERT INTO mafinda_cash_flows (id, period, department_id, project_id, operating_cash_in, operating_cash_out, investing_cash_in, investing_cash_out, financing_cash_in, financing_cash_out, version) VALUES (?, '2025-01', NULL, NULL, ?, ?, 0, 0, 0, 0, 1)`)
      .run('cf-001', 3_000_000, 2_000_000);

    const result = getCashFlowData(db, '2025-01', 1);
    expect(result.data.length).toBe(1);
    expect(result.data[0].netCashFlow).toBe(1_000_000);
  });

  test('getRevenueCostSummary — returns zeros when no data', () => {
    const summary = getRevenueCostSummary(db, '2025-01');
    expect(summary.revenue).toBe(0);
    expect(summary.operationalCost).toBe(0);
  });

  test('getHistoricalData — returns data in ascending order', () => {
    db.prepare(`INSERT INTO mafinda_income_statements (id, period, revenue, cost_of_goods_sold, operational_expenses, interest_expense, tax, net_profit, version) VALUES (?, ?, ?, 0, 0, 0, 0, ?, 1)`)
      .run('is-001', '2025-01', 1_000_000, 100_000);
    db.prepare(`INSERT INTO mafinda_income_statements (id, period, revenue, cost_of_goods_sold, operational_expenses, interest_expense, tax, net_profit, version) VALUES (?, ?, ?, 0, 0, 0, 0, ?, 1)`)
      .run('is-002', '2025-02', 1_200_000, 120_000);

    const data = getHistoricalData(db, 12);
    expect(data.length).toBe(2);
    expect(data[0].period < data[1].period).toBe(true);
  });
});

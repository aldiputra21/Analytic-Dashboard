// Service Layer Tests — MAFINDA Dashboard Enhancement
// Covers: departmentService, projectService, targetService,
//         financialStatementService, dashboardService
//
// NOTE: DB-dependent tests are marked as .todo() pending PostgreSQL test infrastructure.
// Pure function tests remain active.

import { beforeEach, describe, test, expect, vi } from 'vitest';

const dbState = vi.hoisted(() => ({
  selectQueue: [] as any[][],
  insertReturningQueue: [] as any[][],
  updateReturningQueue: [] as any[][],
}));

function createQuery() {
  const query = {
    leftJoin: () => query,
    innerJoin: () => query,
    groupBy: () => query,
    where: () => query,
    limit: () => query,
    orderBy: () => query,
    then: (resolve: (value: unknown) => unknown) => resolve(dbState.selectQueue.shift() ?? []),
  };
  return query;
}

function createDbFacade() {
  return {
    select: () => ({
      from: () => createQuery(),
    }),
    insert: () => ({
      values: () => ({
        returning: async () => dbState.insertReturningQueue.shift() ?? [],
        then: (resolve: (value: unknown) => unknown) => resolve(undefined),
      }),
    }),
    update: () => ({
      set: () => ({
        where: () => ({
          returning: async () => dbState.updateReturningQueue.shift() ?? [],
          then: (resolve: (value: unknown) => unknown) => resolve(undefined),
        }),
      }),
    }),
    delete: () => ({
      where: async () => undefined,
    }),
  };
}

// Mock the DB connection so imports don't fail
vi.mock('../../../db/connection', () => ({
  db: {
    ...createDbFacade(),
    transaction: async (callback: (tx: ReturnType<typeof createDbFacade>) => unknown) => callback(createDbFacade()),
  },
}));

import {
  ConflictError,
  NotFoundError as DeptNotFoundError,
  createDepartment,
  getAllDepartments,
  getDepartmentById,
  updateDepartment,
  deleteDepartment,
} from '../departmentService';

import {
  createProject,
  getProjectsByDepartment,
  getProjectById,
  updateProject,
  deleteProject,
} from '../projectService';

import {
  upsertTarget,
  getTargets,
  deleteTarget,
} from '../targetService';

import {
  ValidationError,
  saveBalanceSheet,
  getBalanceSheets,
  saveIncomeStatement,
  getIncomeStatements,
  saveCashFlow,
  getCashFlows,
} from '../financialStatementService';

import {
  calculateAchievementRate,
  calculateNetCashFlow,
  buildAssetComposition,
  buildEquityLiabilityComposition,
  getDeptRevenueTarget,
  getAssetComposition,
  getEquityLiabilityComposition,
  getCashFlowData,
  getRevenueCostSummary,
  getHistoricalData,
} from '../dashboardService';

beforeEach(() => {
  dbState.selectQueue = [];
  dbState.insertReturningQueue = [];
  dbState.updateReturningQueue = [];
});

// --- Department Service ---

describe('departmentService', () => {
  test('createDepartment — creates and returns a department', async () => {
    dbState.selectQueue.push([]);
    dbState.insertReturningQueue.push([{
      id: 'dept-1',
      corporateId: 'corp-1',
      name: 'Engineering',
      code: 'ENG',
      description: 'Dept',
      headName: null,
      isActive: true,
      createdBy: 'tester',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedBy: null,
      updatedAt: null,
    }]);

    const result = await createDepartment({ corporateId: 'corp-1', name: 'Engineering', code: 'ENG', description: 'Dept' }, 'tester');

    expect(result.id).toBe('dept-1');
    expect(result.name).toBe('Engineering');
    expect(result.code).toBe('ENG');
  });

  test('createDepartment — throws ConflictError (409) on duplicate name', async () => {
    dbState.selectQueue.push([{ id: 'existing' }]);

    await expect(createDepartment({ corporateId: 'corp-1', name: 'Engineering', code: 'ENG' }, 'tester'))
      .rejects.toBeInstanceOf(ConflictError);
  });

  test('getAllDepartments — returns all departments ordered by name', async () => {
    dbState.selectQueue.push([
      {
        id: 'dept-1', corporateId: 'corp-1', name: 'Accounting', code: 'ACC', description: null,
        headName: null, isActive: true, createdBy: 'tester', createdAt: new Date('2026-01-01T00:00:00.000Z'), updatedBy: null, updatedAt: null,
      },
      {
        id: 'dept-2', corporateId: 'corp-1', name: 'Engineering', code: 'ENG', description: null,
        headName: null, isActive: true, createdBy: 'tester', createdAt: new Date('2026-01-02T00:00:00.000Z'), updatedBy: null, updatedAt: null,
      },
    ]);

    const result = await getAllDepartments('corp-1');

    expect(result.map((item) => item.name)).toEqual(['Accounting', 'Engineering']);
  });

  test('getDepartmentById — returns null for unknown id', async () => {
    dbState.selectQueue.push([]);

    await expect(getDepartmentById('missing')).resolves.toBeNull();
  });

  test('updateDepartment — updates name and description', async () => {
    dbState.selectQueue.push([{
      id: 'dept-1',
      corporateId: 'corp-1',
      name: 'Engineering',
      code: 'ENG',
      description: 'Old',
      headName: null,
      isActive: true,
      createdBy: 'tester',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedBy: null,
      updatedAt: null,
    }]);
    dbState.updateReturningQueue.push([{
      id: 'dept-1',
      corporateId: 'corp-1',
      name: 'Engineering Revamp',
      code: 'ENG',
      description: 'New',
      headName: null,
      isActive: true,
      createdBy: 'tester',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedBy: 'tester',
      updatedAt: new Date('2026-01-02T00:00:00.000Z'),
    }]);

    const result = await updateDepartment('dept-1', { name: 'Engineering Revamp', description: 'New' }, 'tester');

    expect(result.name).toBe('Engineering Revamp');
    expect(result.description).toBe('New');
  });

  test('updateDepartment — throws NotFoundError for unknown id', async () => {
    dbState.selectQueue.push([]);

    await expect(updateDepartment('missing', { name: 'New' }, 'tester')).rejects.toBeInstanceOf(DeptNotFoundError);
  });
  test('updateDepartment — throws ConflictError when changing code to an existing one', async () => {
    dbState.selectQueue.push([{
      id: 'dept-1',
      corporateId: 'corp-1',
      name: 'Engineering',
      code: 'ENG',
      description: null,
      headName: null,
      isActive: true,
      createdBy: 'tester',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedBy: null,
      updatedAt: null,
    }]);
    dbState.selectQueue.push([{ id: 'dept-2' }]);

    await expect(updateDepartment('dept-1', { code: 'OPS' }, 'tester')).rejects.toBeInstanceOf(ConflictError);
  });
  test('deleteDepartment — deletes and returns affected active projects', async () => {
    dbState.selectQueue.push([{
      id: 'dept-1',
      corporateId: 'corp-1',
      name: 'Engineering',
      code: 'ENG',
      description: null,
      headName: null,
      isActive: true,
      createdBy: 'tester',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedBy: null,
      updatedAt: null,
    }]);
    dbState.selectQueue.push([
      { id: 'proj-1', name: 'Alpha', departmentId: 'dept-1' },
      { id: 'proj-2', name: 'Beta', departmentId: 'dept-1' },
    ]);

    const result = await deleteDepartment('dept-1');

    expect(result.success).toBe(true);
    expect(result.affectedProjects).toHaveLength(2);
    expect(result.affectedProjects.map((item) => item.name)).toEqual(['Alpha', 'Beta']);
  });

  test('deleteDepartment — throws NotFoundError for unknown id', async () => {
    dbState.selectQueue.push([]);

    await expect(deleteDepartment('missing')).rejects.toBeInstanceOf(DeptNotFoundError);
  });
});

// --- Project Service ---

describe('projectService', () => {
  test('createProject — creates and returns a project', async () => {
    dbState.selectQueue.push([{ id: 'dept-1' }]);
    dbState.selectQueue.push([]);
    dbState.insertReturningQueue.push([{ id: 'proj-1' }]);
    dbState.selectQueue.push([{
      id: 'proj-1',
      departmentId: 'dept-1',
      departmentName: 'Engineering',
      code: 'ALPHA',
      name: 'Alpha',
      description: 'Project Alpha',
      sourceType: 'manual',
      sourceId: null,
      status: 'active',
      startDate: new Date('2026-01-01T00:00:00.000Z'),
      endDate: null,
      isActive: true,
      createdBy: 'tester',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedBy: null,
      updatedAt: null,
    }]);

    const result = await createProject({
      departmentId: 'dept-1',
      code: 'ALPHA',
      name: 'Alpha',
      description: 'Project Alpha',
      startDate: '2026-01-01',
    }, 'tester');

    expect(result.id).toBe('proj-1');
    expect(result.name).toBe('Alpha');
    expect(result.departmentName).toBe('Engineering');
  });

  test('createProject — throws ConflictError (409) on duplicate name in same department', async () => {
    dbState.selectQueue.push([{ id: 'dept-1' }]);
    dbState.selectQueue.push([{ id: 'proj-existing' }]);

    await expect(createProject({
      departmentId: 'dept-1',
      code: 'ALPHA',
      name: 'Alpha',
    }, 'tester')).rejects.toBeInstanceOf(ConflictError);
  });
  test('createProject — allows same name in different departments', async () => {
    dbState.selectQueue.push([{ id: 'dept-2' }]);
    dbState.selectQueue.push([]);
    dbState.insertReturningQueue.push([{ id: 'proj-2' }]);
    dbState.selectQueue.push([{
      id: 'proj-2',
      departmentId: 'dept-2',
      departmentName: 'Operations',
      code: 'ALPHA',
      name: 'Alpha',
      description: null,
      sourceType: 'manual',
      sourceId: null,
      status: 'active',
      startDate: null,
      endDate: null,
      isActive: true,
      createdBy: 'tester',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedBy: null,
      updatedAt: null,
    }]);

    const result = await createProject({
      departmentId: 'dept-2',
      code: 'ALPHA',
      name: 'Alpha',
    }, 'tester');

    expect(result.id).toBe('proj-2');
    expect(result.departmentId).toBe('dept-2');
  });
  test('getProjectsByDepartment — returns projects for department', async () => {
    dbState.selectQueue.push([{
      id: 'proj-1',
      departmentId: 'dept-1',
      departmentName: 'Engineering',
      code: 'ALPHA',
      name: 'Alpha',
      description: 'Project Alpha',
      sourceType: 'manual',
      sourceId: null,
      status: 'active',
      startDate: new Date('2026-01-01T00:00:00.000Z'),
      endDate: null,
      isActive: true,
      createdBy: 'tester',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedBy: null,
      updatedAt: null,
    }]);

    const result = await getProjectsByDepartment('dept-1');

    expect(result).toHaveLength(1);
    expect(result[0].departmentId).toBe('dept-1');
    expect(result[0].name).toBe('Alpha');
  });
  test('getProjectById — returns null for unknown id', async () => {
    dbState.selectQueue.push([]);

    await expect(getProjectById('missing')).resolves.toBeNull();
  });
  test('updateProject — updates project name', async () => {
    dbState.selectQueue.push([{
      id: 'proj-1',
      departmentId: 'dept-1',
      code: 'ALPHA',
      name: 'Alpha',
      description: null,
      sourceType: 'manual',
      sourceId: null,
      status: 'active',
      startDate: null,
      endDate: null,
      isActive: true,
      createdBy: 'tester',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedBy: null,
      updatedAt: null,
    }]);
    dbState.updateReturningQueue.push([{
      id: 'proj-1',
      departmentId: 'dept-1',
      code: 'ALPHA',
      name: 'Alpha Prime',
      description: null,
      sourceType: 'manual',
      sourceId: null,
      status: 'active',
      startDate: null,
      endDate: null,
      isActive: true,
      createdBy: 'tester',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedBy: 'tester',
      updatedAt: new Date('2026-01-02T00:00:00.000Z'),
    }]);
    dbState.selectQueue.push([{
      id: 'proj-1',
      departmentId: 'dept-1',
      departmentName: 'Engineering',
      code: 'ALPHA',
      name: 'Alpha Prime',
      description: null,
      sourceType: 'manual',
      sourceId: null,
      status: 'active',
      startDate: null,
      endDate: null,
      isActive: true,
      createdBy: 'tester',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedBy: 'tester',
      updatedAt: new Date('2026-01-02T00:00:00.000Z'),
    }]);

    const result = await updateProject('proj-1', { name: 'Alpha Prime' }, 'tester');

    expect(result.name).toBe('Alpha Prime');
  });
  test('deleteProject — removes project', async () => {
    dbState.selectQueue.push([{ id: 'proj-1' }]);

    await expect(deleteProject('proj-1')).resolves.toEqual({ success: true });
  });
});

// --- Target Service ---

describe('targetService', () => {
  test('upsertTarget — creates a new target', async () => {
    dbState.selectQueue.push([]);
    dbState.insertReturningQueue.push([{
      id: 'target-1',
      departmentId: 'dept-1',
      projectId: null,
      fiscalYear: 2025,
      fiscalMonth: 2,
      notes: 'Monthly target',
      createdBy: 'tester',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedBy: null,
      updatedAt: null,
    }]);
    dbState.selectQueue.push([{
      id: 'target-1',
      departmentId: 'dept-1',
      projectId: null,
      fiscalYear: 2025,
      fiscalMonth: 2,
      notes: 'Monthly target',
      createdBy: 'tester',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedBy: null,
      updatedAt: null,
    }]);
    dbState.selectQueue.push([
      {
        id: 'detail-1',
        targetHeaderId: 'target-1',
        targetType: 'revenue',
        costCenter: null,
        amount: '1500',
        notes: null,
      },
    ]);

    const result = await upsertTarget({
      departmentId: 'dept-1',
      fiscalYear: 2025,
      fiscalMonth: 2,
      notes: 'Monthly target',
      details: [{ targetType: 'revenue', amount: '1500' }],
    }, 'tester');

    expect(result.id).toBe('target-1');
    expect(result.createdBy).toBe('tester');
    expect(result.details).toHaveLength(1);
    expect(result.details[0].amount).toBe('1500');
  });
  test('upsertTarget — updates existing target without creating duplicate', async () => {
    dbState.selectQueue.push([{
      id: 'target-1',
      departmentId: 'dept-1',
      projectId: null,
      fiscalYear: 2025,
      fiscalMonth: 2,
      notes: 'Old notes',
      createdBy: 'tester',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedBy: null,
      updatedAt: null,
    }]);
    dbState.selectQueue.push([{
      id: 'target-1',
      departmentId: 'dept-1',
      projectId: null,
      fiscalYear: 2025,
      fiscalMonth: 2,
      notes: 'Updated notes',
      createdBy: 'tester',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedBy: 'reviewer',
      updatedAt: new Date('2026-01-02T00:00:00.000Z'),
    }]);
    dbState.selectQueue.push([
      {
        id: 'detail-2',
        targetHeaderId: 'target-1',
        targetType: 'opex',
        costCenter: 'OPS',
        amount: '700',
        notes: 'Cap',
      },
    ]);

    const result = await upsertTarget({
      departmentId: 'dept-1',
      fiscalYear: 2025,
      fiscalMonth: 2,
      notes: 'Updated notes',
      details: [{ targetType: 'opex', costCenter: 'OPS', amount: '700', notes: 'Cap' }],
    }, 'reviewer');

    expect(result.id).toBe('target-1');
    expect(result.notes).toBe('Updated notes');
    expect(result.updatedBy).toBe('reviewer');
    expect(result.details).toHaveLength(1);
    expect(result.details[0].targetType).toBe('opex');
  });
  test('getTargets — returns filtered targets with grouped details', async () => {
    dbState.selectQueue.push([{
      id: 'target-1',
      departmentId: 'dept-1',
      projectId: null,
      fiscalYear: 2025,
      fiscalMonth: 2,
      notes: 'Monthly target',
      createdBy: 'tester',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedBy: null,
      updatedAt: null,
    }]);
    dbState.selectQueue.push([
      {
        id: 'detail-1',
        targetHeaderId: 'target-1',
        targetType: 'revenue',
        costCenter: null,
        amount: '1500',
        notes: null,
      },
      {
        id: 'detail-2',
        targetHeaderId: 'target-1',
        targetType: 'opex',
        costCenter: 'OPS',
        amount: '700',
        notes: 'Cap',
      },
    ]);

    const result = await getTargets({ departmentId: 'dept-1', fiscalYear: 2025, fiscalMonth: 2 });

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('target-1');
    expect(result[0].details).toHaveLength(2);
    expect(result[0].details.map((item) => item.targetType)).toEqual(['revenue', 'opex']);
  });
  test('deleteTarget — removes target', async () => {
    dbState.selectQueue.push([{ id: 'target-1' }]);

    await expect(deleteTarget('target-1')).resolves.toEqual({ success: true });
  });
});

// --- Financial Statement Service ---

describe('financialStatementService', () => {
  test('saveBalanceSheet — saves and returns balance sheet', async () => {
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

    const result = await saveBalanceSheet({
      departmentId: 'dept-1',
      period: '2025-01',
      cashAndBank: '1000',
      accountsReceivable: '500',
      capital: '1500',
    }, 'tester');

    expect(result.id).toBe('bs-1');
    expect(result.period).toBe('2025-01');
    expect(result.cashAndBank).toBe('1000');
  });
  test('saveBalanceSheet — updates existing record for same department and period', async () => {
    dbState.selectQueue.push([{
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
    dbState.updateReturningQueue.push([{
      id: 'bs-1',
      departmentId: 'dept-1',
      period: '2025-01',
      cashAndBank: '1200',
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
      notes: 'revised',
      createdBy: 'tester',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedBy: 'reviewer',
      updatedAt: new Date('2026-01-02T00:00:00.000Z'),
    }]);

    const result = await saveBalanceSheet({
      departmentId: 'dept-1',
      period: '2025-01',
      cashAndBank: '1200',
      notes: 'revised',
    }, 'reviewer');

    expect(result.id).toBe('bs-1');
    expect(result.cashAndBank).toBe('1200');
    expect(result.updatedBy).toBe('reviewer');
  });
  test('saveBalanceSheet — throws ValidationError for negative values', async () => {
    await expect(saveBalanceSheet({
      departmentId: 'dept-1',
      period: '2025-01',
      cashAndBank: '-1',
    }, 'tester')).rejects.toBeInstanceOf(ValidationError);
  });
  test('getBalanceSheets — returns all balance sheets', async () => {
    dbState.selectQueue.push([{
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

    const result = await getBalanceSheets();

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('bs-1');
  });
  test('getBalanceSheets — filters by period', async () => {
    dbState.selectQueue.push([{
      id: 'bs-2',
      departmentId: 'dept-1',
      period: '2025-02',
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
      createdAt: new Date('2026-02-01T00:00:00.000Z'),
      updatedBy: null,
      updatedAt: null,
    }]);

    const result = await getBalanceSheets({ period: '2025-02' });

    expect(result).toHaveLength(1);
    expect(result[0].period).toBe('2025-02');
  });
  test('saveIncomeStatement — saves and returns income statement', async () => {
    dbState.selectQueue.push([]);
    dbState.insertReturningQueue.push([{
      id: 'is-1',
      departmentId: 'dept-1',
      period: '2025-01',
      revenue: '3000',
      cogs: '1200',
      operatingExpenses: '500',
      interestExpense: '50',
      taxExpense: '100',
      notes: null,
      createdBy: 'tester',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedBy: null,
      updatedAt: null,
    }]);

    const result = await saveIncomeStatement({
      departmentId: 'dept-1',
      period: '2025-01',
      revenue: '3000',
      cogs: '1200',
      operatingExpenses: '500',
    }, 'tester');

    expect(result.id).toBe('is-1');
    expect(result.revenue).toBe('3000');
  });
  test('saveIncomeStatement — updates existing record for same department and period', async () => {
    dbState.selectQueue.push([{
      id: 'is-1',
      departmentId: 'dept-1',
      period: '2025-01',
      revenue: '3000',
      cogs: '1200',
      operatingExpenses: '500',
      interestExpense: '50',
      taxExpense: '100',
      notes: null,
      createdBy: 'tester',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedBy: null,
      updatedAt: null,
    }]);
    dbState.updateReturningQueue.push([{
      id: 'is-1',
      departmentId: 'dept-1',
      period: '2025-01',
      revenue: '3200',
      cogs: '1200',
      operatingExpenses: '500',
      interestExpense: '50',
      taxExpense: '100',
      notes: 'revised',
      createdBy: 'tester',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedBy: 'reviewer',
      updatedAt: new Date('2026-01-02T00:00:00.000Z'),
    }]);

    const result = await saveIncomeStatement({
      departmentId: 'dept-1',
      period: '2025-01',
      revenue: '3200',
      notes: 'revised',
    }, 'reviewer');

    expect(result.id).toBe('is-1');
    expect(result.revenue).toBe('3200');
    expect(result.updatedBy).toBe('reviewer');
  });
  test('saveIncomeStatement — throws ValidationError for negative values', async () => {
    await expect(saveIncomeStatement({
      departmentId: 'dept-1',
      period: '2025-01',
      revenue: '-100',
    }, 'tester')).rejects.toBeInstanceOf(ValidationError);
  });
  test('getIncomeStatements — returns all income statements', async () => {
    dbState.selectQueue.push([{
      id: 'is-1',
      departmentId: 'dept-1',
      period: '2025-01',
      revenue: '3000',
      cogs: '1200',
      operatingExpenses: '500',
      interestExpense: '50',
      taxExpense: '100',
      notes: null,
      createdBy: 'tester',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedBy: null,
      updatedAt: null,
    }]);

    const result = await getIncomeStatements();

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('is-1');
  });
  test('saveCashFlow — saves and returns cash flow', async () => {
    dbState.selectQueue.push([]);
    dbState.insertReturningQueue.push([{
      id: 'cf-1',
      departmentId: 'dept-1',
      entityType: 'department',
      entityId: 'dept-1',
      period: '2025-01',
      week: 'W1',
      operatingCashIn: '1000',
      operatingCashOut: '800',
      investingCashIn: '100',
      investingCashOut: '90',
      financingCashIn: '50',
      financingCashOut: '30',
      notes: null,
      createdBy: 'tester',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedBy: null,
      updatedAt: null,
    }]);

    const result = await saveCashFlow({
      departmentId: 'dept-1',
      entityType: 'department',
      entityId: 'dept-1',
      period: '2025-01',
      week: 'W1',
      operatingCashIn: '1000',
      operatingCashOut: '800',
    }, 'tester');

    expect(result.id).toBe('cf-1');
    expect(result.week).toBe('W1');
  });
  test('saveCashFlow — updates existing record for same entity, period, and week', async () => {
    dbState.selectQueue.push([{
      id: 'cf-1',
      departmentId: 'dept-1',
      entityType: 'department',
      entityId: 'dept-1',
      period: '2025-01',
      week: 'W1',
      operatingCashIn: '1000',
      operatingCashOut: '800',
      investingCashIn: '100',
      investingCashOut: '90',
      financingCashIn: '50',
      financingCashOut: '30',
      notes: null,
      createdBy: 'tester',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedBy: null,
      updatedAt: null,
    }]);
    dbState.updateReturningQueue.push([{
      id: 'cf-1',
      departmentId: 'dept-1',
      entityType: 'department',
      entityId: 'dept-1',
      period: '2025-01',
      week: 'W1',
      operatingCashIn: '1300',
      operatingCashOut: '800',
      investingCashIn: '100',
      investingCashOut: '90',
      financingCashIn: '50',
      financingCashOut: '30',
      notes: 'revised',
      createdBy: 'tester',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedBy: 'reviewer',
      updatedAt: new Date('2026-01-02T00:00:00.000Z'),
    }]);

    const result = await saveCashFlow({
      departmentId: 'dept-1',
      entityType: 'department',
      entityId: 'dept-1',
      period: '2025-01',
      week: 'W1',
      operatingCashIn: '1300',
      notes: 'revised',
    }, 'reviewer');

    expect(result.id).toBe('cf-1');
    expect(result.operatingCashIn).toBe('1300');
    expect(result.updatedBy).toBe('reviewer');
  });
  test('saveCashFlow — throws ValidationError for negative values', async () => {
    await expect(saveCashFlow({
      departmentId: 'dept-1',
      entityType: 'department',
      entityId: 'dept-1',
      period: '2025-01',
      week: 'W1',
      operatingCashIn: '-50',
    }, 'tester')).rejects.toBeInstanceOf(ValidationError);
  });
  test('getCashFlows — filters by period', async () => {
    dbState.selectQueue.push([{
      id: 'cf-2',
      departmentId: 'dept-1',
      entityType: 'department',
      entityId: 'dept-1',
      period: '2025-02',
      week: 'W1',
      operatingCashIn: '1000',
      operatingCashOut: '800',
      investingCashIn: '100',
      investingCashOut: '90',
      financingCashIn: '50',
      financingCashOut: '30',
      notes: null,
      createdBy: 'tester',
      createdAt: new Date('2026-02-01T00:00:00.000Z'),
      updatedBy: null,
      updatedAt: null,
    }]);

    const result = await getCashFlows({ period: '2025-02' });

    expect(result).toHaveLength(1);
    expect(result[0].period).toBe('2025-02');
  });
});

// --- Dashboard Service — Pure Helpers ---

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
    const comp = buildAssetComposition('2025-01', 1_000_000, 2_000_000);
    expect(comp.totalAssets).toBe(3_000_000);
    expect(comp.currentAssets + comp.fixedAssets).toBe(comp.totalAssets);
  });

  test('buildEquityLiabilityComposition — totalEquityAndLiabilities equals totalEquity + totalLiabilities', () => {
    const comp = buildEquityLiabilityComposition('2025-01', 1_000_000, 500_000, 200_000, 300_000, 400_000, 100_000);
    expect(comp.totalEquity).toBe(1_400_000);
    expect(comp.totalLiabilities).toBe(500_000);
    expect(comp.totalEquityAndLiabilities).toBe(comp.totalEquity + comp.totalLiabilities);
  });
});

// --- Dashboard Service — DB-backed ---

describe('dashboardService — DB-backed functions', () => {
  test('getDeptRevenueTarget — returns departments with achievementRate', async () => {
    dbState.selectQueue.push([
      { id: 'dept-1', name: 'Engineering' },
      { id: 'dept-2', name: 'Operations' },
    ]);
    dbState.selectQueue.push([{ amount: '1000' }]);
    dbState.selectQueue.push([{ revenue: '800' }]);
    dbState.selectQueue.push([]);
    dbState.selectQueue.push([{ revenue: '500' }]);

    const result = await getDeptRevenueTarget('2025-02', 'corp-1');

    expect(result.period).toBe('2025-02');
    expect(result.departments).toEqual([
      {
        departmentId: 'dept-1',
        departmentName: 'Engineering',
        target: 1000,
        realization: 800,
        achievementRate: 80,
      },
      {
        departmentId: 'dept-2',
        departmentName: 'Operations',
        target: 0,
        realization: 500,
        achievementRate: 0,
      },
    ]);
  });
  test('getAssetComposition — returns null when no data', async () => {
    dbState.selectQueue.push([]);

    await expect(getAssetComposition('2025-01')).resolves.toBeNull();
  });
  test('getAssetComposition — returns correct composition', async () => {
    dbState.selectQueue.push([{
      period: '2025-01',
      currentAssets: '1000',
      fixedAssets: '2500',
    }]);

    const result = await getAssetComposition('2025-01');

    expect(result?.currentAssets).toBe(1000);
    expect(result?.fixedAssets).toBe(2500);
    expect(result?.totalAssets).toBe(3500);
  });
  test('getEquityLiabilityComposition — returns correct totals', async () => {
    dbState.selectQueue.push([{
      period: '2025-01',
      capital: '1000',
      earningsAfterTax: '300',
      retainedEarnings: '200',
      dividends: '100',
      currentLiabilities: '400',
      longTermLiabilities: '500',
    }]);

    const result = await getEquityLiabilityComposition('2025-01');

    expect(result?.totalEquity).toBe(1400);
    expect(result?.totalLiabilities).toBe(900);
    expect(result?.totalAssets).toBe(2300);
  });
  test('getCashFlowData — netCashFlow equals cashIn minus cashOut', async () => {
    dbState.selectQueue.push([
      { period: '2025-01', cashIn: '1500', cashOut: '1000' },
      { period: '2025-02', cashIn: '900', cashOut: '1200' },
    ]);

    const result = await getCashFlowData('2025-02', 2);

    expect(result.data).toHaveLength(2);
    expect(result.data[0].netCashFlow).toBe(500);
    expect(result.data[1].netCashFlow).toBe(-300);
  });
  test('getRevenueCostSummary — returns zeros when no data', async () => {
    dbState.selectQueue.push([{ revenue: '0', opex: '0' }]);
    dbState.selectQueue.push([{ revenue: '0', opex: '0' }]);

    const result = await getRevenueCostSummary('2025-02');

    expect(result).toEqual({
      period: '2025-02',
      revenue: 0,
      revenueChange: 0,
      operationalCost: 0,
      operationalCostChange: 0,
    });
  });
  test('getHistoricalData — returns data in ascending order', async () => {
    dbState.selectQueue.push([
      { period: '2025-03', revenue: '2500', netProfit: '500' },
      { period: '2025-02', revenue: '2000', netProfit: '400' },
    ]);
    dbState.selectQueue.push([
      { period: '2025-03', totalAssets: '9000', totalLiabilities: '3500' },
      { period: '2025-02', totalAssets: '8500', totalLiabilities: '3000' },
    ]);

    const result = await getHistoricalData(2);

    expect(result.map((item) => item.period)).toEqual(['2025-02', '2025-03']);
    expect(result[0]).toEqual({
      period: '2025-02',
      revenue: 2000,
      netProfit: 400,
      totalAssets: 8500,
      totalLiabilities: 3000,
    });
    expect(result[1]).toEqual({
      period: '2025-03',
      revenue: 2500,
      netProfit: 500,
      totalAssets: 9000,
      totalLiabilities: 3500,
    });
  });
});

// API Integration Tests — MAFINDA Dashboard Enhancement
// Validates router contracts with mocked service layer

import { describe, test, expect, beforeEach, vi } from 'vitest';
import express from 'express';
import request from 'supertest';
import { createDepartmentRouter } from '../management/departments';
import { createProjectRouter } from '../management/projects';
import { createTargetRouter } from '../management/targets';
import { createFinancialStatementRouter } from '../management/financialStatements';
import { createMafindaDashboardRouter } from '../dashboard/mafindaDashboard';

const store = {
  departments: [] as any[],
  projects: [] as any[],
  targets: [] as any[],
  balanceSheets: [] as any[],
  incomeStatements: [] as any[],
  cashFlows: [] as any[],
};

let idSeq = 1;
const nextId = (prefix: string) => `${prefix}-${idSeq++}`;

vi.mock('../../services/mafinda/departmentService.js', () => {
  class ConflictError extends Error {}
  class NotFoundError extends Error {}

  return {
    ConflictError,
    NotFoundError,
    getAllDepartments: vi.fn(async (corporateId: string) =>
      store.departments.filter((d) => d.corporateId === corporateId)
    ),
    getDepartmentById: vi.fn(),
    createDepartment: vi.fn(async (input: any) => {
      const dup = store.departments.find(
        (d) => d.corporateId === input.corporateId && d.name.toLowerCase() === input.name.toLowerCase()
      );
      if (dup) throw new ConflictError('duplicate');
      const row = {
        id: nextId('dept'),
        corporateId: input.corporateId,
        name: input.name,
        code: input.code,
        description: input.description,
      };
      store.departments.push(row);
      return row;
    }),
    updateDepartment: vi.fn(async (id: string, input: any) => {
      const row = store.departments.find((d) => d.id === id);
      if (!row) throw new NotFoundError('not found');
      Object.assign(row, input);
      return row;
    }),
    deleteDepartment: vi.fn(async (id: string) => {
      const idx = store.departments.findIndex((d) => d.id === id);
      if (idx === -1) throw new NotFoundError('not found');
      store.departments.splice(idx, 1);
      return { success: true };
    }),
  };
});

vi.mock('../../services/mafinda/projectService.js', () => {
  class NotFoundError extends Error {}
  class ConflictError extends Error {}

  return {
    getProjectsByDepartment: vi.fn(async (departmentId: string) =>
      store.projects.filter((p) => p.departmentId === departmentId)
    ),
    getProjectById: vi.fn(),
    createProject: vi.fn(async (input: any) => {
      const dept = store.departments.find((d) => d.id === input.departmentId);
      if (!dept) throw new NotFoundError('dept not found');
      const dup = store.projects.find(
        (p) => p.departmentId === input.departmentId && p.name.toLowerCase() === input.name.toLowerCase()
      );
      if (dup) throw new ConflictError('duplicate');
      const row = {
        id: nextId('proj'),
        departmentId: input.departmentId,
        departmentName: dept.name,
        code: input.code,
        name: input.name,
      };
      store.projects.push(row);
      return row;
    }),
    updateProject: vi.fn(async (id: string, input: any) => {
      const row = store.projects.find((p) => p.id === id);
      if (!row) throw new NotFoundError('not found');
      Object.assign(row, input);
      return row;
    }),
    deleteProject: vi.fn(async (id: string) => {
      const idx = store.projects.findIndex((p) => p.id === id);
      if (idx === -1) throw new NotFoundError('not found');
      store.projects.splice(idx, 1);
      return { success: true };
    }),
  };
});

vi.mock('../../services/mafinda/targetService.js', () => ({
  getTargets: vi.fn(async (filters: any) =>
    store.targets.filter((t) =>
      (filters.departmentId ? t.departmentId === filters.departmentId : true) &&
      (filters.projectId ? t.projectId === filters.projectId : true) &&
      (filters.fiscalYear ? t.fiscalYear === filters.fiscalYear : true) &&
      (filters.fiscalMonth ? t.fiscalMonth === filters.fiscalMonth : true)
    )
  ),
  upsertTarget: vi.fn(async (input: any) => {
    const idx = store.targets.findIndex(
      (t) =>
        t.departmentId === input.departmentId &&
        t.projectId === input.projectId &&
        t.fiscalYear === input.fiscalYear &&
        t.fiscalMonth === input.fiscalMonth
    );
    if (idx >= 0) {
      store.targets[idx] = { ...store.targets[idx], ...input };
      return store.targets[idx];
    }
    const row = { id: nextId('target'), ...input };
    store.targets.push(row);
    return row;
  }),
  deleteTarget: vi.fn(async (id: string) => {
    const idx = store.targets.findIndex((t) => t.id === id);
    if (idx === -1) throw new Error('not found');
    store.targets.splice(idx, 1);
    return { success: true };
  }),
}));

vi.mock('../../services/mafinda/financialStatementService.js', () => {
  class ValidationError extends Error {}
  return {
    ValidationError,
    saveBalanceSheet: vi.fn(async (input: any) => {
      const numericKeys = Object.keys(input).filter((k) =>
        [
          'cashAndBank',
          'accountsReceivable',
          'workInProgress',
          'inventory',
          'prepaidExpenses',
          'land',
          'building',
          'equipment',
          'otherFixedAssets',
          'accountsPayable',
          'bankLoanCurrent',
          'otherCurrentLiabilities',
          'bankLoanLongTerm',
          'otherLongTermLiabilities',
          'shareholderLoan',
          'capital',
          'earningsAfterTax',
          'retainedEarnings',
          'dividends',
        ].includes(k)
      );
      for (const key of numericKeys) {
        if (input[key] != null && Number(input[key]) < 0) throw new ValidationError('negative value');
      }
      const row = { id: nextId('bs'), ...input };
      store.balanceSheets.push(row);
      return row;
    }),
    getBalanceSheets: vi.fn(async (filter: any) =>
      store.balanceSheets.filter((b) =>
        (filter.period ? b.period === filter.period : true) &&
        (filter.departmentId ? b.departmentId === filter.departmentId : true)
      )
    ),
    saveIncomeStatement: vi.fn(async (input: any) => {
      if (input.revenue != null && Number(input.revenue) < 0) throw new ValidationError('negative revenue');
      const row = { id: nextId('is'), ...input };
      store.incomeStatements.push(row);
      return row;
    }),
    getIncomeStatements: vi.fn(async (filter: any) =>
      store.incomeStatements.filter((b) =>
        (filter.period ? b.period === filter.period : true) &&
        (filter.departmentId ? b.departmentId === filter.departmentId : true)
      )
    ),
    saveCashFlow: vi.fn(async (input: any) => {
      const numericKeys = [
        'operatingCashIn',
        'operatingCashOut',
        'investingCashIn',
        'investingCashOut',
        'financingCashIn',
        'financingCashOut',
      ];
      for (const key of numericKeys) {
        if (input[key] != null && Number(input[key]) < 0) throw new ValidationError('negative cash value');
      }
      const row = { id: nextId('cf'), ...input };
      store.cashFlows.push(row);
      return row;
    }),
    getCashFlows: vi.fn(async (filter: any) =>
      store.cashFlows.filter((b) =>
        (filter.period ? b.period === filter.period : true) &&
        (filter.departmentId ? b.departmentId === filter.departmentId : true)
      )
    ),
  };
});

vi.mock('../../services/mafinda/dashboardService.js', () => ({
  getDeptRevenueTarget: vi.fn(async (period: string, corporateId: string) => ({
    period,
    corporateId,
    departments: [],
  })),
  getRevenueCostSummary: vi.fn(async (period: string) => ({
    period,
    revenue: 100,
    operationalCost: 40,
    revenueChange: 10,
    operationalCostChange: 5,
  })),
  getCashFlowData: vi.fn(async () => ({ data: [] })),
  getAssetComposition: vi.fn(async (period: string) => ({
    period,
    currentAssets: 100,
    fixedAssets: 200,
    otherAssets: 0,
    totalAssets: 300,
  })),
  getEquityLiabilityComposition: vi.fn(async (period: string) => ({
    period,
    paidInCapital: 120,
    retainedEarnings: 30,
    otherEquity: 0,
    shortTermLiabilities: 80,
    longTermLiabilities: 70,
    totalEquity: 150,
    totalLiabilities: 150,
    totalAssets: 300,
  })),
  getHistoricalData: vi.fn(async () => []),
}));

// ─── Test App Setup ───────────────────────────────────────────────────────────

function makeApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/departments', createDepartmentRouter());
  app.use('/api/projects', createProjectRouter());
  app.use('/api/targets', createTargetRouter());
  app.use('/api/financial-statements', createFinancialStatementRouter());
  app.use('/api/dashboard', createMafindaDashboardRouter());

  return { app };
}

beforeEach(() => {
  store.departments.length = 0;
  store.projects.length = 0;
  store.targets.length = 0;
  store.balanceSheets.length = 0;
  store.incomeStatements.length = 0;
  store.cashFlows.length = 0;
  idSeq = 1;
});

// ─── Department Routes ────────────────────────────────────────────────────────

describe('Departments API', () => {
  test('GET requires corporateId', async () => {
    const { app } = makeApp();
    const res = await request(app).get('/api/departments');
    expect(res.status).toBe(400);
  });

  test('POST creates department and GET returns it', async () => {
    const { app } = makeApp();
    const createRes = await request(app).post('/api/departments').send({
      corporateId: 'corp-1',
      name: 'Engineering',
      code: 'ENG',
      description: 'Eng dept',
    });
    expect(createRes.status).toBe(201);

    const listRes = await request(app).get('/api/departments?corporateId=corp-1');
    expect(listRes.status).toBe(200);
    expect(listRes.body.length).toBe(1);
  });

  test('POST returns 409 on duplicate name per corporate', async () => {
    const { app } = makeApp();
    await request(app).post('/api/departments').send({ corporateId: 'corp-1', name: 'ONM', code: 'ONM' });
    const res = await request(app).post('/api/departments').send({ corporateId: 'corp-1', name: 'ONM', code: 'ONM2' });
    expect(res.status).toBe(409);
  });
});

// ─── Project Routes ───────────────────────────────────────────────────────────

describe('Projects API', () => {
  test('POST validates required fields', async () => {
    const { app } = makeApp();
    const res = await request(app).post('/api/projects').send({ name: 'Alpha' });
    expect(res.status).toBe(400);
  });

  test('POST creates project and GET returns list', async () => {
    const { app } = makeApp();
    const dept = await request(app).post('/api/departments').send({ corporateId: 'corp-1', name: 'Eng', code: 'ENG' });
    const createRes = await request(app).post('/api/projects').send({
      departmentId: dept.body.id,
      name: 'Alpha',
      code: 'ALP',
    });
    expect(createRes.status).toBe(201);

    const listRes = await request(app).get('/api/projects?departmentId=' + dept.body.id);
    expect(listRes.status).toBe(200);
    expect(listRes.body.length).toBe(1);
  });
});

// ─── Target Routes ────────────────────────────────────────────────────────────

describe('Targets API', () => {
  test('POST validates required fields', async () => {
    const { app } = makeApp();
    const res = await request(app).post('/api/targets').send({ departmentId: 'd1' });
    expect(res.status).toBe(400);
  });

  test('POST upserts target and GET returns one row', async () => {
    const { app } = makeApp();
    const payload = {
      departmentId: 'd1',
      fiscalYear: 2025,
      fiscalMonth: 1,
      details: [{ targetType: 'revenue', amount: 1000 }],
    };

    const createRes = await request(app).post('/api/targets').send(payload);
    expect(createRes.status).toBe(201);

    await request(app).post('/api/targets').send({ ...payload, details: [{ targetType: 'revenue', amount: 2000 }] });

    const listRes = await request(app).get('/api/targets?departmentId=d1&fiscalYear=2025&fiscalMonth=1');
    expect(listRes.status).toBe(200);
    expect(listRes.body.length).toBe(1);
  });
});

// ─── Financial Statement Routes ───────────────────────────────────────────────

describe('Financial Statements API', () => {
  test('POST balance-sheet validates required fields', async () => {
    const { app } = makeApp();
    const res = await request(app).post('/api/financial-statements/balance-sheet').send({ period: '2025-01' });
    expect(res.status).toBe(400);
  });

  test('POST and GET balance-sheet', async () => {
    const { app } = makeApp();
    const createRes = await request(app).post('/api/financial-statements/balance-sheet').send({
      departmentId: 'd1',
      period: '2025-01',
      cashAndBank: 1000,
      accountsReceivable: 500,
      capital: 1200,
    });
    expect(createRes.status).toBe(201);

    const listRes = await request(app).get('/api/financial-statements/balance-sheet?departmentId=d1&period=2025-01');
    expect(listRes.status).toBe(200);
    expect(listRes.body.length).toBe(1);
  });

  test('POST income-statement validates negative revenue', async () => {
    const { app } = makeApp();
    const res = await request(app).post('/api/financial-statements/income-statement').send({
      departmentId: 'd1',
      period: '2025-01',
      revenue: -1,
    });
    expect(res.status).toBe(400);
  });

  test('POST and GET cash-flow', async () => {
    const { app } = makeApp();
    const createRes = await request(app).post('/api/financial-statements/cash-flow').send({
      departmentId: 'd1',
      entityType: 'department',
      entityId: 'd1',
      period: '2025-01',
      week: 'W1',
      operatingCashIn: 1000,
      operatingCashOut: 800,
      investingCashIn: 100,
      investingCashOut: 90,
      financingCashIn: 50,
      financingCashOut: 30,
    });
    expect(createRes.status).toBe(201);

    const listRes = await request(app).get('/api/financial-statements/cash-flow?departmentId=d1&period=2025-01');
    expect(listRes.status).toBe(200);
    expect(listRes.body.length).toBe(1);
  });
});

// ─── Dashboard Routes ─────────────────────────────────────────────────────────

describe('Dashboard API', () => {
  test('dept-revenue-target requires period and corporateId', async () => {
    const { app } = makeApp();
    const res = await request(app).get('/api/dashboard/dept-revenue-target?period=2025-01');
    expect(res.status).toBe(400);
  });

  test('revenue-cost-summary requires period', async () => {
    const { app } = makeApp();
    const res = await request(app).get('/api/dashboard/revenue-cost-summary');
    expect(res.status).toBe(400);
  });

  test('cash-flow requires period', async () => {
    const { app } = makeApp();
    const res = await request(app).get('/api/dashboard/cash-flow');
    expect(res.status).toBe(400);
  });

  test('asset-composition requires period', async () => {
    const { app } = makeApp();
    const res = await request(app).get('/api/dashboard/asset-composition');
    expect(res.status).toBe(400);
  });

  test('equity-liability-composition requires period', async () => {
    const { app } = makeApp();
    const res = await request(app).get('/api/dashboard/equity-liability-composition');
    expect(res.status).toBe(400);
  });

  test('historical-data validates months', async () => {
    const { app } = makeApp();
    const bad = await request(app).get('/api/dashboard/historical-data?months=7');
    expect(bad.status).toBe(400);

    const ok = await request(app).get('/api/dashboard/historical-data?months=6');
    expect(ok.status).toBe(200);
    expect(Array.isArray(ok.body)).toBe(true);
  });
});

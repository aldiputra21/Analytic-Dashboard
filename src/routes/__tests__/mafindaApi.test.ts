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

vi.mock('../../services/mafinda/departmentService', () => {
  class ConflictError extends Error { name = 'ConflictError'; }
  class NotFoundError extends Error { name = 'NotFoundError'; }

  return {
    ConflictError,
    NotFoundError,
    getAllDepartments: vi.fn(async (options: any) => ({
      records: store.departments.filter((d) => 
        (options.corporateId ? d.corporateId === options.corporateId : true)
      ),
      totalCount: store.departments.length
    })),
    getActiveDepartments: vi.fn(async () => store.departments),
    getDepartmentById: vi.fn(async (id: string) => store.departments.find(d => d.id === id)),
    createDepartment: vi.fn(async (input: any) => {
      const dup = store.departments.find(
        (d) => d.corporateId === input.corporateId && d.name.toLowerCase() === input.name.toLowerCase()
      );
      if (dup) throw new ConflictError('duplicate');
      const row = {
        id: nextId('dept'),
        ...input
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


vi.mock('../../services/mafinda/projectService', () => {
  class NotFoundError extends Error { name = 'NotFoundError'; }
  class ConflictError extends Error { name = 'ConflictError'; }

  return {
    getProjectsByDepartment: vi.fn(async (departmentId: string) => ({
      records: store.projects.filter((p) => p.departmentId === departmentId),
      totalCount: store.projects.length
    })),
    getAllProjects: vi.fn(async (options: any) => ({
      records: store.projects.filter((p) => 
        (!options.corporateId || p.corporateId === options.corporateId) &&
        (!options.departmentId || p.departmentId === options.departmentId)
      ),
      totalCount: store.projects.length
    })),
    getActiveProjects: vi.fn(async () => store.projects),
    getProjectById: vi.fn(),
    createProject: vi.fn(async (input: any) => {
      const row = {
        id: nextId('proj'),
        ...input
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



vi.mock('../../services/mafinda/targetService', () => ({
  getAnnualTargets: vi.fn(async (filters: any) => ({
    records: store.targets.filter((t) =>
      (filters.departmentId ? t.departmentId === filters.departmentId : true) &&
      (filters.projectId ? t.projectId === filters.projectId : true) &&
      (filters.fiscalYear ? t.fiscalYear === filters.fiscalYear : true)
    ),
    totalCount: store.targets.length
  })),
  saveAnnualTarget: vi.fn(async (input: any) => {
    const row = { id: nextId('target'), ...input };
    store.targets.push(row);
    return row;
  }),
  deleteAnnualTarget: vi.fn(async (id: string) => {
    const idx = store.targets.findIndex((t) => t.id === id);
    if (idx === -1) throw new Error('not found');
    store.targets.splice(idx, 1);
    return { success: true };
  }),
}));


vi.mock('../../middleware/auth', () => ({
  authenticate: vi.fn((req: any, res: any, next: any) => {
    req.user = { userId: 'test-user', role: 'owner' };
    next();
  }),
  requireFRSAuth: vi.fn((req: any, res: any, next: any) => {
    req.user = { userId: 'test-user', role: 'owner' };
    next();
  }),
}));

vi.mock('../../middleware/rbac', () => ({
  requirePermission: vi.fn(() => (req: any, res: any, next: any) => {
    next();
  }),
  injectAccessContext: vi.fn((req: any, res: any, next: any) => {
    req.accessContext = { scope: 'system', corporateIds: [], departmentIds: [] };
    next();
  }),
  requireSubsidiaryAccess: vi.fn(() => (req: any, res: any, next: any) => {
    next();
  }),
  requireScope: vi.fn(() => (req: any, res: any, next: any) => {
    next();
  }),
}));


vi.mock('../../services/mafinda/financialStatementService', () => {
  class ValidationError extends Error { name = 'ValidationError'; }
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
    getBalanceSheets: vi.fn(async (access: any, filter: any) => ({
      data: store.balanceSheets.filter((b) =>
        (filter.period ? b.period === filter.period : true) &&
        (filter.corporateId ? b.corporateId === filter.corporateId : true)
      ),
      totalCount: store.balanceSheets.length
    })),
    saveIncomeStatement: vi.fn(async (input: any) => {
      if (input.revenue != null && Number(input.revenue) < 0) throw new ValidationError('negative revenue');
      const row = { id: nextId('is'), ...input };
      store.incomeStatements.push(row);
      return row;
    }),
    getIncomeStatements: vi.fn(async (access: any, filter: any) => ({
      data: store.incomeStatements.filter((b) =>
        (filter.period ? b.period === filter.period : true) &&
        (filter.corporateId ? b.corporateId === filter.corporateId : true)
      ),
      totalCount: store.incomeStatements.length
    })),
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
    getCashFlows: vi.fn(async (access: any, filter: any) => ({
      data: store.cashFlows.filter((b) =>
        (filter.period ? b.period === filter.period : true) &&
        (filter.corporateId ? b.corporateId === filter.corporateId : true)
      ),
      totalCount: store.cashFlows.length
    })),
  };
});


vi.mock('../../services/mafinda/dashboardService', () => ({
  getDeptRevenueTarget: vi.fn(async (period: string, corporateId: string) => ({
    period,
    corporateId,
    departments: [],
  })),
  getRevenueCostSummary: vi.fn(async (period: string, corporateId?: string) => ({
    period,
    revenue: 100,
    operationalCost: 40,
    revenueChange: 10,
    operationalCostChange: 5,
  })),
  getCashFlowData: vi.fn(async () => ({ data: [] })),
  getAssetComposition: vi.fn(async (period: string, corporateId?: string) => ({
    period,
    currentAssets: 100,
    fixedAssets: 200,
    otherAssets: 0,
    totalAssets: 300,
  })),
  getEquityLiabilityComposition: vi.fn(async (period: string, corporateId?: string) => ({
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

  // Inject dummy user and accessContext for tests
  app.use((req, res, next) => {
    req.user = { userId: 'test-user', role: 'owner' } as any;
    req.accessContext = { scope: 'system', corporateIds: [], departmentIds: [] };
    next();
  });

  app.use('/api/departments', createDepartmentRouter());
  app.use('/api/projects', createProjectRouter());
  app.use('/api/targets', createTargetRouter());
  app.use('/api/financial-statements', createFinancialStatementRouter());
  app.use('/api/dashboard', createMafindaDashboardRouter());

  // Global Error Handler for Tests
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    const errorName = err.name || err.constructor.name;
    if (errorName === 'ValidationError') return res.status(400).json({ error: err.message });
    if (errorName === 'ConflictError') return res.status(409).json({ error: err.message });
    if (errorName === 'NotFoundError') return res.status(404).json({ error: err.message });
    res.status(500).json({ error: err.message });
  });

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
  test('GET returns departments list', async () => {
    const { app } = makeApp();
    const res = await request(app).get('/api/departments');
    expect(res.status).toBe(200);
    expect(res.body.records).toBeDefined();
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
    expect(listRes.body.records).toBeDefined();
    expect(listRes.body.records.length).toBe(1);
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
    expect(listRes.body.records).toBeDefined();
    expect(listRes.body.records.length).toBe(1);
  });

});

// ─── Target Routes ────────────────────────────────────────────────────────────

describe('Targets API', () => {
  test('POST validates required fields', async () => {
    const { app } = makeApp();
    const res = await request(app).post('/api/targets/batch').send({ departmentId: 'd1' });
    expect(res.status).toBe(400);
  });

  test('POST upserts target and GET returns one row', async () => {
    const { app } = makeApp();
    const payload = {
      departmentId: 'd1',
      fiscalYear: 2025,
      revenueDetails: [{ month: 1, amount: 1000 }],
      costDetails: [{ month: 1, amount: 500 }],
    };

    const createRes = await request(app).post('/api/targets/batch').send(payload);
    expect(createRes.status).toBe(200);

    const listRes = await request(app).get('/api/targets?departmentId=d1');
    expect(listRes.status).toBe(200);
    expect(listRes.body.records).toBeDefined();
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
      corporateId: 'corp-1',
      period: '2025-01',
      cashAndBank: 1000,
      accountsReceivable: 500,
      capital: 1200,
    });
    expect(createRes.status).toBe(201);

    const listRes = await request(app).get('/api/financial-statements/balance-sheet?corporateId=corp-1&period=2025-01');
    expect(listRes.status).toBe(200);
    expect(listRes.body.data.length).toBe(1);
  });

  test('POST income-statement validates negative revenue', async () => {
    const { app } = makeApp();
    const res = await request(app).post('/api/financial-statements/income-statement').send({
      corporateId: 'corp-1',
      period: '2025-01',
      revenue: -1,
    });
    expect(res.status).toBe(400);
  });

  test('POST and GET cash-flow', async () => {
    const { app } = makeApp();
    const createRes = await request(app).post('/api/financial-statements/cash-flow').send({
      corporateId: 'corp-1',
      entityType: 'corporate',
      entityId: 'corp-1',
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

    const listRes = await request(app).get('/api/financial-statements/cash-flow?corporateId=corp-1&period=2025-01');
    expect(listRes.status).toBe(200);
    expect(listRes.body.data.length).toBe(1);
  });
});


// ─── Dashboard Routes ─────────────────────────────────────────────────────────

describe('Dashboard API', () => {
  test('dept-revenue-target requires period and corporateId', async () => {
    const { app } = makeApp();
    const res = await request(app).get('/api/dashboard/dept-revenue-target');
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

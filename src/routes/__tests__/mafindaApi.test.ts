// API Integration Tests — MAFINDA Dashboard Enhancement
// Task 10: Checkpoint — Pastikan semua API endpoint berfungsi
// Requirements: 7.1, 7.2, 7.3, 7.4, 7.6, 7.7, 7.8, 7.9, 7.10,
//               8.7, 8.8, 8.9, 8.10, 1.6, 2.5, 3.5, 4.5, 5.5, 6.5

import { describe, test, expect, beforeEach, afterAll } from 'vitest';
import express from 'express';
import request from 'supertest';
import Database from 'better-sqlite3';
import { initMafindaDashboardSchema } from '../../db/initMafindaDashboard';
import { createDepartmentRouter } from '../management/departments';
import { createProjectRouter } from '../management/projects';
import { createTargetRouter } from '../management/targets';
import { createFinancialStatementRouter } from '../management/financialStatements';
import { createMafindaDashboardRouter } from '../dashboard/mafindaDashboard';

// ─── Test App Setup ───────────────────────────────────────────────────────────

function makeApp() {
  const db = new Database(':memory:');
  initMafindaDashboardSchema(db);

  const app = express();
  app.use(express.json());
  app.use('/api/departments', createDepartmentRouter(db));
  app.use('/api/projects', createProjectRouter(db));
  app.use('/api/targets', createTargetRouter(db));
  app.use('/api/financial-statements', createFinancialStatementRouter(db));
  app.use('/api/dashboard', createMafindaDashboardRouter(db));

  return { app, db };
}

// ─── Department Routes ────────────────────────────────────────────────────────

describe('GET /api/departments', () => {
  test('returns empty array initially', async () => {
    const { app } = makeApp();
    const res = await request(app).get('/api/departments');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});

describe('POST /api/departments', () => {
  test('creates a department and returns 201', async () => {
    const { app } = makeApp();
    const res = await request(app)
      .post('/api/departments')
      .send({ name: 'Engineering', description: 'Eng dept' });
    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Engineering');
    expect(res.body.id).toBeTruthy();
  });

  test('returns 400 when name is missing', async () => {
    const { app } = makeApp();
    const res = await request(app).post('/api/departments').send({});
    expect(res.status).toBe(400);
  });

  test('returns 409 on duplicate name — Requirements 7.9', async () => {
    const { app } = makeApp();
    await request(app).post('/api/departments').send({ name: 'ONM' });
    const res = await request(app).post('/api/departments').send({ name: 'ONM' });
    expect(res.status).toBe(409);
  });
});

describe('PUT /api/departments/:id', () => {
  test('updates a department', async () => {
    const { app } = makeApp();
    const created = await request(app).post('/api/departments').send({ name: 'Old' });
    const res = await request(app)
      .put(`/api/departments/${created.body.id}`)
      .send({ name: 'New' });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('New');
  });

  test('returns 404 for unknown id', async () => {
    const { app } = makeApp();
    const res = await request(app).put('/api/departments/nonexistent').send({ name: 'X' });
    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/departments/:id', () => {
  test('deletes a department and returns success', async () => {
    const { app } = makeApp();
    const created = await request(app).post('/api/departments').send({ name: 'ToDelete' });
    const res = await request(app).delete(`/api/departments/${created.body.id}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('returns 404 for unknown id', async () => {
    const { app } = makeApp();
    const res = await request(app).delete('/api/departments/nonexistent');
    expect(res.status).toBe(404);
  });
});

// ─── Project Routes ───────────────────────────────────────────────────────────

describe('GET /api/projects', () => {
  test('returns all projects', async () => {
    const { app } = makeApp();
    const dept = await request(app).post('/api/departments').send({ name: 'Eng' });
    await request(app).post('/api/projects').send({ departmentId: dept.body.id, name: 'P1' });
    const res = await request(app).get('/api/projects');
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
  });

  test('filters by departmentId', async () => {
    const { app } = makeApp();
    const d1 = await request(app).post('/api/departments').send({ name: 'D1' });
    const d2 = await request(app).post('/api/departments').send({ name: 'D2' });
    await request(app).post('/api/projects').send({ departmentId: d1.body.id, name: 'P1' });
    await request(app).post('/api/projects').send({ departmentId: d2.body.id, name: 'P2' });
    const res = await request(app).get(`/api/projects?departmentId=${d1.body.id}`);
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0].name).toBe('P1');
  });
});

describe('POST /api/projects', () => {
  test('creates a project and returns 201', async () => {
    const { app } = makeApp();
    const dept = await request(app).post('/api/departments').send({ name: 'Eng' });
    const res = await request(app)
      .post('/api/projects')
      .send({ departmentId: dept.body.id, name: 'Alpha' });
    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Alpha');
  });

  test('returns 400 when departmentId is missing', async () => {
    const { app } = makeApp();
    const res = await request(app).post('/api/projects').send({ name: 'Alpha' });
    expect(res.status).toBe(400);
  });

  test('returns 409 on duplicate name in same department — Requirements 7.10', async () => {
    const { app } = makeApp();
    const dept = await request(app).post('/api/departments').send({ name: 'Eng' });
    await request(app).post('/api/projects').send({ departmentId: dept.body.id, name: 'Alpha' });
    const res = await request(app)
      .post('/api/projects')
      .send({ departmentId: dept.body.id, name: 'Alpha' });
    expect(res.status).toBe(409);
  });
});

describe('PUT /api/projects/:id', () => {
  test('updates a project', async () => {
    const { app } = makeApp();
    const dept = await request(app).post('/api/departments').send({ name: 'Eng' });
    const proj = await request(app).post('/api/projects').send({ departmentId: dept.body.id, name: 'Old' });
    const res = await request(app).put(`/api/projects/${proj.body.id}`).send({ name: 'New' });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('New');
  });
});

describe('DELETE /api/projects/:id', () => {
  test('deletes a project', async () => {
    const { app } = makeApp();
    const dept = await request(app).post('/api/departments').send({ name: 'Eng' });
    const proj = await request(app).post('/api/projects').send({ departmentId: dept.body.id, name: 'P' });
    const res = await request(app).delete(`/api/projects/${proj.body.id}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

// ─── Target Routes ────────────────────────────────────────────────────────────

const validTarget = {
  entityType: 'department',
  entityId: 'dept-001',
  period: '2025-01',
  periodType: 'monthly',
  revenueTarget: 5_000_000,
  operationalCostTarget: 2_000_000,
};

describe('GET /api/targets', () => {
  test('returns empty array initially', async () => {
    const { app } = makeApp();
    const res = await request(app).get('/api/targets');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  test('filters by entityType', async () => {
    const { app } = makeApp();
    await request(app).post('/api/targets').send(validTarget);
    await request(app).post('/api/targets').send({ ...validTarget, entityType: 'project', entityId: 'p1', period: '2025-02' });
    const res = await request(app).get('/api/targets?entityType=department');
    expect(res.status).toBe(200);
    expect(res.body.every((t: any) => t.entityType === 'department')).toBe(true);
  });
});

describe('POST /api/targets', () => {
  test('creates a target and returns 201', async () => {
    const { app } = makeApp();
    const res = await request(app).post('/api/targets').send(validTarget);
    expect(res.status).toBe(201);
    expect(res.body.revenueTarget).toBe(5_000_000);
  });

  test('upserts — no duplicate on same key', async () => {
    const { app } = makeApp();
    await request(app).post('/api/targets').send(validTarget);
    await request(app).post('/api/targets').send({ ...validTarget, revenueTarget: 9_000_000 });
    const res = await request(app).get('/api/targets?entityType=department&entityId=dept-001&period=2025-01');
    expect(res.body.length).toBe(1);
    expect(res.body[0].revenueTarget).toBe(9_000_000);
  });

  test('returns 400 when entityType is invalid', async () => {
    const { app } = makeApp();
    const res = await request(app).post('/api/targets').send({ ...validTarget, entityType: 'invalid' });
    expect(res.status).toBe(400);
  });

  test('returns 400 when period is missing', async () => {
    const { app } = makeApp();
    const res = await request(app).post('/api/targets').send({ ...validTarget, period: '' });
    expect(res.status).toBe(400);
  });
});

describe('DELETE /api/targets/:id', () => {
  test('deletes a target', async () => {
    const { app } = makeApp();
    const created = await request(app).post('/api/targets').send(validTarget);
    const res = await request(app).delete(`/api/targets/${created.body.id}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

// ─── Financial Statement Routes ───────────────────────────────────────────────

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

describe('POST /api/financial-statements/balance-sheet', () => {
  test('saves balance sheet and returns 201 — Requirements 8.7, 8.10', async () => {
    const { app } = makeApp();
    const res = await request(app).post('/api/financial-statements/balance-sheet').send(validBS);
    expect(res.status).toBe(201);
    expect(res.body.period).toBe('2025-01');
    expect(res.body.currentAssets).toBe(1_000_000);
  });

  test('returns 400 for missing period', async () => {
    const { app } = makeApp();
    const res = await request(app).post('/api/financial-statements/balance-sheet').send({ ...validBS, period: '' });
    expect(res.status).toBe(400);
  });

  test('returns 400 for negative values — Requirements 8.6', async () => {
    const { app } = makeApp();
    const res = await request(app).post('/api/financial-statements/balance-sheet').send({ ...validBS, currentAssets: -1 });
    expect(res.status).toBe(400);
  });
});

describe('GET /api/financial-statements/balance-sheet', () => {
  test('returns saved balance sheets', async () => {
    const { app } = makeApp();
    await request(app).post('/api/financial-statements/balance-sheet').send(validBS);
    const res = await request(app).get('/api/financial-statements/balance-sheet');
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
  });

  test('filters by period', async () => {
    const { app } = makeApp();
    await request(app).post('/api/financial-statements/balance-sheet').send(validBS);
    await request(app).post('/api/financial-statements/balance-sheet').send({ ...validBS, period: '2025-02' });
    const res = await request(app).get('/api/financial-statements/balance-sheet?period=2025-01');
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0].period).toBe('2025-01');
  });
});

describe('POST /api/financial-statements/income-statement', () => {
  test('saves income statement and returns 201 — Requirements 8.8, 8.10', async () => {
    const { app } = makeApp();
    const res = await request(app).post('/api/financial-statements/income-statement').send(validIS);
    expect(res.status).toBe(201);
    expect(res.body.revenue).toBe(3_000_000);
  });

  test('returns 400 for negative revenue — Requirements 8.6', async () => {
    const { app } = makeApp();
    const res = await request(app).post('/api/financial-statements/income-statement').send({ ...validIS, revenue: -100 });
    expect(res.status).toBe(400);
  });
});

describe('GET /api/financial-statements/income-statement', () => {
  test('returns saved income statements', async () => {
    const { app } = makeApp();
    await request(app).post('/api/financial-statements/income-statement').send(validIS);
    const res = await request(app).get('/api/financial-statements/income-statement');
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
  });
});

describe('POST /api/financial-statements/cash-flow', () => {
  test('saves cash flow and returns 201 — Requirements 8.9, 8.10', async () => {
    const { app } = makeApp();
    const res = await request(app).post('/api/financial-statements/cash-flow').send(validCF);
    expect(res.status).toBe(201);
    expect(res.body.operatingCashIn).toBe(2_000_000);
  });

  test('returns 400 for negative cash values — Requirements 8.6', async () => {
    const { app } = makeApp();
    const res = await request(app).post('/api/financial-statements/cash-flow').send({ ...validCF, operatingCashIn: -1 });
    expect(res.status).toBe(400);
  });
});

describe('GET /api/financial-statements/cash-flow', () => {
  test('returns saved cash flows', async () => {
    const { app } = makeApp();
    await request(app).post('/api/financial-statements/cash-flow').send(validCF);
    const res = await request(app).get('/api/financial-statements/cash-flow');
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
  });
});

// ─── Dashboard Routes ─────────────────────────────────────────────────────────

describe('GET /api/dashboard/dept-revenue-target', () => {
  test('returns 400 when period is missing — Requirements 1.6', async () => {
    const { app } = makeApp();
    const res = await request(app).get('/api/dashboard/dept-revenue-target?periodType=monthly');
    expect(res.status).toBe(400);
  });

  test('returns 400 when periodType is invalid', async () => {
    const { app } = makeApp();
    const res = await request(app).get('/api/dashboard/dept-revenue-target?period=2025-01&periodType=bad');
    expect(res.status).toBe(400);
  });

  test('returns data with departments array', async () => {
    const { app } = makeApp();
    const res = await request(app).get('/api/dashboard/dept-revenue-target?period=2025-01&periodType=monthly');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('departments');
    expect(Array.isArray(res.body.departments)).toBe(true);
  });
});

describe('GET /api/dashboard/revenue-cost-summary', () => {
  test('returns 400 when period is missing — Requirements 2.5', async () => {
    const { app } = makeApp();
    const res = await request(app).get('/api/dashboard/revenue-cost-summary');
    expect(res.status).toBe(400);
  });

  test('returns summary with revenue and operationalCost', async () => {
    const { app } = makeApp();
    const res = await request(app).get('/api/dashboard/revenue-cost-summary?period=2025-01');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('revenue');
    expect(res.body).toHaveProperty('operationalCost');
  });
});

describe('GET /api/dashboard/cash-flow', () => {
  test('returns 400 when period is missing — Requirements 3.5', async () => {
    const { app } = makeApp();
    const res = await request(app).get('/api/dashboard/cash-flow');
    expect(res.status).toBe(400);
  });

  test('returns data array with netCashFlow', async () => {
    const { app } = makeApp();
    const res = await request(app).get('/api/dashboard/cash-flow?period=2025-01');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
  });
});

describe('GET /api/dashboard/asset-composition', () => {
  test('returns 400 when period is missing — Requirements 4.5', async () => {
    const { app } = makeApp();
    const res = await request(app).get('/api/dashboard/asset-composition');
    expect(res.status).toBe(400);
  });

  test('returns null when no data exists', async () => {
    const { app } = makeApp();
    const res = await request(app).get('/api/dashboard/asset-composition?period=2025-01');
    expect(res.status).toBe(200);
    expect(res.body).toBeNull();
  });

  test('returns composition when balance sheet exists', async () => {
    const { app } = makeApp();
    await request(app).post('/api/financial-statements/balance-sheet').send(validBS);
    const res = await request(app).get('/api/dashboard/asset-composition?period=2025-01');
    expect(res.status).toBe(200);
    expect(res.body.totalAssets).toBe(3_500_000);
  });
});

describe('GET /api/dashboard/equity-liability-composition', () => {
  test('returns 400 when period is missing — Requirements 5.5', async () => {
    const { app } = makeApp();
    const res = await request(app).get('/api/dashboard/equity-liability-composition');
    expect(res.status).toBe(400);
  });

  test('returns composition when balance sheet exists', async () => {
    const { app } = makeApp();
    await request(app).post('/api/financial-statements/balance-sheet').send(validBS);
    const res = await request(app).get('/api/dashboard/equity-liability-composition?period=2025-01');
    expect(res.status).toBe(200);
    expect(res.body.totalAssets).toBe(res.body.totalEquity + res.body.totalLiabilities);
  });
});

describe('GET /api/dashboard/historical-data', () => {
  test('returns 400 when months is missing — Requirements 6.5', async () => {
    const { app } = makeApp();
    const res = await request(app).get('/api/dashboard/historical-data');
    expect(res.status).toBe(400);
  });

  test('returns 400 for invalid months value', async () => {
    const { app } = makeApp();
    const res = await request(app).get('/api/dashboard/historical-data?months=7');
    expect(res.status).toBe(400);
  });

  test('returns array for valid months values', async () => {
    const { app } = makeApp();
    for (const months of [3, 6, 12, 24]) {
      const res = await request(app).get(`/api/dashboard/historical-data?months=${months}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    }
  });
});

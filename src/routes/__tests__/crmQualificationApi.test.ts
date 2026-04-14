import { beforeEach, describe, expect, test, vi } from 'vitest';
import express from 'express';
import request from 'supertest';
import { createQualificationRouter } from '../crm/qualifications';
import type { CRMRole } from '../../types/crm';

const dbState = vi.hoisted(() => ({
  selectQueue: [] as unknown[][],
  insertReturningQueue: [] as unknown[][],
  updateReturningQueue: [] as unknown[][],
}));

function createQuery() {
  const query = {
    where: () => query,
    orderBy: () => query,
    limit: () => query,
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
      })),
    })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(() => ({
          returning: async () => dbState.updateReturningQueue.shift() ?? [],
        })),
      })),
    })),
  };
}

vi.mock('../../middleware/crmRbac', () => ({
  requireCRMPermission: () => (req: express.Request, _res: express.Response, next: express.NextFunction) => {
    req.userId = (req.headers['x-user-id'] as string) ?? 'user-1';
    const rolesHeader = (req.headers['x-roles'] as string) ?? '';
    req.crmRoles = rolesHeader
      .split(',')
      .map((r) => r.trim())
      .filter(Boolean) as CRMRole[];
    req.crmPermissions = ['crm:read:all', 'crm:write:all', 'crm:approve:qualification'];
    next();
  },
  hasCRMRole: (req: express.Request, role: CRMRole) => (req.crmRoles ?? []).includes(role),
}));

vi.mock('../../helpers/crmAuditLog', () => ({
  logCreate: vi.fn(async () => undefined),
  logApprove: vi.fn(async () => undefined),
  logReject: vi.fn(async () => undefined),
}));

vi.mock('../../db/connection', () => ({
  db: createDbFacade(),
}));

function makeApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/crm/opportunities/:id/qualification', createQualificationRouter());
  return app;
}

beforeEach(() => {
  dbState.selectQueue = [];
  dbState.insertReturningQueue = [];
  dbState.updateReturningQueue = [];
});

describe('CRM Qualification Routes', () => {
  test('POST / returns 404 when opportunity is missing', async () => {
    dbState.selectQueue.push([]);

    const app = makeApp();
    const res = await request(app)
      .post('/api/crm/opportunities/opp-missing/qualification')
      .send({ technicalCapabilityScore: 8 });

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  test('POST / creates new qualification version', async () => {
    dbState.selectQueue.push(
      [{ id: 'opp-1', stage: 'Lead' }],
      [{ maxV: 2 }]
    );
    dbState.insertReturningQueue.push([
      {
        id: 'qual-3',
        opportunityId: 'opp-1',
        version: 3,
        technicalCapabilityScore: 8,
        resourceAvailabilityScore: 7,
        contractValueScore: 8,
        estimatedMarginScore: 7,
        riskScore: 4,
        feasibilityScore: '70.5',
        recommendation: 'Hold',
        notes: 'Draft analysis',
        resourcePlan: JSON.stringify([{ role: 'Engineer', quantity: 2, durationMonths: 3 }]),
        status: 'Draft',
        createdBy: 'user-1',
      },
    ]);

    const app = makeApp();
    const res = await request(app)
      .post('/api/crm/opportunities/opp-1/qualification')
      .send({
        technicalCapabilityScore: 8,
        resourceAvailabilityScore: 7,
        contractValueScore: 8,
        estimatedMarginScore: 7,
        riskScore: 4,
        notes: 'Draft analysis',
        resourcePlan: [{ role: 'Engineer', quantity: 2, durationMonths: 3 }],
      });

    expect(res.status).toBe(201);
    expect(res.body.id).toBe('qual-3');
    expect(res.body.version).toBe(3);
    expect(res.body.status).toBe('Draft');
    expect(res.body.feasibilityScore).toBeCloseTo(70.5);
    expect(res.body.resourcePlan).toHaveLength(1);
  });

  test('POST /approve returns 403 for non manager role', async () => {
    dbState.selectQueue.push([
      {
        id: 'qual-1',
        opportunityId: 'opp-1',
        version: 1,
        feasibilityScore: '75',
        recommendation: 'Proceed',
        status: 'Draft',
      },
    ]);

    const app = makeApp();
    const res = await request(app)
      .post('/api/crm/opportunities/opp-1/qualification/approve')
      .set('x-roles', 'Sales_Executive')
      .send({ action: 'approve' });

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('CRM_FORBIDDEN');
  });

  test('POST /approve approves latest qualification for manager role', async () => {
    dbState.selectQueue.push([
      {
        id: 'qual-2',
        opportunityId: 'opp-1',
        version: 2,
        feasibilityScore: '78',
        recommendation: 'Proceed',
        status: 'Draft',
      },
    ]);
    dbState.updateReturningQueue.push([
      {
        id: 'qual-2',
        opportunityId: 'opp-1',
        version: 2,
        feasibilityScore: '78',
        recommendation: 'Proceed',
        status: 'Approved',
        resourcePlan: null,
      },
    ]);

    const app = makeApp();
    const res = await request(app)
      .post('/api/crm/opportunities/opp-1/qualification/approve')
      .set('x-roles', 'BD_Manager')
      .send({ action: 'approve' });

    expect(res.status).toBe(200);
    expect(res.body.id).toBe('qual-2');
    expect(res.body.status).toBe('Approved');
    expect(res.body.isApproved).toBe(true);
  });

  test('GET /history returns all versions in order', async () => {
    dbState.selectQueue.push(
      [{ id: 'opp-1' }],
      [
        {
          id: 'qual-1',
          opportunityId: 'opp-1',
          version: 1,
          feasibilityScore: '62',
          recommendation: 'Hold',
          status: 'Draft',
          resourcePlan: null,
        },
        {
          id: 'qual-2',
          opportunityId: 'opp-1',
          version: 2,
          feasibilityScore: '81',
          recommendation: 'Proceed',
          status: 'Approved',
          resourcePlan: null,
        },
      ]
    );

    const app = makeApp();
    const res = await request(app)
      .get('/api/crm/opportunities/opp-1/qualification/history');

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body[0].version).toBe(1);
    expect(res.body[1].version).toBe(2);
  });
});

import express from 'express';
import helmet from 'helmet';
import path from 'path';
import { db } from '../db/connection.js';
import { users } from '../db/schema/public.js';
import { eq } from 'drizzle-orm';
import { loadCRMRoles } from '../middleware/crmRbac.js';
import { createCustomerRouter, createContactRouter, createContactStandaloneRouter } from '../routes/crm/customers.js';
import { createInteractionRouter } from '../routes/crm/interactions.js';
import { createFRSRouter } from '../routes/financial/index.js';
import { createDepartmentRouter } from '../routes/management/departments.js';
import { createProjectRouter } from '../routes/management/projects.js';
import { createTargetRouter } from '../routes/management/targets.js';
import { createFinancialStatementRouter } from '../routes/management/financialStatements.js';
import { createMafindaDashboardRouter } from '../routes/dashboard/mafindaDashboard.js';
import { createOpportunityRouter, createPipelineRouter } from '../routes/crm/opportunities.js';
import { createQualificationRouter } from '../routes/crm/qualifications.js';

interface CreateAppOptions {
  enableRequestLogger?: boolean;
  enableViteMiddleware?: boolean;
  serveStaticClient?: boolean;
}

export async function createApp(options: CreateAppOptions = {}) {
  const {
    enableRequestLogger = true,
    enableViteMiddleware = process.env.NODE_ENV !== 'production',
    serveStaticClient = process.env.NODE_ENV === 'production',
  } = options;

  const app = express();

  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(express.json());

  if (enableRequestLogger) {
    app.use((req, _res, next) => {
      console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
      next();
    });
  }

  // Dev-only auth shim: supports X-User-Id header for test and local workflows.
  app.use(async (req: any, _res, next) => {
    const userId = req.headers['x-user-id'] as string | undefined;
    if (userId) {
      req.userId = userId;
      const [user] = await db.select({ id: users.id }).from(users).where(eq(users.id, userId)).limit(1);
      if (!user) req.userId = undefined;
    }
    next();
  });

  app.use(loadCRMRoles());

  app.use('/api/departments', createDepartmentRouter());
  app.use('/api/projects', createProjectRouter());
  app.use('/api/targets', createTargetRouter());
  app.use('/api/financial-statements', createFinancialStatementRouter());
  app.use('/api/dashboard', createMafindaDashboardRouter());

  app.use('/api/crm/customers', createCustomerRouter());
  app.use('/api/crm/customers/:customerId/contacts', createContactRouter());
  app.use('/api/crm/contacts', createContactStandaloneRouter());
  app.use('/api/crm/interactions', createInteractionRouter());
  app.use('/api/crm/opportunities', createOpportunityRouter());
  app.use('/api/crm/opportunities/:id/qualification', createQualificationRouter());
  app.use('/api/crm/pipeline', createPipelineRouter());

  app.use('/api/frs', createFRSRouter());

  app.use('/api/frs', (err: any, req: express.Request, res: express.Response, _next: express.NextFunction) => {
    const requestId = (req.headers['x-request-id'] as string) ?? '';
    const status = err.status ?? err.statusCode ?? 500;
    console.error(`[FRS Error] ${req.method} ${req.url}:`, err.message);
    res.status(status).json({
      error: {
        code: err.code ?? 'FRS_INTERNAL_ERROR',
        message: status < 500 ? err.message : 'An internal error occurred',
        details: status < 500 ? err.details : undefined,
        field: err.field,
        timestamp: new Date().toISOString(),
        requestId,
      },
    });
  });

  app.all('/api/*', (req, res) => {
    res.status(404).json({ error: `API route not found: ${req.method} ${req.url}` });
  });

  if (enableViteMiddleware) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else if (serveStaticClient) {
    const __filename = new URL(import.meta.url).pathname;
    const __dirname = path.dirname(__filename);
    const distPath = path.resolve(__dirname, '../../dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  return app;
}

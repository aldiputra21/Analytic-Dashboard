import express from 'express';
import helmet from 'helmet';
import path from 'path';
import { db } from '../db/connection.js';
import { users } from '../db/schema/public.js';
import { eq } from 'drizzle-orm';
import { authenticate } from '../middleware/auth.js';
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
import { createCostCenterRouter } from '../routes/management/cost-centers.js';
import { createSystemConfigRouter } from '../routes/management/systemConfigs.js';

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

  // Global API Rate Limiter
  const { getFRSConfig } = await import('../config/frsConfig.js');
  const rateLimit = (await import('express-rate-limit')).default;
  const config = getFRSConfig();

  const globalLimiter = rateLimit({
    windowMs: config.RATE_LIMIT_WINDOW_MS,
    max: config.RATE_LIMIT_MAX,
    message: { error: { code: 'FRS_RATE_LIMIT', message: 'Too many requests, please try again later' } },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
      // Skip rate limiting for essential polling:
      // 1. Session keep-alive (GET /auth/me)
      // 2. Notification polling/stream (GET /notifications*)
      const isKeepAlive = req.originalUrl.includes('/auth/me') && req.method === 'GET';
      const isNotification = req.originalUrl.includes('/notifications') && req.method === 'GET';
      return isKeepAlive || isNotification;
    },
  });

  // Apply to all API routes
  app.use('/api', globalLimiter);

  app.use('/upload', express.static(path.resolve('public/upload')));

  if (enableRequestLogger) {
    app.use((req, _res, next) => {
      console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
      next();
    });
  }

  // MAFINDA routes require authentication
  app.use('/api/departments', authenticate, createDepartmentRouter());
  app.use('/api/projects', authenticate, createProjectRouter());
  app.use('/api/targets', authenticate, createTargetRouter());
  app.use('/api/cost-centers', authenticate, createCostCenterRouter());
  app.use('/api/system-configs', authenticate, createSystemConfigRouter());
  app.use('/api/financial-statements', authenticate, createFinancialStatementRouter());
  app.use('/api/dashboard', authenticate, createMafindaDashboardRouter());

  // CRM routes require authentication
  app.use('/api/crm/customers', authenticate, createCustomerRouter());
  app.use('/api/crm/customers/:customerId/contacts', authenticate, createContactRouter());
  app.use('/api/crm/contacts', authenticate, createContactStandaloneRouter());
  app.use('/api/crm/interactions', authenticate, createInteractionRouter());
  app.use('/api/crm/opportunities', authenticate, createOpportunityRouter());
  app.use('/api/crm/opportunities/:id/qualification', authenticate, createQualificationRouter());
  app.use('/api/crm/pipeline', authenticate, createPipelineRouter());

  // FRS router handles its own public/private route separation
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

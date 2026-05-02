import express from 'express';
import helmet from 'helmet';
import compression from 'compression';
import path from 'path';
import { db } from '../db/connection.js';
import { users } from '../db/schema/public.js';
import { eq } from 'drizzle-orm';
import { authenticate } from '../middleware/auth.js';
import { createCustomerRouter, createContactRouter, createContactStandaloneRouter } from '../routes/crm/customers.js';
import { createInteractionRouter } from '../routes/crm/interactions.js';
import { createFRSRouter } from '../routes/financial/index.js';
import { createRolesRouter } from '../routes/financial/roles.js';
import { createCorporatesRouter } from '../routes/financial/corporates.js';
import { createDepartmentRouter } from '../routes/management/departments.js';
import { createProjectRouter } from '../routes/management/projects.js';
import { createTargetRouter } from '../routes/management/targets.js';
import { createCashFlowProjectionRouter } from '../routes/management/cash-flow-projections.js';
import { createFinancialStatementRouter } from '../routes/management/financialStatements.js';
import { createMafindaDashboardRouter } from '../routes/dashboard/mafindaDashboard.js';
import { createOpportunityRouter, createPipelineRouter } from '../routes/crm/opportunities.js';
import { createQualificationRouter } from '../routes/crm/qualifications.js';
import { createCostCenterRouter } from '../routes/management/cost-centers.js';
import { createSystemConfigRouter } from '../routes/management/systemConfigs.js';
import { createBanksRouter } from '../routes/financial/banks.js';
import { createCorporateSectorsRouter } from '../routes/financial/corporateSectors.js';
import { createCurrenciesRouter } from '../routes/financial/currencies.js';
import { createCostCenterCategoriesRouter } from '../routes/financial/costCenterCategories.js';
import { createCashRealizationsRouter } from '../routes/financial/cashRealizations.js';
import { createBankLoansRouter } from '../routes/financial/bankLoans.js';
import { createNotificationConfigsRouter } from '../routes/financial/notificationConfigs.js';
import { createAttachmentsRouter } from '../routes/financial/attachments.js';
import { createPermissionsRouter } from '../routes/financial/permissions.js';
import { createUsersRouter } from '../routes/financial/users.js';
import { createProfileRouter } from '../routes/profile/index.js';
import { checkMaintenance } from '../middleware/maintenance.js';

import { getFRSConfig } from '../config/frsConfig.js';
import { configService } from '../services/management/configService.js';

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
  const config = getFRSConfig();
  
  // Initialize System Config Cache
  await configService.initialize();
  
  // Store Vite server instance for cleanup during shutdown
  (app as any).viteServer = null;

  app.use(compression());
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(express.json());

  // Global API Rate Limiter
  const rateLimit = (await import('express-rate-limit')).default;

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

  // PUBLIC routes (no authentication required)
  // Logo endpoint - must be before authenticate middleware
  app.get('/api/corporates/:id/logo', (await import('../routes/financial/corporates.js')).logoHandler);

  if (enableRequestLogger) {
    app.use((req, _res, next) => {
      console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
      next();
    });
  }

  // MAFINDA routes require authentication and maintenance check
  app.use('/api/departments', authenticate, checkMaintenance, createDepartmentRouter());
  app.use('/api/projects', authenticate, checkMaintenance, createProjectRouter());
  app.use('/api/targets', authenticate, checkMaintenance, createTargetRouter());
  app.use('/api/cash-flow-projections', authenticate, checkMaintenance, createCashFlowProjectionRouter());
  app.use('/api/financial-statements', authenticate, checkMaintenance, createFinancialStatementRouter());
  app.use('/api/mafinda/dashboard', authenticate, checkMaintenance, createMafindaDashboardRouter());
  app.use('/api/cost-centers', authenticate, checkMaintenance, createCostCenterRouter());

  // Master Data & Financial Enhancement routes
  app.use('/api/corporates', authenticate, checkMaintenance, createCorporatesRouter());
  app.use('/api/roles', authenticate, checkMaintenance, createRolesRouter());
  app.use('/api/banks', authenticate, checkMaintenance, createBanksRouter());
  app.use('/api/corporate-sectors', authenticate, checkMaintenance, createCorporateSectorsRouter());
  app.use('/api/currencies', authenticate, checkMaintenance, createCurrenciesRouter());
  app.use('/api/cost-center-categories', authenticate, checkMaintenance, createCostCenterCategoriesRouter());
  app.use('/api/cash-realizations', authenticate, checkMaintenance, createCashRealizationsRouter());
  app.use('/api/bank-loans', authenticate, checkMaintenance, createBankLoansRouter());
  app.use('/api/notification-configs', authenticate, checkMaintenance, createNotificationConfigsRouter());
  app.use('/api/attachments', authenticate, checkMaintenance, createAttachmentsRouter());
  app.use('/api/permissions', authenticate, checkMaintenance, createPermissionsRouter());
  app.use('/api/users', authenticate, checkMaintenance, createUsersRouter());
  app.use('/api/system-configs', authenticate, checkMaintenance, createSystemConfigRouter());
  app.use('/api/profile', authenticate, checkMaintenance, createProfileRouter());

  // CRM routes require authentication and maintenance check
  app.use('/api/crm/customers', authenticate, checkMaintenance, createCustomerRouter());
  app.use('/api/crm/customers/:customerId/contacts', authenticate, checkMaintenance, createContactRouter());
  app.use('/api/crm/contacts-standalone', authenticate, checkMaintenance, createContactStandaloneRouter());
  app.use('/api/crm/interactions', authenticate, checkMaintenance, createInteractionRouter());
  app.use('/api/crm/opportunities', authenticate, checkMaintenance, createOpportunityRouter());
  app.use('/api/crm/pipelines', authenticate, checkMaintenance, createPipelineRouter());
  app.use('/api/crm/qualifications', authenticate, checkMaintenance, createQualificationRouter());


  // FRS router handles its own public/private route separation
  app.use('/api/frs', createFRSRouter());

  // Global Error Handler (must be last)
  const { errorHandler } = await import('../middleware/errorHandler.js');
  app.use(errorHandler);

  app.all('/api/*', (req, res) => {
    res.status(404).json({ error: `API route not found: ${req.method} ${req.url}` });
  });

  if (enableViteMiddleware) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    // Store Vite server for cleanup during shutdown
    (app as any).viteServer = vite;
    app.use(vite.middlewares);
  } else if (serveStaticClient) {
    const __filename = new URL(import.meta.url).pathname;
    const __dirname = path.dirname(__filename);
    const distPath = path.resolve(__dirname, '../../dist');
    app.use(express.static(distPath, {
      maxAge: config.STATIC_CACHE_MAX_AGE,
      immutable: true,
      index: false
    }));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  return app;
}

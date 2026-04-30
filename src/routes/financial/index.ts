// FRS Main Router - wires all financial ratio system routes
// Requirements: 9.1, 9.6, 9.7, 9.8, 11.1

import { Router, Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import rateLimit from 'express-rate-limit';
import { createFRSAuthRouter } from './auth';
import { createCorporatesRouter } from './corporates';
import { createFinancialDataRouter } from './financialData';
import { createUsersRouter } from './users';
import { createRolesRouter } from './roles';
import { createPermissionsRouter } from './permissions';
import { createRatiosRouter } from './ratios';
import { createThresholdsRouter } from './thresholds';
import { createAlertsRouter } from './alerts';
import { createNotificationsRouter } from './notifications';
import { createReportsRouter } from './reports';
import { createAuditLogRouter } from './auditLog';
import { createBackupRouter } from './backup';
import { createBanksRouter } from './banks';
import { createCorporateSectorsRouter } from './corporateSectors';
import { createCurrenciesRouter } from './currencies';
import { createCostCenterCategoriesRouter } from './costCenterCategories';
import { createCashRealizationsRouter } from './cashRealizations';
import { createAttachmentsRouter } from './attachments';
import { createBankLoansRouter } from './bankLoans';
import { createNotificationConfigsRouter } from './notificationConfigs';
import { createDashboardDataRouter } from './dashboardData';
import { authenticate } from '../../middleware/auth';
import { checkMaintenance } from '../../middleware/maintenance';

import { getFRSConfig } from '../../config/frsConfig';

// Load config for rate limits
const config = getFRSConfig();

// Rate limiter for auth endpoints (prevent brute force)
const authLimiter = rateLimit({
  windowMs: config.RATE_LIMIT_WINDOW_MS, 
  max: config.RATE_LIMIT_AUTH_MAX,
  message: { error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests, please try again later' } },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for essential polling:
    // 1. Session keep-alive (GET /auth/me)
    // 2. Notification polling/stream (GET /notifications*)
    const isKeepAlive = req.originalUrl.endsWith('/auth/me') && req.method === 'GET';
    const isNotification = req.originalUrl.includes('/notifications') && req.method === 'GET';
    return isKeepAlive || isNotification;
  },
});

/**
 * Creates and returns the main FRS router.
 * Mount at /api/frs in the Express app.
 */
export function createFRSRouter(): Router {
  const router = Router();

  // Attach a unique request ID to every FRS request (used in error responses)
  router.use((req: Request, _res: Response, next: NextFunction) => {
    if (!req.headers['x-request-id']) {
      req.headers['x-request-id'] = randomUUID();
    }
    next();
  });

  // Auth routes (rate limited)
  router.use('/auth', authLimiter, createFRSAuthRouter());

  // Protect all following FRS routes
  router.use(authenticate);
  router.use(checkMaintenance);

  // Corporate management
  router.use('/corporates', createCorporatesRouter());

  // Financial data management (bulk must be registered before /:id routes)
  router.use('/financial-data', createFinancialDataRouter());

  // User management (Owner only)
  router.use('/users', createUsersRouter());

  // Roles listing (for dropdowns)
  router.use('/roles', createRolesRouter());

  // Permissions management
  router.use('/permissions', createPermissionsRouter());

  // Calculated ratios (with caching)
  router.use('/ratios', createRatiosRouter());

  // Dashboard specific data (consolidated)
  router.use('/dashboard', createDashboardDataRouter());

  // Threshold configuration (Owner only for write)
  router.use('/thresholds', createThresholdsRouter());

  // Alert management
  router.use('/alerts', createAlertsRouter());

  // Common notification inbox (SSE + polling fallback)
  router.use('/notifications', createNotificationsRouter());

  // Reports and export
  router.use('/reports', createReportsRouter());

  // Audit log (Owner only)
  router.use('/audit-log', createAuditLogRouter());

  // Backup and restore (Owner only)
  router.use('/backup', createBackupRouter());

  // Master Banks
  router.use('/banks', createBanksRouter());

  // Master Corporate Sectors
  router.use('/corporate-sectors', createCorporateSectorsRouter());

  // Master Currencies
  router.use('/currencies', createCurrenciesRouter());

  // Master Cost Center Categories
  router.use('/cost-center-categories', createCostCenterCategoriesRouter());

  // Cash Realizations
  router.use('/cash-realizations', createCashRealizationsRouter());

  // Attachments (download + delete)
  router.use('/attachments', createAttachmentsRouter());

  // Bank Loans
  router.use('/bank-loans', createBankLoansRouter());

  // Notification Configs (owner-only write/delete)
  router.use('/notification-configs', createNotificationConfigsRouter());

  return router;
}

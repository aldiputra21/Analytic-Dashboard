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
import { createApprovalsRouter } from './approvals';
import { createApprovalConfigsRouter } from './approvalConfigs';
import { createReportConfigsRouter } from './reportConfigs';
import { createReportOutputsRouter } from './reportOutputs';
import { createExportRouter } from './export';
import { createUploadRouter } from './upload';
import { authenticate } from '../../middleware/auth';
import { checkMaintenance } from '../../middleware/maintenance';

import { getFRSConfig } from '../../config/frsConfig';

// Load config for rate limits
const config = getFRSConfig();

// Auth rate limiting uses TWO chained limiters to cover both attack vectors:
//
//  1. authLimiterByUsername — per-account brute force protection
//     Blocks an attacker hammering one specific account from any IP.
//     Key: username from request body (case-insensitive).
//     Limit: RATE_LIMIT_AUTH_MAX attempts per RATE_LIMIT_WINDOW_MS.
//
//  2. authLimiterByIp — volumetric / credential-stuffing protection
//     Blocks an attacker cycling through many accounts from one IP.
//     Key: socket remote address (avoids ERR_ERL_KEY_GEN_IPV6).
//     Limit: RATE_LIMIT_AUTH_IP_MAX attempts per RATE_LIMIT_WINDOW_MS (higher ceiling).
//
// Both must pass — a request is blocked if either limit is exceeded.
// Office users (shared NAT IP) are protected because the IP ceiling is set
// high enough for legitimate concurrent logins (default: 200 per 15 min).

const _authSkip = (req: Request) => {
  const isKeepAlive = req.originalUrl.endsWith('/auth/me') && req.method === 'GET';
  const isNotification = req.originalUrl.includes('/notifications') && req.method === 'GET';
  // Also skip entirely when the respective limit is set to 0 (unlimited mode)
  return isKeepAlive || isNotification;
};

const _authMessage = { error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests, please try again later' } };

// Limiter 1: per-username (tight — stops account brute force)
// Set RATE_LIMIT_AUTH_MAX=0 to disable this limiter entirely (unlimited).
const authLimiterByUsername = rateLimit({
  windowMs: config.RATE_LIMIT_WINDOW_MS,
  max: config.RATE_LIMIT_AUTH_MAX,
  message: _authMessage,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => config.RATE_LIMIT_AUTH_MAX === 0 || _authSkip(req),
  keyGenerator: (req) => {
    const username = (req.body?.username as string | undefined)?.toLowerCase().trim() ?? '';
    return `auth:user:${username || 'anonymous'}`;
  },
});

// Limiter 2: per-IP (loose — stops credential stuffing from one source)
// Set RATE_LIMIT_AUTH_IP_MAX=0 to disable this limiter entirely (unlimited).
const authLimiterByIp = rateLimit({
  windowMs: config.RATE_LIMIT_WINDOW_MS,
  max: config.RATE_LIMIT_AUTH_IP_MAX,
  message: _authMessage,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => config.RATE_LIMIT_AUTH_IP_MAX === 0 || _authSkip(req),
  // Use socket.remoteAddress to avoid ERR_ERL_KEY_GEN_IPV6
  keyGenerator: (req) => `auth:ip:${req.socket.remoteAddress ?? 'unknown'}`,
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

  // Auth routes (rate limited — dual limiter: per-username + per-IP)
  router.use('/auth', authLimiterByUsername, authLimiterByIp, createFRSAuthRouter());

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

  // Approval system
  router.use('/approvals', createApprovalsRouter());
  router.use('/approval-configs', createApprovalConfigsRouter());

  // Dynamic Excel Report configs
  router.use('/report-configs', createReportConfigsRouter());

  // Dynamic Excel Report outputs (generate + download)
  router.use('/report-outputs', createReportOutputsRouter());

  // Export module (bulk data export to Excel/CSV)
  router.use('/export', createExportRouter());

  // Upload module (bulk data import via Excel template)
  router.use('/upload', createUploadRouter());

  return router;
}

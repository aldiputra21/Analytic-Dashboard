// FRS Main Router - wires all financial ratio system routes
// Requirements: 9.1, 9.6, 9.7, 9.8, 11.1

import { Router, Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import rateLimit from 'express-rate-limit';
import { createFRSAuthRouter } from './auth';
import { createSubsidiariesRouter } from './subsidiaries';
import { createFinancialDataRouter } from './financialData';
import { createUsersRouter } from './users';
import { createRatiosRouter } from './ratios';
import { createThresholdsRouter } from './thresholds';
import { createAlertsRouter } from './alerts';
import { createReportsRouter } from './reports';
import { createAuditLogRouter } from './auditLog';
import { createBackupRouter } from './backup';

// Rate limiter for auth endpoints (prevent brute force)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  message: { error: { code: 'FRS_RATE_LIMIT', message: 'Too many requests, please try again later' } },
  standardHeaders: true,
  legacyHeaders: false,
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

  // Subsidiary management
  router.use('/subsidiaries', createSubsidiariesRouter());

  // Financial data management (bulk must be registered before /:id routes)
  router.use('/financial-data', createFinancialDataRouter());

  // User management (Owner only)
  router.use('/users', createUsersRouter());

  // Calculated ratios (with caching)
  router.use('/ratios', createRatiosRouter());

  // Threshold configuration (Owner only for write)
  router.use('/thresholds', createThresholdsRouter());

  // Alert management
  router.use('/alerts', createAlertsRouter());

  // Reports and export
  router.use('/reports', createReportsRouter());

  // Audit log (Owner only)
  router.use('/audit-log', createAuditLogRouter());

  // Backup and restore (Owner only)
  router.use('/backup', createBackupRouter());

  return router;
}

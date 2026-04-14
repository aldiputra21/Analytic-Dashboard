// FRS Role-Based Access Control Middleware
// Drizzle ORM PostgreSQL implementation — uses public.user_corporate_accesses

import { Request, Response, NextFunction } from 'express';
import { eq, and } from 'drizzle-orm';
import { db } from '../db/connection';
import { userCorporateAccesses } from '../db/schema';
import { UserRole } from '../types/financial/user';
import { createFRSAuditLog } from '../services/financial/auditLogService';

// ============================================================
// Permission Map
// ============================================================

type Action = 'read' | 'write' | 'delete' | 'configure' | 'manage_users' | 'export' | 'schedule';

const ROLE_PERMISSIONS: Record<UserRole, Record<string, Action[]>> = {
  owner: {
    subsidiaries: ['read', 'write', 'delete', 'configure'],
    financial_data: ['read', 'write', 'delete'],
    ratios: ['read'],
    alerts: ['read', 'write'],
    thresholds: ['read', 'write', 'configure'],
    reports: ['read', 'write', 'export', 'schedule'],
    users: ['read', 'write', 'delete', 'manage_users'],
    audit_log: ['read'],
    config: ['read', 'write'],
  },
  bod: {
    subsidiaries: ['read'],
    financial_data: ['read', 'write'],
    ratios: ['read'],
    alerts: ['read'],
    thresholds: ['read'],
    reports: ['read', 'export'],
    users: [],
    audit_log: [],
    config: [],
  },
  subsidiary_manager: {
    subsidiaries: ['read'],
    financial_data: ['read', 'write'],
    ratios: ['read'],
    alerts: ['read'],
    thresholds: ['read'],
    reports: ['read', 'export'],
    users: [],
    audit_log: [],
    config: [],
  },
};

/**
 * Checks if a role has permission for a resource+action.
 */
export function hasPermission(role: UserRole, resource: string, action: Action): boolean {
  const perms = ROLE_PERMISSIONS[role]?.[resource] ?? [];
  return perms.includes(action);
}

/**
 * Middleware factory: requires the user to have permission for resource+action.
 * Logs unauthorized attempts to audit_log.
 */
export function authorize(resource: string, action: Action) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const user = req.frsUser;

    if (!user) {
      res.status(401).json({
        error: {
          code: 'FRS_UNAUTHORIZED',
          message: 'Authentication required',
          timestamp: new Date().toISOString(),
          requestId: '',
        },
      });
      return;
    }

    if (!hasPermission(user.role, resource, action)) {
      await createFRSAuditLog({
        userId: user.userId,
        action: 'delete',
        entityType: resource,
        newValues: { attemptedAction: action, denied: true },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      res.status(403).json({
        error: {
          code: 'FRS_FORBIDDEN',
          message: `Access denied. Role '${user.role}' cannot perform '${action}' on '${resource}'`,
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] ?? '',
        },
      });
      return;
    }

    next();
  };
}

/**
 * Checks if a subsidiary_manager user has access to a specific corporate (subsidiary).
 */
export async function checkSubsidiaryAccess(
  userId: string,
  corporateId: string,
): Promise<boolean> {
  const [row] = await db.select({ id: userCorporateAccesses.id }).from(userCorporateAccesses)
    .where(and(
      eq(userCorporateAccesses.userId, userId),
      eq(userCorporateAccesses.corporateId, corporateId),
    ))
    .limit(1);
  return row != null;
}

/**
 * Middleware: for subsidiary_manager role, verifies they have access to the
 * subsidiaryId in req.params or req.query.
 * Owner and BOD bypass this check.
 */
export function requireSubsidiaryAccess() {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const user = req.frsUser;
    if (!user) {
      res.status(401).json({ error: { code: 'FRS_UNAUTHORIZED', message: 'Authentication required', timestamp: new Date().toISOString(), requestId: '' } });
      return;
    }

    if (user.role === 'owner' || user.role === 'bod') {
      next();
      return;
    }

    const subsidiaryId =
      (req.params.subsidiaryId ?? req.params.id ?? req.query.subsidiaryId as string);

    if (!subsidiaryId) {
      next();
      return;
    }

    if (!(await checkSubsidiaryAccess(user.userId, subsidiaryId))) {
      await createFRSAuditLog({
        userId: user.userId,
        action: 'delete',
        entityType: 'subsidiary_access',
        newValues: { denied: true, reason: 'no_subsidiary_access', corporateId: subsidiaryId },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      res.status(403).json({
        error: {
          code: 'FRS_SUBSIDIARY_ACCESS_DENIED',
          message: 'You do not have access to this subsidiary',
          timestamp: new Date().toISOString(),
          requestId: '',
        },
      });
      return;
    }

    next();
  };
}

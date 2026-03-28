// FRS Role-Based Access Control Middleware
// Requirements: 9.1, 9.2, 9.3, 9.4

import { Request, Response, NextFunction } from 'express';
import Database from 'better-sqlite3';
import { UserRole } from '../types/financial/user';
import { createFRSAuditLog } from '../services/financial/auditLogService';

// ============================================================
// Permission Map
// Defines what each role can do per resource.
// Requirements: 9.2, 9.3, 9.4
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
 * Requirements: 9.2, 9.3, 9.4, 9.10
 */
export function authorize(resource: string, action: Action, db?: Database.Database) {
  return (req: Request, res: Response, next: NextFunction): void => {
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
      // Log unauthorized access attempt (Req 9.10)
      if (db) {
        createFRSAuditLog(db, {
          userId: user.userId,
          action: 'delete', // closest available action for unauthorized attempt
          entityType: resource,
          newValues: { attemptedAction: action, denied: true },
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
        });
      }

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
 * Checks if a subsidiary_manager user has access to a specific subsidiary.
 * Requirements: 9.4
 */
export function checkSubsidiaryAccess(
  db: Database.Database,
  userId: string,
  subsidiaryId: string
): boolean {
  const row = db
    .prepare('SELECT id FROM frs_user_subsidiary_access WHERE user_id = ? AND subsidiary_id = ?')
    .get(userId, subsidiaryId);
  return row != null;
}

/**
 * Middleware: for subsidiary_manager role, verifies they have access to the
 * subsidiaryId in req.params.subsidiaryId or req.query.subsidiaryId.
 * Owner and BOD bypass this check.
 * Requirements: 9.4
 */
export function requireSubsidiaryAccess(db: Database.Database) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = req.frsUser;
    if (!user) {
      res.status(401).json({ error: { code: 'FRS_UNAUTHORIZED', message: 'Authentication required', timestamp: new Date().toISOString(), requestId: '' } });
      return;
    }

    // Owner and BOD have access to all subsidiaries
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

    if (!checkSubsidiaryAccess(db, user.userId, subsidiaryId)) {
      createFRSAuditLog(db, {
        userId: user.userId,
        action: 'delete',
        entityType: 'subsidiary_access',
        subsidiaryId,
        newValues: { denied: true, reason: 'no_subsidiary_access' },
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

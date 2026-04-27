// Unified RBAC Middleware
// Role-Based Access Control (actually Permission-Based)

import { Request, Response, NextFunction } from 'express';
import { eq, and } from 'drizzle-orm';
import { db } from '../db/connection';
import { userCorporateAccesses } from '../db/schema';
import { createFRSAuditLog } from '../services/financial/auditLogService';
import { userHasPermission } from '../services/financial/permissionService';

/**
 * Middleware: requires the user to have at least one of the specified permissions.
 * Permissions should be in dot-notation format: 'module.resource.action' (e.g., 'cfd.subsidiaries.read')
 */
export function requirePermission(...permissionKeys: string[]) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
      return;
    }

    // Check permissions against database
    const results = await Promise.all(
      permissionKeys.map((key) => userHasPermission(userId, key))
    );

    const hasAccess = results.some((result) => result === true);

    if (!hasAccess) {
      // Audit log the denial
      await createFRSAuditLog({
        userId,
        action: 'delete', // Using 'delete' as a placeholder for unauthorized access attempt (per frsRbac pattern)
        entityType: 'security_violation',
        newValues: {
          attemptedPermissions: permissionKeys,
          denied: true,
          url: req.originalUrl,
          method: req.method,
        },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      }).catch(() => {/* ignore audit log errors */});

      res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: `Access denied. Required permissions: ${permissionKeys.join(', ')}`,
        },
      });
      return;
    }

    next();
  };
}

/**
 * Checks if a user has access to a specific corporate (subsidiary).
 * Now uses the attached accessContext for efficiency.
 */
export function checkSubsidiaryAccess(
  req: Request,
  corporateId: string,
): boolean {
  const access = req.accessContext;
  if (!access) return false;
  if (access.scope === 'system') return true;
  return access.corporateIds.includes(corporateId);
}

/**
 * Middleware: for non-SYSTEM scope roles, verifies they have access to the
 * subsidiaryId in req.params or req.query.
 */
export function requireSubsidiaryAccess() {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = req.user?.userId;
    const access = req.accessContext;

    if (!userId || !access) {
      res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
      return;
    }

    // System scope bypasses specific subsidiary constraints
    if (access.scope === 'system') {
      next();
      return;
    }

    const subsidiaryId =
      (req.params.subsidiaryId ?? req.params.id ?? req.params.corporateId ?? 
       req.query.subsidiaryId ?? req.query.corporateId ?? req.query.corporate_id) as string;

    if (!subsidiaryId) {
      next();
      return;
    }

    if (!access.corporateIds.includes(subsidiaryId)) {
      res.status(403).json({
        error: {
          code: 'SUBSIDIARY_ACCESS_DENIED',
          message: 'You do not have access to this subsidiary',
        },
      });
      return;
    }

    next();
  };
}

/**
 * Middleware: ensures req.accessContext is populated.
 * Note: The main 'authenticate' middleware already does this, 
 * but this is provided for explicit route-level clarity or manual re-injection.
 */
export async function injectAccessContext(req: Request, res: Response, next: NextFunction): Promise<void> {
  if (req.accessContext) {
    next();
    return;
  }

  const userId = req.user?.userId;
  if (!userId) {
    res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
    return;
  }

  try {
    const { getUserAccessContext } = await import('../services/financial/permissionService');
    req.accessContext = await getUserAccessContext(userId);
    next();
  } catch (err) {
    next(err);
  }
}

/**
 * Middleware: requires the user to have a specific access scope.
 */
export function requireScope(scope: 'system' | 'corporate' | 'department') {
  return (req: Request, res: Response, next: NextFunction) => {
    const access = req.accessContext;
    if (!access || access.scope !== scope) {
      res.status(403).json({ 
        error: { 
          code: 'FORBIDDEN_SCOPE', 
          message: `Required scope: ${scope}. Your scope: ${access?.scope ?? 'none'}` 
        } 
      });
      return;
    }
    next();
  };
}

/**
 * Backward compatibility aliases
 */
export const authorize = (resource: string, action: string) => {
  return requirePermission(`cfd.${resource}.${action}`);
};

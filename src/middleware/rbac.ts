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
 * Middleware: for non-OWNER/BOD roles, verifies they have access to the
 * subsidiaryId in req.params or req.query.
 */
export function requireSubsidiaryAccess() {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = req.user?.userId;
    const role = req.user?.role;

    if (!userId) {
      res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
      return;
    }

    // Owner and BOD bypass specific subsidiary constraints as they have global view
    if (role === 'owner' || role === 'bod') {
      next();
      return;
    }

    const subsidiaryId =
      (req.params.subsidiaryId ?? req.params.id ?? req.query.subsidiaryId as string);

    if (!subsidiaryId) {
      next();
      return;
    }

    if (!(await checkSubsidiaryAccess(userId, subsidiaryId))) {
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
 * Backward compatibility aliases
 */
export const authorize = (resource: string, action: string) => {
  return requirePermission(`cfd.${resource}.${action}`);
};

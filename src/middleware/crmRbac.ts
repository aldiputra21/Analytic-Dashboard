import { Request, Response, NextFunction } from 'express';
import { sql } from 'drizzle-orm';
import { db } from '../db/connection';
import { CRMRole, CRM_ROLE_PERMISSIONS } from '../types/crm';

// ============================================================
// CRM RBAC Middleware
// Drizzle ORM PostgreSQL implementation — uses public.user_corporate_accesses + roles.
// ============================================================

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      userRole?: string;
      crmRoles?: CRMRole[];
      crmPermissions?: string[];
    }
  }
}

/**
 * Loads CRM roles for the authenticated user from user_corporate_accesses + roles.
 */
export function loadCRMRoles() {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.userId) {
      next();
      return;
    }

    try {
      const rows = (await db.execute(sql`
        SELECT DISTINCT r.name AS role_name
        FROM public.user_corporate_accesses uca
        JOIN public.roles r ON uca.role_id = r.id
        WHERE uca.user_id = ${req.userId} AND r.module = 'crm'
      `)).rows as { role_name: string }[];

      const crmRoles = rows.map((r) => r.role_name as CRMRole);
      req.crmRoles = crmRoles;

      const permissionSet = new Set<string>();
      for (const role of crmRoles) {
        const perms = CRM_ROLE_PERMISSIONS[role] ?? [];
        perms.forEach((p) => permissionSet.add(p));
      }

      if (req.userRole === 'ADMIN' || req.userRole === 'OWNER' || req.userRole === 'BOD') {
        permissionSet.add('crm:read:all');
      }

      req.crmPermissions = Array.from(permissionSet);
      next();
    } catch (err) {
      console.error('[CRM RBAC] Failed to load CRM roles:', err);
      next();
    }
  };
}

/**
 * Middleware factory: requires the user to have at least one of the given CRM permissions.
 */
export function requireCRMPermission(...permissions: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const userPerms = req.crmPermissions ?? [];

    if (!permissions.some((p) => userPerms.includes(p))) {
      res.status(403).json({
        error: {
          code: 'CRM_FORBIDDEN',
          message: `Akses ditolak. Diperlukan salah satu izin: ${permissions.join(', ')}`,
          details: { required: permissions, userPermissions: userPerms },
        },
      });
      return;
    }

    next();
  };
}

/**
 * Middleware factory: requires the user to have at least one of the given CRM roles.
 */
export function requireCRMRole(...roles: CRMRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const userRoles = req.crmRoles ?? [];

    if (!roles.some((r) => userRoles.includes(r))) {
      res.status(403).json({
        error: {
          code: 'CRM_ROLE_REQUIRED',
          message: `Akses ditolak. Diperlukan salah satu role CRM: ${roles.join(', ')}`,
          details: { required: roles, userRoles },
        },
      });
      return;
    }

    next();
  };
}

/**
 * Checks if the current user can access a specific opportunity.
 */
export function canAccessOpportunity(
  req: Request,
  assignedTo: string,
): boolean {
  const userPerms = req.crmPermissions ?? [];
  const userRoles = req.crmRoles ?? [];

  if (userPerms.includes('crm:read:all')) return true;
  if (userRoles.includes('Sales_Executive')) return req.userId === assignedTo;

  return false;
}

/**
 * Middleware: enforces that Sales_Executive can only access their own opportunities.
 * Expects req.params.id to be the opportunity ID and the opportunity to be
 * pre-fetched and attached as req.body._opportunity (or checked inline).
 * This is a helper used by route handlers rather than a standalone middleware.
 */
export function assertOpportunityAccess(assignedTo: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!canAccessOpportunity(req, assignedTo)) {
      res.status(403).json({
        error: {
          code: 'CRM_OPPORTUNITY_ACCESS_DENIED',
          message:
            'Akses ditolak. Sales_Executive hanya dapat mengakses opportunity yang ditugaskan kepadanya.',
        },
      });
      return;
    }
    next();
  };
}

/**
 * Helper: checks if the user has a specific CRM permission.
 */
export function hasCRMPermission(req: Request, permission: string): boolean {
  return (req.crmPermissions ?? []).includes(permission);
}

/**
 * Helper: checks if the user has a specific CRM role.
 */
export function hasCRMRole(req: Request, role: CRMRole): boolean {
  return (req.crmRoles ?? []).includes(role);
}

/**
 * Helper: returns true if the user is a Sales_Manager.
 */
export function isSalesManager(req: Request): boolean {
  return hasCRMRole(req, 'Sales_Manager');
}

/**
 * Helper: returns true if the user is a Sales_Executive.
 */
export function isSalesExecutive(req: Request): boolean {
  return hasCRMRole(req, 'Sales_Executive');
}

/**
 * Helper: returns true if the user is a BD_Manager.
 */
export function isBDManager(req: Request): boolean {
  return hasCRMRole(req, 'BD_Manager');
}

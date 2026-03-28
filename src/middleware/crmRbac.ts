import { Request, Response, NextFunction } from 'express';
import Database from 'better-sqlite3';
import { CRMRole, CRM_ROLE_PERMISSIONS } from '../types/crm';

// ============================================================
// CRM RBAC Middleware
// Extends the existing MAFINDA RBAC system to support CRM roles:
// Sales_Manager, Sales_Executive, BD_Manager
// Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.7, 9.8
// ============================================================

// Extend Express Request to include CRM context
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
 * Loads CRM roles for the authenticated user from the database.
 * Attaches crmRoles and crmPermissions to the request object.
 */
export function loadCRMRoles(db: Database.Database) {
  return (req: Request, res: Response, next: NextFunction): void => {
    // userId must be set by the existing auth middleware
    if (!req.userId) {
      next();
      return;
    }

    try {
      const rows = db
        .prepare('SELECT crm_role FROM crm_user_roles WHERE user_id = ?')
        .all(req.userId) as { crm_role: CRMRole }[];

      const crmRoles = rows.map((r) => r.crm_role);
      req.crmRoles = crmRoles;

      // Aggregate all permissions from all CRM roles
      const permissionSet = new Set<string>();
      for (const role of crmRoles) {
        const perms = CRM_ROLE_PERMISSIONS[role] ?? [];
        perms.forEach((p) => permissionSet.add(p));
      }

      // Owner and BOD (existing MAFINDA roles) get read-only CRM access (Req 9.5)
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
 * Returns 403 if the user lacks the required permission.
 * Requirements: 9.2, 9.3, 9.4, 9.7
 */
export function requireCRMPermission(...permissions: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const userPerms = req.crmPermissions ?? [];

    const hasPermission = permissions.some((p) => userPerms.includes(p));

    if (!hasPermission) {
      res.status(403).json({
        error: {
          code: 'CRM_FORBIDDEN',
          message: `Akses ditolak. Diperlukan salah satu izin: ${permissions.join(', ')}`,
          details: {
            required: permissions,
            userPermissions: userPerms,
          },
        },
      });
      return;
    }

    next();
  };
}

/**
 * Middleware factory: requires the user to have at least one of the given CRM roles.
 * Returns 403 if the user lacks the required role.
 */
export function requireCRMRole(...roles: CRMRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const userRoles = req.crmRoles ?? [];

    const hasRole = roles.some((r) => userRoles.includes(r));

    if (!hasRole) {
      res.status(403).json({
        error: {
          code: 'CRM_ROLE_REQUIRED',
          message: `Akses ditolak. Diperlukan salah satu role CRM: ${roles.join(', ')}`,
          details: {
            required: roles,
            userRoles,
          },
        },
      });
      return;
    }

    next();
  };
}

/**
 * Checks if the current user can access a specific opportunity.
 * Sales_Executive can only access opportunities assigned to them.
 * Sales_Manager and BD_Manager can access all opportunities.
 * Requirements: 2.10, 9.3
 */
export function canAccessOpportunity(
  req: Request,
  assignedTo: string
): boolean {
  const userRoles = req.crmRoles ?? [];
  const userPerms = req.crmPermissions ?? [];

  // Sales_Manager and BD_Manager can read all
  if (userPerms.includes('crm:read:all')) {
    return true;
  }

  // Sales_Executive can only access their own
  if (userRoles.includes('Sales_Executive')) {
    return req.userId === assignedTo;
  }

  // Owner/BOD with read:all
  if (userPerms.includes('crm:read:all')) {
    return true;
  }

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

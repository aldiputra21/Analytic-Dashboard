// User Management Routes (Owner only)
// Requirements: 9.1, 9.5, 9.9

import { Router, Request, Response } from 'express';
import { requirePermission } from '../../middleware/rbac';
import {
  createUser,
  listUsers,
  getUserById,
  updateUser,
  setUserStatus,
  assignSubsidiaryAccess,
  getUserSubsidiaryAccess,
} from '../../services/financial/userService';
import { createFRSAuditLog } from '../../services/financial/auditLogService';
import { db } from '../../db/connection';
import { roles } from '../../db/schema/public';
import { asc } from 'drizzle-orm';

export function createUsersRouter(): Router {
  const router = Router();

  /**
   * POST /api/frs/users
   * Create a new user (Owner only).
   */
  router.post('/', requirePermission('cfd.users.manage_users'), async (req: Request, res: Response) => {
    const { username, email, password, role, fullName, subsidiaryIds } = req.body;

    if (!username || !email || !password || !role || !fullName) {
      res.status(400).json({
        error: { code: 'FRS_VALIDATION_ERROR', message: 'username, email, password, role, and fullName are required', timestamp: new Date().toISOString(), requestId: '' },
      });
      return;
    }

    if (!['owner', 'bod', 'subsidiary_manager'].includes(role)) {
      res.status(400).json({
        error: { code: 'FRS_VALIDATION_ERROR', message: 'role must be owner, bod, or subsidiary_manager', timestamp: new Date().toISOString(), requestId: '' },
      });
      return;
    }

    if (role !== 'owner' && (!Array.isArray(subsidiaryIds) || subsidiaryIds.length === 0)) {
      res.status(400).json({
        error: { code: 'FRS_VALIDATION_ERROR', message: 'subsidiaryIds is required for non-owner users', timestamp: new Date().toISOString(), requestId: '' },
      });
      return;
    }

    const result = await createUser({ username, email, password, role, fullName, subsidiaryIds }, req.user!.userId);

    if (result.error) {
      res.status(422).json({
        error: { code: 'FRS_VALIDATION_ERROR', message: result.error, timestamp: new Date().toISOString(), requestId: '' },
      });
      return;
    }

    await createFRSAuditLog({
      userId: req.user!.userId,
      action: 'create',
      entityType: 'user',
      entityId: result.user!.id,
      newValues: { username, email, role, subsidiaryIds },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.status(201).json(result.user);
  });

  /**
   * GET /api/frs/users
   * List all users (Owner only).
   */
  router.get('/', requirePermission('cfd.users.manage_users'), async (_req: Request, res: Response) => {
    const users = await listUsers();
    res.json(users);
  });

  /**
   * GET /api/frs/users/:id
   * Get user details (Owner only).
   */
  router.get('/:id', requirePermission('cfd.users.manage_users'), async (req: Request, res: Response) => {
    const user = await getUserById(req.params.id);
    if (!user) {
      res.status(404).json({
        error: { code: 'FRS_NOT_FOUND', message: 'User not found', timestamp: new Date().toISOString(), requestId: '' },
      });
      return;
    }
    res.json(user);
  });

  /**
   * PUT /api/frs/users/:id
   * Update a user (Owner only).
   */
  router.put('/:id', requirePermission('cfd.users.manage_users'), async (req: Request, res: Response) => {
    const { email, fullName, role, subsidiaryIds } = req.body;

    const existing = await getUserById(req.params.id);
    if (!existing) {
      res.status(404).json({
        error: { code: 'FRS_NOT_FOUND', message: 'User not found', timestamp: new Date().toISOString(), requestId: '' },
      });
      return;
    }

    if (role && !['owner', 'bod', 'subsidiary_manager'].includes(role)) {
      res.status(400).json({
        error: { code: 'FRS_VALIDATION_ERROR', message: 'role must be owner, bod, or subsidiary_manager', timestamp: new Date().toISOString(), requestId: '' },
      });
      return;
    }

    if (role && role !== 'owner' && (!Array.isArray(subsidiaryIds) || subsidiaryIds.length === 0)) {
      res.status(400).json({
        error: { code: 'FRS_VALIDATION_ERROR', message: 'subsidiaryIds is required for non-owner roles', timestamp: new Date().toISOString(), requestId: '' },
      });
      return;
    }

    let updated;
    try {
      updated = await updateUser(req.params.id, { email, fullName, role, subsidiaryIds }, req.user!.userId);
    } catch (err: any) {
      res.status(422).json({
        error: { code: 'FRS_VALIDATION_ERROR', message: err.message ?? 'Failed to update user', timestamp: new Date().toISOString(), requestId: '' },
      });
      return;
    }

    await createFRSAuditLog({
      userId: req.user!.userId,
      action: 'update',
      entityType: 'user',
      entityId: req.params.id,
      oldValues: { email: existing.email, role: existing.role },
      newValues: { email, role, subsidiaryIds },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.json(updated);
  });

  /**
   * PATCH /api/frs/users/:id/status
   * Activate or deactivate a user (Owner only).
   */
  router.patch('/:id/status', requirePermission('cfd.users.manage_users'), async (req: Request, res: Response) => {
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
      res.status(400).json({
        error: { code: 'FRS_VALIDATION_ERROR', message: 'isActive (boolean) is required', timestamp: new Date().toISOString(), requestId: '' },
      });
      return;
    }

    const updated = await setUserStatus(req.params.id, isActive, req.user!.userId);
    if (!updated) {
      res.status(404).json({
        error: { code: 'FRS_NOT_FOUND', message: 'User not found', timestamp: new Date().toISOString(), requestId: '' },
      });
      return;
    }

    await createFRSAuditLog({
      userId: req.user!.userId,
      action: 'update',
      entityType: 'user',
      entityId: req.params.id,
      newValues: { isActive },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.json(updated);
  });

  /**
   * POST /api/frs/users/:id/subsidiary-access
   * Assign subsidiary access to a user (Owner only).
   * Requirements: 9.9
   */
  router.post('/:id/subsidiary-access', requirePermission('cfd.users.manage_users'), async (req: Request, res: Response) => {
    const { subsidiaryIds, replace } = req.body;

    if (!Array.isArray(subsidiaryIds) || subsidiaryIds.length === 0) {
      res.status(400).json({
        error: { code: 'FRS_VALIDATION_ERROR', message: 'subsidiaryIds (array) is required', timestamp: new Date().toISOString(), requestId: '' },
      });
      return;
    }

    const result = await assignSubsidiaryAccess(req.params.id, subsidiaryIds, req.user!.userId, {
      replace: replace !== false,
    });

    if (!result.success) {
      res.status(422).json({
        error: { code: 'FRS_VALIDATION_ERROR', message: result.error, timestamp: new Date().toISOString(), requestId: '' },
      });
      return;
    }

    await createFRSAuditLog({
      userId: req.user!.userId,
      action: 'update',
      entityType: 'user_subsidiary_access',
      entityId: req.params.id,
      newValues: { subsidiaryIds, replace: replace !== false },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    const access = await getUserSubsidiaryAccess(req.params.id);
    res.json(access);
  });

  /**
   * GET /api/frs/users/:id/subsidiary-access
   * Get subsidiary access for a user (Owner only).
   */
  router.get('/:id/subsidiary-access', requirePermission('cfd.users.manage_users'), async (req: Request, res: Response) => {
    const user = await getUserById(req.params.id);
    if (!user) {
      res.status(404).json({
        error: { code: 'FRS_NOT_FOUND', message: 'User not found', timestamp: new Date().toISOString(), requestId: '' },
      });
      return;
    }
    const access = await getUserSubsidiaryAccess(req.params.id);
    res.json(access);
  });

  return router;
}

/**
 * Creates a router for listing roles.
 * GET /api/frs/roles — returns all roles (id, name, description).
 */
export function createRolesRouter(): Router {
  const router = Router();

  router.get('/', async (_req: Request, res: Response) => {
    const allRoles = await db
      .select({ id: roles.id, name: roles.name, description: roles.description })
      .from(roles)
      .orderBy(asc(roles.name));
    res.json(allRoles);
  });

  return router;
}

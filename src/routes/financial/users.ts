// User Management Routes (Owner only)
// Requirements: 9.1, 9.5, 9.9

import { Router, Request, Response } from 'express';
import Database from 'better-sqlite3';
import { requireFRSAuth } from '../../middleware/frsAuth';
import { authorize } from '../../middleware/frsRbac';
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

export function createUsersRouter(db: Database.Database): Router {
  const router = Router();

  router.use(requireFRSAuth);

  /**
   * POST /api/frs/users
   * Create a new user (Owner only).
   */
  router.post('/', authorize('users', 'manage_users', db), async (req: Request, res: Response) => {
    const { username, email, password, role, fullName } = req.body;

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

    const result = await createUser(db, { username, email, password, role, fullName }, req.frsUser!.userId);

    if (result.error) {
      res.status(422).json({
        error: { code: 'FRS_VALIDATION_ERROR', message: result.error, timestamp: new Date().toISOString(), requestId: '' },
      });
      return;
    }

    createFRSAuditLog(db, {
      userId: req.frsUser!.userId,
      action: 'create',
      entityType: 'user',
      entityId: result.user!.id,
      newValues: { username, email, role },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.status(201).json(result.user);
  });

  /**
   * GET /api/frs/users
   * List all users (Owner only).
   */
  router.get('/', authorize('users', 'manage_users', db), (req: Request, res: Response) => {
    const users = listUsers(db);
    res.json(users);
  });

  /**
   * GET /api/frs/users/:id
   * Get user details (Owner only).
   */
  router.get('/:id', authorize('users', 'manage_users', db), (req: Request, res: Response) => {
    const user = getUserById(db, req.params.id);
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
  router.put('/:id', authorize('users', 'manage_users', db), (req: Request, res: Response) => {
    const { username, email, role, fullName } = req.body;

    const existing = getUserById(db, req.params.id);
    if (!existing) {
      res.status(404).json({
        error: { code: 'FRS_NOT_FOUND', message: 'User not found', timestamp: new Date().toISOString(), requestId: '' },
      });
      return;
    }

    const updated = updateUser(db, req.params.id, { username, email, role, fullName });

    createFRSAuditLog(db, {
      userId: req.frsUser!.userId,
      action: 'update',
      entityType: 'user',
      entityId: req.params.id,
      oldValues: { username: existing.username, role: existing.role },
      newValues: { username, role },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.json(updated);
  });

  /**
   * PATCH /api/frs/users/:id/status
   * Activate or deactivate a user (Owner only).
   */
  router.patch('/:id/status', authorize('users', 'manage_users', db), (req: Request, res: Response) => {
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
      res.status(400).json({
        error: { code: 'FRS_VALIDATION_ERROR', message: 'isActive (boolean) is required', timestamp: new Date().toISOString(), requestId: '' },
      });
      return;
    }

    const updated = setUserStatus(db, req.params.id, isActive);
    if (!updated) {
      res.status(404).json({
        error: { code: 'FRS_NOT_FOUND', message: 'User not found', timestamp: new Date().toISOString(), requestId: '' },
      });
      return;
    }

    createFRSAuditLog(db, {
      userId: req.frsUser!.userId,
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
  router.post('/:id/subsidiary-access', authorize('users', 'manage_users', db), (req: Request, res: Response) => {
    const { subsidiaryIds } = req.body;

    if (!Array.isArray(subsidiaryIds) || subsidiaryIds.length === 0) {
      res.status(400).json({
        error: { code: 'FRS_VALIDATION_ERROR', message: 'subsidiaryIds (array) is required', timestamp: new Date().toISOString(), requestId: '' },
      });
      return;
    }

    const result = assignSubsidiaryAccess(db, req.params.id, subsidiaryIds, req.frsUser!.userId);

    if (!result.success) {
      res.status(422).json({
        error: { code: 'FRS_VALIDATION_ERROR', message: result.error, timestamp: new Date().toISOString(), requestId: '' },
      });
      return;
    }

    createFRSAuditLog(db, {
      userId: req.frsUser!.userId,
      action: 'update',
      entityType: 'user_subsidiary_access',
      entityId: req.params.id,
      newValues: { subsidiaryIds },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    const access = getUserSubsidiaryAccess(db, req.params.id);
    res.json(access);
  });

  /**
   * GET /api/frs/users/:id/subsidiary-access
   * Get subsidiary access for a user (Owner only).
   */
  router.get('/:id/subsidiary-access', authorize('users', 'manage_users', db), (req: Request, res: Response) => {
    const user = getUserById(db, req.params.id);
    if (!user) {
      res.status(404).json({
        error: { code: 'FRS_NOT_FOUND', message: 'User not found', timestamp: new Date().toISOString(), requestId: '' },
      });
      return;
    }
    const access = getUserSubsidiaryAccess(db, req.params.id);
    res.json(access);
  });

  return router;
}

// Role Management Routes
// Requirements: 2.1–2.11, 3.1–3.10, 20.3–20.5, 23.1–23.7, 24.1–24.2

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { requirePermission, injectAccessContext } from '../../middleware/rbac';
import {
  listRoles,
  getRoleById,
  createRole,
  updateRole,
  toggleRoleStatus,
  getRolePermissions,
  setRolePermissions,
} from '../../services/financial/roleService';
import { asyncHandler } from '../../utils/asyncHandler';

// ============================================================================
// Zod Schemas
// ============================================================================

const CreateRoleSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  scope: z.enum(['system', 'corporate', 'department']),
  description: z.string().optional(),
});

const UpdateRoleSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100).optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
});

const SetPermissionsSchema = z.object({
  permissionIds: z.array(z.string().uuid()),
});

// ============================================================================
// Routes
// ============================================================================

export function createRolesRouter(): Router {
  const router = Router();

  /**
   * GET /api/frs/roles
   * List roles with filters (scope, isActive, search, page, pageSize)
   * Requires: cfd.roles.read
   */
  router.get(
    '/',
    requirePermission('cfd.roles.read'),
    injectAccessContext,
    asyncHandler(async (req: Request, res: Response) => {
      const scope = req.query.scope as string | undefined;
      const isActive = req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined;
      const search = req.query.search as string | undefined;
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 10;

      // Validate scope if provided
      if (scope && !['system', 'corporate', 'department'].includes(scope)) {
        return res.status(400).json({
          error: { code: 'FRS_VALIDATION_ERROR', message: 'Invalid scope value' },
        });
      }

      const access = req.accessContext!;
      const result = await listRoles({
        scope: scope as 'system' | 'corporate' | 'department' | undefined,
        isActive,
        search,
        page,
        pageSize,
        requestingScope: access.scope as 'system' | 'corporate' | 'department',
      });

      res.json(result);
    }),
  );

  /**
   * GET /api/frs/roles/:id
   * Get single role with permissions
   * Requires: cfd.roles.read
   */
  router.get(
    '/:id',
    requirePermission('cfd.roles.read'),
    injectAccessContext,
    asyncHandler(async (req: Request, res: Response) => {
      const role = await getRoleById(req.params.id);

      const access = req.accessContext!;
      if (access.scope !== 'system' && role.scope === 'system') {
        return res.status(403).json({
          error: { code: 'FRS_FORBIDDEN', message: 'Access denied to system-level roles' },
        });
      }

      res.json(role);
    }),
  );

  /**
   * POST /api/frs/roles
   * Create role
   * Requires: cfd.roles.write
   */
  router.post(
    '/',
    requirePermission('cfd.roles.write'),
    injectAccessContext,
    asyncHandler(async (req: Request, res: Response) => {
      // Validate input
      const validation = CreateRoleSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          error: {
            code: 'FRS_VALIDATION_ERROR',
            message: 'Invalid input',
            details: validation.error.issues,
          },
        });
      }

      const access = req.accessContext!;
      if (access.scope !== 'system' && validation.data.scope === 'system') {
        return res.status(403).json({
          error: { code: 'FRS_FORBIDDEN', message: 'Cannot create system-level roles' },
        });
      }

      try {
        const role = await createRole(validation.data, req.user!.userId);
        res.status(201).json(role);
      } catch (error) {
        if (error instanceof Error && error.message.includes('already exists')) {
          return res.status(422).json({
            error: { code: 'FRS_CONFLICT', message: error.message },
          });
        }
        throw error;
      }
    }),
  );

  /**
   * PUT /api/frs/roles/:id
   * Update role
   * Requires: cfd.roles.write
   */
  router.put(
    '/:id',
    requirePermission('cfd.roles.write'),
    injectAccessContext,
    asyncHandler(async (req: Request, res: Response) => {
      // Validate input
      const validation = UpdateRoleSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          error: {
            code: 'FRS_VALIDATION_ERROR',
            message: 'Invalid input',
            details: validation.error.issues,
          },
        });
      }

      const access = req.accessContext!;
      const existing = await getRoleById(req.params.id);
      if (!existing) {
        return res.status(404).json({
          error: { code: 'FRS_NOT_FOUND', message: 'Role not found' },
        });
      }

      if (access.scope !== 'system' && existing.scope === 'system') {
        return res.status(403).json({
          error: { code: 'FRS_FORBIDDEN', message: 'Cannot modify system-level roles' },
        });
      }

      try {
        const role = await updateRole(req.params.id, validation.data, req.user!.userId);
        res.json(role);
      } catch (error) {
        if (error instanceof Error && error.message.includes('not found')) {
          return res.status(404).json({
            error: { code: 'FRS_NOT_FOUND', message: error.message },
          });
        }
        if (error instanceof Error && error.message.includes('already exists')) {
          return res.status(422).json({
            error: { code: 'FRS_CONFLICT', message: error.message },
          });
        }
        throw error;
      }
    }),
  );

  /**
   * PATCH /api/frs/roles/:id/status
   * Toggle role status
   * Requires: cfd.roles.write
   */
  router.patch(
    '/:id/status',
    requirePermission('cfd.roles.write'),
    injectAccessContext,
    asyncHandler(async (req: Request, res: Response) => {
      const existing = await getRoleById(req.params.id);
      if (!existing) {
        return res.status(404).json({
          error: { code: 'FRS_NOT_FOUND', message: 'Role not found' },
        });
      }

      const access = req.accessContext!;
      if (access.scope !== 'system' && existing.scope === 'system') {
        return res.status(403).json({
          error: { code: 'FRS_FORBIDDEN', message: 'Cannot modify system-level roles' },
        });
      }

      try {
        const role = await toggleRoleStatus(req.params.id, req.user!.userId);
        res.json(role);
      } catch (error) {
        if (error instanceof Error && error.message.includes('not found')) {
          return res.status(404).json({
            error: { code: 'FRS_NOT_FOUND', message: error.message },
          });
        }
        throw error;
      }
    }),
  );

  /**
   * GET /api/frs/roles/:id/permissions
   * List role permissions
   * Requires: cfd.roles.read
   */
  router.get(
    '/:id/permissions',
    requirePermission('cfd.roles.read'),
    injectAccessContext,
    asyncHandler(async (req: Request, res: Response) => {
      // Verify role exists
      const role = await getRoleById(req.params.id);
      if (!role) {
        return res.status(404).json({
          error: { code: 'FRS_NOT_FOUND', message: 'Role not found' },
        });
      }

      const access = req.accessContext!;
      if (access.scope !== 'system' && role.scope === 'system') {
        return res.status(403).json({
          error: { code: 'FRS_FORBIDDEN', message: 'Access denied to system-level roles' },
        });
      }

      const permissionIds = await getRolePermissions(req.params.id);
      res.json({ permissionIds });
    }),
  );

  /**
   * PUT /api/frs/roles/:id/permissions
   * Replace all permissions for a role (transactional)
   * Increments authz_version for affected users
   * Requires: cfd.roles.write
   */
  router.put(
    '/:id/permissions',
    requirePermission('cfd.roles.write'),
    injectAccessContext,
    asyncHandler(async (req: Request, res: Response) => {
      // Validate input
      const validation = SetPermissionsSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          error: {
            code: 'FRS_VALIDATION_ERROR',
            message: 'Invalid input',
            details: validation.error.issues,
          },
        });
      }

      try {
        // Verify role exists
        const role = await getRoleById(req.params.id);
        if (!role) {
          return res.status(404).json({
            error: { code: 'FRS_NOT_FOUND', message: 'Role not found' },
          });
        }

        const access = req.accessContext!;
        if (access.scope !== 'system' && role.scope === 'system') {
          return res.status(403).json({
            error: { code: 'FRS_FORBIDDEN', message: 'Cannot modify system-level roles' },
          });
        }

        await setRolePermissions(req.params.id, validation.data.permissionIds, req.user!.userId);
        res.json({ success: true });
      } catch (error) {
        if (error instanceof Error && error.message.includes('not found')) {
          return res.status(404).json({
            error: { code: 'FRS_NOT_FOUND', message: error.message },
          });
        }
        throw error;
      }
    }),
  );

  return router;
}

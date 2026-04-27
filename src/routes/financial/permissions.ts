// src/routes/financial/permissions.ts
// Requirements: 1.1–1.10, 20.1–20.2, 23.1–23.7

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { requirePermission, injectAccessContext, requireScope } from '../../middleware/rbac';
import {
  listPermissions,
  getPermissionById,
  createPermission,
  updatePermission,
  togglePermissionStatus,
} from '../../services/financial/permissionService';
import { asyncHandler } from '../../utils/asyncHandler';

// ============================================================================
// Zod Schemas
// ============================================================================

const CreatePermissionSchema = z.object({
  key: z.string().min(1, 'Key is required').regex(/^[a-z]+\.[a-z]+\.[a-z_]+$/, 'Key must follow format: module.resource.action'),
  module: z.string().min(1, 'Module is required'),
  description: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

const UpdatePermissionSchema = z.object({
  description: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  isActive: z.boolean().optional(),
});

type CreatePermissionInput = z.infer<typeof CreatePermissionSchema>;
type UpdatePermissionInput = z.infer<typeof UpdatePermissionSchema>;

// ============================================================================
// Router
// ============================================================================

export function createPermissionsRouter(): Router {
  const router = Router();

  /**
   * GET /api/permissions
   * List permissions with filters (module, isActive, search, page, pageSize)
   * Requires: cfd.permissions.read
   */
  router.get(
    '/',
    requirePermission('cfd.permissions.read'),
    injectAccessContext,
    asyncHandler(async (req: Request, res: Response) => {
      const module = req.query.module as string | undefined;
      const isActive = req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined;
      const search = req.query.search as string | undefined;
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 10;

      const result = await listPermissions({
        module,
        isActive,
        search,
        page,
        pageSize,
      });

      res.json(result);
    })
  );

  /**
   * GET /api/permissions/:id
   * Get single permission by ID
   * Requires: cfd.permissions.read
   */
  router.get(
    '/:id',
    requirePermission('cfd.permissions.read'),
    injectAccessContext,
    asyncHandler(async (req: Request, res: Response) => {
      const permission = await getPermissionById(req.params.id);
      if (!permission) {
        return res.status(404).json({ error: 'Permission not found' });
      }
      res.json(permission);
    })
  );

  /**
   * POST /api/permissions
   * Create new permission
   * Requires: cfd.permissions.write
   * Scope: system
   */
  router.post(
    '/',
    requirePermission('cfd.permissions.write'),
    injectAccessContext,
    requireScope('system'),
    asyncHandler(async (req: Request, res: Response) => {
      // Validate input
      const parseResult = CreatePermissionSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input',
            details: parseResult.error.issues,
          },
        });
      }

      const input: CreatePermissionInput = parseResult.data;

      try {
        const permission = await createPermission(input, req.user!.userId, {
          ip: req.ip,
          userAgent: req.headers['user-agent'],
        });
        res.status(201).json(permission);
      } catch (error: unknown) {
        if (error instanceof Error && error.message.includes('unique')) {
          return res.status(422).json({
            error: {
              code: 'DUPLICATE_KEY',
              message: 'Permission key already exists',
            },
          });
        }
        throw error;
      }
    })
  );

  /**
   * PUT /api/permissions/:id
   * Update permission
   * Requires: cfd.permissions.write
   * Scope: system
   */
  router.put(
    '/:id',
    requirePermission('cfd.permissions.write'),
    injectAccessContext,
    requireScope('system'),
    asyncHandler(async (req: Request, res: Response) => {
      // Validate input
      const parseResult = UpdatePermissionSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input',
            details: parseResult.error.issues,
          },
        });
      }

      const input: UpdatePermissionInput = parseResult.data;

      const permission = await updatePermission(req.params.id, input, req.user!.userId, {
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      });

      if (!permission) {
        return res.status(404).json({ error: 'Permission not found' });
      }

      res.json(permission);
    })
  );

  /**
   * PATCH /api/permissions/:id/status
   * Toggle permission active status
   * Requires: cfd.permissions.write
   * Scope: system
   */
  router.patch(
    '/:id/status',
    requirePermission('cfd.permissions.write'),
    injectAccessContext,
    requireScope('system'),
    asyncHandler(async (req: Request, res: Response) => {
      const permission = await togglePermissionStatus(req.params.id, req.user!.userId, {
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      });

      if (!permission) {
        return res.status(404).json({ error: 'Permission not found' });
      }

      res.json(permission);
    })
  );

  return router;
}

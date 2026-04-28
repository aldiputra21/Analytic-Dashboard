import { Router, Request, Response } from 'express';
import { db } from '../../db/connection';
import { systemConfigs } from '../../db/schema/public';
import { configService } from '../../services/management/configService';

import { asyncHandler } from '../../utils/asyncHandler';
import { AppError, ErrorCode } from '../../utils/errors';

import { requirePermission } from '../../middleware/rbac';
import { z } from 'zod';

const configUpdateSchema = z.object({
  value: z.any(),
  description: z.string().optional(),
});

export function createSystemConfigRouter(): Router {
  const router = Router();

  /**
   * GET /api/management/system-configs
   * Fetch all system configurations.
   * Accessible to those with read permission.
   */
  router.get('/', requirePermission('public.system_configs.read'), asyncHandler(async (req: Request, res: Response) => {
    const configs = await db.select().from(systemConfigs);
    res.json(configs);
  }));

  /**
   * GET /api/management/system-configs/:key
   * Fetch a specific configuration.
   */
  router.get('/:key', requirePermission('public.system_configs.read'), asyncHandler(async (req: Request, res: Response) => {
    const { key } = req.params;
    const value = await configService.get(key);
    if (value === undefined) {
      throw new AppError(ErrorCode.NOT_FOUND, `Config key '${key}' not found`);
    }
    res.json({ key, value });
  }));

  /**
   * PUT /api/management/system-configs/:key
   * Update a configuration value.
   * Restricted to system admin / write permission.
   */
  router.put('/:key', requirePermission('public.system_configs.write'), asyncHandler(async (req: Request, res: Response) => {
    const { key } = req.params;
    const { value, description } = configUpdateSchema.parse(req.body);
    const userId = req.user!.userId;

    await configService.set(key, value, description, userId);
    
    res.json({ success: true, key, value });
  }));

  /**
   * POST /api/management/system-configs
   * Create a new configuration.
   */
  router.post('/', requirePermission('public.system_configs.write'), asyncHandler(async (req: Request, res: Response) => {
    const { key, value, description } = z.object({
      key: z.string().min(1),
      value: z.any(),
      description: z.string().optional(),
    }).parse(req.body);
    
    const userId = req.user!.userId;

    await configService.set(key, value, description, userId);
    
    res.json({ success: true, key, value });
  }));

  /**
   * DELETE /api/management/system-configs/:key
   */
  router.delete('/:key', requirePermission('public.system_configs.write'), asyncHandler(async (req: Request, res: Response) => {
    const { key } = req.params;
    await configService.delete(key);
    res.json({ success: true });
  }));

  return router;
}

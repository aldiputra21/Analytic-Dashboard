import { Router, Request, Response } from 'express';
import { db } from '../../db/connection';
import { systemConfigs } from '../../db/schema/public';

import { asyncHandler } from '../../utils/asyncHandler';
import { AppError, ErrorCode } from '../../utils/errors';

import { requirePermission, injectAccessContext } from '../../middleware/rbac';

export function createSystemConfigRouter(): Router {
  const router = Router();

  /**
   * GET /api/system-configs
   * Fetch all system configurations.
   * Accessible to all authenticated users as needed by multiple modules.
   */
  router.get('/', asyncHandler(async (req: Request, res: Response) => {
    const configs = await db.select().from(systemConfigs);
    res.json(configs);
  }));

  return router;
}

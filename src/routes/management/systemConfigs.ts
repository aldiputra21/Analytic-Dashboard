import { Router, Request, Response } from 'express';
import { db } from '../../db/connection';
import { systemConfigs } from '../../db/schema/public';

import { asyncHandler } from '../../utils/asyncHandler';

import { requirePermission, injectAccessContext } from '../../middleware/rbac';

export function createSystemConfigRouter(): Router {
  const router = Router();

  router.get('/', requirePermission('cfd.system.manage'), injectAccessContext, asyncHandler(async (req: Request, res: Response) => {
    const access = req.accessContext!;
    if (access.scope !== 'system') {
      return res.status(403).json({ error: 'Only system admins can access system configs' });
    }
    const configs = await db.select().from(systemConfigs);
    res.json(configs);
  }));

  return router;
}

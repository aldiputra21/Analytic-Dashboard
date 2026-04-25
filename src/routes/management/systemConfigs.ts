import { Router, Request, Response } from 'express';
import { db } from '../../db/connection.js';
import { systemConfigs } from '../../db/schema/public.js';

import { asyncHandler } from '../../utils/asyncHandler';

export function createSystemConfigRouter(): Router {
  const router = Router();

  router.get('/', asyncHandler(async (_req: Request, res: Response) => {
    const configs = await db.select().from(systemConfigs);
    res.json(configs);
  }));

  return router;
}

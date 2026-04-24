import { Router, Request, Response } from 'express';
import { db } from '../../db/connection.js';
import { systemConfigs } from '../../db/schema/public.js';

export function createSystemConfigRouter(): Router {
  const router = Router();

  router.get('/', async (_req: Request, res: Response) => {
    try {
      const configs = await db.select().from(systemConfigs);
      res.json(configs);
    } catch (error) {
      console.error('Failed to fetch system configs:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  return router;
}

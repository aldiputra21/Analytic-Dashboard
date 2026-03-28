// Target Management Routes — MAFINDA Dashboard Enhancement
// Requirements: 7.3, 7.4, 7.8

import { Router, Request, Response } from 'express';
import Database from 'better-sqlite3';
import {
  getTargets,
  upsertTarget,
  deleteTarget,
} from '../../services/mafinda/targetService.js';
import { NotFoundError } from '../../services/mafinda/departmentService.js';

const VALID_ENTITY_TYPES = ['department', 'project'] as const;
const VALID_PERIOD_TYPES = ['monthly', 'quarterly', 'annual'] as const;

export function createTargetRouter(db: Database.Database): Router {
  const router = Router();

  // GET /api/targets — list targets with optional filters
  // Query params: entityType, entityId, period
  router.get('/', (req: Request, res: Response): void => {
    const { entityType, entityId, period } = req.query as Record<string, string>;

    if (entityType && !VALID_ENTITY_TYPES.includes(entityType as any)) {
      res.status(400).json({ error: 'Parameter entityType harus "department" atau "project"' });
      return;
    }

    try {
      const targets = getTargets(db, {
        entityType: entityType as 'department' | 'project' | undefined,
        entityId,
        period,
      });
      res.json(targets);
    } catch {
      res.status(500).json({ error: 'Terjadi kesalahan server' });
    }
  });

  // POST /api/targets — upsert target
  router.post('/', (req: Request, res: Response): void => {
    const { entityType, entityId, period, periodType, revenueTarget, operationalCostTarget } =
      req.body ?? {};

    if (!entityType || !VALID_ENTITY_TYPES.includes(entityType)) {
      res.status(400).json({ error: 'Field "entityType" wajib diisi ("department" atau "project")' });
      return;
    }
    if (!entityId?.trim()) {
      res.status(400).json({ error: 'Field "entityId" wajib diisi' });
      return;
    }
    if (!period?.trim()) {
      res.status(400).json({ error: 'Field "period" wajib diisi (format: YYYY-MM)' });
      return;
    }
    if (!periodType || !VALID_PERIOD_TYPES.includes(periodType)) {
      res.status(400).json({ error: 'Field "periodType" wajib diisi (monthly|quarterly|annual)' });
      return;
    }
    if (revenueTarget === undefined || revenueTarget === null || isNaN(Number(revenueTarget))) {
      res.status(400).json({ error: 'Field "revenueTarget" wajib diisi dan harus berupa angka' });
      return;
    }
    if (
      operationalCostTarget === undefined ||
      operationalCostTarget === null ||
      isNaN(Number(operationalCostTarget))
    ) {
      res.status(400).json({ error: 'Field "operationalCostTarget" wajib diisi dan harus berupa angka' });
      return;
    }

    try {
      const target = upsertTarget(db, {
        entityType,
        entityId: entityId.trim(),
        period: period.trim(),
        periodType,
        revenueTarget: Number(revenueTarget),
        operationalCostTarget: Number(operationalCostTarget),
      });
      res.status(201).json(target);
    } catch {
      res.status(500).json({ error: 'Terjadi kesalahan server' });
    }
  });

  // DELETE /api/targets/:id — delete target
  router.delete('/:id', (req: Request, res: Response): void => {
    try {
      const result = deleteTarget(db, req.params.id);
      res.json(result);
    } catch (err) {
      if (err instanceof NotFoundError) {
        res.status(404).json({ error: err.message });
        return;
      }
      res.status(500).json({ error: 'Terjadi kesalahan server' });
    }
  });

  return router;
}

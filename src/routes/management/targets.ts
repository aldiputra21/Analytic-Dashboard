// Target Management Routes — MAFINDA Dashboard Enhancement
// Requirements: 7.3, 7.4, 7.8

import { Router, Request, Response } from 'express';
import {
  getTargets,
  upsertTarget,
  deleteTarget,
} from '../../services/mafinda/targetService.js';
import { NotFoundError } from '../../services/mafinda/departmentService.js';

export function createTargetRouter(): Router {
  const router = Router();

  // GET /api/targets — list targets with optional filters
  // Query params: departmentId, projectId, fiscalYear, fiscalMonth
  router.get('/', async (req: Request, res: Response): Promise<void> => {
    const { departmentId, projectId, fiscalYear, fiscalMonth } = req.query as Record<string, string>;

    try {
      const targets = await getTargets({
        departmentId,
        projectId,
        fiscalYear: fiscalYear ? Number(fiscalYear) : undefined,
        fiscalMonth: fiscalMonth ? Number(fiscalMonth) : undefined,
      });
      res.json(targets);
    } catch {
      res.status(500).json({ error: 'Terjadi kesalahan server' });
    }
  });

  // POST /api/targets — upsert target
  router.post('/', async (req: Request, res: Response): Promise<void> => {
    const { departmentId, projectId, fiscalYear, fiscalMonth, notes, details } = req.body ?? {};

    if (!departmentId?.trim()) {
      res.status(400).json({ error: 'Field "departmentId" wajib diisi' });
      return;
    }
    if (!fiscalYear || isNaN(Number(fiscalYear))) {
      res.status(400).json({ error: 'Field "fiscalYear" wajib diisi dan harus berupa angka' });
      return;
    }
    if (!fiscalMonth || isNaN(Number(fiscalMonth)) || Number(fiscalMonth) < 1 || Number(fiscalMonth) > 12) {
      res.status(400).json({ error: 'Field "fiscalMonth" wajib diisi (1-12)' });
      return;
    }
    if (!Array.isArray(details) || details.length === 0) {
      res.status(400).json({ error: 'Field "details" wajib berisi array minimal 1 item' });
      return;
    }

    const createdBy = (req as any).user?.username ?? 'system';

    try {
      const target = await upsertTarget({
        departmentId: departmentId.trim(),
        projectId: projectId?.trim() || undefined,
        fiscalYear: Number(fiscalYear),
        fiscalMonth: Number(fiscalMonth),
        notes,
        details: details.map((d: any) => ({
          targetType: d.targetType,
          costCenter: d.costCenter,
          amount: String(d.amount),
          notes: d.notes,
        })),
      }, createdBy);
      res.status(201).json(target);
    } catch {
      res.status(500).json({ error: 'Terjadi kesalahan server' });
    }
  });

  // DELETE /api/targets/:id — delete target
  router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
    try {
      const result = await deleteTarget(req.params.id);
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

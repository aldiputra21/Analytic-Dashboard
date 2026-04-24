// src/routes/management/cost-centers.ts
import { Router, Request, Response } from 'express';
import { requirePermission } from '../../middleware/rbac';
import {
  listCostCenters,
  getCostCenterById,
  createCostCenter,
  updateCostCenter,
  deleteCostCenter,
} from '../../services/mafinda/costCenterService';

export function createCostCenterRouter(): Router {
  const router = Router();

  router.get('/', requirePermission('cfd.cost_centers.read'), async (req: Request, res: Response) => {
    const { search, activeOnly, page, pageSize } = req.query as Record<string, string>;
    try {
      const result = await listCostCenters({ 
        search, 
        activeOnly: activeOnly === 'true',
        page: page ? parseInt(page) : 1,
        pageSize: pageSize ? Math.min(parseInt(pageSize), 100) : 10,
      });
      res.json(result);
    } catch (err: any) {
      console.error('[GET /cost-centers] Error:', err);
      res.status(500).json({ error: 'Terjadi kesalahan server' });
    }
  });

  router.post('/', requirePermission('cfd.cost_centers.write'), async (req: Request, res: Response) => {
    const { parentId, category, name, code, description, isActive } = req.body;
    if (!name || !code || !category) {
      return res.status(400).json({ error: 'Name, code, and category are required' });
    }
    const createdBy = req.user!.userId;
    try {
      const result = await createCostCenter(
        { parentId, category, name, code, description, isActive }, 
        createdBy,
        { ip: req.ip, userAgent: req.headers['user-agent'] }
      );
      res.status(201).json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  router.put('/:id', requirePermission('cfd.cost_centers.write'), async (req: Request, res: Response) => {
    const { parentId, category, name, code, description, isActive } = req.body;
    const updatedBy = req.user!.userId;
    try {
      const result = await updateCostCenter(
        req.params.id, 
        { parentId, category, name, code, description, isActive }, 
        updatedBy,
        { ip: req.ip, userAgent: req.headers['user-agent'] }
      );
      if (!result) return res.status(404).json({ error: 'Cost center not found' });
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  router.delete('/:id', requirePermission('cfd.cost_centers.delete'), async (req: Request, res: Response) => {
    const deletedBy = req.user!.userId;
    try {
      await deleteCostCenter(
        req.params.id, 
        deletedBy,
        { ip: req.ip, userAgent: req.headers['user-agent'] }
      );
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  return router;
}

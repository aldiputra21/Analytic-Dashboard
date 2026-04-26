// src/routes/management/cost-centers.ts
import { Router, Request, Response } from 'express';
import { requirePermission } from '../../middleware/rbac';
import { asyncHandler } from '../../utils/asyncHandler';
import {
  listCostCenters,
  getCostCenterById,
  getActiveCostCenters,
  createCostCenter,
  updateCostCenter,
  deleteCostCenter,
} from '../../services/mafinda/costCenterService';

export function createCostCenterRouter(): Router {
  const router = Router();

  router.get('/', requirePermission('cfd.cost_centers.read'), asyncHandler(async (req: Request, res: Response) => {
    const { search, activeOnly, page, pageSize } = req.query as Record<string, string>;
    const result = await listCostCenters({ 
      search, 
      activeOnly: activeOnly === 'true',
      page: page ? parseInt(page) : 1,
      pageSize: pageSize ? Math.min(parseInt(pageSize), 100) : 10,
    });
    res.json(result);
  }));

  router.get('/dropdown-items', requirePermission('cfd.cost_centers.read'), asyncHandler(async (req: Request, res: Response) => {
    const { parentId } = req.query as Record<string, string>;
    const result = await getActiveCostCenters(parentId === undefined ? undefined : (parentId === 'null' ? null : parentId));
    res.json(result);
  }));

  router.get('/:id', requirePermission('cfd.cost_centers.read'), asyncHandler(async (req: Request, res: Response) => {
    const result = await getCostCenterById(req.params.id);
    if (!result) {
      res.status(404).json({ error: 'Cost center not found' });
      return;
    }
    res.json(result);
  }));

  router.post('/', requirePermission('cfd.cost_centers.write'), asyncHandler(async (req: Request, res: Response) => {
    const { parentId, category, name, code, description, isActive } = req.body;
    if (!name || !code || !category) {
      res.status(400).json({ error: 'Name, code, and category are required' });
      return;
    }
    const createdBy = req.user!.userId;
    const result = await createCostCenter(
      { parentId, category, name, code, description, isActive }, 
      createdBy,
      { ip: req.ip, userAgent: req.headers['user-agent'] }
    );
    res.status(201).json(result);
  }));

  router.put('/:id', requirePermission('cfd.cost_centers.write'), asyncHandler(async (req: Request, res: Response) => {
    const { parentId, category, name, code, description, isActive } = req.body;
    const updatedBy = req.user!.userId;
    const result = await updateCostCenter(
      req.params.id, 
      { parentId, category, name, code, description, isActive }, 
      updatedBy,
      { ip: req.ip, userAgent: req.headers['user-agent'] }
    );
    if (!result) {
      res.status(404).json({ error: 'Cost center not found' });
      return;
    }
    res.json(result);
  }));

  router.delete('/:id', requirePermission('cfd.cost_centers.delete'), asyncHandler(async (req: Request, res: Response) => {
    const deletedBy = req.user!.userId;
    await deleteCostCenter(
      req.params.id, 
      deletedBy,
      { ip: req.ip, userAgent: req.headers['user-agent'] }
    );
    res.json({ success: true });
  }));

  return router;
}

// src/routes/management/cost-centers.ts
import { Router, Request, Response } from 'express';
import { requirePermission, injectAccessContext } from '../../middleware/rbac';
import { asyncHandler } from '../../utils/asyncHandler';
import {
  listCostCenters,
  getCostCenterById,
  getActiveCostCenters,
  createCostCenter,
  updateCostCenter,
  deleteCostCenter,
} from '../../services/mafinda/costCenterService';
import { AppError, ErrorCode } from '../../utils/errors';

export function createCostCenterRouter(): Router {
  const router = Router();

  router.get('/', requirePermission('cfd.cost_centers.read'), injectAccessContext, asyncHandler(async (req: Request, res: Response) => {
    const { search, activeOnly, page, pageSize } = req.query as Record<string, string>;
    const result = await listCostCenters({ 
      search, 
      activeOnly: activeOnly === 'true',
      page: page ? parseInt(page) : 1,
      pageSize: pageSize ? Math.min(parseInt(pageSize), 100) : 10,
    });
    res.json(result);
  }));

  router.get('/dropdown-items', requirePermission('cfd.cost_centers.read'), injectAccessContext, asyncHandler(async (req: Request, res: Response) => {
    const { parentId } = req.query as Record<string, string>;
    const result = await getActiveCostCenters(parentId === undefined ? undefined : (parentId === 'null' ? null : parentId));
    res.json(result);
  }));

  router.get('/:id', requirePermission('cfd.cost_centers.read'), injectAccessContext, asyncHandler(async (req: Request, res: Response) => {
    const result = await getCostCenterById(req.params.id);
    if (!result) {
      throw AppError.notFound(ErrorCode.COST_CENTER_NOT_FOUND, 'Cost center not found');
    }
    res.json(result);
  }));

  // Write operations restricted to System scope
  router.post('/', requirePermission('cfd.cost_centers.write'), injectAccessContext, asyncHandler(async (req: Request, res: Response) => {
    const access = req.accessContext!;
    if (access.scope !== 'system') {
      throw AppError.forbidden(ErrorCode.AUTH_FORBIDDEN, 'Hanya administrator sistem atau global yang dapat mengelola cost center');
    }

    const { parentId, category, name, code, description, isActive } = req.body;
    if (!name || !code || !category) {
      throw AppError.badRequest(ErrorCode.MISSING_REQUIRED_FIELD, 'Name, code, and category are required');
    }
    const createdBy = req.user!.userId;
    const result = await createCostCenter(
      { parentId, category, name, code, description, isActive }, 
      createdBy,
      { ip: req.ip, userAgent: req.headers['user-agent'] }
    );
    res.status(201).json(result);
  }));

  router.put('/:id', requirePermission('cfd.cost_centers.write'), injectAccessContext, asyncHandler(async (req: Request, res: Response) => {
    const access = req.accessContext!;
    if (access.scope !== 'system') {
      throw AppError.forbidden(ErrorCode.AUTH_FORBIDDEN, 'Hanya administrator sistem atau global yang dapat mengelola cost center');
    }

    const { parentId, category, name, code, description, isActive } = req.body;
    const updatedBy = req.user!.userId;
    const result = await updateCostCenter(
      req.params.id, 
      { parentId, category, name, code, description, isActive }, 
      updatedBy,
      { ip: req.ip, userAgent: req.headers['user-agent'] }
    );
    if (!result) {
      throw AppError.notFound(ErrorCode.COST_CENTER_NOT_FOUND, 'Cost center not found');
    }
    res.json(result);
  }));

  router.delete('/:id', requirePermission('cfd.cost_centers.delete'), injectAccessContext, asyncHandler(async (req: Request, res: Response) => {
    const access = req.accessContext!;
    if (access.scope !== 'system') {
      throw AppError.forbidden(ErrorCode.AUTH_FORBIDDEN, 'Hanya administrator sistem atau global yang dapat mengelola cost center');
    }

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

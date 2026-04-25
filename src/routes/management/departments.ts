// Department Management Routes — MAFINDA Dashboard Enhancement
// Requirements: 7.1, 7.6, 7.9

import { Router, Request, Response } from 'express';
import { requirePermission } from '../../middleware/rbac';
import { asyncHandler } from '../../utils/asyncHandler';
import {
  getAllDepartments,
  getActiveDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  ConflictError,
  NotFoundError,
} from '../../services/mafinda/departmentService.js';

export function createDepartmentRouter(): Router {
  const router = Router();

  // GET /api/departments/dropdown-items — list all active departments for dropdowns (no pagination)
  router.get('/dropdown-items', requirePermission('public.departments.read'), asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    const results = await getActiveDepartments();
    res.json(results);
  }));

  // GET /api/departments?corporateId=xxx — list departments for a corporate
  router.get('/', requirePermission('public.departments.read'), asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { corporateId, search, page, pageSize } = req.query as Record<string, string>;
    const userRole = req.user?.role;
    
    if (userRole !== 'owner' && !corporateId) {
      res.status(400).json({ error: 'Query parameter "corporateId" wajib diisi untuk non-owner role' });
      return;
    }

    // For owner role, if corporateId is missing, we might want to return all or handle it.
    // The service requires corporateId. Let's ensure it's handled.
    if (!corporateId && userRole === 'owner') {
      // In FRSApp/CorporateManager pattern, the UI always sends corporateId from context.
      // If missing here, it's an error for this specific list function.
      res.status(400).json({ error: 'Query parameter "corporateId" wajib diisi' });
      return;
    }

    const result = await getAllDepartments({
      corporateId,
      search,
      page: page ? parseInt(page) : 1,
      pageSize: pageSize ? Math.min(parseInt(pageSize), 100) : 10,
    });
    res.json(result);
  }));

  // POST /api/departments — create new department
  router.post('/', requirePermission('public.departments.write'), asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { corporateId, name, code, description, headName } = req.body ?? {};

    if (!corporateId?.trim()) {
      res.status(400).json({ error: 'Field "corporateId" wajib diisi' });
      return;
    }
    if (!name?.trim()) {
      res.status(400).json({ error: 'Field "name" wajib diisi' });
      return;
    }
    if (!code?.trim()) {
      res.status(400).json({ error: 'Field "code" wajib diisi' });
      return;
    }

    const createdBy = req.user!.userId;

    try {
      const dept = await createDepartment(
        { corporateId: corporateId.trim(), name: name.trim(), code: code.trim(), description, headName },
        createdBy,
        { ip: req.ip, userAgent: req.headers['user-agent'] }
      );
      res.status(201).json(dept);
    } catch (err) {
      if (err instanceof ConflictError) {
        res.status(409).json({ error: err.message });
        return;
      }
      throw err; // Re-throw to be caught by asyncHandler
    }
  }));

  // PUT /api/departments/:id — update department
  router.put('/:id', requirePermission('public.departments.write'), asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { name, code, description, headName, isActive } = req.body ?? {};

    if (name !== undefined && !name?.trim()) {
      res.status(400).json({ error: 'Field "name" tidak boleh kosong' });
      return;
    }

    const updatedBy = req.user!.userId;

    try {
      const dept = await updateDepartment(
        req.params.id, 
        {
          name: name?.trim(),
          code: code?.trim(),
          description,
          headName,
          isActive,
        }, 
        updatedBy,
        { ip: req.ip, userAgent: req.headers['user-agent'] }
      );
      res.json(dept);
    } catch (err) {
      if (err instanceof NotFoundError) {
        res.status(404).json({ error: err.message });
        return;
      }
      if (err instanceof ConflictError) {
        res.status(409).json({ error: err.message });
        return;
      }
      throw err; // Re-throw to be caught by asyncHandler
    }
  }));

  // DELETE /api/departments/:id — delete department
  router.delete('/:id', requirePermission('public.departments.delete'), asyncHandler(async (req, res) => {
    const deletedBy = req.user!.userId;
    try {
      const result = await deleteDepartment(
        req.params.id, 
        deletedBy,
        { ip: req.ip, userAgent: req.headers['user-agent'] }
      );
      res.json(result);
    } catch (err) {
      if (err instanceof NotFoundError) {
        res.status(404).json({ error: err.message });
        return;
      }
      throw err; // Re-throw to be caught by asyncHandler
    }
  }));

  return router;
}

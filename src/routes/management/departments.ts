// Department Management Routes — MAFINDA Dashboard Enhancement
// Requirements: 7.1, 7.6, 7.9

import { Router, Request, Response } from 'express';
import { requirePermission, injectAccessContext } from '../../middleware/rbac';
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
} from '../../services/mafinda/departmentService';

export function createDepartmentRouter(): Router {
  const router = Router();

  // GET /api/departments/dropdown-items — list all active departments for dropdowns (no pagination)
  router.get(
    '/dropdown-items', 
    requirePermission('public.departments.read'), 
    injectAccessContext,
    asyncHandler(async (req: Request, res: Response) => {
      const access = req.accessContext!;
      const results = await getActiveDepartments(access.scope !== 'system' ? access.corporateIds : undefined);
      res.json(results);
    })
  );

  // GET /api/departments?corporateId=xxx — list departments (optionally filtered by corporate)
  router.get(
    '/', 
    requirePermission('public.departments.read'), 
    injectAccessContext,
    asyncHandler(async (req: Request, res: Response) => {
      const { corporateId, search, page, pageSize } = req.query as Record<string, string>;
      const access = req.accessContext!;

      // If user is restricted to corporate scope, ensure they only search within their corporates
      const subsidiaryIds = access.scope !== 'system' ? access.corporateIds : undefined;
      
      // If corporateId is provided, validate it against access
      if (corporateId && access.scope !== 'system' && !access.corporateIds.includes(corporateId)) {
        res.status(403).json({ error: 'Access denied to this corporate' });
        return;
      }

      const result = await getAllDepartments({
        corporateId: corporateId || undefined,
        search,
        page: page ? parseInt(page) : 1,
        pageSize: pageSize ? Math.min(parseInt(pageSize), 100) : 10,
        subsidiaryIds,
      });
      res.json(result);
    })
  );

  // POST /api/departments — create new department
  router.post(
    '/', 
    requirePermission('public.departments.write'), 
    injectAccessContext,
    asyncHandler(async (req: Request, res: Response) => {
      const { corporateId, name, code, description, headName } = req.body ?? {};

      if (!corporateId?.trim()) {
        res.status(400).json({ error: 'Field "corporateId" wajib diisi' });
        return;
      }

      // Context Validation
      const access = req.accessContext!;
      if (access.scope !== 'system' && !access.corporateIds.includes(corporateId.trim())) {
        return res.status(403).json({ error: 'Access denied to this corporate' });
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
    })
  );

  // PUT /api/departments/:id — update department
  router.put(
    '/:id', 
    requirePermission('public.departments.write'), 
    injectAccessContext,
    asyncHandler(async (req: Request, res: Response) => {
      const { name, code, description, headName, isActive } = req.body ?? {};

      if (name !== undefined && !name?.trim()) {
        res.status(400).json({ error: 'Field "name" tidak boleh kosong' });
        return;
      }

      const updatedBy = req.user!.userId;

      try {
        // Context Validation
        const access = req.accessContext!;
        if (access.scope !== 'system') {
          const existing = await getDepartmentById(req.params.id);
          if (!existing) {
            res.status(404).json({ error: 'Department not found' });
            return;
          }
          if (!access.corporateIds.includes(existing.corporateId)) {
            res.status(403).json({ error: 'Access denied to this corporate' });
            return;
          }
        }

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
    })
  );

  // DELETE /api/departments/:id — delete department
  router.delete(
    '/:id', 
    requirePermission('public.departments.delete'), 
    injectAccessContext,
    asyncHandler(async (req, res) => {
      const deletedBy = req.user!.userId;
      try {
        // Context Validation
        const access = req.accessContext!;
        if (access.scope !== 'system') {
          const existing = await getDepartmentById(req.params.id);
          if (!existing) {
            return res.status(404).json({ error: 'Department not found' });
          }
          if (!access.corporateIds.includes(existing.corporateId)) {
            return res.status(403).json({ error: 'Access denied to this corporate' });
          }
        }

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
    })
  );

  return router;
}

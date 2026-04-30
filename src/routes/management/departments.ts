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
} from '../../services/mafinda/departmentService';
import { AppError, ErrorCode } from '../../utils/errors';

export function createDepartmentRouter(): Router {
  const router = Router();

  // GET /api/departments/dropdown-items — list all active departments for dropdowns (no pagination)
  router.get(
    '/dropdown-items', 
    requirePermission('public.departments.read', 'cfd.dashboard.read'), 
    injectAccessContext,
    asyncHandler(async (req: Request, res: Response) => {
      const access = req.accessContext!;
      const results = await getActiveDepartments(access.hasFullCorporateAccess ? undefined : access.corporateIds);
      res.json(results);
    })
  );

  // GET /api/departments?corporateId=xxx — list departments (optionally filtered by corporate)
  router.get(
    '/', 
    requirePermission('public.departments.read', 'cfd.dashboard.read'), 
    injectAccessContext,
    asyncHandler(async (req: Request, res: Response) => {
      const { corporateId, search, page, pageSize } = req.query as Record<string, string>;
      const access = req.accessContext!;

      // If user is restricted to corporate scope, ensure they only search within their corporates
      const subsidiaryIds = access.scope !== 'system' ? access.corporateIds : undefined;
      
      // If corporateId is provided, validate it against access
      if (corporateId && access.scope !== 'system' && !access.corporateIds.includes(corporateId)) {
        throw AppError.forbidden(ErrorCode.CORPORATE_ACCESS_DENIED, 'Access denied to this corporate');
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
        throw AppError.badRequest(ErrorCode.MISSING_REQUIRED_FIELD, 'Field "corporateId" wajib diisi');
      }

      // Context Validation
      const access = req.accessContext!;
      if (access.scope !== 'system' && !access.corporateIds.includes(corporateId.trim())) {
        throw AppError.forbidden(ErrorCode.CORPORATE_ACCESS_DENIED, 'Access denied to this corporate');
      }

      if (!name?.trim()) {
        throw AppError.badRequest(ErrorCode.MISSING_REQUIRED_FIELD, 'Field "name" wajib diisi');
      }
      if (!code?.trim()) {
        throw AppError.badRequest(ErrorCode.MISSING_REQUIRED_FIELD, 'Field "code" wajib diisi');
      }

      const createdBy = req.user!.userId;

      const dept = await createDepartment(
        { corporateId: corporateId.trim(), name: name.trim(), code: code.trim(), description, headName },
        createdBy,
        { ip: req.ip, userAgent: req.headers['user-agent'] }
      );
      res.status(201).json(dept);
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
        throw AppError.badRequest(ErrorCode.MISSING_REQUIRED_FIELD, 'Field "name" tidak boleh kosong');
      }

      const updatedBy = req.user!.userId;

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
    })
  );

  // DELETE /api/departments/:id — delete department
  router.delete(
    '/:id', 
    requirePermission('public.departments.delete'), 
    injectAccessContext,
    asyncHandler(async (req, res) => {
      const deletedBy = req.user!.userId;
      const result = await deleteDepartment(
        req.params.id, 
        deletedBy,
        { ip: req.ip, userAgent: req.headers['user-agent'] }
      );
      res.json(result);
    })
  );

  return router;
}

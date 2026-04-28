// Project Management Routes — MAFINDA Dashboard Enhancement
// Requirements: 7.2, 7.7, 7.10

import { Router, Request, Response } from 'express';
import { requirePermission, requireSubsidiaryAccess, injectAccessContext } from '../../middleware/rbac';
import { asyncHandler } from '../../utils/asyncHandler';
import {
  getProjectsByDepartment,
  getAllProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  getActiveProjects,
  Project,
} from '../../services/mafinda/projectService';
import { AppError, ErrorCode } from '../../utils/errors';
import { getUserSubsidiaryIds } from '../../services/financial/permissionService';
import { db } from '../../db/connection';
import { projects } from '../../db/schema/public';
import { departments } from '../../db/schema/public';
import { asc, eq } from 'drizzle-orm';

export function createProjectRouter(): Router {
  const router = Router();

  // GET /api/projects — list projects
  router.get('/', requirePermission('public.projects.read'), requireSubsidiaryAccess(), asyncHandler(async (req: Request, res: Response) => {
    const { corporateId, departmentId, search, page, pageSize } = req.query as Record<string, string>;
    const access = req.accessContext!;

    const result = await getAllProjects({
      corporateId,
      departmentId,
      search,
      page: page ? parseInt(page) : 1,
      pageSize: pageSize ? Math.min(parseInt(pageSize), 100) : 100,
      subsidiaryIds: access.corporateIds,
      allowedDepartmentIds: access.departmentIds,
    });
    res.json(result);
  }));

  // GET /api/projects/dropdown-items — list all active projects for dropdowns
  router.get('/dropdown-items', requirePermission('public.projects.read'), injectAccessContext, asyncHandler(async (req: Request, res: Response) => {
    const { corporateId } = req.query as Record<string, string>;
    const access = req.accessContext!;
    const result = await getActiveProjects(corporateId, access.scope !== 'system' ? access.corporateIds : undefined);
    res.json(result);
  }));

  // POST /api/projects — create new project
  router.post('/', requirePermission('public.projects.write'), asyncHandler(async (req: Request, res: Response) => {
    const { departmentId, code, name, description, startDate, endDate } = req.body ?? {};

    if (!departmentId?.trim()) {
      throw AppError.badRequest(ErrorCode.MISSING_REQUIRED_FIELD, 'Field "departmentId" wajib diisi');
    }
    if (!name?.trim()) {
      throw AppError.badRequest(ErrorCode.MISSING_REQUIRED_FIELD, 'Field "name" wajib diisi');
    }
    if (!code?.trim()) {
      throw AppError.badRequest(ErrorCode.MISSING_REQUIRED_FIELD, 'Field "code" wajib diisi');
    }

    const userId = req.user!.userId;
    const context = { ip: req.ip, userAgent: req.headers['user-agent'] };

    const project = await createProject({
      departmentId: departmentId.trim(),
      code: code.trim(),
      name: name.trim(),
      description,
      startDate,
      endDate,
    }, userId, context);
    res.status(201).json(project);
  }));

  // PUT /api/projects/:id — update project
  router.put('/:id', requirePermission('public.projects.write'), asyncHandler(async (req: Request, res: Response) => {
    const { name, code, description, startDate, endDate, isActive, status } = req.body ?? {};

    if (name !== undefined && !name?.trim()) {
      throw AppError.badRequest(ErrorCode.MISSING_REQUIRED_FIELD, 'Field "name" tidak boleh kosong');
    }

    const userId = req.user!.userId;
    const context = { ip: req.ip, userAgent: req.headers['user-agent'] };

    const project = await updateProject(req.params.id, {
      name: name?.trim(),
      code: code?.trim(),
      description,
      startDate,
      endDate,
      isActive,
      status,
    }, userId, context);
    res.json(project);
  }));

  // DELETE /api/projects/:id — delete project
  router.delete('/:id', requirePermission('public.projects.delete'), asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const context = { ip: req.ip, userAgent: req.headers['user-agent'] };
    const result = await deleteProject(req.params.id, userId, context);
    res.json(result);
  }));

  return router;
}

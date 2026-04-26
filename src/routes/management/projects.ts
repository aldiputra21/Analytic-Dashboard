// Project Management Routes — MAFINDA Dashboard Enhancement
// Requirements: 7.2, 7.7, 7.10

import { Router, Request, Response } from 'express';
import { requirePermission, requireSubsidiaryAccess } from '../../middleware/rbac';
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
} from '../../services/mafinda/projectService.js';
import { getUserSubsidiaryIds } from '../../services/financial/permissionService';
import { ConflictError, NotFoundError } from '../../services/mafinda/departmentService.js';
import { db } from '../../db/connection.js';
import { projects } from '../../db/schema/public.js';
import { departments } from '../../db/schema/public.js';
import { asc, eq } from 'drizzle-orm';

export function createProjectRouter(): Router {
  const router = Router();

  // GET /api/projects — list projects
  router.get('/', requirePermission('public.projects.read'), requireSubsidiaryAccess(), asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { corporateId, departmentId, search, page, pageSize } = req.query as Record<string, string>;

    const result = await getAllProjects({
      corporateId,
      departmentId,
      search,
      page: page ? parseInt(page) : 1,
      pageSize: pageSize ? Math.min(parseInt(pageSize), 100) : 100, // Changed default to 100 for dropdowns
    });
    res.json(result);
  }));

  // GET /api/projects/dropdown-items — list all active projects for dropdowns
  router.get('/dropdown-items', requirePermission('public.projects.read'), asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { corporateId } = req.query as Record<string, string>;
    const subsidiaryIds = await getUserSubsidiaryIds(req.user!.userId);
    const result = await getActiveProjects(corporateId, subsidiaryIds);
    res.json(result);
  }));

  // POST /api/projects — create new project
  router.post('/', requirePermission('public.projects.write'), asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { departmentId, code, name, description, startDate, endDate } = req.body ?? {};

    if (!departmentId?.trim()) {
      res.status(400).json({ error: 'Field "departmentId" wajib diisi' });
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

    const userId = req.user!.userId;
    const context = { ip: req.ip, userAgent: req.headers['user-agent'] };

    try {
      const project = await createProject({
        departmentId: departmentId.trim(),
        code: code.trim(),
        name: name.trim(),
        description,
        startDate,
        endDate,
      }, userId, context);
      res.status(201).json(project);
    } catch (err) {
      if (err instanceof NotFoundError) {
        res.status(404).json({ error: err.message });
        return;
      }
      if (err instanceof ConflictError) {
        res.status(409).json({ error: err.message });
        return;
      }
      throw err;
    }
  }));

  // PUT /api/projects/:id — update project
  router.put('/:id', requirePermission('public.projects.write'), asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { name, code, description, startDate, endDate, isActive, status } = req.body ?? {};

    if (name !== undefined && !name?.trim()) {
      res.status(400).json({ error: 'Field "name" tidak boleh kosong' });
      return;
    }

    const userId = req.user!.userId;
    const context = { ip: req.ip, userAgent: req.headers['user-agent'] };

    try {
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
    } catch (err) {
      if (err instanceof NotFoundError) {
        res.status(404).json({ error: err.message });
        return;
      }
      if (err instanceof ConflictError) {
        res.status(409).json({ error: err.message });
        return;
      }
      throw err;
    }
  }));

  // DELETE /api/projects/:id — delete project
  router.delete('/:id', requirePermission('public.projects.delete'), asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.userId;
    const context = { ip: req.ip, userAgent: req.headers['user-agent'] };
    try {
      const result = await deleteProject(req.params.id, userId, context);
      res.json(result);
    } catch (err) {
      if (err instanceof NotFoundError) {
        res.status(404).json({ error: err.message });
        return;
      }
      throw err;
    }
  }));

  return router;
}

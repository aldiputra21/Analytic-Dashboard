// Project Management Routes — MAFINDA Dashboard Enhancement
// Requirements: 7.2, 7.7, 7.10

import { Router, Request, Response } from 'express';
import {
  getProjectsByDepartment,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  Project,
} from '../../services/mafinda/projectService.js';
import { ConflictError, NotFoundError } from '../../services/mafinda/departmentService.js';
import { db } from '../../db/connection.js';
import { projects } from '../../db/schema/public.js';
import { departments } from '../../db/schema/public.js';
import { asc, eq } from 'drizzle-orm';

export function createProjectRouter(): Router {
  const router = Router();

  // GET /api/projects — list projects, optionally filtered by departmentId
  router.get('/', async (req: Request, res: Response): Promise<void> => {
    const { departmentId } = req.query as Record<string, string>;

    try {
      let result: Project[];
      if (departmentId) {
        result = await getProjectsByDepartment(departmentId);
      } else {
        // Return all projects across all departments
        const rows = await db.select({
          id: projects.id,
          departmentId: projects.departmentId,
          departmentName: departments.name,
          code: projects.code,
          name: projects.name,
          description: projects.description,
          sourceType: projects.sourceType,
          sourceId: projects.sourceId,
          status: projects.status,
          startDate: projects.startDate,
          endDate: projects.endDate,
          isActive: projects.isActive,
          createdBy: projects.createdBy,
          createdAt: projects.createdAt,
          updatedBy: projects.updatedBy,
          updatedAt: projects.updatedAt,
        })
          .from(projects)
          .leftJoin(departments, eq(departments.id, projects.departmentId))
          .orderBy(asc(projects.name));

        result = rows.map((row) => ({
          id: row.id,
          departmentId: row.departmentId,
          departmentName: row.departmentName ?? undefined,
          code: row.code,
          name: row.name,
          description: row.description ?? undefined,
          sourceType: row.sourceType ?? undefined,
          sourceId: row.sourceId ?? undefined,
          status: row.status ?? undefined,
          startDate: row.startDate?.toISOString().slice(0, 10),
          endDate: row.endDate?.toISOString().slice(0, 10),
          isActive: row.isActive ?? true,
          createdBy: row.createdBy,
          createdAt: row.createdAt.toISOString(),
          updatedBy: row.updatedBy ?? undefined,
          updatedAt: row.updatedAt?.toISOString(),
        }));
      }
      res.json(result);
    } catch {
      res.status(500).json({ error: 'Terjadi kesalahan server' });
    }
  });

  // POST /api/projects — create new project
  router.post('/', async (req: Request, res: Response): Promise<void> => {
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

    const createdBy = (req as any).user?.username ?? 'system';

    try {
      const project = await createProject({
        departmentId: departmentId.trim(),
        code: code.trim(),
        name: name.trim(),
        description,
        startDate,
        endDate,
      }, createdBy);
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
      res.status(500).json({ error: 'Terjadi kesalahan server' });
    }
  });

  // PUT /api/projects/:id — update project
  router.put('/:id', async (req: Request, res: Response): Promise<void> => {
    const { name, code, description, startDate, endDate, isActive, status } = req.body ?? {};

    if (name !== undefined && !name?.trim()) {
      res.status(400).json({ error: 'Field "name" tidak boleh kosong' });
      return;
    }

    const updatedBy = (req as any).user?.username ?? 'system';

    try {
      const project = await updateProject(req.params.id, {
        name: name?.trim(),
        code: code?.trim(),
        description,
        startDate,
        endDate,
        isActive,
        status,
      }, updatedBy);
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
      res.status(500).json({ error: 'Terjadi kesalahan server' });
    }
  });

  // DELETE /api/projects/:id — delete project
  router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
    try {
      const result = await deleteProject(req.params.id);
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

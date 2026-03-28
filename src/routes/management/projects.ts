// Project Management Routes — MAFINDA Dashboard Enhancement
// Requirements: 7.2, 7.7, 7.10

import { Router, Request, Response } from 'express';
import Database from 'better-sqlite3';
import {
  getProjectsByDepartment,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  Project,
} from '../../services/mafinda/projectService.js';
import { ConflictError, NotFoundError } from '../../services/mafinda/departmentService.js';

export function createProjectRouter(db: Database.Database): Router {
  const router = Router();

  // GET /api/projects — list projects, optionally filtered by departmentId
  router.get('/', (req: Request, res: Response): void => {
    const { departmentId } = req.query as Record<string, string>;

    try {
      let projects: Project[];
      if (departmentId) {
        projects = getProjectsByDepartment(db, departmentId);
      } else {
        // Return all projects across all departments
        const rows = db.prepare(`
          SELECT p.*, d.name AS department_name
          FROM mafinda_projects p
          LEFT JOIN mafinda_departments d ON d.id = p.department_id
          ORDER BY p.name ASC
        `).all() as any[];
        projects = rows.map((row) => ({
          id: row.id,
          departmentId: row.department_id,
          departmentName: row.department_name ?? undefined,
          name: row.name,
          description: row.description ?? undefined,
          startDate: row.start_date ?? undefined,
          endDate: row.end_date ?? undefined,
          isActive: Boolean(row.is_active),
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        }));
      }
      res.json(projects);
    } catch {
      res.status(500).json({ error: 'Terjadi kesalahan server' });
    }
  });

  // POST /api/projects — create new project
  router.post('/', (req: Request, res: Response): void => {
    const { departmentId, name, description, startDate, endDate } = req.body ?? {};

    if (!departmentId?.trim()) {
      res.status(400).json({ error: 'Field "departmentId" wajib diisi' });
      return;
    }
    if (!name?.trim()) {
      res.status(400).json({ error: 'Field "name" wajib diisi' });
      return;
    }

    try {
      const project = createProject(db, {
        departmentId: departmentId.trim(),
        name: name.trim(),
        description,
        startDate,
        endDate,
      });
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
  router.put('/:id', (req: Request, res: Response): void => {
    const { name, description, startDate, endDate, isActive } = req.body ?? {};

    if (name !== undefined && !name?.trim()) {
      res.status(400).json({ error: 'Field "name" tidak boleh kosong' });
      return;
    }

    try {
      const project = updateProject(db, req.params.id, {
        name: name?.trim(),
        description,
        startDate,
        endDate,
        isActive,
      });
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
  router.delete('/:id', (req: Request, res: Response): void => {
    try {
      const result = deleteProject(db, req.params.id);
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

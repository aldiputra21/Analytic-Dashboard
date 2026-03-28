// Department Management Routes — MAFINDA Dashboard Enhancement
// Requirements: 7.1, 7.6, 7.9

import { Router, Request, Response } from 'express';
import Database from 'better-sqlite3';
import {
  getAllDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  ConflictError,
  NotFoundError,
} from '../../services/mafinda/departmentService.js';

export function createDepartmentRouter(db: Database.Database): Router {
  const router = Router();

  // GET /api/departments — list all departments
  router.get('/', (_req: Request, res: Response): void => {
    try {
      const departments = getAllDepartments(db);
      res.json(departments);
    } catch {
      res.status(500).json({ error: 'Terjadi kesalahan server' });
    }
  });

  // POST /api/departments — create new department
  router.post('/', (req: Request, res: Response): void => {
    const { name, description } = req.body ?? {};

    if (!name?.trim()) {
      res.status(400).json({ error: 'Field "name" wajib diisi' });
      return;
    }

    try {
      const dept = createDepartment(db, { name: name.trim(), description });
      res.status(201).json(dept);
    } catch (err) {
      if (err instanceof ConflictError) {
        res.status(409).json({ error: err.message });
        return;
      }
      res.status(500).json({ error: 'Terjadi kesalahan server' });
    }
  });

  // PUT /api/departments/:id — update department
  router.put('/:id', (req: Request, res: Response): void => {
    const { name, description, isActive } = req.body ?? {};

    if (name !== undefined && !name?.trim()) {
      res.status(400).json({ error: 'Field "name" tidak boleh kosong' });
      return;
    }

    try {
      const dept = updateDepartment(db, req.params.id, {
        name: name?.trim(),
        description,
        isActive,
      });
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
      res.status(500).json({ error: 'Terjadi kesalahan server' });
    }
  });

  // DELETE /api/departments/:id — delete department
  router.delete('/:id', (req: Request, res: Response): void => {
    try {
      const result = deleteDepartment(db, req.params.id);
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

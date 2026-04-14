// Department Management Routes — MAFINDA Dashboard Enhancement
// Requirements: 7.1, 7.6, 7.9

import { Router, Request, Response } from 'express';
import {
  getAllDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  ConflictError,
  NotFoundError,
} from '../../services/mafinda/departmentService.js';

export function createDepartmentRouter(): Router {
  const router = Router();

  // GET /api/departments?corporateId=xxx — list departments for a corporate
  router.get('/', async (req: Request, res: Response): Promise<void> => {
    const { corporateId } = req.query as Record<string, string>;
    if (!corporateId) {
      res.status(400).json({ error: 'Query parameter "corporateId" wajib diisi' });
      return;
    }
    try {
      const departments = await getAllDepartments(corporateId);
      res.json(departments);
    } catch {
      res.status(500).json({ error: 'Terjadi kesalahan server' });
    }
  });

  // POST /api/departments — create new department
  router.post('/', async (req: Request, res: Response): Promise<void> => {
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

    const createdBy = (req as any).user?.username ?? 'system';

    try {
      const dept = await createDepartment(
        { corporateId: corporateId.trim(), name: name.trim(), code: code.trim(), description, headName },
        createdBy,
      );
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
  router.put('/:id', async (req: Request, res: Response): Promise<void> => {
    const { name, code, description, headName, isActive } = req.body ?? {};

    if (name !== undefined && !name?.trim()) {
      res.status(400).json({ error: 'Field "name" tidak boleh kosong' });
      return;
    }

    const updatedBy = (req as any).user?.username ?? 'system';

    try {
      const dept = await updateDepartment(req.params.id, {
        name: name?.trim(),
        code: code?.trim(),
        description,
        headName,
        isActive,
      }, updatedBy);
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
  router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
    try {
      const result = await deleteDepartment(req.params.id);
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

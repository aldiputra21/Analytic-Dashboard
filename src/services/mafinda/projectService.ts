// Project Service — MAFINDA Dashboard Enhancement
// Requirements: 7.2, 7.10

import Database from 'better-sqlite3';
import { ConflictError, NotFoundError } from './departmentService';

export interface Project {
  id: string;
  departmentId: string;
  departmentName?: string;
  name: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

function generateId(): string {
  return `proj_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function mapRow(row: any): Project {
  return {
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
  };
}

/** Returns all projects for a given department, optionally filtered to active only. */
export function getProjectsByDepartment(
  db: Database.Database,
  departmentId: string,
  activeOnly = false
): Project[] {
  const sql = activeOnly
    ? `SELECT p.*, d.name AS department_name
       FROM mafinda_projects p
       LEFT JOIN mafinda_departments d ON d.id = p.department_id
       WHERE p.department_id = ? AND p.is_active = 1
       ORDER BY p.name ASC`
    : `SELECT p.*, d.name AS department_name
       FROM mafinda_projects p
       LEFT JOIN mafinda_departments d ON d.id = p.department_id
       WHERE p.department_id = ?
       ORDER BY p.name ASC`;

  const rows = db.prepare(sql).all(departmentId) as any[];
  return rows.map(mapRow);
}

/** Returns a single project by id, or null if not found. */
export function getProjectById(db: Database.Database, id: string): Project | null {
  const row = db.prepare(`
    SELECT p.*, d.name AS department_name
    FROM mafinda_projects p
    LEFT JOIN mafinda_departments d ON d.id = p.department_id
    WHERE p.id = ?
  `).get(id) as any;
  return row ? mapRow(row) : null;
}

/**
 * Creates a new project.
 * Throws ConflictError (409) if a project with the same name already exists in the same department.
 * Requirements: 7.2, 7.10
 */
export function createProject(
  db: Database.Database,
  data: {
    departmentId: string;
    name: string;
    description?: string;
    startDate?: string;
    endDate?: string;
  }
): Project {
  const dept = db
    .prepare('SELECT id FROM mafinda_departments WHERE id = ?')
    .get(data.departmentId) as any;
  if (!dept) throw new NotFoundError('Departemen tidak ditemukan');

  const conflict = db
    .prepare('SELECT id FROM mafinda_projects WHERE department_id = ? AND name = ?')
    .get(data.departmentId, data.name) as any;
  if (conflict) {
    throw new ConflictError(
      `Nama proyek "${data.name}" sudah ada dalam departemen ini`
    );
  }

  const id = generateId();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO mafinda_projects (id, department_id, name, description, start_date, end_date, is_active, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)
  `).run(
    id,
    data.departmentId,
    data.name,
    data.description ?? null,
    data.startDate ?? null,
    data.endDate ?? null,
    now,
    now
  );

  return getProjectById(db, id)!;
}

/**
 * Updates an existing project.
 * Throws NotFoundError (404) if not found.
 * Throws ConflictError (409) if the new name conflicts within the same department.
 * Requirements: 7.2
 */
export function updateProject(
  db: Database.Database,
  id: string,
  data: {
    name?: string;
    description?: string;
    startDate?: string;
    endDate?: string;
    isActive?: boolean;
  }
): Project {
  const existing = db.prepare('SELECT * FROM mafinda_projects WHERE id = ?').get(id) as any;
  if (!existing) throw new NotFoundError('Proyek tidak ditemukan');

  if (data.name && data.name !== existing.name) {
    const conflict = db
      .prepare('SELECT id FROM mafinda_projects WHERE department_id = ? AND name = ? AND id != ?')
      .get(existing.department_id, data.name, id) as any;
    if (conflict) {
      throw new ConflictError(`Nama proyek "${data.name}" sudah ada dalam departemen ini`);
    }
  }

  const name = data.name ?? existing.name;
  const description = data.description !== undefined ? data.description : existing.description;
  const startDate = data.startDate !== undefined ? data.startDate : existing.start_date;
  const endDate = data.endDate !== undefined ? data.endDate : existing.end_date;
  const isActive = data.isActive !== undefined ? (data.isActive ? 1 : 0) : existing.is_active;
  const now = new Date().toISOString();

  db.prepare(`
    UPDATE mafinda_projects
    SET name = ?, description = ?, start_date = ?, end_date = ?, is_active = ?, updated_at = ?
    WHERE id = ?
  `).run(name, description, startDate, endDate, isActive, now, id);

  return getProjectById(db, id)!;
}

/**
 * Deletes a project by id.
 * Throws NotFoundError (404) if not found.
 * Requirements: 7.2
 */
export function deleteProject(
  db: Database.Database,
  id: string
): { success: boolean } {
  const existing = db.prepare('SELECT id FROM mafinda_projects WHERE id = ?').get(id) as any;
  if (!existing) throw new NotFoundError('Proyek tidak ditemukan');

  db.prepare('DELETE FROM mafinda_projects WHERE id = ?').run(id);
  return { success: true };
}

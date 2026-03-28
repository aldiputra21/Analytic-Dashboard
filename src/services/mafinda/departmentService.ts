// Department Service — MAFINDA Dashboard Enhancement
// Requirements: 7.1, 7.5, 7.9

import Database from 'better-sqlite3';

export interface Department {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ActiveProject {
  id: string;
  name: string;
  departmentId: string;
}

export class ConflictError extends Error {
  statusCode = 409;
  constructor(message: string) {
    super(message);
    this.name = 'ConflictError';
  }
}

export class NotFoundError extends Error {
  statusCode = 404;
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

function generateId(): string {
  return `dept_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function mapRow(row: any): Department {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? undefined,
    isActive: Boolean(row.is_active),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** Returns all departments ordered by name. */
export function getAllDepartments(db: Database.Database): Department[] {
  const rows = db.prepare('SELECT * FROM mafinda_departments ORDER BY name ASC').all() as any[];
  return rows.map(mapRow);
}

/** Returns a single department by id, or null if not found. */
export function getDepartmentById(db: Database.Database, id: string): Department | null {
  const row = db.prepare('SELECT * FROM mafinda_departments WHERE id = ?').get(id) as any;
  return row ? mapRow(row) : null;
}

/**
 * Creates a new department.
 * Throws ConflictError (409) if a department with the same name already exists.
 * Requirements: 7.1, 7.9
 */
export function createDepartment(
  db: Database.Database,
  data: { name: string; description?: string }
): Department {
  const existing = db
    .prepare('SELECT id FROM mafinda_departments WHERE name = ?')
    .get(data.name) as any;

  if (existing) {
    throw new ConflictError(`Nama departemen "${data.name}" sudah digunakan`);
  }

  const id = generateId();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO mafinda_departments (id, name, description, is_active, created_at, updated_at)
    VALUES (?, ?, ?, 1, ?, ?)
  `).run(id, data.name, data.description ?? null, now, now);

  return mapRow(db.prepare('SELECT * FROM mafinda_departments WHERE id = ?').get(id));
}

/**
 * Updates an existing department.
 * Throws NotFoundError (404) if not found.
 * Throws ConflictError (409) if the new name conflicts with another department.
 * Requirements: 7.1
 */
export function updateDepartment(
  db: Database.Database,
  id: string,
  data: { name?: string; description?: string; isActive?: boolean }
): Department {
  const existing = db.prepare('SELECT * FROM mafinda_departments WHERE id = ?').get(id) as any;
  if (!existing) throw new NotFoundError('Departemen tidak ditemukan');

  if (data.name && data.name !== existing.name) {
    const conflict = db
      .prepare('SELECT id FROM mafinda_departments WHERE name = ? AND id != ?')
      .get(data.name, id) as any;
    if (conflict) throw new ConflictError(`Nama departemen "${data.name}" sudah digunakan`);
  }

  const name = data.name ?? existing.name;
  const description = data.description !== undefined ? data.description : existing.description;
  const isActive = data.isActive !== undefined ? (data.isActive ? 1 : 0) : existing.is_active;
  const now = new Date().toISOString();

  db.prepare(`
    UPDATE mafinda_departments
    SET name = ?, description = ?, is_active = ?, updated_at = ?
    WHERE id = ?
  `).run(name, description, isActive, now, id);

  return mapRow(db.prepare('SELECT * FROM mafinda_departments WHERE id = ?').get(id));
}

/**
 * Deletes a department by id.
 * Returns the list of active projects that would be affected.
 * Throws NotFoundError (404) if not found.
 * Requirements: 7.1, 7.5
 */
export function deleteDepartment(
  db: Database.Database,
  id: string
): { success: boolean; affectedProjects: ActiveProject[] } {
  const existing = db.prepare('SELECT * FROM mafinda_departments WHERE id = ?').get(id) as any;
  if (!existing) throw new NotFoundError('Departemen tidak ditemukan');

  const affectedRows = db
    .prepare('SELECT id, name, department_id FROM mafinda_projects WHERE department_id = ? AND is_active = 1')
    .all(id) as any[];

  const affectedProjects: ActiveProject[] = affectedRows.map((r) => ({
    id: r.id,
    name: r.name,
    departmentId: r.department_id,
  }));

  // Remove child projects first to satisfy FK constraint
  db.prepare('DELETE FROM mafinda_projects WHERE department_id = ?').run(id);
  db.prepare('DELETE FROM mafinda_departments WHERE id = ?').run(id);

  return { success: true, affectedProjects };
}

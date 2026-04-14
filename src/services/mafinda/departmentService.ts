// Department Service — MAFINDA Dashboard Enhancement
// Drizzle ORM PostgreSQL implementation

import { eq, and, ne, asc } from 'drizzle-orm';
import { db } from '../../db/connection';
import { departments, projects } from '../../db/schema';

export interface Department {
  id: string;
  corporateId: string;
  name: string;
  code: string;
  description?: string;
  headName?: string;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedBy?: string;
  updatedAt?: string;
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

function mapRow(row: typeof departments.$inferSelect): Department {
  return {
    id: row.id,
    corporateId: row.corporateId,
    name: row.name,
    code: row.code,
    description: row.description ?? undefined,
    headName: row.headName ?? undefined,
    isActive: row.isActive,
    createdBy: row.createdBy,
    createdAt: row.createdAt.toISOString(),
    updatedBy: row.updatedBy ?? undefined,
    updatedAt: row.updatedAt?.toISOString(),
  };
}

/** Returns all departments for a corporate, ordered by name. */
export async function getAllDepartments(corporateId: string): Promise<Department[]> {
  const rows = await db.select().from(departments)
    .where(eq(departments.corporateId, corporateId))
    .orderBy(asc(departments.name));
  return rows.map(mapRow);
}

/** Returns a single department by id, or null if not found. */
export async function getDepartmentById(id: string): Promise<Department | null> {
  const [row] = await db.select().from(departments)
    .where(eq(departments.id, id))
    .limit(1);
  return row ? mapRow(row) : null;
}

/**
 * Creates a new department.
 * Throws ConflictError if code already exists in the same corporate.
 */
export async function createDepartment(
  data: { corporateId: string; name: string; code: string; description?: string; headName?: string },
  createdBy: string,
): Promise<Department> {
  const [existing] = await db.select({ id: departments.id }).from(departments)
    .where(and(eq(departments.corporateId, data.corporateId), eq(departments.code, data.code)))
    .limit(1);

  if (existing) {
    throw new ConflictError(`Kode departemen "${data.code}" sudah digunakan`);
  }

  const [inserted] = await db.insert(departments).values({
    corporateId: data.corporateId,
    name: data.name,
    code: data.code,
    description: data.description,
    headName: data.headName,
    createdBy,
  }).returning();

  return mapRow(inserted);
}

/**
 * Updates an existing department.
 * Throws NotFoundError if not found.
 * Throws ConflictError if the new code conflicts within the same corporate.
 */
export async function updateDepartment(
  id: string,
  data: { name?: string; code?: string; description?: string; headName?: string; isActive?: boolean },
  updatedBy: string,
): Promise<Department> {
  const [existing] = await db.select().from(departments)
    .where(eq(departments.id, id))
    .limit(1);
  if (!existing) throw new NotFoundError('Departemen tidak ditemukan');

  if (data.code && data.code !== existing.code) {
    const [conflict] = await db.select({ id: departments.id }).from(departments)
      .where(and(
        eq(departments.corporateId, existing.corporateId),
        eq(departments.code, data.code),
        ne(departments.id, id),
      ))
      .limit(1);
    if (conflict) throw new ConflictError(`Kode departemen "${data.code}" sudah digunakan`);
  }

  const [updated] = await db.update(departments).set({
    name: data.name ?? existing.name,
    code: data.code ?? existing.code,
    description: data.description !== undefined ? data.description : existing.description,
    headName: data.headName !== undefined ? data.headName : existing.headName,
    isActive: data.isActive !== undefined ? data.isActive : existing.isActive,
    updatedBy,
    updatedAt: new Date(),
  }).where(eq(departments.id, id)).returning();

  return mapRow(updated);
}

/**
 * Deletes a department by id.
 * Returns the list of active projects that would be affected.
 * Throws NotFoundError if not found.
 */
export async function deleteDepartment(
  id: string,
): Promise<{ success: boolean; affectedProjects: ActiveProject[] }> {
  const [existing] = await db.select().from(departments)
    .where(eq(departments.id, id))
    .limit(1);
  if (!existing) throw new NotFoundError('Departemen tidak ditemukan');

  const affectedRows = await db.select({
    id: projects.id,
    name: projects.name,
    departmentId: projects.departmentId,
  }).from(projects)
    .where(and(eq(projects.departmentId, id), eq(projects.isActive, true)));

  const affectedProjects: ActiveProject[] = affectedRows.map((r) => ({
    id: r.id,
    name: r.name,
    departmentId: r.departmentId,
  }));

  // Remove child projects first to satisfy FK constraint
  await db.delete(projects).where(eq(projects.departmentId, id));
  await db.delete(departments).where(eq(departments.id, id));

  return { success: true, affectedProjects };
}

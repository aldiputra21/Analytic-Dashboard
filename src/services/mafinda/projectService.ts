// Project Service — MAFINDA Dashboard Enhancement
// Drizzle ORM PostgreSQL implementation

import { eq, and, ne, asc } from 'drizzle-orm';
import { db } from '../../db/connection';
import { departments, projects } from '../../db/schema';
import { ConflictError, NotFoundError } from './departmentService';

export interface Project {
  id: string;
  departmentId: string;
  departmentName?: string;
  code: string;
  name: string;
  description?: string;
  sourceType: string;
  status: string;
  startDate?: string;
  endDate?: string;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedBy?: string;
  updatedAt?: string;
}

function mapRow(row: typeof projects.$inferSelect & { departmentName?: string | null }): Project {
  return {
    id: row.id,
    departmentId: row.departmentId,
    departmentName: (row as any).departmentName ?? undefined,
    code: row.code,
    name: row.name,
    description: row.description ?? undefined,
    sourceType: row.sourceType,
    status: row.status,
    startDate: row.startDate?.toISOString() ?? undefined,
    endDate: row.endDate?.toISOString() ?? undefined,
    isActive: row.isActive,
    createdBy: row.createdBy,
    createdAt: row.createdAt.toISOString(),
    updatedBy: row.updatedBy ?? undefined,
    updatedAt: row.updatedAt?.toISOString(),
  };
}

/** Returns all projects for a given department, optionally filtered to active only. */
export async function getProjectsByDepartment(
  departmentId: string,
  activeOnly = false,
): Promise<Project[]> {
  const conditions = [eq(projects.departmentId, departmentId)];
  if (activeOnly) conditions.push(eq(projects.isActive, true));

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
  }).from(projects)
    .leftJoin(departments, eq(departments.id, projects.departmentId))
    .where(and(...conditions))
    .orderBy(asc(projects.name));

  return rows.map((r) => mapRow(r as any));
}

/** Returns a single project by id, or null if not found. */
export async function getProjectById(id: string): Promise<Project | null> {
  const [row] = await db.select({
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
  }).from(projects)
    .leftJoin(departments, eq(departments.id, projects.departmentId))
    .where(eq(projects.id, id))
    .limit(1);

  return row ? mapRow(row as any) : null;
}

/**
 * Creates a new project.
 * Throws ConflictError if code already exists in the same department.
 */
export async function createProject(
  data: {
    departmentId: string;
    code: string;
    name: string;
    description?: string;
    startDate?: string;
    endDate?: string;
  },
  createdBy: string,
): Promise<Project> {
  const [dept] = await db.select({ id: departments.id }).from(departments)
    .where(eq(departments.id, data.departmentId))
    .limit(1);
  if (!dept) throw new NotFoundError('Departemen tidak ditemukan');

  const [conflict] = await db.select({ id: projects.id }).from(projects)
    .where(and(eq(projects.departmentId, data.departmentId), eq(projects.code, data.code)))
    .limit(1);
  if (conflict) {
    throw new ConflictError(`Kode proyek "${data.code}" sudah ada dalam departemen ini`);
  }

  const [inserted] = await db.insert(projects).values({
    departmentId: data.departmentId,
    code: data.code,
    name: data.name,
    description: data.description,
    startDate: data.startDate ? new Date(data.startDate) : undefined,
    endDate: data.endDate ? new Date(data.endDate) : undefined,
    createdBy,
  }).returning();

  return (await getProjectById(inserted.id))!;
}

/**
 * Updates an existing project.
 * Throws NotFoundError if not found.
 * Throws ConflictError if the new code conflicts within the same department.
 */
export async function updateProject(
  id: string,
  data: {
    name?: string;
    code?: string;
    description?: string;
    startDate?: string;
    endDate?: string;
    isActive?: boolean;
    status?: string;
  },
  updatedBy: string,
): Promise<Project> {
  const [existing] = await db.select().from(projects)
    .where(eq(projects.id, id))
    .limit(1);
  if (!existing) throw new NotFoundError('Proyek tidak ditemukan');

  if (data.code && data.code !== existing.code) {
    const [conflict] = await db.select({ id: projects.id }).from(projects)
      .where(and(
        eq(projects.departmentId, existing.departmentId),
        eq(projects.code, data.code),
        ne(projects.id, id),
      ))
      .limit(1);
    if (conflict) {
      throw new ConflictError(`Kode proyek "${data.code}" sudah ada dalam departemen ini`);
    }
  }

  const [updated] = await db.update(projects).set({
    name: data.name ?? existing.name,
    code: data.code ?? existing.code,
    description: data.description !== undefined ? data.description : existing.description,
    startDate: data.startDate !== undefined ? new Date(data.startDate) : existing.startDate,
    endDate: data.endDate !== undefined ? new Date(data.endDate) : existing.endDate,
    isActive: data.isActive !== undefined ? data.isActive : existing.isActive,
    status: data.status ?? existing.status,
    updatedBy,
    updatedAt: new Date(),
  }).where(eq(projects.id, id)).returning();

  return (await getProjectById(updated.id))!;
}

/**
 * Deletes a project by id.
 * Throws NotFoundError if not found.
 */
export async function deleteProject(id: string): Promise<{ success: boolean }> {
  const [existing] = await db.select({ id: projects.id }).from(projects)
    .where(eq(projects.id, id))
    .limit(1);
  if (!existing) throw new NotFoundError('Proyek tidak ditemukan');

  await db.delete(projects).where(eq(projects.id, id));
  return { success: true };
}

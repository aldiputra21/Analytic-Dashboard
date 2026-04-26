// Project Service — MAFINDA Dashboard Enhancement
// Drizzle ORM PostgreSQL implementation

import { eq, and, ne, asc, ilike, or, sql, inArray } from 'drizzle-orm';
import { db } from '../../db/connection';
import { departments, projects } from '../../db/schema/index.js';
import { ConflictError, NotFoundError } from './departmentService';
import { createFRSAuditLog } from '../financial/auditLogService';
import { RequestContext } from '../financial/auditLogService';

export interface Project {
  id: string;
  departmentId: string;
  departmentName?: string;
  corporateId?: string;
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

function mapRow(row: typeof projects.$inferSelect & { departmentName?: string | null; corporateId?: string | null }): Project {
  return {
    id: row.id,
    departmentId: row.departmentId,
    departmentName: (row as any).departmentName ?? undefined,
    corporateId: (row as any).corporateId ?? undefined,
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

/** Lists all projects with pagination and search. */
export async function getAllProjects(options: {
  corporateId?: string;
  departmentId?: string;
  search?: string;
  page?: number;
  pageSize?: number;
} = {}): Promise<{ records: Project[]; totalCount: number }> {
  const { corporateId, departmentId, search, page = 1, pageSize = 0 } = options;

  let baseFilters: any[] = [];
  if (departmentId) {
    baseFilters.push(eq(projects.departmentId, departmentId));
  }
  
  if (corporateId) {
    baseFilters.push(eq(departments.corporateId, corporateId));
  }
  
  if (search) {
    baseFilters.push(or(
      ilike(projects.name, `%${search}%`),
      ilike(projects.code, `%${search}%`)
    ));
  }

  const whereClause = baseFilters.length > 0 ? and(...baseFilters) : undefined;

  // Get total count
  const [countResult] = await db.select({ count: sql<number>`count(*)` })
    .from(projects)
    .leftJoin(departments, eq(departments.id, projects.departmentId))
    .where(whereClause);
  const totalCount = Number(countResult.count);

  let query = db.select({
    id: projects.id,
    departmentId: projects.departmentId,
    departmentName: departments.name,
    corporateId: departments.corporateId,
    code: projects.code,
    name: projects.name,
    description: projects.description,
    sourceType: projects.sourceType,
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
    .where(whereClause);

  if (pageSize > 0) {
    query = query.limit(pageSize).offset((page - 1) * pageSize) as any;
  }

  const rows = await query.orderBy(asc(projects.code));

  return {
    records: rows.map((r) => mapRow(r as any)),
    totalCount,
  };
}

/**
 * Gets all active projects for dropdowns/items.
 */
export async function getActiveProjects(corporateId?: string, subsidiaryIds?: string[] | null): Promise<Project[]> {
  let baseQuery = db.select({
    id: projects.id,
    departmentId: projects.departmentId,
    departmentName: departments.name,
    corporateId: departments.corporateId,
    code: projects.code,
    name: projects.name,
    description: projects.description,
    sourceType: projects.sourceType,
    status: projects.status,
    startDate: projects.startDate,
    endDate: projects.endDate,
    isActive: projects.isActive,
    createdBy: projects.createdBy,
    createdAt: projects.createdAt,
    updatedBy: projects.updatedBy,
    updatedAt: projects.updatedAt,
  }).from(projects)
    .leftJoin(departments, eq(departments.id, projects.departmentId));

  const filters = [eq(projects.isActive, true)];
  if (corporateId) {
    filters.push(eq(departments.corporateId, corporateId));
  }
  
  if (subsidiaryIds && subsidiaryIds.length > 0) {
    filters.push(inArray(departments.corporateId, subsidiaryIds));
  }

  const rows = await baseQuery.where(and(...filters)).orderBy(asc(projects.name));
  return rows.map(r => mapRow(r as any));
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
    isActive?: boolean;
    status?: string;
  },
  createdBy: string,
  context?: RequestContext,
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
    isActive: data.isActive ?? true,
    status: data.status ?? 'active',
    createdBy,
    updatedBy: createdBy,
  }).returning();

  const project = (await getProjectById(inserted.id))!;

  await createFRSAuditLog({
    userId: createdBy,
    action: 'create',
    entityType: 'project',
    entityId: project.id,
    newValues: JSON.parse(JSON.stringify(project)),
    ipAddress: context?.ip,
    userAgent: context?.userAgent,
  });

  return project;
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
  context?: RequestContext,
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
    startDate: data.startDate !== undefined ? (data.startDate ? new Date(data.startDate) : null) : existing.startDate,
    endDate: data.endDate !== undefined ? (data.endDate ? new Date(data.endDate) : null) : existing.endDate,
    isActive: data.isActive !== undefined ? data.isActive : existing.isActive,
    status: data.status ?? existing.status,
    updatedBy: updatedBy,
    updatedAt: new Date(),
  }).where(eq(projects.id, id)).returning();

  const project = (await getProjectById(updated.id))!;
  const oldRow = await getProjectById(id);

  await createFRSAuditLog({
    userId: updatedBy,
    action: 'update',
    entityType: 'project',
    entityId: id,
    oldValues: JSON.parse(JSON.stringify(oldRow)),
    newValues: JSON.parse(JSON.stringify(project)),
    ipAddress: context?.ip,
    userAgent: context?.userAgent,
  });

  return project;
}

/**
 * Deletes a project by id.
 * Throws NotFoundError if not found.
 */
export async function deleteProject(
  id: string,
  deletedBy?: string,
  context?: RequestContext,
): Promise<{ success: boolean }> {
  const existingFull = await getProjectById(id);
  if (!existingFull) throw new NotFoundError('Proyek tidak ditemukan');

  const result = await db.delete(projects).where(eq(projects.id, id)).returning();
  
  if (result.length > 0) {
    await createFRSAuditLog({
      userId: deletedBy || '',
      action: 'delete',
      entityType: 'project',
      entityId: id,
      oldValues: JSON.parse(JSON.stringify(existingFull)),
      ipAddress: context?.ip,
      userAgent: context?.userAgent,
    });
  }
  
  return { success: true };
}


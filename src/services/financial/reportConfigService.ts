// reportConfigService.ts
// CRUD, query validation, and helper functions for Dynamic Excel Report feature

import { eq, or, ilike, sql, count } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../../db/connection.js';
import { reportConfigs } from '../../db/schema/index.js';
import { createFRSAuditLog } from './auditLogService.js';
import type {
  ReportConfig,
  CreateReportConfigInput,
  UpdateReportConfigInput,
  ListReportConfigsParams,
  ListReportConfigsResult,
  FilterConfig,
  ColumnConfig,
} from '../../types/financial/reportConfig.js';

// ============================================================================
// Zod Schemas
// ============================================================================

export const filterConfigSchema = z.object({
  paramName: z.string().regex(/^[a-zA-Z0-9_]+$/, 'paramName hanya boleh alphanumeric dan underscore'),
  labelId: z.string().min(1),
  labelEn: z.string().min(1),
  type: z.enum(['text', 'date', 'date_range', 'numeric', 'numeric_range', 'dropdown', 'month', 'month_range']),
  order: z.number().int().positive(),
  required: z.boolean().optional(),
  dropdownSource: z.enum(['json', 'query']).optional(),
  dropdownItems: z.array(z.object({
    value: z.string(),
    labelId: z.string().default(''),
    labelEn: z.string().default(''),
  })).optional(),
  dropdownQuery: z.string().optional().refine(
    (q) => {
      if (!q) return true; // optional — skip if empty
      const result = validateReportQuery(q);
      return result.valid;
    },
    { message: 'dropdownQuery harus berupa SELECT query yang aman (tanpa semicolon atau keyword berbahaya)' }
  ),
});

export const columnConfigSchema = z.object({
  fieldName: z.string().min(1),
  order: z.number().int().positive(),
  dataType: z.enum(['string', 'number', 'date', 'currency']),
  format: z.string().optional(),
  headerLabelId: z.string().optional(),
  headerLabelEn: z.string().optional(),
});

export const reportConfigCreateSchema = z.object({
  titleId: z.string().min(1).max(200),
  titleEn: z.string().min(1).max(200),
  filters: z.array(filterConfigSchema).default([]),
  columns: z.array(columnConfigSchema).min(1, 'Minimal satu kolom output wajib diisi'),
  query: z.string().min(1).max(10_000),  // 10KB max — prevents memory exhaustion
  templateFilename: z.string().max(255).optional(),
  cellInfoFilter: z.string().max(10).optional(),
  startRow: z.number().int().positive().default(1),
  writeHeader: z.boolean().default(false),
  allowedRoles: z.array(z.string()).default([]),
  retentionType: z.enum(['immediate', 'days']).default('days'),
  retentionDays: z.number().int().positive().optional(),
  isActive: z.boolean().default(true),
});

// ============================================================================
// SQL Comment Stripping & Query Validation
// ============================================================================

const DANGEROUS_KEYWORDS = [
  'INSERT', 'UPDATE', 'DELETE', 'DROP', 'TRUNCATE',
  'EXEC', 'EXECUTE', 'ALTER', 'CREATE', 'GRANT',
  'REVOKE', 'MERGE', 'CALL', 'COPY', 'VACUUM', 'ANALYZE',
];

/**
 * Strips SQL comments from a query string.
 * Removes both block comments (/* *\/) and line comments (--)
 */
export function stripSqlComments(query: string): string {
  // Remove /* */ block comments
  let stripped = query.replace(/\/\*[\s\S]*?\*\//g, '');
  // Remove -- line comments
  stripped = stripped.replace(/--[^\n]*/g, '');
  return stripped;
}

/**
 * Validates a SQL query for safety.
 * - Strips comments before validation
 * - Must start with SELECT
 * - Must not contain dangerous keywords (whole-word, case-insensitive)
 * - Must not contain semicolons (prevents multi-statement injection)
 *
 * Returns { valid: true } or { valid: false, error: string }
 */
export function validateReportQuery(query: string): { valid: boolean; error?: string } {
  const stripped = stripSqlComments(query).trim();

  // Block semicolons — prevents multi-statement injection like "SELECT 1; DROP TABLE..."
  if (stripped.includes(';')) {
    return { valid: false, error: 'Query tidak boleh mengandung titik koma (;)' };
  }

  if (!stripped.toUpperCase().startsWith('SELECT')) {
    return { valid: false, error: 'Query harus diawali dengan SELECT' };
  }

  for (const keyword of DANGEROUS_KEYWORDS) {
    const regex = new RegExp(`\\b${keyword}\\b`, 'i');
    if (regex.test(stripped)) {
      return { valid: false, error: `Query mengandung keyword berbahaya: ${keyword}` };
    }
  }

  return { valid: true };
}

// ============================================================================
// parseStartRowFromTemplate
// ============================================================================

/**
 * Reads an .xlsx file with ExcelJS and detects the first row that contains data.
 * Returns that row number (1-indexed). Falls back to 1 on error.
 */
export async function parseStartRowFromTemplate(templatePath: string): Promise<number> {
  try {
    const ExcelJS = await import('exceljs');
    const workbook = new ExcelJS.default.Workbook();
    await workbook.xlsx.readFile(templatePath);

    const worksheet = workbook.worksheets[0];
    if (!worksheet) return 1;

    let firstDataRow = 1;
    worksheet.eachRow({ includeEmpty: false }, (_row, rowNumber) => {
      if (firstDataRow === 1 || rowNumber < firstDataRow) {
        firstDataRow = rowNumber;
      }
    });

    return firstDataRow;
  } catch {
    return 1;
  }
}

// ============================================================================
// Row mapper
// ============================================================================

function mapRowToReportConfig(row: typeof reportConfigs.$inferSelect): ReportConfig {
  return {
    id: row.id,
    titleId: row.titleId,
    titleEn: row.titleEn,
    filters: (row.filters as FilterConfig[]) ?? [],
    columns: (row.columns as ColumnConfig[]) ?? [],
    query: row.query,
    templateFilename: row.templateFilename ?? null,
    cellInfoFilter: row.cellInfoFilter ?? null,
    startRow: row.startRow,
    writeHeader: row.writeHeader ?? false,
    allowedRoles: (row.allowedRoles as string[]) ?? [],
    retentionType: row.retentionType,
    retentionDays: row.retentionDays ?? null,
    isActive: row.isActive,
    createdBy: row.createdBy,
    createdAt: row.createdAt,
    updatedBy: row.updatedBy ?? null,
    updatedAt: row.updatedAt ?? null,
  };
}

// ============================================================================
// CRUD Operations
// ============================================================================

/**
 * Lists report configs with optional search and pagination.
 * Search is case-insensitive on title_id and title_en.
 */
export async function listReportConfigs(
  params: ListReportConfigsParams = {},
): Promise<ListReportConfigsResult> {
  const { search, page = 1, pageSize = 25 } = params;

  const conditions = [];
  if (search && search.trim()) {
    conditions.push(
      or(
        ilike(reportConfigs.titleId, `%${search}%`),
        ilike(reportConfigs.titleEn, `%${search}%`),
      ),
    );
  }

  const whereClause = conditions.length > 0 ? conditions[0] : undefined;

  const [countResult] = await db
    .select({ total: count() })
    .from(reportConfigs)
    .where(whereClause);

  const total = Number(countResult?.total ?? 0);

  const rows = await db
    .select()
    .from(reportConfigs)
    .where(whereClause)
    .orderBy(reportConfigs.createdAt)
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  return {
    data: rows.map(mapRowToReportConfig),
    total,
    page,
    pageSize,
  };
}

/**
 * Gets a single report config by ID.
 * Returns null if not found.
 */
export async function getReportConfigById(id: string): Promise<ReportConfig | null> {
  const [row] = await db
    .select()
    .from(reportConfigs)
    .where(eq(reportConfigs.id, id))
    .limit(1);

  return row ? mapRowToReportConfig(row) : null;
}

/**
 * Creates a new report config.
 * Validates query safety before saving.
 * Logs to audit_logs.
 */
export async function createReportConfig(
  data: CreateReportConfigInput,
  userId: string,
): Promise<{ config?: ReportConfig; error?: string }> {
  // Validate query
  const queryValidation = validateReportQuery(data.query);
  if (!queryValidation.valid) {
    return { error: queryValidation.error };
  }

  const [inserted] = await db
    .insert(reportConfigs)
    .values({
      titleId: data.titleId,
      titleEn: data.titleEn,
      filters: (data.filters ?? []) as typeof reportConfigs.$inferInsert['filters'],
      columns: data.columns as typeof reportConfigs.$inferInsert['columns'],
      query: data.query,
      templateFilename: data.templateFilename ?? null,
      cellInfoFilter: data.cellInfoFilter ?? null,
      startRow: data.startRow ?? 1,
      writeHeader: data.writeHeader ?? false,
      allowedRoles: (data.allowedRoles ?? []) as typeof reportConfigs.$inferInsert['allowedRoles'],
      retentionType: data.retentionType ?? 'days',
      retentionDays: data.retentionDays ?? null,
      isActive: data.isActive !== undefined ? data.isActive : true,
      createdBy: userId,
      updatedBy: userId,
    })
    .returning();

  const config = mapRowToReportConfig(inserted);

  await createFRSAuditLog({
    userId,
    action: 'create',
    entityType: 'report_config',
    entityId: config.id,
    newValues: JSON.parse(JSON.stringify(config)),
  });

  return { config };
}

/**
 * Updates an existing report config.
 * Validates query safety if query is being updated.
 * Logs to audit_logs.
 */
export async function updateReportConfig(
  id: string,
  data: UpdateReportConfigInput,
  userId: string,
): Promise<{ config?: ReportConfig; error?: string }> {
  const [existing] = await db
    .select()
    .from(reportConfigs)
    .where(eq(reportConfigs.id, id))
    .limit(1);

  if (!existing) {
    return { error: 'Report config not found' };
  }

  // Validate query if being updated
  if (data.query !== undefined) {
    const queryValidation = validateReportQuery(data.query);
    if (!queryValidation.valid) {
      return { error: queryValidation.error };
    }
  }

  const oldValues = mapRowToReportConfig(existing);

  const updateData: Partial<typeof reportConfigs.$inferInsert> = {
    updatedBy: userId,
    updatedAt: new Date(),
  };

  if (data.titleId !== undefined) updateData.titleId = data.titleId;
  if (data.titleEn !== undefined) updateData.titleEn = data.titleEn;
  if (data.filters !== undefined) updateData.filters = data.filters as typeof reportConfigs.$inferInsert['filters'];
  if (data.columns !== undefined) updateData.columns = data.columns as typeof reportConfigs.$inferInsert['columns'];
  if (data.query !== undefined) updateData.query = data.query;
  if (data.templateFilename !== undefined) updateData.templateFilename = data.templateFilename;
  if (data.cellInfoFilter !== undefined) updateData.cellInfoFilter = data.cellInfoFilter;
  if (data.startRow !== undefined) updateData.startRow = data.startRow;
  if (data.writeHeader !== undefined) updateData.writeHeader = data.writeHeader;
  if (data.allowedRoles !== undefined) updateData.allowedRoles = data.allowedRoles as typeof reportConfigs.$inferInsert['allowedRoles'];
  if (data.retentionType !== undefined) updateData.retentionType = data.retentionType;
  if (data.retentionDays !== undefined) updateData.retentionDays = data.retentionDays;
  if (data.isActive !== undefined) updateData.isActive = data.isActive;

  const [updated] = await db
    .update(reportConfigs)
    .set(updateData)
    .where(eq(reportConfigs.id, id))
    .returning();

  const config = mapRowToReportConfig(updated);

  await createFRSAuditLog({
    userId,
    action: 'update',
    entityType: 'report_config',
    entityId: id,
    oldValues: JSON.parse(JSON.stringify(oldValues)),
    newValues: JSON.parse(JSON.stringify(config)),
  });

  return { config };
}

/**
 * Deletes a report config by ID.
 * Logs to audit_logs.
 */
export async function deleteReportConfig(
  id: string,
  userId: string,
): Promise<{ success: boolean; error?: string }> {
  const [existing] = await db
    .select()
    .from(reportConfigs)
    .where(eq(reportConfigs.id, id))
    .limit(1);

  if (!existing) {
    return { success: false, error: 'Report config not found' };
  }

  await createFRSAuditLog({
    userId,
    action: 'delete',
    entityType: 'report_config',
    entityId: id,
    oldValues: JSON.parse(JSON.stringify(mapRowToReportConfig(existing))),
  });

  await db.delete(reportConfigs).where(eq(reportConfigs.id, id));

  return { success: true };
}

// ============================================================================
// Menu Configs
// ============================================================================

/**
 * Returns all active report configs whose allowed_roles overlap with userRoles.
 * Used for building the dynamic sidebar menu.
 */
export async function getMenuConfigs(userRoles: string[]): Promise<ReportConfig[]> {
  if (userRoles.length === 0) return [];

  // Fetch all active configs, then filter by role overlap in JS
  // (JSONB array overlap in Drizzle requires raw SQL; JS filter is simpler and correct)
  const rows = await db
    .select()
    .from(reportConfigs)
    .where(eq(reportConfigs.isActive, true));

  return rows
    .map(mapRowToReportConfig)
    .filter((config) => {
      const allowed = config.allowedRoles;
      return allowed.some((role) => userRoles.includes(role));
    });
}

// ============================================================================
// In-memory filter (for property tests)
// ============================================================================

/**
 * Filters an array of report configs in-memory by a search query.
 * Matches case-insensitively against titleId or titleEn.
 * Used for property-based testing (Property 6).
 */
export function filterReportConfigs<T extends { titleId: string; titleEn: string }>(
  configs: T[],
  query: string,
): T[] {
  const q = query.toLowerCase();
  return configs.filter(
    (c) =>
      c.titleId.toLowerCase().includes(q) ||
      c.titleEn.toLowerCase().includes(q),
  );
}

// ============================================================================
// Toggle active status (convenience)
// ============================================================================

/**
 * Toggles the is_active status of a report config.
 */
export async function setReportConfigStatus(
  id: string,
  isActive: boolean,
  userId: string,
): Promise<{ config?: ReportConfig; error?: string }> {
  return updateReportConfig(id, { isActive }, userId);
}

// reportOutputService.ts
// Generate, process, and download dynamic Excel reports.
//
// Requirements: 3.6, 3.7, 6.1–6.10, 7.1–7.3, 8.1, 8.2, 8.6, 9.1–9.3, 10.5

import fs from 'fs';
import path from 'path';
import { eq, and } from 'drizzle-orm';
import { db } from '../../db/connection.js';
import { readonlyPool } from '../../db/readonlyConnection.js';
import { reportOutputs, reportConfigs } from '../../db/schema/index.js';
import { configService } from '../management/configService.js';
import { createNotification, upsertNotification } from './notificationService.js';
import { createFRSAuditLog } from './auditLogService.js';
import { AppError, ErrorCode } from '../../utils/errors.js';
import type { FilterConfig, ColumnConfig } from '../../types/financial/reportConfig.js';
import type { Response } from 'express';

// ============================================================================
// Constants & Defaults
// ============================================================================

const DEFAULT_TEMPLATE_PATH = './storage/report-templates';
const DEFAULT_OUTPUT_PATH = './storage/report-outputs';

// ============================================================================
// Helpers
// ============================================================================

async function getTemplatePath(): Promise<string> {
  const value = await configService.get<string>('report_template_path');
  if (!value) {
    console.warn('[ReportOutput] system_configs key "report_template_path" not found. Using default: ' + DEFAULT_TEMPLATE_PATH);
    return DEFAULT_TEMPLATE_PATH;
  }
  return value;
}

async function getOutputPath(): Promise<string> {
  const value = await configService.get<string>('report_output_path');
  if (!value) {
    console.warn('[ReportOutput] system_configs key "report_output_path" not found. Using default: ' + DEFAULT_OUTPUT_PATH);
    return DEFAULT_OUTPUT_PATH;
  }
  return value;
}

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function formatCellValue(value: unknown, dataType: ColumnConfig['dataType'], _format?: string): unknown {
  if (value === null || value === undefined) return '';
  switch (dataType) {
    case 'number':
    case 'currency': {
      const num = Number(value);
      return isNaN(num) ? value : num;
    }
    case 'date': {
      if (value instanceof Date) return value;
      const d = new Date(String(value));
      return isNaN(d.getTime()) ? String(value) : d;
    }
    case 'string':
    default: {
      const str = String(value);
      // Prevent Excel formula injection
      if (/^[=+\-@\t\r]/.test(str)) return "'" + str;
      return str;
    }
  }
}

// ============================================================================
// buildParameterizedQuery
// ============================================================================

/**
 * Replaces all ${PARAM} and {{PARAM}} placeholders in a SQL query with
 * positional $1..$N parameters.
 *
 * Range filter types (date_range, numeric_range, month_range) store their
 * value as { from, to } objects. Use ${PARAM_from} and ${PARAM_to} to
 * reference each bound individually in the query.
 *
 * ${WHERE} expands to a full WHERE clause from all active filters:
 * - Scalar filters: "param" = $N
 * - Range filters: "param_from" >= $N AND "param_to" <= $N+1
 *   (only bounds that are non-empty are included)
 *
 * Requirements: 3.6
 */

const RANGE_TYPES = new Set(['date_range', 'numeric_range', 'month_range']);

function isRangeValue(v: unknown): v is { from: unknown; to: unknown } {
  return typeof v === 'object' && v !== null && 'from' in v && 'to' in v;
}

function isEmptyValue(v: unknown): boolean {
  if (v === undefined || v === null || v === '') return true;
  if (isRangeValue(v)) {
    return (v.from === '' || v.from === null || v.from === undefined) &&
           (v.to === '' || v.to === null || v.to === undefined);
  }
  return false;
}

export function buildParameterizedQuery(
  query: string,
  filterValues: Record<string, unknown>,
  filters: FilterConfig[] = [],
): { sql: string; params: unknown[] } {

  // ── Step 1: Handle ${WHERE} placeholder ──────────────────────────────────
  const whereRegex = /\$\{WHERE\}|\{\{WHERE\}\}/gi;
  const hasWhere = whereRegex.test(query);

  let whereClause = '1=1';
  const whereParams: unknown[] = [];

  if (hasWhere && filters.length > 0) {
    const sortedFilters = [...filters].sort((a, b) => a.order - b.order);
    const conditions: string[] = [];

    for (const filter of sortedFilters) {
      const val = filterValues[filter.paramName];
      if (isEmptyValue(val)) continue;

      if (RANGE_TYPES.has(filter.type) && isRangeValue(val)) {
        // Range: generate BETWEEN-friendly conditions using _from / _to column names
        const fromEmpty = val.from === '' || val.from === null || val.from === undefined;
        const toEmpty = val.to === '' || val.to === null || val.to === undefined;
        if (!fromEmpty) {
          const idx = whereParams.length + 1;
          conditions.push('"' + filter.paramName + '" >= $__WHERE_' + idx + '__');
          whereParams.push(val.from);
        }
        if (!toEmpty) {
          const idx = whereParams.length + 1;
          conditions.push('"' + filter.paramName + '" <= $__WHERE_' + idx + '__');
          whereParams.push(val.to);
        }
      } else {
        const idx = whereParams.length + 1;
        conditions.push('"' + filter.paramName + '" = $__WHERE_' + idx + '__');
        whereParams.push(val);
      }
    }

    whereClause = conditions.length > 0 ? conditions.join(' AND ') : '1=1';
  }

  // ── Step 2: Replace regular ${PARAM} placeholders ────────────────────────
  const paramIndexMap = new Map<string, number>();
  const regularParams: unknown[] = [];

  const placeholderRegex = /\$\{([^}]+)\}|\{\{([^}]+)\}\}/gi;

  let processedQuery = query.replace(
    placeholderRegex,
    (_match: string, p1: string | undefined, p2: string | undefined) => {
      const paramName = (p1 ?? p2 ?? '').trim();

      // Skip WHERE — handled separately
      if (paramName.toUpperCase() === 'WHERE') {
        return '__WHERE_PLACEHOLDER__';
      }

      // Detect _from / _to suffixes for range types
      const fromSuffix = '_from';
      const toSuffix = '_to';
      let baseParamName = paramName;
      let rangePart: 'from' | 'to' | null = null;

      if (paramName.endsWith(fromSuffix)) {
        baseParamName = paramName.slice(0, -fromSuffix.length);
        rangePart = 'from';
      } else if (paramName.endsWith(toSuffix)) {
        baseParamName = paramName.slice(0, -toSuffix.length);
        rangePart = 'to';
      }

      const rawVal = filterValues[baseParamName];
      const filterType = filters.find((f) => f.paramName === baseParamName)?.type ?? '';
      const isRange = RANGE_TYPES.has(filterType);

      // Range with explicit _from / _to suffix
      if (isRange && rangePart && isRangeValue(rawVal)) {
        const boundVal = rawVal[rangePart];
        const cacheKey = paramName;
        if (paramIndexMap.has(cacheKey)) {
          return '$' + paramIndexMap.get(cacheKey);
        }
        const index = whereParams.length + regularParams.length + 1;
        paramIndexMap.set(cacheKey, index);
        regularParams.push(boundVal ?? null);
        return '$' + index;
      }

      // Range without suffix — not supported, warn and use null
      // User should use ${PARAM_from} and ${PARAM_to} explicitly
      if (isRange && !rangePart) {
        console.warn(
          '[buildParameterizedQuery] Range placeholder ${' + paramName + '} used without _from/_to suffix. ' +
          'Use ${' + paramName + '_from} and ${' + paramName + '_to} instead.'
        );
        if (paramIndexMap.has(paramName)) {
          return '$' + paramIndexMap.get(paramName);
        }
        const index = whereParams.length + regularParams.length + 1;
        paramIndexMap.set(paramName, index);
        regularParams.push(null);
        return '$' + index;
      }

      // Regular scalar param
      if (paramIndexMap.has(paramName)) {
        return '$' + paramIndexMap.get(paramName);
      }
      const index = whereParams.length + regularParams.length + 1;
      paramIndexMap.set(paramName, index);
      regularParams.push(filterValues[paramName] ?? null);
      return '$' + index;
    },
  );

  // ── Step 3: Substitute WHERE clause ──────────────────────────────────────
  if (hasWhere) {
    const finalWhereClause = whereClause.replace(/\$__WHERE_(\d+)__/g, (_m: string, n: string) => '$' + n);
    processedQuery = processedQuery.replace('__WHERE_PLACEHOLDER__', finalWhereClause);
  }

  const allParams = [...whereParams, ...regularParams];
  return { sql: processedQuery, params: allParams };
}

// ============================================================================
// assertValidStatusTransition
// ============================================================================

const VALID_TRANSITIONS: Record<string, string[]> = {
  pending: ['processing'],
  processing: ['completed', 'failed'],
  completed: ['downloaded_deleted'],
  failed: [],
  downloaded_deleted: [],
  expired: [],
};

export function assertValidStatusTransition(from: string, to: string): void {
  const allowed = VALID_TRANSITIONS[from];
  if (!allowed) {
    throw AppError.badRequest(ErrorCode.VALIDATION_ERROR, 'Unknown source status: "' + from + '"');
  }
  if (!allowed.includes(to)) {
    throw AppError.badRequest(
      ErrorCode.VALIDATION_ERROR,
      'Invalid status transition: "' + from + '" → "' + to + '". Allowed: [' + (allowed.join(', ') || 'none') + ']',
    );
  }
}

// ============================================================================
// createReportOutput
// ============================================================================

export async function createReportOutput(
  configId: string,
  userId: string,
  filterValues: Record<string, unknown>,
): Promise<typeof reportOutputs.$inferSelect> {
  const [config] = await db
    .select()
    .from(reportConfigs)
    .where(and(eq(reportConfigs.id, configId), eq(reportConfigs.isActive, true)))
    .limit(1);

  if (!config) {
    throw AppError.notFound(ErrorCode.NOT_FOUND, 'Report config not found or inactive');
  }

  const [output] = await db
    .insert(reportOutputs)
    .values({
      reportConfigId: configId,
      userId,
      filterValues,
      status: 'pending',
      createdBy: userId,
    })
    .returning();

  upsertNotification({
    sourceModule: 'public',
    sourceEntityType: 'report_output',
    sourceEntityId: output.id,
    recipientUserId: userId,
    category: 'report',
    templateKey: 'report_generating',
    templateVars: { reportTitleId: config.titleId, reportTitleEn: config.titleEn, outputId: output.id },
    payload: { outputId: output.id, configId },
    severity: 'low',
    createdBy: userId,
  }).catch((err) => { console.error('[ReportOutput] Failed to send generating notification:', err); });

  setImmediate(() => {
    processReportOutput(output.id).catch((err) => {
      console.error('[ReportProcessor] Unhandled error for output', output.id, ':', err);
    });
  });

  return output;
}

// ============================================================================
// processReportOutput
// ============================================================================

export async function processReportOutput(outputId: string): Promise<void> {
  const [output] = await db
    .select()
    .from(reportOutputs)
    .where(eq(reportOutputs.id, outputId))
    .limit(1);

  if (!output) {
    console.error('[ReportProcessor] Output not found:', outputId);
    return;
  }

  try {
    assertValidStatusTransition(output.status, 'processing');
  } catch {
    console.error('[ReportProcessor] Cannot transition output ' + outputId + ' from "' + output.status + '" to "processing". Skipping.');
    return;
  }

  await db
    .update(reportOutputs)
    .set({ status: 'processing', startedAt: new Date() })
    .where(eq(reportOutputs.id, outputId));

  const [config] = await db
    .select()
    .from(reportConfigs)
    .where(eq(reportConfigs.id, output.reportConfigId))
    .limit(1);

  if (!config) {
    await markFailed(outputId, output.userId, 'Report config not found');
    return;
  }

  const columns = (config.columns as ColumnConfig[]) ?? [];
  const filters = (config.filters as FilterConfig[]) ?? [];
  const filterValues = (output.filterValues as Record<string, unknown>) ?? {};
  const language = (filterValues.__language as 'id' | 'en') || 'id';

  try {
    const templateBasePath = await getTemplatePath();
    const outputBasePath = await getOutputPath();

    const ExcelJS = await import('exceljs');
    const workbook = new ExcelJS.default.Workbook();

    if (config.templateFilename) {
      // Disk filename is deterministic: template-{configId}.{ext from original filename}
      const ext = path.extname(config.templateFilename).toLowerCase() || '.xlsx';
      const diskFilename = `template-${config.id}${ext}`;
      const templateFullPath = path.join(templateBasePath, diskFilename);
      if (!fs.existsSync(templateFullPath)) {
        await markFailed(outputId, output.userId, 'Template file not found: ' + config.templateFilename);
        return;
      }
      await workbook.xlsx.readFile(templateFullPath);
    } else {
      workbook.addWorksheet('Report');
    }

    const worksheet = workbook.worksheets[0];
    if (!worksheet) {
      await markFailed(outputId, output.userId, 'No worksheet found in template');
      return;
    }

    const { sql: paramSql, params } = buildParameterizedQuery(config.query, filterValues, filters);

    let queryRows: Record<string, unknown>[];
    try {
      const result = await readonlyPool.query<Record<string, unknown>>(paramSql, params);
      queryRows = result.rows;
    } catch (queryErr: unknown) {
      const msg = queryErr instanceof Error ? queryErr.message : String(queryErr);
      const isTimeout = msg.includes('statement timeout') || msg.includes('canceling statement due to statement timeout') || msg.includes('query_canceled');
      await markFailed(outputId, output.userId, isTimeout ? 'Query timed out after 30 seconds' : 'Query execution failed: ' + msg);
      return;
    }

    // Write filter summary to cell_info_filter
    if (config.cellInfoFilter) {
      const cellRefRegex = /^[A-Z]{1,3}[1-9][0-9]{0,6}$/i;
      if (cellRefRegex.test(config.cellInfoFilter)) {
        const sortedFilters = [...filters].sort((a, b) => a.order - b.order);
        const filterSummary = sortedFilters
          .map((f) => {
            const val = filterValues[f.paramName];
            let displayVal = '-';

            if (val !== undefined && val !== null && val !== '') {
              if (typeof val === 'object' && !Array.isArray(val)) {
                // Handle range objects {from, to}
                const obj = val as Record<string, unknown>;
                if (obj.from !== undefined && obj.to !== undefined) {
                  displayVal = `${obj.from} - ${obj.to}`;
                } else {
                  displayVal = JSON.stringify(val);
                }
              } else if (f.type === 'dropdown') {
                // Try to resolve dropdown label
                displayVal = String(val); // Default to value
                if (f.dropdownSource === 'json' && f.dropdownItems) {
                  const item = f.dropdownItems.find((i) => i.value === String(val));
                  if (item) {
                    displayVal = language === 'id' ? item.labelId : item.labelEn;
                  }
                }
                // Note: For source='query', we don't re-run the query here for performance.
                // In a future update, we could pass labels from the frontend.
              } else {
                displayVal = String(val);
              }
            }

            return (language === 'id' ? f.labelId : f.labelEn) + ': ' + displayVal;
          })
          .join(', ');
        const safeValue = filterSummary.replace(/^[=+\-@\t\r]/, "'" + filterSummary.charAt(0));
        worksheet.getCell(config.cellInfoFilter).value = safeValue;
      }
    }

    const startRow = config.startRow ?? 1;
    const sortedColumns = [...columns].sort((a, b) => a.order - b.order);

    let dataStartRow = startRow;
    if (config.writeHeader) {
      const headerRow = worksheet.getRow(startRow);
      sortedColumns.forEach((col, colIdx) => {
        const cell = headerRow.getCell(colIdx + 1);
        cell.value = (language === 'id' ? col.headerLabelId : col.headerLabelEn) ?? col.headerLabelId ?? col.fieldName;
        cell.font = { bold: true };
      });
      headerRow.commit();
      dataStartRow = startRow + 1;
    }

    queryRows.forEach((row, rowIdx) => {
      const excelRow = worksheet.getRow(dataStartRow + rowIdx);
      sortedColumns.forEach((col, colIdx) => {
        const cell = excelRow.getCell(colIdx + 1);
        const rawValue = row[col.fieldName];
        cell.value = formatCellValue(rawValue, col.dataType, col.format) as import('exceljs').CellValue;
        if (col.format && (col.dataType === 'number' || col.dataType === 'currency' || col.dataType === 'date')) {
          cell.numFmt = col.format;
        }
      });
      excelRow.commit();
    });

    if (!fs.existsSync(outputBasePath)) {
      fs.mkdirSync(outputBasePath, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').replace('T', '_').slice(0, 19);
    const slug = slugify(config.titleId || config.titleEn || 'report');
    const filename = slug + '_' + timestamp + '_' + output.userId + '.xlsx';
    const fullOutputPath = path.join(outputBasePath, filename);

    await workbook.xlsx.writeFile(fullOutputPath);
    const stats = fs.statSync(fullOutputPath);

    await db
      .update(reportOutputs)
      .set({ status: 'completed', completedAt: new Date(), outputPath: fullOutputPath, outputFilename: filename, fileSize: stats.size, errorMessage: null })
      .where(eq(reportOutputs.id, outputId));

    upsertNotification({
      sourceModule: 'public',
      sourceEntityType: 'report_output',
      sourceEntityId: outputId,
      recipientUserId: output.userId,
      category: 'report',
      templateKey: 'report_ready',
      templateVars: { reportTitleId: config.titleId, reportTitleEn: config.titleEn, outputId, filename },
      payload: { outputId, configId: config.id, filename, reportStatus: 'completed', downloadUrl: '/api/frs/report-outputs/' + outputId + '/download' },
      severity: 'medium',
      createdBy: output.userId,
    }).catch((err) => { console.error('[ReportProcessor] Failed to send ready notification:', err); });

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[ReportProcessor] Unexpected error for output', outputId, ':', err);
    await markFailed(outputId, output.userId, 'Unexpected error: ' + msg);
  }
}

async function markFailed(outputId: string, userId: string, errorMessage: string): Promise<void> {
  try {
    await db
      .update(reportOutputs)
      .set({ status: 'failed', completedAt: new Date(), errorMessage })
      .where(eq(reportOutputs.id, outputId));
  } catch (dbErr) {
    console.error('[ReportProcessor] Failed to update status to "failed":', dbErr);
  }

  let titleId = 'Laporan';
  let titleEn = 'Report';
  try {
    const [output] = await db
      .select({ reportConfigId: reportOutputs.reportConfigId })
      .from(reportOutputs)
      .where(eq(reportOutputs.id, outputId))
      .limit(1);
    if (output) {
      const [config] = await db
        .select({ titleId: reportConfigs.titleId, titleEn: reportConfigs.titleEn })
        .from(reportConfigs)
        .where(eq(reportConfigs.id, output.reportConfigId))
        .limit(1);
      if (config) { titleId = config.titleId; titleEn = config.titleEn; }
    }
  } catch { /* best-effort */ }

  upsertNotification({
    sourceModule: 'public',
    sourceEntityType: 'report_output',
    sourceEntityId: outputId,
    recipientUserId: userId,
    category: 'report',
    templateKey: 'report_failed',
    templateVars: { reportTitleId: titleId, reportTitleEn: titleEn, outputId, errorMessage },
    payload: { outputId, errorMessage },
    severity: 'high',
    createdBy: userId,
  }).catch((err) => { console.error('[ReportProcessor] Failed to send failure notification:', err); });
}

// ============================================================================
// downloadReportOutput
// ============================================================================

export async function downloadReportOutput(
  outputId: string,
  requestingUserId: string,
  res: Response,
): Promise<void> {
  const [output] = await db
    .select()
    .from(reportOutputs)
    .where(eq(reportOutputs.id, outputId))
    .limit(1);

  if (!output) throw AppError.notFound(ErrorCode.NOT_FOUND, 'Report output not found');
  if (output.userId !== requestingUserId) throw AppError.forbidden(ErrorCode.AUTH_FORBIDDEN, 'You are not authorized to download this report');
  if (output.status !== 'completed') throw AppError.badRequest(ErrorCode.VALIDATION_ERROR, 'Report is not ready for download. Current status: ' + output.status);
  if (!output.outputPath || !output.outputFilename) throw AppError.notFound(ErrorCode.NOT_FOUND, 'Report file path is not recorded');
  if (!fs.existsSync(output.outputPath)) throw AppError.notFound(ErrorCode.NOT_FOUND, 'Report file not found on server. It may have been deleted.');

  const [config] = await db
    .select({ retentionType: reportConfigs.retentionType })
    .from(reportConfigs)
    .where(eq(reportConfigs.id, output.reportConfigId))
    .limit(1);

  const isImmediate = config?.retentionType === 'immediate';

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename="' + output.outputFilename + '"');

  const fileStream = fs.createReadStream(output.outputPath);
  await new Promise<void>((resolve, reject) => {
    fileStream.on('error', reject);
    res.on('finish', resolve);
    res.on('error', reject);
    fileStream.pipe(res);
  });

  if (isImmediate) {
    try { fs.unlinkSync(output.outputPath); } catch (unlinkErr) {
      console.warn('[ReportOutput] Could not delete file after immediate-retention download:', unlinkErr);
    }
    await db.update(reportOutputs).set({ status: 'downloaded_deleted', downloadedAt: new Date(), deletedAt: new Date() }).where(eq(reportOutputs.id, outputId));
    await createFRSAuditLog({ userId: requestingUserId, action: 'delete', entityType: 'report_output', entityId: outputId, newValues: { reason: 'immediate_retention_download', filename: output.outputFilename } });
    
    // Update notification to hide download button
    upsertNotification({
      sourceModule: 'public',
      sourceEntityType: 'report_output',
      sourceEntityId: outputId,
      recipientUserId: output.userId,
      category: 'report',
      templateKey: 'report_ready', // Keep the key but update payload
      templateVars: { reportTitleId: 'Laporan', reportTitleEn: 'Report' }, // Best effort, or just keep existing
      payload: { outputId, reportStatus: 'downloaded_deleted' }, // Removed downloadUrl
      severity: 'low',
      createdBy: requestingUserId,
    }).catch(() => {});
  } else {
    await db.update(reportOutputs).set({ downloadedAt: new Date() }).where(eq(reportOutputs.id, outputId));
  }
}

// ============================================================================
// getDropdownOptions
// ============================================================================

export async function getDropdownOptions(
  configId: string,
  paramName: string,
  userRoles: string[],
): Promise<Array<{ value: string; labelId: string; labelEn: string }>> {
  const [config] = await db
    .select()
    .from(reportConfigs)
    .where(and(eq(reportConfigs.id, configId), eq(reportConfigs.isActive, true)))
    .limit(1);

  if (!config) throw AppError.notFound(ErrorCode.NOT_FOUND, 'Report config not found or inactive');

  const allowedRoles = (config.allowedRoles as string[]) ?? [];
  if (allowedRoles.length > 0 && !userRoles.some((r) => allowedRoles.includes(r))) {
    throw AppError.forbidden(ErrorCode.AUTH_FORBIDDEN, 'Access denied to this report');
  }

  const filters = (config.filters as FilterConfig[]) ?? [];
  const filter = filters.find((f) => f.paramName === paramName);

  if (!filter) throw AppError.notFound(ErrorCode.NOT_FOUND, 'Filter "' + paramName + '" not found in config');
  if (filter.type !== 'dropdown' || filter.dropdownSource !== 'query') throw AppError.badRequest(ErrorCode.VALIDATION_ERROR, 'Filter "' + paramName + '" is not a query-sourced dropdown');
  if (!filter.dropdownQuery) throw AppError.badRequest(ErrorCode.VALIDATION_ERROR, 'Filter "' + paramName + '" has no dropdownQuery configured');

  let rows: Record<string, unknown>[];
  try {
    const result = await readonlyPool.query<Record<string, unknown>>(filter.dropdownQuery, []);
    rows = result.rows;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    throw AppError.internal('Dropdown query failed: ' + msg);
  }

  return rows.map((row) => {
    const keys = Object.keys(row);
    const value = String(row['value'] ?? row[keys[0]] ?? '');
    
    // Support labelId/labelEn specifically, or fallback to 'label'
    const labelId = String(row['labelId'] ?? row['label_id'] ?? row['label'] ?? row[keys[1]] ?? value);
    const labelEn = String(row['labelEn'] ?? row['label_en'] ?? row['label'] ?? row[keys[1]] ?? value);
    
    return { value, labelId, labelEn };
  });
}

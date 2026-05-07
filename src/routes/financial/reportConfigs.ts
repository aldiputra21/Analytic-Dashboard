// src/routes/financial/reportConfigs.ts
// API routes for Dynamic Excel Report configuration management
// Requirements: 1.1, 1.2, 1.3, 1.5, 1.6, 1.9, 2.6, 2.8, 3.1, 3.2, 3.3, 3.4, 3.8, 10.1, 10.2, 10.3, 10.7, 11.5

import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { z } from 'zod';
import rateLimit from 'express-rate-limit';
import { Router, Request, Response } from 'express';
import { requirePermission } from '../../middleware/rbac';
import { asyncHandler } from '../../utils/asyncHandler';
import { AppError, ErrorCode } from '../../utils/errors';
import {
  listReportConfigs,
  getReportConfigById,
  createReportConfig,
  updateReportConfig,
  deleteReportConfig,
  getMenuConfigs,
  setReportConfigStatus,
  reportConfigCreateSchema,
  filterConfigSchema,
  validateReportQuery,
  parseStartRowFromTemplate,
  sanitizeReportConfig,
} from '../../services/financial/reportConfigService';
import { configService } from '../../services/management/configService';
import { getFRSConfig } from '../../config/frsConfig';

// ============================================================================
// Multer setup for template upload (.xlsx only)
// ============================================================================

const xlsxStorage = multer.diskStorage({
  destination: async (_req, _file, cb) => {
    const dir = await configService.get('report_template_path', './storage/report-templates');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    // Deterministic disk filename: template-{configId}.{ext}
    // The original filename is stored in DB (template_filename field) for display.
    const configId = req.params.id ?? 'unknown';
    const ext = path.extname(file.originalname).toLowerCase() || '.xlsx';
    cb(null, `template-${configId}${ext}`);
  },
});

const xlsxFileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const mime = file.mimetype;
  const validExts = ['.xlsx'];
  const validMimes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/octet-stream',
  ];

  if (validExts.includes(ext) && (validMimes.includes(mime) || mime.includes('spreadsheet'))) {
    cb(null, true);
  } else {
    const err = new Error('Only .xlsx files are allowed') as any;
    err.code = 'LIMIT_FILE_TYPES';
    err.status = 400;
    cb(err);
  }
};

const uploadTemplate = multer({
  storage: xlsxStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB max
  fileFilter: xlsxFileFilter,
}).single('template');

// ============================================================================
// Schema cache — avoids hammering information_schema on every panel open
// ============================================================================

interface SchemaCache {
  tables: unknown[];
  expiresAt: number;
}

const schemaCache = new Map<string, SchemaCache>();
const SCHEMA_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// ============================================================================
// Rate limiter for sensitive query-execution endpoints
// Stricter than the global limiter — uses RATE_LIMIT_QUERY_MAX from env
// (default: 20 requests per RATE_LIMIT_WINDOW_MS per user)
// ============================================================================

const _cfg = getFRSConfig();

const queryExecutionLimiter = rateLimit({
  windowMs: _cfg.RATE_LIMIT_QUERY_WINDOW_MS,
  max: _cfg.RATE_LIMIT_QUERY_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => _cfg.RATE_LIMIT_QUERY_MAX === 0,
  // Key by userId — all endpoints require authentication so userId is always present.
  // Avoid using req.ip to prevent ERR_ERL_KEY_GEN_IPV6 validation error.
  keyGenerator: (req) => (req as Request).user?.userId ?? 'anonymous',
  message: {
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Terlalu banyak permintaan query. Tunggu sebentar sebelum mencoba lagi.',
    },
  },
});

// ============================================================================
// Router factory
// ============================================================================
// Helpers
// ============================================================================

/**
 * Maps common PostgreSQL type OIDs to friendly type names.
 * Falls back to the numeric OID string for unknown types.
 */
function pgTypeOidToName(oid: number): string {
  const map: Record<number, string> = {
    16: 'bool', 17: 'bytea', 18: 'char', 19: 'name', 20: 'int8',
    21: 'int2', 23: 'int4', 25: 'text', 26: 'oid', 114: 'json',
    142: 'xml', 700: 'float4', 701: 'float8', 790: 'money',
    869: 'inet', 1042: 'bpchar', 1043: 'varchar', 1082: 'date',
    1083: 'time', 1114: 'timestamp', 1184: 'timestamptz',
    1186: 'interval', 1700: 'numeric', 2950: 'uuid', 3802: 'jsonb',
  };
  return map[oid] ?? `oid:${oid}`;
}

// ============================================================================

export function createReportConfigsRouter(): Router {
  const router = Router();

  /**
   * GET /api/frs/report-configs/menu
   * Returns active report configs accessible by the current user's roles.
   * No special permission required — just authenticated (authenticate is applied at index level).
   * MUST be registered before /:id to avoid route conflict.
   */
  router.get(
    '/menu',
    asyncHandler(async (req: Request, res: Response) => {
      const user = req.user!;

      // Build the list of role names for this user.
      // The JWT payload carries the primary roleName; we also include the role enum value
      // so that allowed_roles can be matched against either form.
      const userRoles: string[] = [];
      if (user.roleName) userRoles.push(user.roleName);
      if (user.role && !userRoles.includes(user.role)) userRoles.push(user.role);

      const configs = await getMenuConfigs(userRoles);
      res.json(configs);
    }),
  );

  /**
   * GET /api/frs/report-configs
   * List all report configs with optional search and pagination.
   * Requires: public.report_configs.read
   */
  router.get(
    '/',
    requirePermission('public.report_configs.read'),
    asyncHandler(async (req: Request, res: Response) => {
      const search = req.query.search as string | undefined;
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 25;

      const result = await listReportConfigs({ search, page, pageSize });
      res.json(result);
    }),
  );

  /**
   * GET /api/frs/report-configs/template-path
   * Returns the configured report template storage path from system_configs.
   * MUST be registered before /:id to avoid route conflict.
   * Requires: public.report_configs.write
   */
  router.get(
    '/template-path',
    requirePermission('public.report_configs.write'),
    asyncHandler(async (_req: Request, res: Response) => {
      const templatePath = await configService.get('report_template_path', './storage/report-templates');
      res.json({ path: templatePath });
    }),
  );

  /**
   * GET /api/frs/report-configs/schema
   * Returns list of tables and their columns from information_schema.
   * Used by the query editor for autocomplete and table browser.
   * MUST be registered before /:id to avoid route conflict.
   * Requires: public.report_configs.write
   */
  router.get(
    '/schema',
    requirePermission('public.report_configs.write'),
    asyncHandler(async (req: Request, res: Response) => {
      const { readonlyPool } = await import('../../db/readonlyConnection');

      // Serve from cache if still fresh
      const cacheKey = 'schema';
      const cached = schemaCache.get(cacheKey);
      if (cached && Date.now() < cached.expiresAt) {
        res.json({ tables: cached.tables });
        return;
      }

      // Fetch tables from application schemas only (not system schemas)
      // Explicitly whitelist known app schemas to limit reconnaissance surface
      const tablesResult = await readonlyPool.query<{
        table_schema: string;
        table_name: string;
        table_type: string;
      }>(`
        SELECT table_schema, table_name, table_type
        FROM information_schema.tables
        WHERE table_schema IN ('public', 'cfd', 'crm')
          AND table_type IN ('BASE TABLE', 'VIEW')
        ORDER BY table_schema, table_name
      `);

      // Fetch columns for those tables
      const columnsResult = await readonlyPool.query<{
        table_schema: string;
        table_name: string;
        column_name: string;
        data_type: string;
        is_nullable: string;
      }>(`
        SELECT c.table_schema, c.table_name, c.column_name, c.data_type, c.is_nullable
        FROM information_schema.columns c
        WHERE c.table_schema IN ('public', 'cfd', 'crm')
        ORDER BY c.table_schema, c.table_name, c.ordinal_position
      `);

      // Group columns by schema.table
      const columnMap = new Map<string, Array<{ name: string; type: string; nullable: boolean }>>();
      for (const col of columnsResult.rows) {
        const key = `${col.table_schema}.${col.table_name}`;
        if (!columnMap.has(key)) columnMap.set(key, []);
        columnMap.get(key)!.push({
          name: col.column_name,
          type: col.data_type,
          nullable: col.is_nullable === 'YES',
        });
      }

      const tables = tablesResult.rows.map((t) => ({
        schema: t.table_schema,
        name: t.table_name,
        type: t.table_type === 'VIEW' ? 'view' : 'table',
        columns: columnMap.get(`${t.table_schema}.${t.table_name}`) ?? [],
      }));

      // Store in cache
      schemaCache.set(cacheKey, { tables, expiresAt: Date.now() + SCHEMA_CACHE_TTL_MS });

      res.json({ tables });
    }),
  );

  /**
   * POST /api/frs/report-configs/test-query
   * Executes a SQL query (SELECT only) against the readonly pool and returns
   * a preview of up to 10 rows plus the column list.
   * Used by the query editor "Test Query" button.
   * MUST be registered before /:id to avoid route conflict.
   * Requires: public.report_configs.write
   */
  router.post(
    '/test-query',
    requirePermission('public.report_configs.write'),
    queryExecutionLimiter,
    asyncHandler(async (req: Request, res: Response) => {
      const { query, filterValues = {} } = req.body as {
        query: string;
        filterValues?: Record<string, unknown>;
      };

      if (!query || typeof query !== 'string') {
        throw AppError.badRequest(ErrorCode.MISSING_REQUIRED_FIELD, 'query is required');
      }

      // Hard limit on query length to prevent memory exhaustion
      if (query.length > 10_000) {
        throw AppError.badRequest(ErrorCode.VALIDATION_ERROR, 'Query terlalu panjang (maks. 10.000 karakter)');
      }

      // Safety check — SELECT only
      const queryValidation = validateReportQuery(query);
      if (!queryValidation.valid) {
        throw AppError.badRequest(ErrorCode.INVALID_INPUT, queryValidation.error ?? 'Invalid query');
      }

      const { readonlyPool } = await import('../../db/readonlyConnection');
      const { buildParameterizedQuery } = await import('../../services/financial/reportOutputService');

      // Validate filters from body through filterConfigSchema before use
      const rawFilters = req.body.filters ?? [];
      const filtersResult = z.array(filterConfigSchema).safeParse(rawFilters);
      const filters = filtersResult.success ? filtersResult.data : [];
      const { sql: paramSql, params } = buildParameterizedQuery(query, filterValues, filters);

      // Add LIMIT 10 wrapper to prevent large result sets
      const limitedSql = `SELECT * FROM (${paramSql}) AS __test_query__ LIMIT 10`;

      // Log query for debugging
      console.log(`[TestQuery] user=${req.user!.userId} sql=${limitedSql} params=${JSON.stringify(params)}`);

      try {
        const result = await readonlyPool.query<Record<string, unknown>>(limitedSql, params);

        const columns = result.fields.map((f) => ({
          name: f.name,
          type: pgTypeOidToName(f.dataTypeID),
        }));

        res.json({
          success: true,
          rowCount: result.rowCount ?? result.rows.length,
          columns,
          rows: result.rows,
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        res.json({
          success: false,
          error: msg,
        });
      }
    }),
  );

  /**
   * GET /api/frs/report-configs/:id/retrieve
   * Returns a sanitized report config for generation (omits raw SQL).
   * Authorized if user has public.report_configs.read OR their role is in allowed_roles.
   * MUST be registered before /:id to avoid route conflict.
   */
  router.get(
    '/:id/retrieve',
    asyncHandler(async (req: Request, res: Response) => {
      const user = req.user!;
      const config = await getReportConfigById(req.params.id);
      if (!config) {
        throw AppError.notFound(ErrorCode.NOT_FOUND, 'Report config not found');
      }

      // Authorization check
      const userRoles: string[] = [];
      if (user.roleName) userRoles.push(user.roleName);
      if (user.role && !userRoles.includes(user.role)) userRoles.push(user.role);

      const hasAdminPermission = user.permissions?.includes('public.report_configs.read');
      const isAllowedRole = config.allowedRoles.some((role) => userRoles.includes(role));

      // If not admin and not allowed role, deny
      if (!hasAdminPermission && !isAllowedRole) {
        throw AppError.forbidden(ErrorCode.ACCESS_DENIED, 'Anda tidak memiliki akses ke laporan ini');
      }

      // If not admin, the report must be active
      if (!hasAdminPermission && !config.isActive) {
        throw AppError.forbidden(ErrorCode.ACCESS_DENIED, 'Laporan ini sedang tidak aktif');
      }

      // Sanitize: omit sensitive SQL queries
      res.json(sanitizeReportConfig(config));
    }),
  );

  /**
   * GET /api/frs/report-configs/:id
   * Get a single report config by ID.
   * Requires: public.report_configs.read
   */
  router.get(
    '/:id',
    requirePermission('public.report_configs.read'),
    asyncHandler(async (req: Request, res: Response) => {
      const config = await getReportConfigById(req.params.id);
      if (!config) {
        throw AppError.notFound(ErrorCode.NOT_FOUND, 'Report config not found');
      }
      res.json(config);
    }),
  );

  /**
   * POST /api/frs/report-configs
   * Create a new report config.
   * Validates with reportConfigCreateSchema + validateReportQuery.
   * Requires: public.report_configs.write
   */
  router.post(
    '/',
    requirePermission('public.report_configs.write'),
    asyncHandler(async (req: Request, res: Response) => {
      // Zod validation
      const parsed = reportConfigCreateSchema.safeParse(req.body);
      if (!parsed.success) {
        throw AppError.unprocessable(ErrorCode.VALIDATION_ERROR, 'Validation failed', {
          fields: parsed.error.flatten().fieldErrors,
        });
      }

      // Query safety validation
      const queryValidation = validateReportQuery(parsed.data.query);
      if (!queryValidation.valid) {
        throw AppError.badRequest(ErrorCode.INVALID_INPUT, queryValidation.error ?? 'Invalid query');
      }

      // Merge parsed.data with raw body arrays to prevent Zod .default([]) from
      // silently swallowing filters/allowedRoles when inner item validation fails.
      // Re-validate raw filters through filterConfigSchema to ensure safety.
      let safeFilters = parsed.data.filters;
      if (Array.isArray(req.body.filters) && req.body.filters.length > 0) {
        const rawFiltersResult = z.array(filterConfigSchema).safeParse(req.body.filters);
        safeFilters = rawFiltersResult.success ? rawFiltersResult.data : parsed.data.filters;
      }

      let safeAllowedRoles = parsed.data.allowedRoles;
      if (Array.isArray(req.body.allowedRoles) && req.body.allowedRoles.length > 0) {
        const rolesResult = z.array(z.string().min(1).max(100)).safeParse(req.body.allowedRoles);
        safeAllowedRoles = rolesResult.success ? rolesResult.data : parsed.data.allowedRoles;
      }

      const input = {
        ...parsed.data,
        filters: safeFilters,
        allowedRoles: safeAllowedRoles,
      };

      const result = await createReportConfig(input, req.user!.userId);
      if (result.error) {
        throw AppError.badRequest(ErrorCode.INVALID_INPUT, result.error);
      }

      res.status(201).json(result.config);
    }),
  );

  /**
   * PUT /api/frs/report-configs/:id
   * Update an existing report config.
   * Requires: public.report_configs.write
   */
  router.put(
    '/:id',
    requirePermission('public.report_configs.write'),
    asyncHandler(async (req: Request, res: Response) => {
      // Partial validation using the same schema (all fields optional for update)
      const updateSchema = reportConfigCreateSchema.partial();
      const parsed = updateSchema.safeParse(req.body);
      if (!parsed.success) {
        throw AppError.unprocessable(ErrorCode.VALIDATION_ERROR, 'Validation failed', {
          fields: parsed.error.flatten().fieldErrors,
        });
      }

      // If query is being updated, validate it
      if (parsed.data.query !== undefined) {
        const queryValidation = validateReportQuery(parsed.data.query);
        if (!queryValidation.valid) {
          throw AppError.badRequest(ErrorCode.INVALID_INPUT, queryValidation.error ?? 'Invalid query');
        }
      }

      // Only include fields that were explicitly sent in the request body.
      // This prevents Zod .default([]) from overwriting existing data with empty arrays
      // when a partial update (e.g. only startRow + templateFilename) is sent.
      const bodyKeys = Object.keys(req.body) as Array<keyof typeof parsed.data>;
      const partialInput: Partial<typeof parsed.data> = {};
      for (const key of bodyKeys) {
        if (key in parsed.data) {
          (partialInput as Record<string, unknown>)[key] = (parsed.data as Record<string, unknown>)[key];
        }
      }

      // Re-validate filters/allowedRoles from raw body if present
      if (Array.isArray(req.body.filters) && req.body.filters.length > 0) {
        const rawFiltersResult = z.array(filterConfigSchema).safeParse(req.body.filters);
        partialInput.filters = rawFiltersResult.success ? rawFiltersResult.data : partialInput.filters;
      }
      if (Array.isArray(req.body.allowedRoles) && req.body.allowedRoles.length > 0) {
        const rolesResult = z.array(z.string().min(1).max(100)).safeParse(req.body.allowedRoles);
        partialInput.allowedRoles = rolesResult.success ? rolesResult.data : partialInput.allowedRoles;
      }

      const result = await updateReportConfig(req.params.id, partialInput, req.user!.userId);
      if (result.error) {
        if (result.error === 'Report config not found') {
          throw AppError.notFound(ErrorCode.NOT_FOUND, 'Report config not found');
        }
        throw AppError.badRequest(ErrorCode.INVALID_INPUT, result.error);
      }

      res.json(result.config);
    }),
  );

  /**
   * PATCH /api/frs/report-configs/:id/status
   * Toggle is_active without opening a modal.
   * Requires: public.report_configs.write
   */
  router.patch(
    '/:id/status',
    requirePermission('public.report_configs.write'),
    asyncHandler(async (req: Request, res: Response) => {
      const { isActive } = req.body;

      if (typeof isActive !== 'boolean') {
        throw AppError.badRequest(
          ErrorCode.MISSING_REQUIRED_FIELD,
          'isActive (boolean) is required',
        );
      }

      const result = await setReportConfigStatus(req.params.id, isActive, req.user!.userId);
      if (result.error) {
        if (result.error === 'Report config not found') {
          throw AppError.notFound(ErrorCode.NOT_FOUND, 'Report config not found');
        }
        throw AppError.badRequest(ErrorCode.INVALID_INPUT, result.error);
      }

      res.json(result.config);
    }),
  );

  /**
   * DELETE /api/frs/report-configs/:id
   * Delete a report config and its associated template file.
   * Requires: public.report_configs.delete
   */
  router.delete(
    '/:id',
    requirePermission('public.report_configs.delete'),
    asyncHandler(async (req: Request, res: Response) => {
      // Fetch config first to get templateFilename before deleting
      const config = await getReportConfigById(req.params.id);
      if (!config) {
        throw AppError.notFound(ErrorCode.NOT_FOUND, 'Report config not found');
      }

      const result = await deleteReportConfig(req.params.id, req.user!.userId);
      if (!result.success) {
        throw AppError.badRequest(ErrorCode.INVALID_INPUT, result.error ?? 'Delete failed');
      }

      // Delete associated template file (best-effort — don't fail if file missing)
      if (config.templateFilename) {
        try {
          const templateDir = await configService.get('report_template_path', './storage/report-templates');
          // Disk filename is deterministic: template-{id}.{ext from original filename}
          const ext = path.extname(config.templateFilename).toLowerCase() || '.xlsx';
          const diskFilename = `template-${req.params.id}${ext}`;
          const templatePath = path.join(templateDir, diskFilename);
          if (fs.existsSync(templatePath)) {
            fs.unlinkSync(templatePath);
          }
        } catch (err) {
          console.warn('[ReportConfig] Could not delete template file:', config.templateFilename, err);
        }
      }

      res.json({ success: true });
    }),
  );

  /**
   * POST /api/frs/report-configs/:id/parse-template
   * Upload an .xlsx file and parse the start_row from it.
   * Requires: public.report_configs.write
   */
  router.post(
    '/:id/parse-template',
    requirePermission('public.report_configs.write'),
    (req, res, next) => {
      uploadTemplate(req, res, (err) => {
        if (err) {
          if (err instanceof multer.MulterError) {
            next(AppError.badRequest(ErrorCode.FILE_TOO_LARGE, `File upload error: ${err.message}`));
          } else if ((err as any).code === 'LIMIT_FILE_TYPES') {
            next(AppError.badRequest(ErrorCode.INVALID_FILE_TYPE, 'Only .xlsx files are allowed'));
          } else {
            next(err);
          }
          return;
        }
        next();
      });
    },
    asyncHandler(async (req: Request, res: Response) => {
      if (!req.file) {
        throw AppError.badRequest(ErrorCode.MISSING_REQUIRED_FIELD, 'No file uploaded');
      }

      // Verify the config exists
      const config = await getReportConfigById(req.params.id);
      if (!config) {
        // Clean up uploaded file
        fs.unlink(req.file.path, () => {});
        throw AppError.notFound(ErrorCode.NOT_FOUND, 'Report config not found');
      }

      const templatePath = req.file.path;
      const startRow = await parseStartRowFromTemplate(templatePath);
      // Store original filename in DB for display; disk file is template-{id}.{ext}
      const templateFilename = req.file.originalname;  // stored in DB
      const diskFilename = req.file.filename;           // actual file on disk

      res.json({
        templateFilename,   // original name → saved to DB
        diskFilename,       // disk name (for reference)
        templatePath: diskFilename,
        startRow,
      });
    }),
  );

  /**
   * GET /api/frs/report-configs/:id/template
   * Download the Excel template file for a report config.
   * Requires: public.report_configs.read
   */
  router.get(
    '/:id/template',
    requirePermission('public.report_configs.read'),
    asyncHandler(async (req: Request, res: Response) => {
      const config = await getReportConfigById(req.params.id);
      if (!config) {
        throw AppError.notFound(ErrorCode.NOT_FOUND, 'Report config not found');
      }
      if (!config.templateFilename) {
        throw AppError.notFound(ErrorCode.NOT_FOUND, 'No template file configured for this report');
      }

      const templateDir = await configService.get('report_template_path', './storage/report-templates');
      const ext = path.extname(config.templateFilename).toLowerCase() || '.xlsx';
      const diskFilename = `template-${req.params.id}${ext}`;
      const templatePath = path.join(templateDir, diskFilename);

      if (!fs.existsSync(templatePath)) {
        throw AppError.notFound(ErrorCode.NOT_FOUND, 'Template file not found on server');
      }

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(config.templateFilename)}"`);
      fs.createReadStream(templatePath).pipe(res);
    }),
  );

  return router;
}

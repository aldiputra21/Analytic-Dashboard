// src/routes/financial/reportOutputs.ts
// API routes for Dynamic Excel Report output generation and download
// Requirements: 5.8, 5.9, 6.1, 8.1, 8.6, 10.4, 10.5, 10.6

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../utils/asyncHandler';
import { AppError, ErrorCode } from '../../utils/errors';
import {
  createReportOutput,
  downloadReportOutput,
  getDropdownOptions,
} from '../../services/financial/reportOutputService';
import { getReportConfigById } from '../../services/financial/reportConfigService';

// ============================================================================
// Zod Schemas
// ============================================================================

/**
 * Schema for POST / — create a new report output (trigger generate).
 */
const createReportOutputSchema = z.object({
  configId: z.string().uuid('configId must be a valid UUID'),
  filterValues: z.record(z.string(), z.unknown()).default({}),
});

// ============================================================================
// Router factory
// ============================================================================

export function createReportOutputsRouter(): Router {
  const router = Router();

  /**
   * POST /api/frs/report-outputs
   * Trigger async generation of a report output.
   *
   * - Validates request body with Zod (422 if invalid)
   * - Verifies the report config exists and is active (404 if not)
   * - Verifies the requesting user's role is in allowed_roles (403 if not)
   * - Creates a report_outputs entry with status "pending"
   * - Returns 202 Accepted with { outputId }
   *
   * Requirements: 5.8, 5.9, 6.1, 10.5, 10.6
   */
  router.post(
    '/',
    asyncHandler(async (req: Request, res: Response) => {
      // Zod validation
      const parsed = createReportOutputSchema.safeParse(req.body);
      if (!parsed.success) {
        throw AppError.unprocessable(ErrorCode.VALIDATION_ERROR, 'Validation failed', {
          fields: parsed.error.flatten().fieldErrors,
        });
      }

      const { configId, filterValues } = parsed.data;
      const user = req.user!;

      // Fetch the report config to verify it exists and check allowed_roles
      const config = await getReportConfigById(configId);
      if (!config || !config.isActive) {
        throw AppError.notFound(ErrorCode.NOT_FOUND, 'Report config not found or inactive');
      }

      // Build the list of role names for this user (same pattern as reportConfigs /menu)
      const userRoles: string[] = [];
      if (user.roleName) userRoles.push(user.roleName);
      if (user.role && !userRoles.includes(user.role)) userRoles.push(user.role);

      // Verify user role is in allowed_roles (Requirements 10.5, 10.6)
      const allowedRoles = config.allowedRoles ?? [];
      if (allowedRoles.length > 0 && !userRoles.some((r) => allowedRoles.includes(r))) {
        throw AppError.forbidden(
          ErrorCode.AUTH_FORBIDDEN,
          'You do not have permission to generate this report',
        );
      }

      // Create the output record and trigger async processing (Requirement 6.1)
      // We store the language in filterValues so the background worker knows which labels to use
      const enrichedFilterValues = { ...filterValues, __language: req.headers['accept-language']?.startsWith('en') ? 'en' : 'id' };
      const output = await createReportOutput(configId, user.userId, enrichedFilterValues);

      // 202 Accepted — report is being processed asynchronously (Requirement 5.9)
      res.status(202).json({ outputId: output.id });
    }),
  );

  /**
   * GET /api/frs/report-outputs/:id/download
   * Download a completed report output file.
   *
   * - Verifies ownership: only the generating user can download (403 if not owner)
   * - Verifies the file exists on disk (404 if missing)
   * - Streams the file as an attachment
   * - If retention_type = 'immediate': deletes file and marks status "downloaded_deleted"
   *
   * Requirements: 8.1, 8.6
   */
  router.get(
    '/:id/download',
    asyncHandler(async (req: Request, res: Response) => {
      const { id } = req.params;
      const user = req.user!;

      // downloadReportOutput handles ownership check (403), file existence (404),
      // streaming, and post-download cleanup internally.
      await downloadReportOutput(id, user.userId, res);
    }),
  );

  /**
   * POST /api/frs/report-outputs/dropdown/:configId/:paramName
   * Fetch dropdown options for a filter of type "dropdown" with source "query".
   *
   * - Verifies the config exists and is active (404 if not)
   * - Verifies the requesting user's role is in allowed_roles (403 if not)
   * - Executes the filter's dropdownQuery via read-only connection
   * - Returns an array of { value, label } objects
   *
   * Requirements: 5.6, 10.4
   *
   * NOTE: This route MUST be registered before /:id/download to avoid
   * Express treating "dropdown" as an :id param. The router factory registers
   * routes in declaration order, so this is safe here.
   */
  router.post(
    '/dropdown/:configId/:paramName',
    asyncHandler(async (req: Request, res: Response) => {
      const { configId, paramName } = req.params;
      const user = req.user!;

      // Build user roles (same pattern as POST /)
      const userRoles: string[] = [];
      if (user.roleName) userRoles.push(user.roleName);
      if (user.role && !userRoles.includes(user.role)) userRoles.push(user.role);

      // getDropdownOptions handles config existence, role check, and query execution
      const options = await getDropdownOptions(configId, paramName, userRoles);

      res.json(options);
    }),
  );

  return router;
}

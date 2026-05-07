// src/routes/financial/export.ts

import { Router, Request, Response } from 'express';
import { requirePermission } from '../../middleware/rbac.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { AppError, ErrorCode } from '../../utils/errors.js';
import { generateExport, generateExportFilename } from '../../services/financial/frsExportService.js';

/**
 * Permission mapping for entity types
 */
const ENTITY_PERMISSION_MAP: Record<string, string> = {
  balance_sheet: 'cfd.balance_sheets.read',
  income_statement: 'cfd.income_statements.read',
  target: 'public.targets.read',
  weekly_cash_flow: 'cfd.weekly_cash_flows.read',
  realization: 'cfd.realizations.read',
  cash_flow_projection: 'cfd.cash_flow_projections.read',
  bank_loan: 'cfd.bank_loans.read',
  corporate: 'cfd.corporates.read',
  department: 'public.departments.read',
  cost_center: 'cfd.cost_centers.read',
  project: 'public.projects.read',
};

export function createExportRouter(): Router {
  const router = Router();

  /**
   * GET /api/frs/export/:entity_type
   * Export data to Excel or CSV
   * 
   * Query params:
   * - format: xlsx | csv (default: xlsx)
   * - lang: id | en (default: id)
   * - filters: JSON string with filter criteria
   * 
   * Requirements: 1.2, 1.4, Design Section 3.1
   */
  router.get('/:entity_type', asyncHandler(async (req: Request, res: Response) => {
    const { entity_type } = req.params;
    const format = (req.query.format as string) || 'xlsx';
    const lang = (req.query.lang as string) || 'id';
    const filtersParam = req.query.filters as string;

    // Validate entity type
    const permission = ENTITY_PERMISSION_MAP[entity_type];
    if (!permission) {
      throw AppError.badRequest(
        ErrorCode.INVALID_INPUT,
        `Unsupported entity type: ${entity_type}`
      );
    }

    // Verify permission
    const hasPermission = req.user?.permissions?.includes(permission);
    if (!hasPermission) {
      throw AppError.forbidden(
        ErrorCode.ACCESS_DENIED,
        `Permission ${permission} required for export`
      );
    }

    // Validate format
    if (format !== 'xlsx' && format !== 'csv') {
      throw AppError.badRequest(
        ErrorCode.INVALID_INPUT,
        'Format must be xlsx or csv'
      );
    }

    // Validate language
    if (lang !== 'id' && lang !== 'en') {
      throw AppError.badRequest(
        ErrorCode.INVALID_INPUT,
        'Language must be id or en'
      );
    }

    // Parse filters
    let filters: Record<string, any> = {};
    if (filtersParam) {
      try {
        filters = JSON.parse(filtersParam);
      } catch (error) {
        throw AppError.badRequest(
          ErrorCode.INVALID_INPUT,
          'Invalid filters JSON'
        );
      }
    }

    // Get corporate IDs from access context for RBAC
    const access = req.accessContext!;
    const corporateIds = access.hasFullCorporateAccess ? undefined : access.corporateIds;

    // Generate export
    const buffer = await generateExport({
      entityType: entity_type as any,
      format: format as 'xlsx' | 'csv',
      language: lang as 'id' | 'en',
      filters,
      corporateIds,
    });

    // Generate filename
    const filename = generateExportFilename(
      entity_type as any,
      lang as 'id' | 'en',
      format as 'xlsx' | 'csv'
    );

    // Set response headers
    const mimeType = format === 'xlsx'
      ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      : 'text/csv';

    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', buffer.length);

    // Send file
    res.send(buffer);
  }));

  return router;
}

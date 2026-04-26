// Financial Data Routes (read-only from view + bulk import)
// Requirements: 2.3, 11.1, 11.3, 11.4, 11.5, 11.6
//
// NOTE: CUD operations (create/update/delete) on raw financial data have been removed.
// Data entry now goes through financialStatements routes (balance sheet, income statement, cash flow).
// This router now provides read-only access via the v_financial_summary view + bulk import.

import { Router, Request, Response } from 'express';
import multer from 'multer';
import { requirePermission, requireSubsidiaryAccess } from '../../middleware/rbac';
import { asyncHandler } from '../../utils/asyncHandler';
import {
  queryFinancialData,
  getFinancialDataById,
} from '../../services/financial/financialDataService';
import { createFRSAuditLog } from '../../services/financial/auditLogService';
import { getUserSubsidiaryIds } from '../../services/financial/permissionService';
import { db } from '../../db/connection';
import { userCorporateAccesses } from '../../db/schema/public';
import { eq } from 'drizzle-orm';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

export function createFinancialDataRouter(): Router {
  const router = Router();


  /**
   * GET /api/frs/financial-data
   * Query financial data (from v_financial_summary view) with filters.
   */
  router.get('/', requirePermission('cfd.reports.read'), requireSubsidiaryAccess(), asyncHandler(async (req: Request, res: Response) => {
    const { corporateId, departmentId, period, limit, offset } = req.query as any;

    if (!corporateId) {
      const subsidiaryIds = await getUserSubsidiaryIds(req.user!.userId);
      const data = await queryFinancialData({
        corporateId: subsidiaryIds,
        departmentId,
        period,
        limit: limit ? parseInt(limit) : undefined,
        offset: offset ? parseInt(offset) : undefined,
      } as any);
      res.json(data);
      return;
    }

    const data = await queryFinancialData({
      corporateId,
      departmentId,
      period,
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined,
    });

    res.json(data);
  }));

  /**
   * GET /api/frs/financial-data/:id
   * Get a single financial data entry (from v_financial_summary view).
   */
  router.get('/:id', requirePermission('cfd.reports.read'), asyncHandler(async (req: Request, res: Response) => {
    const data = await getFinancialDataById(req.params.id);
    if (!data) {
      res.status(404).json({
        error: { code: 'FRS_NOT_FOUND', message: 'Financial data not found', timestamp: new Date().toISOString(), requestId: '' },
      });
      return;
    }
    res.json(data);
  }));

  return router;
}

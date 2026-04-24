// Financial Data Routes (read-only from view + bulk import)
// Requirements: 2.3, 11.1, 11.3, 11.4, 11.5, 11.6
//
// NOTE: CUD operations (create/update/delete) on raw financial data have been removed.
// Data entry now goes through financialStatements routes (balance sheet, income statement, cash flow).
// This router now provides read-only access via the v_financial_summary view + bulk import.

import { Router, Request, Response } from 'express';
import multer from 'multer';
import { requirePermission, requireSubsidiaryAccess } from '../../middleware/rbac';
import {
  queryFinancialData,
  getFinancialDataById,
} from '../../services/financial/financialDataService';
import { createFRSAuditLog } from '../../services/financial/auditLogService';
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
  router.get('/', requirePermission('cfd.reports.read'), async (req: Request, res: Response) => {
    const { corporateId, departmentId, period, limit, offset } = req.query as any;

    // subsidiary_manager: restrict to their corporates
    if (req.user!.role === 'subsidiary_manager' && !corporateId) {
      const accessRows = await db
        .select({ corporateId: userCorporateAccesses.corporateId })
        .from(userCorporateAccesses)
        .where(eq(userCorporateAccesses.userId, req.user!.userId));
      if (accessRows.length === 0) {
        res.json([]);
        return;
      }
      // Return data for all their corporates
      const allData: any[] = [];
      for (const r of accessRows) {
        const rows = await queryFinancialData({ corporateId: r.corporateId, departmentId, period });
        allData.push(...rows);
      }
      res.json(allData);
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
  });

  /**
   * GET /api/frs/financial-data/:id
   * Get a single financial data entry (from v_financial_summary view).
   */
  router.get('/:id', requirePermission('cfd.reports.read'), async (req: Request, res: Response) => {
    const data = await getFinancialDataById(req.params.id);
    if (!data) {
      res.status(404).json({
        error: { code: 'FRS_NOT_FOUND', message: 'Financial data not found', timestamp: new Date().toISOString(), requestId: '' },
      });
      return;
    }
    res.json(data);
  });

  return router;
}

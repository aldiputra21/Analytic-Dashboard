// Financial Data Routes (read-only from view + bulk import)
// Requirements: 2.3, 11.1, 11.3, 11.4, 11.5, 11.6
//
// NOTE: CUD operations (create/update/delete) on raw financial data have been removed.
// Data entry now goes through financialStatements routes (balance sheet, income statement, cash flow).
// This router now provides read-only access via the v_financial_summary view + bulk import.

import { Router, Request, Response } from 'express';
import multer from 'multer';
import { requireFRSAuth } from '../../middleware/frsAuth';
import { authorize } from '../../middleware/frsRbac';
import {
  queryFinancialData,
  getFinancialDataById,
} from '../../services/financial/financialDataService';
import { processBulkImport } from '../../services/financial/bulkImportService';
import { createFRSAuditLog } from '../../services/financial/auditLogService';
import { db } from '../../db/connection';
import { userCorporateAccesses } from '../../db/schema/public';
import { eq } from 'drizzle-orm';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

export function createFinancialDataRouter(): Router {
  const router = Router();

  router.use(requireFRSAuth);

  /**
   * POST /api/frs/financial-data/bulk
   * Bulk import financial data from CSV or Excel file.
   * Requirements: 2.4, 2.5
   */
  router.post('/bulk', authorize('financial_data', 'write'), upload.single('file'), async (req: Request, res: Response) => {
    if (!req.file) {
      res.status(400).json({
        error: { code: 'FRS_VALIDATION_ERROR', message: 'A file is required (field name: file)', timestamp: new Date().toISOString(), requestId: '' },
      });
      return;
    }

    const result = await processBulkImport(req.file.buffer, req.file.mimetype, req.frsUser!.userId);

    await createFRSAuditLog({
      userId: req.frsUser!.userId,
      action: 'create',
      entityType: 'financial_data_bulk',
      newValues: { successCount: result.successCount, errorCount: result.errorCount },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.status(result.errorCount > 0 && result.successCount === 0 ? 422 : 200).json(result);
  });

  /**
   * GET /api/frs/financial-data
   * Query financial data (from v_financial_summary view) with filters.
   */
  router.get('/', authorize('financial_data', 'read'), async (req: Request, res: Response) => {
    const { corporateId, departmentId, period, limit, offset } = req.query as any;

    // subsidiary_manager: restrict to their corporates
    if (req.frsUser!.role === 'subsidiary_manager' && !corporateId) {
      const accessRows = await db
        .select({ corporateId: userCorporateAccesses.corporateId })
        .from(userCorporateAccesses)
        .where(eq(userCorporateAccesses.userId, req.frsUser!.userId));
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
  router.get('/:id', authorize('financial_data', 'read'), async (req: Request, res: Response) => {
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

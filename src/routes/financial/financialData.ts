// Financial Data CRUD Routes
// Requirements: 2.3, 11.1, 11.3, 11.4, 11.5, 11.6

import { Router, Request, Response } from 'express';
import Database from 'better-sqlite3';
import multer from 'multer';
import { requireFRSAuth } from '../../middleware/frsAuth';
import { authorize, requireSubsidiaryAccess } from '../../middleware/frsRbac';
import { validateFinancialData } from '../../services/financial/dataValidator';
import {
  createFinancialData,
  queryFinancialData,
  getFinancialDataById,
  updateFinancialData,
  deleteFinancialData,
  getFinancialDataHistory,
} from '../../services/financial/financialDataService';
import { calculateAndStoreRatios } from '../../services/financial/ratioCalculator';
import {
  evaluateAlerts,
  checkNegativeOCF,
  detectDecliningTrend,
  detectUnusualDataPatterns,
} from '../../services/financial/alertEngine';
import { processBulkImport } from '../../services/financial/bulkImportService';
import { createFRSAuditLog } from '../../services/financial/auditLogService';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

export function createFinancialDataRouter(db: Database.Database): Router {
  const router = Router();

  router.use(requireFRSAuth);

  /**
   * POST /api/frs/financial-data/bulk
   * Bulk import financial data from CSV or Excel file.
   * Requirements: 2.4, 2.5
   */
  router.post('/bulk', authorize('financial_data', 'write', db), upload.single('file'), (req: Request, res: Response) => {
    if (!req.file) {
      res.status(400).json({
        error: { code: 'FRS_VALIDATION_ERROR', message: 'A file is required (field name: file)', timestamp: new Date().toISOString(), requestId: '' },
      });
      return;
    }

    const result = processBulkImport(db, req.file.buffer, req.file.mimetype, req.frsUser!.userId);

    createFRSAuditLog(db, {
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
   * POST /api/frs/financial-data
   * Create a financial data entry, trigger ratio calculation.
   */
  router.post('/', authorize('financial_data', 'write', db), (req: Request, res: Response) => {
    const input = req.body;

    // Convert date strings to Date objects
    if (input.periodStartDate) input.periodStartDate = new Date(input.periodStartDate);
    if (input.periodEndDate) input.periodEndDate = new Date(input.periodEndDate);

    const validation = validateFinancialData(input);
    if (!validation.valid) {
      res.status(422).json({
        error: {
          code: 'FRS_VALIDATION_ERROR',
          message: 'Financial data validation failed',
          details: validation.errors,
          timestamp: new Date().toISOString(),
          requestId: '',
        },
      });
      return;
    }

    const result = createFinancialData(db, input, req.frsUser!.userId);
    if (result.error) {
      res.status(409).json({
        error: { code: 'FRS_DUPLICATE_ENTRY', message: result.error, timestamp: new Date().toISOString(), requestId: '' },
      });
      return;
    }

    const data = result.data!;

    // Trigger ratio calculation (Req 2.3)
    const ratios = calculateAndStoreRatios(db, data);

    // Trigger alert evaluation (Req 5.1 - 5.7, 11.8)
    evaluateAlerts(db, data.subsidiaryId, data.id, ratios, data.periodType);
    checkNegativeOCF(db, data.subsidiaryId, data.id, data.operatingCashFlow);
    detectDecliningTrend(db, data.subsidiaryId, data.id);
    detectUnusualDataPatterns(db, data.subsidiaryId, data.id, data.periodType);

    createFRSAuditLog(db, {
      userId: req.frsUser!.userId,
      action: 'create',
      entityType: 'financial_data',
      entityId: data.id,
      subsidiaryId: data.subsidiaryId,
      newValues: { periodType: data.periodType, periodStartDate: data.periodStartDate },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.status(201).json({ data, ratios });
  });

  /**
   * GET /api/frs/financial-data
   * Query financial data with filters.
   */
  router.get('/', authorize('financial_data', 'read', db), (req: Request, res: Response) => {
    const { subsidiaryId, periodType, startDate, endDate, limit, offset } = req.query as any;

    // subsidiary_manager: restrict to their subsidiaries
    let effectiveSubsidiaryId = subsidiaryId;
    if (req.frsUser!.role === 'subsidiary_manager' && !subsidiaryId) {
      const accessRows = db
        .prepare('SELECT subsidiary_id FROM frs_user_subsidiary_access WHERE user_id = ?')
        .all(req.frsUser!.userId) as any[];
      if (accessRows.length === 0) {
        res.json([]);
        return;
      }
      // Return data for all their subsidiaries
      const allData = accessRows.flatMap((r) =>
        queryFinancialData(db, { subsidiaryId: r.subsidiary_id, periodType, startDate, endDate })
      );
      res.json(allData);
      return;
    }

    const data = queryFinancialData(db, {
      subsidiaryId: effectiveSubsidiaryId,
      periodType,
      startDate,
      endDate,
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined,
    });

    res.json(data);
  });

  /**
   * GET /api/frs/financial-data/:id
   * Get a single financial data entry.
   */
  router.get('/:id', authorize('financial_data', 'read', db), (req: Request, res: Response) => {
    const data = getFinancialDataById(db, req.params.id);
    if (!data) {
      res.status(404).json({
        error: { code: 'FRS_NOT_FOUND', message: 'Financial data not found', timestamp: new Date().toISOString(), requestId: '' },
      });
      return;
    }
    res.json(data);
  });

  /**
   * PUT /api/frs/financial-data/:id
   * Update a financial data entry with versioning and historical protection.
   */
  router.put('/:id', authorize('financial_data', 'write', db), (req: Request, res: Response) => {
    const input = req.body;

    const result = updateFinancialData(db, req.params.id, input, req.frsUser!.userId, req.frsUser!.role);
    if (result.error) {
      const isNotFound = result.error === 'Financial data not found';
      res.status(isNotFound ? 404 : 422).json({
        error: {
          code: isNotFound ? 'FRS_NOT_FOUND' : 'FRS_VALIDATION_ERROR',
          message: result.error,
          timestamp: new Date().toISOString(),
          requestId: '',
        },
      });
      return;
    }

    const data = result.data!;

    // Recalculate ratios after update (Req 11.5)
    const ratios = calculateAndStoreRatios(db, data);

    // Re-evaluate alerts after update (Req 15.4)
    evaluateAlerts(db, data.subsidiaryId, data.id, ratios, data.periodType);
    checkNegativeOCF(db, data.subsidiaryId, data.id, data.operatingCashFlow);
    detectDecliningTrend(db, data.subsidiaryId, data.id);

    createFRSAuditLog(db, {
      userId: req.frsUser!.userId,
      action: 'update',
      entityType: 'financial_data',
      entityId: data.id,
      subsidiaryId: data.subsidiaryId,
      newValues: { version: data.version, isRestated: data.isRestated },
      justification: input.restatementReason,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.json({ data, ratios });
  });

  /**
   * DELETE /api/frs/financial-data/:id
   * Delete a financial data entry.
   */
  router.delete('/:id', authorize('financial_data', 'delete', db), (req: Request, res: Response) => {
    const existing = getFinancialDataById(db, req.params.id);
    if (!existing) {
      res.status(404).json({
        error: { code: 'FRS_NOT_FOUND', message: 'Financial data not found', timestamp: new Date().toISOString(), requestId: '' },
      });
      return;
    }

    const result = deleteFinancialData(db, req.params.id);
    if (!result.success) {
      res.status(500).json({
        error: { code: 'FRS_SERVER_ERROR', message: result.error, timestamp: new Date().toISOString(), requestId: '' },
      });
      return;
    }

    createFRSAuditLog(db, {
      userId: req.frsUser!.userId,
      action: 'delete',
      entityType: 'financial_data',
      entityId: req.params.id,
      subsidiaryId: existing.subsidiaryId,
      oldValues: { periodType: existing.periodType, periodStartDate: existing.periodStartDate },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.json({ success: true });
  });

  /**
   * GET /api/frs/financial-data/:id/history
   * Get version history for a financial data entry.
   */
  router.get('/:id/history', authorize('financial_data', 'read', db), (req: Request, res: Response) => {
    const existing = getFinancialDataById(db, req.params.id);
    if (!existing) {
      res.status(404).json({
        error: { code: 'FRS_NOT_FOUND', message: 'Financial data not found', timestamp: new Date().toISOString(), requestId: '' },
      });
      return;
    }

    const history = getFinancialDataHistory(db, req.params.id);
    res.json(history);
  });

  return router;
}

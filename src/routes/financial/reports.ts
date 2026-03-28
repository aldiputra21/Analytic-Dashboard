// Reports API Routes
// Requirements: 7.1, 7.3, 7.4, 7.5, 7.7, 10.1, 10.3, 10.4, 10.5, 10.6, 10.8

import { Router, Request, Response } from 'express';
import Database from 'better-sqlite3';
import { requireFRSAuth } from '../../middleware/frsAuth';
import { authorize } from '../../middleware/frsRbac';
import { generateConsolidatedReport } from '../../services/financial/reportGenerator';
import { exportToCSV, exportToExcel, exportToPDF } from '../../services/financial/exportService';
import {
  createScheduledReport,
  listScheduledReports,
  deleteScheduledReport,
} from '../../services/financial/scheduledReportService';
import { PeriodType } from '../../types/financial/financialData';

export function createReportsRouter(db: Database.Database): Router {
  const router = Router();
  router.use(requireFRSAuth);

  /**
   * GET /api/frs/reports/consolidated
   * Generate a consolidated report for a given period.
   * Requirements: 7.1, 7.3, 7.4, 7.5, 7.7
   */
  router.get('/consolidated', authorize('reports', 'read', db), (req: Request, res: Response) => {
    const { periodType, startDate, endDate } = req.query as Record<string, string>;

    if (!periodType || !startDate || !endDate) {
      res.status(400).json({
        error: {
          code: 'FRS_VALIDATION_ERROR',
          message: 'periodType, startDate, and endDate are required',
          timestamp: new Date().toISOString(),
          requestId: Math.random().toString(36).slice(2),
        },
      });
      return;
    }

    const report = generateConsolidatedReport(
      db,
      periodType as PeriodType,
      startDate,
      endDate
    );

    res.json(report);
  });

  /**
   * GET /api/frs/reports/export
   * Export financial ratio data in CSV, Excel, or PDF format.
   * Requirements: 10.1, 10.3, 10.4, 10.8
   */
  router.get('/export', authorize('reports', 'export', db), async (req: Request, res: Response) => {
    const { format, subsidiaryId, periodType, startDate, endDate } = req.query as Record<string, string>;

    if (!format || !['csv', 'excel', 'pdf'].includes(format)) {
      res.status(400).json({
        error: {
          code: 'FRS_VALIDATION_ERROR',
          message: 'format must be one of: csv, excel, pdf',
          timestamp: new Date().toISOString(),
          requestId: Math.random().toString(36).slice(2),
        },
      });
      return;
    }

    // Access control: subsidiary_manager can only export their subsidiaries
    let allowedSubsidiaryIds: string[] | null = null;
    if (req.frsUser!.role === 'subsidiary_manager') {
      const accessRows = db
        .prepare('SELECT subsidiary_id FROM frs_user_subsidiary_access WHERE user_id = ?')
        .all(req.frsUser!.userId) as any[];
      allowedSubsidiaryIds = accessRows.map((r) => r.subsidiary_id);
    }

    // Fetch ratio data with filters
    let sql = `
      SELECT cr.*, fd.period_type, fd.period_start_date, fd.period_end_date,
             s.name as subsidiary_name
      FROM frs_calculated_ratios cr
      JOIN frs_financial_data fd ON cr.financial_data_id = fd.id
      JOIN subsidiaries s ON cr.subsidiary_id = s.id
      WHERE s.is_active = 1
    `;
    const params: any[] = [];

    if (subsidiaryId) {
      sql += ' AND cr.subsidiary_id = ?';
      params.push(subsidiaryId);
    }
    if (allowedSubsidiaryIds) {
      if (allowedSubsidiaryIds.length === 0) {
        res.json({ message: 'No data available for export' });
        return;
      }
      const placeholders = allowedSubsidiaryIds.map(() => '?').join(',');
      sql += ` AND cr.subsidiary_id IN (${placeholders})`;
      params.push(...allowedSubsidiaryIds);
    }
    if (periodType) {
      sql += ' AND fd.period_type = ?';
      params.push(periodType);
    }
    if (startDate) {
      sql += ' AND fd.period_start_date >= ?';
      params.push(startDate);
    }
    if (endDate) {
      sql += ' AND fd.period_end_date <= ?';
      params.push(endDate);
    }
    sql += ' ORDER BY fd.period_start_date DESC';

    const rows = db.prepare(sql).all(...params) as any[];

    // Metadata for export (Req 10.4)
    const metadata = {
      exportDate: new Date().toISOString(),
      periodRange: startDate && endDate ? `${startDate} to ${endDate}` : 'All periods',
      exportedBy: req.frsUser!.username,
    };

    // Log export to audit log (Req 10.7)
    db.prepare(`
      INSERT INTO frs_audit_log (id, user_id, action, entity_type, new_values, created_at)
      VALUES (?, ?, 'export', 'financial_ratios', ?, ?)
    `).run(
      `al_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      req.frsUser!.userId,
      JSON.stringify({ format, subsidiaryId, periodType, startDate, endDate }),
      new Date().toISOString()
    );

    try {
      if (format === 'csv') {
        const csv = exportToCSV(rows, metadata);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="financial-ratios-${Date.now()}.csv"`);
        res.send(csv);
      } else if (format === 'excel') {
        const buffer = exportToExcel(rows, metadata);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="financial-ratios-${Date.now()}.xlsx"`);
        res.send(buffer);
      } else if (format === 'pdf') {
        const pdfBuffer = await exportToPDF(rows, metadata);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="financial-ratios-${Date.now()}.pdf"`);
        res.send(pdfBuffer);
      }
    } catch (err: any) {
      res.status(500).json({
        error: {
          code: 'FRS_EXPORT_ERROR',
          message: err.message ?? 'Export failed',
          timestamp: new Date().toISOString(),
          requestId: Math.random().toString(36).slice(2),
        },
      });
    }
  });

  /**
   * POST /api/frs/reports/schedule
   * Create a scheduled report.
   * Requirements: 10.5
   */
  router.post('/schedule', authorize('reports', 'schedule', db), (req: Request, res: Response) => {
    const { name, reportType, subsidiaryIds, periodType, format, scheduleFrequency, scheduleDay, recipients } = req.body;

    if (!name || !reportType || !periodType || !format || !scheduleFrequency || !scheduleDay || !recipients) {
      res.status(400).json({
        error: {
          code: 'FRS_VALIDATION_ERROR',
          message: 'name, reportType, periodType, format, scheduleFrequency, scheduleDay, and recipients are required',
          timestamp: new Date().toISOString(),
          requestId: Math.random().toString(36).slice(2),
        },
      });
      return;
    }

    const result = createScheduledReport(db, {
      name,
      reportType,
      subsidiaryIds: subsidiaryIds ?? [],
      periodType,
      format,
      scheduleFrequency,
      scheduleDay,
      recipients: Array.isArray(recipients) ? recipients : [recipients],
    }, req.frsUser!.userId);

    if (result.error) {
      res.status(400).json({
        error: { code: 'FRS_VALIDATION_ERROR', message: result.error, timestamp: new Date().toISOString(), requestId: Math.random().toString(36).slice(2) },
      });
      return;
    }

    res.status(201).json(result.report);
  });

  /**
   * GET /api/frs/reports/scheduled
   * List all scheduled reports.
   * Requirements: 10.5
   */
  router.get('/scheduled', authorize('reports', 'read', db), (_req: Request, res: Response) => {
    const reports = listScheduledReports(db);
    res.json(reports);
  });

  /**
   * DELETE /api/frs/reports/schedule/:id
   * Delete a scheduled report.
   * Requirements: 10.5
   */
  router.delete('/schedule/:id', authorize('reports', 'schedule', db), (req: Request, res: Response) => {
    const result = deleteScheduledReport(db, req.params.id);
    if (!result.success) {
      res.status(404).json({
        error: { code: 'FRS_NOT_FOUND', message: result.error, timestamp: new Date().toISOString(), requestId: Math.random().toString(36).slice(2) },
      });
      return;
    }
    res.status(204).send();
  });

  return router;
}

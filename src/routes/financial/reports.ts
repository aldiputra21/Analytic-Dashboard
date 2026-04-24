// Reports API Routes
// Requirements: 7.1, 7.3, 7.4, 7.5, 7.7, 10.1, 10.3, 10.4, 10.5, 10.6, 10.8

import { Router, Request, Response } from 'express';
import { requirePermission } from '../../middleware/rbac';
import { generateConsolidatedReport } from '../../services/financial/reportGenerator';
import { exportToCSV, exportToExcel, exportToPDF } from '../../services/financial/exportService';
import {
  createScheduledReport,
  listScheduledReports,
  deleteScheduledReport,
} from '../../services/financial/scheduledReportService';
import { createFRSAuditLog } from '../../services/financial/auditLogService';
import { db } from '../../db/connection';
import { userCorporateAccesses, corporates } from '../../db/schema/public';
import { eq, and, sql as sqlTag } from 'drizzle-orm';

export function createReportsRouter(): Router {
  const router = Router();

  /**
   * GET /api/frs/reports/consolidated
   * Generate a consolidated report for a given period.
   * Requirements: 7.1, 7.3, 7.4, 7.5, 7.7
   */
  router.get('/consolidated', requirePermission('cfd.reports.read'), async (req: Request, res: Response) => {
    const { period } = req.query as Record<string, string>;

    if (!period) {
      res.status(400).json({
        error: {
          code: 'FRS_VALIDATION_ERROR',
          message: 'period is required',
          timestamp: new Date().toISOString(),
          requestId: Math.random().toString(36).slice(2),
        },
      });
      return;
    }

    const report = await generateConsolidatedReport(period);

    res.json(report);
  });

  /**
   * GET /api/frs/reports/export
   * Export financial ratio data in CSV, Excel, or PDF format.
   * Requirements: 10.1, 10.3, 10.4, 10.8
   */
  router.get('/export', requirePermission('cfd.reports.export'), async (req: Request, res: Response) => {
    const { format, corporateId, startDate, endDate } = req.query as Record<string, string>;

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

    // Access control: subsidiary_manager can only export their corporates
    let allowedCorporateIds: string[] | null = null;
    if (req.user!.role === 'subsidiary_manager') {
      const accessRows = await db
        .select({ corporateId: userCorporateAccesses.corporateId })
        .from(userCorporateAccesses)
        .where(eq(userCorporateAccesses.userId, req.user!.userId));
      allowedCorporateIds = accessRows.map((r) => r.corporateId);
    }

    // Fetch ratio data from cfd.v_financial_ratios view
    const conditions: ReturnType<typeof sqlTag>[] = [];

    if (corporateId) {
      conditions.push(sqlTag`vr.corporate_id = ${corporateId}`);
    }
    if (allowedCorporateIds) {
      if (allowedCorporateIds.length === 0) {
        res.json({ message: 'No data available for export' });
        return;
      }
      conditions.push(sqlTag`vr.corporate_id IN (${sqlTag.join(allowedCorporateIds.map(id => sqlTag`${id}`), sqlTag`, `)})`);
    }
    if (startDate) {
      conditions.push(sqlTag`vr.period >= ${startDate}`);
    }
    if (endDate) {
      conditions.push(sqlTag`vr.period <= ${endDate}`);
    }

    const whereClause = conditions.length > 0
      ? sqlTag`WHERE ${sqlTag.join(conditions, sqlTag` AND `)}`
      : sqlTag``;

    const rows = (await db.execute(sqlTag`
      SELECT vr.*, c.name as corporate_name
      FROM cfd.v_financial_ratios vr
      JOIN public.corporates c ON vr.corporate_id = c.id
      ${whereClause}
      ORDER BY vr.period DESC
    `)).rows as any[];

    // Metadata for export (Req 10.4)
    const metadata = {
      exportDate: new Date().toISOString(),
      periodRange: startDate && endDate ? `${startDate} to ${endDate}` : 'All periods',
      exportedBy: req.user?.username ?? 'system',
    };

    // Log export to audit log (Req 10.7)
    await createFRSAuditLog({
      userId: req.user!.userId,
      action: 'export',
      entityType: 'financial_ratios',
      newValues: { format, corporateId, startDate, endDate },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    try {
      if (format === 'csv') {
        const csv = exportToCSV(rows, metadata);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="financial-ratios-${Date.now()}.csv"`);
        res.send(csv);
      } else if (format === 'excel') {
        const buffer = await exportToExcel(rows, metadata);
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
  router.post('/schedule', requirePermission('cfd.reports.schedule'), async (req: Request, res: Response) => {
    const { name, reportType, corporateIds, periodType, format, scheduleFrequency, scheduleDay, recipients } = req.body;

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

    const result = await createScheduledReport({
      name,
      reportType,
      corporateIds: corporateIds ?? [],
      periodType,
      format,
      scheduleFrequency,
      scheduleDay,
      recipients: Array.isArray(recipients) ? recipients : [recipients],
    }, req.user!.userId);

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
  router.get('/scheduled', requirePermission('cfd.reports.read'), async (_req: Request, res: Response) => {
    const reports = await listScheduledReports();
    res.json(reports);
  });

  /**
   * DELETE /api/frs/reports/schedule/:id
   * Delete a scheduled report.
   * Requirements: 10.5
   */
  router.delete('/schedule/:id', requirePermission('cfd.reports.schedule'), async (req: Request, res: Response) => {
    const result = await deleteScheduledReport(req.params.id);
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

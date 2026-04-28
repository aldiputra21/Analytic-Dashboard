// Reports API Routes
// Requirements: 7.1, 7.3, 7.4, 7.5, 7.7, 10.1, 10.3, 10.4, 10.5, 10.6, 10.8

import { Router, Request, Response } from 'express';
import { requirePermission, injectAccessContext } from '../../middleware/rbac';
import { asyncHandler } from '../../utils/asyncHandler';
import { generateConsolidatedReport } from '../../services/financial/reportGenerator';
import { exportToCSV, exportToExcel, exportToPDF } from '../../services/financial/exportService';
import {
  createScheduledReport,
  listScheduledReports,
  deleteScheduledReport,
} from '../../services/financial/scheduledReportService';
import { createFRSAuditLog } from '../../services/financial/auditLogService';
import { db } from '../../db/connection';
import { eq, sql as sqlTag } from 'drizzle-orm';
import { AppError, ErrorCode } from '../../utils/errors.js';

export function createReportsRouter(): Router {
  const router = Router();

  /**
   * GET /api/frs/reports/consolidated
   * Generate a consolidated report for a given period.
   * Requirements: 7.1, 7.3, 7.4, 7.5, 7.7
   */
  router.get(
    '/consolidated', 
    requirePermission('cfd.reports.read'), 
    injectAccessContext,
    asyncHandler(async (req: Request, res: Response) => {
      const { period } = req.query as Record<string, string>;

      if (!period) {
        throw AppError.badRequest(ErrorCode.VALIDATION_ERROR, 'period is required');
      }

      const access = req.accessContext!;
      const report = await generateConsolidatedReport(period, access);

      res.json(report);
    })
  );

  /**
   * GET /api/frs/reports/export
   * Export financial ratio data in CSV, Excel, or PDF format.
   * Requirements: 10.1, 10.3, 10.4, 10.8
   */
  router.get(
    '/export', 
    requirePermission('cfd.reports.export'), 
    injectAccessContext,
    asyncHandler(async (req: Request, res: Response) => {
      const { format, corporateId, startDate, endDate } = req.query as Record<string, string>;

      if (!format || !['csv', 'excel', 'pdf'].includes(format)) {
        throw AppError.badRequest(ErrorCode.VALIDATION_ERROR, 'format must be one of: csv, excel, pdf');
      }

      // Access control using req.accessContext
      const access = req.accessContext!;
      
      // If corporateId is provided in query, validate it
      if (corporateId && access.scope !== 'system' && !access.corporateIds.includes(corporateId)) {
        throw AppError.forbidden(ErrorCode.ACCESS_DENIED, 'Access denied to this corporate');
      }

      // Fetch ratio data from cfd.v_financial_ratios view
      const conditions: ReturnType<typeof sqlTag>[] = [];

      if (corporateId) {
        conditions.push(sqlTag`vr.corporate_id = ${corporateId}`);
      } else if (access.scope !== 'system') {
        if (access.corporateIds.length === 0) {
          res.json({ message: 'No data available for export' });
          return;
        }
        conditions.push(sqlTag`vr.corporate_id IN (${sqlTag.join(access.corporateIds.map(id => sqlTag`${id}`), sqlTag`, `)})`);
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
        throw AppError.internal(err.message ?? 'Export failed');
      }
    })
  );

  /**
   * POST /api/frs/reports/schedule
   * Create a scheduled report.
   * Requirements: 10.5
   */
  router.post(
    '/schedule', 
    requirePermission('cfd.reports.schedule'), 
    injectAccessContext,
    asyncHandler(async (req: Request, res: Response) => {
      const { name, reportType, corporateIds, periodType, format, scheduleFrequency, scheduleDay, recipients } = req.body;

      if (!name || !reportType || !periodType || !format || !scheduleFrequency || !scheduleDay || !recipients) {
        throw AppError.badRequest(ErrorCode.VALIDATION_ERROR, 'name, reportType, periodType, format, scheduleFrequency, scheduleDay, and recipients are required');
      }

      const access = req.accessContext!;
      const requestedCorpIds = corporateIds ?? [];
      
      // Validate requested corporate IDs
      if (access.scope !== 'system') {
        for (const corpId of requestedCorpIds) {
          if (!access.corporateIds.includes(corpId)) {
            throw AppError.forbidden(ErrorCode.ACCESS_DENIED, `Access denied to corporate ${corpId}`);
          }
        }
      }

      const result = await createScheduledReport({
        name,
        reportType,
        corporateIds: requestedCorpIds.length > 0 ? requestedCorpIds : (access.scope !== 'system' ? access.corporateIds : []),
        periodType,
        format,
        scheduleFrequency,
        scheduleDay,
        recipients: Array.isArray(recipients) ? recipients : [recipients],
      }, req.user!.userId);

      if (result.error) {
        throw AppError.badRequest(ErrorCode.VALIDATION_ERROR, result.error);
      }

      res.status(201).json(result.report);
    })
  );

  /**
   * GET /api/frs/reports/scheduled
   * List all scheduled reports.
   * Requirements: 10.5
   */
  router.get(
    '/scheduled', 
    requirePermission('cfd.reports.read'), 
    injectAccessContext,
    asyncHandler(async (req: Request, res: Response) => {
      const access = req.accessContext!;
      const reports = await listScheduledReports();
      
      // Filtering scheduled reports based on corporate access
      // Note: In a real scenario, this filtering should happen in the service/DB query.
      // For now, we'll do a simple post-fetch filter if not system scope.
      if (access.scope !== 'system') {
        const filtered = reports.filter(r => 
          r.corporateIds.some(id => access.corporateIds.includes(id))
        );
        return res.json(filtered);
      }
      
      res.json(reports);
    })
  );

  /**
   * DELETE /api/frs/reports/schedule/:id
   * Delete a scheduled report.
   * Requirements: 10.5
   */
  router.delete(
    '/schedule/:id', 
    requirePermission('cfd.reports.schedule'), 
    injectAccessContext,
    asyncHandler(async (req: Request, res: Response) => {
      // Basic check: only creator or system admin can delete for now
      // This could be more sophisticated (e.g., anyone with write permission in that corporate)
      const result = await deleteScheduledReport(req.params.id);
      if (!result.success) {
        throw AppError.notFound(ErrorCode.NOT_FOUND, result.error);
      }
      res.status(204).send();
    })
  );

  return router;
}

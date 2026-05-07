// src/routes/financial/upload.ts
// Upload Module API Endpoints
// Requirements: 3.2, 3.9, 3.10, 6.2-6.11, 7.1-7.8, 8.3, 8.5, 10.5, 12.2-12.7, 17.3-17.4, 18.2-18.8
// Task 8: API Endpoints — Upload

import { Router, Request, Response } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { eq, and, ilike, or, count, desc, asc, inArray, sql } from 'drizzle-orm';
import { db } from '../../db/connection';
import { uploadSessions, uploadStagingRows, users } from '../../db/schema/public';
import {
  balanceSheets,
  incomeStatements,
  weeklyCashFlows,
  cashRealizations,
  bankLoans,
  targetHeaders,
  targetDetails,
  cashFlowProjectionHeaders,
  cashFlowProjectionDetails,
  costCenters,
} from '../../db/schema/cfd';
import { corporates, departments, projects } from '../../db/schema/public';
import { requirePermission, injectAccessContext } from '../../middleware/rbac';
import { asyncHandler } from '../../utils/asyncHandler';
import { AppError, ErrorCode } from '../../utils/errors';
import { parseAndValidateUpload, type EntityType } from '../../services/financial/uploadService';
import { generateDynamicTemplate } from '../../services/financial/dynamicTemplateService';
import { configService } from '../../services/management/configService';
import * as approvalEngine from '../../services/approval/approvalEngine';
import { createFRSAuditLog } from '../../services/financial/auditLogService';
import * as fs from 'fs/promises';
import * as path from 'path';

// ============================================================================
// Permission Mapping
// Requirements: 10.1, 10.2, 10.3, 10.4, 10.5
// ============================================================================

const ENTITY_PERMISSION_MAP: Record<string, { read: string; upload: string }> = {
  balance_sheet: { read: 'cfd.balance_sheets.read', upload: 'cfd.balance_sheets.upload' },
  income_statement: { read: 'cfd.income_statements.read', upload: 'cfd.income_statements.upload' },
  income_statement_projection: { read: 'public.targets.read', upload: 'public.targets.upload' },
  weekly_cash_flow: { read: 'cfd.weekly_cash_flows.read', upload: 'cfd.weekly_cash_flows.upload' },
  realization: { read: 'cfd.realizations.read', upload: 'cfd.realizations.upload' },
  cash_flow_projection: { read: 'cfd.cash_flow_projections.read', upload: 'cfd.cash_flow_projections.upload' },
  bank_loan: { read: 'cfd.bank_loans.read', upload: 'cfd.bank_loans.upload' },
  corporate: { read: 'cfd.corporates.read', upload: 'cfd.corporates.upload' },
  department: { read: 'public.departments.read', upload: 'public.departments.upload' },
  cost_center: { read: 'cfd.cost_centers.read', upload: 'cfd.cost_centers.upload' },
  project: { read: 'public.projects.read', upload: 'public.projects.upload' },
};

// ============================================================================
// Multer Configuration
// Requirements: 3.9, 3.10
// ============================================================================

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext !== '.xlsx') {
      const error = new Error('Only .xlsx files are allowed');
      (error as any).code = 'INVALID_FILE_TYPE';
      (error as any).status = 400;
      return cb(error as any);
    }
    cb(null, true);
  },
});

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Verify user has upload permission OR is in approval workflow
 * Requirements: 6.3, 6.4, 17.4
 */
async function canAccessUploadFile(
  userId: string,
  entityType: string,
  permissions: string[]
): Promise<boolean> {
  const uploadPermission = ENTITY_PERMISSION_MAP[entityType]?.upload;
  if (!uploadPermission) return false;

  // Check if user has upload permission
  if (permissions.includes(uploadPermission)) {
    return true;
  }

  // Check if user has role in approval workflow for this entity type
  const workflowKey = {
    module: 'cfd',
    entityType: `${entityType}_upload`,
    action: 'upload',
  };

  const { canCreate } = await approvalEngine.canUserCreateDraft(
    userId,
    workflowKey.module,
    workflowKey.entityType,
    workflowKey.action
  );

  return canCreate;
}

/**
 * Delete uploaded file from storage
 * Requirements: 6.11
 */
async function deleteUploadedFile(filePath: string): Promise<void> {
  try {
    await fs.unlink(filePath);
    // Also try to delete the parent directory if empty
    const dir = path.dirname(filePath);
    try {
      await fs.rmdir(dir);
    } catch {
      // Directory not empty or doesn't exist, ignore
    }
  } catch (error) {
    // File doesn't exist or already deleted, ignore
  }
}

/**
 * Perform direct bulk insert of staging rows into the target table
 * Used when no approval workflow is active (bypass approval)
 * Requirements: 7.8, 8.3
 */
async function performDirectBulkInsert(
  sessionId: string,
  entityType: EntityType,
  requestedBy: string,
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0]
): Promise<number> {
  // Fetch all valid staging rows
  const rows = await tx
    .select()
    .from(uploadStagingRows)
    .where(eq(uploadStagingRows.sessionId, sessionId))
    .orderBy(uploadStagingRows.rowNumber);

  const validRows = rows.filter(r => r.isValid);
  if (validRows.length === 0) return 0;

  let insertedCount = 0;

  for (const row of validRows) {
    const data = row.rowData as Record<string, any>;

    switch (entityType) {
      case 'balance_sheet':
        await tx.insert(balanceSheets).values({
          corporateId: data.corporate_id,
          period: data.period,
          cashAndBank: data.cash_and_bank || '0',
          accountsReceivable: data.accounts_receivable || '0',
          workInProgress: data.work_in_progress || '0',
          inventory: data.inventory || '0',
          prepaidExpenses: data.prepaid_expenses || '0',
          land: data.land || '0',
          building: data.building || '0',
          equipment: data.equipment || '0',
          otherFixedAssets: data.other_fixed_assets || '0',
          accountsPayable: data.accounts_payable || '0',
          bankLoanCurrent: data.bank_loan_current || '0',
          otherCurrentLiabilities: data.other_current_liabilities || '0',
          bankLoanLongTerm: data.bank_loan_long_term || '0',
          otherLongTermLiabilities: data.other_long_term_liabilities || '0',
          shareholderLoan: data.shareholder_loan || '0',
          capital: data.capital || '0',
          earningsAfterTax: data.earnings_after_tax || '0',
          retainedEarnings: data.retained_earnings || '0',
          dividends: data.dividends || '0',
          notes: data.notes || null,
          createdBy: requestedBy,
        });
        break;

      case 'income_statement':
        await tx.insert(incomeStatements).values({
          corporateId: data.corporate_id,
          period: data.period,
          revenue: data.revenue || '0',
          cogs: data.cogs || '0',
          operatingExpenses: data.operating_expenses || '0',
          interestExpense: data.interest_expense || '0',
          taxExpense: data.tax_expense || '0',
          otherIncome: data.other_income || '0',
          otherExpense: data.other_expense || '0',
          notes: data.notes || null,
          createdBy: requestedBy,
        });
        break;

      case 'weekly_cash_flow':
        await tx.insert(weeklyCashFlows).values({
          corporateId: data.corporate_id,
          entityType: data.entity_type,
          entityId: data.entity_id,
          period: data.period,
          week: data.week,
          operatingCashIn: data.operating_cash_in || '0',
          operatingCashOut: data.operating_cash_out || '0',
          investingCashIn: data.investing_cash_in || '0',
          investingCashOut: data.investing_cash_out || '0',
          financingCashIn: data.financing_cash_in || '0',
          financingCashOut: data.financing_cash_out || '0',
          notes: data.notes || null,
          createdBy: requestedBy,
        });
        break;

      case 'realization':
        await tx.insert(cashRealizations).values({
          entityType: data.entity_type,
          departmentId: data.department_id,
          projectId: data.project_id || null,
          costCenterId: data.cost_center_id || null,
          transactionDate: data.transaction_date,
          category: data.category,
          amount: data.amount,
          notes: data.notes || null,
          createdBy: requestedBy,
        });
        break;

      case 'bank_loan':
        await tx.insert(bankLoans).values({
          bankId: data.bank_id,
          corporateId: data.corporate_id,
          amount: data.amount,
          startDate: data.start_date,
          tenor: parseInt(data.tenor),
          interestType: data.interest_type,
          interestRate: data.interest_rate,
          status: data.status || 'ongoing',
          creditType: data.credit_type || 'KMK',
          alertMinDays: parseInt(data.alert_min_days) || 5,
          createdBy: requestedBy,
        });
        break;

      case 'corporate':
        await tx.insert(corporates).values({
          code: data.code,
          name: data.name,
          industry: data.industry || null,
          currency: data.currency || 'IDR',
          taxRate: data.tax_rate || null,
          fiscalYearStartMonth: parseInt(data.fiscal_year_start_month) || 1,
          createdBy: requestedBy,
        });
        break;

      case 'department':
        await tx.insert(departments).values({
          corporateId: data.corporate_id,
          code: data.code,
          name: data.name,
          headName: data.head_name || null,
          description: data.description || null,
          createdBy: requestedBy,
        });
        break;

      case 'cost_center':
        await tx.insert(costCenters).values({
          corporateId: data.corporate_id,
          parentId: data.parent_id || null,
          category: data.category,
          code: data.code,
          name: data.name,
          description: data.description || null,
          createdBy: requestedBy,
        });
        break;

      case 'project':
        await tx.insert(projects).values({
          departmentId: data.department_id,
          code: data.code,
          name: data.name,
          description: data.description || null,
          status: data.status || 'active',
          startDate: data.start_date ? new Date(data.start_date) : null,
          endDate: data.end_date ? new Date(data.end_date) : null,
          createdBy: requestedBy,
        });
        break;

      // income_statement_projection and cash_flow_projection require header+detail
      // These are handled by the approval callback handler (Task 17)
      default:
        throw new Error(`Direct insert not supported for entity type: ${entityType}`);
    }

    insertedCount++;
  }

  return insertedCount;
}

// ============================================================================
// Router
// ============================================================================

export function createUploadRouter(): Router {
  const router = Router();

  /**
   * POST /api/frs/upload/:entity_type
   * Parse and validate uploaded Excel file
   * Requirements: 3.2, 3.9, 3.10, 10.5
   */
  router.post(
    '/:entity_type',
    injectAccessContext,
    asyncHandler(async (req: Request, res: Response, next) => {
      const { entity_type } = req.params;

      // Validate entity type
      const permissions = ENTITY_PERMISSION_MAP[entity_type];
      if (!permissions) {
        throw AppError.badRequest(
          ErrorCode.INVALID_INPUT,
          `Unsupported entity type: ${entity_type}`
        );
      }

      // Verify upload permission
      const hasPermission = req.user?.permissions?.includes(permissions.upload);
      if (!hasPermission) {
        throw AppError.forbidden(
          ErrorCode.ACCESS_DENIED,
          `Permission ${permissions.upload} required for upload`
        );
      }

      // Process file upload
      upload.single('file')(req, res, async (err) => {
        if (err) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
              error: {
                code: 'FILE_TOO_LARGE',
                message: 'File size exceeds 10MB limit',
              },
            });
          }
          if (err.code === 'INVALID_FILE_TYPE') {
            return res.status(400).json({
              error: {
                code: 'INVALID_FILE_TYPE',
                message: err.message,
              },
            });
          }
          return next(err);
        }

        if (!req.file) {
          return res.status(400).json({
            error: {
              code: 'NO_FILE',
              message: 'No file uploaded',
            },
          });
        }

        try {
          // Parse and validate upload
          const result = await parseAndValidateUpload({
            entityType: entity_type as EntityType,
            file: req.file.buffer,
            fileName: req.file.originalname,
            fileSize: req.file.size,
            userId: req.user!.userId,
            language: (req.query.lang as 'id' | 'en') || 'id',
            accessContext: req.accessContext!,
          });

          return res.status(200).json(result);
        } catch (error) {
          if (error instanceof AppError) {
            return res.status(error.statusCode).json({
              error: {
                code: error.code,
                message: error.message,
                details: error.details,
              },
            });
          }
          throw error;
        }
      });
    })
  );

  /**
   * POST /api/frs/upload/sessions/:sessionId/confirm
   * Confirm upload and trigger approval or direct insertion
   * Requirements: 7.1, 7.2, 7.8, 8.3, 8.5
   */
  router.post(
    '/sessions/:sessionId/confirm',
    injectAccessContext,
    asyncHandler(async (req: Request, res: Response) => {
      const { sessionId } = req.params;

      // Fetch session
      const [session] = await db
        .select()
        .from(uploadSessions)
        .where(eq(uploadSessions.id, sessionId))
        .limit(1);

      if (!session) {
        throw AppError.notFound(ErrorCode.NOT_FOUND, 'Upload session not found');
      }

      // Verify permission
      const permissions = ENTITY_PERMISSION_MAP[session.entityType];
      if (!permissions) {
        throw AppError.badRequest(
          ErrorCode.INVALID_INPUT,
          `Unsupported entity type: ${session.entityType}`
        );
      }

      const hasPermission = req.user?.permissions?.includes(permissions.upload);
      if (!hasPermission) {
        throw AppError.forbidden(
          ErrorCode.ACCESS_DENIED,
          `Permission ${permissions.upload} required`
        );
      }

      // Verify session belongs to user
      if (session.userId !== req.user!.userId) {
        throw AppError.forbidden(
          ErrorCode.ACCESS_DENIED,
          'You can only confirm your own upload sessions'
        );
      }

      // Verify session status
      if (session.status !== 'pending_review') {
        throw AppError.badRequest(
          ErrorCode.INVALID_INPUT,
          `Session status is ${session.status}, expected pending_review`
        );
      }

      // Verify all rows are valid
      if (session.invalidRows > 0) {
        throw AppError.badRequest(
          ErrorCode.INVALID_INPUT,
          'Cannot confirm upload with invalid rows'
        );
      }

      // Check if workflow is active
      const workflowKey = {
        module: 'cfd',
        entityType: `${session.entityType}_upload`,
        action: 'upload',
      };

      const { canCreate, workflow } = await approvalEngine.canUserCreateDraft(
        req.user!.userId,
        workflowKey.module,
        workflowKey.entityType,
        workflowKey.action,
        req.accessContext?.corporateIds?.[0],
        req.accessContext?.departmentIds?.[0]
      );

      let approvalId: string | null = null;

      if (canCreate && workflow) {
        // Create approval draft
        const draft = await approvalEngine.createDraft({
          workflowKey,
          payload: {
            sessionId: session.id,
            fileName: session.fileName,
            totalRows: session.totalRows,
            validRows: session.validRows,
            entityType: session.entityType,
          },
          requestedBy: req.user!.userId,
          corporateId: req.accessContext?.corporateIds?.[0],
          departmentId: req.accessContext?.departmentIds?.[0],
        });

        approvalId = draft.id;

        // Update session status to confirmed and link to approval
        await db
          .update(uploadSessions)
          .set({
            status: 'confirmed',
            approvalId: draft.id,
            updatedBy: req.user!.userId,
            updatedAt: new Date(),
          })
          .where(eq(uploadSessions.id, sessionId));

        return res.status(200).json({
          sessionId: session.id,
          approvalId: draft.id,
          status: 'confirmed',
          message: 'Upload submitted for approval',
        });
      } else {
        // No workflow or user doesn't have maker role - direct insert
        // Requirements: 7.8, 8.3
        await db.transaction(async (tx) => {
          // Perform bulk insert
          const insertedCount = await performDirectBulkInsert(
            sessionId,
            session.entityType as EntityType,
            req.user!.userId,
            tx
          );

          // Update session status to approved
          await tx
            .update(uploadSessions)
            .set({
              status: 'approved',
              updatedBy: req.user!.userId,
              updatedAt: new Date(),
            })
            .where(eq(uploadSessions.id, sessionId));

          // Delete staging rows after successful insert (Requirement 11.5)
          await tx
            .delete(uploadStagingRows)
            .where(eq(uploadStagingRows.sessionId, sessionId));

          // Create audit log (Requirements: 9.1, 9.2, 9.3)
          await createFRSAuditLog({
            userId: req.user!.userId,
            action: 'upload',
            entityType: session.entityType,
            entityId: session.id,
            newValues: {
              fileName: session.fileName,
              totalRows: session.totalRows,
              validRows: session.validRows,
              invalidRows: session.invalidRows,
              status: 'completed',
              insertedCount,
            },
          });
        });

        // Delete uploaded file from storage
        if (session.filePath) {
          await deleteUploadedFile(session.filePath);
        }

        return res.status(200).json({
          sessionId: session.id,
          approvalId: null,
          status: 'approved',
          message: 'Upload completed successfully (direct insert)',
        });
      }
    })
  );

  /**
   * POST /api/frs/upload/sessions/:sessionId/cancel
   * Cancel upload session and delete staging data
   * Requirements: 6.11
   */
  router.post(
    '/sessions/:sessionId/cancel',
    injectAccessContext,
    asyncHandler(async (req: Request, res: Response) => {
      const { sessionId } = req.params;

      // Fetch session
      const [session] = await db
        .select()
        .from(uploadSessions)
        .where(eq(uploadSessions.id, sessionId))
        .limit(1);

      if (!session) {
        throw AppError.notFound(ErrorCode.NOT_FOUND, 'Upload session not found');
      }

      // Verify permission
      const permissions = ENTITY_PERMISSION_MAP[session.entityType];
      if (!permissions) {
        throw AppError.badRequest(
          ErrorCode.INVALID_INPUT,
          `Unsupported entity type: ${session.entityType}`
        );
      }

      const hasPermission = req.user?.permissions?.includes(permissions.upload);
      if (!hasPermission) {
        throw AppError.forbidden(
          ErrorCode.ACCESS_DENIED,
          `Permission ${permissions.upload} required`
        );
      }

      // Verify session belongs to user
      if (session.userId !== req.user!.userId) {
        throw AppError.forbidden(
          ErrorCode.ACCESS_DENIED,
          'You can only cancel your own upload sessions'
        );
      }

      // Delete session and staging rows in transaction
      await db.transaction(async (tx) => {
        // Delete staging rows (cascade will handle this, but explicit is clearer)
        await tx
          .delete(uploadStagingRows)
          .where(eq(uploadStagingRows.sessionId, sessionId));

        // Update session status to cancelled
        await tx
          .update(uploadSessions)
          .set({
            status: 'cancelled',
            updatedBy: req.user!.userId,
            updatedAt: new Date(),
          })
          .where(eq(uploadSessions.id, sessionId));
      });

      // Delete uploaded file from storage
      if (session.filePath) {
        await deleteUploadedFile(session.filePath);
      }

      return res.status(200).json({
        success: true,
        message: 'Upload session cancelled',
      });
    })
  );

  /**
   * GET /api/frs/upload/sessions/:sessionId/rows
   * Fetch staging rows with server-side search and paging
   * Requirements: 6.5, 6.6, 18.7
   */
  router.get(
    '/sessions/:sessionId/rows',
    injectAccessContext,
    asyncHandler(async (req: Request, res: Response) => {
      const { sessionId } = req.params;
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize as string) || 20));
      const search = req.query.search as string | undefined;
      const offset = (page - 1) * pageSize;

      // Fetch session
      const [session] = await db
        .select()
        .from(uploadSessions)
        .where(eq(uploadSessions.id, sessionId))
        .limit(1);

      if (!session) {
        throw AppError.notFound(ErrorCode.NOT_FOUND, 'Upload session not found');
      }

      // Verify permission (read OR upload)
      const permissions = ENTITY_PERMISSION_MAP[session.entityType];
      if (!permissions) {
        throw AppError.badRequest(
          ErrorCode.INVALID_INPUT,
          `Unsupported entity type: ${session.entityType}`
        );
      }

      const hasReadPermission = req.user?.permissions?.includes(permissions.read);
      const hasUploadPermission = req.user?.permissions?.includes(permissions.upload);

      if (!hasReadPermission && !hasUploadPermission) {
        throw AppError.forbidden(
          ErrorCode.ACCESS_DENIED,
          `Permission ${permissions.read} or ${permissions.upload} required`
        );
      }

      // Build query conditions
      const conditions = [eq(uploadStagingRows.sessionId, sessionId)];

      // Server-side search on rowData JSON
      if (search) {
        // Search in JSON field using PostgreSQL's text search
        conditions.push(
          sql`${uploadStagingRows.rowData}::text ILIKE ${`%${search}%`}`
        );
      }

      const where = and(...conditions);

      // Fetch rows with pagination
      const [records, [{ totalCount }]] = await Promise.all([
        db
          .select()
          .from(uploadStagingRows)
          .where(where)
          .orderBy(uploadStagingRows.rowNumber)
          .limit(pageSize)
          .offset(offset),
        db
          .select({ totalCount: count() })
          .from(uploadStagingRows)
          .where(where),
      ]);

      return res.status(200).json({
        records,
        totalCount: Number(totalCount),
        page,
        pageSize,
      });
    })
  );

  /**
   * GET /api/frs/upload/template/:entity_type
   * Download template Excel file
   * Requirements: 12.2, 12.3, 12.5, 12.6, 12.7
   */
  router.get(
    '/template/:entity_type',
    injectAccessContext,
    asyncHandler(async (req: Request, res: Response) => {
      const { entity_type } = req.params;

      // Validate entity type
      const permissions = ENTITY_PERMISSION_MAP[entity_type];
      if (!permissions) {
        throw AppError.badRequest(
          ErrorCode.INVALID_INPUT,
          `Unsupported entity type: ${entity_type}`
        );
      }

      // Verify upload permission
      const hasPermission = req.user?.permissions?.includes(permissions.upload);
      if (!hasPermission) {
        throw AppError.forbidden(
          ErrorCode.ACCESS_DENIED,
          `Permission ${permissions.upload} required to download template`
        );
      }

      // Generate template dynamically with DB-populated dropdowns filtered by user RBAC
      const fileBuffer = await generateDynamicTemplate(
        entity_type as EntityType,
        req.accessContext!,
        'id',
      );

      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${entity_type}_template.xlsx"`
      );
      res.setHeader('Content-Length', fileBuffer.length);
      return res.send(fileBuffer);
    })
  );

  /**
   * GET /api/frs/upload/file/:sessionId
   * Download uploaded file (for review or history)
   * Requirements: 6.2, 6.3, 6.4, 17.3, 17.4, 18.6
   */
  router.get(
    '/file/:sessionId',
    injectAccessContext,
    asyncHandler(async (req: Request, res: Response) => {
      const { sessionId } = req.params;
      const context = (req.query.context as string) || 'review';

      // Fetch session
      const [session] = await db
        .select()
        .from(uploadSessions)
        .where(eq(uploadSessions.id, sessionId))
        .limit(1);

      if (!session) {
        throw AppError.notFound(ErrorCode.NOT_FOUND, 'Upload session not found');
      }

      // Verify permission based on context
      const permissions = ENTITY_PERMISSION_MAP[session.entityType];
      if (!permissions) {
        throw AppError.badRequest(
          ErrorCode.INVALID_INPUT,
          `Unsupported entity type: ${session.entityType}`
        );
      }

      const hasPermission =
        context === 'history'
          ? // History context: check read permission
            (req.user?.permissions?.includes(permissions.read) ?? false)
          : // Review context: check upload permission OR role in approval workflow
            await canAccessUploadFile(
              req.user!.userId,
              session.entityType,
              req.user?.permissions || []
            );

      if (!hasPermission) {
        throw AppError.forbidden(
          ErrorCode.ACCESS_DENIED,
          context === 'history'
            ? `Permission ${permissions.read} required`
            : `Permission ${permissions.upload} or approval role required`
        );
      }

      // Check if file exists
      if (!session.filePath) {
        throw AppError.notFound(
          ErrorCode.NOT_FOUND,
          'File path not found for this session'
        );
      }

      try {
        await fs.access(session.filePath);
      } catch {
        throw AppError.notFound(
          ErrorCode.NOT_FOUND,
          'Uploaded file not found or has been deleted'
        );
      }

      // Read file
      const fileBuffer = await fs.readFile(session.filePath);

      // Set response headers
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${session.fileName}"`
      );
      res.setHeader('Content-Length', fileBuffer.length);

      // Send file
      return res.send(fileBuffer);
    })
  );

  /**
   * GET /api/frs/upload/history/:entity_type
   * Fetch upload session history for a module
   * Requirements: 18.2, 18.3, 18.5, 18.8
   */
  router.get(
    '/history/:entity_type',
    injectAccessContext,
    asyncHandler(async (req: Request, res: Response) => {
      const { entity_type } = req.params;
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize as string) || 20));
      const sortBy = (req.query.sortBy as string) || 'createdAt';
      const sortOrder = (req.query.sortOrder as string) || 'desc';
      const offset = (page - 1) * pageSize;

      // Validate entity type
      const permissions = ENTITY_PERMISSION_MAP[entity_type];
      if (!permissions) {
        throw AppError.badRequest(
          ErrorCode.INVALID_INPUT,
          `Unsupported entity type: ${entity_type}`
        );
      }

      // Verify read permission
      const hasPermission = req.user?.permissions?.includes(permissions.read);
      if (!hasPermission) {
        throw AppError.forbidden(
          ErrorCode.ACCESS_DENIED,
          `Permission ${permissions.read} required`
        );
      }

      // Build query conditions
      const conditions = [eq(uploadSessions.entityType, entity_type)];

      // Apply RBAC filtering
      const access = req.accessContext!;
      if (access.scope !== 'system') {
        if (access.corporateIds.length === 0) {
          return res.json({ records: [], totalCount: 0 });
        }
        // Note: Upload sessions don't have corporateId field directly
        // They would need to be filtered based on the data in staging rows
        // For now, we'll show all sessions for the entity type
        // This should be enhanced based on actual RBAC requirements
      }

      const where = and(...conditions);

      // Determine sort column and order
      const sortColumn =
        sortBy === 'fileName'
          ? uploadSessions.fileName
          : sortBy === 'totalRows'
            ? uploadSessions.totalRows
            : sortBy === 'status'
              ? uploadSessions.status
              : uploadSessions.createdAt;

      const orderFn = sortOrder === 'asc' ? asc : desc;

      // Fetch sessions with pagination
      const [records, [{ totalCount }]] = await Promise.all([
        db
          .select({
            id: uploadSessions.id,
            userId: uploadSessions.userId,
            module: uploadSessions.module,
            entityType: uploadSessions.entityType,
            fileName: uploadSessions.fileName,
            fileSize: uploadSessions.fileSize,
            totalRows: uploadSessions.totalRows,
            validRows: uploadSessions.validRows,
            invalidRows: uploadSessions.invalidRows,
            status: uploadSessions.status,
            approvalId: uploadSessions.approvalId,
            createdBy: uploadSessions.createdBy,
            createdAt: uploadSessions.createdAt,
            updatedBy: uploadSessions.updatedBy,
            updatedAt: uploadSessions.updatedAt,
            userName: users.fullName,
            userEmail: users.email,
          })
          .from(uploadSessions)
          .leftJoin(users, eq(uploadSessions.userId, users.id))
          .where(where)
          .orderBy(orderFn(sortColumn))
          .limit(pageSize)
          .offset(offset),
        db
          .select({ totalCount: count() })
          .from(uploadSessions)
          .where(where),
      ]);

      return res.status(200).json({
        records,
        totalCount: Number(totalCount),
        page,
        pageSize,
      });
    })
  );

  return router;
}

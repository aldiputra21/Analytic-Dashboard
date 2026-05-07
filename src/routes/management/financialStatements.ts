// Financial Statement Routes — MAFINDA Dashboard Enhancement
// Requirements: 8.7, 8.8, 8.9, 8.10
import { Router, Request, Response } from 'express';
import { eq } from 'drizzle-orm';
import { db } from '../../db/connection';
import { balanceSheets, incomeStatements, weeklyCashFlows } from '../../db/schema/cfd';
import { requirePermission, injectAccessContext } from '../../middleware/rbac';
import { asyncHandler } from '../../utils/asyncHandler';
import { AppError, ErrorCode } from '../../utils/errors.js';
import {
  saveBalanceSheet,
  getBalanceSheets,
  deleteBalanceSheet,
  saveIncomeStatement,
  getIncomeStatements,
  deleteIncomeStatement,
  saveCashFlow,
  getCashFlows,
  deleteCashFlow,
  ValidationError,
} from '../../services/mafinda/financialStatementService';

export function createFinancialStatementRouter(): Router {
  const router = Router();

  // ─── Balance Sheet ──────────────────────────────────────────────────────────

  router.get('/balance-sheet', requirePermission('cfd.balance_sheets.read'), injectAccessContext, asyncHandler(async (req: Request, res: Response) => {
    const { corporateId, period, periodStart, periodEnd, page, pageSize } = req.query as Record<string, string>;
    const access = req.accessContext!;
    const result = await getBalanceSheets(access, {
      corporateId,
      period,
      periodStart,
      periodEnd,
      page: page ? parseInt(page) : 1,
      pageSize: pageSize ? Math.min(parseInt(pageSize), 100) : 10,
    });
    res.json(result);
  }));

  router.post('/balance-sheet', requirePermission('cfd.balance_sheets.write'), injectAccessContext, asyncHandler(async (req: Request, res: Response) => {
    const { corporateId, period } = req.body;
    const access = req.accessContext!;

    if (!corporateId || !period) {
      throw AppError.badRequest(ErrorCode.MISSING_REQUIRED_FIELD, 'Corporate ID and period are required');
    }

    if (access.scope !== 'system' && !access.corporateIds.includes(corporateId)) {
      throw AppError.forbidden(ErrorCode.CORPORATE_ACCESS_DENIED, 'Access denied to this corporate');
    }

    const userId = req.user!.userId;
    const result = await saveBalanceSheet(req.body, userId);
    res.status(201).json(result);
  }));

  router.put('/balance-sheet/:id', requirePermission('cfd.balance_sheets.write'), injectAccessContext, asyncHandler(async (req: Request, res: Response) => {
    const { corporateId } = req.body;
    const access = req.accessContext!;

    if (access.scope !== 'system' && !access.corporateIds.includes(corporateId)) {
      throw AppError.forbidden(ErrorCode.CORPORATE_ACCESS_DENIED, 'Access denied to this corporate');
    }

    const userId = req.user!.userId;
    const result = await saveBalanceSheet({ ...req.body, id: req.params.id }, userId);
    res.json(result);
  }));

  router.delete('/balance-sheet/:id', requirePermission('cfd.balance_sheets.delete'), injectAccessContext, asyncHandler(async (req: Request, res: Response) => {
    const access = req.accessContext!;

    // Fetch existing record to get corporateId
    const [existing] = await db
      .select()
      .from(balanceSheets)
      .where(eq(balanceSheets.id, req.params.id))
      .limit(1);

    if (!existing) {
      throw AppError.notFound(ErrorCode.NOT_FOUND, 'Balance sheet not found');
    }

    // Validate access to this corporate
    if (access.scope !== 'system' && !access.corporateIds.includes(existing.corporateId)) {
      throw AppError.forbidden(ErrorCode.CORPORATE_ACCESS_DENIED, 'Access denied to this corporate');
    }

    await deleteBalanceSheet(req.params.id, existing.corporateId, req.user!.userId);
    res.json({ success: true });
  }));

  // ─── Income Statement ───────────────────────────────────────────────────────

  router.get('/income-statement', requirePermission('cfd.income_statements.read'), injectAccessContext, asyncHandler(async (req: Request, res: Response) => {
    const { corporateId, period, periodStart, periodEnd, page, pageSize } = req.query as Record<string, string>;
    const access = req.accessContext!;
    const result = await getIncomeStatements(access, {
      corporateId,
      period,
      periodStart,
      periodEnd,
      page: page ? parseInt(page) : 1,
      pageSize: pageSize ? Math.min(parseInt(pageSize), 100) : 10,
    });
    res.json(result);
  }));

  router.post('/income-statement', requirePermission('cfd.income_statements.write'), injectAccessContext, asyncHandler(async (req: Request, res: Response) => {
    const { corporateId } = req.body;
    const access = req.accessContext!;

    if (access.scope !== 'system' && !access.corporateIds.includes(corporateId)) {
      throw AppError.forbidden(ErrorCode.CORPORATE_ACCESS_DENIED, 'Access denied to this corporate');
    }

    const userId = req.user!.userId;
    const result = await saveIncomeStatement(req.body, userId);
    res.status(201).json(result);
  }));

  router.put('/income-statement/:id', requirePermission('cfd.income_statements.write'), injectAccessContext, asyncHandler(async (req: Request, res: Response) => {
    const { corporateId } = req.body;
    const access = req.accessContext!;

    if (access.scope !== 'system' && !access.corporateIds.includes(corporateId)) {
      throw AppError.forbidden(ErrorCode.CORPORATE_ACCESS_DENIED, 'Access denied to this corporate');
    }

    const userId = req.user!.userId;
    const result = await saveIncomeStatement({ ...req.body, id: req.params.id }, userId);
    res.json(result);
  }));

  router.delete('/income-statement/:id', requirePermission('cfd.income_statements.delete'), injectAccessContext, asyncHandler(async (req: Request, res: Response) => {
    const access = req.accessContext!;

    // Fetch existing record to get corporateId
    const [existing] = await db
      .select()
      .from(incomeStatements)
      .where(eq(incomeStatements.id, req.params.id))
      .limit(1);

    if (!existing) {
      throw AppError.notFound(ErrorCode.NOT_FOUND, 'Income statement not found');
    }

    // Validate access to this corporate
    if (access.scope !== 'system' && !access.corporateIds.includes(existing.corporateId)) {
      throw AppError.forbidden(ErrorCode.CORPORATE_ACCESS_DENIED, 'Access denied to this corporate');
    }

    await deleteIncomeStatement(req.params.id, existing.corporateId, req.user!.userId);
    res.json({ success: true });
  }));

  // ─── Cash Flow ──────────────────────────────────────────────────────────────

  router.get('/cash-flow', requirePermission('cfd.weekly_cash_flows.read'), injectAccessContext, asyncHandler(async (req: Request, res: Response) => {
    const { corporateId, entityType, entityId, period, periodStart, periodEnd, search, page, pageSize } = req.query as Record<string, string>;
    const access = req.accessContext!;
    const result = await getCashFlows(access, {
      corporateId,
      entityType,
      entityId,
      period,
      periodStart,
      periodEnd,
      search,
      page: page ? parseInt(page) : 1,
      pageSize: pageSize ? Math.min(parseInt(pageSize), 100) : 10,
    });
    res.json(result);
  }));

  router.post('/cash-flow', requirePermission('cfd.weekly_cash_flows.write'), injectAccessContext, asyncHandler(async (req: Request, res: Response) => {
    const { corporateId } = req.body;
    const access = req.accessContext!;

    if (access.scope !== 'system' && !access.corporateIds.includes(corporateId)) {
      throw AppError.forbidden(ErrorCode.CORPORATE_ACCESS_DENIED, 'Access denied to this corporate');
    }

    const userId = req.user!.userId;
    const result = await saveCashFlow(req.body, userId);
    res.status(201).json(result);
  }));

  router.put('/cash-flow/:id', requirePermission('cfd.weekly_cash_flows.write'), injectAccessContext, asyncHandler(async (req: Request, res: Response) => {
    const { corporateId } = req.body;
    const access = req.accessContext!;

    if (access.scope !== 'system' && !access.corporateIds.includes(corporateId)) {
      throw AppError.forbidden(ErrorCode.CORPORATE_ACCESS_DENIED, 'Access denied to this corporate');
    }

    const userId = req.user!.userId;
    const result = await saveCashFlow({ ...req.body, id: req.params.id }, userId);
    res.json(result);
  }));

  router.delete('/cash-flow/:id', requirePermission('cfd.weekly_cash_flows.delete'), injectAccessContext, asyncHandler(async (req: Request, res: Response) => {
    const access = req.accessContext!;

    // Fetch existing record to get corporateId
    const [existing] = await db
      .select()
      .from(weeklyCashFlows)
      .where(eq(weeklyCashFlows.id, req.params.id))
      .limit(1);

    if (!existing) {
      throw AppError.notFound(ErrorCode.NOT_FOUND, 'Cash flow not found');
    }

    // Validate access to this corporate
    if (access.scope !== 'system' && !access.corporateIds.includes(existing.corporateId)) {
      throw AppError.forbidden(ErrorCode.CORPORATE_ACCESS_DENIED, 'Access denied to this corporate');
    }

    await deleteCashFlow(req.params.id, existing.corporateId, req.user!.userId);
    res.json({ success: true });
  }));

  return router;
}


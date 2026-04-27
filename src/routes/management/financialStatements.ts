// Financial Statement Routes — MAFINDA Dashboard Enhancement
// Requirements: 8.7, 8.8, 8.9, 8.10
import { Router, Request, Response } from 'express';
import { requirePermission, injectAccessContext } from '../../middleware/rbac';
import { asyncHandler } from '../../utils/asyncHandler';
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
      res.status(400).json({ error: 'corporateId dan period wajib diisi' });
      return;
    }

    if (access.scope !== 'system' && !access.corporateIds.includes(corporateId)) {
      res.status(403).json({ error: 'Anda tidak memiliki akses ke perusahaan ini' });
      return;
    }

    const userId = req.user!.userId;
    const result = await saveBalanceSheet(req.body, userId);
    res.status(201).json(result);
  }));

  router.put('/balance-sheet/:id', requirePermission('cfd.balance_sheets.write'), injectAccessContext, asyncHandler(async (req: Request, res: Response) => {
    const { corporateId } = req.body;
    const access = req.accessContext!;

    if (access.scope !== 'system' && !access.corporateIds.includes(corporateId)) {
      res.status(403).json({ error: 'Anda tidak memiliki akses ke perusahaan ini' });
      return;
    }

    const userId = req.user!.userId;
    const result = await saveBalanceSheet({ ...req.body, id: req.params.id }, userId);
    res.json(result);
  }));

  router.delete('/balance-sheet/:id', requirePermission('cfd.balance_sheets.delete'), injectAccessContext, asyncHandler(async (req: Request, res: Response) => {
    const { corporateId } = req.query as { corporateId: string };
    const access = req.accessContext!;

    if (!corporateId) {
      res.status(400).json({ error: 'corporateId is required for deletion context' });
      return;
    }

    if (access.scope !== 'system' && !access.corporateIds.includes(corporateId)) {
      res.status(403).json({ error: 'Anda tidak memiliki akses ke perusahaan ini' });
      return;
    }

    await deleteBalanceSheet(req.params.id, corporateId);
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
      res.status(403).json({ error: 'Anda tidak memiliki akses ke perusahaan ini' });
      return;
    }

    const userId = req.user!.userId;
    const result = await saveIncomeStatement(req.body, userId);
    res.status(201).json(result);
  }));

  router.put('/income-statement/:id', requirePermission('cfd.income_statements.write'), injectAccessContext, asyncHandler(async (req: Request, res: Response) => {
    const { corporateId } = req.body;
    const access = req.accessContext!;

    if (access.scope !== 'system' && !access.corporateIds.includes(corporateId)) {
      res.status(403).json({ error: 'Anda tidak memiliki akses ke perusahaan ini' });
      return;
    }

    const userId = req.user!.userId;
    const result = await saveIncomeStatement({ ...req.body, id: req.params.id }, userId);
    res.json(result);
  }));

  router.delete('/income-statement/:id', requirePermission('cfd.income_statements.delete'), injectAccessContext, asyncHandler(async (req: Request, res: Response) => {
    const { corporateId } = req.query as { corporateId: string };
    const access = req.accessContext!;

    if (!corporateId) {
      res.status(400).json({ error: 'corporateId is required for deletion context' });
      return;
    }

    if (access.scope !== 'system' && !access.corporateIds.includes(corporateId)) {
      res.status(403).json({ error: 'Anda tidak memiliki akses ke perusahaan ini' });
      return;
    }

    await deleteIncomeStatement(req.params.id, corporateId);
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
      res.status(403).json({ error: 'Anda tidak memiliki akses ke perusahaan ini' });
      return;
    }

    const userId = req.user!.userId;
    const result = await saveCashFlow(req.body, userId);
    res.status(201).json(result);
  }));

  router.put('/cash-flow/:id', requirePermission('cfd.weekly_cash_flows.write'), injectAccessContext, asyncHandler(async (req: Request, res: Response) => {
    const { corporateId } = req.body;
    const access = req.accessContext!;

    if (access.scope !== 'system' && !access.corporateIds.includes(corporateId)) {
      res.status(403).json({ error: 'Anda tidak memiliki akses ke perusahaan ini' });
      return;
    }

    const userId = req.user!.userId;
    const result = await saveCashFlow({ ...req.body, id: req.params.id }, userId);
    res.json(result);
  }));

  router.delete('/cash-flow/:id', requirePermission('cfd.weekly_cash_flows.delete'), injectAccessContext, asyncHandler(async (req: Request, res: Response) => {
    const { corporateId } = req.query as { corporateId: string };
    const access = req.accessContext!;

    if (!corporateId) {
      res.status(400).json({ error: 'corporateId is required for deletion context' });
      return;
    }

    if (access.scope !== 'system' && !access.corporateIds.includes(corporateId)) {
      res.status(403).json({ error: 'Anda tidak memiliki akses ke perusahaan ini' });
      return;
    }

    await deleteCashFlow(req.params.id, corporateId);
    res.json({ success: true });
  }));

  return router;
}


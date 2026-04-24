// Financial Statement Routes — MAFINDA Dashboard Enhancement
// Requirements: 8.7, 8.8, 8.9, 8.10

import { Router, Request, Response } from 'express';
import { requirePermission } from '../../middleware/rbac';
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

  // GET /api/financial-statements/balance-sheet
  router.get('/balance-sheet', requirePermission('cfd.balance_sheets.read'), async (req: Request, res: Response): Promise<void> => {
    const { period, periodStart, periodEnd, corporateId, page, pageSize } = req.query as Record<string, string>;
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    try {
      const p = parseInt(page ?? '1', 10);
      const ps = parseInt(pageSize ?? '10', 10);
      const { data, totalCount } = await getBalanceSheets(userId, { 
        period, 
        periodStart,
        periodEnd,
        corporateId, 
        page: p, 
        pageSize: ps 
      });
      res.json({
        records: data,
        totalCount,
        totalPages: Math.ceil(totalCount / ps)
      });
    } catch (err) {
      console.error('[BalanceSheet] GET error:', err);
      res.status(500).json({ error: 'Terjadi kesalahan server' });
    }
  });

  // POST /api/financial-statements/balance-sheet
  router.post('/balance-sheet', requirePermission('cfd.balance_sheets.write'), async (req: Request, res: Response): Promise<void> => {
    const {
      corporateId,
      period,
      cashAndBank,
      accountsReceivable,
      workInProgress,
      inventory,
      prepaidExpenses,
      land,
      building,
      equipment,
      otherFixedAssets,
      accountsPayable,
      bankLoanCurrent,
      otherCurrentLiabilities,
      bankLoanLongTerm,
      otherLongTermLiabilities,
      shareholderLoan,
      capital,
      earningsAfterTax,
      retainedEarnings,
      dividends,
      notes,
    } = req.body ?? {};

    if (!corporateId?.trim()) {
      res.status(400).json({ error: 'Field "corporateId" wajib diisi' });
      return;
    }
    if (!period?.trim()) {
      res.status(400).json({ error: 'Field "period" wajib diisi (format: YYYY-MM)' });
      return;
    }

    const { userId } = req.user ?? {};
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    try {
      const saved = await saveBalanceSheet({
        id: req.body.id,
        corporateId: corporateId.trim(),
        period: period.trim(),
        cashAndBank: cashAndBank != null ? String(cashAndBank) : undefined,
        accountsReceivable: accountsReceivable != null ? String(accountsReceivable) : undefined,
        workInProgress: workInProgress != null ? String(workInProgress) : undefined,
        inventory: inventory != null ? String(inventory) : undefined,
        prepaidExpenses: prepaidExpenses != null ? String(prepaidExpenses) : undefined,
        land: land != null ? String(land) : undefined,
        building: building != null ? String(building) : undefined,
        equipment: equipment != null ? String(equipment) : undefined,
        otherFixedAssets: otherFixedAssets != null ? String(otherFixedAssets) : undefined,
        accountsPayable: accountsPayable != null ? String(accountsPayable) : undefined,
        bankLoanCurrent: bankLoanCurrent != null ? String(bankLoanCurrent) : undefined,
        otherCurrentLiabilities: otherCurrentLiabilities != null ? String(otherCurrentLiabilities) : undefined,
        bankLoanLongTerm: bankLoanLongTerm != null ? String(bankLoanLongTerm) : undefined,
        otherLongTermLiabilities: otherLongTermLiabilities != null ? String(otherLongTermLiabilities) : undefined,
        shareholderLoan: shareholderLoan != null ? String(shareholderLoan) : undefined,
        capital: capital != null ? String(capital) : undefined,
        earningsAfterTax: earningsAfterTax != null ? String(earningsAfterTax) : undefined,
        retainedEarnings: retainedEarnings != null ? String(retainedEarnings) : undefined,
        dividends: dividends != null ? String(dividends) : undefined,
        notes,
      }, userId);
      res.status(201).json(saved);
    } catch (err) {
      console.error('[BalanceSheet] POST error:', err);
      if (err instanceof ValidationError) {
        res.status(400).json({ error: err.message });
        return;
      }
      res.status(500).json({ error: 'Terjadi kesalahan server' });
    }
  });

  // DELETE /api/financial-statements/balance-sheet/:id
  router.delete('/balance-sheet/:id', requirePermission('cfd.balance_sheets.delete'), async (req: Request, res: Response): Promise<void> => {
    try {
      await deleteBalanceSheet(req.params.id);
      res.status(200).json({ message: 'Data neraca berhasil dihapus' });
    } catch {
      res.status(500).json({ error: 'Terjadi kesalahan server' });
    }
  });

  // ─── Income Statement ───────────────────────────────────────────────────────

  // GET /api/financial-statements/income-statement
  router.get('/income-statement', requirePermission('cfd.income_statements.read'), async (req: Request, res: Response): Promise<void> => {
    const { period, periodStart, periodEnd, corporateId, page, pageSize } = req.query as Record<string, string>;
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    try {
      const p = parseInt(page ?? '1', 10);
      const ps = parseInt(pageSize ?? '10', 10);
      const { data, totalCount } = await getIncomeStatements(userId, { 
        period, 
        periodStart,
        periodEnd,
        corporateId, 
        page: p, 
        pageSize: ps 
      });
      res.json({
        records: data,
        totalCount,
        totalPages: Math.ceil(totalCount / ps)
      });
    } catch {
      res.status(500).json({ error: 'Terjadi kesalahan server' });
    }
  });

  // POST /api/financial-statements/income-statement
  router.post('/income-statement', requirePermission('cfd.income_statements.write'), async (req: Request, res: Response): Promise<void> => {
    const {
      corporateId,
      period,
      revenue,
      cogs,
      operatingExpenses,
      interestExpense,
      taxExpense,
      notes,
    } = req.body ?? {};

    if (!corporateId?.trim()) {
      res.status(400).json({ error: 'Field "corporateId" wajib diisi' });
      return;
    }
    if (!period?.trim()) {
      res.status(400).json({ error: 'Field "period" wajib diisi (format: YYYY-MM)' });
      return;
    }

    const { userId } = req.user ?? {};
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    try {
      const saved = await saveIncomeStatement({
        id: req.body.id,
        corporateId: corporateId.trim(),
        period: period.trim(),
        revenue: revenue != null ? String(revenue) : undefined,
        cogs: cogs != null ? String(cogs) : undefined,
        operatingExpenses: operatingExpenses != null ? String(operatingExpenses) : undefined,
        interestExpense: interestExpense != null ? String(interestExpense) : undefined,
        taxExpense: taxExpense != null ? String(taxExpense) : undefined,
        notes,
      }, userId);
      res.status(201).json(saved);
    } catch (err) {
      console.error('[IncomeStatement] POST error:', err);
      if (err instanceof ValidationError) {
        res.status(400).json({ error: err.message });
        return;
      }
      res.status(500).json({ error: 'Terjadi kesalahan server' });
    }
  });

  // DELETE /api/financial-statements/income-statement/:id
  router.delete('/income-statement/:id', requirePermission('cfd.income_statements.delete'), async (req: Request, res: Response): Promise<void> => {
    try {
      await deleteIncomeStatement(req.params.id);
      res.status(200).json({ message: 'Data laba rugi berhasil dihapus' });
    } catch {
      res.status(500).json({ error: 'Terjadi kesalahan server' });
    }
  });

  // ─── Cash Flow ──────────────────────────────────────────────────────────────

  // GET /api/financial-statements/cash-flow
  router.get('/cash-flow', requirePermission('cfd.weekly_cash_flows.read'), async (req: Request, res: Response): Promise<void> => {
    const { period, periodStart, periodEnd, corporateId, entityType, entityId, search, page, pageSize } = req.query as Record<string, string>;
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    try {
      const p = parseInt(page ?? '1', 10);
      const ps = parseInt(pageSize ?? '10', 10);
      const { data, totalCount } = await getCashFlows(userId, { 
        period, 
        periodStart,
        periodEnd,
        corporateId, 
        entityType, 
        entityId, 
        search,
        page: p, 
        pageSize: ps 
      });
      res.json({
        records: data,
        totalCount,
        totalPages: Math.ceil(totalCount / ps)
      });
    } catch {
      res.status(500).json({ error: 'Terjadi kesalahan server' });
    }
  });

  // POST /api/financial-statements/cash-flow
  router.post('/cash-flow', requirePermission('cfd.weekly_cash_flows.write'), async (req: Request, res: Response): Promise<void> => {
    const {
      corporateId,
      entityType,
      entityId,
      period,
      week,
      operatingCashIn,
      operatingCashOut,
      investingCashIn,
      investingCashOut,
      financingCashIn,
      financingCashOut,
      notes,
    } = req.body ?? {};

    if (!corporateId?.trim()) {
      res.status(400).json({ error: 'Field "corporateId" wajib diisi' });
      return;
    }
    if (!entityType?.trim()) {
      res.status(400).json({ error: 'Field "entityType" wajib diisi' });
      return;
    }
    if (!entityId?.trim()) {
      res.status(400).json({ error: 'Field "entityId" wajib diisi' });
      return;
    }
    if (!period?.trim()) {
      res.status(400).json({ error: 'Field "period" wajib diisi (format: YYYY-MM)' });
      return;
    }
    if (!week?.trim()) {
      res.status(400).json({ error: 'Field "week" wajib diisi' });
      return;
    }

    const { userId } = req.user ?? {};
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    try {
      const saved = await saveCashFlow({
        id: req.body.id,
        corporateId: corporateId.trim(),
        entityType: entityType.trim(),
        entityId: entityId.trim(),
        period: period.trim(),
        week: week.trim(),
        operatingCashIn: operatingCashIn != null ? String(operatingCashIn) : undefined,
        operatingCashOut: operatingCashOut != null ? String(operatingCashOut) : undefined,
        investingCashIn: investingCashIn != null ? String(investingCashIn) : undefined,
        investingCashOut: investingCashOut != null ? String(investingCashOut) : undefined,
        financingCashIn: financingCashIn != null ? String(financingCashIn) : undefined,
        financingCashOut: financingCashOut != null ? String(financingCashOut) : undefined,
        notes,
      }, userId);
      res.status(201).json(saved);
    } catch (err) {
      console.error('[WeeklyCashFlow] POST error:', err);
      if (err instanceof ValidationError) {
        res.status(400).json({ error: err.message });
        return;
      }
      res.status(500).json({ error: 'Terjadi kesalahan server' });
    }
  });

  // DELETE /api/financial-statements/cash-flow/:id
  router.delete('/cash-flow/:id', requirePermission('cfd.weekly_cash_flows.delete'), async (req: Request, res: Response): Promise<void> => {
    try {
      await deleteCashFlow(req.params.id);
      res.status(200).json({ message: 'Data arus kas berhasil dihapus' });
    } catch {
      res.status(500).json({ error: 'Terjadi kesalahan server' });
    }
  });

  return router;
}

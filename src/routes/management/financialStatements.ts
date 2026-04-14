// Financial Statement Routes — MAFINDA Dashboard Enhancement
// Requirements: 8.7, 8.8, 8.9, 8.10

import { Router, Request, Response } from 'express';
import {
  saveBalanceSheet,
  getBalanceSheets,
  saveIncomeStatement,
  getIncomeStatements,
  saveCashFlow,
  getCashFlows,
  ValidationError,
} from '../../services/mafinda/financialStatementService.js';

export function createFinancialStatementRouter(): Router {
  const router = Router();

  // ─── Balance Sheet ──────────────────────────────────────────────────────────

  // GET /api/financial-statements/balance-sheet
  router.get('/balance-sheet', async (req: Request, res: Response): Promise<void> => {
    const { period, departmentId } = req.query as Record<string, string>;
    try {
      const data = await getBalanceSheets({ period, departmentId });
      res.json(data);
    } catch {
      res.status(500).json({ error: 'Terjadi kesalahan server' });
    }
  });

  // POST /api/financial-statements/balance-sheet
  router.post('/balance-sheet', async (req: Request, res: Response): Promise<void> => {
    const {
      departmentId,
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

    if (!departmentId?.trim()) {
      res.status(400).json({ error: 'Field "departmentId" wajib diisi' });
      return;
    }
    if (!period?.trim()) {
      res.status(400).json({ error: 'Field "period" wajib diisi (format: YYYY-MM)' });
      return;
    }

    const createdBy = (req as any).user?.username ?? 'system';

    try {
      const saved = await saveBalanceSheet({
        departmentId: departmentId.trim(),
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
      }, createdBy);
      res.status(201).json(saved);
    } catch (err) {
      if (err instanceof ValidationError) {
        res.status(400).json({ error: err.message });
        return;
      }
      res.status(500).json({ error: 'Terjadi kesalahan server' });
    }
  });

  // ─── Income Statement ───────────────────────────────────────────────────────

  // GET /api/financial-statements/income-statement
  router.get('/income-statement', async (req: Request, res: Response): Promise<void> => {
    const { period, departmentId } = req.query as Record<string, string>;
    try {
      const data = await getIncomeStatements({ period, departmentId });
      res.json(data);
    } catch {
      res.status(500).json({ error: 'Terjadi kesalahan server' });
    }
  });

  // POST /api/financial-statements/income-statement
  router.post('/income-statement', async (req: Request, res: Response): Promise<void> => {
    const {
      departmentId,
      period,
      revenue,
      cogs,
      operatingExpenses,
      interestExpense,
      taxExpense,
      notes,
    } = req.body ?? {};

    if (!departmentId?.trim()) {
      res.status(400).json({ error: 'Field "departmentId" wajib diisi' });
      return;
    }
    if (!period?.trim()) {
      res.status(400).json({ error: 'Field "period" wajib diisi (format: YYYY-MM)' });
      return;
    }

    const createdBy = (req as any).user?.username ?? 'system';

    try {
      const saved = await saveIncomeStatement({
        departmentId: departmentId.trim(),
        period: period.trim(),
        revenue: revenue != null ? String(revenue) : undefined,
        cogs: cogs != null ? String(cogs) : undefined,
        operatingExpenses: operatingExpenses != null ? String(operatingExpenses) : undefined,
        interestExpense: interestExpense != null ? String(interestExpense) : undefined,
        taxExpense: taxExpense != null ? String(taxExpense) : undefined,
        notes,
      }, createdBy);
      res.status(201).json(saved);
    } catch (err) {
      if (err instanceof ValidationError) {
        res.status(400).json({ error: err.message });
        return;
      }
      res.status(500).json({ error: 'Terjadi kesalahan server' });
    }
  });

  // ─── Cash Flow ──────────────────────────────────────────────────────────────

  // GET /api/financial-statements/cash-flow
  router.get('/cash-flow', async (req: Request, res: Response): Promise<void> => {
    const { period, departmentId, entityType, entityId } = req.query as Record<string, string>;
    try {
      const data = await getCashFlows({ period, departmentId, entityType, entityId });
      res.json(data);
    } catch {
      res.status(500).json({ error: 'Terjadi kesalahan server' });
    }
  });

  // POST /api/financial-statements/cash-flow
  router.post('/cash-flow', async (req: Request, res: Response): Promise<void> => {
    const {
      departmentId,
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

    if (!departmentId?.trim()) {
      res.status(400).json({ error: 'Field "departmentId" wajib diisi' });
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

    const createdBy = (req as any).user?.username ?? 'system';

    try {
      const saved = await saveCashFlow({
        departmentId: departmentId.trim(),
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
      }, createdBy);
      res.status(201).json(saved);
    } catch (err) {
      if (err instanceof ValidationError) {
        res.status(400).json({ error: err.message });
        return;
      }
      res.status(500).json({ error: 'Terjadi kesalahan server' });
    }
  });

  return router;
}

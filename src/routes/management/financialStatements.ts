// Financial Statement Routes — MAFINDA Dashboard Enhancement
// Requirements: 8.7, 8.8, 8.9, 8.10

import { Router, Request, Response } from 'express';
import Database from 'better-sqlite3';
import {
  saveBalanceSheet,
  getBalanceSheets,
  saveIncomeStatement,
  getIncomeStatements,
  saveCashFlow,
  getCashFlows,
  ValidationError,
} from '../../services/mafinda/financialStatementService.js';

export function createFinancialStatementRouter(db: Database.Database): Router {
  const router = Router();

  // ─── Balance Sheet ──────────────────────────────────────────────────────────

  // GET /api/financial-statements/balance-sheet
  router.get('/balance-sheet', (req: Request, res: Response): void => {
    const { period } = req.query as Record<string, string>;
    try {
      const data = getBalanceSheets(db, period ? { period } : undefined);
      res.json(data);
    } catch {
      res.status(500).json({ error: 'Terjadi kesalahan server' });
    }
  });

  // POST /api/financial-statements/balance-sheet
  router.post('/balance-sheet', (req: Request, res: Response): void => {
    const {
      period,
      currentAssets,
      fixedAssets,
      otherAssets,
      shortTermLiabilities,
      longTermLiabilities,
      paidInCapital,
      retainedEarnings,
      otherEquity,
    } = req.body ?? {};

    if (!period?.trim()) {
      res.status(400).json({ error: 'Field "period" wajib diisi (format: YYYY-MM)' });
      return;
    }

    const numericFields = {
      currentAssets,
      fixedAssets,
      otherAssets,
      shortTermLiabilities,
      longTermLiabilities,
      paidInCapital,
      retainedEarnings,
      otherEquity,
    };

    for (const [key, val] of Object.entries(numericFields)) {
      if (val === undefined || val === null || isNaN(Number(val))) {
        res.status(400).json({ error: `Field "${key}" wajib diisi dan harus berupa angka` });
        return;
      }
    }

    try {
      const saved = saveBalanceSheet(db, {
        period: period.trim(),
        currentAssets: Number(currentAssets),
        fixedAssets: Number(fixedAssets),
        otherAssets: Number(otherAssets),
        shortTermLiabilities: Number(shortTermLiabilities),
        longTermLiabilities: Number(longTermLiabilities),
        paidInCapital: Number(paidInCapital),
        retainedEarnings: Number(retainedEarnings),
        otherEquity: Number(otherEquity),
      });
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
  router.get('/income-statement', (req: Request, res: Response): void => {
    const { period } = req.query as Record<string, string>;
    try {
      const data = getIncomeStatements(db, period ? { period } : undefined);
      res.json(data);
    } catch {
      res.status(500).json({ error: 'Terjadi kesalahan server' });
    }
  });

  // POST /api/financial-statements/income-statement
  router.post('/income-statement', (req: Request, res: Response): void => {
    const {
      period,
      revenue,
      costOfGoodsSold,
      operationalExpenses,
      interestExpense,
      tax,
      netProfit,
    } = req.body ?? {};

    if (!period?.trim()) {
      res.status(400).json({ error: 'Field "period" wajib diisi (format: YYYY-MM)' });
      return;
    }

    const numericFields = {
      revenue,
      costOfGoodsSold,
      operationalExpenses,
      interestExpense,
      tax,
      netProfit,
    };

    for (const [key, val] of Object.entries(numericFields)) {
      if (val === undefined || val === null || isNaN(Number(val))) {
        res.status(400).json({ error: `Field "${key}" wajib diisi dan harus berupa angka` });
        return;
      }
    }

    try {
      const saved = saveIncomeStatement(db, {
        period: period.trim(),
        revenue: Number(revenue),
        costOfGoodsSold: Number(costOfGoodsSold),
        operationalExpenses: Number(operationalExpenses),
        interestExpense: Number(interestExpense),
        tax: Number(tax),
        netProfit: Number(netProfit),
      });
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
  router.get('/cash-flow', (req: Request, res: Response): void => {
    const { period, departmentId, projectId } = req.query as Record<string, string>;
    try {
      const data = getCashFlows(db, {
        period,
        departmentId,
        projectId,
      });
      res.json(data);
    } catch {
      res.status(500).json({ error: 'Terjadi kesalahan server' });
    }
  });

  // POST /api/financial-statements/cash-flow
  router.post('/cash-flow', (req: Request, res: Response): void => {
    const {
      period,
      departmentId,
      projectId,
      operatingCashIn,
      operatingCashOut,
      investingCashIn,
      investingCashOut,
      financingCashIn,
      financingCashOut,
    } = req.body ?? {};

    if (!period?.trim()) {
      res.status(400).json({ error: 'Field "period" wajib diisi (format: YYYY-MM)' });
      return;
    }

    const numericFields = {
      operatingCashIn,
      operatingCashOut,
      investingCashIn,
      investingCashOut,
      financingCashIn,
      financingCashOut,
    };

    for (const [key, val] of Object.entries(numericFields)) {
      if (val === undefined || val === null || isNaN(Number(val))) {
        res.status(400).json({ error: `Field "${key}" wajib diisi dan harus berupa angka` });
        return;
      }
    }

    try {
      const saved = saveCashFlow(db, {
        period: period.trim(),
        departmentId: departmentId ?? undefined,
        projectId: projectId ?? undefined,
        operatingCashIn: Number(operatingCashIn),
        operatingCashOut: Number(operatingCashOut),
        investingCashIn: Number(investingCashIn),
        investingCashOut: Number(investingCashOut),
        financingCashIn: Number(financingCashIn),
        financingCashOut: Number(financingCashOut),
      });
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

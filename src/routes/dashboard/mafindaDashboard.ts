// MAFINDA Dashboard API Routes
// Requirements: 1.6, 2.5, 3.5, 4.5, 5.5, 6.5

import { Router, Request, Response } from 'express';
import Database from 'better-sqlite3';
import {
  getDeptRevenueTarget,
  getRevenueCostSummary,
  getCashFlowData,
  getAssetComposition,
  getEquityLiabilityComposition,
  getHistoricalData,
} from '../../services/mafinda/dashboardService.js';

export function createMafindaDashboardRouter(db: Database.Database): Router {
  const router = Router();

  /**
   * GET /api/dashboard/dept-revenue-target
   * Target vs realisasi revenue per departemen
   * Requirements: 1.6
   * Query params: period (required, format YYYY-MM), periodType (required: monthly|quarterly|annual)
   */
  router.get('/dept-revenue-target', (req: Request, res: Response) => {
    const { period, periodType } = req.query as Record<string, string>;

    if (!period) {
      res.status(400).json({ error: 'Parameter period wajib diisi (format: YYYY-MM)' });
      return;
    }
    if (!periodType || !['monthly', 'quarterly', 'annual'].includes(periodType)) {
      res.status(400).json({ error: 'Parameter periodType wajib diisi (monthly|quarterly|annual)' });
      return;
    }

    try {
      const data = getDeptRevenueTarget(db, period, periodType);
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: 'Terjadi kesalahan server' });
    }
  });

  /**
   * GET /api/dashboard/revenue-cost-summary
   * Ringkasan revenue & biaya operasional
   * Requirements: 2.5
   * Query params: period (required), departmentId (optional)
   */
  router.get('/revenue-cost-summary', (req: Request, res: Response) => {
    const { period, departmentId } = req.query as Record<string, string>;

    if (!period) {
      res.status(400).json({ error: 'Parameter period wajib diisi (format: YYYY-MM)' });
      return;
    }

    try {
      const data = getRevenueCostSummary(db, period, departmentId);
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: 'Terjadi kesalahan server' });
    }
  });

  /**
   * GET /api/dashboard/cash-flow
   * Data arus kas dengan filter departemen & proyek
   * Requirements: 3.5
   * Query params: period (required), months (optional), departmentId (optional), projectId (optional)
   */
  router.get('/cash-flow', (req: Request, res: Response) => {
    const { period, months, departmentId, projectId } = req.query as Record<string, string>;

    if (!period) {
      res.status(400).json({ error: 'Parameter period wajib diisi (format: YYYY-MM)' });
      return;
    }

    const monthsNum = months ? parseInt(months, 10) : 6;
    if (months && (isNaN(monthsNum) || monthsNum < 1)) {
      res.status(400).json({ error: 'Parameter months harus berupa angka positif' });
      return;
    }

    try {
      const data = getCashFlowData(db, period, monthsNum, departmentId, projectId);
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: 'Terjadi kesalahan server' });
    }
  });

  /**
   * GET /api/dashboard/asset-composition
   * Komposisi aset dari neraca
   * Requirements: 4.5
   * Query params: period (required, format YYYY-MM)
   */
  router.get('/asset-composition', (req: Request, res: Response) => {
    const { period } = req.query as Record<string, string>;

    if (!period) {
      res.status(400).json({ error: 'Parameter period wajib diisi (format: YYYY-MM)' });
      return;
    }

    try {
      const data = getAssetComposition(db, period);
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: 'Terjadi kesalahan server' });
    }
  });

  /**
   * GET /api/dashboard/equity-liability-composition
   * Komposisi ekuitas & liabilitas dari neraca
   * Requirements: 5.5
   * Query params: period (required, format YYYY-MM)
   */
  router.get('/equity-liability-composition', (req: Request, res: Response) => {
    const { period } = req.query as Record<string, string>;

    if (!period) {
      res.status(400).json({ error: 'Parameter period wajib diisi (format: YYYY-MM)' });
      return;
    }

    try {
      const data = getEquityLiabilityComposition(db, period);
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: 'Terjadi kesalahan server' });
    }
  });

  /**
   * GET /api/dashboard/historical-data
   * Data keuangan historis multi-metrik
   * Requirements: 6.5
   * Query params: months (required: 3|6|12|24)
   */
  router.get('/historical-data', (req: Request, res: Response) => {
    const { months } = req.query as Record<string, string>;

    if (!months) {
      res.status(400).json({ error: 'Parameter months wajib diisi (3|6|12|24)' });
      return;
    }

    const monthsNum = parseInt(months, 10);
    if (isNaN(monthsNum) || ![3, 6, 12, 24].includes(monthsNum)) {
      res.status(400).json({ error: 'Parameter months harus salah satu dari: 3, 6, 12, 24' });
      return;
    }

    try {
      const data = getHistoricalData(db, monthsNum);
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: 'Terjadi kesalahan server' });
    }
  });

  return router;
}

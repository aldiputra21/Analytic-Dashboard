// MAFINDA Dashboard API Routes
// Requirements: 1.6, 2.5, 3.5, 4.5, 5.5, 6.5

import { Router, Request, Response } from 'express';
import { requirePermission } from '../../middleware/rbac';
import {
  getDeptRevenueTarget,
  getRevenueCostSummary,
  getCashFlowData,
  getAssetComposition,
  getEquityLiabilityComposition,
  getHistoricalData,
} from '../../services/mafinda/dashboardService.js';

export function createMafindaDashboardRouter(): Router {
  const router = Router();

  /**
   * GET /api/dashboard/dept-revenue-target
   * Target vs realisasi revenue per departemen
   * Requirements: 1.6
   * Query params: period (required, format YYYY-MM), corporateId (optional for owner role)
   */
  router.get('/dept-revenue-target', requirePermission('cfd.dashboard.read'), async (req: Request, res: Response) => {
    const { period, corporateId } = req.query as Record<string, string>;

    if (!period) {
      res.status(400).json({ error: 'Parameter period wajib diisi (format: YYYY-MM)' });
      return;
    }
    // Owner role (system scope) can access all; others require corporateId
    const userRole = req.user?.role;
    if (userRole !== 'owner' && !corporateId) {
      res.status(400).json({ error: 'Parameter corporateId wajib diisi untuk non-owner role' });
      return;
    }

    try {
      const data = await getDeptRevenueTarget(period, corporateId);
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
  router.get('/revenue-cost-summary', requirePermission('cfd.dashboard.read'), async (req: Request, res: Response) => {
    const { period, corporateId } = req.query as Record<string, string>;

    if (!period) {
      res.status(400).json({ error: 'Parameter period wajib diisi (format: YYYY-MM)' });
      return;
    }

    try {
      const data = await getRevenueCostSummary(period, corporateId);
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: 'Terjadi kesalahan server' });
    }
  });

  /**
   * GET /api/dashboard/cash-flow
   * Data arus kas dengan filter departemen & proyek
   * Requirements: 3.5
   * Query params: period (required), months (optional), departmentId (optional), entityType (optional), entityId (optional)
   */
  router.get('/cash-flow', requirePermission('cfd.dashboard.read'), async (req: Request, res: Response) => {
    const { period, months, corporateId, entityType, entityId } = req.query as Record<string, string>;

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
      const data = await getCashFlowData(period, monthsNum, corporateId, entityType, entityId);
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: 'Terjadi kesalahan server' });
    }
  });

  /**
   * GET /api/dashboard/asset-composition
   * Komposisi aset dari neraca
   * Requirements: 4.5
   * Query params: period (required, format YYYY-MM), departmentId (optional)
   */
  router.get('/asset-composition', requirePermission('cfd.dashboard.read'), async (req: Request, res: Response) => {
    const { period, corporateId } = req.query as Record<string, string>;

    if (!period) {
      res.status(400).json({ error: 'Parameter period wajib diisi (format: YYYY-MM)' });
      return;
    }

    try {
      const data = await getAssetComposition(period, corporateId);
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: 'Terjadi kesalahan server' });
    }
  });

  /**
   * GET /api/dashboard/equity-liability-composition
   * Komposisi ekuitas & liabilitas dari neraca
   * Requirements: 5.5
   * Query params: period (required, format YYYY-MM), departmentId (optional)
   */
  router.get('/equity-liability-composition', requirePermission('cfd.dashboard.read'), async (req: Request, res: Response) => {
    const { period, corporateId } = req.query as Record<string, string>;

    if (!period) {
      res.status(400).json({ error: 'Parameter period wajib diisi (format: YYYY-MM)' });
      return;
    }

    try {
      const data = await getEquityLiabilityComposition(period, corporateId);
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
  router.get('/historical-data', requirePermission('cfd.dashboard.read'), async (req: Request, res: Response) => {
    const { months, corporateId } = req.query as Record<string, string>;

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
      const data = await getHistoricalData(monthsNum, corporateId);
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: 'Terjadi kesalahan server' });
    }
  });

  return router;
}

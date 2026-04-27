// MAFINDA Dashboard API Routes
// Requirements: 1.6, 2.5, 3.5, 4.5, 5.5, 6.5

import { Router, Request, Response } from 'express';
import { requirePermission, injectAccessContext } from '../../middleware/rbac';
import { asyncHandler } from '../../utils/asyncHandler';
import {
  getDeptRevenueTarget,
  getRevenueCostSummary,
  getCashFlowData,
  getAssetComposition,
  getEquityLiabilityComposition,
  getHistoricalData,
} from '../../services/mafinda/dashboardService';

export function createMafindaDashboardRouter(): Router {
  const router = Router();

  /**
   * GET /api/dashboard/dept-revenue-target
   * Target vs realisasi revenue per departemen
   * Requirements: 1.6
   * Query params: period (required, format YYYY-MM), corporateId (optional for owner role)
   */
  router.get('/dept-revenue-target', requirePermission('cfd.dashboard.read'), injectAccessContext, asyncHandler(async (req: Request, res: Response) => {
    const { period, corporateId } = req.query as Record<string, string>;
    const access = req.accessContext!;

    if (!period) {
      res.status(400).json({ error: 'Parameter period wajib diisi (format: YYYY-MM)' });
      return;
    }

    // RBAC: Enforce corporate filtering
    let targetCorpId = corporateId;
    if (access.scope !== 'system') {
      if (corporateId && !access.corporateIds.includes(corporateId)) {
        res.status(403).json({ error: 'Anda tidak memiliki akses ke perusahaan ini' });
        return;
      }
      targetCorpId = corporateId || access.corporateIds[0];
    }

    if (!targetCorpId) {
      res.status(400).json({ error: 'Parameter corporateId wajib diisi' });
      return;
    }

    const data = await getDeptRevenueTarget(period, targetCorpId);
    res.json(data);
  }));



  /**
   * GET /api/dashboard/revenue-cost-summary
   * Ringkasan revenue & biaya operasional
   * Requirements: 2.5
   * Query params: period (required), departmentId (optional)
   */
  router.get('/revenue-cost-summary', requirePermission('cfd.dashboard.read'), injectAccessContext, asyncHandler(async (req: Request, res: Response) => {
    const { period, corporateId } = req.query as Record<string, string>;
    const access = req.accessContext!;

    if (!period) {
      res.status(400).json({ error: 'Parameter period wajib diisi (format: YYYY-MM)' });
      return;
    }

    // RBAC: Enforce corporate filtering
    let targetCorpId = corporateId;
    if (access.scope !== 'system') {
      if (corporateId && !access.corporateIds.includes(corporateId)) {
        res.status(403).json({ error: 'Anda tidak memiliki akses ke perusahaan ini' });
        return;
      }
      targetCorpId = corporateId || access.corporateIds[0];
    }

    const data = await getRevenueCostSummary(period, targetCorpId);
    res.json(data);
  }));

  /**
   * GET /api/dashboard/cash-flow
   * Data arus kas dengan filter departemen & proyek
   * Requirements: 3.5
   * Query params: period (required), months (optional), departmentId (optional), entityType (optional), entityId (optional)
   */
  router.get('/cash-flow', requirePermission('cfd.dashboard.read'), injectAccessContext, asyncHandler(async (req: Request, res: Response) => {
    const { period, months, corporateId, entityType, entityId } = req.query as Record<string, string>;
    const access = req.accessContext!;

    if (!period) {
      res.status(400).json({ error: 'Parameter period wajib diisi (format: YYYY-MM)' });
      return;
    }

    const monthsNum = months ? parseInt(months, 10) : 6;
    if (months && (isNaN(monthsNum) || monthsNum < 1)) {
      res.status(400).json({ error: 'Parameter months harus berupa angka positif' });
      return;
    }

    // RBAC: Enforce corporate filtering
    let targetCorpId = corporateId;
    if (access.scope !== 'system') {
      if (corporateId && !access.corporateIds.includes(corporateId)) {
        res.status(403).json({ error: 'Anda tidak memiliki akses ke perusahaan ini' });
        return;
      }
      targetCorpId = corporateId || access.corporateIds[0];
    }

    const data = await getCashFlowData(period, monthsNum, targetCorpId, entityType, entityId);
    res.json(data);
  }));

  /**
   * GET /api/dashboard/asset-composition
   * Komposisi aset dari neraca
   * Requirements: 4.5
   * Query params: period (required, format YYYY-MM), departmentId (optional)
   */
  router.get('/asset-composition', requirePermission('cfd.dashboard.read'), injectAccessContext, asyncHandler(async (req: Request, res: Response) => {
    const { period, corporateId } = req.query as Record<string, string>;
    const access = req.accessContext!;

    if (!period) {
      res.status(400).json({ error: 'Parameter period wajib diisi (format: YYYY-MM)' });
      return;
    }

    // RBAC: Enforce corporate filtering
    let targetCorpId = corporateId;
    if (access.scope !== 'system') {
      if (corporateId && !access.corporateIds.includes(corporateId)) {
        res.status(403).json({ error: 'Anda tidak memiliki akses ke perusahaan ini' });
        return;
      }
      targetCorpId = corporateId || access.corporateIds[0];
    }

    const data = await getAssetComposition(period, targetCorpId);
    res.json(data);
  }));

  /**
   * GET /api/dashboard/equity-liability-composition
   * Komposisi ekuitas & liabilitas dari neraca
   * Requirements: 5.5
   * Query params: period (required, format YYYY-MM), departmentId (optional)
   */
  router.get('/equity-liability-composition', requirePermission('cfd.dashboard.read'), injectAccessContext, asyncHandler(async (req: Request, res: Response) => {
    const { period, corporateId } = req.query as Record<string, string>;
    const access = req.accessContext!;

    if (!period) {
      res.status(400).json({ error: 'Parameter period wajib diisi (format: YYYY-MM)' });
      return;
    }

    // RBAC: Enforce corporate filtering
    let targetCorpId = corporateId;
    if (access.scope !== 'system') {
      if (corporateId && !access.corporateIds.includes(corporateId)) {
        res.status(403).json({ error: 'Anda tidak memiliki akses ke perusahaan ini' });
        return;
      }
      targetCorpId = corporateId || access.corporateIds[0];
    }

    const data = await getEquityLiabilityComposition(period, targetCorpId);
    res.json(data);
  }));

  /**
   * GET /api/dashboard/historical-data
   * Data keuangan historis multi-metrik
   * Requirements: 6.5
   * Query params: months (required: 3|6|12|24)
   */
  router.get('/historical-data', requirePermission('cfd.dashboard.read'), injectAccessContext, asyncHandler(async (req: Request, res: Response) => {
    const { months, corporateId } = req.query as Record<string, string>;
    const access = req.accessContext!;

    if (!months) {
      res.status(400).json({ error: 'Parameter months wajib diisi (3|6|12|24)' });
      return;
    }

    const monthsNum = parseInt(months, 10);
    if (isNaN(monthsNum) || ![3, 6, 12, 24].includes(monthsNum)) {
      res.status(400).json({ error: 'Parameter months harus salah satu dari: 3, 6, 12, 24' });
      return;
    }

    // RBAC: Enforce corporate filtering
    let targetCorpId = corporateId;
    if (access.scope !== 'system') {
      if (corporateId && !access.corporateIds.includes(corporateId)) {
        res.status(403).json({ error: 'Anda tidak memiliki akses ke perusahaan ini' });
        return;
      }
      targetCorpId = corporateId || access.corporateIds[0];
    }

    const data = await getHistoricalData(monthsNum, targetCorpId);
    res.json(data);
  }));

  return router;
}

// MAFINDA Dashboard API Routes
// Requirements: 1.6, 2.5, 3.5, 4.5, 5.5, 6.5

import { Router, Request, Response } from 'express';
import { requirePermission, injectAccessContext } from '../../middleware/rbac';
import { asyncHandler } from '../../utils/asyncHandler';
import { AppError, ErrorCode } from '../../utils/errors.js';
import {
  getDeptRevenueTarget,
  getRevenueCostSummary,
  getCashFlowData,
  getAssetComposition,
  getEquityLiabilityComposition,
  getHistoricalData,
  getDashboardAggregated,
} from '../../services/mafinda/dashboardService';

export function createMafindaDashboardRouter(): Router {
  const router = Router();

  /**
   * GET /api/mafinda/dashboard/dept-revenue-target
   * Target vs realisasi revenue per departemen
   * Requirements: 1.6
   * Query params: period (required, format YYYY-MM), corporateId (optional for owner role)
   */
  router.get('/dept-revenue-target', requirePermission('cfd.dashboard.read'), injectAccessContext, asyncHandler(async (req: Request, res: Response) => {
    const { period, corporateId } = req.query as Record<string, string>;
    const access = (req as any).accessContext!;

    if (!period) {
      throw AppError.badRequest(ErrorCode.PERIOD_REQUIRED, 'Period is required');
    }

    // RBAC: Enforce corporate filtering
    let targetCorpId = corporateId;
    if (access.scope !== 'system') {
      if (corporateId && !access.corporateIds.includes(corporateId)) {
        throw AppError.forbidden(ErrorCode.CORPORATE_ACCESS_DENIED, 'Access denied to this corporate');
      }
      targetCorpId = corporateId || access.corporateIds[0];
    }

    const data = await getDeptRevenueTarget(period, targetCorpId);
    res.json(data);
  }));



  /**
   * GET /api/mafinda/dashboard/revenue-cost-summary
   * Ringkasan revenue & biaya operasional
   * Requirements: 2.5
   * Query params: period (required), departmentId (optional)
   */
  router.get('/revenue-cost-summary', requirePermission('cfd.dashboard.read'), injectAccessContext, asyncHandler(async (req: Request, res: Response) => {
    const { period, corporateId } = req.query as Record<string, string>;
    const access = (req as any).accessContext!;

    if (!period) {
      throw AppError.badRequest(ErrorCode.PERIOD_REQUIRED, 'Period is required');
    }

    // RBAC: Enforce corporate filtering
    let targetCorpId = corporateId;
    if (access.scope !== 'system') {
      if (corporateId && !access.corporateIds.includes(corporateId)) {
        throw AppError.forbidden(ErrorCode.CORPORATE_ACCESS_DENIED, 'Access denied to this corporate');
      }
      targetCorpId = corporateId || access.corporateIds[0];
    }

    const data = await getRevenueCostSummary(period, targetCorpId);
    res.json(data);
  }));

  /**
   * GET /api/mafinda/dashboard/cash-flow
   * Data arus kas dengan filter departemen & proyek
   * Requirements: 3.5
   * Query params: period (required), months (optional), departmentId (optional), entityType (optional), entityId (optional)
   */
  router.get('/cash-flow', requirePermission('cfd.dashboard.read'), injectAccessContext, asyncHandler(async (req: Request, res: Response) => {
    const { period, months, corporateId, entityType, entityId } = req.query as Record<string, string>;
    const access = (req as any).accessContext!;

    if (!period) {
      throw AppError.badRequest(ErrorCode.PERIOD_REQUIRED, 'Period is required');
    }

    const monthsNum = months ? parseInt(months, 10) : 6;
    if (months && (isNaN(monthsNum) || monthsNum < 1)) {
      throw AppError.badRequest(ErrorCode.INVALID_INPUT, 'Parameter months must be a positive number');
    }

    // RBAC: Enforce corporate filtering
    let targetCorpId = corporateId;
    if (access.scope !== 'system') {
      if (corporateId && !access.corporateIds.includes(corporateId)) {
        throw AppError.forbidden(ErrorCode.CORPORATE_ACCESS_DENIED, 'Access denied to this corporate');
      }
      targetCorpId = corporateId || access.corporateIds[0];
    }

    const data = await getCashFlowData(period, monthsNum, targetCorpId, entityType === 'department' ? entityId : undefined, entityType === 'project' ? entityId : undefined);
    res.json(data);
  }));

  /**
   * GET /api/mafinda/dashboard/asset-composition
   * Komposisi aset dari neraca
   * Requirements: 4.5
   * Query params: period (required, format YYYY-MM), departmentId (optional)
   */
  router.get('/asset-composition', requirePermission('cfd.dashboard.read'), injectAccessContext, asyncHandler(async (req: Request, res: Response) => {
    const { period, corporateId } = req.query as Record<string, string>;
    const access = (req as any).accessContext!;

    if (!period) {
      throw AppError.badRequest(ErrorCode.PERIOD_REQUIRED, 'Period is required');
    }

    // RBAC: Enforce corporate filtering
    let targetCorpId = corporateId;
    if (access.scope !== 'system') {
      if (corporateId && !access.corporateIds.includes(corporateId)) {
        throw AppError.forbidden(ErrorCode.CORPORATE_ACCESS_DENIED, 'Access denied to this corporate');
      }
      targetCorpId = corporateId || access.corporateIds[0];
    }

    const data = await getAssetComposition(period, targetCorpId);
    res.json(data);
  }));

  /**
   * GET /api/mafinda/dashboard/equity-liability-composition
   * Komposisi ekuitas & liabilitas dari neraca
   * Requirements: 5.5
   * Query params: period (required, format YYYY-MM), departmentId (optional)
   */
  router.get('/equity-liability-composition', requirePermission('cfd.dashboard.read'), injectAccessContext, asyncHandler(async (req: Request, res: Response) => {
    const { period, corporateId } = req.query as Record<string, string>;
    const access = (req as any).accessContext!;

    if (!period) {
      throw AppError.badRequest(ErrorCode.PERIOD_REQUIRED, 'Period is required');
    }

    // RBAC: Enforce corporate filtering
    let targetCorpId = corporateId;
    if (access.scope !== 'system') {
      if (corporateId && !access.corporateIds.includes(corporateId)) {
        throw AppError.forbidden(ErrorCode.CORPORATE_ACCESS_DENIED, 'Access denied to this corporate');
      }
      targetCorpId = corporateId || access.corporateIds[0];
    }

    const data = await getEquityLiabilityComposition(period, targetCorpId);
    res.json(data);
  }));

  /**
   * GET /api/mafinda/dashboard/historical-data
   * Data keuangan historis multi-metrik
   * Requirements: 6.5
   * Query params: months (required: 3|6|12|24)
   */
  router.get('/historical-data', requirePermission('cfd.dashboard.read'), injectAccessContext, asyncHandler(async (req: Request, res: Response) => {
    const { months, corporateId } = req.query as Record<string, string>;
    const access = (req as any).accessContext!;

    if (!months) {
      throw AppError.badRequest(ErrorCode.INVALID_INPUT, 'Parameter months is required (3|6|12|24|60)');
    }

    const monthsNum = parseInt(months, 10);
    if (isNaN(monthsNum) || ![3, 6, 12, 24, 60].includes(monthsNum)) {
      throw AppError.badRequest(ErrorCode.INVALID_INPUT, 'Parameter months must be one of: 3, 6, 12, 24, 60');
    }

    // RBAC: Enforce corporate filtering
    let targetCorpId = corporateId;
    if (access.scope !== 'system') {
      if (corporateId && !access.corporateIds.includes(corporateId)) {
        throw AppError.forbidden(ErrorCode.CORPORATE_ACCESS_DENIED, 'Access denied to this corporate');
      }
      targetCorpId = corporateId || access.corporateIds[0];
    }

    const data = await getHistoricalData(monthsNum, targetCorpId);
    res.json(data);
  }));

  /**
   * GET /api/mafinda/dashboard/aggregated
   * Aggregated dashboard data in a single request.
   * Query params: period (req), corporateId (opt), historicalMonths (opt), cashFlowMonths (opt), revCostDeptId (opt), cashFlowDeptId (opt)
   */
  router.get('/aggregated', requirePermission('cfd.dashboard.read'), injectAccessContext, asyncHandler(async (req: Request, res: Response) => {
    const { period, corporateId, historicalMonths, cashFlowMonths, revCostDeptId, cashFlowDeptId } = req.query as Record<string, string>;
    const access = (req as any).accessContext!;

    if (!period) {
      throw AppError.badRequest(ErrorCode.PERIOD_REQUIRED, 'Period is required');
    }

    // RBAC: Enforce corporate filtering
    let targetCorpId = corporateId;
    if (access.scope !== 'system') {
      if (corporateId && !access.corporateIds.includes(corporateId)) {
        throw AppError.forbidden(ErrorCode.CORPORATE_ACCESS_DENIED, 'Access denied to this corporate');
      }
      targetCorpId = corporateId || access.corporateIds[0];
    }

    const data = await getDashboardAggregated({
      period,
      corporateId: targetCorpId,
      historicalMonths: historicalMonths ? parseInt(historicalMonths, 10) : 12,
      cashFlowMonths: cashFlowMonths ? parseInt(cashFlowMonths, 10) : 6,
      revCostDeptId,
      cashFlowDeptId,
    });

    res.json(data);
  }));

  return router;
}

import { Router, Request, Response } from 'express';
import { requirePermission, injectAccessContext } from '../../middleware/rbac';
import { asyncHandler } from '../../utils/asyncHandler';
import { AppError, ErrorCode } from '../../utils/errors.js';
import { CashFlowProjectionService } from '../../services/financial/cashFlowProjectionService';

export function createCashFlowProjectionRouter(): Router {
  const router = Router();

  // GET /api/cash-flow-projections — list projections for a corporate
  router.get(
    '/',
    requirePermission('cfd.cash_flow_projections.read'),
    injectAccessContext,
    asyncHandler(async (req: Request, res: Response) => {
      const { search, page, pageSize, corporateId, year } = req.query as Record<string, string>;
      const access = req.accessContext!;

      let effectiveCorporateIds: string[] | undefined = undefined;

      if (corporateId) {
        // If specific corporateId provided, validate access
        if (access.scope !== 'system' && !access.corporateIds.includes(corporateId)) {
          throw AppError.forbidden(ErrorCode.CORPORATE_ACCESS_DENIED, 'Access denied to this corporate');
        }
        effectiveCorporateIds = [corporateId];
      } else {
        // If no corporateId provided, use user's context
        if (access.scope !== 'system') {
          effectiveCorporateIds = access.corporateIds;
        }
        // System admin with no corporateId sees all
      }

      const result = await CashFlowProjectionService.listProjections({
        corporateIds: effectiveCorporateIds,
        search,
        year,
        page: page ? parseInt(page) : 1,
        pageSize: pageSize ? Math.min(parseInt(pageSize), 100) : 10,
      });

      res.json(result);
    })
  );

  // GET /api/cash-flow-projections/:id — get single projection with details
  router.get(
    '/:id',
    requirePermission('cfd.cash_flow_projections.read'),
    injectAccessContext,
    asyncHandler(async (req: Request, res: Response) => {
      const projection = await CashFlowProjectionService.getProjectionById(req.params.id);

      // Context Validation
      const access = req.accessContext!;
      if (access.scope !== 'system' && !access.corporateIds.includes(projection.corporateId)) {
        throw AppError.forbidden(ErrorCode.CORPORATE_ACCESS_DENIED, 'Access denied to this corporate');
      }

      res.json(projection);
    })
  );

  // POST /api/cash-flow-projections — create projection with details
  router.post(
    '/',
    requirePermission('cfd.cash_flow_projections.write'),
    injectAccessContext,
    asyncHandler(async (req: Request, res: Response) => {
      const { corporateId, fiscalYear, initialBalance, notes, details } = req.body;

      if (!corporateId || !fiscalYear) {
        throw AppError.badRequest(ErrorCode.MISSING_REQUIRED_FIELD, 'Corporate ID and fiscal year are required');
      }

      // Context Validation
      const access = req.accessContext!;
      if (access.scope !== 'system' && !access.corporateIds.includes(corporateId)) {
        throw AppError.forbidden(ErrorCode.CORPORATE_ACCESS_DENIED, 'Access denied to this corporate');
      }

      const userId = req.user!.userId;
      const result = await CashFlowProjectionService.createProjection({
        corporateId,
        fiscalYear: Number(fiscalYear),
        initialBalance: Number(initialBalance || 0),
        notes,
        details: details || [],
      }, userId);

      res.status(201).json(result);
    })
  );

  // PUT /api/cash-flow-projections/:id — update projection
  router.put(
    '/:id',
    requirePermission('cfd.cash_flow_projections.write'),
    injectAccessContext,
    asyncHandler(async (req: Request, res: Response) => {
      const { initialBalance, notes, details } = req.body;

      // Check existence and ownership first
      const existing = await CashFlowProjectionService.getProjectionById(req.params.id);
      
      // Context Validation
      const access = req.accessContext!;
      if (access.scope !== 'system' && !access.corporateIds.includes(existing.corporateId)) {
        throw AppError.forbidden(ErrorCode.CORPORATE_ACCESS_DENIED, 'Access denied to this corporate');
      }

      const userId = req.user!.userId;
      const result = await CashFlowProjectionService.updateProjection(req.params.id, {
        initialBalance: initialBalance !== undefined ? Number(initialBalance) : undefined,
        notes,
        details,
      }, userId);

      res.json(result);
    })
  );

  // DELETE /api/cash-flow-projections/:id — delete projection
  router.delete(
    '/:id',
    requirePermission('cfd.cash_flow_projections.delete'),
    injectAccessContext,
    asyncHandler(async (req: Request, res: Response) => {
      // Check existence and ownership first
      const existing = await CashFlowProjectionService.getProjectionById(req.params.id);
      
      // Context Validation
      const access = req.accessContext!;
      if (access.scope !== 'system' && !access.corporateIds.includes(existing.corporateId)) {
        throw AppError.forbidden(ErrorCode.CORPORATE_ACCESS_DENIED, 'Access denied to this corporate');
      }

      const result = await CashFlowProjectionService.deleteProjection(req.params.id);
      res.json(result);
    })
  );

  return router;
}

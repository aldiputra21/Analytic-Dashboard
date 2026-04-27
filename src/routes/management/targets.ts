import { Router, Request, Response } from 'express';
import { requirePermission, injectAccessContext } from '../../middleware/rbac';
import { asyncHandler } from '../../utils/asyncHandler';
import { eq, and, sql, inArray } from 'drizzle-orm';
import { db } from '../../db/connection';
import { departments } from '../../db/schema/public';
import {
  getAnnualTargets,
  getAnnualTargetDetails,
  saveAnnualTarget,
  deleteAnnualTarget,
} from '../../services/mafinda/targetService';

export function createTargetRouter(): Router {
  const router = Router();

  // GET /api/targets — list annual targets summary
  router.get(
    '/', 
    requirePermission('public.targets.read'), 
    injectAccessContext,
    asyncHandler(async (req: Request, res: Response) => {
      const { search, page, pageSize, departmentId, projectId } = req.query as Record<string, string>;
      
      const access = req.accessContext!;
      let allowedDeptIds: string[] | undefined;

      if (access.scope !== 'system') {
        if (access.scope === 'department') {
          if (access.departmentIds.length === 0) return res.json({ records: [], totalCount: 0 });
          allowedDeptIds = access.departmentIds;
        } else if (access.scope === 'corporate') {
          if (access.corporateIds.length === 0) return res.json({ records: [], totalCount: 0 });
          const depts = await db.select({ id: departments.id }).from(departments)
            .where(inArray(departments.corporateId, access.corporateIds));
          allowedDeptIds = depts.map(d => d.id);
          if (allowedDeptIds.length === 0) return res.json({ records: [], totalCount: 0 });
        }
      }

      if (departmentId && allowedDeptIds && !allowedDeptIds.includes(departmentId)) {
        res.json({ records: [], totalCount: 0 });
        return;
      }

      const result = await getAnnualTargets({
        search,
        departmentId: departmentId || allowedDeptIds,
        projectId,
        page: page ? parseInt(page) : 1,
        pageSize: pageSize ? Math.min(parseInt(pageSize), 100) : 10,
      });
      res.json(result);
    })
  );

  // GET /api/targets/details — get detailed monthly targets for an entity/year
  router.get(
    '/details', 
    requirePermission('public.targets.read'), 
    injectAccessContext,
    asyncHandler(async (req: Request, res: Response) => {
      const { departmentId, projectId, fiscalYear } = req.query as Record<string, string>;
      if (!departmentId || !fiscalYear) {
        res.status(400).json({ error: 'departmentId and fiscalYear are required' });
        return;
      }

      // Context Validation
      const access = req.accessContext!;
      if (access.scope !== 'system') {
        if (access.scope === 'department' && !access.departmentIds.includes(departmentId)) {
          return res.status(403).json({ error: 'Access denied to this department' });
        }
        if (access.scope === 'corporate') {
          const [dept] = await db.select({ corporateId: departments.corporateId }).from(departments)
            .where(eq(departments.id, departmentId)).limit(1);
          if (!dept || !access.corporateIds.includes(dept.corporateId)) {
            return res.status(403).json({ error: 'Access denied to this corporate' });
          }
        }
      }

      const details = await getAnnualTargetDetails(departmentId, projectId || null, Number(fiscalYear));
      res.json(details);
    })
  );

  // POST /api/targets/batch — batch upsert annual targets (now supports Master-Detail)
  router.post(
    '/batch', 
    requirePermission('public.targets.write'), 
    injectAccessContext,
    asyncHandler(async (req: Request, res: Response) => {
      const { departmentId, projectId, fiscalYear, revenueDetails, costDetails, notes, months } = req.body;
      
      if (!departmentId || !fiscalYear) {
        res.status(400).json({ error: 'departmentId and fiscalYear are required' });
        return;
      }

      // Context Validation
      const access = req.accessContext!;
      if (access.scope !== 'system') {
        if (access.scope === 'department' && !access.departmentIds.includes(departmentId)) {
          return res.status(403).json({ error: 'Access denied to this department' });
        }
        if (access.scope === 'corporate') {
          const [dept] = await db.select({ corporateId: departments.corporateId }).from(departments)
            .where(eq(departments.id, departmentId)).limit(1);
          if (!dept || !access.corporateIds.includes(dept.corporateId)) {
            return res.status(403).json({ error: 'Access denied to this corporate' });
          }
        }
      }

      // Support legacy "months" format by converting it if needed
      let finalRevenue = revenueDetails || [];
      let finalCost = costDetails || [];
      
      if (months && Array.isArray(months) && finalRevenue.length === 0 && finalCost.length === 0) {
        finalRevenue = months.map((m: any) => ({ month: m.fiscalMonth, amount: m.revenue, notes: m.notes }));
        finalCost = months.map((m: any) => ({ month: m.fiscalMonth, amount: m.cost, notes: m.notes }));
      }

      const userId = req.user!.userId;
      const context = {
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      };

      try {
        const result = await saveAnnualTarget({ 
          departmentId, 
          projectId, 
          fiscalYear: Number(fiscalYear), 
          revenueDetails: finalRevenue,
          costDetails: finalCost,
          notes
        }, userId, context);
        res.json(result);
      } catch (err: any) {
        if (err.message === 'TARGET_DELETED') {
          res.json({ success: true, message: 'All targets cleared and header deleted' });
          return;
        }
        throw err;
      }
    })
  );

  // DELETE /api/targets — delete an annual target
  router.delete(
    '/', 
    requirePermission('public.targets.delete'), 
    injectAccessContext,
    asyncHandler(async (req: Request, res: Response) => {
      const { departmentId, projectId, fiscalYear } = req.query as Record<string, string>;
      if (!departmentId || !fiscalYear) {
        res.status(400).json({ error: 'departmentId and fiscalYear are required' });
        return;
      }

      // Context Validation
      const access = req.accessContext!;
      if (access.scope !== 'system') {
        if (access.scope === 'department' && !access.departmentIds.includes(departmentId)) {
          return res.status(403).json({ error: 'Access denied to this department' });
        }
        if (access.scope === 'corporate') {
          const [dept] = await db.select({ corporateId: departments.corporateId }).from(departments)
            .where(eq(departments.id, departmentId)).limit(1);
          if (!dept || !access.corporateIds.includes(dept.corporateId)) {
            return res.status(403).json({ error: 'Access denied to this corporate' });
          }
        }
      }

      const userId = req.user!.userId;
      const context = {
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      };

      await deleteAnnualTarget(departmentId, projectId || null, Number(fiscalYear), userId, context);
      res.json({ success: true });
    })
  );

  return router;
}

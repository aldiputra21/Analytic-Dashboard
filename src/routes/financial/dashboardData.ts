// src/routes/financial/dashboardData.ts
// Dedicated endpoints for dashboard data to separate from management CRUD
// Requirements: 4.1, 4.3, 13.1

import { Router, Request, Response } from 'express';
import { requirePermission, injectAccessContext } from '../../middleware/rbac';
import { asyncHandler } from '../../utils/asyncHandler';
import { db } from '../../db/connection';
import { departments, projects } from '../../db/schema/public';
import { inArray, eq } from 'drizzle-orm';
import { getAnnualTargets } from '../../services/mafinda/targetService';

export function createDashboardDataRouter(): Router {
  const router = Router();

  /**
   * GET /api/frs/dashboard/departments
   * List all accessible departments for filters
   */
  router.get(
    '/departments',
    requirePermission('cfd.dashboard.read'),
    injectAccessContext,
    asyncHandler(async (req: Request, res: Response) => {
      const { corporateId } = req.query as Record<string, string>;
      const access = req.accessContext!;

      let query = db.select().from(departments).where(eq(departments.isActive, true));

      if (access.scope !== 'system') {
        const allowedCorpIds = corporateId ? [corporateId] : access.corporateIds;
        // Intersect requested corporateId with user's allowed corporateIds
        const finalCorpIds = corporateId 
          ? access.corporateIds.filter(id => id === corporateId)
          : access.corporateIds;

        if (finalCorpIds.length === 0) return res.json([]);
        query = db.select().from(departments)
          .where(and(eq(departments.isActive, true), inArray(departments.corporateId, finalCorpIds))) as any;
      } else if (corporateId) {
        query = db.select().from(departments)
          .where(and(eq(departments.isActive, true), eq(departments.corporateId, corporateId))) as any;
      }

      const results = await query;
      res.json(results);
    })
  );

  /**
   * GET /api/frs/dashboard/projects
   * List all accessible projects for filters
   */
  router.get(
    '/projects',
    requirePermission('cfd.dashboard.read'),
    injectAccessContext,
    asyncHandler(async (req: Request, res: Response) => {
      const { corporateId, departmentId } = req.query as Record<string, string>;
      const access = req.accessContext!;

      // For simplicity, we join with departments to filter by corporate
      let allowedDeptIds: string[] | undefined;
      
      if (access.scope !== 'system') {
        if (access.scope === 'department') {
          allowedDeptIds = access.departmentIds;
        } else {
          const depts = await db.select({ id: departments.id }).from(departments)
            .where(inArray(departments.corporateId, access.corporateIds));
          allowedDeptIds = depts.map(d => d.id);
        }
        if (allowedDeptIds.length === 0) return res.json([]);
      }

      const finalDeptIds = departmentId 
        ? (allowedDeptIds ? allowedDeptIds.filter(id => id === departmentId) : [departmentId])
        : allowedDeptIds;

      if (finalDeptIds && finalDeptIds.length === 0) return res.json([]);

      const query = db.select().from(projects).where(and(
        eq(projects.isActive, true),
        finalDeptIds ? inArray(projects.departmentId, finalDeptIds) : sql`1=1`
      ));

      const results = await query;
      res.json(results);
    })
  );

  /**
   * GET /api/frs/dashboard/targets
   * List annual targets summary for dashboard
   */
  router.get(
    '/targets',
    requirePermission('cfd.dashboard.read'),
    injectAccessContext,
    asyncHandler(async (req: Request, res: Response) => {
      const { corporateId, departmentId, fiscalYear } = req.query as Record<string, string>;
      const access = req.accessContext!;

      let allowedDeptIds: string[] | undefined;
      if (access.scope !== 'system') {
        if (access.scope === 'department') {
          allowedDeptIds = access.departmentIds;
        } else {
          const depts = await db.select({ id: departments.id }).from(departments)
            .where(inArray(departments.corporateId, access.corporateIds));
          allowedDeptIds = depts.map(d => d.id);
        }
        if (allowedDeptIds.length === 0) return res.json({ records: [], totalCount: 0 });
      }

      const result = await getAnnualTargets({
        departmentId: departmentId || allowedDeptIds,
        fiscalYear: fiscalYear ? parseInt(fiscalYear) : undefined,
        pageSize: 100, // Dashboard usually needs all for summary
      });
      res.json(result);
    })
  );

  return router;
}

// Internal helper for complex conditions
import { and, sql } from 'drizzle-orm';

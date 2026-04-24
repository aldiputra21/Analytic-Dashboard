// Target Management Routes — MAFINDA Dashboard Enhancement
import { Router, Request, Response } from 'express';
import { requirePermission } from '../../middleware/rbac';
import {
  getAnnualTargets,
  getAnnualTargetDetails,
  saveAnnualTarget,
  deleteAnnualTarget,
} from '../../services/mafinda/targetService';

export function createTargetRouter(): Router {
  const router = Router();

  // GET /api/targets — list annual targets summary
  router.get('/', requirePermission('public.targets.read'), async (req: Request, res: Response) => {
    const { search, page, pageSize, departmentId, projectId } = req.query as Record<string, string>;
    try {
      const result = await getAnnualTargets({
        search,
        departmentId,
        projectId,
        page: page ? parseInt(page) : 1,
        pageSize: pageSize ? Math.min(parseInt(pageSize), 100) : 10,
      });
      res.json(result);
    } catch (err: any) {
      console.error('[GET /targets] Error:', err);
      res.status(500).json({ error: 'Terjadi kesalahan server' });
    }
  });

  // GET /api/targets/details — get detailed monthly targets for an entity/year
  router.get('/details', requirePermission('public.targets.read'), async (req: Request, res: Response) => {
    const { departmentId, projectId, fiscalYear } = req.query as Record<string, string>;
    if (!departmentId || !fiscalYear) {
      return res.status(400).json({ error: 'departmentId and fiscalYear are required' });
    }
    try {
      const details = await getAnnualTargetDetails(departmentId, projectId || null, Number(fiscalYear));
      res.json(details);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST /api/targets/batch — batch upsert annual targets (now supports Master-Detail)
  router.post('/batch', requirePermission('public.targets.write'), async (req: Request, res: Response) => {
    const { departmentId, projectId, fiscalYear, revenueDetails, costDetails, notes, months } = req.body;
    
    // Support legacy "months" format by converting it if needed, or handle new separate tables
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
        return res.json({ success: true, message: 'All targets cleared and header deleted' });
      }
      console.error('[POST /targets/batch] Error:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // DELETE /api/targets — delete an annual target
  router.delete('/', requirePermission('public.targets.delete'), async (req: Request, res: Response) => {
    const { departmentId, projectId, fiscalYear } = req.query as Record<string, string>;
    if (!departmentId || !fiscalYear) {
      return res.status(400).json({ error: 'departmentId and fiscalYear are required' });
    }

    const userId = req.user!.userId;
    const context = {
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    };

    try {
      await deleteAnnualTarget(departmentId, projectId || null, Number(fiscalYear), userId, context);
      res.json({ success: true });
    } catch (err: any) {
      console.error('[DELETE /targets] Error:', err);
      res.status(500).json({ error: err.message });
    }
  });

  return router;
}

// src/routes/financial/corporates.ts

import { Router, Request, Response } from 'express';
import { requirePermission, requireSubsidiaryAccess } from '../../middleware/rbac';
import {
  createCorporate,
  listCorporates,
  getCorporateById,
  updateCorporate,
  setCorporateStatus,
  deleteCorporate,
  getActiveCorporates,
} from '../../services/financial/corporateService';
import { initDefaultThresholds } from '../../services/financial/thresholdService';
import { uploadLogo } from '../../middleware/upload';
import { asyncHandler } from '../../utils/asyncHandler';

export function createCorporatesRouter(): Router {
  const router = Router();

  /**
   * POST /api/frs/corporates
   */
  router.post('/', requirePermission('cfd.corporates.write'), asyncHandler(async (req: Request, res: Response) => {
    const { name, code, logo, industrySector, fiscalYearStartMonth, currency, taxRate } = req.body;

    if (!name || !code || !industrySector || !fiscalYearStartMonth || taxRate == null) {
      return res.status(400).json({
        error: { code: 'FRS_VALIDATION_ERROR', message: 'name, code, industrySector, fiscalYearStartMonth, and taxRate are required' },
      });
    }

    const result = await createCorporate(
      { name, code, logo, industrySector, fiscalYearStartMonth, currency, taxRate }, 
      req.user!.userId,
      { ip: req.ip, userAgent: req.headers['user-agent'] }
    );

    if (result.error) {
      return res.status(422).json({
        error: { code: 'FRS_CONFLICT', message: result.error },
      });
    }

    const corporate = result.corporate!;
    await initDefaultThresholds(corporate.id, industrySector, req.user!.userId);

    res.status(201).json(corporate);
  }));

  /**
   * GET /api/frs/corporates
   */
  router.get('/', requirePermission('cfd.corporates.read'), asyncHandler(async (req: Request, res: Response) => {
    const activeOnly = req.query.active === 'true';
    const search = req.query.search as string;
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 0;

    const results = await listCorporates({ activeOnly, search, page, pageSize });
    res.json(results);
  }));

  /**
   * GET /api/frs/corporates/dropdown-items
   */
  router.get('/dropdown-items', requirePermission('cfd.corporates.read'), asyncHandler(async (_req: Request, res: Response) => {
    const results = await getActiveCorporates();
    res.json(results);
  }));

  /**
   * POST /api/frs/corporates/:id/logo
   */
  router.post('/:id/logo', requirePermission('cfd.corporates.write'), uploadLogo.single('logo'), asyncHandler(async (req: Request, res: Response) => {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const logoPath = `/upload/corporate-logos/${req.file.filename}`;
    const updated = await updateCorporate(req.params.id, { logo: logoPath }, req.user!.userId, {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });

    if (!updated) {
      return res.status(404).json({ error: 'Corporate not found' });
    }

    res.json({ logo: logoPath });
  }));

  /**
   * PUT /api/frs/corporates/:id
   */
  router.put('/:id', requirePermission('cfd.corporates.write'), asyncHandler(async (req: Request, res: Response) => {
    const result = await updateCorporate(req.params.id, req.body, req.user!.userId, {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });
    if (!result) return res.status(404).json({ error: 'Corporate not found' });
    res.json(result);
  }));

  /**
   * DELETE /api/frs/corporates/:id
   */
  router.delete('/:id', requirePermission('cfd.corporates.delete'), asyncHandler(async (req: Request, res: Response) => {
    const result = await deleteCorporate(req.params.id, req.user!.userId, {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });
    if (!result.success) {
      return res.status(422).json({ error: result.error });
    }
    res.json({ success: true });
  }));

  return router;
}

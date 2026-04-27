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
import { getUserSubsidiaryIds } from '../../services/financial/permissionService';

/**
 * Logo Handler - exported separately for public access
 * This is registered at app level before authenticate middleware
 */
export const logoHandler = asyncHandler(async (req: Request, res: Response) => {
  const corporate = await getCorporateById(req.params.id);
  if (!corporate) {
    return res.status(404).json({ error: 'Corporate not found' });
  }

  if (!corporate.logo) {
    return res.status(404).json({ error: 'Logo not found' });
  }

  // The logo path is stored as a relative path like "assets/corporate-logos/filename"
  // We need to serve it from the filesystem
  const fs = await import('fs');
  const path = await import('path');
  
  // Extract filename from the stored path
  const filename = corporate.logo.split('/').pop();
  const uploadDir = process.env.CORPORATE_LOGO_UPLOAD_DIR || 'assets/corporate-logos';
  const filePath = path.join(uploadDir, filename!);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Logo file not found' });
  }

  // Determine MIME type based on file extension
  const ext = path.extname(filename!).toLowerCase();
  const mimeTypes: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp',
  };
  const mimeType = mimeTypes[ext] || 'application/octet-stream';

  // Serve the file with appropriate headers
  res.setHeader('Content-Type', mimeType);
  res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 1 day
  res.sendFile(path.resolve(filePath));
});

export function createCorporatesRouter(): Router {
  const router = Router();

  /**
   * GET /api/frs/corporates/dropdown-items
   * MUST be before /:id routes to avoid matching as ID
   */
  router.get('/dropdown-items', requirePermission('cfd.corporates.read'), asyncHandler(async (req: Request, res: Response) => {
    const access = req.accessContext!;
    const results = await getActiveCorporates(access.scope !== 'system' ? access.corporateIds : undefined);
    res.json(results);
  }));

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
    const access = req.accessContext!;

    const results = await listCorporates({ 
      activeOnly, 
      search, 
      page, 
      pageSize, 
      subsidiaryIds: access.scope !== 'system' ? access.corporateIds : undefined 
    });
    res.json(results);
  }));

  /**
   * GET /api/frs/corporates/:id/logo
   * Serve the corporate logo file (PUBLIC - no auth required)
   * NOTE: This route is registered at app level in createApp.ts before authenticate middleware
   * So it's handled by logoHandler export, not this router
   */

  /**
   * POST /api/frs/corporates/:id/logo
   */
  router.post('/:id/logo', requirePermission('cfd.corporates.write'), uploadLogo.single('logo'), asyncHandler(async (req: Request, res: Response) => {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const logoPath = `/asset/corporate-logos/${req.file.filename}`;
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
    const access = req.accessContext!;
    if (access.scope !== 'system' && !access.corporateIds.includes(req.params.id)) {
      return res.status(403).json({ error: 'Access denied to this corporate' });
    }
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
    const access = req.accessContext!;
    if (access.scope !== 'system' && !access.corporateIds.includes(req.params.id)) {
      return res.status(403).json({ error: 'Access denied to this corporate' });
    }
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

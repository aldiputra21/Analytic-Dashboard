import { Request, Response, NextFunction } from 'express';
import { configService } from '../services/management/configService.js';
import { asyncHandler } from '../utils/asyncHandler.js';

/**
 * Middleware to check if the system is in maintenance mode.
 * Blocks all requests except for those from users with bypass permissions.
 */
export const checkMaintenance = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const isMaintenance = await configService.get<boolean>('maintenance_mode', false);
  
  if (isMaintenance) {
    // Check if the user is authenticated and has bypass permission
    // Bypass permission: system_admin role or specific system_configs.write permission
    const hasBypassRole = req.user?.role === 'system_admin';
    const hasBypassPermission = req.user?.permissions?.includes('public.system_configs.write');
    
    if (!hasBypassRole && !hasBypassPermission) {
      res.status(503).json({
        error: {
          code: 'MAINTENANCE_MODE',
          message: 'Sistem sedang dalam pemeliharaan. Silakan coba beberapa saat lagi.',
          message_en: 'System is currently under maintenance. Please try again later.',
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] ?? '',
        },
      });
      return;
    }
  }
  
  next();
});

// FRS Authentication Routes
// POST /api/frs/auth/login
// POST /api/frs/auth/logout
// GET  /api/frs/auth/me
// Requirements: 9.6, 9.7, 9.8

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authenticateUser, invalidateToken, getUserById, requestPasswordReset, resetPasswordWithToken } from '../../services/financial/authService';
import { authenticate } from '../../middleware/auth';
import { createFRSAuditLog } from '../../services/financial/auditLogService';
import { asyncHandler } from '../../utils/asyncHandler';

const forgotPasswordSchema = z.object({
  identifier: z.string().trim().min(1),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(1),
});

export function createFRSAuthRouter(): Router {
  const router = Router();

  /**
   * GET /api/frs/auth/config
   * Public configuration for the frontend
   */
  router.get('/config', asyncHandler(async (_req: Request, res: Response) => {
    res.json({
      // Default to 10 minutes if not configured. 
      // This ensures keep-alive polling is active even if the .env is missing the key.
      keepAliveIntervalMs: Number(process.env.FRS_KEEP_ALIVE_INTERVAL_MS || 600000),
    });
  }));

  /**
   * POST /api/frs/auth/login
   * Authenticates user and returns JWT token.
   */
  router.post('/login', asyncHandler(async (req: Request, res: Response) => {
    const { username, password } = req.body;

    if (!username || !password) {
      res.status(400).json({
        error: {
          code: 'FRS_VALIDATION_ERROR',
          message: 'Username and password are required',
          timestamp: new Date().toISOString(),
          requestId: '',
        },
      });
      return;
    }

    try {
      // authenticateUser now uses email field
      const result = await authenticateUser(username, password);

      if (!result) {
        // Log failed login attempt
        await createFRSAuditLog({
          userId: undefined,
          action: 'login',
          entityType: 'auth',
          newValues: { username, success: false },
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
        });

        res.status(401).json({
          error: {
            code: 'FRS_INVALID_CREDENTIALS',
            message: 'Invalid username or password',
            timestamp: new Date().toISOString(),
            requestId: '',
          },
        });
        return;
      }

      // Log successful login
      await createFRSAuditLog({
        userId: result.user.id,
        action: 'login',
        entityType: 'auth',
        newValues: { username, success: true },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      res.json({
        token: result.token,
        user: {
          id: result.user.id,
          username: result.user.username,
          email: result.user.email,
          role: result.user.role,
          permissions: result.user.permissions ?? [],
          authzVersion: result.user.authzVersion ?? 1,
          fullName: result.user.fullName,
          corporateId: result.user.corporateId,
          subsidiaryIds: result.user.subsidiaryIds,
          hasFullCorporateAccess: result.user.hasFullCorporateAccess,
          roleName: result.user.roleName,
          roleDescription: result.user.roleDescription,
        },
      });
    } catch (err) {
      console.error('[FRS Auth] Login error:', err);
      res.status(500).json({
        error: { code: 'FRS_SERVER_ERROR', message: 'Internal server error', timestamp: new Date().toISOString(), requestId: '' },
      });
    }
  }));

  router.post('/forgot-password', asyncHandler(async (req: Request, res: Response) => {
    const parsed = forgotPasswordSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({
        error: {
          code: 'FRS_VALIDATION_ERROR',
          message: 'Username or email is required',
          timestamp: new Date().toISOString(),
          requestId: '',
        },
      });
      return;
    }

    const appUrl = process.env.APP_URL || `${req.protocol}://${req.get('host') || 'localhost:5000'}`;

    try {
      const userId = await requestPasswordReset(parsed.data.identifier, appUrl);

      await createFRSAuditLog({
        userId: userId ?? undefined,
        action: 'password_reset_request',
        entityType: 'auth',
        newValues: { identifier: parsed.data.identifier },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      res.json({
        success: true,
        message: 'If the account exists, a password reset link has been sent to the registered email address.',
      });
    } catch (err) {
      console.error('[FRS Auth] Forgot password error:', err);
      res.json({
        success: true,
        message: 'If the account exists, a password reset link has been sent to the registered email address.',
      });
    }
  }));

  router.post('/reset-password', asyncHandler(async (req: Request, res: Response) => {
    const parsed = resetPasswordSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({
        error: {
          code: 'FRS_VALIDATION_ERROR',
          message: 'Token and password are required',
          timestamp: new Date().toISOString(),
          requestId: '',
        },
      });
      return;
    }

    try {
      const result = await resetPasswordWithToken(parsed.data.token, parsed.data.password);

      if (!result.success) {
        const reason = 'reason' in result ? result.reason : 'invalid_token';
        const message = reason === 'weak_password'
          ? 'Password does not meet security requirements'
          : 'Reset link is invalid or has expired';

        res.status(reason === 'weak_password' ? 400 : 401).json({
          error: {
            code: reason === 'weak_password' ? 'FRS_WEAK_PASSWORD' : 'FRS_INVALID_RESET_TOKEN',
            message,
            timestamp: new Date().toISOString(),
            requestId: '',
          },
        });
        return;
      }

      await createFRSAuditLog({
        userId: result.userId,
        action: 'password_reset_complete',
        entityType: 'auth',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      res.json({ success: true, message: 'Password reset successful' });
    } catch (err) {
      console.error('[FRS Auth] Reset password error:', err);
      res.status(500).json({
        error: { code: 'FRS_SERVER_ERROR', message: 'Internal server error', timestamp: new Date().toISOString(), requestId: '' },
      });
    }
  }));

  /**
   * POST /api/frs/auth/logout
   * Invalidates the current JWT token.
   */
  router.post('/logout', authenticate, asyncHandler(async (req: Request, res: Response) => {
    const token = req.headers.authorization?.slice(7) ?? '';
    invalidateToken(token);

    await createFRSAuditLog({
      userId: req.user!.userId,
      action: 'logout',
      entityType: 'auth',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.json({ success: true, message: 'Logged out successfully' });
  }));

  /**
   * GET /api/frs/auth/me
   * Returns the current authenticated user.
   */
  router.get('/me', authenticate, asyncHandler(async (req: Request, res: Response) => {
    const user = await getUserById(req.user!.userId);
    if (!user) {
      res.status(404).json({
        error: { code: 'FRS_USER_NOT_FOUND', message: 'User not found', timestamp: new Date().toISOString(), requestId: '' },
      });
      return;
    }

    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      permissions: user.permissions ?? [],
      authzVersion: user.authzVersion ?? 1,
      fullName: user.fullName,
      lastLogin: user.lastLogin,
      corporateId: user.corporateId,
      subsidiaryIds: user.subsidiaryIds,
      hasFullCorporateAccess: user.hasFullCorporateAccess,
      roleName: user.roleName,
      roleDescription: user.roleDescription,
    });
  }));

  return router;
}

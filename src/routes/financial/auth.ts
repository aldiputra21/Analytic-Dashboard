// FRS Authentication Routes
// POST /api/frs/auth/login
// POST /api/frs/auth/logout
// GET  /api/frs/auth/me
// POST /api/frs/auth/validate-activation-token
// POST /api/frs/auth/activate-account
// POST /api/frs/auth/validate-reset-token
// POST /api/frs/auth/reset-password
// Requirements: 9.6, 9.7, 9.8, 10.1–10.19, 13.1–13.18

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { eq, and, or, desc, sql } from 'drizzle-orm';
import { authenticateUser, invalidateToken, getUserById, requestPasswordReset, resetPasswordWithToken } from '../../services/financial/authService';
import { authenticate } from '../../middleware/auth';
import { createFRSAuditLog } from '../../services/financial/auditLogService';
import { asyncHandler } from '../../utils/asyncHandler';
import { AppError, ErrorCode } from '../../utils/errors.js';
import { db } from '../../db/connection';
import { users } from '../../db/schema/index';
import { calculatePasswordStrength } from '../../services/financial/passwordStrength';
import { configService } from '../../services/management/configService';

const BCRYPT_ROUNDS = 10;

// Rate limiting: 5 attempts per hour per IP
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + 60 * 60 * 1000 });
    return true;
  }

  if (entry.count >= 5) {
    return false;
  }

  entry.count++;
  return true;
}

const forgotPasswordSchema = z.object({
  identifier: z.string().trim().min(1),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(1),
});

const validateActivationTokenSchema = z.object({
  token: z.string().min(1, 'Token is required'),
});

const activateAccountSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
});

const validateResetTokenSchema = z.object({
  token: z.string().min(1, 'Token is required'),
});

const resetPasswordNewSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
});

const updateProfileSchema = z.object({
  fullName: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
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
      throw AppError.badRequest(ErrorCode.MISSING_REQUIRED_FIELD, 'Username and password are required');
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

        throw new AppError(ErrorCode.AUTH_INVALID_CREDENTIALS, 'Invalid username or password', 401);
      }

      // Maintenance Mode Check
      const isMaintenance = await configService.get<boolean>('maintenance_mode', false);
      if (isMaintenance) {
        const hasBypassRole = result.user.role === 'system_admin';
        const hasBypassPermission = result.user.permissions?.includes('public.system_configs.write');
        if (!hasBypassRole && !hasBypassPermission) {
          throw new AppError(ErrorCode.MAINTENANCE_MODE, 'Sistem sedang dalam pemeliharaan. Hanya administrator yang dapat masuk.', 503);
        }
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
          scope: result.user.scope || (result.user.role === 'system_admin' ? 'system' : 'corporate'),
          roleName: result.user.roleName,
          roleDescription: result.user.roleDescription,
        },
      });
    } catch (err) {
      if (err instanceof AppError) throw err;
      console.error('[FRS Auth] Login error:', err);
      throw AppError.internal();
    }
  }));

  router.post('/forgot-password', asyncHandler(async (req: Request, res: Response) => {
    const { identifier } = forgotPasswordSchema.parse(req.body);

    const appUrl = process.env.APP_URL || `${req.protocol}://${req.get('host') || 'localhost:5000'}`;

    try {
      const userId = await requestPasswordReset(identifier, appUrl);
      
      await createFRSAuditLog({
        userId: userId ?? undefined,
        action: 'password_reset_request',
        entityType: 'auth',
        newValues: { identifier },
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
    const { token, password } = resetPasswordSchema.parse(req.body);

    try {
      const result = await resetPasswordWithToken(token, password);

      if (!result.success) {
        const reason = 'reason' in result ? result.reason : 'invalid_token';
        if (reason === 'weak_password') {
          throw AppError.badRequest(ErrorCode.WEAK_PASSWORD, 'Password is too weak');
        } else {
          throw AppError.unauthorized(ErrorCode.AUTH_TOKEN_INVALID, 'Invalid or expired reset token');
        }
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
      if (err instanceof AppError) throw err;
      console.error('[FRS Auth] Reset password error:', err);
      throw AppError.internal();
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
      throw AppError.notFound(ErrorCode.USER_NOT_FOUND, 'User not found');
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
      scope: user.scope || (user.role === 'system_admin' ? 'system' : 'corporate'),
      roleName: user.roleName,
      roleDescription: user.roleDescription,
    });
  }));

  /**
   * POST /api/frs/auth/validate-activation-token
   * Public endpoint to validate an activation token
   * Returns: { valid: boolean, username?: string, email?: string }
   */
  router.post('/validate-activation-token', asyncHandler(async (req: Request, res: Response) => {
    const ip = req.ip || 'unknown';

    if (!checkRateLimit(ip)) {
      throw AppError.tooManyRequests(ErrorCode.RATE_LIMIT_EXCEEDED, 'Too many attempts. Please try again later.');
    }

    const { token } = validateActivationTokenSchema.parse(req.body);

    try {
      // Find user with matching token (unactivated account)
      const [user] = await db.select().from(users)
        .where(
          and(
            eq(users.isActive, false),
            eq(users.emailVerified, false),
          )
        )
        .limit(1);

      if (!user || !user.passwordResetTokenHash || !user.passwordResetExpiresAt) {
        res.json({ valid: false });
        return;
      }

      // Check token expiry
      if (user.passwordResetExpiresAt.getTime() < Date.now()) {
        res.json({ valid: false });
        return;
      }

      // Verify token with bcrypt
      const tokenMatches = await bcrypt.compare(token, user.passwordResetTokenHash);
      if (!tokenMatches) {
        res.json({ valid: false });
        return;
      }

      // Token is valid
      res.json({
        valid: true,
        username: user.username || user.email,
        email: user.email,
      });
    } catch (err) {
      if (err instanceof AppError) throw err;
      console.error('[FRS Auth] Validate activation token error:', err);
      throw AppError.internal();
    }
  }));

  /**
   * POST /api/frs/auth/activate-account
   * Public endpoint to complete account activation
   * Body: { token: string, newPassword: string }
   */
  router.post('/activate-account', asyncHandler(async (req: Request, res: Response) => {
    const ip = req.ip || 'unknown';

    if (!checkRateLimit(ip)) {
      throw AppError.badRequest(ErrorCode.RATE_LIMIT_EXCEEDED, 'Too many attempts. Please try again later.');
    }

    const { token, newPassword } = activateAccountSchema.parse(req.body);

    try {
      // Validate password strength (minimum "fair" level)
      const strengthResult = calculatePasswordStrength(newPassword);
      if (strengthResult.score <= 25) {
        throw AppError.badRequest(ErrorCode.WEAK_PASSWORD, 'Password is too weak');
      }

      // Find user with matching token (unactivated account)
      const [user] = await db.select().from(users)
        .where(
          and(
            eq(users.isActive, false),
            eq(users.emailVerified, false),
          )
        )
        .limit(1);

      if (!user || !user.passwordResetTokenHash || !user.passwordResetExpiresAt) {
        throw AppError.unauthorized(ErrorCode.AUTH_TOKEN_INVALID, 'Activation token is invalid or has expired');
      }

      // Check token expiry
      if (user.passwordResetExpiresAt.getTime() < Date.now()) {
        throw AppError.unauthorized(ErrorCode.AUTH_TOKEN_EXPIRED, 'Activation token has expired');
      }

      const tokenMatches = await bcrypt.compare(token, user.passwordResetTokenHash);
      if (!tokenMatches) {
        throw AppError.unauthorized(ErrorCode.AUTH_TOKEN_INVALID, 'Activation token is invalid');
      }

      // Hash new password
      const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);

      // Update user: set password, activate account, verify email, clear token
      await db.update(users)
        .set({
          passwordHash,
          isActive: true,
          emailVerified: true,
          passwordResetTokenHash: null,
          passwordResetExpiresAt: null,
          passwordChangedAt: new Date(),
          updatedAt: new Date(),
          updatedBy: user.id,
        })
        .where(eq(users.id, user.id));

      // Create audit log
      await createFRSAuditLog({
        userId: user.id,
        action: 'account_activated',
        entityType: 'user',
        newValues: { isActive: true, emailVerified: true },
        ipAddress: ip,
        userAgent: req.headers['user-agent'],
      });

      res.json({
        success: true,
        message: 'Account activated successfully',
      });
    } catch (err) {
      if (err instanceof AppError) throw err;
      console.error('[FRS Auth] Activate account error:', err);
      throw AppError.internal();
    }
  }));

  /**
   * POST /api/frs/auth/validate-reset-token
   * Public endpoint to validate a password reset token
   * Returns: { valid: boolean }
   */
  router.post('/validate-reset-token', asyncHandler(async (req: Request, res: Response) => {
    const ip = req.ip || 'unknown';

    if (!checkRateLimit(ip)) {
      throw AppError.badRequest(ErrorCode.RATE_LIMIT_EXCEEDED, 'Too many attempts. Please try again later.');
    }

    const { token } = validateResetTokenSchema.parse(req.body);

    try {
      // Find user with matching token (active account)
      const [user] = await db.select().from(users)
        .where(eq(users.isActive, true))
        .limit(1);

      if (!user || !user.passwordResetTokenHash || !user.passwordResetExpiresAt) {
        res.json({ valid: false });
        return;
      }

      // Check token expiry
      if (user.passwordResetExpiresAt.getTime() < Date.now()) {
        res.json({ valid: false });
        return;
      }

      // Verify token with bcrypt
      const tokenMatches = await bcrypt.compare(token, user.passwordResetTokenHash);
      if (!tokenMatches) {
        res.json({ valid: false });
        return;
      }

      // Token is valid
      res.json({ valid: true });
    } catch (err) {
      if (err instanceof AppError) throw err;
      console.error('[FRS Auth] Validate reset token error:', err);
      throw AppError.internal();
    }
  }));

  /**
   * POST /api/frs/auth/reset-password-new
   * Public endpoint to complete password reset (new implementation)
   * Body: { token: string, newPassword: string }
   */
  router.post('/reset-password-new', asyncHandler(async (req: Request, res: Response) => {
    const ip = req.ip || 'unknown';

    if (!checkRateLimit(ip)) {
      throw AppError.badRequest(ErrorCode.RATE_LIMIT_EXCEEDED, 'Too many attempts. Please try again later.');
    }

    const { token, newPassword } = resetPasswordNewSchema.parse(req.body);

    try {
      // Validate password strength (minimum "fair" level)
      const strengthResult = calculatePasswordStrength(newPassword);
      if (strengthResult.score <= 25) {
        throw AppError.badRequest(ErrorCode.WEAK_PASSWORD, 'Password is too weak');
      }

      // Find user with matching token (active account)
      const [user] = await db.select().from(users)
        .where(eq(users.isActive, true))
        .limit(1);

      if (!user || !user.passwordResetTokenHash || !user.passwordResetExpiresAt) {
        throw AppError.unauthorized(ErrorCode.AUTH_TOKEN_INVALID, 'Reset token is invalid or has expired');
      }

      // Check token expiry
      if (user.passwordResetExpiresAt.getTime() < Date.now()) {
        throw AppError.unauthorized(ErrorCode.AUTH_TOKEN_EXPIRED, 'Reset token has expired');
      }

      const tokenMatches = await bcrypt.compare(token, user.passwordResetTokenHash);
      if (!tokenMatches) {
        throw AppError.unauthorized(ErrorCode.AUTH_TOKEN_INVALID, 'Reset token is invalid');
      }

      // Hash new password
      const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);

      // Update user: set password, clear token, update password_changed_at, increment authz_version
      await db.update(users)
        .set({
          passwordHash,
          passwordResetTokenHash: null,
          passwordResetExpiresAt: null,
          passwordChangedAt: new Date(),
          authzVersion: (user.authzVersion ?? 1) + 1,
          updatedAt: new Date(),
          updatedBy: user.id,
        })
        .where(eq(users.id, user.id));

      // Create audit log
      await createFRSAuditLog({
        userId: user.id,
        action: 'password_reset_complete',
        entityType: 'user',
        newValues: { passwordChanged: true },
        ipAddress: ip,
        userAgent: req.headers['user-agent'],
      });

      res.json({
        success: true,
        message: 'Password reset successfully',
      });
    } catch (err) {
      if (err instanceof AppError) throw err;
      console.error('[FRS Auth] Reset password error:', err);
      throw AppError.internal();
    }
  }));

  /**
   * PATCH /api/frs/auth/profile
   * Updates the current authenticated user's profile info
   */
  router.patch('/profile', authenticate, asyncHandler(async (req: Request, res: Response) => {
    const { fullName, email } = updateProfileSchema.parse(req.body);
    const userId = req.user!.userId;

    // Check email uniqueness if changed
    if (email) {
      const [existing] = await db.select({ id: users.id }).from(users).where(and(eq(users.email, email), sql`${users.id} != ${userId}`)).limit(1);
      if (existing) {
        throw AppError.badRequest(ErrorCode.EMAIL_ALREADY_EXISTS, 'Email already exists');
      }
    }

    const [updated] = await db.update(users)
      .set({
        fullName: fullName || undefined,
        email: email || undefined,
        updatedAt: new Date(),
        updatedBy: userId,
      })
      .where(eq(users.id, userId))
      .returning();

    await createFRSAuditLog({
      userId: userId,
      action: 'profile_updated',
      entityType: 'User',
      entityId: userId,
      newValues: { fullName, email },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.json({
      success: true,
      user: {
        id: updated.id,
        username: updated.username,
        email: updated.email,
        fullName: updated.fullName,
      }
    });
  }));

  /**
   * POST /api/frs/auth/change-password
   * Changes the current authenticated user's password
   */
  router.post('/change-password', authenticate, asyncHandler(async (req: Request, res: Response) => {
    const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);
    const userId = req.user!.userId;

    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user || !user.passwordHash) {
      throw AppError.notFound(ErrorCode.USER_NOT_FOUND, 'User not found');
    }

    // Verify current password
    const matches = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!matches) {
      throw AppError.unauthorized(ErrorCode.AUTH_INVALID_CREDENTIALS, 'Incorrect current password');
    }

    // Validate new password strength
    const strength = calculatePasswordStrength(newPassword);
    if (strength.score <= 25) {
      throw AppError.badRequest(ErrorCode.WEAK_PASSWORD, 'New password is too weak');
    }

    // Hash and update
    const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    await db.update(users)
      .set({
        passwordHash,
        passwordChangedAt: new Date(),
        authzVersion: (user.authzVersion ?? 1) + 1,
        updatedAt: new Date(),
        updatedBy: userId,
      })
      .where(eq(users.id, userId));

    await createFRSAuditLog({
      userId: userId,
      action: 'password_changed',
      entityType: 'User',
      entityId: userId,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.json({ success: true, message: 'Password changed successfully' });
  }));

  /**
   * POST /api/frs/auth/avatar
   * Uploads or updates the current authenticated user's avatar
   */
  router.post('/avatar', authenticate, asyncHandler(async (req: Request, res: Response) => {
    // For now, we'll just accept a URL in the body as a placeholder
    // Real implementation would use multer/S3
    const { avatarUrl } = req.body;
    if (!avatarUrl) {
      throw AppError.badRequest(ErrorCode.INVALID_INPUT, 'avatarUrl is required');
    }

    const userId = req.user!.userId;
    await db.update(users)
      .set({
        avatarUrl,
        updatedAt: new Date(),
        updatedBy: userId,
      })
      .where(eq(users.id, userId));

    await createFRSAuditLog({
      userId: userId,
      action: 'avatar_uploaded',
      entityType: 'User',
      entityId: userId,
      newValues: { avatarUrl },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.json({ success: true, avatarUrl });
  }));

  return router;
}

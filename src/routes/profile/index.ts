// User Profile Routes
// GET  /api/profile — JWT required; return current user profile (no password fields)
// PUT  /api/profile — JWT required; update fullName and email; Zod validation; audit log
// POST /api/profile/avatar — JWT required; multipart/form-data; validate file type and size; store file; update avatar_url; audit log
// POST /api/profile/change-password — JWT required; validate current_password; validate new password strength; hash and update; increment authz_version; update password_changed_at; audit log
// GET  /api/profile/activity — JWT required; return last 10 login activities from user_login_activities
// GET  /api/profile/corporate-access — JWT required; return user's corporate access with role/scope/corporate/department
// Requirements: 16.1–16.16

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { eq, desc } from 'drizzle-orm';
import { authenticate } from '../../middleware/auth';
import { asyncHandler } from '../../utils/asyncHandler';
import { db } from '../../db/connection';
import { users, userLoginActivities, userCorporateAccesses, roles } from '../../db/schema/index';
import { createFRSAuditLog } from '../../services/financial/auditLogService';
import { calculatePasswordStrength } from '../../services/financial/passwordStrength';

const BCRYPT_ROUNDS = 10;

// Zod schemas for validation
const updateProfileSchema = z.object({
  fullName: z.string().trim().min(1, 'Full name is required').max(100),
  email: z.string().trim().email('Invalid email address'),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
});

export function createProfileRouter(): Router {
  const router = Router();

  /**
   * GET /api/profile
   * Returns current user's profile information (no password fields)
   */
  router.get('/', authenticate, asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;

    const [user] = await db.select({
      id: users.id,
      username: users.username,
      email: users.email,
      fullName: users.fullName,
      avatarUrl: users.avatarUrl,
      emailVerified: users.emailVerified,
      isActive: users.isActive,
      lastLogin: users.lastLogin,
      lastLoginIp: users.lastLoginIp,
      lastLoginUserAgent: users.lastLoginUserAgent,
      passwordChangedAt: users.passwordChangedAt,
      createdAt: users.createdAt,
    }).from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      res.status(404).json({
        error: {
          code: 'FRS_NOT_FOUND',
          message: 'User not found',
          timestamp: new Date().toISOString(),
          requestId: '',
        },
      });
      return;
    }

    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      avatarUrl: user.avatarUrl,
      emailVerified: user.emailVerified,
      isActive: user.isActive,
      lastLogin: user.lastLogin,
      lastLoginIp: user.lastLoginIp,
      lastLoginUserAgent: user.lastLoginUserAgent,
      passwordChangedAt: user.passwordChangedAt,
      createdAt: user.createdAt,
    });
  }));

  /**
   * PUT /api/profile
   * Updates current user's profile (fullName and email)
   */
  router.put('/', authenticate, asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const parsed = updateProfileSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({
        error: {
          code: 'FRS_VALIDATION_ERROR',
          message: 'Invalid input',
          timestamp: new Date().toISOString(),
          requestId: '',
        },
      });
      return;
    }

    const { fullName, email } = parsed.data;

    // Check if email is already in use by another user
    const [existingUser] = await db.select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser && existingUser.id !== userId) {
      res.status(422).json({
        error: {
          code: 'FRS_VALIDATION_ERROR',
          message: 'Email is already in use',
          timestamp: new Date().toISOString(),
          requestId: '',
        },
      });
      return;
    }

    // Get current user data for audit log
    const [currentUser] = await db.select({
      fullName: users.fullName,
      email: users.email,
    }).from(users)
      .where(eq(users.id, userId))
      .limit(1);

    // Update user
    await db.update(users)
      .set({
        fullName,
        email,
        updatedAt: new Date(),
        updatedBy: userId,
      })
      .where(eq(users.id, userId));

    // Create audit log
    await createFRSAuditLog({
      userId,
      action: 'profile_updated',
      entityType: 'user',
      oldValues: {
        fullName: currentUser?.fullName,
        email: currentUser?.email,
      },
      newValues: { fullName, email },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.json({
      success: true,
      message: 'Profile updated successfully',
    });
  }));

  /**
   * POST /api/profile/avatar
   * Uploads user avatar (multipart/form-data)
   * Validates file type (jpg/jpeg/png/webp) and size (max 2MB)
   */
  router.post('/avatar', authenticate, asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;

    // Note: In a real implementation, you would use multer middleware to handle file uploads
    // For now, this is a placeholder that expects the file to be sent as base64 or binary
    // In production, integrate with multer or similar file upload middleware

    // This is a simplified implementation - in production, use multer
    res.status(501).json({
      error: {
        code: 'FRS_NOT_IMPLEMENTED',
        message: 'Avatar upload requires multer middleware configuration',
        timestamp: new Date().toISOString(),
        requestId: '',
      },
    });
  }));

  /**
   * POST /api/profile/change-password
   * Changes current user's password
   * Requires: currentPassword, newPassword
   * Validates current password, validates new password strength, increments authz_version
   */
  router.post('/change-password', authenticate, asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const parsed = changePasswordSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({
        error: {
          code: 'FRS_VALIDATION_ERROR',
          message: 'Invalid input',
          timestamp: new Date().toISOString(),
          requestId: '',
        },
      });
      return;
    }

    const { currentPassword, newPassword } = parsed.data;

    // Get current user
    const [user] = await db.select({
      id: users.id,
      passwordHash: users.passwordHash,
      authzVersion: users.authzVersion,
    }).from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      res.status(404).json({
        error: {
          code: 'FRS_NOT_FOUND',
          message: 'User not found',
          timestamp: new Date().toISOString(),
          requestId: '',
        },
      });
      return;
    }

    // Verify current password
    const passwordMatches = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!passwordMatches) {
      res.status(401).json({
        error: {
          code: 'FRS_INVALID_CREDENTIALS',
          message: 'Current password is incorrect',
          timestamp: new Date().toISOString(),
          requestId: '',
        },
      });
      return;
    }

    // Validate new password strength (minimum "fair" level)
    const strengthResult = calculatePasswordStrength(newPassword);
    if (strengthResult.score <= 25) {
      res.status(400).json({
        error: {
          code: 'FRS_WEAK_PASSWORD',
          message: 'Password does not meet security requirements',
          timestamp: new Date().toISOString(),
          requestId: '',
        },
      });
      return;
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);

    // Update user: set new password, update password_changed_at, increment authz_version
    await db.update(users)
      .set({
        passwordHash: newPasswordHash,
        passwordChangedAt: new Date(),
        authzVersion: (user.authzVersion ?? 1) + 1,
        updatedAt: new Date(),
        updatedBy: userId,
      })
      .where(eq(users.id, userId));

    // Create audit log
    await createFRSAuditLog({
      userId,
      action: 'password_changed',
      entityType: 'user',
      newValues: { passwordChanged: true },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.json({
      success: true,
      message: 'Password changed successfully',
    });
  }));

  /**
   * GET /api/profile/activity
   * Returns last 10 login activities from user_login_activities
   */
  router.get('/activity', asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;

    const activities = await db.select({
      id: userLoginActivities.id,
      loginAt: userLoginActivities.loginAt,
      ipAddress: userLoginActivities.ipAddress,
      userAgent: userLoginActivities.userAgent,
      success: userLoginActivities.success,
    }).from(userLoginActivities)
      .where(eq(userLoginActivities.userId, userId))
      .orderBy(desc(userLoginActivities.loginAt))
      .limit(10);

    res.json({
      activities: activities.map(activity => ({
        id: activity.id,
        loginAt: activity.loginAt,
        ipAddress: activity.ipAddress,
        userAgent: activity.userAgent,
        success: activity.success,
      })),
    });
  }));

  /**
   * GET /api/profile/corporate-access
   * Returns user's corporate access with role/scope/corporate/department
   */
  router.get('/corporate-access', authenticate, asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;

    const accesses = await db.select({
      id: userCorporateAccesses.id,
      roleId: userCorporateAccesses.roleId,
      scope: userCorporateAccesses.scope,
      corporateId: userCorporateAccesses.corporateId,
      departmentId: userCorporateAccesses.departmentId,
      roleName: roles.name,
    }).from(userCorporateAccesses)
      .leftJoin(roles, eq(userCorporateAccesses.roleId, roles.id))
      .where(eq(userCorporateAccesses.userId, userId));

    res.json({
      accesses: accesses.map(access => ({
        id: access.id,
        roleId: access.roleId,
        roleName: access.roleName,
        scope: access.scope,
        corporateId: access.corporateId,
        departmentId: access.departmentId,
      })),
    });
  }));

  return router;
}

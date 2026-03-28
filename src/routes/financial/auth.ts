// FRS Authentication Routes
// POST /api/frs/auth/login
// POST /api/frs/auth/logout
// GET  /api/frs/auth/me
// Requirements: 9.6, 9.7, 9.8

import { Router, Request, Response } from 'express';
import Database from 'better-sqlite3';
import { authenticateUser, invalidateToken, getUserById } from '../../services/financial/authService';
import { requireFRSAuth } from '../../middleware/frsAuth';
import { createFRSAuditLog } from '../../services/financial/auditLogService.js';

export function createFRSAuthRouter(db: Database.Database): Router {
  const router = Router();

  /**
   * POST /api/frs/auth/login
   * Authenticates user and returns JWT token.
   */
  router.post('/login', async (req: Request, res: Response) => {
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
      const result = await authenticateUser(db, username, password);

      if (!result) {
        // Log failed login attempt
        createFRSAuditLog(db, {
          userId: 'unknown',
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
      createFRSAuditLog(db, {
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
          fullName: result.user.fullName,
        },
      });
    } catch (err) {
      console.error('[FRS Auth] Login error:', err);
      res.status(500).json({
        error: { code: 'FRS_SERVER_ERROR', message: 'Internal server error', timestamp: new Date().toISOString(), requestId: '' },
      });
    }
  });

  /**
   * POST /api/frs/auth/logout
   * Invalidates the current JWT token.
   */
  router.post('/logout', requireFRSAuth, (req: Request, res: Response) => {
    const token = req.headers.authorization?.slice(7) ?? '';
    invalidateToken(token);

    createFRSAuditLog(db, {
      userId: req.frsUser!.userId,
      action: 'logout',
      entityType: 'auth',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.json({ success: true, message: 'Logged out successfully' });
  });

  /**
   * GET /api/frs/auth/me
   * Returns the current authenticated user.
   */
  router.get('/me', requireFRSAuth, (req: Request, res: Response) => {
    const user = getUserById(db, req.frsUser!.userId);
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
      fullName: user.fullName,
      lastLogin: user.lastLogin,
    });
  });

  return router;
}

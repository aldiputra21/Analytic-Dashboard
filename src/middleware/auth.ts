// Unified JWT Authentication Middleware
// Requirements: 9.6, 9.7, 9.8

import { Request, Response, NextFunction } from 'express';
import { and, eq } from 'drizzle-orm';
import { db } from '../db/connection';
import { users } from '../db/schema';
import { verifyToken } from '../services/financial/authService';
import { JWTPayload } from '../types/financial/user';
import { asyncHandler } from '../utils/asyncHandler';

// Extend Express Request with unified user context
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

/**
 * Extracts the Bearer token from the Authorization header.
 */
function extractToken(req: Request): string | null {
  // 1. Try Authorization header
  const auth = req.headers.authorization;
  if (auth && auth.startsWith('Bearer ')) {
    return auth.slice(7);
  }

  // 2. Try query parameter (fallback for SSE/Streams)
  const queryToken = req.query.token;
  if (typeof queryToken === 'string') {
    return queryToken;
  }

  return null;
}

/**
 * Middleware: requires a valid JWT token.
 * Attaches the decoded payload to req.user.
 * Requirements: 9.7 (session timeout via JWT expiry)
 */
export const authenticate = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const token = extractToken(req);
  if (!token) {
    res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] ?? '',
      },
    });
    return;
  }

  const payload = verifyToken(token);
  if (!payload) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[Auth] 401: Token verification failed for ${req.method} ${req.url}`);
    }
    res.status(401).json({
      error: {
        code: 'TOKEN_INVALID',
        message: 'Invalid or expired token',
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] ?? '',
      },
    });
    return;
  }

  const [user] = await db.select({
    id: users.id,
    isActive: users.isActive,
    authzVersion: users.authzVersion,
  }).from(users)
    .where(and(eq(users.id, payload.userId), eq(users.isActive, true)))
    .limit(1);

  if (!user || (user.authzVersion ?? 1) !== (payload.authzVersion ?? 1)) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[Auth] 401: Authz version mismatch or user inactive for ${payload.username}`);
    }
    res.status(401).json({
      error: {
        code: 'TOKEN_INVALID',
        message: 'Session expired or authorization has changed',
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] ?? '',
      },
    });
    return;
  }

  // Attach to the unified user context
  req.user = payload;

  // Sliding Expiration (Stay-alive) logic
  // If more than 50% of session time has passed, issue a new token
  if (payload.iat && payload.exp) {
    const now = Math.floor(Date.now() / 1000);
    const totalLife = payload.exp - payload.iat;
    const elapsed = now - payload.iat;

    // Safety check: totalLife should be positive
    if (totalLife > 0 && elapsed > totalLife / 2) {
      const { issueToken } = await import('../services/financial/authService');
      const newToken = issueToken(payload);
      res.setHeader('X-Refresh-Token', newToken);
      res.setHeader('Access-Control-Expose-Headers', 'X-Refresh-Token');
    }
  }

  next();
});

/**
 * Middleware: requires a valid FRS JWT token.
 * (Alias for authenticate for backward compatibility)
 */
export const requireFRSAuth = authenticate;

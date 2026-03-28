// FRS JWT Authentication Middleware
// Requirements: 9.6, 9.7, 9.8

import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../services/financial/authService';
import { JWTPayload, UserRole } from '../types/financial/user';

// Extend Express Request with FRS user context
declare global {
  namespace Express {
    interface Request {
      frsUser?: JWTPayload;
    }
  }
}

/**
 * Extracts the Bearer token from the Authorization header.
 */
function extractToken(req: Request): string | null {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return null;
  return auth.slice(7);
}

/**
 * Middleware: requires a valid FRS JWT token.
 * Attaches the decoded payload to req.frsUser.
 * Requirements: 9.7 (session timeout via JWT expiry)
 */
export function requireFRSAuth(req: Request, res: Response, next: NextFunction): void {
  const token = extractToken(req);
  if (!token) {
    res.status(401).json({
      error: {
        code: 'FRS_UNAUTHORIZED',
        message: 'Authentication required',
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] ?? '',
      },
    });
    return;
  }

  const payload = verifyToken(token);
  if (!payload) {
    res.status(401).json({
      error: {
        code: 'FRS_TOKEN_INVALID',
        message: 'Invalid or expired token',
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] ?? '',
      },
    });
    return;
  }

  req.frsUser = payload;
  next();
}

/**
 * Middleware: requires the user to have one of the specified roles.
 */
export function requireFRSRole(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.frsUser) {
      res.status(401).json({
        error: { code: 'FRS_UNAUTHORIZED', message: 'Authentication required', timestamp: new Date().toISOString(), requestId: '' },
      });
      return;
    }

    if (!roles.includes(req.frsUser.role)) {
      res.status(403).json({
        error: {
          code: 'FRS_FORBIDDEN',
          message: `Access denied. Required roles: ${roles.join(', ')}`,
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] ?? '',
        },
      });
      return;
    }

    next();
  };
}

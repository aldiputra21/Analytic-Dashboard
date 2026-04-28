import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError, ErrorCode } from '../utils/errors.js';

/**
 * Global error handling middleware for the API.
 * This should be the last middleware registered.
 */
export function errorHandler(err: any, req: Request, res: Response, _next: NextFunction) {
  const requestId = (req.headers['x-request-id'] as string) ?? '';
  let status = err.status ?? err.statusCode ?? 500;
  let code = err.code ?? (status === 404 ? ErrorCode.NOT_FOUND : ErrorCode.INTERNAL_SERVER_ERROR);
  let message = err.message || 'An error occurred';
  let details = err.details;

  // Handle Zod Validation Errors
  if (err instanceof ZodError) {
    status = 400;
    code = ErrorCode.VALIDATION_ERROR;
    message = 'Validation failed';
    details = err.issues;
  }

  // Handle Postgres Unique Violation
  if (err.code === '23505') {
    status = 409;
    code = ErrorCode.DUPLICATE_ENTRY;
    message = 'A record with this identifier already exists';
  }

  // Handle AppError
  if (err instanceof AppError) {
    status = err.statusCode;
    code = err.code;
    message = err.message;
    details = err.details;
  }
  
  // Log the error
  console.error(`[API Error] ${req.method} ${req.url}:`, message);
  if (status >= 500 && err.stack) {
    console.error(err.stack);
  }

  // Ensure message is user-friendly for 500 errors
  if (status >= 500 && process.env.NODE_ENV === 'production') {
    message = 'An internal server error occurred';
  }

  // Response format consistent with FRS requirements
  res.status(status).json({
    error: {
      code,
      message,
      details,
      field: err.field,
      timestamp: new Date().toISOString(),
      requestId,
    },
  });
}

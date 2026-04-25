import { Request, Response, NextFunction } from 'express';

/**
 * Global error handling middleware for the API.
 * This should be the last middleware registered.
 */
export function errorHandler(err: any, req: Request, res: Response, _next: NextFunction) {
  const requestId = (req.headers['x-request-id'] as string) ?? '';
  const status = err.status ?? err.statusCode ?? 500;
  
  // Log the error
  console.error(`[API Error] ${req.method} ${req.url}:`, err.message || err);
  if (status >= 500 && err.stack) {
    console.error(err.stack);
  }

  // Response format consistent with FRS requirements
  res.status(status).json({
    error: {
      code: err.code ?? (status === 404 ? 'NOT_FOUND' : 'INTERNAL_SERVER_ERROR'),
      message: status < 500 ? (err.message || 'An error occurred') : 'An internal server error occurred',
      details: err.details,
      field: err.field,
      timestamp: new Date().toISOString(),
      requestId,
    },
  });
}

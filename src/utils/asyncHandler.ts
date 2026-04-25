import { Request, Response, NextFunction, RequestHandler } from 'express';

/**
 * Wraps an asynchronous Express route handler to catch errors and pass them to the next middleware.
 * Use this to avoid repetitive try-catch blocks and ensure unhandled rejections are caught.
 */
export function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<any>): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

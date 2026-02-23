/**
 * Express error handler. No stack trace to client; log appropriately.
 */

import type { Request, Response, NextFunction } from 'express';

export function errorMiddleware(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const message = err instanceof Error ? err.message : 'Internal server error';
  if (err instanceof Error && err.stack) {
    console.error(err.stack);
  } else {
    console.error(String(err));
  }
  res.status(500).json({ error: message });
}

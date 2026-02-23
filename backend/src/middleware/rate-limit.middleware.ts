/**
 * Simple in-memory rate limit for /api/chat (per IP).
 * Returns 429 when limit exceeded.
 */

import type { Request, Response, NextFunction } from 'express';

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 30;
const store = new Map<string, { count: number; resetAt: number }>();

function getClientKey(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.socket.remoteAddress ?? 'unknown';
}

export function rateLimitMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const key = getClientKey(req);
  const now = Date.now();
  let entry = store.get(key);
  if (!entry) {
    entry = { count: 1, resetAt: now + WINDOW_MS };
    store.set(key, entry);
    next();
    return;
  }
  if (now >= entry.resetAt) {
    entry = { count: 1, resetAt: now + WINDOW_MS };
    store.set(key, entry);
    next();
    return;
  }
  entry.count += 1;
  if (entry.count > MAX_REQUESTS) {
    res.status(429).json({ error: 'Too many requests' });
    return;
  }
  next();
}

/**
 * Body validation for POST /api/chat: message required, string, non-empty after trim.
 * Returns 400 with JSON error shape on failure.
 */

import type { Request, Response, NextFunction } from 'express';

interface ChatBody {
  message?: unknown;
}

export function validateChatBody(
  req: Request<object, object, ChatBody>,
  res: Response,
  next: NextFunction
): void {
  const body = req.body;
  if (body == null || typeof body !== 'object') {
    res.status(400).json({ error: 'Request body must be a JSON object' });
    return;
  }
  const { message } = body;
  if (message === undefined || message === null) {
    res.status(400).json({ error: 'message required' });
    return;
  }
  if (typeof message !== 'string') {
    res.status(400).json({ error: 'message must be a string' });
    return;
  }
  const trimmed = message.trim();
  if (trimmed.length === 0) {
    res.status(400).json({ error: 'message must not be empty after trim' });
    return;
  }
  // Do not log raw user input (sanitize for logging)
  res.locals.validatedMessage = trimmed;
  next();
}

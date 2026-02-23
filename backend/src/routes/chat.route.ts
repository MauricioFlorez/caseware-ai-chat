/**
 * POST /api/chat: validate body, stream SSE via Copilot proxy.
 */

import { Router, type Request, type Response } from 'express';
import { validateChatBody } from '../middleware/validate.middleware.js';
import { runCopilotProxy } from '../proxy/copilot.proxy.js';

const router = Router();

router.post('/', validateChatBody, (_req: Request, res: Response): void => {
  const message = res.locals.validatedMessage as string;
  runCopilotProxy(_req, res, message);
});

export const chatRoute: Router = router;

/**
 * Express app setup. Mounted by index.ts.
 * @module app
 */

import express, { type Express } from 'express';
import { config } from './config/config.js';
import { chatRoute } from './routes/chat.route.js';
import { errorMiddleware } from './middleware/error.middleware.js';
import { rateLimitMiddleware } from './middleware/rate-limit.middleware.js';

const app: Express = express();

app.use(express.json());

// CORS: allow frontend origin (explicit, no permissive default)
app.use((_req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', config.CORS_ORIGIN);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');
  if (_req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }
  next();
});

app.use('/api/chat', rateLimitMiddleware, chatRoute);
app.use(errorMiddleware);

export default app;

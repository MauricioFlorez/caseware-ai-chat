/**
 * SSE formatting: set headers and write StreamEvent as data lines.
 * Uses StreamEvent from @caseware-ai-chat/shared only.
 */

import type { StreamEvent } from '@caseware-ai-chat/shared';
import type { Response } from 'express';

const SSE_HEADERS = {
  'Content-Type': 'text/event-stream',
  'Cache-Control': 'no-cache',
  Connection: 'keep-alive',
} as const;

/**
 * Set SSE response headers. Call once before any write.
 */
export function setSSEHeaders(res: Response): void {
  res.setHeader('Content-Type', SSE_HEADERS['Content-Type']);
  res.setHeader('Cache-Control', SSE_HEADERS['Cache-Control']);
  res.setHeader('Connection', SSE_HEADERS.Connection);
}

/**
 * Write one StreamEvent as a data line. Format: data: <JSON>\n\n
 */
export function writeSSEEvent(res: Response, event: StreamEvent): void {
  res.write(`data: ${JSON.stringify(event)}\n\n`);
}

/**
 * Write an SSE comment line. Format: : <comment>\n\n
 * Used for keepalives (e.g. : started, : keepalive). Client ignores these.
 */
export function writeSSEComment(res: Response, comment: string): void {
  res.write(`: ${comment}\n\n`);
}

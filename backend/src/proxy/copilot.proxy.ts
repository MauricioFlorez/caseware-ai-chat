/**
 * Copilot proxy: spawn gh copilot with -p "<message>", stream stdout as SSE.
 * stderr or non-zero exit → one error event then done. Client abort → child.kill().
 * Do NOT finish on req.on('close'); only on child exit, child error, stderr, abort, or write failure.
 * Keepalives: : started immediately, : keepalive every 3s until first delta or finish.
 */

import { spawn } from 'child_process';
import type { Request, Response } from 'express';
import type { StreamEvent } from '@caseware-ai-chat/shared';
import { setSSEHeaders, writeSSEEvent, writeSSEComment } from './sse.writer.js';

const KEEPALIVE_INTERVAL_MS = 3000;

export function runCopilotProxy(req: Request, res: Response, message: string): void {
  setSSEHeaders(res);

  // Disable server/request/socket timeouts so long Copilot responses are not cut off
  if (req.socket) req.socket.setTimeout(0);
  req.setTimeout(0);
  res.setTimeout(0);

  // Non-interactive: -p "<message>", -- before Copilot flags, --allow-all-tools, -s (script stdout)
  const child = spawn('gh', ['copilot', 'suggest', '--', '-p', message, '--allow-all-tools', '-s'], {
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: false,
  });

  let ended = false;
  let hadStderr = false;
  let doneSent = false;
  let keepaliveTimer: ReturnType<typeof setInterval> | null = null;

  function clearKeepalive(): void {
    if (keepaliveTimer) {
      clearInterval(keepaliveTimer);
      keepaliveTimer = null;
    }
  }

  function finish(reason: string): void {
    if (ended) return;
    ended = true;
    clearKeepalive();
    try {
      child.kill();
    } catch {
      // ignore
    }
    try {
      if (!res.writableEnded) res.end();
    } catch {
      // ignore
    }
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[copilot proxy] finish: ${reason}`);
    }
  }

  function send(event: StreamEvent): void {
    if (ended || res.writableEnded) return;
    if (event.type === 'done') {
      if (doneSent) return;
      doneSent = true;
    }
    try {
      writeSSEEvent(res, event);
      if (process.env.NODE_ENV !== 'production') {
        if (event.type === 'delta') {
          console.log(`[copilot proxy] send: { type: ${event.type}, text: ${event.text} }`);
        } else if (event.type === 'done') {
          console.log(`[copilot proxy] send: { type: ${event.type} }`);
        } else if (event.type === 'error') {
          console.log(`[copilot proxy] send: { type: ${event.type}, message: ${event.message} }`);
        }
      }
    } catch {
      finish('write failed');
    }
  }

  // Immediate keepalive; then periodic until first delta or finish
  try {
    writeSSEComment(res, 'started');
  } catch {
    finish('keepalive write failed');
    return;
  }
  keepaliveTimer = setInterval(() => {
    if (ended || res.writableEnded) return;
    try {
      writeSSEComment(res, 'keepalive');
    } catch {
      finish('keepalive write failed');
    }
  }, KEEPALIVE_INTERVAL_MS);

  // Do NOT finish on req.on('close') — Node can emit close while socket still writable
  req.on('abort', () => {
    finish('client abort');
  });

  child.stdout.on('data', (chunk: Buffer) => {
    clearKeepalive();
    if (hadStderr) return;
    const text = chunk.toString('utf8');
    if (text) send({ type: 'delta', text });
  });

  child.stderr.on('data', (chunk: Buffer) => {
    hadStderr = true;
    const msg = chunk.toString('utf8').trim() || 'Copilot stderr';
    send({ type: 'error', message: msg });
    send({ type: 'done' });
    finish('stderr');
  });

  child.on('error', (err: Error) => {
    if (!ended && !hadStderr) send({ type: 'error', message: err.message });
    send({ type: 'done' });
    finish(`child error: ${err.message}`);
  });

  child.on('exit', (code: number | null, _signal: string | null) => {
    if (ended) return;
    if (hadStderr) {
      finish('exit after stderr');
      return;
    }
    if (code !== 0 && code != null) {
      send({ type: 'error', message: `Process exited with code ${code}` });
    }
    send({ type: 'done' });
    finish(`child exit code=${code}`);
  });
}

/**
 * Chunk a buffer by word or by size (for buffered fallback when stdout only on exit).
 */
export function chunkBuffer(
  buffer: string,
  by: 'word' | 'size',
  size: number
): string[] {
  if (by === 'word') {
    const words = buffer.split(/(\s+)/);
    const out: string[] = [];
    let acc = '';
    for (const w of words) {
      if (acc.length + w.length <= size) {
        acc += w;
      } else {
        if (acc) out.push(acc);
        acc = w.length <= size ? w : w.slice(0, size);
        for (let i = size; i < w.length; i += size) out.push(w.slice(i, i + size));
      }
    }
    if (acc) out.push(acc);
    return out;
  }
  const out: string[] = [];
  for (let i = 0; i < buffer.length; i += size) out.push(buffer.slice(i, i + size));
  return out;
}

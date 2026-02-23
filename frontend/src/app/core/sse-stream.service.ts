import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';
import type { StreamEvent } from '@caseware-ai-chat/shared';
import { ConnectionStateService } from './connection-state.service';
import type { StreamSource } from './stream-source.interface';

/** Base URL for chat API (e.g. '' for same-origin, or backend origin). POST { message } to /api/chat. */
const DEFAULT_CHAT_API_URL = '/api/chat';

/** FR-025: max 3 retries (4 attempts total), 2s delay between attempts. */
const MAX_ATTEMPTS = 4;
const RETRY_DELAY_MS = 2000;

function isRetriableStatus(status: number): boolean {
  return status >= 500 || status === 429;
}

@Injectable({ providedIn: 'root' })
export class SseStreamService implements StreamSource {
  private readonly eventsSubject = new Subject<StreamEvent>();
  private abortController: AbortController | null = null;
  private retryTimeoutId: ReturnType<typeof setTimeout> | null = null;

  readonly events: Observable<StreamEvent> = this.eventsSubject.asObservable();

  constructor(private readonly connectionState: ConnectionStateService) {}

  send(message: string, _presetId?: string): void {
    this.cancel();
    this.doSend(message.trim(), 1);
  }

  private doSend(message: string, attempt: number): void {
    this.abortController = new AbortController();
    // FR-001: default badge is "connected"; only show "retrying" during retry delay (in scheduleRetry)
    this.connectionState.setActiveStream(true);

    const apiUrl = DEFAULT_CHAT_API_URL;
    const url = apiUrl.startsWith('http') ? apiUrl : `http://localhost:3000${apiUrl.startsWith('/') ? '' : '/'}${apiUrl}`;
    const finalUrl = url.endsWith('/chat') ? url : `${url.replace(/\/$/, '')}/chat`;

    fetch(finalUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
      body: JSON.stringify({ message }),
      signal: this.abortController.signal,
    })
      .then((response) => {
        if (!response.ok) {
          if (attempt < MAX_ATTEMPTS && isRetriableStatus(response.status)) {
            this.scheduleRetry(message, attempt);
            return;
          }
          this.connectionState.setMode('disconnected');
          this.connectionState.setActiveStream(false);
          this.eventsSubject.next({
            type: 'error',
            message: `Request failed: ${response.status} ${response.statusText}`,
          });
          return;
        }
        this.connectionState.setMode('connected');
        return this.readSSEStream(response);
      })
      .catch((err: unknown) => {
        if ((err as { name?: string })?.name === 'AbortError') return;
        if (attempt < MAX_ATTEMPTS) {
          this.scheduleRetry(message, attempt);
          return;
        }
        this.connectionState.setMode('disconnected');
        this.connectionState.setActiveStream(false);
        const msg =
          err instanceof Error ? err.message : typeof err === 'string' ? err : 'Connection failed';
        this.eventsSubject.next({ type: 'error', message: msg });
      });
  }

  private scheduleRetry(message: string, attempt: number): void {
    this.connectionState.setMode('retrying');
    this.connectionState.setActiveStream(false);
    this.retryTimeoutId = setTimeout(() => {
      this.retryTimeoutId = null;
      this.doSend(message, attempt + 1);
    }, RETRY_DELAY_MS);
  }

  private async readSSEStream(response: Response): Promise<void> {
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    if (!reader) {
      this.connectionState.setActiveStream(false);
      this.eventsSubject.next({ type: 'error', message: 'No response body' });
      return;
    }

    let buffer = '';
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split(/\n/);
        buffer = lines.pop() ?? '';
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const json = line.slice(6).trim();
            if (json === '') continue;
            try {
              const event = JSON.parse(json) as StreamEvent;
              if (event.type === 'delta' || event.type === 'done' || event.type === 'error') {
                this.eventsSubject.next(event);
                if (event.type === 'done' || event.type === 'error') {
                  this.connectionState.setActiveStream(false);
                  if (event.type === 'error') this.connectionState.setMode('disconnected');
                  return;
                }
              }
            } catch {
              // skip malformed line
            }
          }
        }
      }
      if (buffer.startsWith('data: ')) {
        const json = buffer.slice(6).trim();
        if (json) {
          try {
            const event = JSON.parse(json) as StreamEvent;
            if (event.type === 'delta' || event.type === 'done' || event.type === 'error') {
              this.eventsSubject.next(event);
              if (event.type === 'done' || event.type === 'error') {
                this.connectionState.setActiveStream(false);
                if (event.type === 'error') this.connectionState.setMode('disconnected');
                return;
              }
            }
          } catch {
            // skip
          }
        }
      }
      this.connectionState.setActiveStream(false);
      this.eventsSubject.next({ type: 'done' });
    } catch (err: unknown) {
      if ((err as { name?: string })?.name === 'AbortError') return;
      this.connectionState.setMode('disconnected');
      this.connectionState.setActiveStream(false);
      const message =
        err instanceof Error ? err.message : typeof err === 'string' ? err : 'Stream read failed';
      this.eventsSubject.next({ type: 'error', message });
    }
  }

  cancel(): void {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
      this.retryTimeoutId = null;
    }
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
    this.connectionState.setActiveStream(false);
  }
}

import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';
import type { StreamEvent } from '@caseware-ai-chat/shared';
import { ConnectionStateService } from './connection-state.service';
import type { StreamSource } from './stream-source.interface';

/** Base URL for chat API (e.g. '' for same-origin, or backend origin). POST { message } to /api/chat. */
const DEFAULT_CHAT_API_URL = '/api/chat';

@Injectable({ providedIn: 'root' })
export class SseStreamService implements StreamSource {
  private readonly eventsSubject = new Subject<StreamEvent>();
  private abortController: AbortController | null = null;

  readonly events: Observable<StreamEvent> = this.eventsSubject.asObservable();

  constructor(private readonly connectionState: ConnectionStateService) {}

  send(message: string, _presetId?: string): void {
    this.cancel();
    this.abortController = new AbortController();
    this.connectionState.setMode('retrying');
    this.connectionState.setActiveStream(true);

    const apiUrl = DEFAULT_CHAT_API_URL;
    const url = apiUrl.startsWith('http') ? apiUrl : `http://localhost:3000${apiUrl.startsWith('/') ? '' : '/'}${apiUrl}`;
    const finalUrl = url.endsWith('/chat') ? url : `${url.replace(/\/$/, '')}/chat`;

    fetch(finalUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
      body: JSON.stringify({ message: message.trim() }),
      signal: this.abortController.signal,
    })
      .then((response) => {
        if (!response.ok) {
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
        this.connectionState.setMode('disconnected');
        this.connectionState.setActiveStream(false);
        const message =
          err instanceof Error ? err.message : typeof err === 'string' ? err : 'Connection failed';
        this.eventsSubject.next({ type: 'error', message });
      });
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
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
    this.connectionState.setActiveStream(false);
  }
}

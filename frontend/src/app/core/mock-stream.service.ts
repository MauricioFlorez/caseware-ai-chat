import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';
import type { StreamEvent } from '@caseware-ai-chat/shared';
import { ConnectionStateService } from './connection-state.service';
import type { StreamSource } from './stream-source.interface';

const DEFAULT_RESPONSE = 'This is a mocked streamed response. It appears incrementally.';
const PRESETS: Record<string, string> = {
  short: 'Short mock reply.',
  medium: DEFAULT_RESPONSE,
  long: 'First chunk. Second chunk. Third chunk. Fourth chunk. Fifth chunk. Done.',
};

@Injectable({ providedIn: 'root' })
export class MockStreamService implements StreamSource {
  private readonly eventsSubject = new Subject<StreamEvent>();
  private cancelRequested = false;
  /** FR-022: clear previous stream timeouts on new send or cancel so only one stream emits. */
  private streamTimeoutId: ReturnType<typeof setTimeout> | null = null;

  readonly events: Observable<StreamEvent> = this.eventsSubject.asObservable();

  constructor(private connectionState: ConnectionStateService) {}

  send(message: string, presetId?: string): void {
    this.clearStreamTimeout();
    this.cancelRequested = true;
    this.connectionState.setActiveStream(false);

    this.cancelRequested = false;
    this.connectionState.setActiveStream(true);

    const text = presetId && PRESETS[presetId] != null ? PRESETS[presetId] : DEFAULT_RESPONSE;
    const words = text.split(/(\s+)/);
    let index = 0;

    const emitNext = (): void => {
      if (this.cancelRequested) {
        this.streamTimeoutId = null;
        this.connectionState.setActiveStream(false);
        return;
      }
      if (index >= words.length) {
        this.streamTimeoutId = null;
        this.eventsSubject.next({ type: 'done' });
        this.connectionState.setActiveStream(false);
        return;
      }
      this.eventsSubject.next({ type: 'delta', text: words[index] ?? '' });
      index += 1;
      this.streamTimeoutId = setTimeout(emitNext, 50);
    };

    this.streamTimeoutId = setTimeout(emitNext, 100);
  }

  cancel(): void {
    this.clearStreamTimeout();
    this.cancelRequested = true;
    this.connectionState.setActiveStream(false);
  }

  private clearStreamTimeout(): void {
    if (this.streamTimeoutId != null) {
      clearTimeout(this.streamTimeoutId);
      this.streamTimeoutId = null;
    }
  }
}

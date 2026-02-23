import type { StreamEvent } from '@caseware-ai-chat/shared';
import type { Observable } from 'rxjs';

/**
 * Stream source contract: send message (optional preset), emit events, allow cancel.
 * Mock and future real backend implement this.
 */
export interface StreamSource {
  send(message: string, presetId?: string): void;
  cancel(): void;
  events: Observable<StreamEvent>;
}

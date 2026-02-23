import { Injectable, signal, computed } from '@angular/core';

export type ConnectionMode = 'disconnected' | 'retrying' | 'connected';

@Injectable({ providedIn: 'root' })
export class ConnectionStateService {
  private readonly modeSignal = signal<ConnectionMode>('connected');
  private readonly activeStreamSignal = signal<boolean>(false);

  readonly mode = this.modeSignal.asReadonly();
  readonly activeStream = this.activeStreamSignal.asReadonly();

  setMode(mode: ConnectionMode): void {
    this.modeSignal.set(mode);
  }

  setActiveStream(active: boolean): void {
    this.activeStreamSignal.set(active);
  }
}

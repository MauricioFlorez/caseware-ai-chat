import { Injectable, inject, signal, computed } from '@angular/core';
import { ConnectionStateService } from './connection-state.service';

export type DataSourceMode = 'live' | 'mock';

@Injectable({ providedIn: 'root' })
export class DataSourceService {
  private readonly connectionState = inject(ConnectionStateService);
  private readonly sourceSignal = signal<DataSourceMode>('mock');

  readonly dataSource = this.sourceSignal.asReadonly();
  readonly isLive = computed(() => this.sourceSignal() === 'live');
  readonly isMock = computed(() => this.sourceSignal() === 'mock');

  setDataSource(mode: DataSourceMode): void {
    this.sourceSignal.set(mode);
    // FR-023/T037: reflect connection state per mode. Mock does not require network → show connected; live → show disconnected until first request succeeds.
    if (mode === 'mock') {
      this.connectionState.setMode('connected');
    } else {
      this.connectionState.setMode('disconnected');
    }
  }
}

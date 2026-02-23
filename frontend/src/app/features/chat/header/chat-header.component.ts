import { Component, inject, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConnectionStateService, type ConnectionMode } from '../../../core/connection-state.service';
import { DataSourceService, type DataSourceMode } from '../../../core/data-source.service';

export const MOCK_PRESETS = [
  { id: 'short', label: 'Short mock' },
  { id: 'medium', label: 'Medium mock' },
  { id: 'long', label: 'Long mock' },
] as const;

@Component({
  selector: 'app-chat-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './chat-header.component.html',
  styleUrl: './chat-header.component.scss',
})
export class ChatHeaderComponent {
  private readonly connection = inject(ConnectionStateService);
  readonly dataSourceService = inject(DataSourceService);

  readonly mode = this.connection.mode;
  readonly dataSource = this.dataSourceService.dataSource;
  readonly globalError = input<string | null>(null);
  readonly retry = output<void>();
  readonly mockPresetSelected = output<string>();

  readonly presets = MOCK_PRESETS;
  readonly modeLabel: Record<ConnectionMode, string> = {
    disconnected: 'Disconnected',
    retrying: 'Retrying',
    connected: 'Connected',
  };
  readonly dataSourceLabel: Record<DataSourceMode, string> = {
    live: 'Live',
    mock: 'Mock',
  };

  onPresetChange(presetId: string): void {
    if (presetId) this.mockPresetSelected.emit(presetId);
  }

  onDataSourceChange(mode: DataSourceMode): void {
    this.dataSourceService.setDataSource(mode);
  }
}

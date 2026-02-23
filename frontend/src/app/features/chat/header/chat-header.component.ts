import { Component, inject, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConnectionStateService, type ConnectionMode } from '../../../core/connection-state.service';

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

  readonly mode = this.connection.mode;
  readonly globalError = input<string | null>(null);
  readonly retry = output<void>();
  readonly mockPresetSelected = output<string>();

  readonly presets = MOCK_PRESETS;
  readonly modeLabel: Record<ConnectionMode, string> = {
    disconnected: 'Disconnected',
    retrying: 'Retrying',
    connected: 'Connected',
  };

  onPresetChange(presetId: string): void {
    if (presetId) this.mockPresetSelected.emit(presetId);
  }
}

import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import type { MessageRole, MessageStreamState } from './message.model';

@Component({
  selector: 'app-message',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './message.component.html',
  styleUrl: './message.component.scss',
  host: { '[attr.data-message-id]': 'id()' },
})
export class MessageComponent {
  readonly id = input.required<string>();
  readonly role = input.required<MessageRole>();
  readonly content = input<string>('');
  readonly streamState = input<MessageStreamState>();
  readonly errorInfo = input<string>();

  statusLabel(state: MessageStreamState): string {
    const labels: Record<MessageStreamState, string> = {
      in_progress: 'In Progress',
      done: 'Done',
      error: 'Error',
      cancelled: 'Stopped',
    };
    return labels[state] ?? state;
  }
}

import { Component, inject, signal, output, input } from '@angular/core';

@Component({
  selector: 'app-chat-composer',
  standalone: true,
  imports: [],
  templateUrl: './chat-composer.component.html',
  styleUrl: './chat-composer.component.scss',
})
export class ChatComposerComponent {
  readonly streamActive = input<boolean>(false);

  readonly sendMessage = output<string>();
  readonly stopStream = output<void>();

  readonly currentText = signal('');
  readonly lastSentText = signal('');
  readonly sendStopState = signal<'send' | 'stop'>('send');

  onSend(): void {
    const text = this.currentText().trim();
    if (!text || this.streamActive()) return;
    this.lastSentText.set(text);
    this.currentText.set(''); // Clear text area immediately per spec (FR-010a)
    this.sendStopState.set('stop');
    this.sendMessage.emit(text);
  }

  onStop(): void {
    if (!this.streamActive()) return;
    this.stopStream.emit();
    this.currentText.set(this.lastSentText());
    this.sendStopState.set('send');
  }

  onInput(value: string): void {
    this.currentText.set(value);
  }

  /**
   * Keyboard: Enter sends (if content); Shift+Enter inserts newline; Enter during stream no-op; Escape triggers Stop.
   */
  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      if (this.streamActive()) {
        event.preventDefault();
        this.onStop();
      }
      return;
    }
    if (event.key === 'Enter') {
      if (this.streamActive()) {
        event.preventDefault();
        return;
      }
      if (!event.shiftKey) {
        event.preventDefault();
        const text = this.currentText().trim();
        if (text) this.onSend();
      }
      // Shift+Enter: allow default (new line)
    }
  }

  /** Called by parent when stream ends (done/error) to reset button to Send without restoring text. */
  setStreamEnded(): void {
    this.sendStopState.set('send');
  }

  /** Restore last sent text into input (e.g. after Stop). */
  restoreLastSent(): void {
    this.currentText.set(this.lastSentText());
  }
}

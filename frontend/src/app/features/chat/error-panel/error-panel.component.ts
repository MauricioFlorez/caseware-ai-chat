import { Component, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

/** FR-004/FR-019: After 2 user Retry attempts that fail, show this message and hide Retry. */
export const ERROR_PANEL_MAX_RETRIES = 2;
export const ERROR_PANEL_MESSAGE_AFTER_MAX_RETRIES =
  'We are experiencing issues, try in some minutes.';

@Component({
  selector: 'app-error-panel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './error-panel.component.html',
  styleUrl: './error-panel.component.scss',
})
export class ErrorPanelComponent {
  readonly message = input<string>('Something went wrong.');
  readonly retryDisabled = input<boolean>(false);
  /** 0 = first error, 1 = after 1st Retry failed, 2 = after 2nd Retry failed → show alternate message, no Retry. */
  readonly retryCount = input<number>(0);

  readonly retry = output<void>();

  readonly displayMessage = computed(() =>
    this.retryCount() >= ERROR_PANEL_MAX_RETRIES
      ? ERROR_PANEL_MESSAGE_AFTER_MAX_RETRIES
      : this.message()
  );
  readonly showRetryButton = computed(() => this.retryCount() < ERROR_PANEL_MAX_RETRIES);
}

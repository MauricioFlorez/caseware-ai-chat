import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

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

  readonly retry = output<void>();
}

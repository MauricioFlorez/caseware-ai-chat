import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-scroll-anchor',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './scroll-anchor.component.html',
  styleUrl: './scroll-anchor.component.scss',
})
export class ScrollAnchorComponent {
  readonly streaming = input<boolean>(false);
  readonly scrollToBottom = output<void>();

  scrollToBottomClicked(): void {
    this.scrollToBottom.emit();
  }
}

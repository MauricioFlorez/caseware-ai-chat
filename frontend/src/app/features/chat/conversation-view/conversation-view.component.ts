import {
  Component,
  input,
  output,
  viewChild,
  ElementRef,
  effect,
  inject,
  Injector,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MessageComponent } from '../message/message.component';
import { ErrorPanelComponent } from '../error-panel/error-panel.component';
import type { Message } from '../message/message.model';

/** Threshold in px from bottom to consider "at bottom" for auto-scroll resume (FR-016a). */
const NEAR_BOTTOM_THRESHOLD = 20;

@Component({
  selector: 'app-conversation-view',
  standalone: true,
  imports: [CommonModule, MessageComponent, ErrorPanelComponent],
  templateUrl: './conversation-view.component.html',
  styleUrl: './conversation-view.component.scss',
})
export class ConversationViewComponent {
  readonly messages = input.required<Message[]>();
  readonly errorPanel = input<{ userMessageId: string; message: string } | null>(null);
  readonly retryDisabled = input<boolean>(false);
  readonly streaming = input<boolean>(false);
  /** When true, user has scrolled up; auto-scroll is paused (FR-016a manual scroll interruption). */
  readonly isScrolledUp = input<boolean>(false);
  /** Optional: shell's scroll container (main). When set, scroll ops use this instead of inner div. */
  readonly scrollContainer = input<ElementRef<HTMLElement> | undefined>(undefined);

  readonly retry = output<void>();
  readonly scrollStateChange = output<boolean>(); // isScrolledUp

  private readonly scrollContainerRef = viewChild<ElementRef<HTMLDivElement>>('scrollContainer');
  private readonly injector = inject(Injector);

  constructor() {
    effect(
      () => {
        const streaming = this.streaming();
        const scrolledUp = this.isScrolledUp();
        this.messages(); // track messages so we react to new content
        if (streaming && !scrolledUp) {
          setTimeout(() => this.scrollToBottom(), 0);
        }
      },
      { injector: this.injector }
    );
  }

  onScroll(el: EventTarget | null): void {
    const div = el as HTMLDivElement | null;
    if (!div) return;
    const { scrollTop, scrollHeight, clientHeight } = div;
    const isScrolledUp = scrollTop + clientHeight < scrollHeight - NEAR_BOTTOM_THRESHOLD;
    this.scrollStateChange.emit(isScrolledUp);
  }

  private getScrollContainer(): HTMLElement | null {
    const external = this.scrollContainer()?.nativeElement;
    if (external) return external;
    return this.scrollContainerRef()?.nativeElement ?? null;
  }

  /** Scroll to bottom with animation (FR-016a). Used for auto-scroll and on stream completion. */
  scrollToBottom(): void {
    const el = this.getScrollContainer();
    if (el) {
      el.scrollTo({
        top: el.scrollHeight - el.clientHeight,
        behavior: 'smooth',
      });
    }
  }

  /**
   * Anchor the top of the message with the given id to the top of the scroll area (spec: on message send).
   */
  scrollToMessageTop(messageId: string): void {
    const container = this.getScrollContainer();
    if (!container) return;
    const messageEl = container.querySelector(
      `app-message[data-message-id="${messageId}"]`
    ) as HTMLElement | null;
    if (!messageEl) return;
    const containerRect = container.getBoundingClientRect();
    const msgRect = messageEl.getBoundingClientRect();
    container.scrollTop += msgRect.top - containerRect.top;
  }
}

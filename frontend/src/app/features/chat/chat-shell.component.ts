import {
  Component,
  inject,
  signal,
  computed,
  viewChild,
  ElementRef,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { type Subscription } from 'rxjs';
import { ChatHeaderComponent } from './header/chat-header.component';
import { ConversationViewComponent } from './conversation-view/conversation-view.component';
import { ChatComposerComponent } from './composer/chat-composer.component';
import { ScrollAnchorComponent } from './scroll-anchor/scroll-anchor.component';
import { ConnectionStateService } from '../../core/connection-state.service';
import { MockStreamService } from '../../core/mock-stream.service';
import type { Message } from './message/message.model';

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/** Threshold in px from bottom to consider "at bottom" for auto-scroll resume (FR-016a). */
const NEAR_BOTTOM_THRESHOLD = 20;

@Component({
  selector: 'app-chat-shell',
  standalone: true,
  imports: [CommonModule, ChatHeaderComponent, ConversationViewComponent, ChatComposerComponent, ScrollAnchorComponent],
  templateUrl: './chat-shell.component.html',
  styleUrl: './chat-shell.component.scss',
})
export class ChatShellComponent implements OnDestroy {
  readonly connection = inject(ConnectionStateService);
  private readonly stream = inject(MockStreamService);
  private readonly composerRef = viewChild(ChatComposerComponent);
  private readonly conversationViewRef = viewChild(ConversationViewComponent);
  readonly conversationMainRef = viewChild<ElementRef<HTMLElement>>('mainRef');

  /** Single active subscription per FR-022; unsubscribe before starting a new send. */
  private streamSubscription: Subscription | null = null;

  readonly messages = signal<Message[]>([]);
  /** Error panel below this user message id; null = no panel or show in header when no messages */
  readonly errorPanel = signal<{ userMessageId: string; message: string } | null>(null);
  readonly retryDisabled = signal(false);
  readonly lastSentTextForRetry = signal('');
  readonly globalError = signal<string | null>(null);
  readonly isScrolledUp = signal(false);

  readonly showAnchor = computed(() => {
    if (!this.isScrolledUp()) return false;
    const list = this.messages();
    const streaming = this.connection.activeStream();
    const last = list[list.length - 1];
    return streaming || (last?.role === 'agent');
  });

  /** Scroll state from main (the actual scroll container). FR-016a. */
  onMainScroll(el: EventTarget | null): void {
    const main = el as HTMLElement | null;
    if (!main) return;
    const { scrollTop, scrollHeight, clientHeight } = main;
    this.isScrolledUp.set(
      scrollTop + clientHeight < scrollHeight - NEAR_BOTTOM_THRESHOLD
    );
  }

  /** Scroll main to bottom (stream completion, anchor). */
  scrollToBottom(): void {
    const main = this.conversationMainRef()?.nativeElement;
    if (main) {
      main.scrollTo({
        top: main.scrollHeight - main.clientHeight,
        behavior: 'smooth',
      });
    }
  }

  /** Anchor new user message top at top of main. FR-016a on send. */
  scrollToMessageTop(messageId: string): void {
    const main = this.conversationMainRef()?.nativeElement;
    if (!main) return;
    const messageEl = main.querySelector(
      `app-message[data-message-id="${messageId}"]`
    ) as HTMLElement | null;
    if (!messageEl) return;
    const mainRect = main.getBoundingClientRect();
    const msgRect = messageEl.getBoundingClientRect();
    main.scrollTop += msgRect.top - mainRect.top;
  }

  onSendMessage(text: string): void {
    if (this.connection.activeStream()) return;
    const trimmed = text.trim();
    if (!trimmed) return;

    this.unsubscribeStream();
    this.lastSentTextForRetry.set(trimmed);
    this.errorPanel.set(null);
    this.globalError.set(null);

    const userMessage: Message = {
      id: generateId(),
      role: 'user',
      content: trimmed,
    };
    const agentMessage: Message = {
      id: generateId(),
      role: 'agent',
      content: '',
      streamState: 'in_progress',
    };

    this.messages.update((list) => [...list, userMessage, agentMessage]);
    setTimeout(() => this.scrollToBottom(), 0);

    const sub = this.stream.events.subscribe((event) => {
      this.messages.update((list) => {
        const copy = [...list];
        const last = copy[copy.length - 1];
        if (last?.role !== 'agent') return list;
        switch (event.type) {
          case 'delta':
            copy[copy.length - 1] = { ...last, content: last.content + event.text };
            break;
          case 'done':
            copy[copy.length - 1] = { ...last, streamState: 'done' };
            this.errorPanel.set(null);
            this.retryDisabled.set(false);
            this.composerRef()?.setStreamEnded();
            setTimeout(() => this.scrollToBottom(), 0);
            break;
          case 'error':
            copy[copy.length - 1] = {
              ...last,
              streamState: 'error',
              errorInfo: event.message,
            };
            const userMsg = copy[copy.length - 2];
            if (userMsg?.role === 'user') {
              this.errorPanel.set({ userMessageId: userMsg.id, message: event.message });
            }
            this.retryDisabled.set(false);
            this.composerRef()?.setStreamEnded();
            setTimeout(() => this.scrollToBottom(), 0);
            break;
        }
        return copy;
      });
    });

    this.streamSubscription = sub;
    sub.add(() => {
      if (this.streamSubscription === sub) this.streamSubscription = null;
    });
    const timeout = setTimeout(() => sub.unsubscribe(), 30_000);
    sub.add(() => clearTimeout(timeout));

    this.stream.send(trimmed);
  }

  private unsubscribeStream(): void {
    if (this.streamSubscription) {
      this.streamSubscription.unsubscribe();
      this.streamSubscription = null;
    }
  }

  onStopStream(): void {
    this.stream.cancel();
  }

  onRetry(): void {
    if (this.retryDisabled()) return;
    this.retryDisabled.set(true);
    this.errorPanel.set(null);
    const text = this.lastSentTextForRetry();
    if (text) this.onSendMessage(text);
  }

  onMockPreset(presetId: string): void {
    if (this.connection.activeStream()) return;
    this.unsubscribeStream();
    const userMessage: Message = {
      id: generateId(),
      role: 'user',
      content: '[Mock response requested]',
    };
    const agentMessage: Message = {
      id: generateId(),
      role: 'agent',
      content: '',
      streamState: 'in_progress',
    };
    this.messages.update((list) => [...list, userMessage, agentMessage]);
    setTimeout(() => this.scrollToBottom(), 0);

    const sub = this.stream.events.subscribe((event) => {
      this.messages.update((list) => {
        const copy = [...list];
        const last = copy[copy.length - 1];
        if (last?.role !== 'agent') return list;
        switch (event.type) {
          case 'delta':
            copy[copy.length - 1] = { ...last, content: last.content + event.text };
            break;
          case 'done':
            copy[copy.length - 1] = { ...last, streamState: 'done' };
            this.composerRef()?.setStreamEnded();
            setTimeout(() => this.scrollToBottom(), 0);
            break;
          case 'error':
            copy[copy.length - 1] = {
              ...last,
              streamState: 'error',
              errorInfo: event.message,
            };
            this.composerRef()?.setStreamEnded();
            setTimeout(() => this.scrollToBottom(), 0);
            break;
        }
        return copy;
      });
    });

    this.streamSubscription = sub;
    sub.add(() => {
      if (this.streamSubscription === sub) this.streamSubscription = null;
    });
    const timeout = setTimeout(() => sub.unsubscribe(), 30_000);
    sub.add(() => clearTimeout(timeout));

    this.stream.send('', presetId);
  }

  ngOnDestroy(): void {
    this.unsubscribeStream();
  }
}

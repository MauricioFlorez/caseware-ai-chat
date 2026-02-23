# Scroll behavior fix – report and solution

**Feature:** 001-chat-ui-streaming  
**Date:** 2026-02-22  
**Status:** Resolved

## Problem summary

The conversation panel scroll did not work: no visible scrolling on send, on stream completion, or during streaming. The UI did not follow the spec (anchor/last-message visible, auto-scroll while streaming).

## Root causes

### 1. Wrong scroll target (initial implementation)

- **Spec intent:** The element that scrolls (has the scrollbar) is the shell’s conversation container (viewport-sized area between header and footer).
- **What happened:** Scroll logic lived in `ConversationViewComponent` and targeted an **inner** div (`.conversation-view` with `#scrollContainer`). That div had `min-height` and `overflow-y: auto` but **no max height**; it grew with content, so it never became a scroll viewport. Setting its `scrollTop` had no visible effect.
- **Evidence:** User reported scroll container as `app-root > app-chat-shell > div.chat-shell > main.chat-shell__conversation` — i.e. the **main** element, not the inner div.

### 2. Layout not constraining the main (no overflow)

- **Issue:** Even after moving scroll logic to the shell and scrolling the **main** element, scroll still had no effect.
- **Cause:**  
  - `.chat-shell` had only `min-height: 100vh`, so the shell could grow with content; the main grew with it.  
  - The main (flex child with `flex: 1`) has an implicit `min-height: auto`, so it would not shrink below its content. So the main was always at least as tall as the conversation and never overflowed — no scrollbar, no scroll.
- **Result:** `main.scrollHeight === main.clientHeight`, so `scrollToBottom()` did nothing visible.

## Solution implemented

### A. Single scroll container = shell’s main

- **Shell:** Added template ref `#mainRef` on `<main class="chat-shell__conversation">` and scroll handler `(scroll)="onMainScroll($event.target)"`.
- **Shell:** Implemented `scrollToBottom()` and `scrollToMessageTop(messageId)` to operate on `conversationMainRef().nativeElement` (the main).
- **Shell:** On send and mock preset: call `setTimeout(() => this.scrollToBottom(), 0)` so the new user + agent messages are in view (avoids DOM lookup / timing issues).
- **Shell:** On stream done/error: call `scrollToBottom()` so the last message is visible.
- **Conversation view:** Added optional input `scrollContainer: ElementRef<HTMLElement> | undefined`. When set (shell passes main ref), `scrollToBottom()` and scroll state use that container for auto-scroll during streaming.
- **Conversation view:** Removed `(scroll)` from the inner div; scroll state is driven by the shell from the main’s scroll.
- **Conversation view:** Removed `overflow-y: auto` from `.conversation-view` so only the main scrolls.

### B. Constrain shell and main so the main can scroll

- **`.chat-shell`:** Set `height: 100vh` and `overflow: hidden` so the shell is fixed to the viewport and does not grow; only the main scrolls.
- **`.chat-shell__conversation`:** Set `min-height: 0` so the flex child can shrink to the space between header and footer. The main then has a bounded height; when content is taller, it overflows and scrolls.

### C. Anchor-to-top (optional, timing-sensitive)

- **Attempted:** On send, anchor the new user message’s top at the top of the scroll area (per diagram/spec). Implemented via `scrollToMessageTop(userMessage.id)` using `getBoundingClientRect()`.
- **Issue:** The new message is not in the DOM at the moment we update the list and call scroll; `querySelector` often returned null. Using `afterNextRender` caused the stream to hang “In Progress”; using `setTimeout(..., 50)` was fragile.
- **Current choice:** On send we use **scroll to bottom** so the new user + agent messages are visible, with no DOM lookup. Anchor-to-top can be reintroduced later (e.g. with a robust “after view updated” hook or by scrolling to bottom first and then adjusting to anchor in a second pass).

## Files changed

| File | Change |
|------|--------|
| `frontend/src/app/features/chat/chat-shell.component.ts` | Main ref, `onMainScroll`, `scrollToBottom()`, `scrollToMessageTop()`, pass main to conversation-view; on send/mock/done/error call shell’s scroll. |
| `frontend/src/app/features/chat/chat-shell.component.html` | `#mainRef`, `(scroll)="onMainScroll($event.target)"`, `[scrollContainer]="conversationMainRef()"`. |
| `frontend/src/app/features/chat/chat-shell.component.scss` | `.chat-shell`: `height: 100vh`, `overflow: hidden`. `.chat-shell__conversation`: `min-height: 0`. |
| `frontend/src/app/features/chat/conversation-view/conversation-view.component.ts` | Optional `scrollContainer` input; `getScrollContainer()`; use it in `scrollToBottom()` / scroll logic; removed inner scroll binding for state. |
| `frontend/src/app/features/chat/conversation-view/conversation-view.component.html` | Removed `(scroll)="onScroll(...)"` from inner div. |
| `frontend/src/app/features/chat/conversation-view/conversation-view.component.scss` | Removed `overflow-y: auto` from `.conversation-view`. |
| `frontend/src/app/features/chat/message/message.component.ts` | Host binding `[attr.data-message-id]="id()"` for future anchor-to-top / DOM lookup. |

## Validation

- Scroll bar appears when conversation height exceeds viewport.
- On send (or mock preset), panel scrolls so the new user message and agent placeholder are visible (scroll to bottom).
- On stream completion (done/error), panel scrolls so the last message is visible.
- Auto-scroll during streaming works when the user is at the bottom (conversation-view effect uses passed main ref).
- Manual scroll up stops auto-scroll; scrolling back to bottom resumes it (scroll state from main).
- Stop button does not change scroll position.

## Phase 2a completed

- **Spec updated:** `spec.md` now includes an *Implementation note – scroll container* under Scroll terminology, stating that the scroll area MUST be the shell’s conversation container (e.g. main with flex + overflow-y: auto), with layout constraints (shell height/overflow, main min-height: 0), and a reference to this report.
- **Code reverted:** The scroll fix was reverted (shell and conversation-view restored to pre-fix state). Scroll behavior is no longer working in the UI; the spec and this report are the single source of truth for re-implementing the fix.

## Re-implementation (post Phase 2a)

- The scroll fix was re-implemented from the spec and this report so the UI again matches FR-016a and the Implementation note – scroll container. Shell main is the scroll container; layout constrains shell and main; scroll-to-bottom on send/mock/done/error; auto-scroll and scroll state from main. Quality gate: `ng build` and `ng test` pass.

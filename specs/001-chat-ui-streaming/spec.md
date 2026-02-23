# Feature Specification: Chat UI with streamed agent responses

**Feature Branch**: `001-chat-ui-streaming`  
**Created**: 2026-02-22  
**Status**: Draft  
**Input**: User description: "I want to implement the UI/UX for chat interface that will stream responses from a backend agent." Boost: support real SSE backend integration while keeping the mock data layer. The user interface MUST enable selection of live data mode (real SSE) or mock data.

## Clarifications

### Session 2026-02-22

- Q: When the user tries to send a new message while a stream is already in progress, what should happen? → A: Disable Send (or make it a no-op) while streaming; user must Stop first or wait until Done. Composer remains editable.
- Q: If the connection is lost before any agent response is received, where should the error panel appear? → A: Below the last user message that was sent (the one that did not receive a response).
- Q: When the user presses Retry repeatedly in quick succession, what should happen? → A: Disable Retry after first click until the connection state changes, then re-enable.
- Q: Should the chat UI have any explicit accessibility requirement in this spec? → A: One high-level requirement: chat UI must be keyboard-operable and screen-reader understandable (focus, labels, live updates); details in plan.
- Q: Is the conversation in-memory only or should the spec assume any persistence? → A: In-memory only: conversation is lost on refresh or new session; no persistence in this feature.
- Q: What happens when the mocked response option is used while disconnected? → A: Allow mock selection while disconnected; emit the mocked stream anyway (mock does not require connection).
- Q: Should Stop be triggerable by keyboard for accessibility (SC-006), or stay mouse/touch only? → A: Allow Stop via keyboard (e.g. Escape or a stated shortcut) so keyboard users can stop a stream; Enter during stream remains no-op.
- Q: Should the scroll-to-bottom anchor be activatable via keyboard? → A: Yes: anchor MUST be focusable and keyboard-activatable (e.g. Enter/Space) so "scroll to latest" is achievable by keyboard.
- Q: Should the spec define a maximum length for a single user message? → A: No: do not specify a limit in this feature; implementation may choose a reasonable default or defer to backend.
- Q: Should the stream-subscription behavior (unsubscribe previous when starting a new send) also be stated as a testable Functional Requirement? → A: Yes: add a testable FR in addition to the assumption.
- Q: How should the conversation panel scroll behave during and after streaming? → A: Auto-scroll (animated) while streaming when the user is at the bottom; on stream completion (Done), animate scroll so the last message is visible; if the user scrolls up during a stream, auto-scroll stops (content keeps updating); if the user scrolls back to bottom, auto-scroll resumes; on message send, animate scroll so the last user message is visible; Stop does not change scroll position.
- Q: On user send, how should the conversation panel scroll? → A: The viewport scrolls so that the newly sent user message is anchored with its top edge at the top of the scroll area (just below the header). Older messages move up and are clipped by the header (header acts as opaque mask). Scroll is triggered only by user sending (Enter or Send), not by incoming/streaming messages. Instant or short animation (e.g. max 200ms) acceptable.
- Q: Should the chat support both real SSE backend and mock data, with user-selectable mode? → A: Yes. Keep mock data layer; add real SSE backend integration. The user interface MUST enable the user to select live data mode (real SSE) or mock data.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View connection status and streamed conversation (Priority: P1)

As a user, I can see at all times whether I am connected to the agent backend, and I see my messages and the agent’s responses in a clear conversation view. Agent responses appear progressively as they are streamed.

**Why this priority**: Core value is a reliable, visible connection and a readable streamed conversation.

**Independent Test**: Can be fully tested by opening the chat, checking the header for connection state (disconnected / retrying / connected), sending a message, and verifying that the agent’s reply appears incrementally in the conversation view.

**Acceptance Scenarios**:

1. **Given** the chat is open, **When** the user looks at the header, **Then** the current connection mode (disconnected, retrying, or connected) is always visible.
2. **Given** the user is connected, **When** the user sends a message, **Then** the agent’s response appears in the conversation and updates progressively as stream events arrive (partial then final), and the panel auto-scrolls to follow the new content when the user is at the bottom.
3. **Given** the conversation has more messages than the viewport, **When** the user scrolls, **Then** a vertical scroll is available and scroll behavior follows the Conversation panel scroll behavior (on send, the new user message is anchored at the top of the scroll area; during streaming, auto-scroll when at bottom).
4. **Given** the user is viewing the chat, **When** connection status changes, **Then** the header reflects the new status (disconnected, retrying, or connected) in real time.

---

### User Story 2 - Compose and send messages with clear send/stop control (Priority: P1)

As a user, I can type in a fixed-height composer, send a message, and stop an in-flight request. After stopping, I can edit and send again or retry.

**Why this priority**: Composing and controlling send/stop is essential for a usable chat.

**Independent Test**: Can be fully tested by typing in the composer, sending a message, pressing stop during a stream, and then sending a new message or retrying from the UI.

**Acceptance Scenarios**:

1. **Given** the chat is open, **When** the user types in the composer, **Then** the text area shows about three lines of text and then scrolls internally (not resizable).
2. **Given** the user has typed a message, **When** the user presses Send, **Then** the text area is cleared immediately, the button changes to Stop, and the message is sent.
3. **Given** a request is in progress, **When** the user triggers Stop (via mouse, touch, or keyboard e.g. Escape), **Then** the stream is cancelled, the last user-typed message is restored in the text area, and the button returns to Send. The message MUST only reappear in the text area when Stop is used — not when the stream completes normally. The conversation panel scroll position MUST NOT change when the user triggers Stop.
4. **Given** the user has stopped a request, **When** the user chooses to retry from the UI, **Then** the same (or edited) message can be sent again and the conversation continues.

---

### User Story 3 - Recover from mid-stream disconnection (Priority: P2)

As a user, if the streaming connection drops while the agent is responding, I see a clear error state and can retry without losing context.

**Why this priority**: Ensures the experience degrades gracefully and the user can recover.

**Independent Test**: Can be fully tested by simulating a disconnect during a stream and verifying that an error panel with a Retry control appears and that retry sends the request again; and by simulating retriable failures and verifying automatic retry (up to 3 retries, 2s delay) before the error panel appears.

**Acceptance Scenarios**:

1. **Given** the agent is streaming a response, **When** the connection is lost mid-stream, **Then** an error information panel appears below the last user message that was sent (the one that did not receive or complete a response) with a Retry button.
2. **Given** the error panel is visible, **When** the user presses Retry, **Then** a new request is sent (or the same request is retried) and the UI returns to a normal streaming or connected state.
3. **Given** the error panel is visible after the user has already pressed Retry up to 2 times (and each attempt failed), **When** the user would press Retry again, **Then** the Retry button is no longer shown; the panel shows the message "We are experiencing issues, try in some minutes." (or equivalent). The user can send a new message later to try again.
4. **Given** the chat is active, **When** the user has only one active streaming connection, **Then** at most one such connection exists at a time to avoid race or dependency issues.
5. **Given** a send fails with a retriable error (e.g. network failure, 5xx), **When** the system has retries remaining, **Then** the system automatically retries the same request after a 2 second delay without showing the error panel; the connection mode remains "retrying" during the delay.
6. **Given** a send has failed and been automatically retried 3 times (4 attempts in total) with 2 seconds between each attempt, **When** the last attempt fails, **Then** the system shows the error information panel below the last user message with a Retry button (as in scenario 1). The system MUST NOT automatically retry on non-retriable errors (e.g. 4xx) or when the user has cancelled (Stop).

---

### User Story 4 - Navigate long conversations and return to latest (Priority: P2)

As a user, when I send a message, the new message is anchored just below the header and older messages are clipped above. When I scroll up in a long conversation, the panel stops auto-scrolling; I can use the bottom anchor to return to the latest content and, if a stream is active, resume auto-scroll.

**Why this priority**: Improves usability for long threads and ensures the sent message is prominently visible (anchored to top).

**Independent Test**: Can be fully tested by sending a message and verifying the new user message is at the top of the scroll area (just below the header) with older messages clipped above; scroll up, send again, verify same anchoring; when scrolled up, use the anchor to scroll to bottom and, if streaming, verify auto-scroll resumes.

**Acceptance Scenarios**:

1. **Given** the conversation is open, **When** the user sends a message (Enter or Send), **Then** the conversation panel scrolls so that the top edge of the newly sent user message is aligned with the top of the scroll area (just below the header), and any content above is clipped by the header. A centered anchor indicator MAY appear at the bottom of the viewport when the user has scrolled up (to allow returning to bottom).
2. **Given** the anchor is visible, **When** the agent is still streaming, **Then** the anchor shows a loading indicator; when streaming is done, **Then** it shows a downward arrow (or equivalent). If the user activates the anchor while streaming, **Then** the view scrolls to the bottom and auto-scroll resumes for the rest of the stream.
3. **Given** the anchor shows the downward arrow (or loading), **When** the user clicks or activates it (e.g. Enter/Space when focused), **Then** the view scrolls with animation to the bottom of the conversation so the latest message is visible, and if a stream is still active, auto-scroll resumes.

---

### User Story 5 - Differentiate user and agent messages and streaming state (Priority: P2)

As a user, I can clearly tell which messages are mine and which are the agent’s, and I can see when the agent’s reply is still in progress or finished.

**Why this priority**: Reduces confusion and sets expectations during streaming.

**Independent Test**: Can be fully tested by sending messages and observing role differentiation and streaming state (in progress / done / error).

**Acceptance Scenarios**:

1. **Given** the conversation view, **When** messages are displayed, **Then** user and agent messages are clearly differentiated by role (e.g. layout or position).
2. **Given** agent messages, **When** they are rendered, **Then** they are not inside a colored or boxed container (per design preference).
3. **Given** the agent is responding, **When** stream events are being processed, **Then** a live status reflects: In Progress (e.g. loader while rendering), Done, or Error.

---

### User Story 6 - Use mocked response for development/demo (Priority: P3)

As a user or tester, I can trigger a mocked agent response from the header to exercise the UI without a real backend.

**Why this priority**: Supports development and demos; not required for production user value.

**Independent Test**: Can be fully tested by selecting a mocked response from the header dropdown and verifying that the conversation shows the mocked streamed response.

**Acceptance Scenarios**:

1. **Given** the chat is open, **When** the user opens the header dropdown, **Then** they can select an option to emit a mocked response.
2. **Given** a mocked response is selected, **When** it is triggered, **Then** the conversation view shows the mocked response in the same streaming and layout behavior as a real agent message.

---

### User Story 7 - Select live or mock data source (Priority: P2)

As a user or tester, I can choose whether the chat uses the live backend (real SSE) or mock data so I can use the app with or without a real backend.

**Why this priority**: Enables development and demos with mock while supporting production use with real SSE; status awareness (idle, streaming, cancelled, error, disconnected) applies in both modes.

**Independent Test**: Select live mode and send a message (with backend available); select mock mode and send or use mock dropdown; verify stream and failure behavior in both modes.

**Acceptance Scenarios**:

1. **Given** the chat is open, **When** the user looks at the UI, **Then** a control is visible to select the data source: live (real SSE backend) or mock.
2. **Given** live mode is selected and the backend is available, **When** the user sends a message, **Then** the stream is delivered via real SSE and the UI reflects connection and stream state (idle, streaming, cancelled, error, disconnected) accordingly.
3. **Given** mock mode is selected, **When** the user sends a message or selects a mock preset from the header, **Then** the conversation uses mock data and the same streaming and status behavior applies.

---

### Keyboard & input behavior

- **Enter**: Sends the message only if the text area has content (trimmed). If the text area is empty, Enter MUST have no effect.
- **Shift + Enter**: Inserts a new line in the text area and MUST NOT send the message.
- **Enter during stream**: While a stream is in progress, pressing Enter MUST have no effect (no send, no other action), so that users can type new lines with Enter without accidentally cancelling.
- **Stop**: The Stop action MUST be triggerable by mouse click, touch, or keyboard (e.g. Escape). Enter MUST NOT trigger Stop. The Stop control MUST be focusable and keyboard-activatable so that keyboard and assistive-technology users can stop a stream (per SC-006).

### Edge Cases

- When the user sends a message while already streaming: Send is disabled (or no-op) while a stream is in progress; the user must press Stop or wait until the stream is Done before sending again. Composer stays editable.
- When the user scrolls up during an active stream: auto-scroll MUST stop immediately (see Conversation panel scroll behavior). Streamed content continues to append to the agent message; the view remains at the user’s scroll position. When the user scrolls back to the bottom (or near it), auto-scroll MUST resume. The conversation view MUST remain scrollable and stable (no crash or scroll jump).
- When the user cancels the stream via the Stop button: the conversation panel scroll position MUST NOT change; only the composer state (restore last message, button back to Send) and stream cancellation apply.
- When Retry is pressed repeatedly: the Retry control is disabled after the first click until the connection state changes (e.g. connected or still disconnected/error); then it is re-enabled so the user can retry again if needed. The user-initiated Retry action is limited to 2 interactions: the first failure shows the error and a Retry button; after the first Retry click, if the request fails again, the error and Retry are shown again; after the second Retry click, if the request fails again, the panel shows "We are experiencing issues, try in some minutes." (or equivalent) and the Retry button is no longer shown. The user can send a new message later to try again.
- When the connection is lost before any response: the error panel appears below the last user message that was sent. If there are no user messages yet (e.g. connection lost on load), the system SHOULD show an error state in the header or a minimal banner; Retry re-establishes connection for the next send.
- When the user selects a mocked response while disconnected: the mock dropdown remains available and selecting an option MUST emit the mocked stream anyway (mock does not require a real connection; for development/demo).
- When the user sends a message: the scroll area scrolls so the new user message is anchored at the top of the scroll area (just below the header). If the user had manually scrolled, this send overrides their scroll position and re-anchors to the new message. Each send re-anchors to that send’s message.

- When the backend or proxy reports a process timeout: treat as an error; the stream MUST end cleanly and the UI MUST show an error state (same as other backend errors).
- **Automatic reconnect/backoff**: When a send fails with a retriable error (network failure, 5xx, 503, 429), the system MUST automatically retry the same request up to 3 times (4 attempts in total), with a fixed 2 second delay between attempts. During the delay, connection mode remains "retrying"; the error panel MUST NOT be shown until all retries are exhausted. On non-retriable errors (e.g. 4xx) or when the user cancels (Stop/Abort), the system MUST NOT automatically retry and MUST show the error panel immediately (or restore composer on cancel).

### Scroll terminology

- **Anchor point**: The position at the top of the scroll area, immediately below the bottom edge of the header. When the user sends a message, the scroll target is to align the top edge of the new user message with this point.
- **Header as mask**: The header is fixed or sticky and MUST have an opaque background. Content that scrolls above the anchor point is visually clipped by the header; no separate overlay is required.
- **Scroll area**: The scrollable container below the header that holds the message list. Messages are in top-to-bottom order (oldest at top, newest at bottom); no inverted layout (e.g. no flex-direction: column-reverse).
- **Implementation note – scroll container**: The element that actually scrolls (has the scrollbar) MUST be the **shell’s conversation container** (e.g. the `main` or the element with `flex: 1` and `overflow-y: auto` between header and footer). The message list lives inside this container (e.g. inside a child component). All scroll operations (anchor-to-top on send, scroll-to-bottom on completion, auto-scroll while streaming) and scroll-state detection (e.g. “at bottom” for auto-scroll and anchor visibility) MUST target this single scroll container, not an inner wrapper that merely grows with content. Layout MUST constrain the shell (e.g. `height: 100vh`, `overflow: hidden`) and the conversation container (e.g. `min-height: 0` so the flex child can shrink and overflow), so that the conversation container has a bounded height and its content can scroll. See [scroll-fix-report.md](scroll-fix-report.md) for the problem analysis and solution.

### Conversation panel scroll behavior

The following rules apply to the scrollable area that contains the message list (and the scroll-to-bottom anchor when visible). The header MUST be fixed or sticky and MUST have an opaque background so it acts as a clipping mask for content that scrolls above the anchor point.

1. **On message send (primary)**: When the user sends a message (Send button or Enter), the system MUST scroll the conversation panel so that the **newly sent user message** is anchored with its **top edge at the top of the scroll area** (anchor point, immediately below the header). The viewport effectively moves up; all messages above the new message are hidden behind the header (clipped by the header). This scroll is triggered only by the user send action—not by incoming messages, stream completion, or page load. The scroll MAY be instant or a short animation (e.g. max 200ms). The message list remains in normal top-to-bottom order (oldest at top, newest at bottom).
2. **Auto-scroll while streaming**: While a stream is active and the user has not manually scrolled up (view is at or near the bottom), the panel MUST auto-scroll so that incoming streamed content stays in view.
3. **On stream completion**: When a stream ends naturally (Done), the system MUST animate the panel scroll so that the last message (the completed agent message) is visible on screen.
4. **Manual scroll interruption**: If the user scrolls up during an active stream, auto-scroll MUST stop immediately. Content continues to be appended to the agent message, but the scroll position MUST NOT change until the user scrolls again or auto-scroll resumes.
5. **Auto-scroll resume**: If the user scrolls back to the bottom (or within a small threshold of the bottom) during an active stream, auto-scroll MUST resume so that incoming content stays in view.
6. **Stop button**: When the user cancels the stream via the Stop button, the conversation panel scroll position MUST NOT change.

## Assumptions

- Only one active streaming connection (request) at a time; no concurrent streams.
- Unsubscribe the previous subscription when starting a new send.
- “Connection mode” is exactly: disconnected, retrying, connected.
- Agent messages are displayed without a colored/boxed container by design.
- Composer text area is fixed at approximately three lines with internal scroll; not user-resizable.
- **Text area on send**: When the user sends a message, the text area is cleared immediately. The sent message is stored as "last user-typed message" for restore. The message reappears in the text area only when the user hits Stop (cancel stream), not when the stream completes normally (Done).
- Send/Stop is a single stateful control: Send becomes Stop while a request is in progress; Stop restores the last typed message and resets to Send. Stop is triggerable by mouse, touch, or keyboard (e.g. Escape); Enter does not trigger Stop.
- **Keyboard**: Enter sends only if there is content; Shift+Enter inserts a new line; Enter during stream has no effect. Escape (or stated shortcut) triggers Stop when a stream is in progress.
- Mocked response is for development/demo; behavior matches real streaming for UI purposes.
- Conversation is in-memory only: it is lost on page refresh or new session; no persistence is required in this feature.
- No maximum length for a single user message is specified in this feature; the implementation may enforce a reasonable default or defer to the backend when integrated.
- When the conversation has no messages yet, the conversation view MUST show a centered welcome message: "I'm here to help you!!"
- **On user send (scroll)**: The panel scrolls so the new user message is anchored at the top of the scroll area (just below the header); the header is opaque and clips content above. Trigger is user send only (Enter or Send).
- **Streaming and Stop (scroll)**: Auto-scroll during streaming when at bottom; scroll on stream completion so last message visible; manual scroll up stops auto-scroll, scroll to bottom resumes; Stop does not change scroll position.
- **Data source**: The UI supports two data sources—live (real SSE backend) and mock. The user can select the active source via a visible control (e.g. header or settings). Connection and stream state (idle, streaming, cancelled, error, disconnected) are reflected in both modes.
- **Process timeout**: A process timeout (backend or proxy) is treated as an error: stream ends cleanly, UI shows error state.
- **Reconnect/backoff**: Automatic retry applies only to the live SSE data source. Retriable failures are: network failure (fetch rejection), 5xx server errors, 503, 429. Non-retriable: 4xx (except 429), server-sent `error` event (stream already ended), and user cancel (AbortError). Max 3 retries (4 attempts total); fixed 2 second delay between attempts. After retries are exhausted, behavior is as FR-004 (error panel + Retry button). Mock data source does not perform automatic retry.
- **Testing harness**: A lightweight harness MAY be provided to trigger stream completed, cancelled, and errored outcomes without the full chat UI (e.g. for automated or manual testing).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST display the real connection status at all times (disconnected, retrying, or connected). For live mode, the default value for the mode badge MUST be "connected"; it applies even when the user has not yet interacted with the backend. The badge updates to "disconnected" or "retrying" only when a request has failed or the system is in a retry delay.
- **FR-002**: The header MUST be sticky (or fixed), display a connection status mode badge (disconnected, retrying, or connected), and MUST have an opaque background so it acts as a clipping mask for conversation content that scrolls above the anchor point.
- **FR-003**: The system MUST allow at most one active streaming connection at a time to prevent race or dependency issues.
- **FR-004**: If streaming disconnects (mid-response or before any response), the system MUST show an error information panel below the last user message that was sent (the one that did not receive or complete a response) with a Retry button. When there are no user messages yet (e.g. connection lost on load), the system MUST show minimal banner with a Retry control. User-initiated Retry is limited to 2 interactions: after 2 failed Retry attempts, the panel MUST show the message "We are experiencing issues, try in some minutes." (or equivalent) and MUST NOT show the Retry button; the user can send a new message later to try again.
- **FR-005**: The user MUST be able to cancel a previously sent message (stop an in-flight request).
- **FR-006**: After canceling, the user MUST be able to send a new message.
- **FR-007**: If the user cancels by mistake, the user MUST be able to retry from the UI (restore or resend and continue).
- **FR-008**: The footer MUST be sticky and contain a message composer with a text area and a send/stop button.
- **FR-009**: The composer text area MUST not be resizable and MUST show approximately three lines of text, then auto-scroll internally.
- **FR-010**: The send/stop button MUST be stateful and linear: pressing Send changes it to Stop; pressing Stop restores the last user-typed message to the text area and returns the button to Send. Stop MUST be triggerable by mouse click, touch, or keyboard (e.g. Escape). Enter MUST NOT trigger Stop (so users can type new lines during a stream). The Stop control MUST be focusable and keyboard-activatable for accessibility.
- **FR-010a**: When the user sends a message, the composer text area MUST be cleared immediately. The sent content MUST be stored as the "last user-typed message." That content MUST reappear in the text area only when the user triggers Stop (cancel stream), not when the stream completes normally (Done).
- **FR-010b**: Enter (without Shift) in the composer MUST send the message only if the text area has content (after trimming); if empty, Enter MUST have no effect. Shift+Enter MUST insert a new line and MUST NOT send. While a stream is in progress, Enter MUST have no effect (no send).
- **FR-011**: The header MUST include a dropdown to emit a mocked response (for development/demo). The mock dropdown MUST remain usable when connection is disconnected; selecting an option MUST emit the mocked stream without requiring a real connection.
- **FR-012**: Messages MUST be displayed with clearly differentiated roles: user and agent, no label is needed.
- **FR-013**: Agent messages MUST render progressively as stream events arrive (partial then final).
- **FR-014**: Agent messages MUST NOT be in a colored or boxed container.
- **FR-014a**: When the conversation has no messages yet, the conversation view MUST display a centered welcome message: "I'm here to help you!!"
- **FR-015**: If the conversation exceeds the viewport height, a vertical scroll MUST be present. Scroll behavior MUST follow the Conversation panel scroll behavior.
- **FR-016**: When the user has scrolled up, a centered anchor button MUST appear on top of the footer, floating in front of all content. The button displays a downward arrow icon. Clicking it — or pressing Enter/Space when focused — MUST smoothly scroll the conversation to the bottom, making the latest message visible; if a response is currently streaming, auto-scroll MUST also resume. The button MUST disappear once the user reaches the bottom. It MUST be keyboard-focusable and include an accessible label (e.g. `aria-label="Scroll to latest message"`).
- **FR-016a**: The conversation panel MUST follow the Conversation panel scroll behavior: on message send (Enter or Send), scroll so the newly sent user message’s top edge is at the top of the scroll area (anchor point below the header); header MUST be opaque and clip content above; auto-scroll while streaming when at bottom; on stream completion (Done), animate scroll so the last message is visible; if the user scrolls up during a stream, auto-scroll stops; if the user scrolls back to the bottom, auto-scroll resumes; when the user cancels via Stop, scroll position MUST NOT change.
- **FR-017**: The UI MUST process incoming stream events and display a live status indicator: In Progress (e.g. loader while rendering), Done, or Error.
- **FR-018**: While a stream is in progress, the Send action MUST be disabled or a no-op; the user MUST Stop or wait until Done before sending again. The composer text area remains editable.
- **FR-019**: After the user presses Retry, the Retry control MUST be disabled until the connection state changes (e.g. connected or a terminal error); then it MUST be re-enabled so the user can retry again if needed. After 2 user-initiated Retry attempts that both fail, the Retry button MUST no longer be shown and the panel MUST show "We are experiencing issues, try in some minutes." (or equivalent) per FR-004.
- **FR-020**: The chat UI MUST be keyboard-operable and screen-reader understandable (e.g. logical focus order, accessible labels for controls, and appropriate handling of live-updating content such as streamed messages). Detailed accessibility implementation is defined in the technical plan.
- **FR-021**: Conversation state MUST be in-memory only for this feature; it is lost on page refresh or new session. No persistence (e.g. local storage or server) is required.
- **FR-022**: The UI MUST ensure that stream events from a given send are applied only to the agent message created for that send. At most one active subscription MUST apply stream events to the conversation at a time (e.g. unsubscribe the previous subscription when starting a new send), so that each delta is applied exactly once to the corresponding agent message.
- **FR-023**: The UI MUST allow the user to select the data source: live (real SSE backend) or mock. The selection control MUST be visible in the user interface (e.g. in the header or a dedicated settings area). In live mode, the UI connects to the real backend and displays connection and stream state (idle, streaming, cancelled, error, disconnected); in mock mode, the same status behavior applies using mock data.
- **FR-024**: When the backend or proxy reports a process timeout, the system MUST treat it as an error: the stream MUST end cleanly and the UI MUST show an error state (same as for other backend errors).
- **FR-025**: When a send fails with a retriable error (network failure, 5xx, 503, 429), the system MUST automatically retry the same request up to 2 times (3 attempts in total), with a fixed 2 second delay between attempts. During retries, connection mode MUST remain "retrying" and the error panel MUST NOT be shown. After all retries are exhausted, the system MUST show the error panel and Retry button per FR-004. The system MUST NOT automatically retry on non-retriable errors (4xx except 429, server-sent error, or user cancel). This requirement applies to the live SSE data source only; mock source is unchanged.

### Key Entities

- **Connection**: Represents the link to the backend agent; has a mode (disconnected, retrying, connected). For live mode, the default mode is "connected", unitl a failure or retry is observed. Only one active streaming connection at a time.
- **Message**: A single entry in the conversation; has a stable id (for list keying and error panel association), role (user or agent), content, and optional streaming state (in progress, done, error). Agent messages may update incrementally.
- **Composer**: The input area in the footer; holds the current user text and the last user-typed message (restored only when the user hits Stop). On Send, the text area is cleared immediately and the sent text is stored as last user-typed message. Associated with Send/Stop control state. Enter sends (if content); Shift+Enter inserts new line; Stop is triggerable by mouse, touch, or keyboard (e.g. Escape); Enter does not trigger Stop.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can see connection status and whether the agent is responding within one glance at the header and conversation.
- **SC-002**: Users can send a message, stop an in-flight response, and send again or retry without leaving the screen.
- **SC-003**: When streaming disconnects mid-response, users see an error and can retry with one action (Retry button).
- **SC-004**: Users can scroll through long conversations; when they send a message, the new message is anchored just below the header and older messages are clipped above; the panel auto-scrolls during streaming when at the bottom; users can return to the latest message via the bottom anchor in one action when they have scrolled up.
- **SC-005**: User and agent messages are distinguishable and agent responses appear to stream in without requiring a page refresh.
- **SC-006**: Users relying on keyboard or assistive technology (e.g. screen readers) can complete the same primary actions: send a message, stop a stream, retry after error, and scroll to the latest message.

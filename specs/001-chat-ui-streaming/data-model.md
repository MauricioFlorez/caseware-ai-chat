# Data model: Chat UI (001-chat-ui-streaming)

**Feature**: 001-chat-ui-streaming  
**Scope**: In-memory only; no persistence.

## Entities

### Connection

Represents the link to the agent (real or mock). Single active streaming connection at a time.

| Attribute   | Type     | Description |
|------------|----------|-------------|
| mode       | enum     | `disconnected` \| `retrying` \| `connected` |
| activeStream | boolean | At most one active stream (request in flight) |

**State transitions**: disconnected → retrying → connected; connected → disconnected (on error or close). When a stream is active, `activeStream === true` until stream completes (done/error/cancel).

**Validation**: Only one active stream; Send is disabled when `activeStream` is true.

---

### Message

A single entry in the conversation. In-memory only; order preserved by list index or sequence.

| Attribute | Type   | Description |
|-----------|--------|-------------|
| id        | string | Stable id (e.g. UUID or client-generated) for list keying and error panel association |
| role      | enum   | `user` \| `agent` |
| content   | string | Plain text; for agent, may be appended incrementally while streaming |
| streamState | enum? | For agent only: `in_progress` \| `done` \| `error` (optional for user messages) |
| errorInfo | string? | When streamState is `error`, optional message for display |

**Relationships**: Messages are ordered in a list (conversation). The "last user message that did not receive or complete a response" is used for error panel placement (FR-004).

**Validation**: User messages have no streamState (or `done`). Agent messages may have streamState; content may update until streamState is `done` or `error`.

---

### Composer

The input area and Send/Stop control state. Not persisted.

| Attribute     | Type   | Description |
|---------------|--------|-------------|
| currentText   | string | Current text in the text area (editable) |
| lastSentText  | string | Last user-typed message sent (restored to currentText when user presses Stop) |
| sendStopState | enum   | `send` \| `stop` — button shows Send or Stop; when stream active, shows Stop |

**State transitions**: On Send: lastSentText ← currentText; sendStopState → stop. On Stop: currentText ← lastSentText; sendStopState → send. Composer remains editable while streaming (FR-018); Send action is disabled or no-op when stream is active.

---

## Conversation (aggregate)

Ordered list of `Message` entities. No persistence; cleared on refresh. Scroll and anchor behavior apply when list height exceeds viewport.

## Error panel (UI state)

Shown below the last user message that did not receive or complete a response. Holds: visible (boolean), retryDisabled (boolean, per FR-019 — disabled after first Retry click until connection state changes). Not a separate entity; derived from Message list and Connection state.

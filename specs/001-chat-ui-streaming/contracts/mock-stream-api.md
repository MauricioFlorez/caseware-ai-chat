# Contract: Mock stream API (frontend)

**Feature**: 001-chat-ui-streaming  
**Purpose**: Define the stream event shape the chat UI consumes. The mock service implements this; a future real backend (e.g. SSE) should emit events conforming to the same semantics so the UI can switch without change.

## Stream source interface (in-memory / mock)

The UI subscribes to a stream source that:

1. Accepts a **user message** (string) and **optional mock preset id** (for header dropdown).
2. Emits **events** until the stream is done or errored.
3. Allows **cancel** (e.g. when user presses Stop).

## Event types (contract)

Events are a discriminated union; the UI handles each type.

| Type    | Payload        | Meaning |
|---------|----------------|---------|
| `delta` | `{ text: string }` | Partial agent content; append to current agent message. |
| `done`  | (none or `{}`)  | Stream finished; set message streamState to `done`. |
| `error` | `{ message: string }` | Stream failed; set streamState to `error`, show error panel, optional retry. |

**Ordering**: Zero or more `delta` events, then exactly one of `done` or `error`. After `done` or `error`, no further events for that stream.

## Connection state (mock)

For the mock, connection mode can be fixed as `connected` or toggled for testing. The UI only cares that it receives one of: disconnected, retrying, connected (per spec).

## Usage

- **Mock implementation**: Service that, when "send" is invoked, pushes `delta` events (e.g. from a predefined string or preset), then `done` (or `error` for testing). Implements cancel by stopping further events.
- **Future backend**: Replace mock with an SSE/WebSocket client that maps server events to the same `delta` / `done` / `error` contract so components need not change.

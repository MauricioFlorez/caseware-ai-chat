# Contract: Chat API (backend SSE)

**Feature**: 002-backend-sse  
**Purpose**: Define the HTTP and SSE contract between the Angular app and the Node proxy. The backend implements this; the frontend already consumes it via `SseStreamService` and `StreamEvent` from shared.

## Endpoint

- **Method**: POST  
- **Path**: `/api/chat` (or `/chat`; single canonical path per deployment)  
- **Request body**: JSON `{ "message": "<user message>" }`  
- **Request headers**: `Content-Type: application/json`  
- **Response**: `Content-Type: text/event-stream`, `Cache-Control: no-cache`, `Connection: keep-alive`  
- **Response body**: SSE stream (see below)

## Request validation

- `message` MUST be present and MUST be a string.
- `message` after trim MUST have length ≥ 1 (and MAY have an upper bound, e.g. 32k).
- Invalid body → 400 with JSON error shape (e.g. `{ "error": "message required" }`).

## SSE stream format

The stream MAY contain optional **SSE comment lines** (e.g. `: started`, `: keepalive`) before or between `data:` events. The **client SHOULD ignore** comment lines and only parse lines starting with `data:` as `StreamEvent`.

Each SSE event is a line of the form:

```text
data: <JSON object>\n
```

Optional blank line `\n` after each event. JSON object MUST be one of (same as `StreamEvent` in `@caseware-ai-chat/shared`):

| Type   | JSON |
|--------|------|
| delta  | `{"type":"delta","text":"<chunk>"}` |
| done   | `{"type":"done"}` |
| error  | `{"type":"error","message":"<string>"}` |

**Ordering**: Zero or more `delta`, then exactly one of `done` or `error`. No `delta` after `done` or `error`.

## Cancellation

When the client aborts the request (e.g. user clicks Stop), the server MUST stop sending data and MUST kill the child process. No further events after abort.

## Errors (before stream starts)

- 400: Invalid or missing body.
- 500: Server error (e.g. spawn failed). Optionally send one SSE `error` event then close if headers already sent.

After the first SSE write, errors MUST be sent as an SSE `error` event followed by `done`, not as HTTP status.

# Data model: Backend SSE proxy (002-backend-sse)

**Feature**: Backend layer for real SSE  
**Date**: 2026-02-22  

No persistent storage or database. The backend is stateless per request. Data shapes are request/response and stream events only.

## Request (inbound)

| Field    | Type   | Required | Validation / notes                    |
|----------|--------|----------|----------------------------------------|
| `message`| string | Yes      | Non-empty after trim; max length TBD (e.g. 32k or defer to Copilot). |

**Source**: POST /api/chat body `{ "message": "<user message>" }`.  
**Contract**: See [contracts/chat-api.md](contracts/chat-api.md).

## Response (outbound) — SSE stream

The response is a stream of Server-Sent Events. Each event `data` field is a JSON object conforming to `StreamEvent` from `@caseware-ai-chat/shared`:

| Type   | Shape                         | When sent |
|--------|-------------------------------|-----------|
| delta  | `{ type: 'delta', text: string }` | Each chunk of stdout (or buffered chunk). |
| done   | `{ type: 'done' }`            | Process exited with code 0 and no fatal stderr. |
| error  | `{ type: 'error', message: string }` | Fatal stderr or non-zero exit; then done. |

**Ordering**: Zero or more `delta`, then exactly one of `done` or `error`. No `delta` after `done` or `error`.

## Internal (no API surface)

- **Config**: Typed constants derived from env (PORT, STREAM_CHUNK_SIZE, STREAM_CHUNK_BY, etc.). See backend `config` module.
- **Child process**: No durable state; one process per request; killed on abort or after stream end.

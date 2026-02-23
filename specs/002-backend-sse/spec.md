# Feature Specification: Backend SSE proxy for chat

**Feature Branch**: `002-backend-sse`  
**Created**: 2026-02-22  
**Status**: Draft  
**Input**: Implement the backend layer to provide real SSE to the app; follow all architectural principles already defined.

## Overview

The backend is a **Node.js proxy** that receives chat messages from the Angular app and streams agent (GitHub Copilot CLI) responses over **Server-Sent Events (SSE)**. It follows the design in [docs/architecture/ARCHITECTURE.md](../../docs/architecture/ARCHITECTURE.md) and the constitution. No new product requirements beyond the existing architecture; this spec captures the backend scope for planning and tasks.

## Goals

- Expose **POST /api/chat** with body `{ "message": "<user message>" }`.
- Stream response as **SSE** with events conforming to the shared `StreamEvent` contract (delta, done, error).
- Spawn **GitHub Copilot CLI** (`gh copilot`) in **non-interactive** mode: invoke with **`-p "<message>"`** (prompt) and **`--allow-all-tools`** (required for headless; no interactive permission prompts). Use **`--`** before Copilot-specific flags so `gh` does not consume them. Example: `gh copilot suggest -- -p "<message>" --allow-all-tools -s` (where `-s` gives script-friendly stdout). Read stdout/stderr; stream stdout as delta events; treat stderr/non-zero exit as error then done. Do **not** use stdin for the message or `--no-cache` (unsupported in current CLI).
- Support **cancellation**: when the client aborts the request, kill the child process.
- **Environment**: All configuration via a single env module; validate at startup; no `process.env` in application code.
- **Security**: Validate and sanitize input; rate limiting; CORS explicit; no secrets in code; subprocess spawn with argument array (no shell).

### Edge cases and requirements

- **Request `close`**: Do **not** treat `req.on('close')` as sufficient reason to end the stream. Node/Express can emit `close` on the request while the socket is still writable. The proxy MUST only finish the stream on: child exit (normal or error), child error, stderr received, client abort (`req.on('abort')`), or write failure (e.g. keepalive or `send()` throws).
- **Keepalives**: The proxy MUST send at least one SSE comment (e.g. `: started`) immediately after headers, and MAY send periodic comment keepalives (e.g. every N seconds) until the first content event or stream end, to avoid idle timeouts during long time-to-first-token.
- **Timeouts**: Disable server/request/socket timeouts for the chat response so long-running Copilot responses are not cut off (e.g. `req.socket.setTimeout(0)`, `req.setTimeout(0)`, `res.setTimeout(0)`).

## Out of scope (this feature)

- Conversation history or multi-turn context.
- Custom LLM or alternate agents (only Copilot CLI).
- Database or persistence.
- Authentication layer (prototype uses user's `gh` auth on the machine running the backend).

## References

- [ARCHITECTURE.md](../../docs/architecture/ARCHITECTURE.md) — flow, SSE shapes, cancel, stderr, buffered streaming.
- [Constitution](../../.specify/memory/constitution.md) — stack, boundaries, env, security.
- [backend/AGENTS.md](../../backend/AGENTS.md) — scope, file structure, SSE rules, agents.

## Changelog

| Version | Date       | Change |
|---------|------------|--------|
| v1.0    | 2026-02-22 | Initial spec |
| v1.1    | 2026-02-23 | Align Copilot invocation with CLI (use `-p`, `--`, `--allow-all-tools`, `-s`); do not finish stream on `req.on('close')`; add SSE keepalives and timeout behavior; document dev build/watch. |

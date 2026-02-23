# Research: Backend SSE proxy (002-backend-sse)

**Feature**: Backend layer for real SSE to the chat app  
**Date**: 2026-02-22  

## 1. Node.js child_process for Copilot CLI

**Decision**: Use `child_process.spawn()` with `stdio: ['pipe', 'pipe', 'pipe']`. Do not use `exec` or shell-true; pass `gh` and `['copilot', 'suggest', ...]` as an argument array.

**Rationale**: Spawn with argument array avoids shell injection and keeps control over stdin/stdout/stderr. Non-interactive usage (no TTY) is required per architecture; pipe stdio allows writing the user message to stdin and reading stdout/stderr in order.

**Alternatives considered**: `exec` — rejected (shell, no streaming). `spawnSync` — rejected (blocks event loop). Interactive TTY — rejected per architecture (non-interactive only).

---

## 2. SSE implementation (no library)

**Decision**: Use native Node.js `res.write()` with correct headers and `data: ${JSON.stringify(event)}\n\n` per SSE spec. No dependency on `express-sse` or similar.

**Rationale**: SSE is simple (headers + text lines). Architecture already defines exact payload shapes. Fewer dependencies and full control over ordering (no delta after done/error).

**Alternatives considered**: express-sse — rejected (unnecessary abstraction). WebSocket — rejected (architecture chose SSE for one-way streaming).

---

## 3. Request abort / cancellation

**Decision**: Listen for `req.on('close', ...)` or `req.on('abort', ...)` and call `child.kill()`. Do not send further SSE after abort.

**Rationale**: Client aborts fetch when user hits Stop. Proxy must kill the child so no orphan process and no further writes to closed response.

**Alternatives considered**: Ignoring abort — rejected (orphan processes, bad UX). Only closing response — rejected (process would keep running).

---

## 4. Buffered streaming when Copilot does not stream

**Decision**: If the child exits and stdout was buffered (no incremental chunks), read the full buffer and emit it in chunks (by word or by size) via env-configurable `STREAM_CHUNK_BY` and `STREAM_CHUNK_SIZE`. Emit delta events then done.

**Rationale**: Some CLI behavior may print the full response on exit. Chunking preserves progressive UI without changing the client contract.

**Alternatives considered**: Single delta with full text — rejected (no progressive render). No buffering — rejected (architecture allows buffered fallback).

---

## 5. Environment and validation

**Decision**: Single `config.ts` (or `env.ts`) that reads `process.env` once, validates required vars (e.g. PORT), and exports typed constants. App imports only from config. Fail fast on startup if validation fails.

**Rationale**: Constitution requires no direct `process.env` in code and validate at startup. Single module keeps one place for env and types.

**Alternatives considered**: Scattered env reads — rejected (constitution). Runtime discovery — rejected (fail fast).

---

## 6. Input validation

**Decision**: Validate POST body: require `message` to be a non-empty string (or string with max length if we set one). Sanitize for logging (no raw user input in logs). Do not pass unsanitized input to spawn (use argument array; message goes to stdin as data, not as shell args).

**Rationale**: Constitution: sanitize inputs; treat client as untrusted. Subprocess safety: message is written to stdin, not interpolated into shell.

**Alternatives considered**: Trusting body — rejected. Passing message as CLI arg — rejected (injection risk if ever used in shell).

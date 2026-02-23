# Findings: Copilot proxy connection and CLI invocation

**Spec**: 002-backend-sse  
**Date**: 2026-02-23  
**Purpose**: Summary of issues found during integration and changes made. Use this to update `spec.md`, architecture, and contracts per SDD.

---

## 1. Issue summary

### 1.1 Observed behavior

- **POST /api/chat** returned 200 with SSE headers and sometimes an empty or immediately closed stream.
- Server logs showed `req.on('close')` firing soon after spawn, then `child exit { signal: 'SIGTERM' }` (child killed by proxy).
- No `delta` events reached the client; Copilot CLI never had time to respond (often 15–30+ seconds).

### 1.2 Root causes identified

| # | Cause | Impact |
|---|--------|--------|
| 1 | **CLI invocation** — Spec assumed stdin pipe + `--no-cache`. Current `gh copilot suggest` does not support `--no-cache`; non-interactive mode requires **`-p "<message>"`** and **`--allow-all-tools`**, not stdin. | Wrong args caused CLI errors or no output. |
| 2 | **`gh` flag passing** — Copilot flags must appear after **`--`** so `gh` does not interpret them. | Without `--`, options like `-p` could be mis-handled. |
| 3 | **Premature `req.on('close')`** — Node/Express can emit `close` on the request while the socket is still writable (e.g. before client actually closes). Proxy was calling `finish()` on `req.on('close')`, which killed the child and ended the response. | Stream was closed by the proxy after a few seconds, before Copilot could stream back. |
| 4 | **No keepalive** — With long time-to-first-token, the connection had no activity until the first `delta`. | Increased risk of timeouts or clients/proxies treating the connection as idle. |
| 5 | **Build vs source** — Dev script ran `node --watch dist/index.js` without recompiling from `src/`. Old `dist/` was served; code/logic changes in `src/` had no effect until a manual build. | Confusion during debugging; fixes appeared not to apply. |

---

## 2. Changes made

### 2.1 Copilot CLI invocation (`backend/src/proxy/copilot.proxy.ts`)

- **Invocation**: Use **`-p "<message>"`** for non-interactive prompt instead of writing to stdin.
- **Args**: `gh copilot suggest -- -p "<message>" --allow-all-tools -s`
  - `--` before Copilot flags so `gh` does not consume them.
  - `-p` = non-interactive (no TUI).
  - `--allow-all-tools` = required for headless (no permission prompts).
  - `-s` = script-friendly stdout (only agent response).
- **Removed**: `--no-cache` (not supported by current CLI); stdin write (replaced by `-p`).
- **stdio**: `['ignore', 'pipe', 'pipe']` (no stdin pipe).

### 2.2 Connection and request handling

- **Do not finish on `req.on('close')`**  
  Proxy no longer calls `finish()` when `req` emits `close`. It only finishes when:
  - child exits (normal or error),
  - child emits `error`,
  - stderr is received,
  - client aborts (`req.on('abort')`),
  - or a write fails (keepalive or `send()` throws).
- **Keepalives**: Send SSE comment `: started\n\n` immediately after headers; then `: keepalive\n\n` every 3 seconds until first `delta` or finish. Cleared on first stdout or in `finish()`.
- **Timeouts**: `req.socket.setTimeout(0)`, `req.setTimeout(0)`, `res.setTimeout(0)` to avoid server-side timeouts closing the stream.

### 2.3 Dev workflow (`backend/package.json`)

- **Single dev script**: Build once, then run **`tsc --watch`** and **`node --watch dist/index.js`** together (e.g. via `concurrently`) so changes in `src/` are compiled and the server restarts with new code.
- **Dependency**: `concurrently` added for the combined watch script.

### 2.4 Diagnostics (can be reduced later)

- Logs for `finish(reason)`, child exit, stderr, socket close/error to trace connection and child lifecycle.

---

## 3. Spec updates to consider

Use this section to update `spec.md` and related docs.

### 3.1 `specs/002-backend-sse/spec.md`

- **Goals / implementation notes**
  - State that Copilot is invoked with **`-p` (prompt)** in non-interactive mode, not stdin. Example: `gh copilot suggest -- -p "<message>" --allow-all-tools -s`.
  - Note that **`--`** is required before Copilot-specific flags when using `gh copilot suggest`.
  - Clarify that **`--allow-all-tools`** is required for headless execution (no interactive permission prompts).
- **Edge cases / requirements**
  - **Req `close`**: Do **not** treat `req.on('close')` as sufficient reason to end the stream; only finish on child exit, child error, stderr, client abort, or write failure. (Document as known Node/Express behavior: `close` can fire while the connection is still writable.)
  - **Keepalives**: Proxy MUST send at least one SSE comment (e.g. `: started`) immediately and MAY send periodic comment keepalives (e.g. every N seconds) until the first content event or stream end, to avoid idle timeouts.
  - **Timeouts**: Disable server/request/socket timeouts for the chat response so long-running Copilot responses are not cut off.

### 3.2 `docs/architecture/ARCHITECTURE.md`

- **Non-interactive mode**
  - Replace or supplement “write message to stdin” with: invoke with **`-p "<message>"`** and **`--allow-all-tools`** (and `-s` for script output). Mention that `gh` requires **`--`** before Copilot flags.
- **Stream lifetime**
  - State that the proxy MUST NOT end the stream solely on `req.on('close')`; it MUST only end on child exit, child error, stderr, client abort, or write failure.
- **Keepalives**
  - Add a short subsection: proxy sends an immediate SSE comment and optional periodic comment keepalives until first content or end, to keep the connection active during long time-to-first-token.

### 3.3 `specs/002-backend-sse/contracts/chat-api.md` (if present)

- If the contract describes the SSE stream, add:
  - Optional SSE comment lines (e.g. `: started`, `: keepalive`) before or between `data:` events.
  - Client SHOULD ignore comment lines and only parse `data:` as `StreamEvent`.

### 3.4 `backend/AGENTS.md` or backend README

- **Dev workflow**: Document that `pnpm run dev` (or equivalent) runs TypeScript watch + node watch so `src/` changes are reflected without a manual build.
- **CLI**: Document the exact `gh copilot suggest` invocation (with `--`, `-p`, `--allow-all-tools`, `-s`) and that `--no-cache` is not used (unsupported in current CLI).

---

## 4. Changelog (for spec.md)

When you edit `spec.md`, add a changelog entry, for example:

| Version | Date       | Change |
|---------|------------|--------|
| v1.0    | 2026-02-22 | Initial spec |
| v1.1    | 2026-02-23 | Align Copilot invocation with CLI (use `-p`, `--`, `--allow-all-tools`, `-s`); do not finish stream on `req.on('close')`; add SSE keepalives and timeout behavior; document dev build/watch. |

---

## 5. Files modified (reverted for later re-apply)

The following files were changed during debugging and have been **reverted** so you can re-apply the fixes using this doc:

| File | What was reverted |
|------|--------------------|
| `backend/package.json` | Dev script back to `"dev": "node --watch dist/index.js"`; removed `concurrently` from devDependencies. |
| `backend/src/proxy/copilot.proxy.ts` | Back to stdin-based invocation (`--no-cache`, write message to stdin, finish on `req.on('close')`); removed keepalives, timeout disabling, and "do not finish on req.close" behavior. |

**Not reverted**: `specs/002-backend-sse/findings-copilot-proxy-connection.md` (this file).

---

## 6. References

- Implementation: `backend/src/proxy/copilot.proxy.ts`
- Architecture: `docs/architecture/ARCHITECTURE.md`
- Spec: `specs/002-backend-sse/spec.md`
- Backend agents: `backend/AGENTS.md`

---

*Section 5 lists the files that were reverted; use sections 2 and 3 to re-apply the changes when ready.*

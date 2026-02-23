# Backend layer — Agents

Follow the [project constitution](../../.specify/memory/constitution.md) for principles, stack, and boundaries.

All backend agents and work in `backend/` must follow the design in [docs/architecture/ARCHITECTURE.md](../docs/architecture/ARCHITECTURE.md) for the Node proxy, SSE contract, streaming (delta/done/error), and Copilot CLI integration.

---

## Scope

Single responsibility: proxy between Angular app and gh Copilot CLI. This is not a full API server — resist the urge to add layers.

**Copilot CLI:** Used as a **non-interactive answer engine** only: one message in → streamed response out; no TTY, no prompts. Invoke with **`gh copilot suggest -- -p "<message>" --allow-all-tools -s`** (`--` before Copilot flags; `-p` = prompt; `--allow-all-tools` = headless; `-s` = script stdout). Do not use stdin or `--no-cache` (unsupported). Security impact depends on the **permission level** of the `gh` identity; see [docs/architecture/ARCHITECTURE.md](../docs/architecture/ARCHITECTURE.md) for role and security.

## Stack

- Node.js 22+, TypeScript strict
- Express 5 — minimal, no heavy middleware
- No ORM, no database — prototype scope
- `child_process` for spawning gh copilot
- Native SSE — no library needed

## Architecture — Proxy pattern

```
POST /api/chat { message }
  → spawn('gh', ['copilot', 'suggest', '--', '-p', '<message>', '--allow-all-tools', '-s'])
  → read stdout → stream as SSE delta events (optional : started / : keepalive comments)
  → stderr or non-zero exit → SSE error event then done
  → client abort → child.kill()
```

**Dev workflow:** `pnpm run dev` (or equivalent) MUST run TypeScript watch + node watch so changes in `src/` are compiled and the server restarts without a manual build (e.g. `tsc --watch` and `node --watch dist/index.js` via a single script).

## File structure

```
backend/src/
├── config/
│   └── config.ts              ← env vars — single access point
├── routes/
│   └── chat.route.ts          ← POST /api/chat
├── proxy/
│   ├── copilot.proxy.ts       ← spawn + pipe logic
│   └── sse.writer.ts          ← SSE formatting helpers
├── middleware/
│   └── error.middleware.ts    ← express error handler
└── app.ts                     ← express setup
```

## SSE rules — follow exactly

- Import `StreamEvent` from `@caseware-ai-chat/shared` — never redefine.
- Sequence: `delta*` → (`done` | `error`) — never deviate.
- No delta after done or error.
- Set headers before first write:
  - `Content-Type: text/event-stream`
  - `Cache-Control: no-cache`
  - `Connection: keep-alive`

## Streaming behavior

- **Real streaming** (Copilot streams stdout): pipe stdout chunks directly as delta events.
- **Buffered fallback** (Copilot prints full response on exit): split buffer by `STREAM_CHUNK_BY` env var (`word` | `size`); chunk size via `STREAM_CHUNK_SIZE` env var; emit chunks as delta events — client sees no difference.

## stderr handling — Option A (non-negotiable)

Any stderr output → fatal:

1. Send one error event with stderr message.
2. Send done event.
3. No further delta events for this turn.

## Cancellation

Client aborts fetch → proxy kills child process. `child.kill()` → new turn starts a new process. No state to clean up — each request is independent.

## Environment variables

Access only via `config.ts` — never `process.env.X` directly.

| Variable | Purpose | Default |
|----------|---------|---------|
| `PORT` | Server port | (required) |
| `STREAM_CHUNK_SIZE` | Buffer chunk size in chars | `50` |
| `STREAM_CHUNK_BY` | `'word'` \| `'size'` | `'word'` |

## Do / Don't

| Do | Don't |
|----|-------|
| Keep it simple — this is a proxy, not a framework | No database, no sessions, no auth layer (prototype) |
| Import `StreamEvent` from `@caseware-ai-chat/shared` | Never redefine `StreamEvent` locally |
| Handle child process cleanup on request abort | Never send delta after done or error |
| Validate POST body before spawning process | Never expose raw stderr to client beyond `error.message` |

---

## Agents by role

Use the **name** for slash commands and to reference the agent in Spec Kit `tasks.md` (e.g. when defining who runs a step in the flow).

| Name | Role | When to use | Definition |
|------|------|-------------|------------|
| `backend-engineer` | Backend Engineer | Implement or refactor code in `backend/`; run quality gate before reporting done | [backend/agents/backend-engineer.agent.md](agents/backend-engineer.agent.md) |
| `backend-code-reviewer` | Code Reviewer | Review PRs that touch `backend/` (constitution, boundaries, Node/Express/TS patterns) | [backend/agents/backend-code-reviewer.agent.md](agents/backend-code-reviewer.agent.md) |
| `backend-security-reviewer` | Security Reviewer | Review PRs that touch `backend/` for security baselines (input validation, rate limit, CORS, secrets, dependency audit, subprocess safety) | [backend/agents/backend-security-reviewer.agent.md](agents/backend-security-reviewer.agent.md) |

## Quality gate

The Backend Engineer agent runs a quality gate (build + test + lint) before reporting done. Adjust to the actual scripts in `backend/package.json`.

## Agent definitions

Full agent instructions live in **backend/agents/**.

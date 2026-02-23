# Tasks: Backend SSE proxy for chat

**Input**: Design documents from `specs/002-backend-sse/`  
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Not explicitly requested in spec; quality gate (build + test + lint) required before done. No separate TDD test tasks.

**Organization**: Tasks grouped by user story (derived from spec goals) for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story (US1–US4) — maps to spec goals
- Include exact file paths in descriptions

## Path conventions

- **Backend**: `backend/src/` (config/, routes/, proxy/, middleware/), `backend/package.json`, `backend/tsconfig.json`
- **Shared**: `shared/src/types/` (StreamEvent — consume only, do not redefine)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Node.js + TypeScript backend project initialization and structure per plan.

- [x] T001 Create backend folder structure per plan: backend/src/config/, backend/src/routes/, backend/src/proxy/, backend/src/middleware/ and backend/src/app.ts
- [x] T002 Configure backend package.json with Node 22+, TypeScript, Express 5, and workspace dependency on @caseware-ai-chat/shared (backend/package.json)
- [x] T003 [P] Add backend tsconfig.json with strict mode and ES modules (backend/tsconfig.json, backend/tsconfig.app.json if needed)
- [x] T004 [P] Add build and start scripts to backend/package.json (e.g. build, start, dev)

**Checkpoint**: Backend package builds and resolves shared types

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Config module (env validation), SSE writer, and middleware skeleton. Required before any route or proxy work.

**Checkpoint**: Foundation ready — user story implementation can begin

- [x] T005 Implement config module: read PORT (required), STREAM_CHUNK_SIZE, STREAM_CHUNK_BY; validate at startup and fail fast; export typed constants; no process.env elsewhere (backend/src/config/config.ts)
- [x] T006 [P] Implement SSE writer: set headers (Content-Type: text/event-stream, Cache-Control: no-cache, Connection: keep-alive) and write StreamEvent as data lines (data: ${JSON.stringify(event)}\n\n); import StreamEvent from @caseware-ai-chat/shared (backend/src/proxy/sse.writer.ts)
- [x] T007 [P] Add error middleware: catch errors, respond with JSON (no stack trace to client), log appropriately (backend/src/middleware/error.middleware.ts)
- [x] T008 [P] Add validation middleware skeleton for POST body (message required, string, non-empty after trim); return 400 with JSON error shape on failure (backend/src/middleware/validate.middleware.ts)

**Checkpoint**: Config loads; SSE writer and middleware exist and can be imported

---

## Phase 3: User Story 1 – Chat endpoint and SSE contract (Priority: P1) – MVP

**Goal**: Expose POST /api/chat with validated body and respond with a valid SSE stream (delta/done/error per contract). Initially wire to a simple stream (e.g. single delta then done) so the endpoint is testable without Copilot.

**Independent Test**: curl -X POST http://localhost:PORT/api/chat -H "Content-Type: application/json" -d '{"message":"hi"}' -H "Accept: text/event-stream" → receive SSE data lines ending with done.

- [x] T009 [US1] Add POST /api/chat route; apply validation middleware for body.message; on valid body call a stream handler (backend/src/routes/chat.route.ts)
- [x] T010 [US1] In chat route, set SSE headers via sse.writer and stream at least one delta and one done event (e.g. echo or fixed response) so contract is satisfied (backend/src/routes/chat.route.ts)
- [x] T011 [US1] Wire chat route into Express app and mount at /api/chat (backend/src/app.ts)

**Checkpoint**: User Story 1 independently testable — POST /api/chat returns valid SSE stream

---

## Phase 4: User Story 2 – Copilot proxy (Priority: P1)

**Goal**: Spawn gh copilot in non-interactive mode; write user message to stdin; read stdout and stream as delta events; read stderr and on stderr or non-zero exit send one error event then done. Use shared StreamEvent types only.

**Independent Test**: With gh authenticated, POST a message and receive streamed delta events then done (or error then done on failure).

- [x] T012 [US2] Implement Copilot proxy: spawn('gh', ['copilot', 'suggest', ...], { stdio: ['pipe','pipe','pipe'] }); write message to child.stdin; no shell, argument array only (backend/src/proxy/copilot.proxy.ts)
- [x] T013 [US2] In copilot.proxy, pipe stdout chunks to SSE delta events (order preserved) using sse.writer; on process exit with code 0 and no stderr, send done (backend/src/proxy/copilot.proxy.ts)
- [x] T014 [US2] On stderr or non-zero exit, send one error event (message from stderr or exit) then done; no delta after error (backend/src/proxy/copilot.proxy.ts)
- [x] T015 [US2] Implement buffered fallback: if stdout is only available on exit, buffer and emit in chunks per config STREAM_CHUNK_BY and STREAM_CHUNK_SIZE (backend/src/proxy/copilot.proxy.ts)
- [x] T016 [US2] Wire chat route to copilot.proxy instead of echo; pass validated message to proxy; proxy writes to res via sse.writer (backend/src/routes/chat.route.ts)

**Checkpoint**: User Story 2 independently testable — real Copilot stream via POST /api/chat

---

## Phase 5: User Story 3 – Cancellation and cleanup (Priority: P2)

**Goal**: When client aborts the request, kill the child process and stop sending SSE. No orphan processes.

**Independent Test**: Start a long-running request, abort client (e.g. curl Ctrl+C or fetch.abort()); verify child is killed and no further writes.

- [x] T017 [US3] In copilot.proxy (or chat route), listen for req.on('close') and req.on('abort'); on abort/close call child.kill() and stop writing to res (backend/src/proxy/copilot.proxy.ts or backend/src/routes/chat.route.ts)
- [x] T018 [US3] Ensure no delta or other SSE is sent after abort; close response once (backend/src/proxy/copilot.proxy.ts and backend/src/routes/chat.route.ts)

**Checkpoint**: User Story 3 independently testable — cancel kills process and ends stream cleanly

---

## Phase 6: User Story 4 – Config and security (Priority: P2)

**Goal**: Env validated at startup; rate limiting on /api/chat; CORS configured explicitly; input sanitization for logging; no secrets in code.

**Independent Test**: Missing PORT exits at startup; rate limit returns 429 when exceeded; CORS headers present per config; invalid body returns 400.

- [x] T019 [US4] Add rate limiting middleware for /api/chat (per IP or per identity); apply in app before chat route (backend/src/middleware/validate.middleware.ts or dedicated backend/src/middleware/rate-limit.middleware.ts)
- [x] T020 [US4] Configure CORS explicitly (no permissive default); allow frontend origin per config or env (backend/src/app.ts)
- [x] T021 [US4] Ensure validation middleware rejects empty or missing message and trims message; sanitize message for logs (no raw user input in log lines) (backend/src/middleware/validate.middleware.ts)
- [x] T022 [US4] Document manual test cases for POST /api/chat (endpoint, method, example request, expected response, how to run) in backend/docs or backend/README.md per backend-engineer agent

**Checkpoint**: User Story 4 independently testable — security and config in place

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: App entry, quality gate, quickstart validation

- [x] T023 Wire Express app: config load, routes, error middleware, listen on config.PORT (backend/src/app.ts and backend/src/index.ts or server entry)
- [x] T024 Run quality gate: npm run build and npm test and npm run lint from backend/ per quickstart.md
- [x] T025 Verify quickstart: build shared, build backend, start backend, run curl example from quickstart.md

**Checkpoint**: Backend runs end-to-end; quality gate passes

---

## Dependencies & Execution Order

### Phase dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 — blocks all user stories
- **Phases 3–6 (User stories)**: Depend on Phase 2; can proceed in priority order (US1 → US2 → US3 → US4) or parallel if staffed
- **Phase 7 (Polish)**: Depends on Phases 3–6; includes app wiring and quality gate

### User story dependencies

- **US1 (P1)**: After Phase 2 — no dependency on other stories (endpoint + SSE contract)
- **US2 (P1)**: After Phase 2 — depends on US1 for route; adds real proxy
- **US3 (P2)**: After US2 — adds abort handling to proxy/route
- **US4 (P2)**: After Phase 2 — middleware and security; can run in parallel with US1/US2

### Parallel opportunities

- T003 and T004 can run in parallel (Phase 1)
- T006, T007, T008 can run in parallel (Phase 2)
- After Phase 2: T009–T011 (US1) then T012–T016 (US2); T019–T022 (US4) can overlap with US1/US2 where files differ

---

## Implementation strategy

### MVP first (User Story 1 + User Story 2)

1. Complete Phase 1 (Setup)
2. Complete Phase 2 (Foundational)
3. Complete Phase 3 (US1) — POST /api/chat returns SSE (e.g. echo)
4. Complete Phase 4 (US2) — wire Copilot proxy
5. Validate: curl POST returns streamed response from gh copilot
6. Add Phase 5 (US3) and Phase 6 (US4), then Phase 7

### Incremental delivery

1. Setup + Foundational → foundation ready
2. US1 → POST /api/chat with SSE contract → test with curl
3. US2 → real Copilot stream → test with gh auth
4. US3 → cancel → test abort
5. US4 → rate limit, CORS, validation → test
6. Polish → quality gate and quickstart

---

## Notes

- Each task includes a file path for implementation location
- [P] = parallelizable where safe (different files, no ordering requirement)
- [USn] = task belongs to that user story for traceability
- Quality gate (T024): run from backend/ with build, test, lint; see backend/AGENTS.md and quickstart.md
- StreamEvent: import from @caseware-ai-chat/shared only; do not redefine in backend
- Copilot CLI: non-interactive only (no TTY); message to stdin; stdout → delta, stderr/exit → error then done

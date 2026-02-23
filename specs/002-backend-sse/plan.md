# Implementation Plan: Backend SSE proxy for chat

**Branch**: `002-backend-sse` | **Date**: 2026-02-22 | **Spec**: [spec.md](spec.md)  
**Input**: Feature specification from [specs/002-backend-sse/spec.md](spec.md). Architecture from [docs/architecture/ARCHITECTURE.md](../../docs/architecture/ARCHITECTURE.md).

## Summary

Node.js + Express proxy that accepts POST /api/chat with a message, spawns `gh copilot` in non-interactive mode, and streams stdout as SSE delta events. stderr or non-zero exit produces one error event then done. Client abort kills the child process. Configuration and env validation in a single module; StreamEvent types from `@caseware-ai-chat/shared`; no database, no auth layer (prototype).

## Technical Context

**Language/Version**: TypeScript (strict), Node.js 22+  
**Primary Dependencies**: Express 5, `@caseware-ai-chat/shared` (StreamEvent types), Node `child_process`  
**Storage**: N/A (no persistence)  
**Testing**: Node test runner or Jest; quality gate: build + test + lint from `backend/`  
**Target Platform**: Node.js server (local or deployed)  
**Project Type**: Web service (API only; proxy to Copilot CLI)  
**Performance Goals**: Low latency to first byte; smooth streaming; no blocking on main thread  
**Constraints**: Single process per request; cancel = kill child; no delta after done/error; env-only config  
**Scale/Scope**: Single-user prototype; one request at a time per client; Copilot CLI runs on user machine

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Check | Status |
|-------|--------|
| Backend uses Node.js + Express | Pass |
| Backend depends only on `shared` (types/utils) | Pass — shared for StreamEvent; no frontend |
| TypeScript strict, no unwarranted `any` | Pass |
| Prettier/ESLint at root, packages inherit | Pass — assumed |
| No business logic in shared | Pass — shared holds types only |
| Env via single module; validate at startup | Pass — config module |
| No secrets in code; sanitize input; rate limit; CORS | Pass — design |
| Conventional commits, PR review | Pass — per constitution |

No violations.

## Project Structure

### Documentation (this feature)

```text
specs/002-backend-sse/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # API contract (POST /api/chat, SSE)
└── tasks.md             # Phase 2 output (/speckit.tasks — not created by /speckit.plan)
```

### Source Code (repository root)

This feature touches only the **backend** package.

```text
backend/
├── src/
│   ├── config/
│   │   └── config.ts           # Env vars — single access point; validate at startup
│   ├── routes/
│   │   └── chat.route.ts       # POST /api/chat
│   ├── proxy/
│   │   ├── copilot.proxy.ts    # Spawn gh copilot, pipe stdin/stdout/stderr
│   │   └── sse.writer.ts       # SSE formatting (Content-Type, data: lines)
│   ├── middleware/
│   │   ├── error.middleware.ts     # Express error handler
│   │   ├── validate.middleware.ts # Body validation; optional: rate limit here
│   │   └── rate-limit.middleware.ts # Optional: dedicated rate limit for /api/chat
│   ├── app.ts                  # Express app setup
│   └── index.ts                # Entry: load config, create app, listen on config.PORT
├── package.json
└── tsconfig.json
```

**Structure decision**: Backend is a thin proxy. Config centralizes env. Routes delegate to proxy; proxy spawns child, uses sse.writer to emit StreamEvent-compliant SSE. Middleware handles validation and errors. Rate limiting is implemented either in `validate.middleware.ts` or in a dedicated `rate-limit.middleware.ts` (per tasks T019). No database or session layer.

## Complexity Tracking

No constitution violations; table not used.

# Implementation Plan: Chat UI with streamed agent responses

**Branch**: `001-chat-ui-streaming` | **Date**: 2026-02-22 | **Spec**: [spec.md](spec.md)  
**Input**: Feature specification from `specs/001-chat-ui-streaming/spec.md`  
**Note**: This feature is implemented. The latest spec updates (FR-022, assumption "Unsubscribe the previous subscription when starting a new send") document a **behavioral fix** already applied in code: single active subscription per stream, mock cancels previous stream timeouts. No new feature work required for the fix.

## Summary

Chat UI that displays connection status, streamed conversation (user and agent messages), sticky header and footer (composer with Send/Stop), error panel with Retry, scroll anchor, and welcome message. **Data source selectable**: user can choose live (real SSE backend) or mock. Real SSE integration connects to the backend for production use; mock remains for development/demo. Angular 20+, TypeScript strict, mobile-first. **Stream semantics (FR-022)**: one logical stream per send; UI unsubscribes previous subscription when starting a new send; mock cancels previous stream so each delta is applied exactly once to the corresponding agent message. **Process timeout (FR-024)**: backend/proxy timeout is treated as error; stream ends cleanly, UI shows error state.

## Technical Context

**Language/Version**: TypeScript (strict), Angular 20+  
**Primary Dependencies**: Angular 20+ (standalone components, signals, control flow), RxJS; shared types for stream events; no backend SDK  
**Storage**: N/A (in-memory only per spec)  
**Testing**: Angular default (Jasmine/Karma); quality gate: `ng build` + `ng test` from `frontend/`  
**Target Platform**: Web browsers; mobile-first responsive  
**Project Type**: Web application; frontend implements chat UI and SSE client; backend (proxy) may be same repo or external.  
**Performance Goals**: Smooth streaming UX (incremental render); responsive layout; no jank on scroll/anchor  
**Constraints**: At most one active stream; single active subscription applies events (FR-022). Real SSE backend optional (user can select live or mock via FR-023). Process timeout treated as error (FR-024).  
**Scale/Scope**: Single-user chat UI; one conversation in memory

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Check | Status |
|-------|--------|
| Frontend uses Angular 20+ | Pass |
| Frontend depends only on `shared` (types/utils) | Pass — frontend consumes shared types; real SSE is HTTP/EventSource client to backend URL |
| TypeScript strict, no unwarranted `any` | Pass |
| Prettier/ESLint at root, packages inherit | Pass — assumed |
| No business logic in shared | Pass — shared holds stream event types only |
| Conventional commits, PR review | Pass — per constitution |

No violations.

## Project Structure

### Documentation (this feature)

```text
specs/001-chat-ui-streaming/
├── plan.md              # This file
├── research.md          # Phase 0 (existing)
├── data-model.md        # Phase 1 (existing)
├── quickstart.md        # Phase 1 (existing)
├── contracts/           # mock-stream-api.md (existing)
├── tasks.md             # Phase 2 (/speckit.tasks)
└── STREAM-SEMANTICS-DISCREPANCY.md  # Fix analysis and preventive spec
```

### Source Code (repository root)

This feature touches only the **frontend** package.

```text
frontend/
├── src/
│   ├── app/
│   │   ├── core/           # Connection state, stream source interface, mock + real SSE stream services
│   │   ├── features/chat/  # Shell, header, conversation, message, composer, error-panel, scroll-anchor
│   │   └── shared/         # UI primitives (if any)
│   ├── assets/
│   └── styles/             # Global + mobile-first breakpoints
├── angular.json
├── package.json
└── tsconfig.json

shared/
└── src/
    └── types/             # Stream event types (delta, done, error)
```

**Structure decision**: Frontend-only. Core holds connection state, mock stream (with stream-timeout cancellation on new send), and real SSE stream source when live mode is selected. Chat shell unsubscribes previous stream subscription when starting a new send (FR-022).

**Data source selector (FR-023)**: The live/mock control SHALL be placed in the header next to the connection badge and mock dropdown so all mode/connection controls are in one place. (If the team later adds a settings panel, the control MAY move there; spec allows "e.g. header or settings".)

## Complexity Tracking

No constitution violations; table not used.

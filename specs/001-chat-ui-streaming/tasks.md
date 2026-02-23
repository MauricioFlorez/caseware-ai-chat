# Tasks: Chat UI with streamed agent responses

**Input**: Design documents from `specs/001-chat-ui-streaming/`  
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**New spec**: FR-022 (single active subscription per send), FR-014a (welcome message when no messages), FR-016a (Conversation panel scroll behavior: auto-scroll while streaming, scroll on send/completion, no scroll on Stop, manual scroll stop/resume). Tasks below include T031 (FR-022), T032 (FR-014a), T033 (FR-016a).

**Tests**: Not explicitly requested in spec; quality gate (ng build, ng test) required before done. No separate TDD test tasks.

**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story (US1–US6)
- Include exact file paths in descriptions

## Path conventions

- **Frontend**: `frontend/src/app/` (core/, features/chat/), `frontend/src/styles/`
- **Shared**: `shared/src/types/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Angular 20+ project initialization and structure

- [x] T001 Create Angular 20+ application in frontend/ with strict TypeScript (frontend/angular.json, frontend/tsconfig.json, frontend/tsconfig.app.json)
- [x] T002 Configure frontend package.json with Angular dependencies and workspace dependency on @caseware-ai-chat/shared (frontend/package.json)
- [x] T003 [P] Add mobile-first base styles and breakpoint variables (frontend/src/styles/_variables.scss or frontend/src/styles/global.css)
- [x] T004 [P] Create app folder structure: core/, features/chat/, shared/ under frontend/src/app/ (frontend/src/app/core/, frontend/src/app/features/chat/, frontend/src/app/shared/)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Stream contract, connection state, mock stream service, and minimal chat shell so user stories can render

**Checkpoint**: Foundation ready — user story implementation can begin

- [x] T005 [P] Define stream event types (delta, done, error) per contracts/mock-stream-api.md in shared/src/types/stream-events.ts
- [x] T006 Implement connection state service (mode: disconnected | retrying | connected, activeStream) in frontend/src/app/core/connection-state.service.ts
- [x] T007 Define stream source interface (send, cancel, events Observable) in frontend/src/app/core/stream-source.interface.ts
- [x] T008 Implement mock stream service that implements stream source, emits delta/done/error per contract, and cancels previous stream on new send (FR-022) in frontend/src/app/core/mock-stream.service.ts
- [x] T009 Create chat shell component with layout: sticky header placeholder, scrollable conversation area, sticky footer placeholder in frontend/src/app/features/chat/chat-shell.component.ts (and template)

---

## Phase 3: User Story 1 – View connection status and streamed conversation (Priority: P1) – MVP

**Goal**: User sees connection mode in header and messages (user + agent) in a scrollable conversation; agent content updates progressively as stream events arrive.

**Independent Test**: Open chat, check header for connection state, send a message, verify agent reply appears incrementally; scroll when conversation exceeds viewport.

- [x] T010 [US1] Add header component with connection status indicator and mode badge (disconnected, retrying, connected) in frontend/src/app/features/chat/header/
- [x] T011 [US1] Add conversation view component (scrollable list of messages, vertical scroll when content exceeds viewport) in frontend/src/app/features/chat/conversation-view/
- [x] T012 [US1] Add message component with stable id (for list keying and error panel association), role, content, streamState for agent in frontend/src/app/features/chat/message/
- [x] T013 [US1] Wire conversation to stream: append user message on send, create agent message, update content from delta/done/error events; unsubscribe previous subscription when starting a new send (FR-022) in frontend/src/app/features/chat/chat-shell.component.ts
- [x] T014 [US1] Wire header connection badge to connection state service in frontend/src/app/features/chat/chat-shell or header component

**Checkpoint**: User Story 1 independently testable — connection visible, streamed conversation works

---

## Phase 4: User Story 2 – Compose and send/stop control (Priority: P1)

**Goal**: User can type in fixed-height composer, send (button becomes Stop), stop (restore text, button becomes Send), and send again or retry.

**Independent Test**: Type in composer, send, press Stop during stream, verify text restored and button is Send; send again or retry.

- [x] T015 [US2] Add footer composer component with textarea (~3 lines, not resizable, internal scroll) in frontend/src/app/features/chat/composer/
- [x] T016 [US2] Add Send/Stop button (stateful: send | stop), disable Send while stream active, restore lastSentText to textarea on Stop in frontend/src/app/features/chat/composer/
- [x] T017 [US2] Wire composer to mock stream: send message on Send, cancel stream on Stop, restore last typed message on Stop in frontend/src/app/features/chat/

**Checkpoint**: User Story 2 independently testable — composer and Send/Stop work

---

## Phase 5: User Story 3 – Recover from mid-stream disconnection (Priority: P2)

**Goal**: On disconnect or stream error, error panel appears below last user message with Retry; Retry disabled after click until connection state changes.

**Independent Test**: Simulate disconnect during stream; verify error panel and Retry; press Retry, verify re-send; verify Retry disables until state change.

- [x] T018 [US3] Add error panel component (below last user message that did not receive response, Retry button) in frontend/src/app/features/chat/error-panel/
- [x] T019 [US3] Show error panel on stream error or connection disconnect (below last user message); when there are no user messages yet (e.g. connection lost on load), show error state in header or minimal banner with Retry; disable Retry after first click until connection state changes in frontend/src/app/features/chat/
- [x] T020 [US3] Wire Retry to re-send last user message (or retry stream) and re-enable Retry when state changes in frontend/src/app/features/chat/

**Checkpoint**: User Story 3 independently testable — error panel and Retry work

---

## Phase 6: User Story 4 – Navigate long conversations and return to latest (Priority: P2)

**Goal**: When user scrolls up, panel stops auto-scrolling; when user sends a new message or a stream is in progress, anchor appears at bottom (loading then arrow). Activating anchor scrolls to bottom with animation and resumes auto-scroll if stream active. Scroll behavior follows Conversation panel scroll behavior (FR-016a).

**Independent Test**: Scroll up (verify auto-scroll stops), send message (verify panel scrolls so last user message visible), use bottom anchor to scroll back down and resume auto-scroll.

- [x] T021 [US4] Detect scroll-up and show centered anchor at bottom of viewport when user has scrolled up and sent new message in frontend/src/app/features/chat/
- [x] T022 [US4] Add anchor indicator (loading while streaming, downward arrow when done); click triggers animated scroll to bottom of conversation in frontend/src/app/features/chat/

**Checkpoint**: User Story 4 independently testable — anchor and scroll-to-bottom work

---

## Phase 7: User Story 5 – Differentiate user and agent messages and streaming state (Priority: P2)

**Goal**: User and agent messages clearly differentiated; agent messages not in colored/boxed container; live status (In Progress, Done, Error).

**Independent Test**: Send messages; verify role differentiation, no box for agent; verify status during and after stream.

- [x] T023 [US5] Style user vs agent messages (differentiated layout/position; agent not in colored or boxed container) in frontend/src/app/features/chat/message/ and styles
- [x] T024 [US5] Add live status indicator (In Progress / Done / Error) for agent messages in frontend/src/app/features/chat/message/ or conversation-view

**Checkpoint**: User Story 5 independently testable — differentiation and status visible

---

## Phase 8: User Story 6 – Mocked response for development/demo (Priority: P3)

**Goal**: Header dropdown to select and trigger a mocked streamed response without real backend.

**Independent Test**: Open header dropdown, select mock preset, verify conversation shows mocked streamed response.

- [x] T025 [US6] Add header dropdown to select mock response preset in frontend/src/app/features/chat/header/
- [x] T026 [US6] Wire dropdown to mock stream service to emit selected preset as streamed response (same delta/done behavior) in frontend/src/app/features/chat/ or core/

**Checkpoint**: User Story 6 independently testable — mock dropdown works

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Accessibility, responsive verification, quality gate

- [x] T027 [P] Add keyboard focus order and accessible labels for header, composer, Retry, anchor in frontend/src/app/features/chat/
- [x] T028 Add aria-live region for streamed agent content so screen readers announce updates in frontend/src/app/features/chat/message/ or conversation-view
- [x] T029 Verify mobile-first responsive layout (sticky header/footer, viewport, scroll) across breakpoints in frontend/src/styles/ and component templates
- [x] T030 Run quality gate: ng build and ng test from frontend/ per quickstart.md
- [x] T031 Verify FR-022: stream events applied only to corresponding agent message; at most one active subscription (unsubscribe previous on new send in chat-shell; cancel previous stream in mock) in frontend/src/app/features/chat/chat-shell.component.ts and frontend/src/app/core/mock-stream.service.ts
- [x] T032 Verify FR-014a: conversation view shows centered welcome message "I'm here to help you!!" when no messages in frontend/src/app/features/chat/conversation-view/
- [x] T033 Implement FR-016a (Conversation panel scroll behavior): auto-scroll while streaming when at bottom; scroll on send and stream done/error; no scroll on Stop; manual scroll stops auto-scroll, scroll-to-bottom resumes in frontend/src/app/features/chat/conversation-view/ and chat-shell.component.ts

---

## Dependencies & Execution Order

### Phase dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 — blocks all user stories
- **Phases 3–8 (User stories)**: Depend on Phase 2; can proceed in priority order (US1 → US2 → …) or parallel if staffed
- **Phase 9 (Polish)**: Depends on Phases 3–8 (or subset chosen for release); includes FR-022 (T031), FR-014a (T032), and FR-016a (T033)

### User story dependencies

- **US1 (P1)**: After Phase 2 — no dependency on other stories
- **US2 (P1)**: After Phase 2 — composes with US1 (conversation + composer)
- **US3 (P2)**: After Phase 2 — composes with US1/US2 (error panel below message)
- **US4 (P2)**: After Phase 2 — composes with US1 (scroll, anchor)
- **US5 (P2)**: After Phase 2 — refines US1 (message styling, status)
- **US6 (P3)**: After Phase 2 — composes with US1 (header dropdown, mock)

### Parallel opportunities

- T003 and T004 can run in parallel (Phase 1)
- T005 can run in parallel with T006–T009 (Phase 2) once shared package is buildable
- Within Phase 2: T005 [P], T006–T009 in order (T007 before T008)
- After Phase 2: US1–US6 can be split across developers; within each story, tasks are mostly sequential (wire after create)

---

## Implementation strategy

### MVP first (User Story 1 only)

1. Complete Phase 1 (Setup)
2. Complete Phase 2 (Foundational)
3. Complete Phase 3 (US1)
4. Validate: connection badge and streamed conversation work
5. Demo/deploy if ready

### Incremental delivery

1. Setup + Foundational → foundation ready
2. Add US1 → test → MVP
3. Add US2 → test → composer and Send/Stop
4. Add US3, US4, US5, US6 → test each
5. Polish (a11y, responsive, quality gate)

---

## Notes

- Each task includes a file path for implementation location
- [P] = parallelizable where safe (different files, no ordering requirement)
- [USn] = task belongs to that user story for traceability
- Quality gate (T030): run from frontend/ with `ng build` and `ng test`; see README for Angular MCP
- FR-022 (T031): One logical stream per send; single active subscription; mock cancels previous stream. See STREAM-SEMANTICS-DISCREPANCY.md and plan.md.
- FR-014a (T032): Centered welcome message when conversation is empty. See spec.md Functional Requirements.
- FR-016a (T033): Conversation panel scroll behavior—auto-scroll while streaming when at bottom; on send and stream completion animate scroll so last message visible; Stop does not change scroll; manual scroll up stops auto-scroll; scroll to bottom resumes. See spec.md § Conversation panel scroll behavior.

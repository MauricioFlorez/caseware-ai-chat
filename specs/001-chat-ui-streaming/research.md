# Research: Chat UI with streamed agent responses

**Feature**: 001-chat-ui-streaming  
**Date**: 2026-02-22

## Technical decisions (from plan input)

**User input**: "Use Angular 20+, The site must be fully responsive - mobile first. Data for streaming right now will be mocked. No real backend for at the moment."

### Angular 20+

- **Decision**: Use Angular 20+ (strict TypeScript, standalone components, signals, control flow) per constitution and [frontend/.cursor/rules/angular-best-practices.mdc](../../frontend/.cursor/rules/angular-best-practices.mdc) (or platform-guidelines).
- **Rationale**: Aligns with project constitution; Angular 20+ is the stated frontend stack. Standalone and signals support modern, testable components.
- **Alternatives considered**: React/Vue — rejected; constitution mandates Angular 20+.

### Responsive, mobile-first

- **Decision**: Implement responsive layout with a mobile-first approach. Use CSS breakpoints (e.g. small base, then `min-width` for tablet/desktop). Ensure sticky header/footer and conversation scroll work on small viewports (e.g. 320px) and scale up.
- **Rationale**: Spec requires sticky header/footer, scrollable conversation, and anchor; mobile-first ensures these work on the smallest viewport first, then enhance for larger screens.
- **Alternatives considered**: Desktop-first — rejected; user explicitly requested mobile first.

### Mocked streaming data, no real backend

- **Decision**: Provide a mock streaming service in the frontend that emits stream events (chunks, done, error) on a configurable delay, without any HTTP or backend. The header dropdown triggers predefined mock responses. Connection state (disconnected / retrying / connected) is simulated (e.g. connected by default when using mock).
- **Rationale**: Spec requires "mocked response" from header dropdown and in-memory conversation; no backend in this feature. A mock service allows full UI and quality-gate testing without a server.
- **Alternatives considered**: Real SSE to a stub server — rejected; user said no real backend for now.

### Accessibility (FR-020)

- **Decision**: Implement keyboard-operable chat (focus order: header → conversation → composer; Send/Stop and Retry focusable). Use accessible labels for controls. Use a live region (e.g. `aria-live="polite"`) for streamed agent content so screen readers announce updates. Ensure anchor control and error panel are focusable and labeled.
- **Rationale**: Spec and constitution require a11y; WCAG 2.1 AA alignment is in UX reviewer scope. Live regions are the standard pattern for streaming content.
- **Alternatives considered**: No live region — rejected; would fail screen-reader usability for streamed text.

### Stream event shape (for contracts)

- **Decision**: Define a minimal contract for stream events: (1) text delta (partial content), (2) done (stream complete), (3) error (message + optional retry). This contract is implemented by the mock service and can be implemented later by a real backend (e.g. SSE or WebSocket).
- **Rationale**: Enables a clear boundary between UI and "stream source"; mock and future backend both implement the same interface.
- **Alternatives considered**: No contract — rejected; would couple UI to mock implementation and complicate future backend integration.

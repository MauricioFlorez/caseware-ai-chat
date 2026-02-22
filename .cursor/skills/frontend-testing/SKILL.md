---
name: frontend-testing
description: Testing approach and boundaries for the frontend package. Use when writing or updating tests in frontend/.
---

# Frontend testing skill

## When to use

- Writing or updating unit or integration tests in `frontend/`.
- Defining test structure, mocking, or test boundaries.

## Instructions

1. **Constitution:** Follow the [project constitution](../../../.specify/memory/constitution.md). Frontend may depend only on `shared`; no backend API logic in frontend. Tests must not call the backend; use mocks or in-memory data.

2. **Testing approach**
   - **Unit tests:** Component and service logic; mock dependencies (e.g. services, shared utilities) at boundaries. Prefer Angular testing utilities (TestBed, fixture, etc.) and align with Angular best practices.
   - **Integration tests:** Where needed, test component + service interaction with mocked dependencies. No real HTTP or backend calls.
   - **E2E:** When the project has E2E (e.g. Cypress, Playwright), run via Angular MCP `e2e` tool when the Frontend Engineer agent runs the quality gate for flows that changed.

3. **Boundaries**
   - Mock `@caseware-ai-chat/shared` at the boundary if tests need to control data shapes; do not put business logic in shared.
   - No backend calls in frontend tests (per "no BE integration" in frontend phase). Use local or in-memory data.

4. **Quality gate:** The Frontend Engineer agent runs the **test** tool via Angular MCP before reporting done. See [frontend/agents/frontend-engineer.agent.md](../../../frontend/agents/frontend-engineer.agent.md). MCP config: [.cursor/mcp.json](../../../.cursor/mcp.json). Ensure tests are stable and pass before marking work complete.

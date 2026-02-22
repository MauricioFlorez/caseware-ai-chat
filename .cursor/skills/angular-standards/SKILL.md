---
name: angular-standards
description: Angular 20+ and TypeScript conventions for the frontend package. Use when working in frontend/ with Angular.
---

# Angular standards skill

## When to use

- Working in `frontend/` with Angular (components, services, templates, styles).
- Implementing or refactoring Angular code.

## Instructions

1. **Constitution:** Follow the [project constitution](../../../.specify/memory/constitution.md) for principles, stack, and boundaries. Frontend uses Angular 20+, TypeScript strict, and `@caseware-ai-chat/shared` only (types and utilities; no business logic).

2. **Angular best practices:** Use the [Angular best-practices rule](../../../frontend/agents/platform-guidelines/angular-best-practices.md) as the single source. Do not duplicate it here. Key areas: standalone components, signals, `input()`/`output()`, `inject()`, native control flow (`@if`, `@for`, `@switch`), `ChangeDetectionStrategy.OnPush`, reactive forms, no `ngClass`/`ngStyle`, strict TypeScript.

3. **Formatting and lint:** Align with repo root Prettier and ESLint; packages inherit. Style/formatting per constitution.

4. **Quality gate:** Before reporting frontend work "done," the Frontend Engineer agent runs build and test via Angular MCP. See [frontend/agents/frontend-engineer.agent.md](../../../frontend/agents/frontend-engineer.agent.md). MCP config: [.cursor/mcp.json](../../../.cursor/mcp.json).

# Frontend layer — Agents

Follow the [project constitution](../../.specify/memory/constitution.md) for principles, stack, and boundaries.

All frontend agents and work in `frontend/` must follow the **Angular best practices** in [frontend/agents/platform-guidelines/angular-best-practices.md](./agents/platform-guidelines/angular-best-practices.md). Do not duplicate that guide here.

## Agents by role

Use the **name** for slash commands and to reference the agent in Spec Kit `tasks.md` (e.g. when defining who runs a step in the flow).

| Name | Role | When to use | Definition |
|------|------|-------------|------------|
| `frontend-engineer` | Frontend Engineer | Implement or refactor code in `frontend/`; run quality gate before reporting done | [frontend/agents/frontend-engineer.agent.md](agents/frontend-engineer.agent.md) |
| `frontend-code-reviewer` | Code Reviewer | Review PRs that touch `frontend/` (constitution, boundaries, Angular patterns) | [frontend/agents/code-reviewer.agent.md](agents/code-reviewer.agent.md) |
| `ux-reviewer` | UX Reviewer | Review for accessibility (WCAG 2.1 AA) and performance (Core Web Vitals) | [frontend/agents/ux-reviewer.agent.md](agents/ux-reviewer.agent.md) |

## Quality gate

The Frontend Engineer agent runs a quality gate (build + test via Angular CLI MCP) before reporting done. Angular CLI MCP must be configured in [.cursor/mcp.json](../../.cursor/mcp.json) with experimental tools `build` and `test` enabled. Restart Cursor after changing MCP config.

## Agent definitions

Full agent instructions live in **frontend/agents/**.

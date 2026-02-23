# Caseware AI Chat

Chat interface backed by a proxy/orchestrator that talks to an AI agent (e.g. via GitHub CLI). Built for scalability, clear layering, and future extension.

## Repo structure

| Package   | Role                          |
| --------- | ----------------------------- |
| `frontend` | Chat UI client                 |
| `backend`  | Proxy/orchestrator to AI agent |
| `shared`   | Shared types, contracts        |

Monorepo managed with **pnpm workspaces**.

## Prerequisites

- Node.js (see constitution for version)
- pnpm 9+

## Setup

```bash
pnpm install
```

## Run

```bash
pnpm dev
```

Runs frontend and backend in parallel (when implemented).

## Frontend agents and MCP

Frontend Engineer agent and quality gate require **Angular CLI MCP**; config in [.cursor/mcp.json](.cursor/mcp.json). See [frontend/Agents.md](frontend/Agents.md) for frontend agents by role.

**Before running `/speckit.plan` or `/speckit.implement` for the chat UI:** Ensure Angular MCP is configured so the plan and implementation can use the quality gate (build, test). Steps:

1. Confirm [.cursor/mcp.json](.cursor/mcp.json) exists and includes the `angular-cli` server with experimental tools `build` and `test`. Cursor does not document a `cwd` option for MCP; the server runs from the project root. When invoking the Angular MCP `build` or `test` tools, run them from the `frontend/` directory (e.g. ensure the active workspace or tool context is `frontend/` once the Angular app exists there), or run `ng build` / `ng test` from `frontend/` in tasks.
2. **Restart Cursor** after creating or editing `.cursor/mcp.json` so the MCP server is loaded.
3. The Angular app will be scaffolded in `frontend/` during implementation; after that, quality-gate commands should be executed from `frontend/` (e.g. `cd frontend && ng build`).

---

_More details (architecture, contracts, contributing) will be added as the project evolves._

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

Frontend Engineer agent and quality gate require **Angular CLI MCP**; config in [.cursor/mcp.json](.cursor/mcp.json). Restart Cursor after changing MCP config. See [frontend/Agents.md](frontend/Agents.md) for frontend agents by role.

---

_More details (architecture, contracts, contributing) will be added as the project evolves._

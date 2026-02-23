# Caseware AI Chat

Chat interface backed by a proxy/orchestrator that talks to an AI agent via GitHub Copilot CLI. Built for scalability, clear layering, and future extension.

## Repo structure

| Package   | Role                          |
| --------- | ----------------------------- |
| `frontend` | Chat UI client                 |
| `backend`  | Proxy/orchestrator to AI agent |
| `shared`   | Shared types, contracts        |

Monorepo managed with **pnpm workspaces**.

## Prerequisites

- Node.js >=20.0.0
- pnpm >=10.0.0
- make sure to create /backend .env file with the correct values at least PORT variable. PORT=3000 for example.
- This project uses Github Copilot CLI as "agent" to answer the user's questions when in live mode. You need to have it installed, authenticated and runing.

## Setup

```bash
pnpm install
```

## Run

```bash
pnpm run dev
```
Runs frontend and backend in parallel.

## Run tests

```bash
pnpm run test
```

## Mock mode

Mock mode is a dummy mode that allows you to test the frontend without the backend. It will use a mocked response from the backend and you can enable it directly in the header dropdown.


## Deliverables


| Deliverable | Description |
| --------- | ----------------------------- |
| `/transcripts/ ` | [Folder](transcripts/) containing raw AI interaction logs |
| `DESIGN.md`  | [ARCHITECTURE.md](docs/architecture/ARCHITECTURE.md) |
| `VIDEO-DEMO`  | [Caseware ai-chat showcase ](https://www.loom.com/share/35e94b4379a743fdb79d7c8b6fc49325) |

### Demo



## Frontend agents and MCP

Frontend Engineer agent and quality gate require **Angular CLI MCP**; config in [.cursor/mcp.json](.cursor/mcp.json). See [frontend/Agents.md](frontend/Agents.md) for frontend agents by role.

**Before running `/speckit.plan` or `/speckit.implement` for the chat UI:** Ensure Angular MCP is configured so the plan and implementation can use the quality gate (build, test). Steps:

1. Confirm [.cursor/mcp.json](.cursor/mcp.json) exists and includes the `angular-cli` server with experimental tools `build` and `test`. Cursor does not document a `cwd` option for MCP; the server runs from the project root. When invoking the Angular MCP `build` or `test` tools, run them from the `frontend/` directory (e.g. ensure the active workspace or tool context is `frontend/` once the Angular app exists there), or run `ng build` / `ng test` from `frontend/` in tasks.
2. **Restart Cursor** after creating or editing `.cursor/mcp.json` so the MCP server is loaded.
3. The Angular app will be scaffolded in `frontend/` during implementation; after that, quality-gate commands should be executed from `frontend/` (e.g. `cd frontend && ng build`).

---

_More details (architecture, contracts, contributing) will be added as the project evolves._


## How to contribute

I adopted SDD (Specification, Design, Development, Deployment) approach for this project.

The project is using [spec-kit](https://github.com/github/spec-kit/tree/main) for specification and design to standardize the development process.

Check the [spec-kit](https://github.com/github/spec-kit/tree/main) documentation for more details.


# Caseware AI Chat — Constitution

Single source of truth for principles, standards, boundaries, and workflow. Agent-specific context files (Cursor, Copilot, etc.) must reference this document only—no duplication.

---

## Core Principles

### I. Specification- and design-driven
Specifications and contracts before implementation. Domain clarity, interfaces, and contracts before adapters. Design order: Domain → Boundaries → Contracts → Infrastructure → Implementation.

### II. Clear boundaries
Explicit separation of concerns. Minimal coupling. Dependency inversion. Shared holds types and cross-layer utilities only—no business logic.

### IV. Failure-first and observability
Design for failure and observability from the start. Async and concurrency safety on the backend. Strong typing everywhere.

### V. Simplicity and evolvability
Favor simplicity and determinism. Avoid overengineering, premature abstraction, and trend-driven choices. Evolvability over cleverness.

---

## Tech Stack

| Layer   | Choice           | Notes                                      |
| ------- | ---------------- | ------------------------------------------ |
| Frontend| Angular 20+      | UI client; chat interface.                  |
| Backend | Node.js + Express| Proxy/orchestrator to AI agent (e.g. gh). |
| Shared  | Types + utilities| Cross-layer only; no business logic.        |

---

## JavaScript / TypeScript Standards

- **Strict mode**: `strict: true` (and relevant strict options) in all `tsconfig.json`.
- **Typing**: No `any` without explicit justification; prefer explicit return types for public APIs.
- **Modules**: ES modules; consistent path aliases where agreed (e.g. `@caseware-ai-chat/shared`).
- **Formatting**: One consistent formatter: Prettier. One lint config: ESLint. at repo root; packages inherit.
- **Imports**: Shared is consumed as a workspace dependency (`@caseware-ai-chat/shared`); no relative cross-package imports.    

---

## Monorepo Boundaries

| Package   | Role                          | May depend on      | Must not contain           |
| --------- | ----------------------------- | ------------------ | -------------------------- |
| `frontend`| Chat UI (Angular 20+)         | `shared`           | Backend API logic, shared business logic |
| `backend` | Proxy/orchestrator (Node+Express) | `shared`       | UI code, shared business logic |
| `shared`  | Types, contracts, pure utils  | —                  | Business logic, framework-specific code  |

- **Dependency direction**: `frontend` → `shared`, `backend` → `shared`. No `shared` → `frontend` or `shared` → `backend`. No direct `frontend` ↔ `backend` dependency.
- **Shared contents**: DTOs, API contracts (e.g. request/response shapes), shared constants, pure functions. No Angular/Express imports, no use-case or domain logic.

---

## Git Workflow

- **Default branch**: `main`. Feature work in branches; integrate via pull requests.
- **Branch naming**: Short, descriptive (e.g. `feat/chat-ui`, `fix/backend-proxy`). Optionally align with Spec Kit feature branches (e.g. `001-<feature>`).
- **Commits**: [Conventional Commits](https://www.conventionalcommits.org/) (e.g. `feat:`, `fix:`, `chore:`, `docs:`). Clear, atomic messages.
- **PRs**: Review before merge. Constitution compliance and boundaries checked in review.

---

## Environment Variables

- **No direct `process.env` in code**: Do not read `process.env.*` (or framework equivalents) directly from application code.
- **Exported environment constants**: Centralize env access in a single module per package; export typed constants (e.g. `env.API_URL`, `env.PORT`). All code consumes these exports only.
- **Validate at startup; fail fast**: Before the app serves traffic, validate required variables. If any are missing or invalid, exit immediately with a clear error. No runtime discovery of missing config.

---

## Security Baselines

- **No secrets in source code**: No API keys, tokens, or passwords in repo. Use environment variables or a secrets manager; `.env` and secrets files are gitignored.
- **Sanitize inputs on the backend**: Validate and sanitize all incoming data (body, query, params, headers). Do not trust the client; treat client input as untrusted.
- **Rate limiting**: Apply rate limiting to API endpoints (per IP and/or per identity) to mitigate abuse and DoS.
- **Additional practices** (global): Run dependency audit for known vulnerabilities; do not log secrets or PII; do not expose stack traces or internal errors to the client; configure CORS explicitly (no permissive default).

---

## Tooling & Agent Context

- **This constitution** is the single source of truth for project principles, stack, standards, boundaries, and workflow.
- **Agent-specific files** (e.g. Cursor rules, Copilot instructions): must not duplicate this content. They must reference this document (e.g. “Follow the project constitution at `constitution.md`” or equivalent path). This keeps configuration agent-agnostic and avoids duplication ([Spec Kit guidance](https://github.com/github/spec-kit/discussions/1056)).

---

## Governance

- Constitution supersedes ad-hoc preferences for principles, stack, and boundaries.
- Amendments: document change, get approval, update version and “Last amended” below.
- Reviews and PRs should verify compliance with this document.

**Version**: 1.0.0 | **Ratified**: 2026-02-22 | **Last amended**: —

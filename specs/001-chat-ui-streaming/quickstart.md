# Quickstart: Chat UI (001-chat-ui-streaming)

**Feature**: 001-chat-ui-streaming  
**Branch**: `001-chat-ui-streaming`

## Prerequisites

- Node.js (see [constitution](../../.specify/memory/constitution.md) for version)
- pnpm 9+
- Angular CLI 20+ (e.g. `npx @angular/cli@20`)

## Setup

From repository root:

```bash
pnpm install
```

## Run the frontend (dev)

From repository root, run the frontend app (Angular app lives under `frontend/`):

```bash
cd frontend && pnpm exec ng serve
```

Or from root if a `dev` script is set for the frontend package:

```bash
pnpm --filter @caseware-ai-chat/frontend dev
```

Open the URL shown in the terminal (e.g. `http://localhost:4200`).

## Using the chat UI

- **Connection**: Header shows connection mode (disconnected / retrying / connected). With mock, this may be fixed or toggled for demos.
- **Send message**: Type in the composer, press Send. With mock, a streamed response appears without a real backend.
- **Mock response**: Use the header dropdown to select a mocked response; the conversation shows the mock streamed like a real agent message.
- **Stop**: While a response is streaming, press Stop to cancel; the last typed message is restored in the composer.
- **Retry**: If an error panel appears, press Retry (once enabled) to retry the request.
- **Scroll anchor**: Scroll up, then send a message; use the bottom anchor (loading, then arrow) to scroll back to the latest message.

## Run tests

From `frontend/`:

```bash
cd frontend && pnpm exec ng test
```

Or use the Angular MCP `test` tool from the frontend directory (see [README](../../README.md) for MCP setup). Quality gate requires tests to pass before marking work done.

## Build

From `frontend/`:

```bash
cd frontend && pnpm exec ng build
```

Or use the Angular MCP `build` tool from the frontend directory. Quality gate requires build to pass.

## No backend

This feature uses **mocked** streaming data only. No backend server or API is required. Future integration will replace the mock with a real stream source that conforms to [contracts/mock-stream-api.md](contracts/mock-stream-api.md).

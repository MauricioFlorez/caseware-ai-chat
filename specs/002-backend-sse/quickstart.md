# Quickstart: Backend SSE proxy (002-backend-sse)

**Feature**: Backend layer for real SSE  
**Date**: 2026-02-22  

## Prerequisites

- Node.js 22+
- `gh` CLI installed and authenticated (`gh auth status`)
- Monorepo root has dependencies installed (`npm install` or `pnpm install` from repo root)

## Build and run

From repository root:

```bash
# Install dependencies (if not already)
npm install

# Build shared package (backend depends on it)
cd shared && npm run build && cd ..

# Build backend
cd backend && npm run build

# Start backend (after implementation: e.g. npm run start or node dist/app.js)
# Requires PORT in env or .env; see backend config.
npm run start
```

Default port is defined in `backend/src/config/config.ts` (validate required env before serving).

## Test the endpoint

With backend running and `gh` authenticated:

```bash
curl -X POST http://localhost:<PORT>/api/chat \
  -H "Content-Type: application/json" \
  -H "Accept: text/event-stream" \
  -d '{"message":"What is 2+2?"}' \
  --no-buffer
```

You should see SSE lines: `data: {"type":"delta","text":"..."}` then `data: {"type":"done"}` (or error then done on failure).

## Integration with frontend

1. Start the backend (see above).
2. Start the frontend (e.g. `cd frontend && npm start`).
3. In the chat UI, select **Live** in the header data source.
4. Send a message; the request goes to `POST /api/chat` (frontend uses same origin or proxy; ensure API URL matches backend).

## Quality gate

From `backend/`:

```bash
npm run build
npm test
npm run lint
```

Run before considering the feature done (per backend-engineer agent).

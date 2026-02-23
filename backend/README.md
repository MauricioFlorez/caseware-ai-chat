# Backend — SSE proxy for chat

Node.js + Express proxy: POST /api/chat → spawns `gh copilot`, streams response as SSE. See [AGENTS.md](AGENTS.md) and [docs/architecture/ARCHITECTURE.md](../docs/architecture/ARCHITECTURE.md).

## Prerequisites

- Node.js 22+ (or 18+; engine warning may appear)
- `gh` CLI installed and authenticated (`gh auth status`)
- Build shared first: `cd shared && pnpm run build`

## Build and run

```bash
# From repo root
pnpm install
cd shared && pnpm run build && cd ..
cd backend && pnpm run build

# Required: set PORT (and optional CORS_ORIGIN)
export PORT=3000
pnpm start
```

**Dev workflow:** Run `pnpm run dev` from `backend/` to compile on change and restart the server (TypeScript watch + node watch). Changes in `src/` are reflected without a manual build.

**Copilot CLI invocation:** The backend spawns `gh copilot suggest -- -p "<message>" --allow-all-tools -s`. The `--` is required before Copilot flags; `-p` is the non-interactive prompt; `--allow-all-tools` is required for headless execution; `-s` gives script-friendly stdout. `--no-cache` is not used (unsupported in current CLI).

## Manual test cases

### 1. POST /api/chat — success (SSE stream)

- **Endpoint:** `POST http://localhost:PORT/api/chat`
- **Method:** POST
- **Headers:** `Content-Type: application/json`, `Accept: text/event-stream`
- **Body:** `{"message":"What is 2+2?"}`
- **Expected:** Response 200, body is SSE stream: lines `data: {"type":"delta","text":"..."}` then `data: {"type":"done"}` (or `data: {"type":"error","message":"..."}` then `data: {"type":"done"}` if `gh` fails).
- **How to run:**  
  `curl -X POST http://localhost:3000/api/chat -H "Content-Type: application/json" -H "Accept: text/event-stream" -d '{"message":"What is 2+2?"}' --no-buffer`

### 2. POST /api/chat — invalid body (400)

- **Endpoint:** `POST http://localhost:PORT/api/chat`
- **Body:** `{}` or `{"message":""}` or `{"message": 123}`
- **Expected:** Response 400, JSON `{"error":"message required"}` (or "message must be a string" / "message must not be empty after trim").
- **How to run:**  
  `curl -X POST http://localhost:3000/api/chat -H "Content-Type: application/json" -d '{}'`

### 3. Rate limit (429)

- **Endpoint:** `POST http://localhost:PORT/api/chat` (many times in a short window)
- **Expected:** After limit (e.g. 30 requests per minute per IP), response 429, JSON `{"error":"Too many requests"}`.
- **How to run:** Send more than 30 requests within 60 seconds (e.g. script or repeated curl).

### 4. Missing PORT (startup failure)

- **How to run:** Start the server without setting `PORT`: `cd backend && node dist/index.js`
- **Expected:** Process exits with error (e.g. "Missing or empty required environment variable: PORT").

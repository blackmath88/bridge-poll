# bridge-poll Worker

Cloudflare Worker + Durable Object backend for bridge-poll realtime sessions.

## Endpoints

- `GET /` health check
- `POST /api/session` creates a session and returns `{ "code": "ABC123" }`
- `GET /api/session/:code/ws?role=presenter|participant` upgrades to WebSocket

## WebSocket messages

Clients may send:

```json
{ "type": "response", "stepId": "col1", "text": "Delegate better" }
{ "type": "advance_step", "step": 2 }
{ "type": "clear_step", "stepId": "col1" }
```

The Worker sends the full session snapshot on connect and after each change:

```json
{ "type": "state", "currentStep": 0, "responses": {} }
```

## Run locally

```bash
npm install
npm run dev
```

Set the React app to use the local Worker:

```bash
VITE_API_BASE=http://localhost:8787
```

## Deploy

```bash
npm run deploy
```

Then set `VITE_API_BASE` in the frontend or Cloudflare Pages environment variables to the deployed Worker URL.

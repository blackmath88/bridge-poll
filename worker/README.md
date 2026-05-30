# bridge-poll Worker

Cloudflare Worker + Durable Object backend for bridge-poll realtime sessions.

## Endpoints

- `GET /` health check
- `POST /api/session` creates a session and returns `{ "code": "ABC123", "presenterToken": "..." }`
- `GET /api/session/:code/ws?role=presenter&token=...` upgrades an authorized presenter WebSocket
- `GET /api/session/:code/ws?role=participant` upgrades an anonymous participant WebSocket

## WebSocket messages

Clients may send:

```json
{ "type": "response", "stepId": "col1", "text": "Delegate better" }
{ "type": "advance_step", "step": 2 }
{ "type": "clear_step", "stepId": "col1" }
```

Participants may send `response` without a token. `advance_step` and `clear_step` require a presenter WebSocket connected with the correct session token; unauthorized attempts receive an error and are ignored.

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

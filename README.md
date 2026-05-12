# bridge-poll

A lightweight, self-hosted Mentimeter alternative by [bridge-work.ai](https://bridge-work.ai).

Built for the **Immunity to Change** opening exercise — but designed to be extended for any interactive polling scenario.

## What it does

Presenter shows a question + live word cloud on the big screen. Participants scan a QR code and submit anonymous responses from their phones. Responses appear in real-time.

The default exercise walks through **Kegan & Lahey's 4-column framework**:

1. **Goal** — "What would you like to change?"
2. **Pivot** — Trainer narrates: "You chose these. Now imagine when change is imposed."
3. **Doing instead** — "What do you do instead?"
4. **Protecting** — "What are you also protecting?" (competing commitments)
5. **Assumptions** — "What must be true for this to hold?"
6. **Close** — Atomic habits: start micro, test the assumption

## Architecture

```
frontend/index.html    ← Single-file app (static, host anywhere)
worker/src/index.ts    ← Cloudflare Worker + Durable Object (WebSocket relay)
```

The frontend works in **demo mode** without any backend — useful for testing and rehearsing. Set `API_BASE` in the frontend to connect to the Worker for live multi-device sessions.

## Quick start (demo mode)

Just open `frontend/index.html` in a browser. No server needed. Click "Simulate" to see it in action.

## Deploy for real

### 1. Deploy the Worker

```bash
cd worker
npm install
npx wrangler login          # authenticate with Cloudflare
npx wrangler deploy         # deploys to your CF account
```

Note your Worker URL, e.g. `https://bridge-poll-worker.your-subdomain.workers.dev`

### 2. Configure the frontend

In `frontend/index.html`, find this line near the top of the `<script>`:

```js
const API_BASE = null;  // demo mode
```

Change it to:

```js
const API_BASE = 'https://bridge-poll-worker.your-subdomain.workers.dev';
```

### 3. Host the frontend

Option A — **Cloudflare Pages** (recommended):
```bash
# From repo root
npx wrangler pages deploy frontend/ --project-name bridge-poll
```

Option B — **Your homepage**: Just upload `frontend/index.html` to your web server.

Option C — **Local dev**:
```bash
cd worker
npx wrangler dev            # starts Worker on localhost:8787
# Set API_BASE = 'http://localhost:8787' in frontend
# Open frontend/index.html in browser
```

### 4. Use it

1. Open the page → click **Present** (creates a session)
2. QR code appears — participants scan it
3. Participants type responses → word cloud fills live
4. Advance through steps with **→** button
5. Participants see "Next question" when you advance

## Costs

Cloudflare Workers free tier: 100,000 requests/day, 1,000 Durable Object requests/day. More than enough for training sessions.

## Extending

The `STEPS` array in `index.html` defines the exercise flow. Each step is either:

- `type: 'input'` — shows a question, collects responses in a word cloud
- `type: 'narrate'` — facilitator-only content (no input)
- `type: 'reflect'` — shows cards with key takeaways

To create a new exercise, duplicate the `STEPS` array and modify the questions. The Worker doesn't care about content — it just relays messages.

## License

MIT

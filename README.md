# bridge-poll

A lightweight, self-hosted audience polling tool by [bridge-work.ai](https://bridge-work.ai).

The project is now a Vite + React single page app with a Control Center for managing multiple polls, launching sessions, presenting questions, collecting participant responses, and importing/exporting poll JSON.

## What it does

- Admin Control Center for poll creation, editing, duplication, deletion, JSON import, and JSON export.
- Session launcher with six-character session codes, presenter links, participant links, and QR codes.
- Presenter view at `/present/:sessionId` with step controls, live-style results, stats, simulated responses, and clear controls.
- Participant view at `/join/:sessionId` with a mobile-friendly response flow.
- Local-first storage using `localStorage`, with optional Cloudflare Worker/WebSocket wiring through `VITE_API_BASE`.

## Project structure

```text
src/
  components/      reusable React UI
  pages/           Admin, Presenter, Participant routes
  utils/           schema, storage, import/export, realtime helpers
  assets/          static app assets
public/            static files served by Vite
worker/            Cloudflare Worker + Durable Object backend
index.html         Vite entry point
vite.config.js
package.json
```

The legacy static prototypes are still present as reference files:

- `bridge-poll-admin.html`
- `bridge-poll-v4-final.html`

## Run locally

```bash
npm install && npm run dev
```

Open `http://127.0.0.1:5173` or the URL printed by Vite.

Run the Worker locally in a second terminal:

```bash
cd worker && npm install && npm run dev
```

To connect the frontend to the local Worker, create `.env` in the repo root:

```bash
VITE_API_BASE=http://localhost:8787
```

## Build

```bash
npm run build
```

## Poll JSON shape

```json
{
  "title": "Immunity to Change Exercise",
  "subtitle": "Opening exercise",
  "steps": [
    {
      "type": "input",
      "prompt": "What would you like to change?",
      "placeholder": "Type here..."
    },
    {
      "type": "narrate",
      "prompt": "Now imagine the change is not yours."
    }
  ]
}
```

Supported step types are `input`, `narrate`, and `reflect`.

## Cloudflare Worker

By default the app runs locally with browser storage. The Worker backend lives in `worker/` and implements the realtime contract used by `src/utils/realtime.js`.

The realtime helper preserves the existing protocol shape:

- `POST /api/session`
- `/api/session/:code/ws?role=presenter`
- `/api/session/:code/ws?role=participant`
- WebSocket messages such as `state`, `response`, `advance_step`, and `clear_step`

Deploy the Worker:

```bash
cd worker
npm install
npx wrangler login
npm run deploy
```

After deploy, set the frontend environment variable to the deployed Worker URL:

```bash
VITE_API_BASE=https://YOUR-WORKER.YOUR-SUBDOMAIN.workers.dev
```

For local development, put that value in `.env`. For Cloudflare Pages, set it as a Pages environment variable.

## Cloudflare Pages

This is a client-side routed SPA. The file `public/_redirects` must contain:

```text
/* /index.html 200
```

That redirect lets `/join/:sessionId` and `/present/:sessionId` work after refresh or direct navigation.

Deploy the frontend to Cloudflare Pages:

```bash
npm install
npm run build
npx wrangler pages deploy dist --project-name bridge-poll
```

Cloudflare Pages settings:

- Build command: `npm run build`
- Build output directory: `dist`
- Environment variable: `VITE_API_BASE=https://YOUR-WORKER.YOUR-SUBDOMAIN.workers.dev`

## License

MIT

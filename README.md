# bridge-poll

A lightweight, self-hosted audience polling tool by [bridge-work.ai](https://bridge-work.ai).

The project is now a Vite + React single page app with a Control Center for managing multiple polls, launching sessions, presenting questions, collecting participant responses, and importing/exporting poll JSON.

## What it does

- Admin Control Center for poll creation, editing, duplication, deletion, JSON import, and JSON export.
- Session launcher with four-character session codes, presenter links, participant links, and QR codes.
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
index.html         Vite entry point
vite.config.js
package.json
```

The legacy static prototypes are still present as reference files:

- `bridge-poll-admin.html`
- `bridge-poll-v4-final.html`

## Quick start

```bash
npm install
npm run dev
```

Open `http://127.0.0.1:5173` or the URL printed by Vite.

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

## Cloudflare Worker integration

By default the app runs locally with browser storage. To connect a Worker backend, set:

```bash
VITE_API_BASE=https://bridge-poll-worker.your-subdomain.workers.dev
```

The realtime helper preserves the existing protocol shape:

- `POST /api/session`
- `/api/session/:code/ws?role=presenter`
- `/api/session/:code/ws?role=participant`
- WebSocket messages such as `state`, `response`, `advance_step`, and `clear_step`

## License

MIT

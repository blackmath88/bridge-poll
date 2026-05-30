export interface Env {
  POLL_SESSIONS: DurableObjectNamespace;
}

type PollResponses = Record<string, string[]>;

type ClientMessage =
  | { type: 'response'; stepId?: unknown; text?: unknown }
  | { type: 'advance_step'; step?: unknown }
  | { type: 'clear_step'; stepId?: unknown };

interface SessionSnapshot {
  type: 'state';
  currentStep: number;
  responses: PollResponses;
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function json(data: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...CORS_HEADERS,
      ...init.headers,
    },
  });
}

function createCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  const values = crypto.getRandomValues(new Uint8Array(6));
  for (const value of values) {
    code += alphabet[value % alphabet.length];
  }
  return code;
}

function getSessionCode(pathname: string) {
  const match = pathname.match(/^\/api\/session\/([^/]+)\/ws$/);
  return match ? decodeURIComponent(match[1]).toUpperCase() : null;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    if (request.method === 'GET' && url.pathname === '/') {
      return json({ ok: true, service: 'bridge-poll-worker' });
    }

    if (request.method === 'POST' && url.pathname === '/api/session') {
      const code = createCode();
      const id = env.POLL_SESSIONS.idFromName(code);
      const stub = env.POLL_SESSIONS.get(id);

      await stub.fetch(new Request('https://session.local/init', { method: 'POST' }));
      return json({ code });
    }

    const sessionCode = getSessionCode(url.pathname);
    if (sessionCode) {
      const id = env.POLL_SESSIONS.idFromName(sessionCode);
      const stub = env.POLL_SESSIONS.get(id);
      return stub.fetch(request);
    }

    return json({ error: 'Not found' }, { status: 404 });
  },
};

export class PollSession implements DurableObject {
  private sockets = new Set<WebSocket>();

  constructor(
    private readonly state: DurableObjectState,
    private readonly env: Env,
  ) {
    void this.env;
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === 'POST' && url.pathname === '/init') {
      await this.ensureInitialized();
      return json({ ok: true });
    }

    if (request.headers.get('Upgrade') !== 'websocket') {
      return json({ error: 'Expected WebSocket upgrade' }, { status: 426 });
    }

    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);

    server.accept();
    this.sockets.add(server);

    server.addEventListener('message', (event) => {
      void this.handleMessage(server, event.data);
    });
    server.addEventListener('close', () => this.sockets.delete(server));
    server.addEventListener('error', () => this.sockets.delete(server));

    server.send(JSON.stringify(await this.snapshot()));

    return new Response(null, { status: 101, webSocket: client });
  }

  private async ensureInitialized() {
    const currentStep = await this.state.storage.get<number>('currentStep');
    const responses = await this.state.storage.get<PollResponses>('responses');

    if (typeof currentStep !== 'number') {
      await this.state.storage.put('currentStep', 0);
    }
    if (!responses) {
      await this.state.storage.put('responses', {});
    }
  }

  private async snapshot(): Promise<SessionSnapshot> {
    await this.ensureInitialized();
    return {
      type: 'state',
      currentStep: (await this.state.storage.get<number>('currentStep')) ?? 0,
      responses: (await this.state.storage.get<PollResponses>('responses')) ?? {},
    };
  }

  private async handleMessage(socket: WebSocket, raw: unknown) {
    let message: ClientMessage;
    try {
      message = JSON.parse(String(raw)) as ClientMessage;
    } catch {
      socket.send(JSON.stringify({ type: 'error', error: 'Invalid JSON message' }));
      return;
    }

    if (message.type === 'response') {
      await this.addResponse(message.stepId, message.text);
      await this.broadcastState();
      return;
    }

    if (message.type === 'advance_step') {
      await this.setCurrentStep(message.step);
      await this.broadcastState();
      return;
    }

    if (message.type === 'clear_step') {
      await this.clearStep(message.stepId);
      await this.broadcastState();
    }
  }

  private async addResponse(stepId: unknown, text: unknown) {
    if (typeof stepId !== 'string' || typeof text !== 'string') return;

    const cleanText = text.trim().slice(0, 500);
    if (!cleanText) return;

    const responses = (await this.state.storage.get<PollResponses>('responses')) ?? {};
    responses[stepId] = [...(responses[stepId] ?? []), cleanText];
    await this.state.storage.put('responses', responses);
  }

  private async setCurrentStep(step: unknown) {
    if (typeof step !== 'number' || !Number.isInteger(step) || step < 0) return;
    await this.state.storage.put('currentStep', step);
  }

  private async clearStep(stepId: unknown) {
    if (typeof stepId !== 'string') return;
    const responses = (await this.state.storage.get<PollResponses>('responses')) ?? {};
    responses[stepId] = [];
    await this.state.storage.put('responses', responses);
  }

  private async broadcastState() {
    const payload = JSON.stringify(await this.snapshot());
    for (const socket of this.sockets) {
      try {
        socket.send(payload);
      } catch {
        this.sockets.delete(socket);
      }
    }
  }
}

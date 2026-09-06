import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ImapRelayClient } from './ImapRelayClient';

type Listener = (event: { data?: string }) => void;

class FakeWebSocket {
  static instances: FakeWebSocket[] = [];
  url: string;
  sent: string[] = [];
  readyState = 0;
  private listeners: Record<string, Listener[]> = { open: [], message: [], error: [], close: [] };

  constructor(url: string) {
    this.url = url;
    FakeWebSocket.instances.push(this);
  }

  addEventListener(type: string, handler: Listener): void {
    this.listeners[type]?.push(handler);
  }

  removeEventListener(type: string, handler: Listener): void {
    this.listeners[type] = (this.listeners[type] ?? []).filter((h) => h !== handler);
  }

  send(data: string): void {
    this.sent.push(data);
  }

  close(): void {
    this.readyState = 3;
  }

  triggerOpen(): void {
    this.readyState = 1;
    for (const handler of this.listeners.open ?? []) handler({});
  }

  triggerMessage(payload: unknown): void {
    for (const handler of this.listeners.message ?? []) handler({ data: JSON.stringify(payload) });
  }

  triggerError(): void {
    for (const handler of this.listeners.error ?? []) handler({});
  }

  lastSent(): unknown {
    return JSON.parse(this.sent[this.sent.length - 1] ?? 'null');
  }
}

beforeEach(() => {
  FakeWebSocket.instances = [];
  vi.stubGlobal('WebSocket', FakeWebSocket);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

async function connectedClient(): Promise<{ client: ImapRelayClient; socket: FakeWebSocket }> {
  const client = new ImapRelayClient('ws://localhost:8080');
  const connectPromise = client.connect('someone@gmail.com', 'app-password');
  const socket = FakeWebSocket.instances[0];
  socket.triggerOpen();
  socket.triggerMessage({ type: 'connected' });
  await connectPromise;
  return { client, socket };
}

describe('ImapRelayClient.connect', () => {
  it('sends a connect frame on open and resolves when the relay confirms', async () => {
    const { socket } = await connectedClient();

    expect(socket.lastSent()).toEqual({
      type: 'connect',
      email: 'someone@gmail.com',
      password: 'app-password',
    });
  });

  it('rejects when the relay sends an error frame', async () => {
    const client = new ImapRelayClient('ws://localhost:8080');
    const connectPromise = client.connect('someone@example.com', 'pw');
    const socket = FakeWebSocket.instances[0];
    socket.triggerOpen();
    socket.triggerMessage({ type: 'error', message: 'Unsupported email provider' });

    await expect(connectPromise).rejects.toThrow('Unsupported email provider');
  });

  it('rejects on a WebSocket error event', async () => {
    const client = new ImapRelayClient('ws://localhost:8080');
    const connectPromise = client.connect('someone@gmail.com', 'pw');
    FakeWebSocket.instances[0].triggerError();

    await expect(connectPromise).rejects.toThrow('Could not reach the relay.');
  });
});

describe('ImapRelayClient.fetchMessages', () => {
  it('sends a fetchMessages frame and resolves with the returned items', async () => {
    const { client, socket } = await connectedClient();
    const items = [{ uid: 1, date: '2026-01-01T00:00:00.000Z', from: 'a@example.com', subject: 'Hi', flags: [] }];

    const resultPromise = client.fetchMessages();
    socket.triggerMessage({ type: 'messages', items });

    expect(socket.lastSent()).toEqual({ type: 'fetchMessages' });
    expect(await resultPromise).toEqual(items);
  });
});

describe('ImapRelayClient.fetchBody', () => {
  it('sends a fetchBody frame and resolves with the raw source', async () => {
    const { client, socket } = await connectedClient();

    const resultPromise = client.fetchBody(42);
    socket.triggerMessage({ type: 'body', uid: 42, raw: 'base64source' });

    expect(socket.lastSent()).toEqual({ type: 'fetchBody', uid: 42 });
    expect(await resultPromise).toBe('base64source');
  });

  it('rejects when the relay sends an error frame', async () => {
    const { client, socket } = await connectedClient();

    const resultPromise = client.fetchBody(42);
    socket.triggerMessage({ type: 'error', message: 'Message not found' });

    await expect(resultPromise).rejects.toThrow('Message not found');
  });
});

describe('ImapRelayClient.disconnect', () => {
  it('sends a disconnect frame and closes the socket', async () => {
    const { client, socket } = await connectedClient();

    client.disconnect();

    expect(socket.lastSent()).toEqual({ type: 'disconnect' });
    expect(socket.readyState).toBe(3);
  });
});

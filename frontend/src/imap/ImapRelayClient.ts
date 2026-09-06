import { Logger } from '../lib/Logger';
import type { ClientMessage, MessageSummary, ServerMessage } from './protocol';

const logger = Logger.get('ImapRelayClient');

export class ImapRelayClient {
  private ws: WebSocket | null = null;
  private readonly relayUrl: string;

  constructor(relayUrl: string) {
    this.relayUrl = relayUrl;
  }

  async connect(email: string, password: string): Promise<void> {
    const ws = new WebSocket(this.relayUrl);
    this.ws = ws;

    await new Promise<void>((resolve, reject) => {
      const cleanup = () => {
        ws.removeEventListener('open', handleOpen);
        ws.removeEventListener('message', handleMessage);
        ws.removeEventListener('error', handleError);
      };
      const handleOpen = () => {
        ws.send(JSON.stringify({ type: 'connect', email, password } satisfies ClientMessage));
      };
      const handleMessage = (event: MessageEvent) => {
        const message = parseServerMessage(event);
        if (!message) return;
        if (message.type === 'connected') {
          cleanup();
          resolve();
        } else if (message.type === 'error') {
          cleanup();
          reject(new Error(message.message));
        }
      };
      const handleError = () => {
        cleanup();
        reject(new Error('Could not reach the relay.'));
      };

      ws.addEventListener('open', handleOpen);
      ws.addEventListener('message', handleMessage);
      ws.addEventListener('error', handleError);
    });
  }

  async fetchMessages(): Promise<MessageSummary[]> {
    const response = await this.request({ type: 'fetchMessages' });
    if (response.type !== 'messages') throw new Error('Unexpected response from relay.');
    return response.items;
  }

  async fetchBody(uid: number): Promise<string> {
    const response = await this.request({ type: 'fetchBody', uid });
    if (response.type !== 'body') throw new Error('Unexpected response from relay.');
    return response.raw;
  }

  disconnect(): void {
    if (!this.ws) return;
    try {
      this.ws.send(JSON.stringify({ type: 'disconnect' } satisfies ClientMessage));
    } catch (err) {
      // socket may already be closed; nothing to persist or clean up either way
      logger.debug('Ignoring send failure on disconnect', err);
    }
    this.ws.close();
    this.ws = null;
  }

  // One request in flight at a time this slice — no request-id
  // correlation yet. Fine for the current sequential UI (connect, list,
  // open one message); would need correlation IDs if the UI ever fires
  // concurrent requests.
  private async request(message: ClientMessage): Promise<ServerMessage> {
    const ws = this.ws;
    if (!ws) throw new Error('Not connected.');

    return new Promise<ServerMessage>((resolve, reject) => {
      const handleMessage = (event: MessageEvent) => {
        const parsed = parseServerMessage(event);
        if (!parsed) return;
        ws.removeEventListener('message', handleMessage);
        if (parsed.type === 'error') reject(new Error(parsed.message));
        else resolve(parsed);
      };
      ws.addEventListener('message', handleMessage);
      ws.send(JSON.stringify(message));
    });
  }
}

function parseServerMessage(event: MessageEvent): ServerMessage | null {
  try {
    return JSON.parse(event.data as string) as ServerMessage;
  } catch (err) {
    logger.debug('Ignoring malformed server message', event.data, err);
    return null;
  }
}

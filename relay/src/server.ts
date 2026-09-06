import { createServer } from 'node:http';
import { ImapFlow } from 'imapflow';
import { WebSocketServer, type WebSocket } from 'ws';
import { ImapSession, type ImapFlowFactory } from './ImapSession.js';
import { Logger } from './Logger.js';
import type { ClientMessage, ServerMessage } from './protocol.js';

const logger = Logger.get('server');
const PORT = Number(process.env.PORT ?? 8080);

const createImapFlowClient: ImapFlowFactory = (options) =>
  new ImapFlow({ ...options, logger: false });

function send(ws: WebSocket, message: ServerMessage): void {
  if (ws.readyState === ws.OPEN) {
    ws.send(JSON.stringify(message));
  }
}

async function handleMessage(ws: WebSocket, session: ImapSession, raw: ClientMessage): Promise<void> {
  switch (raw.type) {
    case 'connect':
      await session.connect(raw.email, raw.password);
      send(ws, { type: 'connected' });
      return;
    case 'fetchMessages': {
      const items = await session.fetchMessages();
      send(ws, { type: 'messages', items });
      return;
    }
    case 'fetchBody': {
      const rawBody = await session.fetchBody(raw.uid);
      send(ws, { type: 'body', uid: raw.uid, raw: rawBody });
      return;
    }
    case 'disconnect':
      await session.close();
      return;
  }
}

const httpServer = createServer((_req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('IMAP relay: WebSocket endpoint only.\n');
});

const wss = new WebSocketServer({ server: httpServer });

let nextConnectionId = 1;

wss.on('connection', (ws) => {
  const connectionId = nextConnectionId++;
  const session = new ImapSession(createImapFlowClient);
  logger.info(`Connection ${connectionId} opened`);

  ws.on('message', (data) => {
    void (async () => {
      let parsed: ClientMessage;
      try {
        parsed = JSON.parse(data.toString()) as ClientMessage;
      } catch (err) {
        logger.warn(`Connection ${connectionId}: malformed message`, err);
        send(ws, { type: 'error', message: 'Malformed message' });
        return;
      }

      try {
        await handleMessage(ws, session, parsed);
      } catch (error) {
        logger.error(`Connection ${connectionId}: "${parsed.type}" failed`, error);
        send(ws, { type: 'error', message: error instanceof Error ? error.message : String(error) });
      }
    })();
  });

  ws.on('close', () => {
    logger.info(`Connection ${connectionId} closed`);
    void session.close();
  });
});

httpServer.listen(PORT, () => {
  logger.info(`IMAP relay listening on port ${PORT}`);
});

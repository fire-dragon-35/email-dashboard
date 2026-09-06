import { ImapRelayClient } from './ImapRelayClient';

const relayUrl = import.meta.env.VITE_RELAY_URL;
if (!relayUrl) {
  throw new Error(
    'VITE_RELAY_URL is not set. Copy frontend/.env.example to frontend/.env and fill it in.',
  );
}

export const imapRelayClient = new ImapRelayClient(relayUrl);

import type {
  FetchMessageObject,
  FetchOptions,
  FetchQueryObject,
  MailboxLockObject,
  SearchObject,
} from 'imapflow';
import { Logger } from './Logger.js';
import { resolveImapHost } from './providerHosts.js';
import type { MessageSummary } from './protocol.js';

const logger = Logger.get('ImapSession');

export interface ImapFlowLike {
  connect(): Promise<void>;
  getMailboxLock(path: string): Promise<MailboxLockObject>;
  search(query: SearchObject, options?: { uid?: boolean }): Promise<number[] | false>;
  fetch(
    range: string | number[],
    query: FetchQueryObject,
    options?: FetchOptions,
  ): AsyncIterableIterator<FetchMessageObject>;
  fetchOne(
    seq: string | number,
    query: FetchQueryObject,
    options?: FetchOptions,
  ): Promise<FetchMessageObject | false>;
  logout(): Promise<void>;
  close(): void;
}

export interface ImapFlowOptions {
  host: string;
  port: number;
  secure: boolean;
  auth: { user: string; pass: string };
}

export type ImapFlowFactory = (options: ImapFlowOptions) => ImapFlowLike;

function formatFrom(address: { name?: string; address?: string } | undefined): string {
  if (!address) return '';
  if (address.name && address.address) return `${address.name} <${address.address}>`;
  return address.address ?? address.name ?? '';
}

function toMessageSummary(message: FetchMessageObject): MessageSummary {
  const internalDate = message.internalDate ?? message.envelope?.date ?? new Date();
  return {
    uid: message.uid,
    date: new Date(internalDate).toISOString(),
    from: formatFrom(message.envelope?.from?.[0]),
    subject: message.envelope?.subject ?? '(no subject)',
    flags: [...(message.flags ?? [])],
  };
}

export class ImapSession {
  private client: ImapFlowLike | null = null;
  private readonly createClient: ImapFlowFactory;

  constructor(createClient: ImapFlowFactory) {
    this.createClient = createClient;
  }

  async connect(email: string, password: string): Promise<void> {
    const host = resolveImapHost(email);
    this.client = this.createClient({
      host,
      port: 993,
      secure: true,
      auth: { user: email, pass: password },
    });
    try {
      await this.client.connect();
      logger.info(`Connected ${email} via ${host}`);
    } catch (err) {
      logger.warn(`Failed to connect ${email} via ${host}`, err);
      throw err;
    }
  }

  async fetchMessages(): Promise<MessageSummary[]> {
    if (!this.client) throw new Error('Not connected');
    logger.debug('fetchMessages()');
    const lock = await this.client.getMailboxLock('INBOX');
    try {
      const uids = (await this.client.search({ all: true }, { uid: true })) || [];
      if (uids.length === 0) return [];

      const items: MessageSummary[] = [];
      for await (const message of this.client.fetch(
        uids,
        { uid: true, envelope: true, flags: true, internalDate: true },
        { uid: true },
      )) {
        items.push(toMessageSummary(message));
      }
      return items.sort((a, b) => b.date.localeCompare(a.date));
    } finally {
      lock.release();
    }
  }

  async fetchBody(uid: number): Promise<string> {
    if (!this.client) throw new Error('Not connected');
    logger.debug(`fetchBody(uid=${uid})`);
    const lock = await this.client.getMailboxLock('INBOX');
    try {
      const message = await this.client.fetchOne(uid, { source: true }, { uid: true });
      if (!message || !message.source) throw new Error('Message not found');
      return message.source.toString('base64');
    } finally {
      lock.release();
    }
  }

  async close(): Promise<void> {
    if (!this.client) return;
    try {
      await this.client.logout();
    } catch (err) {
      logger.warn('logout() failed, forcing close()', err);
      this.client.close();
    }
    this.client = null;
  }
}

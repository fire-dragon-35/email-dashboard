import { describe, expect, it, vi } from 'vitest';
import type { FetchMessageObject } from 'imapflow';
import { ImapSession, type ImapFlowLike } from './ImapSession.js';

function fakeMessage(overrides: Partial<FetchMessageObject> = {}): FetchMessageObject {
  return {
    seq: 1,
    uid: overrides.uid ?? 1,
    ...overrides,
  } as FetchMessageObject;
}

function fakeClient(overrides: Partial<ImapFlowLike> = {}): ImapFlowLike {
  const release = vi.fn();
  return {
    connect: vi.fn().mockResolvedValue(undefined),
    getMailboxLock: vi.fn().mockResolvedValue({ path: 'INBOX', release }),
    search: vi.fn().mockResolvedValue([]),
    fetch: vi.fn(),
    fetchOne: vi.fn(),
    logout: vi.fn().mockResolvedValue(undefined),
    close: vi.fn(),
    ...overrides,
  };
}

describe('ImapSession.connect', () => {
  it('derives the host from the email and passes it to the factory', async () => {
    const client = fakeClient();
    const factory = vi.fn().mockReturnValue(client);
    const session = new ImapSession(factory);

    await session.connect('someone@gmail.com', 'app-password');

    expect(factory).toHaveBeenCalledWith({
      host: 'imap.gmail.com',
      port: 993,
      secure: true,
      auth: { user: 'someone@gmail.com', pass: 'app-password' },
    });
    expect(client.connect).toHaveBeenCalledOnce();
  });

  it('rejects for an unsupported provider without calling the factory', async () => {
    const factory = vi.fn();
    const session = new ImapSession(factory);

    await expect(session.connect('someone@example.com', 'pw')).rejects.toThrow(/Unsupported/);
    expect(factory).not.toHaveBeenCalled();
  });
});

describe('ImapSession.fetchMessages', () => {
  it('searches the whole mailbox and fetches every matching UID', async () => {
    const client = fakeClient({
      search: vi.fn().mockResolvedValue([2, 1]),
      fetch: vi.fn().mockImplementation(async function* () {
        yield fakeMessage({ uid: 1, internalDate: new Date('2026-01-01'), envelope: { subject: 'old' } });
        yield fakeMessage({ uid: 2, internalDate: new Date('2026-01-03'), envelope: { subject: 'new' } });
      }),
    });
    const session = new ImapSession(() => client);
    await session.connect('someone@gmail.com', 'pw');

    const result = await session.fetchMessages();

    expect(client.search).toHaveBeenCalledWith({ all: true }, { uid: true });
    expect(client.fetch).toHaveBeenCalledWith(
      [2, 1],
      { uid: true, envelope: true, flags: true, internalDate: true },
      { uid: true },
    );
    expect(result.map((m) => m.subject)).toEqual(['new', 'old']);
  });

  it('returns an empty result without fetching when search finds nothing', async () => {
    const client = fakeClient({ search: vi.fn().mockResolvedValue([]) });
    const session = new ImapSession(() => client);
    await session.connect('someone@gmail.com', 'pw');

    const result = await session.fetchMessages();

    expect(result).toEqual([]);
    expect(client.fetch).not.toHaveBeenCalled();
  });

  it('fetches every UID the search returns, with no cap', async () => {
    const allUids = Array.from({ length: 5000 }, (_, i) => i + 1);
    const client = fakeClient({
      search: vi.fn().mockResolvedValue(allUids),
      fetch: vi.fn().mockImplementation(async function* () {
        // no messages needed to prove the count — just assert the fetch args below
      }),
    });
    const session = new ImapSession(() => client);
    await session.connect('someone@gmail.com', 'pw');

    await session.fetchMessages();

    const [fetchedUids] = (client.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(fetchedUids).toHaveLength(5000);
  });

  it('releases the mailbox lock even if fetch throws', async () => {
    const release = vi.fn();
    const client = fakeClient({
      search: vi.fn().mockResolvedValue([1]),
      getMailboxLock: vi.fn().mockResolvedValue({ path: 'INBOX', release }),
      fetch: vi.fn().mockImplementation(async function* () {
        throw new Error('boom');
        yield; // eslint-disable-line no-unreachable
      }),
    });
    const session = new ImapSession(() => client);
    await session.connect('someone@gmail.com', 'pw');

    await expect(session.fetchMessages()).rejects.toThrow('boom');
    expect(release).toHaveBeenCalledOnce();
  });

  it('throws when not connected', async () => {
    const session = new ImapSession(() => fakeClient());
    await expect(session.fetchMessages()).rejects.toThrow('Not connected');
  });
});

describe('ImapSession.fetchBody', () => {
  it('fetches by UID and base64-encodes the source', async () => {
    const client = fakeClient({
      fetchOne: vi.fn().mockResolvedValue(fakeMessage({ uid: 42, source: Buffer.from('raw email') })),
    });
    const session = new ImapSession(() => client);
    await session.connect('someone@gmail.com', 'pw');

    const result = await session.fetchBody(42);

    expect(client.fetchOne).toHaveBeenCalledWith(42, { source: true }, { uid: true });
    expect(result).toBe(Buffer.from('raw email').toString('base64'));
  });

  it('throws cleanly when the message is not found', async () => {
    const client = fakeClient({ fetchOne: vi.fn().mockResolvedValue(false) });
    const session = new ImapSession(() => client);
    await session.connect('someone@gmail.com', 'pw');

    await expect(session.fetchBody(999)).rejects.toThrow('Message not found');
  });
});

describe('ImapSession.close', () => {
  it('logs out gracefully', async () => {
    const client = fakeClient();
    const session = new ImapSession(() => client);
    await session.connect('someone@gmail.com', 'pw');

    await session.close();

    expect(client.logout).toHaveBeenCalledOnce();
    expect(client.close).not.toHaveBeenCalled();
  });

  it('falls back to close() if logout() throws', async () => {
    const client = fakeClient({ logout: vi.fn().mockRejectedValue(new Error('gone')) });
    const session = new ImapSession(() => client);
    await session.connect('someone@gmail.com', 'pw');

    await session.close();

    expect(client.close).toHaveBeenCalledOnce();
  });

  it('is a no-op when never connected', async () => {
    const session = new ImapSession(() => fakeClient());
    await expect(session.close()).resolves.toBeUndefined();
  });
});

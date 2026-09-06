import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ALL_MAIL_CATEGORY_ID, MailDataProvider, useMailData } from './MailDataContext';

const { fetchMessages } = vi.hoisted(() => ({ fetchMessages: vi.fn() }));

vi.mock('../imap/imapRelayClientSingleton', () => ({
  imapRelayClient: { fetchMessages },
}));

beforeEach(() => {
  fetchMessages.mockReset();
});

function Probe() {
  const data = useMailData();
  return (
    <div>
      <span data-testid="status">{data.status}</span>
      <span data-testid="count">{data.countsByCategory[ALL_MAIL_CATEGORY_ID] ?? 0}</span>
      <span data-testid="categories">{data.categories.map((c) => c.name).join(',')}</span>
    </div>
  );
}

describe('MailDataProvider', () => {
  it('fetches every message with no range and computes category counts', async () => {
    fetchMessages.mockResolvedValue([
      { uid: 1, date: '2026-01-01T10:00:00.000Z', from: 'a@example.com', subject: 'Hi', flags: [] },
      { uid: 2, date: '2026-01-01T12:00:00.000Z', from: 'b@example.com', subject: 'Yo', flags: [] },
      { uid: 3, date: '2026-01-02T09:00:00.000Z', from: 'c@example.com', subject: 'Hey', flags: [] },
    ]);

    render(
      <MailDataProvider>
        <Probe />
      </MailDataProvider>,
    );

    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('ready'));
    expect(screen.getByTestId('count')).toHaveTextContent('3');
    expect(screen.getByTestId('categories')).toHaveTextContent('All Mail');
    expect(fetchMessages).toHaveBeenCalledWith();
  });

  it('sets status to error when the fetch fails', async () => {
    fetchMessages.mockRejectedValue(new Error('boom'));

    render(
      <MailDataProvider>
        <Probe />
      </MailDataProvider>,
    );

    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('error'));
  });

  it('seeds from demoMessages and never calls fetchMessages', async () => {
    render(
      <MailDataProvider
        demoMessages={[
          { uid: 1, date: '2026-01-01T00:00:00.000Z', from: 'a@example.com', subject: 'Hi', flags: [], categoryId: ALL_MAIL_CATEGORY_ID },
        ]}
      >
        <Probe />
      </MailDataProvider>,
    );

    expect(screen.getByTestId('status')).toHaveTextContent('ready');
    expect(screen.getByTestId('count')).toHaveTextContent('1');
    expect(fetchMessages).not.toHaveBeenCalled();
  });

  it('throws when useMailData is used outside a provider', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<Probe />)).toThrow('useMailData must be used within a MailDataProvider');
    consoleError.mockRestore();
  });
});

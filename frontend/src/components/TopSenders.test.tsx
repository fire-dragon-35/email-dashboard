import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { CategorizedMessage } from '../context/MailDataContext';
import { TopSenders } from './TopSenders';

const { useMailData } = vi.hoisted(() => ({ useMailData: vi.fn() }));
vi.mock('../context/MailDataContext', () => ({ useMailData }));

const writeText = vi.fn();
Object.assign(navigator, { clipboard: { writeText } });

function message(overrides: Partial<CategorizedMessage> = {}): CategorizedMessage {
  return {
    uid: 1,
    date: '2026-01-01T00:00:00.000Z',
    from: 'a@example.com',
    subject: 'Hi',
    flags: [],
    categoryId: 'all',
    ...overrides,
  };
}

beforeEach(() => {
  useMailData.mockReset();
  writeText.mockReset().mockResolvedValue(undefined);
});

describe('TopSenders', () => {
  it('shows a loading message while fetching', () => {
    useMailData.mockReturnValue({ status: 'loading', messages: [], selectedCategoryId: 'all' });
    render(<TopSenders />);
    expect(screen.getByText('Loading…')).toBeInTheDocument();
  });

  it('shows an error message on failure', () => {
    useMailData.mockReturnValue({ status: 'error', messages: [], selectedCategoryId: 'all' });
    render(<TopSenders />);
    expect(screen.getByText('Something went wrong fetching your inbox.')).toBeInTheDocument();
  });

  it('shows an empty state when there are no emails', () => {
    useMailData.mockReturnValue({ status: 'ready', messages: [], selectedCategoryId: 'all' });
    render(<TopSenders />);
    expect(screen.getByText('No emails to show yet.')).toBeInTheDocument();
  });

  it('ranks senders by message count, most frequent first', () => {
    useMailData.mockReturnValue({
      status: 'ready',
      selectedCategoryId: 'all',
      messages: [
        message({ uid: 1, from: 'quiet@example.com' }),
        message({ uid: 2, from: 'loud@example.com' }),
        message({ uid: 3, from: 'loud@example.com' }),
        message({ uid: 4, from: 'loud@example.com' }),
      ],
    });
    render(<TopSenders />);

    const names = screen.getAllByText(/@example\.com/).map((el) => el.textContent);
    expect(names).toEqual(['loud@example.com', 'quiet@example.com']);
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('only counts messages in the selected category', () => {
    useMailData.mockReturnValue({
      status: 'ready',
      selectedCategoryId: 'all',
      messages: [
        message({ uid: 1, from: 'in@example.com', categoryId: 'all' }),
        message({ uid: 2, from: 'out@example.com', categoryId: 'other' }),
      ],
    });
    render(<TopSenders />);

    expect(screen.getByText('in@example.com')).toBeInTheDocument();
    expect(screen.queryByText('out@example.com')).not.toBeInTheDocument();
  });

  it('caps the list at the top 8 senders', () => {
    const messages = Array.from({ length: 10 }, (_, i) => message({ uid: i + 1, from: `s${i}@example.com` }));
    useMailData.mockReturnValue({ status: 'ready', selectedCategoryId: 'all', messages });
    render(<TopSenders />);

    expect(screen.getAllByRole('listitem')).toHaveLength(8);
  });

  it('copies the bare address, stripping the display name', async () => {
    useMailData.mockReturnValue({
      status: 'ready',
      selectedCategoryId: 'all',
      messages: [message({ from: 'Newsletter Weekly <hello@newsletterweekly.example>' })],
    });
    render(<TopSenders />);

    fireEvent.click(screen.getByRole('button', { name: /Copy email address/ }));

    await waitFor(() => expect(writeText).toHaveBeenCalledWith('hello@newsletterweekly.example'));
  });

  it('copies a bare address as-is when there is no display name', async () => {
    useMailData.mockReturnValue({
      status: 'ready',
      selectedCategoryId: 'all',
      messages: [message({ from: 'bare@example.com' })],
    });
    render(<TopSenders />);

    fireEvent.click(screen.getByRole('button', { name: /Copy email address/ }));

    await waitFor(() => expect(writeText).toHaveBeenCalledWith('bare@example.com'));
  });

  it('shows "Copied" feedback after a successful copy', async () => {
    useMailData.mockReturnValue({
      status: 'ready',
      selectedCategoryId: 'all',
      messages: [message({ from: 'a@example.com' })],
    });
    render(<TopSenders />);

    fireEvent.click(screen.getByRole('button', { name: /Copy email address/ }));

    await waitFor(() => expect(screen.getByRole('button', { name: /Copy email address/ })).toHaveTextContent('Copied'));
  });

  it('shows "Copy failed" when the clipboard write is rejected', async () => {
    writeText.mockRejectedValue(new Error('denied'));
    useMailData.mockReturnValue({
      status: 'ready',
      selectedCategoryId: 'all',
      messages: [message({ from: 'a@example.com' })],
    });
    render(<TopSenders />);

    fireEvent.click(screen.getByRole('button', { name: /Copy email address/ }));

    await waitFor(() =>
      expect(screen.getByRole('button', { name: /Copy email address/ })).toHaveTextContent('Copy failed'),
    );
  });

  it('shows "Copy failed" instead of hanging forever when the clipboard promise never settles', async () => {
    // Observed for real against a live Clipboard API call: the promise can
    // hang instead of rejecting (e.g. an unresolved permission prompt) —
    // the timeout guard is what prevents the button getting stuck on "Copy".
    vi.useFakeTimers();
    writeText.mockReturnValue(new Promise(() => {}));
    useMailData.mockReturnValue({
      status: 'ready',
      selectedCategoryId: 'all',
      messages: [message({ from: 'a@example.com' })],
    });
    render(<TopSenders />);

    fireEvent.click(screen.getByRole('button', { name: /Copy email address/ }));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000);
    });

    expect(screen.getByRole('button', { name: /Copy email address/ })).toHaveTextContent('Copy failed');
    vi.useRealTimers();
  });
});

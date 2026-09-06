import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { CategorizedMessage } from '../context/MailDataContext';
import { GraphPanel } from './GraphPanel';

const { useMailData } = vi.hoisted(() => ({ useMailData: vi.fn() }));
vi.mock('../context/MailDataContext', () => ({ useMailData }));

function message(overrides: Partial<CategorizedMessage> = {}): CategorizedMessage {
  return {
    uid: 1,
    date: new Date().toISOString(),
    from: 'a@example.com',
    subject: 'Hi',
    flags: [],
    categoryId: 'all',
    ...overrides,
  };
}

beforeEach(() => {
  useMailData.mockReset();
});

describe('GraphPanel', () => {
  it('shows a loading message while fetching', () => {
    useMailData.mockReturnValue({ status: 'loading', messages: [] });
    render(<GraphPanel />);
    expect(screen.getByText('Loading your inbox…')).toBeInTheDocument();
  });

  it('shows an error message on failure', () => {
    useMailData.mockReturnValue({ status: 'error', messages: [] });
    render(<GraphPanel />);
    expect(screen.getByText('Something went wrong fetching your inbox.')).toBeInTheDocument();
  });

  it('shows an empty state when there are no emails', () => {
    useMailData.mockReturnValue({ status: 'ready', messages: [] });
    render(<GraphPanel />);
    expect(screen.getByText('No emails to show yet.')).toBeInTheDocument();
  });

  it('renders the chart container when there is data', () => {
    useMailData.mockReturnValue({ status: 'ready', messages: [message()] });
    const { container } = render(<GraphPanel />);

    expect(container.querySelector('.graph-panel__chart')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Email volume per day, last 30 days' })).toBeInTheDocument();
  });

  it('ignores messages older than the 30-day window', () => {
    const old = new Date();
    old.setDate(old.getDate() - 45);
    useMailData.mockReturnValue({ status: 'ready', messages: [message({ date: old.toISOString() })] });
    render(<GraphPanel />);

    // Still has messages overall, so it renders the chart (all-zero
    // bars), not the "no emails" empty state.
    expect(screen.queryByText('No emails to show yet.')).not.toBeInTheDocument();
  });
});

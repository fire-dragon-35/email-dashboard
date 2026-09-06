import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { CategorizedMessage } from '../context/MailDataContext';
import { EmailList } from './EmailList';

const { useMailData } = vi.hoisted(() => ({ useMailData: vi.fn() }));
vi.mock('../context/MailDataContext', () => ({ useMailData }));

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

function manyMessages(count: number): CategorizedMessage[] {
  return Array.from({ length: count }, (_, i) =>
    message({ uid: i + 1, subject: `Message ${i + 1}`, from: `sender${i}@example.com` }),
  );
}

beforeEach(() => {
  useMailData.mockReset();
});

describe('EmailList', () => {
  it('shows a loading skeleton while fetching', () => {
    useMailData.mockReturnValue({ status: 'loading', messages: [], selectedCategoryId: 'all' });

    render(<EmailList onSelect={vi.fn()} />);

    expect(screen.getByText('Loading your inbox…')).toBeInTheDocument();
  });

  it('shows an error message on fetch failure', () => {
    useMailData.mockReturnValue({ status: 'error', messages: [], selectedCategoryId: 'all' });

    render(<EmailList onSelect={vi.fn()} />);

    expect(screen.getByText('Something went wrong fetching your inbox.')).toBeInTheDocument();
  });

  it('renders messages matching the selected category', () => {
    useMailData.mockReturnValue({
      status: 'ready',
      selectedCategoryId: 'all',
      messages: [message({ uid: 1, subject: 'Hi' }), message({ uid: 2, subject: 'Other', categoryId: 'other' })],
    });

    render(<EmailList onSelect={vi.fn()} />);

    expect(screen.getByText('Hi')).toBeInTheDocument();
    expect(screen.queryByText('Other')).not.toBeInTheDocument();
  });

  it('filters by search text across subject and sender', () => {
    useMailData.mockReturnValue({
      status: 'ready',
      selectedCategoryId: 'all',
      messages: [
        message({ uid: 1, subject: 'Invoice ready', from: 'billing@example.com' }),
        message({ uid: 2, subject: 'Hello', from: 'friend@example.com' }),
      ],
    });

    render(<EmailList onSelect={vi.fn()} />);
    fireEvent.change(screen.getByLabelText('Search subject/from'), { target: { value: 'invoice' } });

    expect(screen.getByText('Invoice ready')).toBeInTheDocument();
    expect(screen.queryByText('Hello')).not.toBeInTheDocument();
  });

  it('shows a message when filters match nothing', () => {
    useMailData.mockReturnValue({
      status: 'ready',
      selectedCategoryId: 'all',
      messages: [message({ uid: 1, subject: 'Hi' })],
    });

    render(<EmailList onSelect={vi.fn()} />);
    fireEvent.change(screen.getByLabelText('Search subject/from'), { target: { value: 'nomatch' } });

    expect(screen.getByText('No emails match these filters.')).toBeInTheDocument();
  });

  it('paginates at 10 per page and navigates between pages', () => {
    useMailData.mockReturnValue({
      status: 'ready',
      selectedCategoryId: 'all',
      messages: manyMessages(25),
    });

    render(<EmailList onSelect={vi.fn()} />);

    expect(screen.getByText('Message 1')).toBeInTheDocument();
    expect(screen.queryByText('Message 11')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Next page' }));

    expect(screen.getByText('Message 11')).toBeInTheDocument();
    expect(screen.queryByText('Message 1')).not.toBeInTheDocument();
  });

  it('resets to page 1 when a filter changes', () => {
    useMailData.mockReturnValue({
      status: 'ready',
      selectedCategoryId: 'all',
      messages: manyMessages(25),
    });

    render(<EmailList onSelect={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Next page' }));
    expect(screen.getByText('Message 11')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Search subject/from'), { target: { value: 'Message' } });

    expect(screen.getByText('Message 1')).toBeInTheDocument();
  });

  it('does not render pagination controls when everything fits on one page', () => {
    useMailData.mockReturnValue({
      status: 'ready',
      selectedCategoryId: 'all',
      messages: manyMessages(5),
    });

    render(<EmailList onSelect={vi.fn()} />);

    expect(screen.queryByRole('navigation', { name: 'Email list pages' })).not.toBeInTheDocument();
  });
});

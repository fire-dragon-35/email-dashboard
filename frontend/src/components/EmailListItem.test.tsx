import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { MessageSummary } from '../imap/protocol';
import { EmailListItem } from './EmailListItem';

const message: MessageSummary = {
  uid: 42,
  date: '2026-01-01T00:00:00.000Z',
  from: 'Jane Doe <jane@example.com>',
  subject: 'Hi',
  flags: [],
};

describe('EmailListItem', () => {
  it('renders the sender and subject', () => {
    render(<EmailListItem message={message} index={0} onSelect={vi.fn()} />);

    expect(screen.getByText('Jane Doe <jane@example.com>')).toBeInTheDocument();
    expect(screen.getByText('Hi')).toBeInTheDocument();
  });

  it('calls onSelect with the message uid when clicked', () => {
    const onSelect = vi.fn();
    render(<EmailListItem message={message} index={0} onSelect={onSelect} />);

    fireEvent.click(screen.getByRole('button'));

    expect(onSelect).toHaveBeenCalledWith(42);
  });
});

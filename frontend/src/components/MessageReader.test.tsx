import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MessageReader } from './MessageReader';

const { fetchBody } = vi.hoisted(() => ({ fetchBody: vi.fn() }));
const { parse } = vi.hoisted(() => ({ parse: vi.fn() }));

vi.mock('../imap/imapRelayClientSingleton', () => ({
  imapRelayClient: { fetchBody },
}));

vi.mock('postal-mime', () => ({
  default: { parse },
}));

beforeEach(() => {
  fetchBody.mockReset();
  parse.mockReset();
});

describe('MessageReader', () => {
  it('renders nothing when no message is selected', () => {
    const { container } = render(<MessageReader uid={null} onClose={vi.fn()} />);

    expect(container).toBeEmptyDOMElement();
  });

  it('fetches the body, parses it, and renders the text content', async () => {
    fetchBody.mockResolvedValue('YmFzZTY0');
    parse.mockResolvedValue({ subject: 'Hello', text: 'Plain text body' });

    render(<MessageReader uid={42} onClose={vi.fn()} />);

    expect(await screen.findByText('Hello')).toBeInTheDocument();
    expect(screen.getByText('Plain text body')).toBeInTheDocument();
    expect(fetchBody).toHaveBeenCalledWith(42);
  });

  it('renders an HTML body inside a sandboxed iframe', async () => {
    fetchBody.mockResolvedValue('YmFzZTY0');
    parse.mockResolvedValue({ subject: 'Hello', html: '<p>hi</p>' });

    render(<MessageReader uid={42} onClose={vi.fn()} />);

    const iframe = await screen.findByTitle('Hello');
    expect(iframe.tagName).toBe('IFRAME');
    expect(iframe).toHaveAttribute('sandbox', '');
  });

  it('shows an error message when loading fails', async () => {
    fetchBody.mockRejectedValue(new Error('boom'));

    render(<MessageReader uid={42} onClose={vi.fn()} />);

    await waitFor(() => expect(screen.getByText('Could not load this message.')).toBeInTheDocument());
  });

  it('calls onClose when the back button is clicked', async () => {
    fetchBody.mockResolvedValue('YmFzZTY0');
    parse.mockResolvedValue({ subject: 'Hello', text: 'Body' });
    const onClose = vi.fn();

    render(<MessageReader uid={42} onClose={onClose} />);
    await screen.findByText('Hello');
    fireEvent.click(screen.getByRole('button', { name: /Back to inbox/ }));

    expect(onClose).toHaveBeenCalledOnce();
  });
});

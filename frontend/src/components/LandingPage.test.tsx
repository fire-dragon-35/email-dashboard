import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LandingPage } from './LandingPage';

const { hasSaved } = vi.hoisted(() => ({ hasSaved: vi.fn() }));
const { connect } = vi.hoisted(() => ({ connect: vi.fn() }));

vi.mock('../credentials/credentialVaultSingleton', () => ({
  credentialVault: { hasSaved },
}));

vi.mock('../imap/imapRelayClientSingleton', () => ({
  imapRelayClient: { connect },
}));

beforeEach(() => {
  hasSaved.mockReset().mockResolvedValue(false);
  connect.mockReset();
});

describe('LandingPage', () => {
  it('shows the logo, trust blurb, and a sample-data demo', () => {
    render(<LandingPage onConnected={vi.fn()} />);

    expect(screen.getByText('Veyra')).toBeInTheDocument();
    expect(screen.getByText(/Open source\. Runs entirely on your machine/)).toBeInTheDocument();
    expect(screen.getByText(/Local, browser-run AI summarization is planned/)).toBeInTheDocument();
    expect(screen.getByText('Sample data')).toBeInTheDocument();
    // The real GraphPanel/EmailList render against SAMPLE_MESSAGES.
    expect(screen.getByText('Email volume — last 30 days')).toBeInTheDocument();
  });

  it('renders the footer', () => {
    render(<LandingPage onConnected={vi.fn()} />);
    expect(screen.getByText(/Veyra © 2026/)).toBeInTheDocument();
  });

  it('opens the Connect card when the Connect button is clicked', async () => {
    render(<LandingPage onConnected={vi.fn()} />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Connect' }));

    expect(await screen.findByRole('dialog', { name: 'Connect your inbox' })).toBeInTheDocument();
  });

  it('auto-opens the Connect card when a saved login exists, no separate quick-unlock screen', async () => {
    hasSaved.mockResolvedValue(true);
    render(<LandingPage onConnected={vi.fn()} />);

    expect(await screen.findByRole('dialog', { name: 'Connect your inbox' })).toBeInTheDocument();
  });

  it('does not auto-open the Connect card when there is no saved login', async () => {
    render(<LandingPage onConnected={vi.fn()} />);

    await waitFor(() => expect(hasSaved).toHaveBeenCalled());
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('the logo closes the Connect card, returning to the plain landing view', async () => {
    render(<LandingPage onConnected={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Connect' }));
    expect(await screen.findByRole('dialog')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Veyra' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('shows "Back to inbox" instead of Connect when already connected, and skips the connect flow', () => {
    render(<LandingPage onBackToInbox={vi.fn()} />);

    expect(screen.queryByRole('button', { name: 'Connect' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Back to inbox' })).toBeInTheDocument();
    expect(hasSaved).not.toHaveBeenCalled();
  });

  it('calls onBackToInbox when "Back to inbox" is clicked', () => {
    const onBackToInbox = vi.fn();
    render(<LandingPage onBackToInbox={onBackToInbox} />);

    fireEvent.click(screen.getByRole('button', { name: 'Back to inbox' }));

    expect(onBackToInbox).toHaveBeenCalledOnce();
  });

  it('the logo does not trigger "Back to inbox" — that is a separate, explicit action', () => {
    const onBackToInbox = vi.fn();
    render(<LandingPage onBackToInbox={onBackToInbox} />);

    fireEvent.click(screen.getByRole('button', { name: 'Veyra' }));

    expect(onBackToInbox).not.toHaveBeenCalled();
  });
});

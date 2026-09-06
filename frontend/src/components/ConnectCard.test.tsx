import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ConnectCard } from './ConnectCard';

const { hasSaved } = vi.hoisted(() => ({ hasSaved: vi.fn() }));

vi.mock('../credentials/credentialVaultSingleton', () => ({
  credentialVault: { hasSaved },
}));

beforeEach(() => {
  hasSaved.mockReset();
});

describe('ConnectCard', () => {
  it('renders nothing when closed, without checking for a saved login', () => {
    const { container } = render(
      <ConnectCard isOpen={false} onClose={vi.fn()} onConnected={vi.fn()} />,
    );

    expect(container).toBeEmptyDOMElement();
    expect(hasSaved).not.toHaveBeenCalled();
  });

  it('shows the fresh login form when there is no saved login', async () => {
    hasSaved.mockResolvedValue(false);
    render(<ConnectCard isOpen={true} onClose={vi.fn()} onConnected={vi.fn()} />);

    expect(await screen.findByLabelText('Email address')).toBeInTheDocument();
  });

  it('shows the unlock form when there is a saved login', async () => {
    hasSaved.mockResolvedValue(true);
    render(<ConnectCard isOpen={true} onClose={vi.fn()} onConnected={vi.fn()} />);

    expect(await screen.findByLabelText('Vault passphrase')).toBeInTheDocument();
  });

  it('re-checks for a saved login every time the card opens', async () => {
    hasSaved.mockResolvedValue(false);
    const { rerender } = render(
      <ConnectCard isOpen={false} onClose={vi.fn()} onConnected={vi.fn()} />,
    );

    rerender(<ConnectCard isOpen={true} onClose={vi.fn()} onConnected={vi.fn()} />);

    await waitFor(() => expect(hasSaved).toHaveBeenCalledOnce());
  });
});

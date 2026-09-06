import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { WrongPassphraseError } from '../credentials/credentialVaultSingleton';
import { UnlockSavedLogin } from './UnlockSavedLogin';

const { load, clear } = vi.hoisted(() => ({ load: vi.fn(), clear: vi.fn() }));
const { connect } = vi.hoisted(() => ({ connect: vi.fn() }));

vi.mock('../credentials/credentialVaultSingleton', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../credentials/credentialVaultSingleton')>();
  return {
    ...actual,
    credentialVault: { load, clear },
  };
});

vi.mock('../imap/imapRelayClientSingleton', () => ({
  imapRelayClient: { connect },
}));

beforeEach(() => {
  load.mockReset();
  clear.mockReset();
  connect.mockReset();
});

function submit(passphrase: string) {
  fireEvent.change(screen.getByLabelText('Vault passphrase'), { target: { value: passphrase } });
  fireEvent.click(screen.getByRole('button', { name: 'Unlock' }));
}

describe('UnlockSavedLogin', () => {
  it('unlocks and connects with the correct passphrase', async () => {
    load.mockResolvedValue({ email: 'me@gmail.com', password: 'app-password' });
    connect.mockResolvedValue(undefined);
    const onConnected = vi.fn();
    render(<UnlockSavedLogin onConnected={onConnected} onForget={vi.fn()} />);

    submit('vault-pass');

    await waitFor(() => expect(onConnected).toHaveBeenCalledWith('me@gmail.com'));
    expect(load).toHaveBeenCalledWith('vault-pass');
    expect(connect).toHaveBeenCalledWith('me@gmail.com', 'app-password');
  });

  it('shows an inline error and does not connect on a wrong passphrase', async () => {
    load.mockRejectedValue(new WrongPassphraseError());
    render(<UnlockSavedLogin onConnected={vi.fn()} onForget={vi.fn()} />);

    submit('wrong-pass');

    expect(await screen.findByText('Incorrect passphrase.')).toBeInTheDocument();
    expect(connect).not.toHaveBeenCalled();
  });

  it('clears the vault and calls onForget when "Forget saved login" is clicked', async () => {
    clear.mockResolvedValue(undefined);
    const onForget = vi.fn();
    render(<UnlockSavedLogin onConnected={vi.fn()} onForget={onForget} />);

    fireEvent.click(screen.getByRole('button', { name: 'Forget saved login' }));

    await waitFor(() => expect(clear).toHaveBeenCalledOnce());
    expect(onForget).toHaveBeenCalledOnce();
  });
});

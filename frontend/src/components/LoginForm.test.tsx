import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LoginForm } from './LoginForm';

const { connect } = vi.hoisted(() => ({ connect: vi.fn() }));
const { save } = vi.hoisted(() => ({ save: vi.fn() }));

vi.mock('../imap/imapRelayClientSingleton', () => ({
  imapRelayClient: { connect },
}));

vi.mock('../credentials/credentialVaultSingleton', () => ({
  credentialVault: { save },
}));

beforeEach(() => {
  connect.mockReset();
  save.mockReset();
  save.mockResolvedValue(undefined);
});

function fillAndSubmit(email: string, password: string) {
  fireEvent.change(screen.getByLabelText('Email address'), { target: { value: email } });
  fireEvent.change(screen.getByLabelText('App password'), { target: { value: password } });
  fireEvent.click(screen.getByRole('button', { name: 'Connect' }));
}

describe('LoginForm', () => {
  it('shows a provider hint once a known domain is typed', () => {
    render(<LoginForm onConnected={vi.fn()} />);

    fireEvent.change(screen.getByLabelText('Email address'), { target: { value: 'me@gmail.com' } });

    expect(screen.getByText(/Detected: Gmail/)).toBeInTheDocument();
  });

  it('calls connect and onConnected on successful submit', async () => {
    connect.mockResolvedValue(undefined);
    const onConnected = vi.fn();
    render(<LoginForm onConnected={onConnected} />);

    fillAndSubmit('me@gmail.com', 'app-password');

    await waitFor(() => expect(onConnected).toHaveBeenCalledWith('me@gmail.com'));
    expect(connect).toHaveBeenCalledWith('me@gmail.com', 'app-password');
  });

  it('shows an inline error when connect fails', async () => {
    connect.mockRejectedValue(new Error('Unsupported email provider'));
    render(<LoginForm onConnected={vi.fn()} />);

    fillAndSubmit('me@example.com', 'pw');

    expect(await screen.findByText('Unsupported email provider')).toBeInTheDocument();
  });

  it('hides the vault passphrase field until "remember" is checked', () => {
    render(<LoginForm onConnected={vi.fn()} />);

    expect(screen.queryByLabelText(/Vault passphrase/)).not.toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('Remember this login on this device'));

    expect(screen.getByLabelText(/Vault passphrase/)).toBeInTheDocument();
  });

  it('saves the credential when "remember" is checked and connect succeeds', async () => {
    connect.mockResolvedValue(undefined);
    const onConnected = vi.fn();
    render(<LoginForm onConnected={onConnected} />);

    fireEvent.click(screen.getByLabelText('Remember this login on this device'));
    fireEvent.change(screen.getByLabelText(/Vault passphrase/), {
      target: { value: 'vault-pass' },
    });
    fillAndSubmit('me@gmail.com', 'app-password');

    await waitFor(() => expect(onConnected).toHaveBeenCalledOnce());
    expect(save).toHaveBeenCalledWith('me@gmail.com', 'app-password', 'vault-pass');
  });

  it('never saves the credential when "remember" is left unchecked', async () => {
    connect.mockResolvedValue(undefined);
    const onConnected = vi.fn();
    render(<LoginForm onConnected={onConnected} />);

    fillAndSubmit('me@gmail.com', 'app-password');

    await waitFor(() => expect(onConnected).toHaveBeenCalledOnce());
    expect(save).not.toHaveBeenCalled();
  });
});

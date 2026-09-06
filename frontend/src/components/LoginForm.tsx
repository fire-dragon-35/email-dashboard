import { useState, type FormEvent } from 'react';
import { credentialVault } from '../credentials/credentialVaultSingleton';
import { imapRelayClient } from '../imap/imapRelayClientSingleton';
import { detectProvider } from '../imap/providerDetection';
import { Logger } from '../lib/Logger';
import { CredentialFields } from './CredentialFields';
import { VaultPassphraseField } from './VaultPassphraseField';

const logger = Logger.get('LoginForm');

interface LoginFormProps {
  onConnected: (email: string) => void;
}

type Status = 'idle' | 'connecting' | 'error';

export function LoginForm({ onConnected }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [vaultPassphrase, setVaultPassphrase] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);

  const provider = detectProvider(email);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setStatus('connecting');
    setError(null);
    try {
      await imapRelayClient.connect(email, password);
      if (remember && vaultPassphrase) {
        try {
          await credentialVault.save(email, password, vaultPassphrase);
        } catch (err) {
          // The login itself succeeded; failing to save it locally isn't
          // worth blocking on.
          logger.warn('Failed to save credential locally', err);
        }
      }
      onConnected(email);
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Could not connect.');
    }
  }

  return (
    <form className="login-form" onSubmit={(e) => void handleSubmit(e)}>
      <CredentialFields
        email={email}
        onEmailChange={setEmail}
        password={password}
        onPasswordChange={setPassword}
      />
      {provider && (
        <p className="login-form__hint">
          Detected: {provider.name}. {provider.note}{' '}
          <a href={provider.appPasswordUrl} target="_blank" rel="noreferrer">
            Generate an app password
          </a>
          .
        </p>
      )}
      <label className="login-form__checkbox">
        <input
          type="checkbox"
          checked={remember}
          onChange={(e) => setRemember(e.target.checked)}
        />
        Remember this login on this device
      </label>
      {remember && <VaultPassphraseField value={vaultPassphrase} onChange={setVaultPassphrase} />}
      <button type="submit" className="login-form__submit" disabled={status === 'connecting'}>
        {status === 'connecting' ? 'Connecting…' : 'Connect'}
      </button>
      {error && <p className="login-form__error">{error}</p>}
    </form>
  );
}

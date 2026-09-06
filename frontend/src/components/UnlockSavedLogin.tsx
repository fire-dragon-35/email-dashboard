import { useState, type FormEvent } from 'react';
import { WrongPassphraseError } from '../credentials/credentialVaultSingleton';
import { credentialVault } from '../credentials/credentialVaultSingleton';
import { imapRelayClient } from '../imap/imapRelayClientSingleton';

interface UnlockSavedLoginProps {
  onConnected: (email: string) => void;
  onForget: () => void;
}

type Status = 'idle' | 'unlocking' | 'error';

export function UnlockSavedLogin({ onConnected, onForget }: UnlockSavedLoginProps) {
  const [passphrase, setPassphrase] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setStatus('unlocking');
    setError(null);
    try {
      const credential = await credentialVault.load(passphrase);
      if (!credential) throw new Error('No saved login found.');
      await imapRelayClient.connect(credential.email, credential.password);
      onConnected(credential.email);
    } catch (err) {
      setStatus('error');
      setError(err instanceof WrongPassphraseError ? err.message : 'Could not unlock this login.');
    }
  }

  async function handleForget() {
    await credentialVault.clear();
    onForget();
  }

  return (
    <form className="login-form" onSubmit={(e) => void handleSubmit(e)}>
      <div className="login-form__field">
        <label htmlFor="unlock-passphrase">Vault passphrase</label>
        <input
          id="unlock-passphrase"
          type="password"
          value={passphrase}
          onChange={(e) => setPassphrase(e.target.value)}
          required
        />
      </div>
      <button type="submit" className="login-form__submit" disabled={status === 'unlocking'}>
        {status === 'unlocking' ? 'Unlocking…' : 'Unlock'}
      </button>
      {error && <p className="login-form__error">{error}</p>}
      <button type="button" className="login-form__forget" onClick={() => void handleForget()}>
        Forget saved login
      </button>
    </form>
  );
}

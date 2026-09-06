import { useEffect, useState } from 'react';
import { credentialVault } from '../credentials/credentialVaultSingleton';
import { LoginForm } from './LoginForm';
import { Modal } from './Modal';
import { UnlockSavedLogin } from './UnlockSavedLogin';

interface ConnectCardProps {
  isOpen: boolean;
  onClose: () => void;
  onConnected: (email: string) => void;
}

export function ConnectCard({ isOpen, onClose, onConnected }: ConnectCardProps) {
  const [hasSavedLogin, setHasSavedLogin] = useState<boolean | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    // eslint-disable-next-line react/set-state-in-effect -- re-checking each time the card opens; not derivable from render
    setHasSavedLogin(null);
    void credentialVault.hasSaved().then((result) => {
      if (!cancelled) setHasSavedLogin(result);
    });
    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Connect your inbox">
      {hasSavedLogin === null ? null : hasSavedLogin ? (
        <UnlockSavedLogin onConnected={onConnected} onForget={() => setHasSavedLogin(false)} />
      ) : (
        <LoginForm onConnected={onConnected} />
      )}
    </Modal>
  );
}

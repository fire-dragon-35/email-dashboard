import { useState } from 'react';
import { PageHeader } from './PageHeader';
import { SettingsPanel } from './SettingsPanel';

interface NavbarProps {
  email: string;
  onDisconnect: () => void;
  onGoToLanding: () => void;
}

export function Navbar({ email, onDisconnect, onGoToLanding }: NavbarProps) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <PageHeader onLogoClick={onGoToLanding}>
      <span className="navbar__identity">Logged in as {email}</span>
      <button type="button" className="navbar__settings" onClick={() => setIsSettingsOpen(true)}>
        ⚙ Settings
      </button>
      <button type="button" className="app__disconnect-button" onClick={onDisconnect}>
        Disconnect
      </button>
      <SettingsPanel isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </PageHeader>
  );
}

import { Modal } from './Modal';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsPanel({ isOpen, onClose }: SettingsPanelProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Settings">
      <p className="settings-panel__status">
        Nothing configurable here yet. Category management is planned once real
        categorization over IMAP is designed — there's no Gmail-label equivalent decided yet.
      </p>
    </Modal>
  );
}

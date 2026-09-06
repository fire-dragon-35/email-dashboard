import type { CSSProperties } from 'react';
import type { MessageSummary } from '../imap/protocol';

interface EmailListItemProps {
  message: MessageSummary;
  index: number;
  onSelect: (uid: number) => void;
}

export function EmailListItem({ message, index, onSelect }: EmailListItemProps) {
  return (
    <li
      className="email-item email-item--enter"
      style={{ '--stagger': index } as CSSProperties}
    >
      <button type="button" className="email-item__row" onClick={() => onSelect(message.uid)}>
        <div className="email-item__meta">
          <span className="email-item__sender">{message.from}</span>
          <span className="email-item__date">{new Date(message.date).toLocaleString()}</span>
        </div>
        <div className="email-item__subject">{message.subject}</div>
      </button>
    </li>
  );
}

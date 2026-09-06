interface TopSenderRowProps {
  sender: string;
  count: number;
  maxCount: number;
  feedback: 'copied' | 'failed' | null;
  onCopy: () => void;
}

export function TopSenderRow({ sender, count, maxCount, feedback, onCopy }: TopSenderRowProps) {
  return (
    <li className="top-senders__item">
      <div className="top-senders__row">
        <span className="top-senders__name" title={sender}>
          {sender}
        </span>
        <button
          type="button"
          className="top-senders__copy"
          onClick={onCopy}
          aria-label={`Copy email address for ${sender}`}
          title="Copy email address"
        >
          {feedback === 'copied' ? 'Copied' : feedback === 'failed' ? 'Copy failed' : 'Copy'}
        </button>
        <span className="top-senders__count">{count}</span>
      </div>
      <div className="top-senders__bar-track">
        <div className="top-senders__bar-fill" style={{ width: `${(count / maxCount) * 100}%` }} />
      </div>
    </li>
  );
}

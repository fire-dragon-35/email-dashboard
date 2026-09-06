import { useId, useMemo, useState } from 'react';
import { useMailData } from '../context/MailDataContext';
import { Logger } from '../lib/Logger';
import { TopSenderRow } from './TopSenderRow';

const logger = Logger.get('TopSenders');
const MAX_SENDERS = 8;
const COPIED_FEEDBACK_MS = 1500;
// The Clipboard API's promise can hang forever instead of rejecting —
// observed in practice (a denied/unresolved permission prompt never
// settles the promise either way). Without a timeout, the button would
// stay stuck on "Copy" with no feedback at all if that happens.
const COPY_TIMEOUT_MS = 3000;

// `from` is often "Display Name <address@example.com>" — copying should
// give back just the address, not the whole formatted header.
function extractEmailAddress(from: string): string {
  const match = /<([^>]+)>/.exec(from);
  return (match ? match[1] : from).trim();
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error('Timed out waiting on the clipboard')), ms);
    }),
  ]);
}

type CopyFeedback = { sender: string; kind: 'copied' | 'failed' };

export function TopSenders() {
  const { status, messages, selectedCategoryId } = useMailData();
  const titleId = useId();
  const [feedback, setFeedback] = useState<CopyFeedback | null>(null);

  const topSenders = useMemo(() => {
    const counts = new Map<string, number>();
    for (const message of messages) {
      if (message.categoryId !== selectedCategoryId) continue;
      counts.set(message.from, (counts.get(message.from) ?? 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, MAX_SENDERS);
  }, [messages, selectedCategoryId]);

  const maxCount = topSenders[0]?.[1] ?? 0;

  async function handleCopy(sender: string) {
    try {
      await withTimeout(navigator.clipboard.writeText(extractEmailAddress(sender)), COPY_TIMEOUT_MS);
      setFeedback({ sender, kind: 'copied' });
    } catch (err) {
      logger.warn('Failed to copy email address to clipboard', err);
      setFeedback({ sender, kind: 'failed' });
    }
    setTimeout(() => {
      setFeedback((current) => (current?.sender === sender ? null : current));
    }, COPIED_FEEDBACK_MS);
  }

  if (status === 'loading') {
    return <p className="top-senders__status">Loading…</p>;
  }
  if (status === 'error') {
    return <p className="top-senders__status">Something went wrong fetching your inbox.</p>;
  }

  return (
    <section className="top-senders" aria-labelledby={titleId}>
      <h2 id={titleId} className="top-senders__title">
        Top senders
      </h2>
      {topSenders.length === 0 ? (
        <p className="top-senders__status">No emails to show yet.</p>
      ) : (
        <ol className="top-senders__list">
          {topSenders.map(([sender, count]) => (
            <TopSenderRow
              key={sender}
              sender={sender}
              count={count}
              maxCount={maxCount}
              feedback={feedback?.sender === sender ? feedback.kind : null}
              onCopy={() => void handleCopy(sender)}
            />
          ))}
        </ol>
      )}
    </section>
  );
}

import { useEffect, useState } from 'react';
import PostalMime from 'postal-mime';
import { imapRelayClient } from '../imap/imapRelayClientSingleton';
import { base64ToBytes } from '../lib/base64';
import { Logger } from '../lib/Logger';

const logger = Logger.get('MessageReader');

interface MessageReaderProps {
  uid: number | null;
  onClose: () => void;
}

type ReaderStatus = 'loading' | 'ready' | 'error';
type ParsedEmail = Awaited<ReturnType<typeof PostalMime.parse>>;

export function MessageReader({ uid, onClose }: MessageReaderProps) {
  const [status, setStatus] = useState<ReaderStatus>('loading');
  const [email, setEmail] = useState<ParsedEmail | null>(null);

  useEffect(() => {
    if (uid === null) return;

    let cancelled = false;
    // eslint-disable-next-line react/set-state-in-effect -- kicks off the loading flag right before the fetch it precedes, not derivable from render
    setStatus('loading');
    setEmail(null);

    async function load() {
      try {
        const raw = await imapRelayClient.fetchBody(uid as number);
        const parsed = await PostalMime.parse(base64ToBytes(raw));
        if (cancelled) return;
        setEmail(parsed);
        setStatus('ready');
      } catch (err) {
        logger.error('Failed to load message body', err);
        if (!cancelled) setStatus('error');
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [uid]);

  if (uid === null) return null;

  return (
    <div className="message-reader">
      <button type="button" className="message-reader__close" onClick={onClose}>
        ← Back to inbox
      </button>
      {status === 'loading' && <p className="message-reader__status">Loading message…</p>}
      {status === 'error' && (
        <p className="message-reader__status">Could not load this message.</p>
      )}
      {status === 'ready' && email && (
        <article>
          <h2 className="message-reader__subject">{email.subject}</h2>
          {email.html ? (
            // Untrusted email HTML — never dangerouslySetInnerHTML. An
            // unscripted, unprivileged sandboxed iframe can't execute JS
            // regardless of what the message contains.
            <iframe
              className="message-reader__body"
              title={email.subject || 'Message body'}
              sandbox=""
              srcDoc={email.html}
            />
          ) : (
            <pre className="message-reader__body message-reader__body--text">{email.text}</pre>
          )}
        </article>
      )}
    </div>
  );
}

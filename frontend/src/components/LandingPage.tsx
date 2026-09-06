import { useEffect, useState } from 'react';
import { credentialVault } from '../credentials/credentialVaultSingleton';
import { MailDataProvider } from '../context/MailDataContext';
import { SAMPLE_MESSAGES } from '../lib/sampleMailData';
import { ConnectCard } from './ConnectCard';
import { EmailList } from './EmailList';
import { Footer } from './Footer';
import { GraphPanel } from './GraphPanel';
import { PageHeader } from './PageHeader';
import { TopSenders } from './TopSenders';

interface LandingPageProps {
  // Pre-connection use: opens the Connect modal.
  onConnected?: (email: string) => void;
  // Already-connected use (reached via the navbar's "Veyra" logo, session
  // still alive): replaces "Connect" with a way back to the inbox instead,
  // and skips the connect flow entirely — there's nothing to connect to,
  // you're already in.
  onBackToInbox?: () => void;
}

function noop() {
  // Demo rows aren't backed by a real relay connection — nothing to open.
}

// Mirrors the real connected dashboard's structure exactly (same card
// chrome, same TopSenders/EmailList layout) so the "try it" preview
// isn't a simplified stand-in — just fed sample data instead of a live
// mailbox. Split out of LandingPage to keep that function under the
// line-count limit.
function LandingDemo() {
  return (
    <section className="landing__demo" aria-label="Interactive preview with sample data">
      <span className="landing__demo-badge">Sample data</span>
      <MailDataProvider demoMessages={SAMPLE_MESSAGES}>
        <div className="app__row">
          <div className="app__chart-col">
            <GraphPanel />
          </div>
          <div className="app__top-senders-col">
            <TopSenders />
          </div>
        </div>
        <main className="app__main app__main--list">
          <EmailList onSelect={noop} />
        </main>
      </MailDataProvider>
    </section>
  );
}

export function LandingPage({ onConnected, onBackToInbox }: LandingPageProps) {
  const [isConnectCardOpen, setIsConnectCardOpen] = useState(false);

  // Pre-connection only: a returning user with a saved login gets the
  // Connect modal (which shows the vault-unlock form, not a fresh login
  // form) opened for them automatically instead of a separate full-page
  // "quick unlock" screen — one connect flow, reached two ways, instead of
  // two different screens doing the same thing.
  useEffect(() => {
    if (onBackToInbox) return;
    let cancelled = false;
    void credentialVault.hasSaved().then((result) => {
      if (!cancelled && result) setIsConnectCardOpen(true);
    });
    return () => {
      cancelled = true;
    };
  }, [onBackToInbox]);

  function handleConnected(email: string) {
    setIsConnectCardOpen(false);
    onConnected?.(email);
  }

  return (
    <div className="landing">
      <PageHeader onLogoClick={() => setIsConnectCardOpen(false)}>
        {onBackToInbox ? (
          <button type="button" className="landing__header-button" onClick={onBackToInbox}>
            Back to inbox
          </button>
        ) : (
          <button
            type="button"
            className="landing__header-button"
            onClick={() => setIsConnectCardOpen(true)}
          >
            Connect
          </button>
        )}
      </PageHeader>

      <p className="landing__trust">
        Open source. Runs entirely on your machine — no cloud storage of your email, ever.
        Local, browser-run AI summarization is planned.
      </p>

      <LandingDemo />

      <Footer />

      {!onBackToInbox && (
        <ConnectCard
          isOpen={isConnectCardOpen}
          onClose={() => setIsConnectCardOpen(false)}
          onConnected={handleConnected}
        />
      )}
    </div>
  );
}

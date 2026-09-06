import { useEffect, useState } from 'react';
import { credentialVault } from '../credentials/credentialVaultSingleton';
import { MailDataProvider } from '../context/MailDataContext';
import { SAMPLE_MESSAGES } from '../lib/sampleMailData';
import { ConnectCard } from './ConnectCard';
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

// A quicker visual proof right under the headline — chart + top senders
// only, no EmailList. Split out of LandingPage to keep that function
// under the line-count limit.
function LandingDemo() {
  return (
    <section className="landing__demo" aria-label="Preview with sample data">
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
      </MailDataProvider>
    </section>
  );
}

function LandingClaims() {
  return (
    <ul className="landing__claims">
      <li>Runs locally in your browser</li>
      <li>Open source</li>
      <li>Local AI summaries, coming soon</li>
      <li>Your data never leaves your browser</li>
    </ul>
  );
}

// Deliberate placeholder — see its CSS comment in App.css — not a
// finished design element yet; the 🪐 is decorative here only, not
// reused as a real icon anywhere else.
function LandingIllustration() {
  return (
    <div className="landing__illustration-placeholder" aria-hidden="true">
      <span className="landing__illustration-placeholder-emoji">🪐</span>
      <span className="landing__illustration-placeholder-caption">Illustration coming soon</span>
    </div>
  );
}

// Matches ARCHITECTURE.md's trust model verbatim in substance, including
// the uncomfortable part: the relay is a real IMAP client that sees
// plaintext for the session, not a byte passthrough. Softening that here
// would make this section a marketing claim instead of a trust statement
// — and it becomes outright false once the relay is hosted rather than
// local (see PRODUCT.md's Azure deployment roadmap). The local-AI line
// stays "coming soon": that feature isn't built.
const HOW_IT_WORKS = [
  'Connects over IMAP with an app password — no OAuth, no third-party login',
  'A local relay service speaks IMAP to your provider on your behalf',
  'The relay sees your mail while connected — nothing stored, nothing logged, torn down when you disconnect',
  'Messages are parsed and kept only in your browser',
  'Optionally save your login, encrypted under a passphrase that is never stored',
  'Local AI summaries via a downloadable in-browser model, coming soon',
];

function LandingHowItWorks() {
  return (
    <section className="landing__how-it-works">
      <h2 className="landing__how-it-works-title">How it works</h2>
      <ul className="landing__how-it-works-grid">
        {HOW_IT_WORKS.map((item) => (
          <li key={item} className="landing__how-it-works-item">
            {item}
          </li>
        ))}
      </ul>
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

      <div className="landing__hero">
        <h1 className="landing__headline">Learn more from your email</h1>
      </div>

      <LandingDemo />
      <LandingClaims />
      <LandingIllustration />
      <LandingHowItWorks />

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

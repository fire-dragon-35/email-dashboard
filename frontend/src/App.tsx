import { useState } from 'react';
import { EmailList } from './components/EmailList';
import { Footer } from './components/Footer';
import { GraphPanel } from './components/GraphPanel';
import { LandingPage } from './components/LandingPage';
import { MessageReader } from './components/MessageReader';
import { Navbar } from './components/Navbar';
import { TopSenders } from './components/TopSenders';
import { MailDataProvider } from './context/MailDataContext';
import { imapRelayClient } from './imap/imapRelayClientSingleton';
import './App.css';

type ConnectedView = 'dashboard' | 'landing';

function App() {
  const [connected, setConnected] = useState(false);
  const [connectedEmail, setConnectedEmail] = useState<string | null>(null);
  const [selectedUid, setSelectedUid] = useState<number | null>(null);
  // Independent of `connected` — lets a connected user browse back to the
  // marketing/demo landing page via the navbar's "Veyra" logo without
  // disconnecting (the WebSocket session and MailDataProvider's fetched
  // data both stay alive).
  const [view, setView] = useState<ConnectedView>('dashboard');

  function handleConnected(email: string) {
    setConnectedEmail(email);
    setConnected(true);
    // Always land in the inbox on a fresh connect, never wherever `view`
    // happened to be left from a previous session.
    setView('dashboard');
  }

  function handleDisconnect() {
    imapRelayClient.disconnect();
    setConnected(false);
    setConnectedEmail(null);
    setSelectedUid(null);
  }

  if (!connected) {
    // LandingPage itself checks for a saved login and opens the Connect
    // modal automatically when one exists — no separate "quick unlock"
    // screen, just the one connect flow reached two ways.
    return <LandingPage onConnected={handleConnected} />;
  }

  return (
    <MailDataProvider>
      {view === 'landing' ? (
        <LandingPage onBackToInbox={() => setView('dashboard')} />
      ) : (
        <div className="app">
          <Navbar
            email={connectedEmail ?? ''}
            onDisconnect={handleDisconnect}
            onGoToLanding={() => setView('landing')}
          />
          <div className="app__row">
            <div className="app__chart-col">
              <GraphPanel />
            </div>
            <div className="app__top-senders-col">
              <TopSenders />
            </div>
          </div>
          <main className="app__main app__main--list">
            {selectedUid !== null ? (
              <MessageReader uid={selectedUid} onClose={() => setSelectedUid(null)} />
            ) : (
              <EmailList onSelect={setSelectedUid} />
            )}
          </main>
          <Footer />
        </div>
      )}
    </MailDataProvider>
  );
}

export default App;

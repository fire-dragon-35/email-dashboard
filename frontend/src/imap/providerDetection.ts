export interface ProviderInfo {
  name: string;
  appPasswordUrl: string;
  note: string;
}

const PROVIDERS: Record<string, ProviderInfo> = {
  'gmail.com': {
    name: 'Gmail',
    appPasswordUrl: 'https://myaccount.google.com/apppasswords',
    note: 'Requires 2-Step Verification to be enabled first.',
  },
  'googlemail.com': {
    name: 'Gmail',
    appPasswordUrl: 'https://myaccount.google.com/apppasswords',
    note: 'Requires 2-Step Verification to be enabled first.',
  },
  'outlook.com': {
    name: 'Outlook',
    appPasswordUrl: 'https://account.live.com/proofs/AppPassword',
    note: 'Security → Advanced security options → App passwords.',
  },
  'hotmail.com': {
    name: 'Outlook',
    appPasswordUrl: 'https://account.live.com/proofs/AppPassword',
    note: 'Security → Advanced security options → App passwords.',
  },
  'live.com': {
    name: 'Outlook',
    appPasswordUrl: 'https://account.live.com/proofs/AppPassword',
    note: 'Security → Advanced security options → App passwords.',
  },
  'yahoo.com': {
    name: 'Yahoo',
    appPasswordUrl: 'https://login.yahoo.com/account/security',
    note: 'Account security → Generate app password.',
  },
};

// Cosmetic only — a UI hint for which provider's app-password page to
// visit. NOT a security boundary: the relay independently derives and
// validates the IMAP host itself from the email domain.
export function detectProvider(email: string): ProviderInfo | null {
  const domain = email.split('@')[1]?.toLowerCase();
  return domain ? (PROVIDERS[domain] ?? null) : null;
}

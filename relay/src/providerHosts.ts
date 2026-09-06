const PROVIDER_HOSTS: Record<string, string> = {
  'gmail.com': 'imap.gmail.com',
  'googlemail.com': 'imap.gmail.com',
  'outlook.com': 'outlook.office365.com',
  'hotmail.com': 'outlook.office365.com',
  'live.com': 'outlook.office365.com',
  'yahoo.com': 'imap.mail.yahoo.com',
};

export function resolveImapHost(email: string): string {
  const domain = email.split('@')[1]?.toLowerCase();
  const host = domain ? PROVIDER_HOSTS[domain] : undefined;
  if (!host) {
    throw new Error(`Unsupported email provider for ${email}`);
  }
  return host;
}

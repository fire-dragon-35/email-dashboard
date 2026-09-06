import { describe, expect, it } from 'vitest';
import { resolveImapHost } from './providerHosts.js';

describe('resolveImapHost', () => {
  it('resolves known providers', () => {
    expect(resolveImapHost('someone@gmail.com')).toBe('imap.gmail.com');
    expect(resolveImapHost('someone@outlook.com')).toBe('outlook.office365.com');
    expect(resolveImapHost('someone@yahoo.com')).toBe('imap.mail.yahoo.com');
  });

  it('is case-insensitive on the domain', () => {
    expect(resolveImapHost('someone@Gmail.COM')).toBe('imap.gmail.com');
  });

  it('throws for an unsupported domain', () => {
    expect(() => resolveImapHost('someone@example.com')).toThrow(/Unsupported/);
  });

  it('throws for a malformed address with no domain', () => {
    expect(() => resolveImapHost('not-an-email')).toThrow(/Unsupported/);
  });
});

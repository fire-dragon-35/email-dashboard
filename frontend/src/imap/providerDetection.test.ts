import { describe, expect, it } from 'vitest';
import { detectProvider } from './providerDetection';

describe('detectProvider', () => {
  it('detects known providers by domain', () => {
    expect(detectProvider('someone@gmail.com')?.name).toBe('Gmail');
    expect(detectProvider('someone@outlook.com')?.name).toBe('Outlook');
    expect(detectProvider('someone@yahoo.com')?.name).toBe('Yahoo');
  });

  it('is case-insensitive on the domain', () => {
    expect(detectProvider('someone@Gmail.COM')?.name).toBe('Gmail');
  });

  it('returns null for an unknown domain', () => {
    expect(detectProvider('someone@example.com')).toBeNull();
  });

  it('returns null for a malformed address', () => {
    expect(detectProvider('not-an-email')).toBeNull();
  });
});

import { describe, expect, it } from 'vitest';
import { decrypt, deriveKey, encrypt } from './crypto';

function randomBytes(length: number): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(length));
}

describe('credentials/crypto', () => {
  it('round-trips a plaintext through encrypt/decrypt with the same derived key', async () => {
    const salt = randomBytes(16);
    const iv = randomBytes(12);
    const key = await deriveKey('correct horse battery staple', salt);

    const ciphertext = await encrypt(key, iv, 'super-secret-app-password');
    const plaintext = await decrypt(key, iv, ciphertext);

    expect(plaintext).toBe('super-secret-app-password');
  });

  it('fails to decrypt when the passphrase is wrong', async () => {
    const salt = randomBytes(16);
    const iv = randomBytes(12);
    const key = await deriveKey('correct horse battery staple', salt);
    const wrongKey = await deriveKey('a different passphrase', salt);

    const ciphertext = await encrypt(key, iv, 'super-secret-app-password');

    await expect(decrypt(wrongKey, iv, ciphertext)).rejects.toThrow();
  });

  it('produces different ciphertext for the same plaintext under a different salt', async () => {
    const iv = randomBytes(12);
    const keyA = await deriveKey('correct horse battery staple', randomBytes(16));
    const keyB = await deriveKey('correct horse battery staple', randomBytes(16));

    const ciphertextA = await encrypt(keyA, iv, 'super-secret-app-password');
    const ciphertextB = await encrypt(keyB, iv, 'super-secret-app-password');

    expect(new Uint8Array(ciphertextA)).not.toEqual(new Uint8Array(ciphertextB));
  });
});

// OWASP 2023 baseline recommendation for PBKDF2-HMAC-SHA256.
export const PBKDF2_ITERATIONS = 600_000;

export async function deriveKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const baseKey = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(passphrase),
    'PBKDF2',
    false,
    ['deriveKey'],
  );

  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: salt as BufferSource, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

export async function encrypt(
  key: CryptoKey,
  iv: Uint8Array,
  plaintext: string,
): Promise<ArrayBuffer> {
  return crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv as BufferSource },
    key,
    new TextEncoder().encode(plaintext),
  );
}

export async function decrypt(
  key: CryptoKey,
  iv: Uint8Array,
  ciphertext: ArrayBuffer,
): Promise<string> {
  const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: iv as BufferSource }, key, ciphertext);
  return new TextDecoder().decode(plaintext);
}

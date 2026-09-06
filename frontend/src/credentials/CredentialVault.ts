import { base64ToBytes, bytesToBase64 } from '../lib/base64';
import { decrypt, deriveKey, encrypt } from './crypto';

const DB_NAME = 'email-dashboard-credentials';
const STORE_NAME = 'credentials';
const RECORD_KEY = 'default';

interface StoredCredential {
  email: string;
  salt: string;
  iv: string;
  ciphertext: string;
}

export class WrongPassphraseError extends Error {
  constructor() {
    super('Incorrect passphrase.');
    this.name = 'WrongPassphraseError';
  }
}

export class CredentialVault {
  private readonly idb: IDBFactory;

  constructor(idb: IDBFactory = globalThis.indexedDB) {
    this.idb = idb;
  }

  async save(email: string, password: string, passphrase: string): Promise<void> {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await deriveKey(passphrase, salt);
    const ciphertext = await encrypt(key, iv, password);

    const record: StoredCredential = {
      email,
      salt: bytesToBase64(salt),
      iv: bytesToBase64(iv),
      ciphertext: bytesToBase64(new Uint8Array(ciphertext)),
    };

    const db = await this.openDb();
    try {
      await runRequest(db.transaction(STORE_NAME, 'readwrite').objectStore(STORE_NAME).put(record, RECORD_KEY));
    } finally {
      db.close();
    }
  }

  async load(passphrase: string): Promise<{ email: string; password: string } | null> {
    const record = await this.getRecord();
    if (!record) return null;

    const key = await deriveKey(passphrase, base64ToBytes(record.salt));
    try {
      const password = await decrypt(
        key,
        base64ToBytes(record.iv),
        base64ToBytes(record.ciphertext).buffer as ArrayBuffer,
      );
      return { email: record.email, password };
    } catch {
      throw new WrongPassphraseError();
    }
  }

  async hasSaved(): Promise<boolean> {
    return (await this.getRecord()) !== null;
  }

  async clear(): Promise<void> {
    const db = await this.openDb();
    try {
      await runRequest(db.transaction(STORE_NAME, 'readwrite').objectStore(STORE_NAME).delete(RECORD_KEY));
    } finally {
      db.close();
    }
  }

  private async getRecord(): Promise<StoredCredential | null> {
    const db = await this.openDb();
    try {
      const result = await runRequest<StoredCredential | undefined>(
        db.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).get(RECORD_KEY),
      );
      return result ?? null;
    } finally {
      db.close();
    }
  }

  private openDb(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = this.idb.open(DB_NAME, 1);
      request.onupgradeneeded = () => {
        request.result.createObjectStore(STORE_NAME);
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error ?? new Error('Failed to open credential vault.'));
    });
  }
}

function runRequest<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('IndexedDB request failed.'));
  });
}

import { IDBFactory } from 'fake-indexeddb';
import { beforeEach, describe, expect, it } from 'vitest';
import { CredentialVault, WrongPassphraseError } from './CredentialVault';

let vault: CredentialVault;

beforeEach(() => {
  vault = new CredentialVault(new IDBFactory());
});

describe('CredentialVault', () => {
  it('reports nothing saved before any save', async () => {
    expect(await vault.hasSaved()).toBe(false);
    expect(await vault.load('whatever')).toBeNull();
  });

  it('round-trips a saved credential with the correct passphrase', async () => {
    await vault.save('me@example.com', 'app-password', 'vault-passphrase');

    expect(await vault.hasSaved()).toBe(true);
    const loaded = await vault.load('vault-passphrase');
    expect(loaded).toEqual({ email: 'me@example.com', password: 'app-password' });
  });

  it('throws WrongPassphraseError for an incorrect passphrase', async () => {
    await vault.save('me@example.com', 'app-password', 'vault-passphrase');

    await expect(vault.load('wrong-passphrase')).rejects.toThrow(WrongPassphraseError);
  });

  it('overwrites the previous record on a second save', async () => {
    await vault.save('me@example.com', 'first-password', 'vault-passphrase');
    await vault.save('someone-else@example.com', 'second-password', 'other-passphrase');

    expect(await vault.load('other-passphrase')).toEqual({
      email: 'someone-else@example.com',
      password: 'second-password',
    });
    await expect(vault.load('vault-passphrase')).rejects.toThrow(WrongPassphraseError);
  });

  it('removes the saved credential on clear', async () => {
    await vault.save('me@example.com', 'app-password', 'vault-passphrase');

    await vault.clear();

    expect(await vault.hasSaved()).toBe(false);
    expect(await vault.load('vault-passphrase')).toBeNull();
  });
});

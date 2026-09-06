import { describe, expect, it } from 'vitest';
import { base64ToBytes, bytesToBase64 } from './base64';

describe('base64', () => {
  it('round-trips arbitrary bytes through base64', () => {
    const original = new Uint8Array([0, 1, 2, 127, 128, 255, 42]);

    const encoded = bytesToBase64(original);
    const decoded = base64ToBytes(encoded);

    expect(decoded).toEqual(original);
  });

  it('round-trips an empty byte array', () => {
    expect(base64ToBytes(bytesToBase64(new Uint8Array()))).toEqual(new Uint8Array());
  });
});

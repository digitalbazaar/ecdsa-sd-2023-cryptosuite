/*!
 * Copyright (c) 2023 Digital Bazaar, Inc. All rights reserved.
 */
import {crypto} from './platform.js';

/**
 * Creates a one-shot hmac interface from a raw or new HMAC key.
 *
 * @param {object} options - The options to use.
 * @param {string} options.algorithm - The key algorithm, e.g., 'HS256'.
 * @param {Uint8Array} options.key - The key or `null` to generate one.
 *
 * @returns {object} The hmac interface.
 */
export async function createHmac({algorithm = 'HS256', key} = {}) {
  if(algorithm !== 'HS256') {
    throw new Error(`Unsupported algorithm "${algorithm}".`);
  }
  if(!(key === null || key instanceof Uint8Array)) {
    throw new TypeError('"key" must be null or a Uint8Array.');
  }

  if(key === null) {
    // generate 32-byte key
    key = await crypto.getRandomValues(new Uint8Array(32));
  }

  // import key as a CryptoKey
  const extractable = true;
  key = await crypto.subtle.importKey(
    'raw', key, {name: 'HMAC', hash: {name: 'SHA-256'}}, extractable,
    ['sign', 'verify']);

  return {
    async export() {
      return new Uint8Array(
        await crypto.subtle.exportKey('raw', key));
    },
    async sign(bytes) {
      return new Uint8Array(
        await crypto.subtle.sign(key.algorithm, key, bytes));
    }
  };
}

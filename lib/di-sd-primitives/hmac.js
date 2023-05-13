/*
 * Copyright (c) 2023 Digital Bazaar, Inc. All rights reserved.
 */
import crypto from 'node:crypto';

/**
 * Creates a one-shot hmac interface from a raw or new HMAC key.
 *
 * @param {object} options - The options to use.
 * @param {string} options.algorithm - The key algorithm, e.g., 'HS256'.
 * @param {Uint8Array} options.key - The key or `null` to generate one.
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

  return {
    async export() {
      return Uint8Array.prototype.slice.call(key);
    },
    async sign(bytes) {
      const hmac = crypto.createHmac('sha256', key);
      return new Uint8Array(hmac.update(bytes).digest());
    }
  };
}

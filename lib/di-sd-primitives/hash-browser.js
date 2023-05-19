/*!
 * Copyright (c) 2023 Digital Bazaar, Inc. All rights reserved.
 */
import {crypto} from './platform.js';

/**
 * Creates a one-shot hasher interface.
 *
 * @param {object} options - The options to use.
 * @param {string} options.algorithm - The key algorithm, e.g., 'sha256'.
 *
 * @returns {object} The hasher interface.
 */
export function createHasher({algorithm = 'sha256'} = {}) {
  if(algorithm !== 'sha256') {
    throw new Error(`Unsupported algorithm "${algorithm}".`);
  }

  return {
    async hash(bytes) {
      return new Uint8Array(await crypto.subtle.digest('SHA-256', bytes));
    }
  };
}

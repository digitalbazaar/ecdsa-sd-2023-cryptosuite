/*!
 * Copyright (c) 2023 Digital Bazaar, Inc. All rights reserved.
 */
import {stringToUtf8Bytes} from './helpers.js';

export async function hashMandatory({mandatory, hasher, hmac, h2} = {}) {
  // 1. Hash mandatory N-Quads in order to produce `h1`.
  const h1 = await hasher.hash(stringToUtf8Bytes(mandatory.join()));

  // 2. If `h2` is not given (revealed case), then produce it using `hmac`.
  if(!h2) {
    h2 = await hmac.sign(h1);
  }

  // 3. Hash concatenated `h1` + `h2`.
  const joined = new Uint8Array(h1.length + h2.length);
  joined.set(h1);
  joined.set(h2, h1.length);
  const combined = await hasher.hash(joined);

  return {combined, h2};
}

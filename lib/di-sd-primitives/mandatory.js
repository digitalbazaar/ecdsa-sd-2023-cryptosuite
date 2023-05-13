/*!
 * Copyright (c) 2023 Digital Bazaar, Inc. All rights reserved.
 */
import {createHasher} from './hash.js';
import {stringToUtf8Bytes} from './helpers.js';

export async function hashMandatory({mandatory, hasher} = {}) {
  if(!hasher) {
    // create default `hasher` if not specified
    hasher = createHasher();
  }

  // 1. Hash mandatory N-Quads in order to produce `mandatoryHash`.
  const mandatoryHash = await hasher.hash(stringToUtf8Bytes(mandatory.join()));
  return {mandatoryHash};
}

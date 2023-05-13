/*!
 * Copyright (c) 2023 Digital Bazaar, Inc. All rights reserved.
 */
import {stringToUtf8Bytes} from './helpers.js';

export async function hashMandatory({mandatory, hasher} = {}) {
  // 1. Hash mandatory N-Quads in order to produce `mandatoryHash`.
  const mandatoryHash = await hasher.hash(stringToUtf8Bytes(mandatory.join()));
  return {mandatoryHash};
}

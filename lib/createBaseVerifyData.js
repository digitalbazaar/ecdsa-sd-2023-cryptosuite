/*!
 * Copyright (c) 2023 Digital Bazaar, Inc. All rights reserved.
 */
import * as EcdsaMultikey from '@digitalbazaar/ecdsa-multikey';
import {canonize} from './canonize.js';
import {name} from './name.js';
import {
  filterMandatory, hashMandatory, hmacCanonize, pointersToFrame
} from './di-sd-primitives/index.js';

export async function createBaseVerifyData({
  cryptosuite, document, proof, documentLoader
}) {
  if(cryptosuite?.name !== name) {
    throw new TypeError(`"cryptosuite.name" must be "${name}".`);
  }
  if(!(cryptosuite.options && typeof cryptosuite.options !== 'object')) {
    throw new TypeError(`"cryptosuite.options" must be an object.`);
  }
  const {mandatoryPointers} = cryptosuite.options;
  if(mandatoryPointers && !Array.isArray(mandatoryPointers)) {
    throw new TypeError(
      `"cryptosuite.options.mandatoryPointers" must be an array.`);
  }

  let mandatoryFrame;
  if(mandatoryPointers) {
    mandatoryFrame = pointersToFrame({pointers: mandatoryPointers});
  }

  // 1. Generate HMAC for randomizing blank node identifiers.
  // FIXME: create SHA-256 HMAC
  const hmac = {};

  // 2. Transform document into array of canonized N-Quads w/randomized bnids.
  const nquads = await hmacCanonize(
    {document, options: {documentLoader}, hmac});

  // 3. Filter mandatory and non-mandatory N-Quads.
  const {mandatory, nonMandatory} = await filterMandatory(
    {nquads, frame: mandatoryFrame, options: {documentLoader}});

  // 4. Hash any mandatory N-Quads.
  let mandatoryHash;
  if(mandatory.length > 0) {
    // FIXME: create SHA-256 hasher
    const hasher = {};
    ({combined: mandatoryHash} = await hashMandatory(
      {mandatory, hasher, hmac}));
  }

  // 5. Export HMAC key.
  // FIXME: implement
  const hmacKey = new Uint8Array();

  // 6. Return verify data.
  return {mandatoryPointers, mandatoryHash, nonMandatory, hmacKey};
}

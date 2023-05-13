/*!
 * Copyright (c) 2023 Digital Bazaar, Inc. All rights reserved.
 */
import {
  createHmac, hashCanonizedProof, hashMandatory, hmacCanonize,
  pointersToFrame, split
} from './di-sd-primitives/index.js';
import {name} from './name.js';

export async function createSignData({
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

  // 1. Generate `proofHash` in parallel.
  const options = {documentLoader};
  const proofHashPromise = hashCanonizedProof({document, proof, options})
    .catch(e => e);

  // 2. Generate HMAC for randomizing blank node identifiers.
  const hmac = await createHmac({key: null});

  // 3. Transform document into array of canonized N-Quads w/randomized bnids.
  const nquads = await hmacCanonize({document, options, hmac});

  // 4. Match mandatory and non-mandatory N-Quads.
  const {matching: mandatory, nonMatching: nonMandatory} = await split(
    {nquads, frame: mandatoryFrame, options});

  // 5. Hash any mandatory N-Quads.
  let mandatoryHash;
  if(mandatory.length > 0) {
    ({mandatoryHash} = await hashMandatory({mandatory}));
  }

  // 6. Export HMAC key.
  const hmacKey = await hmac.export();

  // 7. Return data used by cryptosuite to sign.
  const proofHash = await proofHashPromise;
  if(proofHash instanceof Error) {
    throw proofHash;
  }
  return {mandatoryPointers, mandatoryHash, nonMandatory, hmacKey};
}

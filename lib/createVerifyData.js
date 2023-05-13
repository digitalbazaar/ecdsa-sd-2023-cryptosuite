/*!
 * Copyright (c) 2023 Digital Bazaar, Inc. All rights reserved.
 */
import {hashMandatory, hmacCanonize} from './di-sd-primitives/index.js';
import {name} from './name.js';
import {serializeBaseVerifyData} from './proofValue.js';

export async function createVerifyData({
  cryptosuite, document, proof, documentLoader
}) {
  if(cryptosuite?.name !== name) {
    throw new TypeError(`"cryptosuite.name" must be "${name}".`);
  }
  if(!(cryptosuite.options && typeof cryptosuite.options !== 'object')) {
    throw new TypeError(`"cryptosuite.options" must be an object.`);
  }
  const {baseProof} = cryptosuite.options;
  if(!(baseProof && typeof baseProof !== 'object')) {
    throw new TypeError(`"cryptosuite.options.baseProof" must be an object.`);
  }

  // Verify derived proof needs:
  // 1. canonized with hmac'd labels + mandatory message index map + message
  //    index map => mandatory quads + SD quads (drop any overlap from SD quads)
  // 2. hash mandatory quads in order => h1, hash(h1, revealed_h2)
  // 3. verify SD quads
  // 4. verify main signature (includes mandatory quads verification)

  // FIXME: derive (SD) proof verification steps:
  /*
  1. in parallel, canonize and hash proof
  2. parse SD public key, SD signatures, and 'N' => 'O' label map from
    `proofValue`
  3. verify concatenation of proof hash and SD public key using base key,
    returning early on failure
  4. canonize document to quads (FIXME: sort order might need to be
    communicated in a map unless we want to require sorting by verifier)
  5. replace bnode labels in quads using 'N' => 'O' label map
  6. sort quads (or use additional parsed map?) to sync with SD signature order
  7. in parallel, hash and verify quads against SD signatures w/SD public key
  8. return success
  */

  // 1. Get parameters (e.g., `publicKey`, `signatures`, `h2`) from `proof`.
  const {
    publicKey, signatures, h2, labelMap, mandatoryMap
  } = await _parseDerivedProof({proof});

  // 2. HMAC canonize document using given label map.
  const options = {documentLoader};
  const nquads = await hmacCanonize({document, options, labelMap});

  // 3. Separate N-Quads into mandatory and non-mandatory.
  const mandatory = [];
  const nonMandatory = [];
  for(const [index, nq] of nquads) {
    if(mandatoryMap.has(index)) {
      mandatory.push(nq);
    } else {
      nonMandatory.push(nq);
    }
  }

  // 4. Hash any mandatory N-Quads.
  let mandatoryHash;
  if(mandatory.length > 0) {
    // FIXME: create SHA-256 hasher
    const hasher = {};
    ({combined: mandatoryHash} = await hashMandatory({mandatory, hasher, h2}));
  }

  // 5. Create `verifyData`.
  // FIXME: include `proofHash`
  const proofHash = new Uint8Array(0);
  const verifyData = await serializeBaseVerifyData(
    {publicKey, mandatoryHash, proofHash, signatures});

  return {publicKey, signatures, verifyData};
}

async function _parseDerivedProof({derivedProof}) {
  // FIXME: implement parsing of binary `derivedProof.proofValue`
  const {h2, publicKey} = derivedProof;
  return {h2, publicKey};
}

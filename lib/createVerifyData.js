/*!
 * Copyright (c) 2023 Digital Bazaar, Inc. All rights reserved.
 */
import {
  hashCanonizedProof, hashMandatory, hmacCanonize
} from './di-sd-primitives/index.js';
import {name} from './name.js';
import {parseDisclosureProofValue} from './proofValue.js';

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
  // 2. hash mandatory quads in order => mandatory hash
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

  // 1. Generate `proofHash` in parallel.
  const options = {documentLoader};
  const proofHashPromise = hashCanonizedProof({document, proof, options})
    .catch(e => e);

  // 2. Parse disclosure `proof` to get parameters to verify.
  const {
    baseSignature, publicKey, signatures, labelMap, mandatoryIndexes
  } = await parseDisclosureProofValue({proof});

  // 3. HMAC canonize document using given label map.
  const nquads = await hmacCanonize({document, options, labelMap});

  // 4. Separate N-Quads into mandatory and non-mandatory.
  const mandatory = [];
  const nonMandatory = [];
  for(const [index, nq] of nquads) {
    if(mandatoryIndexes.includes(index)) {
      mandatory.push(nq);
    } else {
      nonMandatory.push(nq);
    }
  }

  // 5. Hash any mandatory N-Quads.
  let mandatoryHash;
  if(mandatory.length > 0) {
    ({mandatoryHash} = await hashMandatory({mandatory}));
  }

  // 6. Return data used by cryptosuite to verify.
  const proofHash = await proofHashPromise;
  if(proofHash instanceof Error) {
    throw proofHash;
  }
  return {
    baseSignature, proofHash, publicKey, signatures, nonMandatory,
    mandatoryHash
  };
}

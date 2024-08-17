/*!
 * Copyright (c) 2023-2024 Digital Bazaar, Inc. All rights reserved.
 */
import {
  createHmac,
  createHmacIdLabelMapFunction,
  hashCanonizedProof,
  hashMandatory,
  labelReplacementCanonicalizeJsonLd,
  selectJsonLd
} from '@digitalbazaar/di-sd-primitives';
import {createVerifier} from './verify.js';
import {name} from './name.js';
import {parseBaseProofValue} from './proofValue.js';
import {requiredAlgorithm} from './requiredAlgorithm.js';

export function createConfirmCryptosuite() {
  return {
    name,
    requiredAlgorithm,
    createVerifier,
    createVerifyData: _createVerifyData
  };
}

async function _createVerifyData({
  cryptosuite, document, proof, documentLoader
}) {
  if(cryptosuite?.name !== name) {
    throw new TypeError(`"cryptosuite.name" must be "${name}".`);
  }

  // 1. Generate `proofHash` in parallel.
  const options = {documentLoader};
  const proofHashPromise = hashCanonizedProof({document, proof, options})
    .catch(e => e);

  // 2. Parse base `proof` to get parameters to verify.
  const {
    baseSignature, hmacKey, publicKey, signatures, mandatoryPointers,
  } = await parseBaseProofValue({proof});

  // 3. Canonicalize document using hmac generated label map.
  const hmac = await createHmac({key: hmacKey});
  const labelMapFactoryFunction = createHmacIdLabelMapFunction({hmac});
  const nquads = await labelReplacementCanonicalizeJsonLd({
    document,
    labelMapFactoryFunction,
    options
  });

  // 4. Regenerate any canonical mandatory N-Quads.
  let mandatory;
  if(mandatoryPointers.length === 0) {
    mandatory = [];
  } else {
    const filteredDocument = await selectJsonLd({
      document,
      pointers: mandatoryPointers
    });
    mandatory = await labelReplacementCanonicalizeJsonLd({
      document: filteredDocument,
      labelMapFactoryFunction,
      options
    });
  }

  // 5. Separate out non-mandatory N-Quads.
  const nonMandatory = nquads.filter(nquad => !mandatory.includes(nquad));

  // 6. Hash any mandatory N-Quads.
  const {mandatoryHash} = await hashMandatory({mandatory});

  // 7. Return data used by cryptosuite to confirm base proof.
  const proofHash = await proofHashPromise;
  if(proofHash instanceof Error) {
    throw proofHash;
  }
  return {
    baseSignature, proofHash, publicKey, signatures, nonMandatory,
    mandatoryHash
  };
}

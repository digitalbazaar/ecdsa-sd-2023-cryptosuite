/*!
 * Copyright (c) 2023 Digital Bazaar, Inc. All rights reserved.
 */
import * as base58 from 'base58-universal';
import * as EcdsaMultikey from '@digitalbazaar/ecdsa-multikey';
import {
  canonicalizeAndGroup,
  createHmac,
  createHmacIdLabelMapFunction,
  hashCanonizedProof,
  hashMandatory,
  stringToUtf8Bytes
} from '@digitalbazaar/di-sd-primitives';
import {
  serializeBaseProofValue,
  serializeBaseVerifyData
} from './proofValue.js';
import {name} from './name.js';
import {requiredAlgorithm} from './requiredAlgorithm.js';

export function createSignCryptosuite({mandatoryPointers = []} = {}) {
  const options = {mandatoryPointers};
  return {
    name,
    requiredAlgorithm,
    createVerifier: _throwSignUsageError,
    createVerifyData: _createSignData,
    createProofValue: _createBaseProofValue,
    options
  };
}

async function _createBaseProofValue({verifyData, dataIntegrityProof}) {
  const {signer} = dataIntegrityProof;
  const {
    proofHash, mandatoryPointers, mandatoryHash, nonMandatory, hmacKey
  } = verifyData;

  // 1. Sign non-mandatory quads using a locally generated key.
  const localKeyPair = await EcdsaMultikey.generate({curve: 'P-256'});
  const {sign} = localKeyPair.signer();
  const signatures = await Promise.all(nonMandatory.map(
    nq => sign({data: stringToUtf8Bytes(nq)})));

  // 2. Create data to be signed. (remove 'z' base58-multibase prefix)
  const publicKey = base58.decode(localKeyPair.publicKeyMultibase.slice(1));
  const toSign = await serializeBaseVerifyData(
    {proofHash, publicKey, mandatoryHash});

  // 3. Sign data.
  const baseSignature = await signer.sign({data: toSign});

  // 4. Generate `proofValue`.
  const proofValue = serializeBaseProofValue({
    baseSignature, publicKey, hmacKey, signatures, mandatoryPointers
  });
  return proofValue;
}

async function _createSignData({
  cryptosuite, document, proof, documentLoader
}) {
  if(cryptosuite?.name !== name) {
    throw new TypeError(`"cryptosuite.name" must be "${name}".`);
  }
  if(!(cryptosuite.options && typeof cryptosuite.options === 'object')) {
    throw new TypeError(`"cryptosuite.options" must be an object.`);
  }
  const {mandatoryPointers = []} = cryptosuite.options;
  if(!Array.isArray(mandatoryPointers)) {
    throw new TypeError(
      `"cryptosuite.options.mandatoryPointers" must be an array.`);
  }

  // 1. Generate `proofHash` in parallel.
  const options = {documentLoader};
  const proofHashPromise = hashCanonizedProof({document, proof, options})
    .catch(e => e);

  // 2. Create HMAC label replacement function to randomize bnode labels.
  const hmac = await createHmac({key: null});
  const labelMapFactoryFunction = createHmacIdLabelMapFunction({hmac});

  // 3. Canonicalize document with randomized bnode labels and group N-Quads
  //  by mandatory pointers.
  const {
    groups: {mandatory: mandatoryGroup}
  } = await canonicalizeAndGroup({
    document,
    labelMapFactoryFunction,
    groups: {mandatory: mandatoryPointers},
    options
  });
  const mandatory = [...mandatoryGroup.matching.values()];
  const nonMandatory = [...mandatoryGroup.nonMatching.values()];

  // 4. Hash any mandatory N-Quads.
  const {mandatoryHash} = await hashMandatory({mandatory});

  // 5. Export HMAC key.
  const hmacKey = await hmac.export();

  // 6. Return data used by cryptosuite to sign.
  const proofHash = await proofHashPromise;
  if(proofHash instanceof Error) {
    throw proofHash;
  }
  return {proofHash, mandatoryPointers, mandatoryHash, nonMandatory, hmacKey};
}

function _throwSignUsageError() {
  throw new Error('This cryptosuite must only be used with "sign".');
}

/*!
 * Copyright (c) 2023 Digital Bazaar, Inc. All rights reserved.
 */
import * as base58 from 'base58-universal';
import * as base64url from 'base64url-universal';
import * as EcdsaMultikey from '@digitalbazaar/ecdsa-multikey';
import {
  createHmac, hashCanonizedProof, hashMandatory, hmacIdCanonize,
  pointersToFrame, split, stringToUtf8Bytes
} from './di-sd-primitives/index.js';
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

  // 2. Create data to be signed.
  const publicKey = base58.decode(localKeyPair.publicKeyMultibase);
  const toSign = await serializeBaseVerifyData(
    {proofHash, publicKey, mandatoryHash});

  // 3. Sign data.
  const baseSignature = await signer.sign({data: toSign});

  // 4. Generate `proofValue`.
  const proofValue = serializeBaseProofValue({
    baseSignature, publicKey, hmacKey, signatures, mandatoryPointers
  });
  return `u${base64url.encode(proofValue)}`;
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
  if(mandatoryPointers && !Array.isArray(mandatoryPointers)) {
    throw new TypeError(
      `"cryptosuite.options.mandatoryPointers" must be an array.`);
  }

  let mandatoryFrame;
  if(mandatoryPointers) {
    mandatoryFrame = pointersToFrame({document, pointers: mandatoryPointers});
  }

  // 1. Generate `proofHash` in parallel.
  const options = {documentLoader};
  const proofHashPromise = hashCanonizedProof({document, proof, options})
    .catch(e => e);

  // 2. Generate HMAC for randomizing blank node identifiers.
  const hmac = await createHmac({key: null});

  // 3. Transform document into array of canonized N-Quads w/randomized bnids.
  const nquads = await hmacIdCanonize({document, options, hmac});

  // 4. Match mandatory and non-mandatory N-Quads.
  const [mandatory, nonMandatory] = await split(
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
  return {proofHash, mandatoryPointers, mandatoryHash, nonMandatory, hmacKey};
}

function _throwSignUsageError() {
  throw new Error('This cryptosuite must only be used with "sign".');
}

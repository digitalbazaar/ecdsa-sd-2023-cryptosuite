/*!
 * Copyright (c) 2023 Digital Bazaar, Inc. All rights reserved.
 */
import * as base58 from 'base58-universal';
import * as EcdsaMultikey from '@digitalbazaar/ecdsa-multikey';
import {
  createLabelMapFunction,
  hashCanonizedProof,
  hashMandatory,
  labelReplacementCanonicalizeJsonLd,
  stringToUtf8Bytes
} from '@digitalbazaar/di-sd-primitives';
import {
  parseDisclosureProofValue, serializeBaseVerifyData
} from './proofValue.js';
import {name} from './name.js';
import {requiredAlgorithm} from './requiredAlgorithm.js';

export function createVerifyCryptosuite() {
  return {
    name,
    requiredAlgorithm,
    createVerifier,
    createVerifyData: _createVerifyData
  };
}

export async function createVerifier({verificationMethod}) {
  const key = await EcdsaMultikey.from(verificationMethod);
  const verifier = key.verifier();
  return {
    algorithm: verifier.algorithm,
    id: verifier.id,
    // `data` includes `signature` in this cryptosuite
    async verify({data}) {
      return _multiverify({verifier, data});
    }
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

  // 2. Parse disclosure `proof` to get parameters to verify.
  const {
    baseSignature, publicKey, signatures, labelMap, mandatoryIndexes
  } = await parseDisclosureProofValue({proof});

  // 3. Canonicalize document using label map.
  const labelMapFactoryFunction = await createLabelMapFunction({labelMap});
  const nquads = await labelReplacementCanonicalizeJsonLd(
    {document, labelMapFactoryFunction, options});

  // 4. Separate N-Quads into mandatory and non-mandatory.
  const mandatory = [];
  const nonMandatory = [];
  for(const [index, nq] of nquads.entries()) {
    if(mandatoryIndexes.includes(index)) {
      mandatory.push(nq);
    } else {
      nonMandatory.push(nq);
    }
  }

  // 5. Hash any mandatory N-Quads.
  const {mandatoryHash} = await hashMandatory({mandatory});

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

async function _multiverify({verifier, data} = {}) {
  const {
    baseSignature, proofHash, publicKey, signatures,
    nonMandatory, mandatoryHash
  } = data;

  // 1. Import `publicKey`.
  const publicKeyMultibase = 'z' + base58.encode(publicKey);
  const localKeyPair = await EcdsaMultikey.from({publicKeyMultibase});

  // 2. Verify all signatures.
  if(signatures.length !== nonMandatory.length) {
    throw new Error(
      `Signature count (${signatures.length}) does not match ` +
      `non-mandatory message count (${nonMandatory.length}).`);
  }
  const {verify} = localKeyPair.verifier();
  const results = await Promise.all(signatures.map(
    (signature, index) => verify({
      data: stringToUtf8Bytes(nonMandatory[index]),
      signature
    })));
  if(results.some(r => !r)) {
    return false;
  }

  // 3. Verify base signature.
  const toVerify = await serializeBaseVerifyData(
    {proofHash, publicKey, mandatoryHash});
  return verifier.verify({data: toVerify, signature: baseSignature});
}

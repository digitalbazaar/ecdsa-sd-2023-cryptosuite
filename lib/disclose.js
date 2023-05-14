/*!
 * Copyright (c) 2023 Digital Bazaar, Inc. All rights reserved.
 */
import * as base64url from 'base64url-universal';
import {
  createHmac, filterAndSplit, hmacIdCanonize, pointersToFrame
} from './di-sd-primitives/index.js';
import {
  parseBaseProofValue, serializeDisclosureProofValue
} from './proofValue.js';
import jsonld from 'jsonld';
import {name} from './name.js';
import {requiredAlgorithm} from './requiredAlgorithm.js';

export function createDiscloseCryptosuite({
  proofId, selectivePointers = []
} = {}) {
  const options = {proofId, selectivePointers};
  return {
    name,
    requiredAlgorithm,
    createVerifier: _throwDeriveUsageError,
    createVerifyData: _throwDeriveUsageError,
    createProofValue: _throwDeriveUsageError,
    derive: _derive,
    options
  };
}

async function _createDisclosureData({
  cryptosuite, document, proof, documentLoader
}) {
  if(cryptosuite?.name !== name) {
    throw new TypeError(`"cryptosuite.name" must be "${name}".`);
  }
  if(!(cryptosuite.options && typeof cryptosuite.options === 'object')) {
    throw new TypeError(`"cryptosuite.options" must be an object.`);
  }

  // Create derived proof needs:
  // * canonized with hmac'd labels + frame (reveal doc)
  // * canonized with hmac'd labels + skolemized + frame (mandatory fields)
  // * canonized with hmac'd labels + skolemized + frame (message index map)
  // * toRDF skolemized mandatory fields frame (mandatory message indexes)
  // * toRDF skolemized frame (message index map)

  // 1. Parse base `proof` to get parameters for disclosure proof.
  const {
    baseSignature, publicKey, hmacKey, signatures, mandatoryPointers
  } = await parseBaseProofValue({proof});

  // 2. Create HMAC API from `hmacKey`.
  const hmac = await createHmac({key: hmacKey});

  // 3. Transform document into array of canonized N-Quads w/randomized bnids.
  const options = {documentLoader};
  const nquads = await hmacIdCanonize({document, options, hmac});

  // 4. Product mandatory frame and combined frame from pointers.
  const {selectivePointers = []} = cryptosuite.options;
  const mandatoryFrame = pointersToFrame({pointers: mandatoryPointers});
  const combinedFrame = pointersToFrame(
    {pointers: mandatoryPointers.concat(selectivePointers)});

  // 5. In parallel, frame to produce reveal document, split N-Quads into
  //   mandatory and non-mandatory N-Quads, and get blank node label map.
  const [revealDoc, {labelMap/*, split, filteredMap*/}] = await Promise.all([
    jsonld.frame(document, combinedFrame, options),
    filterAndSplit({
      nquads, filterFrame: combinedFrame, splitFrame: mandatoryFrame, options
    })
  ]);
  // FIXME: need matching indexes for (from original `nquads`) for both the
  // `mandatory` and `nonMandatory` quads in order to select signatures and
  // build a list of relative mandatory indexes to include in the proof data
  const mandatoryIndexes = new Map();
  // FIXME: notably, the mandatory N-Quads and non-mandatory N-Quads themselves
  // aren't actually needed here
  //const [mandatory, nonMandatory] = split;

  // 6. Filter signatures from `baseProof` using matching indexes.
  // FIXME: actually filter
  const filteredSignatures = signatures.map(s => s);

  // 7. Return data used by cryptosuite to disclose.
  return {
    baseSignature, publicKey, signatures: filteredSignatures,
    labelMap, mandatoryIndexes,
    revealDoc
  };
}

async function _derive({
  cryptosuite, document, /*purpose,*/ proofSet,
  documentLoader, dataIntegrityProof
}) {
  // find matching base `proof` in `proofSet`
  const {options: {proofId}} = cryptosuite;
  const baseProof = _findProof({proofId, proofSet, dataIntegrityProof});

  // FIXME: ensure `purpose` matches `baseProof`

  // generate data for disclosure
  const {
    baseSignature, publicKey, signatures, labelMap, mandatoryIndexes, revealDoc
  } = await _createDisclosureData(
    {cryptosuite, document, proof: baseProof, documentLoader});

  // create new disclosure proof
  const newProof = {...baseProof};
  const proofValue = await serializeDisclosureProofValue(
    {baseSignature, publicKey, signatures, labelMap, mandatoryIndexes});
  newProof.proofValue = `u${base64url.encode(proofValue)}`;

  // attach proof to reveal doc and return it
  revealDoc.proof = newProof;
  return revealDoc;
}

function _findProof({proofId, proofSet, dataIntegrityProof}) {
  let proof;
  if(proofId) {
    proof = proofSet.find(p => p.id === proofId);
  } else {
    // no `proofId` given, so see if a single matching proof exists
    for(const p of proofSet) {
      if(proof) {
        throw new Error(
          'Multiple matching proofs; a "proofId" must be specified.');
      }
      if(dataIntegrityProof.matchProof({proof: p})) {
        proof = p;
      }
    }
  }
  if(!proof) {
    throw new Error(
      'No matching base proof found from which to derive a disclosure proof.');
  }
  return proof;
}

function _throwDeriveUsageError() {
  throw new Error('This cryptosuite must only be used with "derive".');
}

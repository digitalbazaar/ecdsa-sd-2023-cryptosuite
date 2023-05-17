/*!
 * Copyright (c) 2023 Digital Bazaar, Inc. All rights reserved.
 */
import * as base64url from 'base64url-universal';
import {
  createHmac, filterAndGroup, frame, hmacIdCanonize, pointersToFrame
} from './di-sd-primitives/index.js';
import {
  parseBaseProofValue, serializeDisclosureProofValue
} from './proofValue.js';
import {name} from './name.js';
import {requiredAlgorithm} from './requiredAlgorithm.js';

const VC_CTX_V1 = 'https://www.w3.org/2018/credentials/v1';
const VC_CTX_V2 = 'https://www.w3.org/ns/credentials/v2';

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

  // 4. Produce mandatory frame and combined frame from pointers.
  const {selectivePointers = []} = cryptosuite.options;
  const mandatoryFrame = pointersToFrame(
    {document, pointers: mandatoryPointers});
  const combinedFrame = pointersToFrame(
    {document, pointers: mandatoryPointers.concat(selectivePointers)});
  if(!mandatoryFrame && !combinedFrame) {
    throw new Error('Nothing selected for disclosure.');
  }

  // 5. In parallel, frame to produce reveal document, split N-Quads into
  //   mandatory and non-mandatory groups, and get blank node label map.
  const [
    revealDoc,
    // get mandatory N-Quads using filtered index map (relative indexes will
    // be used) and non-mandatory using total index map (absolute indexes
    // will be used)
    {labelMap, filtered: {matching: mandatory}, nonMatching: nonMandatory}
  ] = await Promise.all([
    frame(document, combinedFrame, options),
    filterAndGroup({
      nquads, filterFrame: combinedFrame, groupFrame: mandatoryFrame, options
    })
  ]);

  // 6. Get list of relative mandatory indexes to include in the proof data
  const mandatoryIndexes = [...mandatory.keys()];

  // 7. Filter signatures from `baseProof` using matching non-mandatory
  //   absolute indexes.
  const filteredSignatures = signatures.filter((s, i) => nonMandatory.has(i));

  // 8. Return data used by cryptosuite to disclose.
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

  // attach proof to reveal doc w/o context
  delete newProof['@context'];
  revealDoc.proof = newProof;

  // special treatment of `credentialSubject` for VCs
  if(_isVC(revealDoc) && typeof revealDoc.credentialSubject === 'string') {
    revealDoc.credentialSubject = {id: revealDoc.credentialSubject};
  }

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

function _isVC(document) {
  const context = document['@context'];
  if(Array.isArray(context)) {
    return context.includes(VC_CTX_V1) || context.includes(VC_CTX_V2);
  }
  return context === VC_CTX_V1 || context == VC_CTX_V2;
}

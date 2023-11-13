/*!
 * Copyright (c) 2023 Digital Bazaar, Inc. All rights reserved.
 */
import {
  canonicalize,
  canonicalizeAndGroup,
  createHmac,
  createHmacIdLabelMapFunction,
  selectJsonLd,
  stripBlankNodePrefixes
} from '@digitalbazaar/di-sd-primitives';
import {
  parseBaseProofValue, serializeDisclosureProofValue
} from './proofValue.js';
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

  // 1. Parse base `proof` to get parameters for disclosure proof.
  const {
    baseSignature, publicKey, hmacKey, signatures, mandatoryPointers
  } = await parseBaseProofValue({proof});

  // 2. Ensure mandatory and / or selective data will be disclosed.
  const {selectivePointers = []} = cryptosuite.options;
  if(!(mandatoryPointers?.length > 0 || selectivePointers?.length > 0)) {
    throw new Error('Nothing selected for disclosure.');
  }

  // 3. Create HMAC label replacement function from `hmacKey` to randomize
  //   bnode identifiers.
  const hmac = await createHmac({key: hmacKey});
  const labelMapFactoryFunction = createHmacIdLabelMapFunction({hmac});

  // 4. Canonicalize document with randomized bnode labels and group N-Quads
  //  by mandatory, selective, and combined pointers.
  const options = {documentLoader};
  const combinedPointers = mandatoryPointers.concat(selectivePointers);
  const {
    groups: {
      mandatory: mandatoryGroup,
      selective: selectiveGroup,
      combined: combinedGroup,
    },
    labelMap
  } = await canonicalizeAndGroup({
    document,
    labelMapFactoryFunction,
    groups: {
      mandatory: mandatoryPointers,
      selective: selectivePointers,
      combined: combinedPointers
    },
    options
  });

  // 5. Converting absolute indexes of mandatory N-Quads to relative indexes in
  // the combined output to be revealed.
  let relativeIndex = 0;
  const mandatoryIndexes = [];
  for(const absoluteIndex of combinedGroup.matching.keys()) {
    if(mandatoryGroup.matching.has(absoluteIndex)) {
      mandatoryIndexes.push(relativeIndex);
    }
    relativeIndex++;
  }

  // 6. Filter signatures from `baseProof` to those matching non-mandatory
  //   absolute indexes and shifting by any absolute mandatory indexes that
  //   occur before each entry.
  let index = 0;
  const filteredSignatures = signatures.filter(() => {
    while(mandatoryGroup.matching.has(index)) {
      index++;
    }
    return selectiveGroup.matching.has(index++);
  });

  // 7. Produce reveal document using combination of mandatory and selective
  //   pointers.
  const revealDoc = selectJsonLd({document, pointers: combinedPointers});

  // 8. Canonicalize deskolemized N-Quads for the combined group to generate
  //   the canonical blank node labels a verifier will see.
  let canonicalIdMap = new Map();
  await canonicalize(
    combinedGroup.deskolemizedNQuads.join(''),
    {...options, inputFormat: 'application/n-quads', canonicalIdMap});
  // implementation-specific bnode prefix fix
  canonicalIdMap = stripBlankNodePrefixes(canonicalIdMap);

  // 9. Produce a blank node label map from the canonical blank node labels
  //   the verifier will see to the HMAC labels.
  const verifierLabelMap = new Map();
  for(const [inputLabel, verifierLabel] of canonicalIdMap) {
    verifierLabelMap.set(verifierLabel, labelMap.get(inputLabel));
  }

  // 10. Return data used by cryptosuite to disclose.
  return {
    baseSignature, publicKey, signatures: filteredSignatures,
    labelMap: verifierLabelMap, mandatoryIndexes,
    revealDoc
  };
}

async function _derive({
  cryptosuite, document, purpose, proofSet,
  documentLoader, dataIntegrityProof
}) {
  // find matching base `proof` in `proofSet`
  const {options: {proofId}} = cryptosuite;
  const baseProof = _findProof({proofId, proofSet, dataIntegrityProof});

  // ensure `purpose` matches `baseProof`
  if(baseProof.proofPurpose !== purpose.term) {
    throw new Error(
      'Base proof purpose does not match purpose for derived proof.');
  }

  // generate data for disclosure
  const {
    baseSignature, publicKey, signatures, labelMap, mandatoryIndexes, revealDoc
  } = await _createDisclosureData(
    {cryptosuite, document, proof: baseProof, documentLoader});

  // create new disclosure proof
  const newProof = {...baseProof};
  newProof.proofValue = await serializeDisclosureProofValue(
    {baseSignature, publicKey, signatures, labelMap, mandatoryIndexes});

  // attach proof to reveal doc w/o context
  delete newProof['@context'];
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
      if(dataIntegrityProof.matchProof({proof: p})) {
        if(proof) {
          // already matched
          throw new Error(
            'Multiple matching proofs; a "proofId" must be specified.');
        }
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

/*!
 * Copyright (c) 2023 Digital Bazaar, Inc. All rights reserved.
 */
import {
  filterAndSplit, hashMandatory, hmacCanonize, pointersToFrame
} from './di-sd-primitives/index.js';
import jsonld from 'jsonld';
import {name} from './name.js';

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

  // Create derived proof needs:
  // 1. canonized with hmac'd labels + frame (reveal doc)
  // 2. canonized with hmac'd labels + skolemized + frame (mandatory fields)
  // 3. canonized with hmac'd labels + skolemized + frame (message index map)
  // 4. toRDF skolemized mandatory fields frame (mandatory message index map)
  // 5. toRDF skolemized frame (message index map)
  // 6. hash mandatory quads in order => h1, hmac(h1) => h2, reveal h2

  // 1. Get parameters (e.g., `hmacKey`, `mandatoryPointers`) from `baseProof`.
  const {hmacKey, mandatoryPointers, publicKey, h2} = await _parseBaseProof(
    {baseProof});

  // 2. Create HMAC API from `hmacKey`.
  // FIXME: import `hmacKey`
  const hmac = {hmacKey};

  // 3. Transform document into array of canonized N-Quads w/randomized bnids.
  const options = {documentLoader};
  const nquads = await hmacCanonize({document, options, hmac});

  // 4. In parallel, produce mandatory frame and combined frame from pointers.
  const {selectivePointers = []} = cryptosuite.options;
  const [mandatoryFrame, combinedFrame] = await Promise.all([
    pointersToFrame({pointers: mandatoryPointers}),
    pointersToFrame({pointers: mandatoryPointers.concat(selectivePointers)})
  ]);

  // 5. In parallel, frame to produce reveal document, split N-Quads into
  //   mandatory and non-mandatory N-Quads, and get blank node label map.
  const [revealDoc, {labelMap, split, filteredMap}] = await Promise.all([
    jsonld.frame(document, combinedFrame, options),
    filterAndSplit({
      nquads, filterFrame: combinedFrame, splitFrame: mandatoryFrame, options
    })
  ]);
  // FIXME: need matching indexes for (from original `nquads`) for both the
  // `mandatory` and `nonMandatory` quads in order to select signatures and
  // build a relative mandatory index map to include in the proof data
  const relativeMandatoryIndexMap = new Map();
  // FIXME: notably, the mandatory N-Quads and non-mandatory N-Quads themselves
  // aren't actually needed here
  //const [mandatory, nonMandatory] = split;

  // 6. Select signatures from `baseProof` using matching indexes.
  // FIXME:
  const signatures = [];

  // 8. Build `verifyData`.
  // FIXME:
  return {relativeMandatoryIndexMap, labelMap, publicKey, signatures};

  // FIXME: `revealDoc` needs to be used instead of `document` -- may need
  // a different API to accomplish this from jsigs; so instead of calling
  // `add()` to proof set, we might need to call `deriveProof` and produce
  // a document with a single proof on it
}

async function _parseBaseProof({baseProof}) {
  // FIXME: implement parsing of binary `baseProof.proofValue`
  const {hmacKey, mandatoryPointers, h2, publicKey} = baseProof;
  return {hmacKey, mandatoryPointers, h2, publicKey};
}

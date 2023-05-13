/*!
 * Copyright (c) 2023 Digital Bazaar, Inc. All rights reserved.
 */
import {
  createHmac, filterAndSplit, hmacCanonize, pointersToFrame
} from './di-sd-primitives/index.js';
import jsonld from 'jsonld';
import {name} from './name.js';
import {parseBaseProofValue} from './proofValue.js';

export async function createDisclosureVerifyData({
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

  // 1. Parse `baseProof` to get parameters for disclosure proof.
  const {
    baseSignature, publicKey, hmacKey, signatures, mandatoryPointers
  } = await parseBaseProofValue({proof: baseProof});

  // 2. Create HMAC API from `hmacKey`.
  const hmac = await createHmac({key: hmacKey});

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
    labelMap, mandatoryIndexes
  };

  // FIXME: `revealDoc` needs to be used instead of `document` -- needs
  // a different API to accomplish this from jsigs; so instead of calling
  // `add()` to proof set, need to call something like `deriveProof` or
  // `reveal` and produce a document with a single proof on it
}

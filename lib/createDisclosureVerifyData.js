/*!
 * Copyright (c) 2023 Digital Bazaar, Inc. All rights reserved.
 */
import {
  createSkolemizedDocument, filter, hashMandatory,
  hmacCanonize, pointersToFrame, skolemize, toDeskolemizedRDF
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
  const {hmacKey, mandatoryPointers} = await _parseBaseProof({baseProof});

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

  // 5. Produce skolemized nquads and JSON-LD document for filtering purposes.
  // FIXME: pass `prefix` as `urn:<hmac.sign(urn).toBase64Url()>:`?
  // FIXME: `skolemized` doesn't seem to be needed here and could be
  // pushed into `createSkolemizedDocument`?
  const skolemized = skolemize({nquads});
  const skolemizedDoc = createSkolemizedDocument({skolemized, options});

  // 6. In parallel, frame to produce reveal document and matching document.
  const [revealDoc, matchingDoc] = await Promise.all([
    jsonld.frame(document, combinedFrame, options),
    jsonld.frame(skolemizedDoc, combinedFrame, options)
  ]);

  // FIXME: if match took in a `filter` frame and a `match` frame, it could
  // do the skolemization and filtering internally and produce a matching
  // output here, hiding the `skolemize` and `skolemizedDoc` details internally

  // 7. Get all selected N-Quads by deskolemizing the matching document.
  const matchingNquads = await toDeskolemizedRDF(
    {skolemizedDoc: matchingDoc, options});

  // 8. Use `matchingDoc` to filter into mandatory and non-mandatory quads.
  const {matching: mandatory, nonMatching: nonMandatory} = await match({
    nquads: matchingNquads, skolemizedDoc: matchingDoc,
    frame: mandatoryFrame, options
  });


  // 5. Generate

  // 3. Starting framing nquads to produce reveal document.

  // FIXME: only implement disclosure proof

  // FIXME: if `proof` already has `proofValue`, this is for base proof
  // creation
  // FIXME: else if `cryptosuite.frame` (TBD if we want another API mechanism)
  // is set, this is derived (SD) proof creation
  // FIXME: else, this is verification of a derived (SD) proof
  // FIXME: consider including 1 byte header indicating proof value type
  // for base vs. derived

  // FIXME: allow some statements to be mandatory; they will need to be hashed
  // and included in the value that is signed in the base proof -- and the
  // *relative* indices of these mandatory quads included in the derived proof
  // so that the verifier can hash them to reproduce the combined hash value
  // to include -- this avoids leaking to the verifier the total number of
  // quads; determine if a `frame` should be provided during base proof
  // creation to select the ones that are mandatory -- and whether to express
  // the indices of those in the base proof value for reuse in derived proofs;
  // determine if the reveal proof will have any issues integrating those

  // FIXME: remember to include conditional mandatory statements, if quad X
  // is revealed, reveal quad Y(s)

  // FIXME: link to RFC 6901 if using JSON pointer
  // https://www.rfc-editor.org/rfc/rfc6901

  // FIXME: if a JSON-LD frame can be generated from N-many JSON pointers,
  // then mandatory fields can be expressed as JSON pointers and selectively
  // disclosed fields can be expressed as JSON pointers -- and they can be
  // combined together to produce a JSON-LD frame
  // FIXME: use of JSON pointer does require a JSON representation to be used
  // to perform selective disclosure and express mandatory fields, however,
  // this representation is only needed when building the proofs; the data
  // should still be transmittable and verifiable when transformed into
  // other formats (assuming bi-directional transformations)

  // FIXME: determine helper primitives
  // 1. canonize doc + optional function to modify bnode labels
  //   ... functions really include hmac + optional stabilize
  //   ... maybe offer either hmac or hmac + stablize helpers built on
  //   ... top of core primitive
  // 2. inputs: stablized doc, map doc, outputs: quads map
  // 3. json pointers => JSON-LD frame
  // ... review this list

  // FIXME: w/ mandatory fields (without revealing message order)
  // Create base proof needs:
  // 1. canonize with hmac'd labels
  // 2. canonize with hmac'd labels + skolemized + frame (mandatory fields)
  // 3. hash mandatory quads in order => h1, hmac(h1) => h2, sign hash(h1, h2)
  // 4. sign non-mandatory quads individually
  // Create derived proof needs:
  // 1. canonized with hmac'd labels + frame (reveal doc)
  // 2. canonized with hmac'd labels + skolemized + frame (mandatory fields)
  // 3. canonized with hmac'd labels + skolemized + frame (message index map)
  // 4. toRDF skolemized mandatory fields frame (mandatory message index map)
  // 5. toRDF skolemized frame (message index map)
  // 6. hash mandatory quads in order => h1, hmac(h1) => h2, reveal h2
  // Verify derived proof needs:
  // 1. canonized with hmac'd labels + mandatory message index map + message
  //    index map => mandatory quads + SD quads (drop any overlap from SD quads)
  // 2. hash mandatory quads in order => h1, hash(h1, revealed_h2)
  // 3. verify SD quads
  // 4. verify main signature (includes mandatory quads verification)

  // FIXME: base proof creation steps:
  /*
  1. in parallel, generate derived (SD) proof key pair
  2. in parallel, canonize and hash proof (require uuid for proof.id?)
  3. generate HMAC key
  4. canonize document
  5. replace bnodes w/HMAC'd labels
  6. in parallel, hash and sign each individual n-quad
  7. build `proofValue` from proof hash, SD public key, HMAC key, every SD
    signature; notably, only the SD public key and proof hash will be signed
    by the base proof key
  */

  // FIXME: derived (SD) proof creation steps:
  /*
  1. get HMAC key from `proofValue`
  1. in parallel, canonize and hash proof
  2. canonize document to quads
  3. replace bnodes stabilized w/HMAC'd labels (HMAC, then URNify)
  4. in parallel, frame quads with `cryptosuite.frame` to create reveal doc
  5. frame nquads with `cryptosuite.frame` to map doc
  6. convert map doc to map quads (non-canonize)
  7. match map quads to stabilized quads to get message indices
  8. select SD signatures from `proofValue` by matching message indices
  9. unstablize bnodes in map quads to labels 'O' (original)
  10. canonize map quads to produce 'N' (new) => 'O' label map
  11. build `proofValue` from proof hash, SD public key, SD signatures,
    and 'N' => 'O' label map
  */

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

  // FIXME: load SD key from parsed public key
  //const keyPair = await Ed25519Multikey.from(publicKey);

  // FIXME: otherwise, generate new keypair to use to sign individual messages
  //const keyPair = await EcdsaMultikey.generate();

  // default implementation:
  // // get cached document hash
  // let cachedDocHash;
  // const {_hashCache} = this;
  // if(_hashCache && _hashCache.document === document) {
  //   cachedDocHash = _hashCache.hash;
  // } else {
  //   this._hashCache = {
  //     document,
  //     // canonize and hash document
  //     hash: cachedDocHash =
  //       this.canonize(document, {documentLoader})
  //         .then(c14nDocument => sha256digest({string: c14nDocument}))
  //   };
  // }

  // // await both c14n proof hash and c14n document hash
  // const [proofHash, docHash] = await Promise.all([
  //   // canonize and hash proof
  //   this.canonizeProof(proof, {document, documentLoader})
  //     .then(c14nProofOptions => sha256digest({string: c14nProofOptions})),
  //   cachedDocHash
  // ]);
  // // concatenate hash of c14n proof options and hash of c14n document
  // return util.concat(proofHash, docHash);
}

async function _parseBaseProof({baseProof}) {
  // FIXME: implement
  const hmacKey = {};
  const mandatoryPointers = [];
  return {hmacKey, mandatoryPointers};
}

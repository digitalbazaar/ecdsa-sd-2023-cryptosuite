/*!
 * Copyright (c) 2023 Digital Bazaar, Inc. All rights reserved.
 */
import {deskolemize, skolemize} from './skolemize.js';
import jsonld from 'jsonld';
import {stringToUtf8Bytes} from './helpers.js';

export async function filterMandatory({nquads, frame, options} = {}) {
  // if no frame is given, all N-Quads are non-mandatory
  if(!frame) {
    return {mandatory: [], nonMandatory: nquads};
  }

  // 1. Skolemize individual N-Quads.
  const skolemized = skolemize({nquads});

  // 2. Frame skolemized N-Quads to remove non-mandatory data.
  const dataset = skolemized.join();
  const rdfOptions = {...options, format: 'application/n-quads'};
  const doc = await jsonld.fromRDF(dataset, rdfOptions);
  const framed = await jsonld.frame(doc, frame, options);

  // 3. Convert back to N-Quads to produce skolemized mandatory N-Quads.
  const rdf = await jsonld.toRDF(framed, rdfOptions);
  const mandatorySkolemized = rdf.split('\n').map(nq => nq + '\n');

  // 4. Deskolemize mandatory N-Quads.
  const mandatoryDeskolemized = deskolemize({nquads: mandatorySkolemized});

  // 5. Filter N-Quads into mandatory and non-mandatory, in order.
  const mandatory = [];
  const nonMandatory = [];
  for(const nq of nquads) {
    // if all mandatory quads not yet found and nquad matches
    if(mandatory.length < mandatoryDeskolemized.length &&
      mandatoryDeskolemized.includes(nq)) {
      mandatory.push(nq);
      continue;
    }
    nonMandatory.push(nq);
  }

  return {mandatory, nonMandatory};
}

export async function hashMandatory({mandatory, hasher, hmac, h2} = {}) {
  // 1. Hash mandatory N-Quads in order to produce `h1`.
  const h1 = await hasher.hash(stringToUtf8Bytes(mandatory.join()));

  // 2. If `h2` is not given (revealed case), then produce it using `hmac`.
  if(!h2) {
    h2 = await hmac.sign(h1);
  }

  // 3. Hash concatenated `h1` + `h2`.
  const joined = new Uint8Array(h1.length + h2.length);
  joined.set(h1);
  joined.set(h2, h1.length);
  const combined = await hasher.hash(joined);

  return {combined, h2};
}

export function serializeMandatoryPointers({mandatoryPointers} = {}) {
  // FIXME: use CBOR
  if(!mandatoryPointers) {
    return new Uint8Array(0);
  }
  return stringToUtf8Bytes(JSON.stringify(mandatoryPointers, null, 2));
}

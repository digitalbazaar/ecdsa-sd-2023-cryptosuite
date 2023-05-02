/*!
 * Copyright (c) 2023 Digital Bazaar, Inc. All rights reserved.
 */
import {deskolemize, skolemize, toDeskolemizedRDF} from './skolemize.js';
import jsonld from 'jsonld';

export async function createSkolemizedDocument({skolemized, options} = {}) {
  // produce skolemized dataset document for filtering purposes
  const dataset = skolemized.join();
  const rdfOptions = {...options, format: 'application/n-quads'};
  return jsonld.fromRDF(dataset, rdfOptions);
}

// FIXME: remove this if not used
export async function filter({skolemizedDoc, frame, options} = {}) {
  // 1. Frame skolemized document to apply filter.
  const framed = await jsonld.frame(skolemizedDoc, frame, options);

  // 2. Convert framed doc to RDF to produce filtered, skolemized N-Quads.
  const rdfOptions = {...options, format: 'application/n-quads'};
  const rdf = await jsonld.toRDF(framed, rdfOptions);

  // 3. Split N-Quads into arrays for matching and deskolemization.
  const skolemized = rdf.split('\n').map(nq => nq + '\n');

  // 4. Deskolemize N-Quads.
  const deskolemized = deskolemize({nquads: skolemized});

  // 5. Return filtered result.
  return deskolemized;
}

export async function filterAndSplit({
  nquads, filterFrame, splitFrame, options
} = {}) {
  // 1. Produce skolemized nquads and JSON-LD document for filtering purposes.
  // FIXME: pass `prefix` as `urn:<hmac.sign(urn).toBase64Url()>:`?
  const skolemized = skolemize({nquads});
  const skolemizedDoc = createSkolemizedDocument({skolemized, options});

  // 2. Frame to produce matching document.
  const matchingDoc = await jsonld.frame(skolemizedDoc, filterFrame, options);

  // 3. Get all selected N-Quads by deskolemizing the matching document.
  const matchingNquads = await toDeskolemizedRDF(
    {skolemizedDoc: matchingDoc, options});

  // 8. Use `matchingDoc` to filter into mandatory and non-mandatory quads.
  const {matching: mandatory, nonMatching: nonMandatory} = await match({
    nquads: matchingNquads, skolemizedDoc: matchingDoc,
    frame: mandatoryFrame, options
  });
}

export async function pointersToFrame({pointers} = {}) {
  // FIXME: convert JSON pointers to JSON-LD frame
}

// FIXME: perhaps rename to `split` to split `nquads` into two groups, one
// that matches the frame here and one that
export async function split({nquads, skolemizedDoc, frame, options} = {}) {
  // if no frame is given, all N-Quads are non-matching
  if(!frame) {
    return {matching: [], nonMatching: nquads};
  }

  // 1. Generate `skolemizedDoc` if not given.
  // FIXME: pass `prefix` as `urn:<hmac.sign(urn).toBase64Url()>:`?
  const skolemized = skolemize({nquads});
  skolemizedDoc = await createSkolemizedDocument({skolemized, options});

  // 2. Frame skolemized document to get matching data.
  const framed = await jsonld.frame(skolemizedDoc, frame, options);

  // 3. Convert matching data back to deskolemized N-Quads.
  const matchingDeskolemized = await toDeskolemizedRDF({doc: framed, options});

  // 4. Filter N-Quads into matching and non-matching, in order.
  const matching = [];
  const nonMatching = [];
  for(const nq of nquads) {
    // if all matching quads not yet found and nquad matches
    if(matching.length < matchingDeskolemized.length &&
      matchingDeskolemized.includes(nq)) {
      matching.push(nq);
      continue;
    }
    nonMatching.push(nq);
  }

  return {matching, nonMatching};
}

/*!
 * Copyright (c) 2023 Digital Bazaar, Inc. All rights reserved.
 */
import {canonize, skolemize, toDeskolemizedRDF} from './skolemize.js';
import jsonld from 'jsonld';

export async function filterAndSplit({
  nquads, filterFrame, splitFrame, options
} = {}) {
  // 1. Produce skolemized nquads and JSON-LD document for filtering purposes.
  // FIXME: pass `prefix` as `urn:<hmac.sign(urn).toBase64Url()>:`?
  const skolemized = skolemize({nquads});
  const skolemizedDoc = _createSkolemizedDocument({skolemized, options});

  // 2. Frame to produce filtered document.
  const filteredDoc = await jsonld.frame(skolemizedDoc, filterFrame, options);

  // 3. Get deskolemized N-Quads from the filtered document.
  const filteredNQuads = await toDeskolemizedRDF(
    {skolemizedDoc: filteredDoc, options});

  // 4. In parallel, canonize `filteredNQuads` to get quad index map and
  //   split `filteredDoc` into N-Quads that match/do not match `splitFrame`.
  const quadMap = new Map();
  const [canonized, splitResult] = await Promise.all([
    canonize(
      filteredNQuads.join(''),
      // FIXME: pass `quadMap` (properly named)
      {...options, inputFormat: 'application/n-quads'}),
    split({
      nquads: filteredNQuads, skolemizedDoc: filteredDoc,
      frame: splitFrame, options
    })
  ]);

  // FIXME: walk through canonized input to generate an index of local
  // canonized bnode labels to the labels used in `filteredNQuads`
  const labelMap = new Map();
  const localNQuads = canonized.split('\n');
  for(const [index, nq] of localNQuads) {
    const filteredNQuad = filteredNQuads[quadMap.get(index)];
    // FIXME: implement this properly, this is non-functional pseudo code
    const m1 = filteredNQuad.match(/(_:([^\s]+))/g);
    const m2 = nq.match(/(_:([^\s]+))/g);
    for(let i = 0; i < m1.length; ++i) {
      labelMap.set(m1[i], m2[i]);
    }
  }

  return {labelMap, split: splitResult};
}

export async function pointersToFrame(/*{pointers} = {}*/) {
  // FIXME: convert JSON pointers to JSON-LD frame
}

export async function split({nquads, skolemizedDoc, frame, options} = {}) {
  // if no frame is given, all N-Quads are non-matching
  if(!frame) {
    return [[], nquads];
  }

  // 1. Generate `skolemizedDoc` if not given.
  if(!skolemizedDoc) {
    // FIXME: pass `prefix` as `urn:<hmac.sign(urn).toBase64Url()>:`?
    const skolemized = skolemize({nquads});
    skolemizedDoc = await _createSkolemizedDocument({skolemized, options});
  }

  // 2. Frame skolemized document to get data that matches frame.
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

  return [matching, nonMatching];
}

async function _createSkolemizedDocument({skolemized, options} = {}) {
  // produce skolemized dataset document for filtering purposes
  const dataset = skolemized.join();
  const rdfOptions = {...options, format: 'application/n-quads'};
  return jsonld.fromRDF(dataset, rdfOptions);
}

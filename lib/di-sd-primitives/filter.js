/*!
 * Copyright (c) 2023 Digital Bazaar, Inc. All rights reserved.
 */
import {skolemize, toDeskolemizedRDF} from './skolemize.js';
import {frame as _frame} from './frame.js';
import {canonize} from './canonize.js';
import jsonld from 'jsonld';

export async function filterAndGroup({
  nquads, filterFrame, groupFrame, options
} = {}) {
  // 1. Produce skolemized nquads and JSON-LD document for filtering purposes.
  const skolemized = skolemize({nquads});
  const skolemizedDoc = await _createSkolemizedDocument({skolemized, options});

  // 2. Frame to produce filtered document.
  const filteredDoc = await _frame(skolemizedDoc, filterFrame, options);

  // 3. Get deskolemized N-Quads from the filtered document.
  const filteredNQuads = await toDeskolemizedRDF({doc: filteredDoc, options});

  // 4. In parallel, canonize `filteredNQuads` to get bnode identifier map and
  //   group `filteredDoc` N-Quads into those that match/do not match
  //   `groupFrame`.
  const canonicalIdMap = new Map();
  const [, groupResult] = await Promise.all([
    canonize(
      filteredNQuads.join(''),
      {...options, inputFormat: 'application/n-quads', canonicalIdMap}),
    group({
      nquads: filteredNQuads, skolemizedDoc: filteredDoc,
      frame: groupFrame, options
    })
  ]);

  // 5. Generate matching and non-matching maps based on original `nquads`.
  const matching = new Map();
  const nonMatching = new Map();
  const filteredMatches = [...groupResult.matching.values()];
  const filteredNonMatches = [...groupResult.nonMatching.values()];
  for(const [index, nq] of nquads.entries()) {
    if(matching.size < filteredMatches.length &&
      filteredMatches.includes(nq)) {
      matching.set(index, nq);
    } else if(nonMatching.size < filteredNonMatches.length &&
      filteredNonMatches.includes(nq)) {
      nonMatching.set(index, nq);
    }
  }

  // 6. Return filtered and grouping results and bnode ID labelMap.
  return {
    filtered: groupResult,
    labelMap: _createLabelMap(canonicalIdMap),
    matching,
    nonMatching
  };
}

export async function group({nquads, skolemizedDoc, frame, options} = {}) {
  // if no frame is given, all N-Quads fall into the non-matching group
  if(!frame) {
    return {
      nquads,
      matching: new Map(),
      nonMatching: new Map([...nquads.entries()])
    };
  }

  // 1. Generate `skolemizedDoc` if not given.
  if(!skolemizedDoc) {
    const skolemized = skolemize({nquads});
    skolemizedDoc = await _createSkolemizedDocument({skolemized, options});
  }

  // 2. Frame skolemized document to get data that matches frame.
  const framed = await _frame(skolemizedDoc, frame, options);

  // 3. Convert matching data back to deskolemized N-Quads.
  const matchingDeskolemized = await toDeskolemizedRDF({doc: framed, options});

  // 4. Split N-Quads into matching / non-matching groups.
  const matching = new Map();
  const nonMatching = new Map();
  for(const [index, nq] of nquads.entries()) {
    // if all matching quads not yet found and nquad matches
    if(matching.length < matchingDeskolemized.length &&
      matchingDeskolemized.includes(nq)) {
      matching.set(index, nq);
    } else {
      nonMatching.set(index, nq);
    }
  }

  return {nquads, matching, nonMatching};
}

async function _createSkolemizedDocument({skolemized, options} = {}) {
  // produce skolemized dataset document for filtering purposes
  const dataset = skolemized.join('');
  const rdfOptions = {...options, format: 'application/n-quads'};
  return jsonld.fromRDF(dataset, rdfOptions);
}

function _createLabelMap(map) {
  // reverse map
  const reversed = new Map();
  for(const [k, v] of map.entries()) {
    // also handle removing `_:` prefix
    reversed.set(v.slice(2), k.slice(2));
  }
  return reversed;
}

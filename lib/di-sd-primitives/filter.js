/*!
 * Copyright (c) 2023 Digital Bazaar, Inc. All rights reserved.
 */
import {skolemize, toDeskolemizedRDF} from './skolemize.js';
import {canonize} from './canonize.js';
import jsonld from 'jsonld';
import jsonpointer from 'jsonpointer';

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
      // FIXME: pass in original `nquads` as well to produce full report of
      // unfiltered quads, filtered quads, and split quads
      nquads: filteredNQuads, skolemizedDoc: filteredDoc,
      frame: splitFrame, options
    })
  ]);

  // FIXME: walk through canonized input to generate an index of local
  // canonized bnode labels to the labels used in `filteredNQuads`
  const labelMap = new Map();
  const localNQuads = canonized.split('\n');
  for(const [index, filteredNQuad] of filteredNQuads) {
    // `quadMap` has `filteredNQuads` indexes => `localNQuads` indexes
    const localNQuad = localNQuads[quadMap.get(index)];
    // FIXME: implement this properly, this is non-functional pseudo code
    const m1 = localNQuad.match(/(_:([^\s]+))/g);
    const m2 = filteredNQuad.match(/(_:([^\s]+))/g);
    for(let i = 0; i < m1.length; ++i) {
      // map localNQuad bnode labels to proper hmac-canonized labels
      labelMap.set(m1[i], m2[i]);
    }
  }

  return {labelMap, split: splitResult};
}

// FIXME: differentiate between selection and
export async function pointersToFrame({document, pointers} = {}) {
  // FIXME: link to RFC 6901
  // https://www.rfc-editor.org/rfc/rfc6901

  // FIXME: sort JSON pointers by length ... ensuring deeply nested ones
  // are run last?

  // FIXME: these flags could be set in the API instead via spec text
  const flags = {
    '@explicit': true,
    '@requireAll': true
  };
  const frame = {...flags};
  for(const pointer of pointers) {
    // walk document building frames from root to value
    let parentFrame = frame;
    let parentValue = document;
    let value = parentValue;
    let valueFrame = parentFrame;
    let lastPath;
    // FIXME: handle array indexing and special `-` non-existent pointer char
    // FIXME: handle invalid JSON pointer
    // FIXME: handle escaping?
    const paths = pointer.split('/').slice(1);
    for(const path of paths) {
      parentFrame = valueFrame;
      parentValue = value;

      // convert any numerical path to a number as an array index
      const index = parseInt(path, 10);
      lastPath = isNaN(index) ? path : index;

      // get next document value
      value = parentValue[lastPath];
      if(value === undefined) {
        throw new TypeError(
          `JSON pointer "${pointer}" does not match document.`);
      }

      // get next value frame
      valueFrame = parentFrame[lastPath];
      if(valueFrame === undefined) {
        valueFrame = Array.isArray(value) ? [] : {...flags};
        parentFrame[lastPath] = valueFrame;
      }
    }

    if(typeof value !== 'object') {
      // literal selected
      parentFrame[lastPath] = value;
    } else {
      valueFrame = {...valueFrame, ...value};
    }
  }

  // FIXME: use `klona()`
  frame['@context'] = JSON.parse(JSON.stringify(document['@context']));

  console.log('frame', JSON.stringify(frame, null, 2));

  return frame;
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

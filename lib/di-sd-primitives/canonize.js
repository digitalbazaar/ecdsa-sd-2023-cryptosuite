/*!
 * Copyright (c) 2023 Digital Bazaar, Inc. All rights reserved.
 */
import * as base64url from 'base64url-universal';
import jsonld from 'jsonld';
import rdfCanonize from 'rdf-canonize';
import {stringToUtf8Bytes} from './helpers.js';

const {NQuads} = rdfCanonize;

const COMPONENT_NAMES = ['subject', 'predicate', 'object', 'graph'];

export async function hmacCanonize({document, options, hmac, labelMap} = {}) {
  if(!(document && typeof document === 'object')) {
    throw new TypeError('"document" must be an object.');
  }

  // FIXME: labels include `_:` prefix in current RDF canonize implementation
  // so it is sliced and readded below
  let labelMutator;
  if(labelMap) {
    labelMutator = async label => {
      return `_:${labelMap.get(label.slice(2))}`;
    };
  } else {
    labelMutator = async label => {
      const utf8Bytes = stringToUtf8Bytes(label.slice(2));
      const hashed = await hmac.sign(utf8Bytes);
      return `_:${base64url.encode(hashed)}`;
    };
  }
  return _customCanonize({document, options, labelMutator});
}

export async function canonize(input, options) {
  if(!(options && typeof options === 'object')) {
    throw new TypeError('"options" must be an object.');
  }
  return jsonld.canonize(input, {
    algorithm: 'URDNA2015',
    // FIXME: determine if the abstract quads can be returned instead to
    // avoid the need to re-parse them
    format: 'application/n-quads',
    ...options
  });
}

async function _customCanonize({document, options, labelMutator} = {}) {
  // FIXME: get abstract quads instead to avoid need to reparse
  const original = await canonize(document, options);

  // FIXME: could also be implemented as (pseudo code... needs async replace):
  // original.split('\n')
  //   .map(e => e.replace(/(_:([^\s]+))/g, 'HMAC($2)')).sort()
  const quads = NQuads.parse(original);

  // mutate blank node labels according to `labelMutator`
  const mutatedQuads = [];
  for(const quad of quads) {
    const updated = {...quad};
    mutatedQuads.push(updated);
    for(const name of COMPONENT_NAMES) {
      const component = quad[name];
      if(component.termType === 'BlankNode') {
        updated[name] = {
          ...component,
          value: await labelMutator({label: component.value})
        };
      }
    }
  }

  // produce sorted N-Quads
  const mutated = [];
  for(const q of mutatedQuads) {
    mutated.push(NQuads.serializeQuad(q));
  }
  // FIXME: use code point sort from `rdfCanonize` (if determined to be
  // required via output from `canonize`)
  mutated.sort();

  return mutated;
}

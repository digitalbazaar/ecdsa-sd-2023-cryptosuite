/*!
 * Copyright (c) 2023 Digital Bazaar, Inc. All rights reserved.
 */
import * as base64url from '@digitalbazaar/base64url-universal';
import jsonld from 'jsonld';
import rdfCanonize from 'rdf-canonize';
import {stringToUtf8Bytes} from './helpers.js';

const {NQuads} = rdfCanonize;

const COMPONENT_NAMES = ['subject', 'predicate', 'object', 'graph'];

// FIXME: this primitive is only for all quads, not selectively disclosed
// quads where index maps are being computed; need another primitive for that
export async function customCanonize({document, options, labelMutator} = {}) {
  // FIXME: get abstract quads instead to avoid need to reparse
  const original = await _canonize(document, options);
  const quads = NQuads.parse(original);

  // mutate blank node labels according to `labelMutator`
  let mutatedQuads;
  if(!labelMutator) {
    mutatedQuads = quads;
  } else {
    mutatedQuads = [];
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
  }

  // produce sorted N-Quads
  const mutated = [];
  for(const q of mutatedQuads) {
    mutated.push(NQuads.serializeQuad(q));
  }
  // FIXME: use code point sort from `rdfCanonize` (if determined to be
  // required via output from `_canonize`)
  mutated.sort();

  return {nquads: {original, mutated}};
}

export async function hmacCanonize({document, options, hmac} = {}) {
  // FIXME: labels include `_:` prefix in current RDF canonize implementation
  const labelMutator = async label => {
    const utf8Bytes = stringToUtf8Bytes(label.slice(2));
    const hashed = await hmac.sign(utf8Bytes);
    return `_:${base64url.encode(hashed)}`;
  };
  return customCanonize({document, options, labelMutator});
}

async function _canonize(input, options) {
  return jsonld.canonize(input, {
    algorithm: 'URDNA2015',
    // FIXME: determine if the abstract quads can be returned instead to
    // avoid the need to re-parse them
    format: 'application/n-quads',
    ...options
  });
}

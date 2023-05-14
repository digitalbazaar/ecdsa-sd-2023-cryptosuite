/*!
 * Copyright (c) 2023 Digital Bazaar, Inc. All rights reserved.
 */
import * as base64url from 'base64url-universal';
import {createHasher} from './hash.js';
import jsonld from 'jsonld';
import rdfCanonize from 'rdf-canonize';
import {stringToUtf8Bytes} from './helpers.js';

const {NQuads} = rdfCanonize;

const COMPONENT_NAMES = ['subject', 'predicate', 'object', 'graph'];

export async function hmacIdCanonize({document, options, hmac, labelMap} = {}) {
  if(!(document && typeof document === 'object')) {
    throw new TypeError('"document" must be an object.');
  }

  /* Note: Labels include `_:` prefix in current RDF canonize implementation
  so it is sliced and re-added below. */
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
    format: 'application/n-quads',
    ...options
  });
}

export async function canonizeProof({document, proof, options} = {}) {
  proof = {
    '@context': document['@context'],
    ...proof
  };
  delete proof.proofValue;
  return canonize(proof, options);
}

export async function hashCanonizedProof({
  document, proof, options, hasher
} = {}) {
  if(!hasher) {
    // create default `hasher` if not specified
    hasher = createHasher();
  }
  const canonized = await canonizeProof({document, proof, options});
  return hasher.hash(stringToUtf8Bytes(canonized));
}

async function _customCanonize({document, options, labelMutator} = {}) {
  // FIXME: request abstract quads instead to avoid need to reparse
  const original = await canonize(document, options);

  // FIXME: could be implemented as (pseudo code, but needs async replace):
  // original.split('\n')
  //   .map(e => e.replace(/(_:([^\s]+))/g, 'labelMutator($2)') + '\n').sort()
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
          value: await labelMutator(component.value)
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

/*!
 * Copyright (c) 2023 Digital Bazaar, Inc. All rights reserved.
 */
import jsonld from 'jsonld';
import rdfCanonize from 'rdf-canonize';

const {NQuads} = rdfCanonize;

const COMPONENT_NAMES = ['subject', 'predicate', 'object', 'graph'];

// FIXME: implement specific version of `sdCanonize` first, only look at
// abstractions thereafter

export async function sdCanonize({
  document, documentLoader, labelMutator
} = {}) {
  // FIXME: get abstract quads instead to avoid need to reparse
  const original = await _canonize(document, {documentLoader});
  const quads = await NQuads.parse(original);

  const {quads: mutatedQuads} = customSdCanonize(
    {canonize: () => quads, labelMutator});

  const mutated = [];
  for(const q of mutatedQuads) {
    mutated.push(await NQuads.serializeQuad(q));
  }
  // FIXME: use code point sort if required
  mutated.sort();

  return {original, mutated};
}

export async function customSdCanonize({canonize, labelMutator} = {}) {
  // FIXME: get additional output from (or pass in additional option to)
  // `canonize` to determine need for code point sort?
  const quads = await canonize();

  // mutate blank node labels according to `labelMutator`
  let mutated = false;
  const newQuads = [];
  for(const quad of quads) {
    const updated = {...quad};
    newQuads.push(updated);
    for(const name of COMPONENT_NAMES) {
      const component = quad[name];
      if(component.termType === 'BlankNode') {
        mutated = true;
        updated[name] = {
          ...component,
          value: await labelMutator({label: component.value})
        };
      }
    }
  }

  // // if any bnode labels were mutated, resort quads
  // if(mutated) {
  //   // FIXME: use code point sort if required
  //   newQuads.sort();
  // }

  return {quads: newQuads, mutated};
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

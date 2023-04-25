/*!
 * Copyright (c) 2023 Digital Bazaar, Inc. All rights reserved.
 */
import jsonld from 'jsonld';
import rdfCanonize from 'rdf-canonize';

const {NQuads} = rdfCanonize;

const COMPONENT_NAMES = ['subject', 'predicate', 'object', 'graph'];

// FIXME: implement specific version of `sdCanonize` first, only look at
// abstractions thereafter

// FIXME: w/o mandatory fields
// Create base proof needs:
// 1. canonize with hmac'd labels
// Create derived proof needs:
// 1. canonized with hmac'd labels + frame (reveal doc)
// 2. canonized with hmac'd labels + stabilized + frame (message index map)
// 3. toRDF stabilized frame (message index map)
// Verify derived proof needs:
// 1. canonized with hmac'd labels + message index map (no stabilizing)

// FIXME: w/ mandatory fields
// Create base proof needs:
// 1. canonize with hmac'd labels
// 2. canonize with hmac'd labels + stabilized + frame (mandatory fields)
// 3. hash mandatory quads in order => h1, hmac(h1) => h2, sign hash(h1, h2)
// 4. sign non-mandatory quads individually
// Create derived proof needs:
// 1. canonized with hmac'd labels + frame (reveal doc)
// 2. canonized with hmac'd labels + stabilized + frame (mandatory fields)
// 3. canonized with hmac'd labels + stabilized + frame (message index map)
// 4. toRDF stabilized mandatory fields frame (mandatory message index map)
// 5. toRDF stabilized frame (message index map)
// 6. hash mandatory quads in order => h1, hmac(h1) => h2, reveal h2
// Verify derived proof needs:
// 1. canonized with hmac'd labels + mandatory message index map + message
//    index map => mandatory quads + SD quads (drop any overlap from SD quads)
// 2. hash mandatory quads in order => h1, hash(h1, revealed_h2)
// 3. verify SD quads
// 4. verify main signature (includes mandatory quads verification)

export async function sdCanonize({
  document, canonizeOptions, labelMutator
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

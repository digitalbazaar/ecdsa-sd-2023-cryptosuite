/*!
 * Copyright (c) 2023 Digital Bazaar, Inc. All rights reserved.
 */
import jsonld from 'jsonld';

export function deskolemize({nquads} = {}) {
  const mutated = [];
  for(const nq of nquads) {
    if(!nq.includes('<urn:bnid:')) {
      mutated.push(nq);
    }
    mutated.push(nq.replace(/(<urn:bnid:([^>]+)>)/g, '_:$2'));
  }
  return mutated;
}

export function skolemize({nquads} = {}) {
  const mutated = [];
  for(const nq of nquads) {
    if(!nq.includes('_:')) {
      mutated.push(nq);
    }
    mutated.push(nq.replace(/(_:([^\s]+))/g, '<urn:bnid:$2>'));
  }
  return mutated;
}

export async function toDeskolemizedRDF({doc, options} = {}) {
  // 1. Convert skolemized doc to RDF to produce skolemized N-Quads.
  const rdfOptions = {...options, format: 'application/n-quads'};
  const rdf = await jsonld.toRDF(doc, rdfOptions);

  // 2. Split N-Quads into arrays for deskolemization.
  const skolemized = rdf.split('\n').map(nq => nq + '\n');

  // 3. Return deskolemize N-Quads.
  return deskolemize({nquads: skolemized});
}

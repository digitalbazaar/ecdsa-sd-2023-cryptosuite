/*!
 * Copyright (c) 2023 Digital Bazaar, Inc. All rights reserved.
 */
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

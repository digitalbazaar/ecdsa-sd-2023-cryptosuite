/*!
 * Copyright (c) 2022 Digital Bazaar, Inc. All rights reserved.
 */
import jsonld from 'jsonld';

export function canonize(input, options) {
  return jsonld.canonize(input, {
    algorithm: 'URDNA2015',
    format: 'application/n-quads',
    ...options
  });
}

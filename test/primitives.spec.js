/*!
 * Copyright (c) 2023 Digital Bazaar, Inc. All rights reserved.
 */
import * as primitives from '../lib/di-sd-primitives/index.js';

describe('di-sd-primitives', () => {
  describe('exports', () => {
    it('it should have proper exports', async () => {
      should.exist(primitives);
      primitives.deskolemize.should.be.a('function');
      primitives.filterAndSplit.should.be.a('function');
      primitives.hashMandatory.should.be.a('function');
      primitives.hmacIdCanonize.should.be.a('function');
      primitives.skolemize.should.be.a('function');
      primitives.split.should.be.a('function');
      primitives.toDeskolemizedRDF.should.be.a('function');
    });
  });
});

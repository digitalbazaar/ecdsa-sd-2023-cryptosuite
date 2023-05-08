/*!
 * Copyright (c) 2023 Digital Bazaar, Inc. All rights reserved.
 */
import {expect} from 'chai';

import * as primitives from '../lib/di-sd-primitives/index.js';
import {credential} from './mock-data.js';
import {loader} from './documentLoader.js';

const documentLoader = loader.build();

describe('di-sd-primitives', () => {
  describe('exports', () => {
    it('it should have proper exports', async () => {
      should.exist(primitives);
      primitives.hmacCanonize.should.be.a('function');
      primitives.deskolemize.should.be.a('function');
      primitives.skolemize.should.be.a('function');
      primitives.toDeskolemizedRDF.should.be.a('function');
      primitives.filterAndSplit.should.be.a('function');
      primitives.split.should.be.a('function');
      primitives.hashMandatory.should.be.a('function');
    });
  });

  describe('hmacCanonize()', () => {
    it('should HMAC canonize w/o blank nodes', async () => {
      let result;
      let error;
      try {
        result = await primitives.hmacCanonize(
          {document: credential, options: {documentLoader}});
      } catch(e) {
        error = e;
      }
      expect(error).to.not.exist;
      expect(result).to.exist;

      /* eslint-disable max-len */
      const expectedResult = [
        '<http://example.edu/credentials/1872> <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <https://schema.org#AlumniCredential> .\n',
        '<http://example.edu/credentials/1872> <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <https://www.w3.org/2018/credentials#VerifiableCredential> .\n',
        '<http://example.edu/credentials/1872> <https://www.w3.org/2018/credentials#credentialSubject> <https://example.edu/students/alice> .\n',
        '<http://example.edu/credentials/1872> <https://www.w3.org/2018/credentials#issuanceDate> "2010-01-01T19:23:24Z"^^<http://www.w3.org/2001/XMLSchema#dateTime> .\n',
        '<http://example.edu/credentials/1872> <https://www.w3.org/2018/credentials#issuer> <https://example.edu/issuers/565049> .\n',
        '<https://example.edu/students/alice> <https://schema.org#alumniOf> "Example University" .\n'
      ];
      /* eslint-enable max-len */
      result.should.deep.equal(expectedResult);
    });

    // FIXME: test w/blank nodes w/hmac API
    // FIXME: test w/blank nodes w/label map
  });

  describe('pointersToFrame()', () => {
    it('should convert one JSON pointer to a frame', async () => {
      const pointer = '/credentialSubject/id';

      let result;
      let error;
      try {
        result = await primitives.pointersToFrame(
          {document: credential, pointers: [pointer]});
      } catch(e) {
        error = e;
      }
      expect(error).to.not.exist;
      expect(result).to.exist;

      // FIXME: implement
      const expectedFrame = {
        '@context': [
          'https://www.w3.org/2018/credentials/v1',
          {
            AlumniCredential: 'https://schema.org#AlumniCredential',
            alumniOf: 'https://schema.org#alumniOf'
          },
          'https://w3id.org/security/data-integrity/v1'
        ],
        credentialSubject: {
          '@explicit': true,
          '@requireAll': true,
          id: 'https://example.edu/students/alice'
        }
      };
      result.should.deep.equal(expectedFrame);
    });

    it('should convert N JSON pointers to a frame', async () => {
      // FIXME:
    });

    it('should select data matching JSON pointers via frame', async () => {
      // FIXME:
    });
  });
});

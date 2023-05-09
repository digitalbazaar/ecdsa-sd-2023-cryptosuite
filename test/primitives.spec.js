/*!
 * Copyright (c) 2023 Digital Bazaar, Inc. All rights reserved.
 */
import {expect} from 'chai';

import * as primitives from '../lib/di-sd-primitives/index.js';
import {alumniCredential, dlCredential} from './mock-data.js';
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
          {document: alumniCredential, options: {documentLoader}});
      } catch(e) {
        error = e;
      }
      expect(error).to.not.exist;
      expect(result).to.exist;

      /* eslint-disable max-len */
      const expectedResult = [
        '<urn:uuid:98c5cffc-efa2-43e3-99f5-01e8ef404be0> <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <https://www.w3.org/2018/credentials#VerifiableCredential> .\n',
        '<urn:uuid:98c5cffc-efa2-43e3-99f5-01e8ef404be0> <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <urn:example:AlumniCredential> .\n',
        '<urn:uuid:98c5cffc-efa2-43e3-99f5-01e8ef404be0> <https://www.w3.org/2018/credentials#credentialSubject> <urn:uuid:d58b2365-0951-4373-96c8-e886d61829f2> .\n',
        '<urn:uuid:98c5cffc-efa2-43e3-99f5-01e8ef404be0> <https://www.w3.org/2018/credentials#issuanceDate> "2010-01-01T19:23:24Z"^^<http://www.w3.org/2001/XMLSchema#dateTime> .\n',
        '<urn:uuid:98c5cffc-efa2-43e3-99f5-01e8ef404be0> <https://www.w3.org/2018/credentials#issuer> <did:key:zDnaekGZTbQBerwcehBSXLqAg6s55hVEBms1zFy89VHXtJSa9> .\n',
        '<urn:uuid:d58b2365-0951-4373-96c8-e886d61829f2> <https://schema.org#alumniOf> "Example University" .\n'
      ];
      /* eslint-enable max-len */
      result.should.deep.equal(expectedResult);
    });

    it('should HMAC canonize w/ labelMap w/ blank nodes', async () => {
      const labelMap = new Map([
        ['c14n0', 'c14n0_new']
      ]);

      let result;
      let error;
      try {
        result = await primitives.hmacCanonize(
          {document: dlCredential, options: {documentLoader}, labelMap});
      } catch(e) {
        error = e;
      }
      expect(error).to.not.exist;
      expect(result).to.exist;

      /* eslint-disable max-len */
      const expectedResult = [
        '<urn:uuid:1a0e4ef5-091f-4060-842e-18e519ab9440> <urn:example:driverLicense> _:c14n0_new .\n',
        '<urn:uuid:36245ee9-9074-4b05-a777-febff2e69757> <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <https://www.w3.org/2018/credentials#VerifiableCredential> .\n',
        '<urn:uuid:36245ee9-9074-4b05-a777-febff2e69757> <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <urn:example:DriverLicenseCredential> .\n',
        '<urn:uuid:36245ee9-9074-4b05-a777-febff2e69757> <https://www.w3.org/2018/credentials#credentialSubject> <urn:uuid:1a0e4ef5-091f-4060-842e-18e519ab9440> .\n',
        '<urn:uuid:36245ee9-9074-4b05-a777-febff2e69757> <https://www.w3.org/2018/credentials#issuanceDate> "2010-01-01T19:23:24Z"^^<http://www.w3.org/2001/XMLSchema#dateTime> .\n',
        '<urn:uuid:36245ee9-9074-4b05-a777-febff2e69757> <https://www.w3.org/2018/credentials#issuer> <did:key:zDnaekGZTbQBerwcehBSXLqAg6s55hVEBms1zFy89VHXtJSa9> .\n',
        '_:c14n0_new <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <urn:example:DriverLicense> .\n',
        '_:c14n0_new <urn:example:dateOfBirth> "01-01-1990" .\n',
        '_:c14n0_new <urn:example:documentIdentifier> "T21387yc328c7y32h23f23" .\n',
        '_:c14n0_new <urn:example:expiration> "01-01-2030" .\n',
        '_:c14n0_new <urn:example:issuingAuthority> "VA" .\n'
      ];
      /* eslint-enable max-len */
      result.should.deep.equal(expectedResult);
    });

    // FIXME: test w/blank nodes w/hmac API
    // FIXME: test w/blank nodes w/label map
  });

  describe('pointersToFrame()', () => {
    it('should convert one JSON pointer to a frame w/ types', async () => {
      const pointer = '/credentialSubject/id';

      let result;
      let error;
      try {
        result = await primitives.pointersToFrame(
          {document: alumniCredential, pointers: [pointer]});
      } catch(e) {
        error = e;
      }
      expect(error).to.not.exist;
      expect(result).to.exist;

      const expectedFrame = {
        '@context': alumniCredential['@context'],
        type: alumniCredential.type,
        credentialSubject: {
          id: alumniCredential.credentialSubject.id
        }
      };
      result.should.deep.equal(expectedFrame);
    });

    it('should convert one JSON pointer to a frame w/o types', async () => {
      const pointer = '/credentialSubject/id';

      let result;
      let error;
      try {
        result = await primitives.pointersToFrame({
          document: alumniCredential, pointers: [pointer],
          includeTypes: false
        });
      } catch(e) {
        error = e;
      }
      expect(error).to.not.exist;
      expect(result).to.exist;

      const expectedFrame = {
        '@context': alumniCredential['@context'],
        credentialSubject: {
          id: alumniCredential.credentialSubject.id
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

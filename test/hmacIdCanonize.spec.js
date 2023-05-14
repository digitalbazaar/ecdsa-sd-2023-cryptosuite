/*!
 * Copyright (c) 2023 Digital Bazaar, Inc. All rights reserved.
 */
import {expect} from 'chai';

import * as primitives from '../lib/di-sd-primitives/index.js';
import {
  alumniCredential,
  dlCredentialNoIds,
  hmacKey
} from './mock-data.js';
import {loader} from './documentLoader.js';

const documentLoader = loader.build();

describe('di-sd-primitives', () => {
  describe('hmacIdCanonize()', () => {
    it('should HMAC ID canonize w/o blank nodes', async () => {
      let result;
      let error;
      try {
        result = await primitives.hmacIdCanonize(
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

    it('should HMAC ID canonize w/ labelMap w/ blank nodes', async () => {
      const labelMap = new Map([
        ['c14n0', 'c14n0_new'],
        ['c14n1', 'c14n2_new'],
        ['c14n2', 'c14n3_new']
      ]);

      let result;
      let error;
      try {
        result = await primitives.hmacIdCanonize(
          {document: dlCredentialNoIds, options: {documentLoader}, labelMap});
      } catch(e) {
        error = e;
      }
      expect(error).to.not.exist;
      expect(result).to.exist;

      /* eslint-disable max-len */
      const expectedResult = [
        '_:c14n0_new <urn:example:driverLicense> _:c14n2_new .\n',
        '_:c14n2_new <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <urn:example:DriverLicense> .\n',
        '_:c14n2_new <urn:example:dateOfBirth> \"01-01-1990\" .\n',
        '_:c14n2_new <urn:example:documentIdentifier> \"T21387yc328c7y32h23f23\" .\n',
        '_:c14n2_new <urn:example:expiration> \"01-01-2030\" .\n',
        '_:c14n2_new <urn:example:issuingAuthority> \"VA\" .\n',
        '_:c14n3_new <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <https://www.w3.org/2018/credentials#VerifiableCredential> .\n',
        '_:c14n3_new <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <urn:example:DriverLicenseCredential> .\n',
        '_:c14n3_new <https://www.w3.org/2018/credentials#credentialSubject> _:c14n0_new .\n',
        '_:c14n3_new <https://www.w3.org/2018/credentials#issuanceDate> \"2010-01-01T19:23:24Z\"^^<http://www.w3.org/2001/XMLSchema#dateTime> .\n',
        '_:c14n3_new <https://www.w3.org/2018/credentials#issuer> <did:key:zDnaekGZTbQBerwcehBSXLqAg6s55hVEBms1zFy89VHXtJSa9> .\n'
      ];
      /* eslint-enable max-len */
      result.should.deep.equal(expectedResult);
    });

    it('should HMAC ID canonize w/ hmac w/ blank nodes', async () => {
      let result;
      let error;
      try {
        const hmac = await primitives.createHmac({key: hmacKey});
        result = await primitives.hmacIdCanonize(
          {document: dlCredentialNoIds, options: {documentLoader}, hmac});
      } catch(e) {
        error = e;
      }
      expect(error).to.not.exist;
      expect(result).to.exist;

      /* eslint-disable max-len */
      const expectedResult = [
        '_:5rPeKe9bxfq4XOZDtWBqQQ2gy3sljChtTwP7YuHAbRw <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <https://www.w3.org/2018/credentials#VerifiableCredential> .\n',
        '_:5rPeKe9bxfq4XOZDtWBqQQ2gy3sljChtTwP7YuHAbRw <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <urn:example:DriverLicenseCredential> .\n',
        '_:5rPeKe9bxfq4XOZDtWBqQQ2gy3sljChtTwP7YuHAbRw <https://www.w3.org/2018/credentials#credentialSubject> _:60VTj_8ZrVXlgJhbS4QnqCkgd0zsmM7YL1K5sBYv6N4 .\n',
        '_:5rPeKe9bxfq4XOZDtWBqQQ2gy3sljChtTwP7YuHAbRw <https://www.w3.org/2018/credentials#issuanceDate> \"2010-01-01T19:23:24Z\"^^<http://www.w3.org/2001/XMLSchema#dateTime> .\n',
        '_:5rPeKe9bxfq4XOZDtWBqQQ2gy3sljChtTwP7YuHAbRw <https://www.w3.org/2018/credentials#issuer> <did:key:zDnaekGZTbQBerwcehBSXLqAg6s55hVEBms1zFy89VHXtJSa9> .\n',
        '_:60VTj_8ZrVXlgJhbS4QnqCkgd0zsmM7YL1K5sBYv6N4 <urn:example:driverLicense> _:XqefD0KC4zrzEbFJhvdhYTGzRYW3RhjcQvfkpkWqDpc .\n',
        '_:XqefD0KC4zrzEbFJhvdhYTGzRYW3RhjcQvfkpkWqDpc <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <urn:example:DriverLicense> .\n',
        '_:XqefD0KC4zrzEbFJhvdhYTGzRYW3RhjcQvfkpkWqDpc <urn:example:dateOfBirth> \"01-01-1990\" .\n',
        '_:XqefD0KC4zrzEbFJhvdhYTGzRYW3RhjcQvfkpkWqDpc <urn:example:documentIdentifier> \"T21387yc328c7y32h23f23\" .\n',
        '_:XqefD0KC4zrzEbFJhvdhYTGzRYW3RhjcQvfkpkWqDpc <urn:example:expiration> \"01-01-2030\" .\n',
        '_:XqefD0KC4zrzEbFJhvdhYTGzRYW3RhjcQvfkpkWqDpc <urn:example:issuingAuthority> \"VA\" .\n'
      ];
      /* eslint-enable max-len */
      result.should.deep.equal(expectedResult);
    });
  });
});

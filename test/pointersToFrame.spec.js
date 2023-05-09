/*!
 * Copyright (c) 2023 Digital Bazaar, Inc. All rights reserved.
 */
import {expect} from 'chai';

import * as primitives from '../lib/di-sd-primitives/index.js';
import {
  alumniCredential,
  dlCredential,
  dlCredentialNoIds,
  FRAME_FLAGS
} from './mock-data.js';
import jsonld from 'jsonld';
import {loader} from './documentLoader.js';

const documentLoader = loader.build();

describe('di-sd-primitives', () => {
  describe('pointersToFrame()', () => {
    it('should convert one JSON pointer w/ types', async () => {
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
        id: alumniCredential.id,
        type: alumniCredential.type,
        credentialSubject: {
          id: alumniCredential.credentialSubject.id
        }
      };
      result.should.deep.equal(expectedFrame);
    });

    it('should convert one JSON pointer w/o types', async () => {
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
        id: alumniCredential.id,
        credentialSubject: {
          id: alumniCredential.credentialSubject.id
        }
      };
      result.should.deep.equal(expectedFrame);
    });

    it('should convert one nested JSON pointer w/ IDs', async () => {
      const pointer = '/credentialSubject/driverLicense/dateOfBirth';

      let result;
      let error;
      try {
        result = await primitives.pointersToFrame(
          {document: dlCredential, pointers: [pointer]});
      } catch(e) {
        error = e;
      }
      expect(error).to.not.exist;
      expect(result).to.exist;

      const expectedFrame = {
        '@context': dlCredential['@context'],
        id: dlCredential.id,
        type: dlCredential.type,
        credentialSubject: {
          id: dlCredential.credentialSubject.id,
          driverLicense: {
            type: dlCredential.credentialSubject.driverLicense.type,
            dateOfBirth:
              dlCredential.credentialSubject.driverLicense.dateOfBirth
          }
        }
      };
      result.should.deep.equal(expectedFrame);
    });

    it('should convert one nested JSON pointer w/o IDs', async () => {
      const pointer = '/credentialSubject/driverLicense/dateOfBirth';

      let result;
      let error;
      try {
        result = await primitives.pointersToFrame(
          {document: dlCredentialNoIds, pointers: [pointer]});
      } catch(e) {
        error = e;
      }
      expect(error).to.not.exist;
      expect(result).to.exist;

      const expectedFrame = {
        '@context': dlCredentialNoIds['@context'],
        type: dlCredentialNoIds.type,
        credentialSubject: {
          driverLicense: {
            type: dlCredentialNoIds.credentialSubject.driverLicense.type,
            dateOfBirth:
            dlCredentialNoIds.credentialSubject.driverLicense.dateOfBirth
          }
        }
      };
      result.should.deep.equal(expectedFrame);
    });

    it('should convert N JSON pointers w/ IDs', async () => {
      const pointers = [
        '/credentialSubject/driverLicense/dateOfBirth',
        '/credentialSubject/driverLicense/expirationDate'
      ];

      let result;
      let error;
      try {
        result = await primitives.pointersToFrame(
          {document: dlCredential, pointers});
      } catch(e) {
        error = e;
      }
      expect(error).to.not.exist;
      expect(result).to.exist;

      const expectedFrame = {
        '@context': dlCredential['@context'],
        id: dlCredential.id,
        type: dlCredential.type,
        credentialSubject: {
          id: dlCredential.credentialSubject.id,
          driverLicense: {
            type: dlCredential.credentialSubject.driverLicense.type,
            dateOfBirth:
              dlCredential.credentialSubject.driverLicense.dateOfBirth,
            expirationDate:
              dlCredential.credentialSubject.driverLicense.expirationDate
          }
        }
      };
      result.should.deep.equal(expectedFrame);
    });

    it('should convert N JSON pointers w/o IDs', async () => {
      const pointers = [
        '/credentialSubject/driverLicense/dateOfBirth',
        '/credentialSubject/driverLicense/expirationDate'
      ];

      let result;
      let error;
      try {
        result = await primitives.pointersToFrame(
          {document: dlCredentialNoIds, pointers});
      } catch(e) {
        error = e;
      }
      expect(error).to.not.exist;
      expect(result).to.exist;

      const expectedFrame = {
        '@context': dlCredentialNoIds['@context'],
        type: dlCredentialNoIds.type,
        credentialSubject: {
          driverLicense: {
            type: dlCredentialNoIds.credentialSubject.driverLicense.type,
            dateOfBirth:
              dlCredentialNoIds.credentialSubject.driverLicense.dateOfBirth,
            expirationDate:
              dlCredential.credentialSubject.driverLicense.expirationDate
          }
        }
      };
      result.should.deep.equal(expectedFrame);
    });

    it('should select data matching N JSON pointers w/ IDs', async () => {
      const pointers = [
        '/credentialSubject/driverLicense/dateOfBirth',
        '/credentialSubject/driverLicense/expirationDate'
      ];

      let result;
      let error;
      try {
        const frame = await primitives.pointersToFrame(
          {document: dlCredential, pointers});
        const options = {...FRAME_FLAGS, safe: true, documentLoader};
        result = await jsonld.frame(dlCredential, frame, options);
      } catch(e) {
        error = e;
      }
      expect(error).to.not.exist;
      expect(result).to.exist;

      const expected = {
        '@context': dlCredential['@context'],
        id: dlCredential.id,
        type: dlCredential.type,
        credentialSubject: {
          id: dlCredential.credentialSubject.id,
          driverLicense: {
            type: dlCredential.credentialSubject.driverLicense.type,
            dateOfBirth:
              dlCredential.credentialSubject.driverLicense.dateOfBirth,
            expirationDate:
              dlCredential.credentialSubject.driverLicense.expirationDate
          }
        }
      };
      result.should.deep.equal(expected);
    });

    it('should select data matching N JSON pointers w/o IDs', async () => {
      const pointers = [
        '/credentialSubject/driverLicense/dateOfBirth',
        '/credentialSubject/driverLicense/expirationDate'
      ];

      let result;
      let error;
      try {
        const frame = await primitives.pointersToFrame(
          {document: dlCredentialNoIds, pointers});
        const options = {...FRAME_FLAGS, safe: true, documentLoader};
        result = await jsonld.frame(dlCredentialNoIds, frame, options);
      } catch(e) {
        error = e;
      }
      expect(error).to.not.exist;
      expect(result).to.exist;

      const expected = {
        '@context': dlCredentialNoIds['@context'],
        type: dlCredentialNoIds.type,
        credentialSubject: {
          driverLicense: {
            type: dlCredentialNoIds.credentialSubject.driverLicense.type,
            dateOfBirth:
              dlCredentialNoIds.credentialSubject.driverLicense.dateOfBirth,
            expirationDate:
              dlCredential.credentialSubject.driverLicense.expirationDate
          }
        }
      };
      result.should.deep.equal(expected);
    });
  });
});

/*!
 * Copyright (c) 2023 Digital Bazaar, Inc. All rights reserved.
 */
import * as EcdsaMultikey from '@digitalbazaar/ecdsa-multikey';
import * as ecdsaSd2023Cryptosuite from '../lib/index.js';
import {ecdsaMultikeyKeyPair} from './mock-data.js';
import {expect} from 'chai';

const {
  createDiscloseCryptosuite,
  createSignCryptosuite,
  createVerifyCryptosuite
} = ecdsaSd2023Cryptosuite;

describe('ecdsa-sd-2023 cryptosuite', () => {
  describe('exports', () => {
    it('should have proper exports', async () => {
      should.exist(ecdsaSd2023Cryptosuite);
      ecdsaSd2023Cryptosuite.createDiscloseCryptosuite.should.be.a('function');
      ecdsaSd2023Cryptosuite.createSignCryptosuite.should.be.a('function');
      ecdsaSd2023Cryptosuite.createVerifyCryptosuite.should.be.a('function');
    });
  });

  describe('createSignCryptosuite', () => {
    it('should have proper exports', async () => {
      const cryptosuite = await createSignCryptosuite();
      should.exist(cryptosuite);
      cryptosuite.name.should.equal('ecdsa-sd-2023');
      cryptosuite.requiredAlgorithm.should.equal('P-256');
      cryptosuite.createVerifier.should.be.a('function');
      cryptosuite.createVerifyData.should.be.a('function');
      cryptosuite.createProofValue.should.be.a('function');
      cryptosuite.options.should.be.an('object');
    });
  });

  describe('createDiscloseCryptosuite', () => {
    it('should have proper exports', async () => {
      const cryptosuite = await createDiscloseCryptosuite();
      should.exist(cryptosuite);
      cryptosuite.name.should.equal('ecdsa-sd-2023');
      cryptosuite.requiredAlgorithm.should.equal('P-256');
      cryptosuite.createVerifier.should.be.a('function');
      cryptosuite.createVerifyData.should.be.a('function');
      cryptosuite.createProofValue.should.be.a('function');
      cryptosuite.derive.should.be.a('function');
      cryptosuite.options.should.be.an('object');
    });
  });

  describe('createVerifyCryptosuite', () => {
    it('should have proper exports', async () => {
      const cryptosuite = await createVerifyCryptosuite();
      should.exist(cryptosuite);
      cryptosuite.name.should.equal('ecdsa-sd-2023');
      cryptosuite.requiredAlgorithm.should.equal('P-256');
      cryptosuite.createVerifier.should.be.a('function');
      cryptosuite.createVerifyData.should.be.a('function');
    });
  });

  describe('createVerifier()', () => {
    it('should fail with a sign cryptosuite', async () => {
      const cryptosuite = await createSignCryptosuite();
      let verifier;
      let error;
      const keyPair = await EcdsaMultikey.from({...ecdsaMultikeyKeyPair});
      keyPair.type = 'BadKeyType';
      try {
        verifier = await cryptosuite.createVerifier({
          verificationMethod: keyPair
        });
      } catch(e) {
        error = e;
      }

      expect(error).to.exist;
      expect(verifier).to.not.exist;
      error.message.should.equal(
        'This cryptosuite must only be used with "sign".');
    });

    it('should fail with a disclose cryptosuite', async () => {
      const cryptosuite = await createDiscloseCryptosuite();
      let verifier;
      let error;
      const keyPair = await EcdsaMultikey.from({...ecdsaMultikeyKeyPair});
      keyPair.type = 'BadKeyType';
      try {
        verifier = await cryptosuite.createVerifier({
          verificationMethod: keyPair
        });
      } catch(e) {
        error = e;
      }

      expect(error).to.exist;
      expect(verifier).to.not.exist;
      error.message.should.equal(
        'This cryptosuite must only be used with "derive".');
    });

    it('should pass with ECDSA Multikey', async () => {
      const cryptosuite = await createVerifyCryptosuite();
      let verifier;
      let error;
      try {
        verifier = await cryptosuite.createVerifier({
          verificationMethod: {...ecdsaMultikeyKeyPair}
        });
      } catch(e) {
        error = e;
      }

      expect(error).to.not.exist;
      expect(verifier).to.exist;
      verifier.algorithm.should.equal('P-256');
      verifier.id.should.equal(
        'did:key:zDnaekGZTbQBerwcehBSXLqAg6s55hVEBms1zFy89VHXtJSa9' +
        '#zDnaekGZTbQBerwcehBSXLqAg6s55hVEBms1zFy89VHXtJSa9');
      verifier.verify.should.be.a('function');
    });

    it('should fail w/ unsupported key type', async () => {
      const cryptosuite = await createVerifyCryptosuite();
      let verifier;
      let error;
      const keyPair = await EcdsaMultikey.from({...ecdsaMultikeyKeyPair});
      keyPair.type = 'BadKeyType';
      try {
        verifier = await cryptosuite.createVerifier({
          verificationMethod: keyPair
        });
      } catch(e) {
        error = e;
      }

      expect(error).to.exist;
      expect(verifier).to.not.exist;
      error.message.should.equal('Unsupported key type "BadKeyType".');
    });
  });
});

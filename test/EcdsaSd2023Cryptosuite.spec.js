/*!
 * Copyright (c) 2023 Digital Bazaar, Inc. All rights reserved.
 */
import * as EcdsaMultikey from '@digitalbazaar/ecdsa-multikey';
import * as ecdsaSd2023Cryptosuite from '../lib/index.js';
import {
  alumniCredential,
  ecdsaMultikeyKeyPair
} from './mock-data.js';
import {DataIntegrityProof} from '@digitalbazaar/data-integrity';
import {expect} from 'chai';
import jsigs from 'jsonld-signatures';
import {loader} from './documentLoader.js';

const {
  createDiscloseCryptosuite,
  createSignCryptosuite,
  createVerifyCryptosuite
} = ecdsaSd2023Cryptosuite;

const {purposes: {AssertionProofPurpose}} = jsigs;

const documentLoader = loader.build();

describe('EcdsaSd2023Cryptosuite', () => {
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

  describe('sign()', () => {
    it('should sign a document', async () => {
      const cryptosuite = await createSignCryptosuite();
      const unsignedCredential = JSON.parse(JSON.stringify(alumniCredential));
      const keyPair = await EcdsaMultikey.from({...ecdsaMultikeyKeyPair});
      const date = '2023-03-01T21:29:24Z';
      const suite = new DataIntegrityProof({
        signer: keyPair.signer(), date, cryptosuite
      });

      let error;
      try {
        await jsigs.sign(unsignedCredential, {
          suite,
          purpose: new AssertionProofPurpose(),
          documentLoader
        });
      } catch(e) {
        error = e;
      }

      expect(error).to.not.exist;
    });

    it('should fail to sign with a disclose cryptosuite', async () => {
      const cryptosuite = await createDiscloseCryptosuite();
      const unsignedCredential = JSON.parse(JSON.stringify(alumniCredential));

      const keyPair = await EcdsaMultikey.from({...ecdsaMultikeyKeyPair});
      const date = '2023-03-01T21:29:24Z';
      const suite = new DataIntegrityProof({
        signer: keyPair.signer(), date, cryptosuite
      });

      let error;
      try {
        await jsigs.sign(unsignedCredential, {
          suite,
          purpose: new AssertionProofPurpose(),
          documentLoader
        });
      } catch(e) {
        error = e;
      }

      expect(error).to.exist;
      error.message.should.equal(
        'This cryptosuite must only be used with "derive".');
    });

    it('should fail to sign with undefined term', async () => {
      const cryptosuite = await createSignCryptosuite();
      const unsignedCredential = JSON.parse(JSON.stringify(alumniCredential));
      unsignedCredential.undefinedTerm = 'foo';

      const keyPair = await EcdsaMultikey.from({...ecdsaMultikeyKeyPair});
      const date = '2023-03-01T21:29:24Z';
      const suite = new DataIntegrityProof({
        signer: keyPair.signer(), date, cryptosuite
      });

      let error;
      try {
        await jsigs.sign(unsignedCredential, {
          suite,
          purpose: new AssertionProofPurpose(),
          documentLoader
        });
      } catch(e) {
        error = e;
      }

      expect(error).to.exist;
      expect(error.name).to.equal('jsonld.ValidationError');
    });

    it('should fail to sign with relative type URL', async () => {
      const cryptosuite = await createSignCryptosuite();
      const unsignedCredential = JSON.parse(JSON.stringify(alumniCredential));
      unsignedCredential.type.push('UndefinedType');

      const keyPair = await EcdsaMultikey.from({...ecdsaMultikeyKeyPair});
      const date = '2023-03-01T21:29:24Z';
      const suite = new DataIntegrityProof({
        signer: keyPair.signer(), date, cryptosuite
      });

      let error;
      try {
        await jsigs.sign(unsignedCredential, {
          suite,
          purpose: new AssertionProofPurpose(),
          documentLoader
        });
      } catch(e) {
        error = e;
      }

      expect(error).to.exist;
      expect(error.name).to.equal('jsonld.ValidationError');
    });

    it('should fail to sign with incorrect signer algorithm', async () => {
      const cryptosuite = await createSignCryptosuite();
      const keyPair = await EcdsaMultikey.from({...ecdsaMultikeyKeyPair});
      const date = '2023-03-01T21:29:24Z';
      const signer = keyPair.signer();
      signer.algorithm = 'wrong-algorithm';

      let error;
      try {
        new DataIntegrityProof({signer, date, cryptosuite});
      } catch(e) {
        error = e;
      }

      const errorMessage = `The signer's algorithm "${signer.algorithm}" ` +
        `does not match the required algorithm for the cryptosuite ` +
        `"${cryptosuite.requiredAlgorithm}".`;

      expect(error).to.exist;
      expect(error.message).to.equal(errorMessage);
    });
  });

  describe.skip('derive()', () => {
    // FIXME:
  });

  describe.skip('verify()', () => {
    let signedCredential;

    before(async () => {
      const cryptosuite = await createSignCryptosuite();
      const unsignedCredential = JSON.parse(JSON.stringify(alumniCredential));

      const keyPair = await EcdsaMultikey.from({...ecdsaMultikeyKeyPair});
      const date = '2023-03-01T21:29:24Z';
      const suite = new DataIntegrityProof({
        signer: keyPair.signer(), date, cryptosuite
      });

      signedCredential = await jsigs.sign(unsignedCredential, {
        suite,
        purpose: new AssertionProofPurpose(),
        documentLoader
      });
    });

    it('should fail with a disclose cryptosuite', async () => {
      const cryptosuite = await createDiscloseCryptosuite();
      const suite = new DataIntegrityProof({cryptosuite});
      const signedCredentialCopy =
        JSON.parse(JSON.stringify(signedCredential));

      const result = await jsigs.verify(signedCredentialCopy, {
        suite,
        purpose: new AssertionProofPurpose(),
        documentLoader
      });

      const {error} = result.results[0];

      expect(result.verified).to.be.false;
      error.message.should.equal(
        'This cryptosuite must only be used with "derive".');
    });

    it('should verify a document', async () => {
      const cryptosuite = await createVerifyCryptosuite();
      const suite = new DataIntegrityProof({cryptosuite});
      const result = await jsigs.verify(signedCredential, {
        suite,
        purpose: new AssertionProofPurpose(),
        documentLoader
      });

      expect(result.verified).to.be.true;
    });

    it('should fail if "proofValue" is not string', async () => {
      const cryptosuite = await createVerifyCryptosuite();
      const suite = new DataIntegrityProof({cryptosuite});
      const signedCredentialCopy =
        JSON.parse(JSON.stringify(signedCredential));
      // intentionally modify proofValue type to not be string
      signedCredentialCopy.proof.proofValue = {};

      const result = await jsigs.verify(signedCredentialCopy, {
        suite,
        purpose: new AssertionProofPurpose(),
        documentLoader
      });

      const {error} = result.results[0];

      expect(result.verified).to.be.false;
      expect(error.name).to.equal('TypeError');
      expect(error.message).to.equal(
        'The proof does not include a valid "proofValue" property.');
    });

    it('should fail verification if "proofValue" is not given', async () => {
      const cryptosuite = await createVerifyCryptosuite();
      const suite = new DataIntegrityProof({cryptosuite});
      const signedCredentialCopy =
        JSON.parse(JSON.stringify(signedCredential));
      // intentionally modify proofValue to be undefined
      signedCredentialCopy.proof.proofValue = undefined;

      const result = await jsigs.verify(signedCredentialCopy, {
        suite,
        purpose: new AssertionProofPurpose(),
        documentLoader
      });

      const {error} = result.results[0];

      expect(result.verified).to.be.false;
      expect(error.name).to.equal('TypeError');
      expect(error.message).to.equal(
        'The proof does not include a valid "proofValue" property.'
      );
    });

    it('should fail if "proofValue" string does not start with "u"',
      async () => {
        const cryptosuite = await createVerifyCryptosuite();
        const suite = new DataIntegrityProof({cryptosuite});
        const signedCredentialCopy =
          JSON.parse(JSON.stringify(signedCredential));
        // intentionally modify proofValue to not start with 'z'
        signedCredentialCopy.proof.proofValue = 'a';

        const result = await jsigs.verify(signedCredentialCopy, {
          suite,
          purpose: new AssertionProofPurpose(),
          documentLoader
        });

        const {errors} = result.error;

        expect(result.verified).to.be.false;
        expect(errors[0].name).to.equal('Error');
        expect(errors[0].message).to.equal(
          'Only base58btc multibase encoding is supported.'
        );
      }
    );

    it('should fail verification if proof type is not DataIntegrityProof',
      async () => {
        const cryptosuite = await createVerifyCryptosuite();
        const suite = new DataIntegrityProof({cryptosuite});
        const signedCredentialCopy =
          JSON.parse(JSON.stringify(signedCredential));
        // intentionally modify proof type to be InvalidSignature2100
        signedCredentialCopy.proof.type = 'InvalidSignature2100';

        const result = await jsigs.verify(signedCredentialCopy, {
          suite,
          purpose: new AssertionProofPurpose(),
          documentLoader
        });

        const {errors} = result.error;

        expect(result.verified).to.be.false;
        expect(errors[0].name).to.equal('NotFoundError');
      });
  });
});

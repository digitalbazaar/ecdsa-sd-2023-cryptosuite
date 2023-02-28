/*!
 * Copyright (c) 2021-2022 Digital Bazaar, Inc. All rights reserved.
 */
import {expect} from 'chai';

import jsigs from 'jsonld-signatures';
const {purposes: {AssertionProofPurpose}} = jsigs;

import * as Ed25519Multikey from '@digitalbazaar/ed25519-multikey';
import {
  credential,
  ed25519MultikeyKeyPair
} from './mock-data.js';
import {DataIntegrityProof} from '@digitalbazaar/data-integrity';
import {
  Ed25519VerificationKey2018
} from '@digitalbazaar/ed25519-verification-key-2018';
import {
  Ed25519VerificationKey2020
} from '@digitalbazaar/ed25519-verification-key-2020';
import {
  cryptosuite as eddsa2022CryptoSuite
} from '../lib/index.js';

import {loader} from './documentLoader.js';

const documentLoader = loader.build();

describe('Eddsa2022Cryptosuite', () => {
  describe('exports', () => {
    it('it should have proper exports', async () => {
      should.exist(eddsa2022CryptoSuite);
      eddsa2022CryptoSuite.name.should.equal('eddsa-2022');
      eddsa2022CryptoSuite.requiredAlgorithm.should.equal('Ed25519');
      eddsa2022CryptoSuite.canonize.should.be.a('function');
      eddsa2022CryptoSuite.createVerifier.should.be.a('function');
    });
  });

  describe('canonize()', () => {
    it('should canonize using URDNA2015 w/ n-quads', async () => {
      const unsignedCredential = {...credential};

      let result;
      let error;
      try {
        result = await eddsa2022CryptoSuite.canonize(
          unsignedCredential, {documentLoader});
      } catch(e) {
        error = e;
      }

      expect(error).to.not.exist;
      expect(result).to.exist;
      /* eslint-disable max-len */
      const expectedResult = `<http://example.edu/credentials/1872> <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <https://schema.org#AlumniCredential> .
<http://example.edu/credentials/1872> <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <https://www.w3.org/2018/credentials#VerifiableCredential> .
<http://example.edu/credentials/1872> <https://www.w3.org/2018/credentials#credentialSubject> <https://example.edu/students/alice> .
<http://example.edu/credentials/1872> <https://www.w3.org/2018/credentials#issuanceDate> "2010-01-01T19:23:24Z"^^<http://www.w3.org/2001/XMLSchema#dateTime> .
<http://example.edu/credentials/1872> <https://www.w3.org/2018/credentials#issuer> <https://example.edu/issuers/565049> .
<https://example.edu/students/alice> <https://schema.org#alumniOf> "Example University" .\n`;
      /* eslint-enable max-len */
      result.should.equal(expectedResult);
    });
  });

  describe('createVerifier()', () => {
    it('should create a verifier with Ed25519 Multikey', async () => {
      let verifier;
      let error;
      try {
        verifier = await eddsa2022CryptoSuite.createVerifier({
          verificationMethod: {...ed25519MultikeyKeyPair}
        });
      } catch(e) {
        error = e;
      }
      expect(error).to.not.exist;
      expect(verifier).to.exist;
      verifier.algorithm.should.equal('Ed25519');
      verifier.id.should.equal('https://example.edu/issuers/565049#z6MkwXG2Wj' +
        'eQnNxSoynSGYU8V9j3QzP3JSqhdmkHc6SaVWoT');
      verifier.verify.should.be.a('function');
    });
    it('should create a verifier with Ed25519VerificationKey2020', async () => {
      const controller = 'did:example:1234';
      let verifier;
      let error;
      const keyPair2020 = await Ed25519VerificationKey2020.generate({
        controller
      });
      try {
        verifier = await eddsa2022CryptoSuite.createVerifier({
          verificationMethod: keyPair2020
        });
      } catch(e) {
        error = e;
      }

      expect(error).to.not.exist;
      expect(verifier).to.exist;
      verifier.algorithm.should.equal('Ed25519');
      verifier.id.includes(controller);
      verifier.verify.should.be.a('function');
    });
    it('should create a verifier with Ed25519VerificationKey2018', async () => {
      const controller = 'did:example:1234';
      let verifier;
      let error;
      const keyPair2018 = await Ed25519VerificationKey2018.generate({
        controller
      });
      try {
        verifier = await eddsa2022CryptoSuite.createVerifier({
          verificationMethod: keyPair2018
        });
      } catch(e) {
        error = e;
      }

      expect(error).to.not.exist;
      expect(verifier).to.exist;
      verifier.algorithm.should.equal('Ed25519');
      verifier.id.includes(controller);
      verifier.verify.should.be.a('function');
    });
    it('should fail to create a verifier w/ unsupported key type', async () => {
      const controller = 'did:example:1234';
      let error;
      const keyPair2018 = await Ed25519VerificationKey2018.generate({
        controller
      });
      keyPair2018.type = 'BadKeyType';
      try {
        await eddsa2022CryptoSuite.createVerifier({
          verificationMethod: keyPair2018
        });
      } catch(e) {
        error = e;
      }

      expect(error).to.exist;
      error.message.should.equal('Unsupported key type "BadKeyType".');
    });
  });
  describe('sign() and verify()', () => {
    it('should sign a document with a key pair', async () => {
      const unsignedCredential = {...credential};

      const keyPair = await Ed25519Multikey.from({...ed25519MultikeyKeyPair});
      const date = '2022-09-06T21:29:24Z';
      const suite = new DataIntegrityProof({
        signer: keyPair.signer(), date, cryptosuite: eddsa2022CryptoSuite
      });

      const signedCredential = await jsigs.sign(unsignedCredential, {
        suite,
        purpose: new AssertionProofPurpose(),
        documentLoader
      });
      expect(signedCredential).to.have.property('proof');
      expect(signedCredential.proof.proofValue).to
        .equal('z3mUohG26PXywKkpw9v3Eacceo6kEDL44ps37hgYLj434kJhfigbqUATJJJbM' +
          'kue8HgagkTEtNXNkojGGiZU48cR9');
    });

    it('should fail to sign with undefined term', async () => {
      const unsignedCredential = JSON.parse(JSON.stringify(credential));
      unsignedCredential.undefinedTerm = 'foo';

      const keyPair = await Ed25519Multikey.from({...ed25519MultikeyKeyPair});
      const date = '2022-09-06T21:29:24Z';
      const suite = new DataIntegrityProof({
        signer: keyPair.signer(), date, cryptosuite: eddsa2022CryptoSuite
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
      const unsignedCredential = JSON.parse(JSON.stringify(credential));
      unsignedCredential.type.push('UndefinedType');

      const keyPair = await Ed25519Multikey.from({...ed25519MultikeyKeyPair});
      const date = '2022-09-06T21:29:24Z';
      const suite = new DataIntegrityProof({
        signer: keyPair.signer(), date, cryptosuite: eddsa2022CryptoSuite
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
      const keyPair = await Ed25519Multikey.from({...ed25519MultikeyKeyPair});
      const date = '2022-09-06T21:29:24Z';
      const signer = keyPair.signer();
      signer.algorithm = 'wrong-algorithm';

      let error;
      try {
        new DataIntegrityProof({
          signer, date, cryptosuite: eddsa2022CryptoSuite
        });
      } catch(e) {
        error = e;
      }

      const errorMessage = `The signer's algorithm "${signer.algorithm}" ` +
        `does not match the required algorithm for the cryptosuite ` +
        `"${eddsa2022CryptoSuite.requiredAlgorithm}".`;
      expect(error).to.exist;
      expect(error.message).to.equal(errorMessage);
    });
  });

  describe('verify() multikey key type', () => {
    let signedCredential;

    before(async () => {
      const unsignedCredential = {...credential};

      const keyPair = await Ed25519Multikey.from({...ed25519MultikeyKeyPair});
      const date = '2022-09-06T21:29:24Z';
      const suite = new DataIntegrityProof({
        signer: keyPair.signer(), date, cryptosuite: eddsa2022CryptoSuite
      });

      signedCredential = await jsigs.sign(unsignedCredential, {
        suite,
        purpose: new AssertionProofPurpose(),
        documentLoader
      });
    });

    it('should verify a document', async () => {
      const suite = new DataIntegrityProof({cryptosuite: eddsa2022CryptoSuite});
      const result = await jsigs.verify(signedCredential, {
        suite,
        purpose: new AssertionProofPurpose(),
        documentLoader
      });
      expect(result.verified).to.be.true;
    });

    it('should fail verification if "proofValue" is not string',
      async () => {
        const suite = new DataIntegrityProof({
          cryptosuite: eddsa2022CryptoSuite
        });
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
          'The proof does not include a valid "proofValue" property.'
        );
      });

    it('should fail verification if "proofValue" is not given',
      async () => {
        const suite = new DataIntegrityProof({
          cryptosuite: eddsa2022CryptoSuite
        });
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

    it('should fail verification if proofValue string does not start with "z"',
      async () => {
        const suite = new DataIntegrityProof({
          cryptosuite: eddsa2022CryptoSuite
        });
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
      });

    it('should fail verification if proof type is not DataIntegrityProof',
      async () => {
        const suite = new DataIntegrityProof({
          cryptosuite: eddsa2022CryptoSuite
        });
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

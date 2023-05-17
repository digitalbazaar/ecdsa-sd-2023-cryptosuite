/*!
 * Copyright (c) 2023 Digital Bazaar, Inc. All rights reserved.
 */
import * as EcdsaMultikey from '@digitalbazaar/ecdsa-multikey';
import * as ecdsaSd2023Cryptosuite from '../lib/index.js';
import {
  alumniCredential,
  dlCredential,
  dlCredentialNoIds,
  ecdsaMultikeyKeyPair
} from './mock-data.js';
import {DataIntegrityProof} from '@digitalbazaar/data-integrity';
import {expect} from 'chai';
import jsigs from 'jsonld-signatures';
import {klona} from 'klona';
import {loader} from './documentLoader.js';

const {
  createDiscloseCryptosuite,
  createSignCryptosuite,
  createVerifyCryptosuite
} = ecdsaSd2023Cryptosuite;

const {purposes: {AssertionProofPurpose}} = jsigs;

const documentLoader = loader.build();

describe.skip('verify()', () => {
  let signedAlumniCredential;
  let revealedAlumniCredential;
  before(async () => {
    const cryptosuite = await createSignCryptosuite();
    const unsignedCredential = klona(alumniCredential);

    const keyPair = await EcdsaMultikey.from({...ecdsaMultikeyKeyPair});
    const date = '2023-03-01T21:29:24Z';
    const suite = new DataIntegrityProof({
      signer: keyPair.signer(), date, cryptosuite
    });

    signedAlumniCredential = await jsigs.sign(unsignedCredential, {
      suite,
      purpose: new AssertionProofPurpose(),
      documentLoader
    });

    {
      const cryptosuite = await createDiscloseCryptosuite({
        selectivePointers: [
          '/credentialSubject/id'
        ]
      });
      const suite = new DataIntegrityProof({cryptosuite});
      revealedAlumniCredential = await jsigs.derive(signedAlumniCredential, {
        suite,
        purpose: new AssertionProofPurpose(),
        documentLoader
      });
    }
  });

  let signedDlCredential;
  let revealedDlCredential;
  before(async () => {
    const cryptosuite = await createSignCryptosuite();
    const unsignedCredential = klona(dlCredential);

    const keyPair = await EcdsaMultikey.from({...ecdsaMultikeyKeyPair});
    const date = '2023-03-01T21:29:24Z';
    const suite = new DataIntegrityProof({
      signer: keyPair.signer(), date, cryptosuite
    });

    signedDlCredential = await jsigs.sign(unsignedCredential, {
      suite,
      purpose: new AssertionProofPurpose(),
      documentLoader
    });

    {
      const cryptosuite = await createDiscloseCryptosuite({
        selectivePointers: [
          '/credentialSubject/driverLicense/dateOfBirth',
          '/credentialSubject/driverLicense/expirationDate'
        ]
      });
      const suite = new DataIntegrityProof({cryptosuite});
      revealedDlCredential = await jsigs.derive(signedDlCredential, {
        suite,
        purpose: new AssertionProofPurpose(),
        documentLoader
      });
    }
  });

  let signedDlCredentialNoIds;
  let revealedDlCredentialNoIds;
  before(async () => {
    const cryptosuite = await createSignCryptosuite();
    const unsignedCredential = klona(dlCredentialNoIds);

    const keyPair = await EcdsaMultikey.from({...ecdsaMultikeyKeyPair});
    const date = '2023-03-01T21:29:24Z';
    const suite = new DataIntegrityProof({
      signer: keyPair.signer(), date, cryptosuite
    });

    signedDlCredentialNoIds = await jsigs.sign(unsignedCredential, {
      suite,
      purpose: new AssertionProofPurpose(),
      documentLoader
    });

    {
      const cryptosuite = await createDiscloseCryptosuite({
        selectivePointers: [
          '/credentialSubject/driverLicense/dateOfBirth',
          '/credentialSubject/driverLicense/expirationDate'
        ]
      });
      const suite = new DataIntegrityProof({cryptosuite});
      revealedDlCredentialNoIds = await jsigs.derive(signedDlCredentialNoIds, {
        suite,
        purpose: new AssertionProofPurpose(),
        documentLoader
      });
    }
  });

  let signedDlCredentialNoIdsMandatory;
  let revealMandatoryOnly;
  let revealSelectiveAndMandatory;
  before(async () => {
    const cryptosuite = await createSignCryptosuite({
      mandatoryPointers: [
        '/credentialSubject/driverLicense/issuingAuthority'
      ]
    });
    const unsignedCredential = klona(dlCredentialNoIds);

    const keyPair = await EcdsaMultikey.from({...ecdsaMultikeyKeyPair});
    const date = '2023-03-01T21:29:24Z';
    const suite = new DataIntegrityProof({
      signer: keyPair.signer(), date, cryptosuite
    });

    signedDlCredentialNoIdsMandatory = await jsigs.sign(unsignedCredential, {
      suite,
      purpose: new AssertionProofPurpose(),
      documentLoader
    });

    {
      const cryptosuite = await createDiscloseCryptosuite();
      const suite = new DataIntegrityProof({cryptosuite});
      revealMandatoryOnly = await jsigs.derive(
        signedDlCredentialNoIdsMandatory, {
          suite,
          purpose: new AssertionProofPurpose(),
          documentLoader
        });
    }

    {
      const cryptosuite = await createDiscloseCryptosuite({
        selectivePointers: [
          '/credentialSubject/driverLicense/dateOfBirth'
        ]
      });
      const suite = new DataIntegrityProof({cryptosuite});
      revealSelectiveAndMandatory = await jsigs.derive(
        signedDlCredentialNoIdsMandatory, {
          suite,
          purpose: new AssertionProofPurpose(),
          documentLoader
        });
    }
  });

  it('should fail with a disclose cryptosuite', async () => {
    const cryptosuite = await createDiscloseCryptosuite();
    const suite = new DataIntegrityProof({cryptosuite});
    const signedCredentialCopy = klona(signedCredential);

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
    const signedCredentialCopy = klona(signedCredential);
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
    const signedCredentialCopy = klona(signedCredential);
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
      'The proof does not include a valid "proofValue" property.');
  });

  it('should fail if "proofValue" string does not start with "u"',
    async () => {
      const cryptosuite = await createVerifyCryptosuite();
      const suite = new DataIntegrityProof({cryptosuite});
      const signedCredentialCopy = klona(signedCredential);
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
        'Only base58btc multibase encoding is supported.');
    }
  );

  it('should fail verification if proof type is not DataIntegrityProof',
    async () => {
      const cryptosuite = await createVerifyCryptosuite();
      const suite = new DataIntegrityProof({cryptosuite});
      const signedCredentialCopy = klona(signedCredential);
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

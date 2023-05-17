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

describe('verify()', () => {
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
  let revealedMandatoryOnly;
  let revealedSelectiveAndMandatory;
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
      revealedMandatoryOnly = await jsigs.derive(
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
      revealedSelectiveAndMandatory = await jsigs.derive(
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
    const signedCredentialCopy = klona(signedAlumniCredential);

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

  it('should fail if "proofValue" is not a string', async () => {
    const cryptosuite = await createVerifyCryptosuite();
    const suite = new DataIntegrityProof({cryptosuite});
    const signedCredentialCopy = klona(signedAlumniCredential);
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
    const signedCredentialCopy = klona(signedAlumniCredential);
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
      const signedCredentialCopy = klona(signedAlumniCredential);
      // intentionally modify proofValue to not start with 'u'
      signedCredentialCopy.proof.proofValue = 'a';

      const result = await jsigs.verify(signedCredentialCopy, {
        suite,
        purpose: new AssertionProofPurpose(),
        documentLoader
      });

      const {errors} = result.error;

      expect(result.verified).to.be.false;
      expect(errors[0].name).to.equal('TypeError');
      expect(errors[0].cause.message).to.include('Only base64url');
    }
  );

  it('should fail verification if proof type is not DataIntegrityProof',
    async () => {
      const cryptosuite = await createVerifyCryptosuite();
      const suite = new DataIntegrityProof({cryptosuite});
      const signedCredentialCopy = klona(signedAlumniCredential);
      // intentionally modify proof type to be invalid
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

  it('should fail verification if cryptosuite is not "ecdsa-sd-2023"',
    async () => {
      const cryptosuite = await createVerifyCryptosuite();
      const suite = new DataIntegrityProof({cryptosuite});
      const signedCredentialCopy = klona(signedAlumniCredential);
      // intentionally modify proof cryptosuite to be invalid
      signedCredentialCopy.proof.cryptosuite = 'invalid-cryptosuite';

      const result = await jsigs.verify(signedCredentialCopy, {
        suite,
        purpose: new AssertionProofPurpose(),
        documentLoader
      });

      const {errors} = result.error;

      expect(result.verified).to.be.false;
      expect(errors[0].name).to.equal('NotFoundError');
    });

  // FIXME: fail unrevealed doc verification (base proof)

  it.skip('should verify with only the credential subject ID', async () => {
    const cryptosuite = await createVerifyCryptosuite();
    const suite = new DataIntegrityProof({cryptosuite});
    const result = await jsigs.verify(revealedAlumniCredential, {
      suite,
      purpose: new AssertionProofPurpose(),
      documentLoader
    });

    expect(result.verified).to.be.true;
  });

  it.skip('should verify with revealed properties', async () => {
    const cryptosuite = await createVerifyCryptosuite();
    const suite = new DataIntegrityProof({cryptosuite});
    const result = await jsigs.verify(revealedDlCredential, {
      suite,
      purpose: new AssertionProofPurpose(),
      documentLoader
    });

    expect(result.verified).to.be.true;
  });

  it.skip('should verify with revealed properties and bnodes', async () => {
    const cryptosuite = await createVerifyCryptosuite();
    const suite = new DataIntegrityProof({cryptosuite});
    const result = await jsigs.verify(revealedDlCredentialNoIds, {
      suite,
      purpose: new AssertionProofPurpose(),
      documentLoader
    });

    expect(result.verified).to.be.true;
  });

  it.skip('should verify with mandatory properties', async () => {
    const cryptosuite = await createVerifyCryptosuite();
    const suite = new DataIntegrityProof({cryptosuite});
    const result = await jsigs.verify(revealedMandatoryOnly, {
      suite,
      purpose: new AssertionProofPurpose(),
      documentLoader
    });

    expect(result.verified).to.be.true;
  });

  it.skip('should verify with selective + mandatory properties', async () => {
    const cryptosuite = await createVerifyCryptosuite();
    const suite = new DataIntegrityProof({cryptosuite});
    const result = await jsigs.verify(revealedSelectiveAndMandatory, {
      suite,
      purpose: new AssertionProofPurpose(),
      documentLoader
    });

    expect(result.verified).to.be.true;
  });
});

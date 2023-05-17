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
    const signedCredentialCopy = klona(revealedAlumniCredential);

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
    const signedCredentialCopy = klona(revealedAlumniCredential);
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
    const signedCredentialCopy = klona(revealedAlumniCredential);
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
      const signedCredentialCopy = klona(revealedAlumniCredential);
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
      const signedCredentialCopy = klona(revealedAlumniCredential);
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
      const signedCredentialCopy = klona(revealedAlumniCredential);
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

  it('should fail verifying a base proof', async () => {
    const cryptosuite = await createVerifyCryptosuite();
    const suite = new DataIntegrityProof({cryptosuite});
    const result = await jsigs.verify(signedAlumniCredential, {
      suite,
      purpose: new AssertionProofPurpose(),
      documentLoader
    });

    expect(result.verified).to.be.false;
    const {error} = result.results[0];

    expect(result.verified).to.be.false;
    expect(error.name).to.equal('TypeError');
    expect(error.message).to.equal(
      'The proof does not include a valid "proofValue" property.');
  });

  it('should verify with only the credential subject ID', async () => {
    const cryptosuite = await createVerifyCryptosuite();
    const suite = new DataIntegrityProof({cryptosuite});
    const result = await jsigs.verify(revealedAlumniCredential, {
      suite,
      purpose: new AssertionProofPurpose(),
      documentLoader
    });

    expect(result.verified).to.be.true;
  });

  it('should fail with a simple modified reveal doc', async () => {
    const cryptosuite = await createVerifyCryptosuite();
    const suite = new DataIntegrityProof({cryptosuite});
    const signedCredentialCopy = klona(revealedAlumniCredential);
    // intentionally modify `credentialSubject` ID
    signedCredentialCopy.credentialSubject.id = 'urn:invalid';

    const result = await jsigs.verify(signedCredentialCopy, {
      suite,
      purpose: new AssertionProofPurpose(),
      documentLoader
    });

    expect(result.verified).to.be.false;
    const {error} = result.results[0];

    expect(result.verified).to.be.false;
    expect(error.name).to.equal('Error');
    expect(error.message).to.include('Invalid signature');
  });

  it('should fail w/added message', async () => {
    const cryptosuite = await createVerifyCryptosuite();
    const suite = new DataIntegrityProof({cryptosuite});
    const signedCredentialCopy = klona(revealedAlumniCredential);
    // intentionally add data (should fail even if it's the same as original)
    // because signature count is different
    signedCredentialCopy.credentialSubject.alumniOf =
      alumniCredential.credentialSubject.alumniOf;

    const result = await jsigs.verify(signedCredentialCopy, {
      suite,
      purpose: new AssertionProofPurpose(),
      documentLoader
    });

    expect(result.verified).to.be.false;
    const {error} = result.results[0];

    expect(result.verified).to.be.false;
    expect(error.name).to.equal('Error');
    expect(error.message).to.include('Signature count');
  });

  it('should verify with revealed properties', async () => {
    const cryptosuite = await createVerifyCryptosuite();
    const suite = new DataIntegrityProof({cryptosuite});
    const result = await jsigs.verify(revealedDlCredential, {
      suite,
      purpose: new AssertionProofPurpose(),
      documentLoader
    });

    expect(result.verified).to.be.true;
  });

  it('should verify with revealed properties and bnodes', async () => {
    const cryptosuite = await createVerifyCryptosuite();
    const suite = new DataIntegrityProof({cryptosuite});
    const result = await jsigs.verify(revealedDlCredentialNoIds, {
      suite,
      purpose: new AssertionProofPurpose(),
      documentLoader
    });

    expect(result.verified).to.be.true;
  });

  it('should fail with a modified ID in bnodes reveal doc', async () => {
    const cryptosuite = await createVerifyCryptosuite();
    const suite = new DataIntegrityProof({cryptosuite});
    const signedCredentialCopy = klona(revealedDlCredentialNoIds);
    // intentionally modify `credentialSubject` ID
    signedCredentialCopy.credentialSubject.id = 'urn:invalid';

    const result = await jsigs.verify(signedCredentialCopy, {
      suite,
      purpose: new AssertionProofPurpose(),
      documentLoader
    });

    expect(result.verified).to.be.false;
    const {error} = result.results[0];

    expect(result.verified).to.be.false;
    expect(error.name).to.equal('Error');
    expect(error.message).to.include('Invalid signature');
  });

  it('should fail with a modified value in bnodes reveal doc', async () => {
    const cryptosuite = await createVerifyCryptosuite();
    const suite = new DataIntegrityProof({cryptosuite});
    const signedCredentialCopy = klona(revealedDlCredentialNoIds);
    // intentionally modify some revealed value
    signedCredentialCopy.credentialSubject.driverLicense.dateOfBirth =
      'invalid';

    const result = await jsigs.verify(signedCredentialCopy, {
      suite,
      purpose: new AssertionProofPurpose(),
      documentLoader
    });

    expect(result.verified).to.be.false;
    const {error} = result.results[0];

    expect(result.verified).to.be.false;
    expect(error.name).to.equal('Error');
    expect(error.message).to.include('Invalid signature');
  });

  it('should fail w/added message to bnodes reveal', async () => {
    const cryptosuite = await createVerifyCryptosuite();
    const suite = new DataIntegrityProof({cryptosuite});
    const signedCredentialCopy = klona(revealedDlCredentialNoIds);
    // intentionally add data (should fail even if it's the same as original)
    // because signature count is different
    signedCredentialCopy.credentialSubject.driverLicense.issuingAuthority =
      dlCredentialNoIds.credentialSubject.driverLicense.issuingAuthority;

    const result = await jsigs.verify(signedCredentialCopy, {
      suite,
      purpose: new AssertionProofPurpose(),
      documentLoader
    });

    expect(result.verified).to.be.false;
    const {error} = result.results[0];

    expect(result.verified).to.be.false;
    expect(error.name).to.equal('Error');
    expect(error.message).to.include('Signature count');
  });

  it('should verify with mandatory properties', async () => {
    const cryptosuite = await createVerifyCryptosuite();
    const suite = new DataIntegrityProof({cryptosuite});
    const result = await jsigs.verify(revealedMandatoryOnly, {
      suite,
      purpose: new AssertionProofPurpose(),
      documentLoader
    });

    expect(result.verified).to.be.true;
  });

  it('should fail w/modified mandatory property',
    async () => {
      const cryptosuite = await createVerifyCryptosuite();
      const suite = new DataIntegrityProof({cryptosuite});
      const signedCredentialCopy = klona(revealedMandatoryOnly);
      signedCredentialCopy.credentialSubject.driverLicense.issuingAuthority =
        'invalid';

      const result = await jsigs.verify(signedCredentialCopy, {
        suite,
        purpose: new AssertionProofPurpose(),
        documentLoader
      });

      expect(result.verified).to.be.false;
      const {error} = result.results[0];

      expect(result.verified).to.be.false;
      expect(error.name).to.equal('Error');
      expect(error.message).to.include('Invalid signature');
    });

  it('should fail w/added message to mandatory reveal', async () => {
    const cryptosuite = await createVerifyCryptosuite();
    const suite = new DataIntegrityProof({cryptosuite});
    const signedCredentialCopy = klona(revealedMandatoryOnly);
    // intentionally add data (should fail even if it's the same as original)
    // because signature count is different
    signedCredentialCopy.credentialSubject.driverLicense.dateOfBirth =
      dlCredentialNoIds.credentialSubject.driverLicense.dateOfBirth;

    const result = await jsigs.verify(signedCredentialCopy, {
      suite,
      purpose: new AssertionProofPurpose(),
      documentLoader
    });

    expect(result.verified).to.be.false;
    const {error} = result.results[0];

    expect(result.verified).to.be.false;
    expect(error.name).to.equal('Error');
    expect(error.message).to.include('Signature count');
  });

  it('should verify with selective + mandatory properties', async () => {
    const cryptosuite = await createVerifyCryptosuite();
    const suite = new DataIntegrityProof({cryptosuite});
    const result = await jsigs.verify(revealedSelectiveAndMandatory, {
      suite,
      purpose: new AssertionProofPurpose(),
      documentLoader
    });

    expect(result.verified).to.be.true;
  });

  it('should fail w/modified mandatory w/selective + mandatory properties',
    async () => {
      const cryptosuite = await createVerifyCryptosuite();
      const suite = new DataIntegrityProof({cryptosuite});
      const signedCredentialCopy = klona(revealedSelectiveAndMandatory);
      signedCredentialCopy.credentialSubject.driverLicense.issuingAuthority =
        'invalid';

      const result = await jsigs.verify(signedCredentialCopy, {
        suite,
        purpose: new AssertionProofPurpose(),
        documentLoader
      });

      expect(result.verified).to.be.false;
      const {error} = result.results[0];

      expect(result.verified).to.be.false;
      expect(error.name).to.equal('Error');
      expect(error.message).to.include('Invalid signature');
    });

  it('should fail w/modified selective w/selective + mandatory properties',
    async () => {
      const cryptosuite = await createVerifyCryptosuite();
      const suite = new DataIntegrityProof({cryptosuite});
      const signedCredentialCopy = klona(revealedSelectiveAndMandatory);
      signedCredentialCopy.credentialSubject.driverLicense.dateOfBirth =
        'invalid';

      const result = await jsigs.verify(signedCredentialCopy, {
        suite,
        purpose: new AssertionProofPurpose(),
        documentLoader
      });

      expect(result.verified).to.be.false;
      const {error} = result.results[0];

      expect(result.verified).to.be.false;
      expect(error.message).to.include('Invalid signature');
    });

  it('should fail w/same signature count but different data',
    async () => {
      const cryptosuite = await createVerifyCryptosuite();
      const suite = new DataIntegrityProof({cryptosuite});
      const signedCredentialCopy = klona(revealedSelectiveAndMandatory);
      // intentionally add data (should fail even if it's the same as original)
      // because signature count is different
      signedCredentialCopy.credentialSubject.driverLicense.documentIdentifier =
        signedDlCredentialNoIdsMandatory.credentialSubject
          .driverLicense.documentIdentifier;
      // intentionally delete `dateOfBirth` to keep signature count equal
      delete signedCredentialCopy.credentialSubject.driverLicense.dateOfBirth;

      const result = await jsigs.verify(signedCredentialCopy, {
        suite,
        purpose: new AssertionProofPurpose(),
        documentLoader
      });

      expect(result.verified).to.be.false;
      const {error} = result.results[0];

      expect(result.verified).to.be.false;
      expect(error.name).to.equal('Error');
      // should NOT fail due to bad signature count, but due to bad signature
      expect(error.message).to.not.include('Signature count');
      expect(error.message).to.include('Invalid signature');
    });
});
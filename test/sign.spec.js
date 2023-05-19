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
import {klona} from 'klona';
import {loader} from './documentLoader.js';

const {
  createDiscloseCryptosuite,
  createSignCryptosuite
} = ecdsaSd2023Cryptosuite;

const {purposes: {AssertionProofPurpose}} = jsigs;

const documentLoader = loader.build();

describe('sign()', () => {
  it('should sign a document', async () => {
    const cryptosuite = createSignCryptosuite();
    const unsignedCredential = klona(alumniCredential);
    const keyPair = await EcdsaMultikey.from({...ecdsaMultikeyKeyPair});
    const date = '2023-03-01T21:29:24Z';
    const suite = new DataIntegrityProof({
      signer: keyPair.signer(), date, cryptosuite
    });

    let error;
    let signedCredential;
    try {
      signedCredential = await jsigs.sign(unsignedCredential, {
        suite,
        purpose: new AssertionProofPurpose(),
        documentLoader
      });
    } catch(e) {
      error = e;
    }

    expect(error).to.not.exist;
    expect(signedCredential.proof).to.exist;
    expect(signedCredential.proof['@context']).to.not.exist;
  });

  it('should fail to sign with a disclose cryptosuite', async () => {
    const cryptosuite = createDiscloseCryptosuite();
    const unsignedCredential = klona(alumniCredential);

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
    const cryptosuite = createSignCryptosuite();
    const unsignedCredential = klona(alumniCredential);
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
    const cryptosuite = createSignCryptosuite();
    const unsignedCredential = klona(alumniCredential);
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
    const cryptosuite = createSignCryptosuite();
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

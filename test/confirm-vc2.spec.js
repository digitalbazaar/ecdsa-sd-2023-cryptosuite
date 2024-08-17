/*!
 * Copyright (c) 2023-2024 Digital Bazaar, Inc. All rights reserved.
 */
import * as EcdsaMultikey from '@digitalbazaar/ecdsa-multikey';
import * as ecdsaSd2023Cryptosuite from '../lib/index.js';
import {
  ecdsaMultikeyKeyPair,
  employeeCredential
} from './mock-data.js';
import {DataIntegrityProof} from '@digitalbazaar/data-integrity';
import {expect} from 'chai';
import jsigs from 'jsonld-signatures';
import {klona} from 'klona';
import {loader} from './documentLoader.js';

const {
  createSignCryptosuite,
  createConfirmCryptosuite
} = ecdsaSd2023Cryptosuite;

const {purposes: {AssertionProofPurpose}} = jsigs;

const documentLoader = loader.build();

describe('confirm VCDM 2.0 example VC', () => {
  let signedEmployeeCredential;
  before(async () => {
    const cryptosuite = createSignCryptosuite({
      mandatoryPointers: [
        '/issuer',
        '/type',
        '/validFrom',
        '/validUntil'
      ]
    });
    const unsignedCredential = klona(employeeCredential);

    const keyPair = await EcdsaMultikey.from({...ecdsaMultikeyKeyPair});
    const date = unsignedCredential.validFrom;
    const suite = new DataIntegrityProof({
      signer: keyPair.signer(), date, cryptosuite
    });

    signedEmployeeCredential = await jsigs.sign(unsignedCredential, {
      suite,
      purpose: new AssertionProofPurpose(),
      documentLoader
    });
  });

  it('should confirm base credential', async () => {
    const cryptosuite = createConfirmCryptosuite();
    const suite = new DataIntegrityProof({cryptosuite});
    const result = await jsigs.verify(signedEmployeeCredential, {
      suite,
      purpose: new AssertionProofPurpose(),
      documentLoader
    });

    expect(result.verified).to.be.true;
  });
});

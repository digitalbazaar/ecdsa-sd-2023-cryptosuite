/*!
 * Copyright (c) 2023 Digital Bazaar, Inc. All rights reserved.
 */
import * as EcdsaMultikey from '@digitalbazaar/ecdsa-multikey';
import * as ecdsaSd2023Cryptosuite from '../lib/index.js';
import {
  achievementCredential,
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
  createSignCryptosuite
} = ecdsaSd2023Cryptosuite;

const {purposes: {AssertionProofPurpose}} = jsigs;

const documentLoader = loader.build();

describe('derive()', () => {
  let signedAlumniCredential;
  before(async () => {
    const cryptosuite = createSignCryptosuite();
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
  });

  let signedDlCredential;
  before(async () => {
    const cryptosuite = createSignCryptosuite();
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
  });

  let signedDlCredentialNoIds;
  before(async () => {
    const cryptosuite = createSignCryptosuite();
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
  });

  let signedDlCredentialNoIdsMandatory;
  before(async () => {
    const cryptosuite = createSignCryptosuite({
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
  });

  let signedAchievementCredential;
  before(async () => {
    const cryptosuite = createSignCryptosuite();
    const unsignedCredential = klona(achievementCredential);

    const keyPair = await EcdsaMultikey.from({...ecdsaMultikeyKeyPair});
    const date = '2023-03-01T21:29:24Z';
    const suite = new DataIntegrityProof({
      signer: keyPair.signer(), date, cryptosuite
    });

    signedAchievementCredential = await jsigs.sign(unsignedCredential, {
      suite,
      purpose: new AssertionProofPurpose(),
      documentLoader
    });
  });

  it('should fail when nothing is selected', async () => {
    const cryptosuite = createDiscloseCryptosuite();
    const suite = new DataIntegrityProof({cryptosuite});

    let error;
    try {
      await jsigs.derive(signedAlumniCredential, {
        suite,
        purpose: new AssertionProofPurpose(),
        documentLoader
      });
    } catch(e) {
      error = e;
    }

    expect(error).to.exist;
    expect(error.message).to.include('Nothing selected');
  });

  it('should derive a reveal document', async () => {
    const cryptosuite = createDiscloseCryptosuite({
      selectivePointers: [
        '/credentialSubject/id'
      ]
    });
    const suite = new DataIntegrityProof({cryptosuite});

    let error;
    let revealed;
    try {
      revealed = await jsigs.derive(signedAlumniCredential, {
        suite,
        purpose: new AssertionProofPurpose(),
        documentLoader
      });
    } catch(e) {
      error = e;
    }

    expect(error).to.not.exist;

    const expected = {
      '@context': signedAlumniCredential['@context'],
      id: signedAlumniCredential.id,
      type: signedAlumniCredential.type,
      credentialSubject: {
        id: signedAlumniCredential.credentialSubject.id
      }
    };
    revealed['@context'].should.deep.equal(expected['@context']);
    revealed.id.should.deep.equal(expected.id);
    revealed.type.should.deep.equal(expected.type);
    revealed.credentialSubject.should.deep.equal(expected.credentialSubject);
    expect(revealed.proof).to.exist;
    expect(revealed.proof['@context']).to.not.exist;
    revealed.proof.should.not.deep.equal(
      signedAlumniCredential.proof);
    // FIXME: parse `revealed.proof.proofValue` and assert signature count
  });

  it('should derive a reveal document w/N pointers', async () => {
    const cryptosuite = createDiscloseCryptosuite({
      selectivePointers: [
        '/credentialSubject/driverLicense/dateOfBirth',
        '/credentialSubject/driverLicense/expirationDate'
      ]
    });
    const suite = new DataIntegrityProof({cryptosuite});

    let error;
    let revealed;
    try {
      revealed = await jsigs.derive(signedDlCredential, {
        suite,
        purpose: new AssertionProofPurpose(),
        documentLoader
      });
    } catch(e) {
      error = e;
    }

    expect(error).to.not.exist;

    const expected = {
      '@context': signedDlCredential['@context'],
      id: signedDlCredential.id,
      type: signedDlCredential.type,
      credentialSubject: {
        id: signedDlCredential.credentialSubject.id,
        driverLicense: {
          type: signedDlCredential.credentialSubject.driverLicense.type,
          dateOfBirth:
            signedDlCredential.credentialSubject.driverLicense.dateOfBirth,
          expirationDate:
            signedDlCredential.credentialSubject.driverLicense.expirationDate
        }
      }
    };
    revealed['@context'].should.deep.equal(expected['@context']);
    revealed.id.should.deep.equal(expected.id);
    revealed.type.should.deep.equal(expected.type);
    revealed.credentialSubject.should.deep.equal(expected.credentialSubject);
    expect(revealed.proof).to.exist;
    expect(revealed.proof['@context']).to.not.exist;
    revealed.proof.should.not.deep.equal(
      signedDlCredential.proof);
    // FIXME: parse `revealed.proof.proofValue` and assert signature count
  });

  it('should derive a reveal document w/bnodes and N pointers', async () => {
    const cryptosuite = createDiscloseCryptosuite({
      selectivePointers: [
        '/credentialSubject/driverLicense/dateOfBirth',
        '/credentialSubject/driverLicense/expirationDate'
      ]
    });
    const suite = new DataIntegrityProof({cryptosuite});

    let error;
    let revealed;
    try {
      revealed = await jsigs.derive(signedDlCredentialNoIds, {
        suite,
        purpose: new AssertionProofPurpose(),
        documentLoader
      });
    } catch(e) {
      error = e;
    }

    expect(error).to.not.exist;

    const expected = {
      '@context': signedDlCredentialNoIds['@context'],
      type: signedDlCredentialNoIds.type,
      credentialSubject: {
        driverLicense: {
          type: signedDlCredentialNoIds.credentialSubject.driverLicense.type,
          dateOfBirth:
            signedDlCredentialNoIds.credentialSubject
              .driverLicense.dateOfBirth,
          expirationDate:
            signedDlCredentialNoIds.credentialSubject
              .driverLicense.expirationDate
        }
      }
    };
    revealed['@context'].should.deep.equal(expected['@context']);
    expect(revealed.id).to.not.exist;
    revealed.type.should.deep.equal(expected.type);
    revealed.credentialSubject.should.deep.equal(expected.credentialSubject);
    expect(revealed.proof).to.exist;
    expect(revealed.proof['@context']).to.not.exist;
    revealed.proof.should.not.deep.equal(
      signedDlCredentialNoIds.proof);
    // FIXME: parse `revealed.proof.proofValue` and assert signature count
  });

  it('should derive a mandatory only reveal document', async () => {
    const cryptosuite = createDiscloseCryptosuite();
    const suite = new DataIntegrityProof({cryptosuite});

    let error;
    let revealed;
    try {
      revealed = await jsigs.derive(signedDlCredentialNoIdsMandatory, {
        suite,
        purpose: new AssertionProofPurpose(),
        documentLoader
      });
    } catch(e) {
      error = e;
    }

    expect(error).to.not.exist;

    const expected = {
      '@context': signedDlCredentialNoIdsMandatory['@context'],
      type: signedDlCredentialNoIdsMandatory.type,
      credentialSubject: {
        driverLicense: {
          type: signedDlCredentialNoIdsMandatory
            .credentialSubject.driverLicense.type,
          issuingAuthority:
            signedDlCredentialNoIdsMandatory.credentialSubject
              .driverLicense.issuingAuthority
        }
      }
    };
    revealed['@context'].should.deep.equal(expected['@context']);
    expect(revealed.id).to.not.exist;
    revealed.type.should.deep.equal(expected.type);
    revealed.credentialSubject.should.deep.equal(expected.credentialSubject);
    expect(revealed.proof).to.exist;
    expect(revealed.proof['@context']).to.not.exist;
    revealed.proof.should.not.deep.equal(
      signedDlCredentialNoIdsMandatory.proof);
    // FIXME: parse `revealed.proof.proofValue` and assert signature count
  });

  it('should derive a mandatory and selective reveal document', async () => {
    const cryptosuite = createDiscloseCryptosuite({
      selectivePointers: [
        '/credentialSubject/driverLicense/dateOfBirth'
      ]
    });
    const suite = new DataIntegrityProof({cryptosuite});

    let error;
    let revealed;
    try {
      revealed = await jsigs.derive(signedDlCredentialNoIdsMandatory, {
        suite,
        purpose: new AssertionProofPurpose(),
        documentLoader
      });
    } catch(e) {
      error = e;
    }

    expect(error).to.not.exist;

    const expected = {
      '@context': signedDlCredentialNoIdsMandatory['@context'],
      type: signedDlCredentialNoIdsMandatory.type,
      credentialSubject: {
        driverLicense: {
          type: signedDlCredentialNoIdsMandatory
            .credentialSubject.driverLicense.type,
          dateOfBirth:
          signedDlCredentialNoIdsMandatory.credentialSubject
            .driverLicense.dateOfBirth,
          issuingAuthority:
            signedDlCredentialNoIdsMandatory.credentialSubject
              .driverLicense.issuingAuthority
        }
      }
    };
    revealed['@context'].should.deep.equal(expected['@context']);
    expect(revealed.id).to.not.exist;
    revealed.type.should.deep.equal(expected.type);
    revealed.credentialSubject.should.deep.equal(expected.credentialSubject);
    expect(revealed.proof).to.exist;
    expect(revealed.proof['@context']).to.not.exist;
    revealed.proof.should.not.deep.equal(
      signedDlCredentialNoIdsMandatory.proof);
    // FIXME: parse `revealed.proof.proofValue` and assert signature count
  });

  it('should derive a reveal document with full arrays', async () => {
    const cryptosuite = createDiscloseCryptosuite({
      selectivePointers: [
        '/credentialSubject/achievements/0/sailNumber',
        '/credentialSubject/achievements/0/sails/0',
        '/credentialSubject/achievements/0/sails/1',
        '/credentialSubject/achievements/0/sails/2',
        '/credentialSubject/achievements/0/sails/3',
        '/credentialSubject/achievements/0/boards/0',
        '/credentialSubject/achievements/0/boards/1',
        '/credentialSubject/achievements/1/sailNumber',
        '/credentialSubject/achievements/1/sails/0',
        '/credentialSubject/achievements/1/sails/1',
        '/credentialSubject/achievements/1/sails/2',
        '/credentialSubject/achievements/1/sails/3',
        '/credentialSubject/achievements/1/boards/0',
        '/credentialSubject/achievements/1/boards/1'
      ]
    });
    const suite = new DataIntegrityProof({cryptosuite});

    let error;
    let revealed;
    try {
      revealed = await jsigs.derive(signedAchievementCredential, {
        suite,
        purpose: new AssertionProofPurpose(),
        documentLoader
      });
    } catch(e) {
      error = e;
    }

    expect(error).to.not.exist;

    const [achievement0, achievement1] =
      signedAchievementCredential.credentialSubject.achievements;

    const expected = {
      '@context': signedAchievementCredential['@context'],
      type: signedAchievementCredential.type,
      credentialSubject: {
        achievements: [achievement0, achievement1]
      }
    };
    revealed['@context'].should.deep.equal(expected['@context']);
    expect(revealed.id).to.not.exist;
    revealed.type.should.deep.equal(expected.type);
    revealed.credentialSubject.should.deep.equal(expected.credentialSubject);
    expect(revealed.proof).to.exist;
    expect(revealed.proof['@context']).to.not.exist;
    revealed.proof.should.not.deep.equal(signedAchievementCredential.proof);
    // FIXME: parse `revealed.proof.proofValue` and assert signature count
  });

  it('should derive a reveal document with selective arrays', async () => {
    const cryptosuite = createDiscloseCryptosuite({
      selectivePointers: [
        '/credentialSubject/achievements/0/sails/1',
        '/credentialSubject/achievements/0/sails/3',
        '/credentialSubject/achievements/0/boards/0',
        '/credentialSubject/achievements/0/boards/1',
        '/credentialSubject/achievements/1/sails/0',
        '/credentialSubject/achievements/1/sails/2',
        '/credentialSubject/achievements/1/boards/1'
      ]
    });
    const suite = new DataIntegrityProof({cryptosuite});

    let error;
    let revealed;
    try {
      revealed = await jsigs.derive(signedAchievementCredential, {
        suite,
        purpose: new AssertionProofPurpose(),
        documentLoader
      });
    } catch(e) {
      error = e;
    }

    expect(error).to.not.exist;

    const [achievement0, achievement1] =
      signedAchievementCredential.credentialSubject.achievements;

    const expected = {
      '@context': signedAchievementCredential['@context'],
      type: signedAchievementCredential.type,
      credentialSubject: {
        achievements: [{
          type: achievement0.type,
          sails: [
            achievement0.sails[1],
            achievement0.sails[3]
          ],
          boards: [
            achievement0.boards[0],
            achievement0.boards[1]
          ]
        }, {
          type: achievement1.type,
          sails: [
            achievement1.sails[0],
            achievement1.sails[2]
          ],
          boards: [
            achievement1.boards[1]
          ]
        }]
      }
    };
    revealed['@context'].should.deep.equal(expected['@context']);
    expect(revealed.id).to.not.exist;
    revealed.type.should.deep.equal(expected.type);
    revealed.credentialSubject.should.deep.equal(expected.credentialSubject);
    expect(revealed.proof).to.exist;
    expect(revealed.proof['@context']).to.not.exist;
    revealed.proof.should.not.deep.equal(signedAchievementCredential.proof);
    // FIXME: parse `revealed.proof.proofValue` and assert signature count
  });

  it('should derive a reveal document w/o first array element', async () => {
    const cryptosuite = createDiscloseCryptosuite({
      selectivePointers: [
        '/credentialSubject/achievements/1/sails/0',
        '/credentialSubject/achievements/1/sails/2',
        '/credentialSubject/achievements/1/boards/1'
      ]
    });
    const suite = new DataIntegrityProof({cryptosuite});

    let error;
    let revealed;
    try {
      revealed = await jsigs.derive(signedAchievementCredential, {
        suite,
        purpose: new AssertionProofPurpose(),
        documentLoader
      });
    } catch(e) {
      error = e;
    }

    expect(error).to.not.exist;

    const [, achievement1] =
      signedAchievementCredential.credentialSubject.achievements;

    const expected = {
      '@context': signedAchievementCredential['@context'],
      type: signedAchievementCredential.type,
      credentialSubject: {
        achievements: [{
          type: achievement1.type,
          sails: [
            achievement1.sails[0],
            achievement1.sails[2]
          ],
          boards: [
            achievement1.boards[1]
          ]
        }]
      }
    };
    revealed['@context'].should.deep.equal(expected['@context']);
    expect(revealed.id).to.not.exist;
    revealed.type.should.deep.equal(expected.type);
    revealed.credentialSubject.should.deep.equal(expected.credentialSubject);
    expect(revealed.proof).to.exist;
    expect(revealed.proof['@context']).to.not.exist;
    revealed.proof.should.not.deep.equal(signedAchievementCredential.proof);
    // FIXME: parse `revealed.proof.proofValue` and assert signature count
  });
});

/*!
 * Copyright (c) 2023 Digital Bazaar, Inc. All rights reserved.
 */
export const controller = 'https://example.edu/issuers/565049';
const publicKeyMultibase = 'zDnaekGZTbQBerwcehBSXLqAg6s55hVEBms1zFy89VHXtJSa9';
const secretKeyMultibase = 'z42tqZ5smVag3DtDhjY9YfVwTMyVHW6SCHJi2ZMrD23DGYS3';
const id = `${controller}#${publicKeyMultibase}`;

export const mockPublicEcdsaMultikey = {
  '@context': 'https://w3id.org/security/multikey/v1',
  type: 'Multikey',
  controller,
  id,
  publicKeyMultibase
};

export const ecdsaMultikeyKeyPair = {
  '@context': 'https://w3id.org/security/multikey/v1',
  type: 'Multikey',
  controller,
  id,
  publicKeyMultibase,
  secretKeyMultibase
};

export const ecdsaSecp256KeyPair = {
  type: 'EcdsaSecp256r1VerificationKey2019',
  controller,
  publicKeyMultibase,
  secretKeyMultibase
};

export const controllerDocEcdsaMultikey = {
  '@context': [
    'https://www.w3.org/ns/did/v1',
    'https://w3id.org/security/multikey/v1'
  ],
  id: 'https://example.edu/issuers/565049',
  assertionMethod: [mockPublicEcdsaMultikey]
};

export const credential = {
  '@context': [
    'https://www.w3.org/2018/credentials/v1',
    {
      AlumniCredential: 'https://schema.org#AlumniCredential',
      alumniOf: 'https://schema.org#alumniOf'
    },
    'https://w3id.org/security/data-integrity/v1'
  ],
  id: 'http://example.edu/credentials/1872',
  type: ['VerifiableCredential', 'AlumniCredential'],
  issuer: 'https://example.edu/issuers/565049',
  issuanceDate: '2010-01-01T19:23:24Z',
  credentialSubject: {
    id: 'https://example.edu/students/alice',
    alumniOf: 'Example University'
  }
};

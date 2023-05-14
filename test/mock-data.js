/*!
 * Copyright (c) 2023 Digital Bazaar, Inc. All rights reserved.
 */
export const FRAME_FLAGS = {
  requireAll: true,
  explicit: true,
  omitGraph: true
};

const publicKeyMultibase = 'zDnaekGZTbQBerwcehBSXLqAg6s55hVEBms1zFy89VHXtJSa9';
const secretKeyMultibase = 'z42tqZ5smVag3DtDhjY9YfVwTMyVHW6SCHJi2ZMrD23DGYS3';

export const controller = `did:key:${publicKeyMultibase}`;
const keyId = `${controller}#${publicKeyMultibase}`;

export const publicEcdsaMultikey = {
  '@context': 'https://w3id.org/security/multikey/v1',
  type: 'Multikey',
  controller,
  id: keyId,
  publicKeyMultibase
};

export const ecdsaMultikeyKeyPair = {
  '@context': 'https://w3id.org/security/multikey/v1',
  type: 'Multikey',
  controller,
  id: keyId,
  publicKeyMultibase,
  secretKeyMultibase
};

export const controllerDocEcdsaMultikey = {
  '@context': [
    'https://www.w3.org/ns/did/v1',
    'https://w3id.org/security/multikey/v1'
  ],
  id: controller,
  assertionMethod: [publicEcdsaMultikey]
};

export const alumniCredential = {
  '@context': [
    'https://www.w3.org/2018/credentials/v1',
    {
      '@protected': true,
      AlumniCredential: 'urn:example:AlumniCredential',
      alumniOf: 'https://schema.org#alumniOf'
    },
    'https://w3id.org/security/data-integrity/v1'
  ],
  id: 'urn:uuid:98c5cffc-efa2-43e3-99f5-01e8ef404be0',
  type: ['VerifiableCredential', 'AlumniCredential'],
  issuer: controller,
  issuanceDate: '2010-01-01T19:23:24Z',
  credentialSubject: {
    id: 'urn:uuid:d58b2365-0951-4373-96c8-e886d61829f2',
    alumniOf: 'Example University'
  }
};

export const dlCredential = {
  '@context': [
    'https://www.w3.org/2018/credentials/v1',
    {
      '@protected': true,
      DriverLicenseCredential: 'urn:example:DriverLicenseCredential',
      DriverLicense: {
        '@id': 'urn:example:DriverLicense',
        '@context': {
          '@protected': true,
          id: '@id',
          type: '@type',
          documentIdentifier: 'urn:example:documentIdentifier',
          dateOfBirth: 'urn:example:dateOfBirth',
          expirationDate: 'urn:example:expiration',
          issuingAuthority: 'urn:example:issuingAuthority'
        }
      },
      driverLicense: {
        '@id': 'urn:example:driverLicense',
        '@type': '@id'
      }
    },
    'https://w3id.org/security/data-integrity/v1'
  ],
  id: 'urn:uuid:36245ee9-9074-4b05-a777-febff2e69757',
  type: ['VerifiableCredential', 'DriverLicenseCredential'],
  issuer: controller,
  issuanceDate: '2010-01-01T19:23:24Z',
  credentialSubject: {
    id: 'urn:uuid:1a0e4ef5-091f-4060-842e-18e519ab9440',
    driverLicense: {
      type: 'DriverLicense',
      documentIdentifier: 'T21387yc328c7y32h23f23',
      dateOfBirth: '01-01-1990',
      expirationDate: '01-01-2030',
      issuingAuthority: 'VA'
    }
  }
};

export const dlCredentialNoIds = {
  '@context': [
    'https://www.w3.org/2018/credentials/v1',
    {
      '@protected': true,
      DriverLicenseCredential: 'urn:example:DriverLicenseCredential',
      DriverLicense: {
        '@id': 'urn:example:DriverLicense',
        '@context': {
          '@protected': true,
          id: '@id',
          type: '@type',
          documentIdentifier: 'urn:example:documentIdentifier',
          dateOfBirth: 'urn:example:dateOfBirth',
          expirationDate: 'urn:example:expiration',
          issuingAuthority: 'urn:example:issuingAuthority'
        }
      },
      driverLicense: {
        '@id': 'urn:example:driverLicense',
        '@type': '@id'
      }
    },
    'https://w3id.org/security/data-integrity/v1'
  ],
  type: ['VerifiableCredential', 'DriverLicenseCredential'],
  issuer: controller,
  issuanceDate: '2010-01-01T19:23:24Z',
  credentialSubject: {
    driverLicense: {
      type: 'DriverLicense',
      documentIdentifier: 'T21387yc328c7y32h23f23',
      dateOfBirth: '01-01-1990',
      expirationDate: '01-01-2030',
      issuingAuthority: 'VA'
    }
  }
};

// example HMAC key to use for test vectors
export const hmacKey = new Uint8Array(32);
// set bookends to 1 to make the key easy to spot in test data
hmacKey[0] = 1;
hmacKey[31] = 1;

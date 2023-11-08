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
    'https://w3id.org/security/data-integrity/v2'
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
    'https://w3id.org/security/data-integrity/v2'
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
    'https://w3id.org/security/data-integrity/v2'
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

export const employeeCredential = {
  '@context': [
    'https://www.w3.org/ns/credentials/v2',
    'https://www.w3.org/ns/credentials/examples/v2'
  ],
  type: ['VerifiableCredential', 'ExampleEmployeeCredential'],
  issuer: 'did:example:c276e12ec21ebfeb1f712ebc6f1',
  validFrom: '2023-06-01T09:25:48Z',
  validUntil: '2024-06-01T09:25:48Z',
  credentialSubject: {
    id: 'did:example:ebfeb1f712ebc6f1c276e12ec21',
    name: 'Jane Doe',
    employeeId: 'YB-38473',
    jobTitle: 'Comptroller',
    division: 'Accounting',
    employer: {
      id: 'did:example:c276e12ec21ebfeb1f712ebc6f1',
      name: 'Example Corporation'
    }
  }
};

export const achievementCredential = {
  '@context': [
    'https://www.w3.org/ns/credentials/v2',
    'https://www.w3.org/ns/credentials/examples/v2'
  ],
  type: ['VerifiableCredential', 'ExampleAchievementCredential'],
  issuer: 'did:example:c276e12ec21ebfeb1f712ebc6f1',
  validFrom: '2023-06-01T09:25:48Z',
  validUntil: '2024-06-01T09:25:48Z',
  credentialSubject: {
    name: 'Jane Doe',
    achievements: [{
      type: 'WindsailingAchievement',
      sailNumber: 'Earth101',
      sails: [
        {
          size: 5.5,
          sailName: 'Osprey',
          year: 2023
        },
        {
          size: 6.1,
          sailName: 'Eagle-FR',
          year: 2023
        },
        {
          size: 7.0,
          sailName: 'Eagle-FR',
          year: 2020
        },
        {
          size: 7.8,
          sailName: 'Eagle-FR',
          year: 2023
        }
      ],
      boards: [
        {
          boardName: 'CompFoil170',
          brand: 'Tillo',
          year: 2022
        },
        {
          boardName: 'Tillo Custom',
          brand: 'Tillo',
          year: 2019
        }
      ]
    }, {
      type: 'WindsailingAchievement',
      sailNumber: 'Mars101',
      sails: [
        {
          size: 5.9,
          sailName: 'Chicken',
          year: 2022
        },
        {
          size: 4.9,
          sailName: 'Vulture-FR',
          year: 2023
        },
        {
          size: 6.8,
          sailName: 'Vulture-FR',
          year: 2020
        },
        {
          size: 7.7,
          sailName: 'Vulture-FR',
          year: 2023
        }
      ],
      boards: [
        {
          boardName: 'Oak620',
          brand: 'Excite',
          year: 2020
        },
        {
          boardName: 'Excite Custom',
          brand: 'Excite',
          year: 2018
        }
      ]
    }]
  }
};

// example HMAC key to use for test vectors
export const hmacKey = new Uint8Array(32);
// set bookends to 1 to make the key easy to spot in test data
hmacKey[0] = 1;
hmacKey[31] = 1;

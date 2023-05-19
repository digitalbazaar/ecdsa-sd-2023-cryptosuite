# An ECDSA Selective Disclosure Data Integrity Cryptosuite _(@digitalbazaar/ecdsa-sd-2023-cryptosuite)_

[![Build Status](https://img.shields.io/github/actions/workflow/status/digitalbazaar/ecdsa-sd-2023-cryptosuite/main.yml)](https://github.com/digitalbazaar/ecdsa-sd-2023-cryptosuite/actions/workflow/main.yml)
[![Coverage Status](https://img.shields.io/codecov/c/github/digitalbazaar/ecdsa-sd-2023-cryptosuite)](https://codecov.io/gh/digitalbazaar/ecdsa-sd-2023-cryptosuite)
[![NPM Version](https://img.shields.io/npm/v/@digitalbazaar/ecdsa-sd-2023-cryptosuite.svg)](https://npm.im/@digitalbazaar/ecdsa-sd-2023-cryptosuite)

> A selective disclosure Data Integrity cryptosuite based on ECDSA for use with jsonld-signatures.

## Table of Contents

- [Background](#background)
- [Security](#security)
- [Install](#install)
- [Usage](#usage)
- [Contribute](#contribute)
- [Commercial Support](#commercial-support)
- [License](#license)

## Background

For use with https://github.com/digitalbazaar/jsonld-signatures v11.2 and above.

See also related specs:

* [Verifiable Credential Data Integrity](https://w3c.github.io/vc-data-integrity/)

## Security

TBD

## Install

- Browsers and Node.js 16+ are supported.

To install from NPM:

```
npm install @digitalbazaar/ecdsa-sd-2023-cryptosuite
```

To install locally (for development):

```
git clone https://github.com/digitalbazaar/ecdsa-sd-2023-cryptosuite.git
cd ecdsa-sd-2023-cryptosuite
npm install
```

## Usage

### Creating a base proof

The following code snippet provides an example of digitally signing
a verifiable credential using this library:

```javascript
import * as EcdsaMultikey from '@digitalbazaar/ecdsa-multikey';
import * as ecdsaSd2023Cryptosuite
  from '@digitalbazaar/ecdsa-sd-2023-cryptosuite';
import {DataIntegrityProof} from '@digitalbazaar/data-integrity';
import jsigs from 'jsonld-signatures';

const {createSignCryptosuite} = ecdsaSd2023Cryptosuite;
const {purposes: {AssertionProofPurpose}} = jsigs;

// import the ECDSA key pair to use when signing
const publicKeyMultibase = 'zDnaekGZTbQBerwcehBSXLqAg6s55hVEBms1zFy89VHXtJSa9';
const secretKeyMultibase = 'z42tqZ5smVag3DtDhjY9YfVwTMyVHW6SCHJi2ZMrD23DGYS3';
const controller = `did:key:${publicKeyMultibase}`;
const keyId = `${controller}#${publicKeyMultibase}`;
const publicEcdsaMultikey = {
  '@context': 'https://w3id.org/security/multikey/v1',
  type: 'Multikey',
  controller: `did:key:${publicKeyMultibase}`,
  id: keyId,
  publicKeyMultibase
};
const keyPair = await EcdsaMultikey.from({...ecdsaMultikeyKeyPair});

// create the unsigned credential
const unsignedCredential = {
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

// create suite
const suite = new DataIntegrityProof({
  signer: keyPair.signer(),
  cryptosuite: createSignCryptosuite()
});

// create signed credential
const signedCredential = await jsigs.sign(unsignedCredential, {
  suite,
  purpose: new AssertionProofPurpose(),
  documentLoader
});

// results in the following signed VC
{
  "@context": [
    "https://www.w3.org/2018/credentials/v1",
    {
      "@protected": true,
      "AlumniCredential": "urn:example:AlumniCredential",
      "alumniOf": "https://schema.org#alumniOf"
    },
    "https://w3id.org/security/data-integrity/v1"
  ],
  "id": "urn:uuid:98c5cffc-efa2-43e3-99f5-01e8ef404be0",
  "type": [
    "VerifiableCredential",
    "AlumniCredential"
  ],
  "issuer": "did:key:zDnaekGZTbQBerwcehBSXLqAg6s55hVEBms1zFy89VHXtJSa9",
  "issuanceDate": "2010-01-01T19:23:24Z",
  "credentialSubject": {
    "id": "urn:uuid:d58b2365-0951-4373-96c8-e886d61829f2",
    "alumniOf": "Example University"
  },
  "proof": {
    "type": "DataIntegrityProof",
    "created": "2023-03-01T21:29:24Z",
    "verificationMethod": "did:key:zDnaekGZTbQBerwcehBSXLqAg6s55hVEBms1zFy89VHXtJSa9#zDnaekGZTbQBerwcehBSXLqAg6s55hVEBms1zFy89VHXtJSa9",
    "cryptosuite": "ecdsa-sd-2023",
    "proofPurpose": "assertionMethod",
    "proofValue": "u2V0AhVhAqz-LILPZ4pWPUmX2jIXYjN3dLa__MnpZdoD8IQnTvxmMdRDbuxikxWUps5E-8CUPFCSihO6x_dk4yzi-HiS5klgkge0P0BiCpXp6kzJnmPRLBS3k1BB-oVYj2S562LN_AswPpQvhWCBuZnZU1hPXWJuXFJAv3clu-moPIMp--pY2RRtU49-OSYZYQNhwRJnnDTW7f-bd9kUpnMAqlovgiA2p4uCZOIG9L0hgEcIAqqcrPTIXoc0Qp0tLxpKKHAaWLqCSDpHjpvnz0GRYQMGw0vJGj78dv2WQFm2IoiFXdiUFTJSIAA5GB78gWApCJZdU7XIivjUWEirH8lMeLPiJzU7BK1sdP7Se6CgK-1RYQLEKXGZT2MqYP5-mJ57arq1bMD92BKQVnMqSsvFyCj01Gx-47lTUyiceDx4GAWcz25LIFiGas4lYpKUcF3Sx9cBYQD6_N62_l2nipZlFv1E209GnPOElSdyD2L_MUybwzdY0KcDEKyPGRZ7ZhOozsDdG9x4bS2oI2SocZpnB6vvkD1xYQAfUdJlmwvGWAUd3SsJkd9aMcaJHil8flM075dZ310AC6wliQAbwTJvkkepBdAA4tu-_zb2O1ApdpOrnL7sMM7ZYQO-1-cHklA_TR6Rqq5uvYYzIM3P1hizmjH-FzdV0OGV8oV2CLWpFd8lhFBHUlPkhJ9uYlGF2KN0J3WdbGkPI97SA"
  }
}
```

### Creating a derived proof

The following code snippet provides an example of deriving a verifiable
credential with selectively disclosed information using this library:

```javascript
import * as EcdsaMultikey from '@digitalbazaar/ecdsa-multikey';
import * as ecdsaSd2023Cryptosuite
  from '@digitalbazaar/ecdsa-sd-2023-cryptosuite';
import {DataIntegrityProof} from '@digitalbazaar/data-integrity';
import jsigs from 'jsonld-signatures';

const {createDiscloseCryptosuite} = ecdsaSd2023Cryptosuite;
const {purposes: {AssertionProofPurpose}} = jsigs;

// create suite
const suite = new DataIntegrityProof({
  signer: keyPair.signer(),
  // disclose only the `credentialSubject.id` and any IDs and types in its
  // JSON path
  cryptosuite: createDiscloseCryptosuite({
    selectivePointers: [
      '/credentialSubject/id'
    ]
  })
});

// create derived credential from the signed credential
const derivedCredential = await jsigs.derive(signedCredential, {
  suite,
  purpose: new AssertionProofPurpose(),
  documentLoader
});

// results in the following derived VC
{
  "@context": [
    "https://www.w3.org/2018/credentials/v1",
    {
      "@protected": true,
      "AlumniCredential": "urn:example:AlumniCredential",
      "alumniOf": "https://schema.org#alumniOf"
    },
    "https://w3id.org/security/data-integrity/v1"
  ],
  "id": "urn:uuid:98c5cffc-efa2-43e3-99f5-01e8ef404be0",
  "type": [
    "VerifiableCredential",
    "AlumniCredential"
  ],
  "credentialSubject": {
    "id": "urn:uuid:d58b2365-0951-4373-96c8-e886d61829f2",
    // notably, `alumniOf` is not present
  },
  "proof": {
    "type": "DataIntegrityProof",
    "created": "2023-03-01T21:29:24Z",
    "verificationMethod": "did:key:zDnaekGZTbQBerwcehBSXLqAg6s55hVEBms1zFy89VHXtJSa9#zDnaekGZTbQBerwcehBSXLqAg6s55hVEBms1zFy89VHXtJSa9",
    "cryptosuite": "ecdsa-sd-2023",
    "proofPurpose": "assertionMethod",
    "proofValue": "u2V0BhVhAqz-LILPZ4pWPUmX2jIXYjN3dLa__MnpZdoD8IQnTvxmMdRDbuxikxWUps5E-8CUPFCSihO6x_dk4yzi-HiS5klgkge0P0BiCpXp6kzJnmPRLBS3k1BB-oVYj2S562LN_AswPpQvhg1hA2HBEmecNNbt_5t32RSmcwCqWi-CIDani4Jk4gb0vSGARwgCqpys9MhehzRCnS0vGkoocBpYuoJIOkeOm-fPQZFhAwbDS8kaPvx2_ZZAWbYiiIVd2JQVMlIgADkYHvyBYCkIll1TtciK-NRYSKsfyUx4s-InNTsErWx0_tJ7oKAr7VFhAsQpcZlPYypg_n6YnntqurVswP3YEpBWcypKy8XIKPTUbH7juVNTKJx4PHgYBZzPbksgWIZqziVikpRwXdLH1wKCA"
  }
}
```

### Verifying a derived proof

The following code snippet provides an example of deriving a verifiable
credential with selectively disclosed information using this library:

```javascript
import * as EcdsaMultikey from '@digitalbazaar/ecdsa-multikey';
import * as ecdsaSd2023Cryptosuite
  from '@digitalbazaar/ecdsa-sd-2023-cryptosuite';
import {DataIntegrityProof} from '@digitalbazaar/data-integrity';
import jsigs from 'jsonld-signatures';

const {createVerifyCryptosuite} = ecdsaSd2023Cryptosuite;
const {purposes: {AssertionProofPurpose}} = jsigs;

// create suite
const suite = new DataIntegrityProof({
  signer: keyPair.signer(),
  cryptosuite: createVerifyCryptosuite()
});

// verify the derived credential
const result = await jsigs.verify(derivedCredential, {
  suite,
  purpose: new AssertionProofPurpose(),
  documentLoader
});
```

## Advanced Usage

### Creating a base proof with mandatory field(s)

The following code snippet provides an example of digitally signing
a verifiable credential with mandatory field(s):

```javascript
import * as EcdsaMultikey from '@digitalbazaar/ecdsa-multikey';
import * as ecdsaSd2023Cryptosuite
  from '@digitalbazaar/ecdsa-sd-2023-cryptosuite';
import {DataIntegrityProof} from '@digitalbazaar/data-integrity';
import jsigs from 'jsonld-signatures';

const {createSignCryptosuite} = ecdsaSd2023Cryptosuite;
const {purposes: {AssertionProofPurpose}} = jsigs;

// import the ECDSA key pair to use when signing
const publicKeyMultibase = 'zDnaekGZTbQBerwcehBSXLqAg6s55hVEBms1zFy89VHXtJSa9';
const secretKeyMultibase = 'z42tqZ5smVag3DtDhjY9YfVwTMyVHW6SCHJi2ZMrD23DGYS3';
const controller = `did:key:${publicKeyMultibase}`;
const keyId = `${controller}#${publicKeyMultibase}`;
const publicEcdsaMultikey = {
  '@context': 'https://w3id.org/security/multikey/v1',
  type: 'Multikey',
  controller: `did:key:${publicKeyMultibase}`,
  id: keyId,
  publicKeyMultibase
};
const keyPair = await EcdsaMultikey.from({...ecdsaMultikeyKeyPair});

// create the unsigned credential
const unsignedCredential = {
  "@context": [
    "https://www.w3.org/2018/credentials/v1",
    {
      "@protected": true,
      "DriverLicenseCredential": "urn:example:DriverLicenseCredential",
      "DriverLicense": {
        "@id": "urn:example:DriverLicense",
        "@context": {
          "@protected": true,
          "id": "@id",
          "type": "@type",
          "documentIdentifier": "urn:example:documentIdentifier",
          "dateOfBirth": "urn:example:dateOfBirth",
          "expirationDate": "urn:example:expiration",
          "issuingAuthority": "urn:example:issuingAuthority"
        }
      },
      "driverLicense": {
        "@id": "urn:example:driverLicense",
        "@type": "@id"
      }
    },
    "https://w3id.org/security/data-integrity/v1"
  ],
  "type": [
    "VerifiableCredential",
    "DriverLicenseCredential"
  ],
  "issuer": "did:key:zDnaekGZTbQBerwcehBSXLqAg6s55hVEBms1zFy89VHXtJSa9",
  "issuanceDate": "2010-01-01T19:23:24Z",
  "credentialSubject": {
    "driverLicense": {
      "type": "DriverLicense",
      "documentIdentifier": "T21387yc328c7y32h23f23",
      "dateOfBirth": "01-01-1990",
      "expirationDate": "01-01-2030",
      "issuingAuthority": "VA"
    }
  }
};

// create suite
const suite = new DataIntegrityProof({
  signer: keyPair.signer(),
  // require a particular field and any IDs or types in its JSON path to
  // always be disclosed
  cryptosuite: createSignCryptosuite({
    mandatoryPointers: [
      '/credentialSubject/driverLicense/issuingAuthority'
    ]
  })
});

// create signed credential
const signedCredential = await jsigs.sign(unsignedCredential, {
  suite,
  purpose: new AssertionProofPurpose(),
  documentLoader
});

// results in the following signed VC
{
  "@context": [
    "https://www.w3.org/2018/credentials/v1",
    {
      "@protected": true,
      "DriverLicenseCredential": "urn:example:DriverLicenseCredential",
      "DriverLicense": {
        "@id": "urn:example:DriverLicense",
        "@context": {
          "@protected": true,
          "id": "@id",
          "type": "@type",
          "documentIdentifier": "urn:example:documentIdentifier",
          "dateOfBirth": "urn:example:dateOfBirth",
          "expirationDate": "urn:example:expiration",
          "issuingAuthority": "urn:example:issuingAuthority"
        }
      },
      "driverLicense": {
        "@id": "urn:example:driverLicense",
        "@type": "@id"
      }
    },
    "https://w3id.org/security/data-integrity/v1"
  ],
  "type": [
    "VerifiableCredential",
    "DriverLicenseCredential"
  ],
  "issuer": "did:key:zDnaekGZTbQBerwcehBSXLqAg6s55hVEBms1zFy89VHXtJSa9",
  "issuanceDate": "2010-01-01T19:23:24Z",
  "credentialSubject": {
    "driverLicense": {
      "type": "DriverLicense",
      "documentIdentifier": "T21387yc328c7y32h23f23",
      "dateOfBirth": "01-01-1990",
      "expirationDate": "01-01-2030",
      "issuingAuthority": "VA"
    }
  },
  "proof": {
    "type": "DataIntegrityProof",
    "created": "2023-03-01T21:29:24Z",
    "verificationMethod": "did:key:zDnaekGZTbQBerwcehBSXLqAg6s55hVEBms1zFy89VHXtJSa9#zDnaekGZTbQBerwcehBSXLqAg6s55hVEBms1zFy89VHXtJSa9",
    "cryptosuite": "ecdsa-sd-2023",
    "proofPurpose": "assertionMethod",
    "proofValue": "u2V0AhVhA4YsGEY7v1GUqfS_vMz77U0KYDaNj2cEh1QPkUnnewxRUpxsvPCEa4aUsw0xYiEnZ2g8yuo3HP-X_mLoIgHCorlgkge0PzmKA5EX303HH_wJToPqtXAzE_sBPv3_HMG1AwFjDpwGKWCDvUE9q_0Oj9f8D6h7iZaDBrqH08b8GBG5Cp2DOP8ZCQ4tYQGsck26GXGw-jykCcY-G-BluhzqZVIx0ib_0MWC0kieVGETmSOJfdTJ8-4XZHtMGeRzJ2N1UloE49XofTJyXT0BYQDoMOtQ-QAex8a5VMX_v2hTLl1GCAIH7D96qcXgbcjmgeND3MOIKfypDlHsYt7nDBvxLqAhOoX5oluGwzUM0Hy5YQE0hRZI2SI8jCtn6UwQAB1dmi8NQmYPtxfNoXr6nY_179imv2NL7XcawM6UxYJs49kVkHzLbiy-EL4h2xLaGn4dYQGdlQREoW0GPI9l9KbK0AoSRvTgzMWp9l1gnmyURU56mNSFpPT9XPmIrnRuujlk-92S3UfAIxcEhGczwqqLPNYJYQFzK_qt2-dmAsTAi0LDJXeVfnwz91IdYu0zESjc53nWb_XnHaogje2bugo9dhNmUpputtIyyYnxyCSDa5MVHsGtYQEOeFYEOXmAu6PDbWXNUBM1WTkLXZvCdQpCz5SRd-PMDPQpc36YMvQHRunJYXkcBZY-XJ82iUTd9EYwdc3hcfqdYQPtw9oWinlk1DY1va5YWBD8GTZgdgjSGRuBds9mXtlhAyMr1OwO0K2aT-A8TgLmiENnjLP10U8XvHkL4e-kgnStYQFR4nIoCAvV0OkGlRpEGr_XJBQWRiA4hAzT_4JyT89MUuvwYxmUu-h3KxlqSt9VZkfCaRJEjmSPtkp6vUaZ_WtpYQMIgWKwwdxhQRxixdidCPXg0cGZWNUdCYmAqJi-XenJxC3aqIX69igrfSV8sI8fywfYZGXfaLhQ-YOOwm4pCIG9YQH8qyCIcrauqH4BK7Ewi7uwR0tnJPDxqAas2pMWn2owqABr4h3lA77EiXBrfMJ7JvoXufVekYuUSQFmttgsvFNpYQCCcymZufZTIuyvnEOl1Ly8BgxfktbU9NpoikIiX_T_OnA7YnEubzt53n3lBkGJI0YAZcXu3B7dAyq7Bjn8B0OyBeDEvY3JlZGVudGlhbFN1YmplY3QvZHJpdmVyTGljZW5zZS9pc3N1aW5nQXV0aG9yaXR5"
  }
}
```

### Creating a derived proof with only mandatory fields revealed

The following code snippet provides an example of deriving a verifiable
credential with only mandatory fields revealed using this library:

```javascript
import * as EcdsaMultikey from '@digitalbazaar/ecdsa-multikey';
import * as ecdsaSd2023Cryptosuite
  from '@digitalbazaar/ecdsa-sd-2023-cryptosuite';
import {DataIntegrityProof} from '@digitalbazaar/data-integrity';
import jsigs from 'jsonld-signatures';

const {createDiscloseCryptosuite} = ecdsaSd2023Cryptosuite;
const {purposes: {AssertionProofPurpose}} = jsigs;

// create suite
const suite = new DataIntegrityProof({
  signer: keyPair.signer(),
  // disclose only the `credentialSubject.id` and any IDs and types in its
  // JSON path
  cryptosuite: createDiscloseCryptosuite(/* nothing selectively disclosed */)
});

// create derived credential from the signed credential
const derivedCredential = await jsigs.derive(signedCredential, {
  suite,
  purpose: new AssertionProofPurpose(),
  documentLoader
});

// results in the following derived VC
{
  "@context": [
    "https://www.w3.org/2018/credentials/v1",
    {
      "@protected": true,
      "DriverLicenseCredential": "urn:example:DriverLicenseCredential",
      "DriverLicense": {
        "@id": "urn:example:DriverLicense",
        "@context": {
          "@protected": true,
          "id": "@id",
          "type": "@type",
          "documentIdentifier": "urn:example:documentIdentifier",
          "dateOfBirth": "urn:example:dateOfBirth",
          "expirationDate": "urn:example:expiration",
          "issuingAuthority": "urn:example:issuingAuthority"
        }
      },
      "driverLicense": {
        "@id": "urn:example:driverLicense",
        "@type": "@id"
      }
    },
    "https://w3id.org/security/data-integrity/v1"
  ],
  "type": [
    "VerifiableCredential",
    "DriverLicenseCredential"
  ],
  "credentialSubject": {
    "driverLicense": {
      "type": "DriverLicense",
      "issuingAuthority": "VA"
    }
  },
  "proof": {
    "type": "DataIntegrityProof",
    "created": "2023-03-01T21:29:24Z",
    "verificationMethod": "did:key:zDnaekGZTbQBerwcehBSXLqAg6s55hVEBms1zFy89VHXtJSa9#zDnaekGZTbQBerwcehBSXLqAg6s55hVEBms1zFy89VHXtJSa9",
    "cryptosuite": "ecdsa-sd-2023",
    "proofPurpose": "assertionMethod",
    "proofValue": "u2V0BhVhA4YsGEY7v1GUqfS_vMz77U0KYDaNj2cEh1QPkUnnewxRUpxsvPCEa4aUsw0xYiEnZ2g8yuo3HP-X_mLoIgHCorlgkge0PzmKA5EX303HH_wJToPqtXAzE_sBPv3_HMG1AwFjDpwGKhlhAaxyTboZcbD6PKQJxj4b4GW6HOplUjHSJv_QxYLSSJ5UYROZI4l91Mnz7hdke0wZ5HMnY3VSWgTj1eh9MnJdPQFhAOgw61D5AB7HxrlUxf-_aFMuXUYIAgfsP3qpxeBtyOaB40Pcw4gp_KkOUexi3ucMG_EuoCE6hfmiW4bDNQzQfLlhAQ54VgQ5eYC7o8NtZc1QEzVZOQtdm8J1CkLPlJF348wM9Clzfpgy9AdG6clheRwFlj5cnzaJRN30RjB1zeFx-p1hA-3D2haKeWTUNjW9rlhYEPwZNmB2CNIZG4F2z2Ze2WEDIyvU7A7QrZpP4DxOAuaIQ2eMs_XRTxe8eQvh76SCdK1hAVHicigIC9XQ6QaVGkQav9ckFBZGIDiEDNP_gnJPz0xS6_BjGZS76HcrGWpK31VmR8JpEkSOZI-2Snq9Rpn9a2lhAwiBYrDB3GFBHGLF2J0I9eDRwZlY1R0JiYComL5d6cnELdqohfr2KCt9JXywjx_LB9hkZd9ouFD5g47CbikIgb6NlYzE0bjB4LHVvdGowOHpZV09JTTJxMGhrV1ZCNmZoVWVfU1Jra3UzM0JKZHRuLUNBQ2pZZWMxNG4xeCx1a3dzN2lOSkdnR3B2VGxvODJUUlh1bHVQa2tJdGlwZWlRU1otTXF2dzVzUWVjMTRuMngsdXNOR2FLeVdmeVB2WGdTcWxNWW1tMWlhSXB2amtYelo2ak96SDNMMEtkN2eA"
  }
}
```

### Creating a derived proof with mandatory and selective fields revealed

The following code snippet provides an example of deriving a verifiable
credential with mandatory and selective fields revealed using this library:

```javascript
import * as EcdsaMultikey from '@digitalbazaar/ecdsa-multikey';
import * as ecdsaSd2023Cryptosuite
  from '@digitalbazaar/ecdsa-sd-2023-cryptosuite';
import {DataIntegrityProof} from '@digitalbazaar/data-integrity';
import jsigs from 'jsonld-signatures';

const {createDiscloseCryptosuite} = ecdsaSd2023Cryptosuite;
const {purposes: {AssertionProofPurpose}} = jsigs;

// create suite
const suite = new DataIntegrityProof({
  signer: keyPair.signer(),
  // disclose only the `credentialSubject.id` and any IDs and types in its
  // JSON path
  cryptosuite: createDiscloseCryptosuite({
    selectivePointers: [
      '/credentialSubject/driverLicense/dateOfBirth'
    ]
  })
});

// create derived credential from the signed credential
const derivedCredential = await jsigs.derive(signedCredential, {
  suite,
  purpose: new AssertionProofPurpose(),
  documentLoader
});

// results in the following derived VC
{
  "@context": [
    "https://www.w3.org/2018/credentials/v1",
    {
      "@protected": true,
      "DriverLicenseCredential": "urn:example:DriverLicenseCredential",
      "DriverLicense": {
        "@id": "urn:example:DriverLicense",
        "@context": {
          "@protected": true,
          "id": "@id",
          "type": "@type",
          "documentIdentifier": "urn:example:documentIdentifier",
          "dateOfBirth": "urn:example:dateOfBirth",
          "expirationDate": "urn:example:expiration",
          "issuingAuthority": "urn:example:issuingAuthority"
        }
      },
      "driverLicense": {
        "@id": "urn:example:driverLicense",
        "@type": "@id"
      }
    },
    "https://w3id.org/security/data-integrity/v1"
  ],
  "type": [
    "VerifiableCredential",
    "DriverLicenseCredential"
  ],
  "credentialSubject": {
    "driverLicense": {
      "type": "DriverLicense",
      "dateOfBirth": "01-01-1990",
      "issuingAuthority": "VA"
    }
  },
  "proof": {
    "type": "DataIntegrityProof",
    "created": "2023-03-01T21:29:24Z",
    "verificationMethod": "did:key:zDnaekGZTbQBerwcehBSXLqAg6s55hVEBms1zFy89VHXtJSa9#zDnaekGZTbQBerwcehBSXLqAg6s55hVEBms1zFy89VHXtJSa9",
    "cryptosuite": "ecdsa-sd-2023",
    "proofPurpose": "assertionMethod",
    "proofValue": "u2V0BhVhA4YsGEY7v1GUqfS_vMz77U0KYDaNj2cEh1QPkUnnewxRUpxsvPCEa4aUsw0xYiEnZ2g8yuo3HP-X_mLoIgHCorlgkge0PzmKA5EX303HH_wJToPqtXAzE_sBPv3_HMG1AwFjDpwGKh1hAaxyTboZcbD6PKQJxj4b4GW6HOplUjHSJv_QxYLSSJ5UYROZI4l91Mnz7hdke0wZ5HMnY3VSWgTj1eh9MnJdPQFhAOgw61D5AB7HxrlUxf-_aFMuXUYIAgfsP3qpxeBtyOaB40Pcw4gp_KkOUexi3ucMG_EuoCE6hfmiW4bDNQzQfLlhATSFFkjZIjyMK2fpTBAAHV2aLw1CZg-3F82hevqdj_Xv2Ka_Y0vtdxrAzpTFgmzj2RWQfMtuLL4QviHbEtoafh1hAQ54VgQ5eYC7o8NtZc1QEzVZOQtdm8J1CkLPlJF348wM9Clzfpgy9AdG6clheRwFlj5cnzaJRN30RjB1zeFx-p1hA-3D2haKeWTUNjW9rlhYEPwZNmB2CNIZG4F2z2Ze2WEDIyvU7A7QrZpP4DxOAuaIQ2eMs_XRTxe8eQvh76SCdK1hAVHicigIC9XQ6QaVGkQav9ckFBZGIDiEDNP_gnJPz0xS6_BjGZS76HcrGWpK31VmR8JpEkSOZI-2Snq9Rpn9a2lhAwiBYrDB3GFBHGLF2J0I9eDRwZlY1R0JiYComL5d6cnELdqohfr2KCt9JXywjx_LB9hkZd9ouFD5g47CbikIgb6NlYzE0bjB4LHVrd3M3aU5KR2dHcHZUbG84MlRSWHVsdVBra0l0aXBlaVFTWi1NcXZ3NXNRZWMxNG4xeCx1c05HYUt5V2Z5UHZYZ1NxbE1ZbW0xaWFJcHZqa1h6WjZqT3pIM0wwS2Q3Z2VjMTRuMngsdW90ajA4ellXT0lNMnEwaGtXVkI2ZmhVZV9TUmtrdTMzQkpkdG4tQ0FDalmA"
  }
}
```

## Contribute

See [the contribute file](https://github.com/digitalbazaar/bedrock/blob/master/CONTRIBUTING.md)!

PRs accepted.

If editing the Readme, please conform to the
[standard-readme](https://github.com/RichardLitt/standard-readme) specification.

## Commercial Support

Commercial support for this library is available upon request from
Digital Bazaar: support@digitalbazaar.com

## License

[New BSD License (3-clause)](LICENSE) © 2022 Digital Bazaar

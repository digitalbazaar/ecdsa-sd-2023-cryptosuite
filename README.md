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

- Browsers and Node.js 18+ are supported.

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
    "https://w3id.org/security/data-integrity/v2"
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
    "proofValue": "u2V0AhVhAJYHycsGSXfAeu3B79v_7bGXgV7PGt-g5THJoy5ozUnSLiEtlaQUJH8y-m7fA6SbAfsi_ib9dIlp5meEU0lVNElgjgCQCvZIjy3-f0ZY65-E4KboVApo9GhAN9qWKIR0ZIcaVE6BYIEVu230y2U_H_ibRuEk_5Z7jg5VTlhLqNF_m4T5T-LOChlhA8QcdE2gs6-4J-uLtL1-P1lbGwJISWk7oIXMTmTK72rtrOsXdaQeTkyN0CX-3sBhsciroYjbqpQcg8qAI4I2xxFhAPJE7FkZFOn8jMTGFhyAdLcK0T1jpzpIpSNhLmTIzZKhsYdpyijHsPMjM-CwpWuuHJbowZreNj7Xy-C_vHuMRQVhA87tpC5YTvVMx7epTcLKuVvOjVCYtDa95PApP7bg9NgIzycAUuJLTS2EZq1J19mji_G60IE-QiRzahEI4dy6ahVhA_BaNcvBqBQZ-pyCvfGuNkLwREHAYJpkZns5UyI_gZCynLxnoYfcvv9v5sWPghl-eJPhkKxlplDJmO93x3kbKplhAaIUQsz8V_t2r8VmawrAGEUgmEqEiecJ45HNuYJrWiBf0oE_vdiJOA9YP-l3FBeiGfCK10el6ugLkA9GiLCIfxVhAh-a-wrL7Z8mEVrfT_AHDuNnOAa2nwzWWFNwDEIkNum03LhRa3H0fUpFEZcP7MhdWgR4cxT0M-yhJUW5Nf03mW4A"
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
    "https://w3id.org/security/data-integrity/v2"
  ],
  "id": "urn:uuid:98c5cffc-efa2-43e3-99f5-01e8ef404be0",
  "type": [
    "VerifiableCredential",
    "AlumniCredential"
  ],
  "credentialSubject": {
    "id": "urn:uuid:d58b2365-0951-4373-96c8-e886d61829f2"
    // notably, `alumniOf` is not present
  },
  "proof": {
    "type": "DataIntegrityProof",
    "created": "2023-03-01T21:29:24Z",
    "verificationMethod": "did:key:zDnaekGZTbQBerwcehBSXLqAg6s55hVEBms1zFy89VHXtJSa9#zDnaekGZTbQBerwcehBSXLqAg6s55hVEBms1zFy89VHXtJSa9",
    "cryptosuite": "ecdsa-sd-2023",
    "proofPurpose": "assertionMethod",
    "proofValue": "u2V0BhVhAJYHycsGSXfAeu3B79v_7bGXgV7PGt-g5THJoy5ozUnSLiEtlaQUJH8y-m7fA6SbAfsi_ib9dIlp5meEU0lVNElgjgCQCvZIjy3-f0ZY65-E4KboVApo9GhAN9qWKIR0ZIcaVE6CDWEDxBx0TaCzr7gn64u0vX4_WVsbAkhJaTughcxOZMrvau2s6xd1pB5OTI3QJf7ewGGxyKuhiNuqlByDyoAjgjbHEWEA8kTsWRkU6fyMxMYWHIB0twrRPWOnOkilI2EuZMjNkqGxh2nKKMew8yMz4LCla64clujBmt42PtfL4L-8e4xFBWEDzu2kLlhO9UzHt6lNwsq5W86NUJi0Nr3k8Ck_tuD02AjPJwBS4ktNLYRmrUnX2aOL8brQgT5CJHNqEQjh3LpqFoIA"
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
    "https://w3id.org/security/data-integrity/v2"
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
    "https://w3id.org/security/data-integrity/v2"
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
    "proofValue": "u2V0AhVhAyM2mwjJlTYkC2QZgunbbnJlRP2coA8DJXHlrm9hzud-3bvwuMVjdhrVK3hydgvr8nze_di7QfIhZGDOt6_Tq6VgjgCQCq8WlSUFA784Z-aFwkE8lM-Z0e5k4noED75rKV9nyEyVYIK13wQfUQGW7f5XNOIVHcKi0O3TkM2McH4T8IdcJ30zIhVhAJEA2_9chguC4iMvtMSG99PvRsY37BcrWih1tHNT-4imz4fmxwxohMzx0xvH8CawiJ9E1slwszhi43VmfPgwmgVhAFEV21IU4BslgrGBAf-0HcBwGRPN38yRZ8e7G-GF8oXBUGtl5Sot9mTX3Ee6hSektBkpop5ozbbic8j4IYiA13lhAPzDD6Gp8LgaJL5b3ne26jFBOAbklJ6Zo_b3dj6FBYpV3vlb64rvATGdjYaaKyTCW9NcazpjninLckVZ9CKB3PlhAGcYAEAZUUmHbEoq0-mpbFn24qHuVkmlhQUyhIP2TNd2Tl-tsFqOhoitK6TjOUT3Bj1qLw-x8RWMi8lLoppc4_lhA7hMMIfnKM4CajB5lkM8f_b0OdFF_ZSLaJJcujlNzAHVTiOSKSvswYKzKDk0ZdHUeej3KgfJ7QmB-fDI9PkCkx4F4MS9jcmVkZW50aWFsU3ViamVjdC9kcml2ZXJMaWNlbnNlL2lzc3VpbmdBdXRob3JpdHk"
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
    "https://w3id.org/security/data-integrity/v2"
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
    "proofValue": "u2V0BhVhAyM2mwjJlTYkC2QZgunbbnJlRP2coA8DJXHlrm9hzud-3bvwuMVjdhrVK3hydgvr8nze_di7QfIhZGDOt6_Tq6VgjgCQCq8WlSUFA784Z-aFwkE8lM-Z0e5k4noED75rKV9nyEyWAowBYIEzd7S14pdeAy8d6-JBVTp0n-mBfmbUarg6kMqld__3EAVggqp46s-1-ncOZRvtre3UOk2THbeYHrLLdlVWrGAzBy9ICWCCdItOD0ZvYLgDNfJyYSFlnqpVtPURbhECsquANRIU5r4YAAQIDBAU"
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
    "https://w3id.org/security/data-integrity/v2"
  ],
  "type": [
    "VerifiableCredential",
    "DriverLicenseCredential"
  ],
  "credentialSubject": {
    "driverLicense": {
      "type": "DriverLicense",
      "issuingAuthority": "VA",
      "dateOfBirth": "01-01-1990"
    }
  },
  "proof": {
    "type": "DataIntegrityProof",
    "created": "2023-03-01T21:29:24Z",
    "verificationMethod": "did:key:zDnaekGZTbQBerwcehBSXLqAg6s55hVEBms1zFy89VHXtJSa9#zDnaekGZTbQBerwcehBSXLqAg6s55hVEBms1zFy89VHXtJSa9",
    "cryptosuite": "ecdsa-sd-2023",
    "proofPurpose": "assertionMethod",
    "proofValue": "u2V0BhVhAyM2mwjJlTYkC2QZgunbbnJlRP2coA8DJXHlrm9hzud-3bvwuMVjdhrVK3hydgvr8nze_di7QfIhZGDOt6_Tq6VgjgCQCq8WlSUFA784Z-aFwkE8lM-Z0e5k4noED75rKV9nyEyWBWEAkQDb_1yGC4LiIy-0xIb30-9GxjfsFytaKHW0c1P7iKbPh-bHDGiEzPHTG8fwJrCIn0TWyXCzOGLjdWZ8-DCaBowBYIKqeOrPtfp3DmUb7a3t1DpNkx23mB6yy3ZVVqxgMwcvSAVggnSLTg9Gb2C4AzXycmEhZZ6qVbT1EW4RArKrgDUSFOa8CWCBM3e0teKXXgMvHeviQVU6dJ_pgX5m1Gq4OpDKpXf_9xIYAAgMEBQY"
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

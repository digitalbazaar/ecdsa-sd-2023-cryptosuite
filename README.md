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
    "proofValue": "u2V0AhVhAnRWNgVdaJEUQrtuhcS10sZc5f6oPaQ2w6aUgEOp-YIc4f2RtVvFslS4-aeUPymYJsrsZ-5QTyQi8s82n-Vp781gkge0Pz7jJFVkZ_be-WpYHltgk9kOFMuZttvc6zZKvPSvQxeQ8WCB1n_8RGL7vlOFgRh0Ro58T6qx74L1PNd8zO9XuSar8UoVYQO22TaYJ9dg05NDAY3fh629tygirL3EsrS3PU_nw--4iIyqO0YD8OOQvmmDQTzge9EbwiBWwPpZRhOZBGivyx5tYQN1awVw8JeZHmtmKw3nnLYKPPjRRLFkVUo8BvjxlesDFJLhhtfkVK_6ESihW5roMsqAl_3MyiBiJ5rA9kJDip7xYQA7qRBPr_fDluvj5qopjyAUzvrOkpIF-b-fe4pcGT1EjRDvHv_i7E4CPvG-2LeiWXizJfiQnZEY_Kg8n2sLxsDtYQLPUbC3C21UgAaHYPPXETEurl1afRXrCLSRlxnhHgFpUKvjtVCc-8giG2QrEhSEOpi-GLo9SVaujclSJIwqk5IJYQJXaeBoqKqFWsohuLCareDJ_s1zcz9twspRE4OaK-B1Gu2Y-x7shsmO57Wj8BhgKwkDNN0B9NggbqwPmTqu-NO2BeDEvY3JlZGVudGlhbFN1YmplY3QvZHJpdmVyTGljZW5zZS9pc3N1aW5nQXV0aG9yaXR5"
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
    "proofValue": "u2V0BhVhAnRWNgVdaJEUQrtuhcS10sZc5f6oPaQ2w6aUgEOp-YIc4f2RtVvFslS4-aeUPymYJsrsZ-5QTyQi8s82n-Vp781gkge0Pz7jJFVkZ_be-WpYHltgk9kOFMuZttvc6zZKvPSvQxeQ8gKNlYzE0bjB4LHVFV2pTY2NxcG02d0VWZktnWXVxeWNUM2s1ZVJ5Y0NkclpaNkdQNDR4MDZvZWMxNG4xeCx1WE90Y19OQjYweG9rbTFFZS1KeW9SSWhFVENlRlFQOVN2cGVPaVBuVnNmZ2VjMTRuMngsdU9zWGZlSFpFYkVGSEk4aTBHd2ptMDBxVnNadWQ4Yms0SUNEeFB5RGVwLWOGAAECAwQF"
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
    "proofValue": "u2V0BhVhAnRWNgVdaJEUQrtuhcS10sZc5f6oPaQ2w6aUgEOp-YIc4f2RtVvFslS4-aeUPymYJsrsZ-5QTyQi8s82n-Vp781gkge0Pz7jJFVkZ_be-WpYHltgk9kOFMuZttvc6zZKvPSvQxeQ8gVhA7bZNpgn12DTk0MBjd-Hrb23KCKsvcSytLc9T-fD77iIjKo7RgPw45C-aYNBPOB70RvCIFbA-llGE5kEaK_LHm6NlYzE0bjB4LHVYT3RjX05CNjB4b2ttMUVlLUp5b1JJaEVUQ2VGUVA5U3ZwZU9pUG5Wc2ZnZWMxNG4xeCx1T3NYZmVIWkViRUZISThpMEd3am0wMHFWc1p1ZDhiazRJQ0R4UHlEZXAtY2VjMTRuMngsdUVXalNjY3FwbTZ3RVZmS2dZdXF5Y1QzazVlUnljQ2RyWlo2R1A0NHgwNm-GAAIDBAUG"
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

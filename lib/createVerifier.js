/*!
 * Copyright (c) 2022-2023 Digital Bazaar, Inc. All rights reserved.
 */
import * as base58 from 'base58-universal';
import * as EcdsaMultikey from '@digitalbazaar/ecdsa-multikey';

export async function createVerifier({verificationMethod}) {
  const key = await EcdsaMultikey.from(verificationMethod);
  const verifier = key.verifier();
  return _createSelectiveDisclosureVerifier({verifier});
}

function _createSelectiveDisclosureVerifier({verifier} = {}) {
  return {
    algorithm: verifier.algorithm,
    id: verifier.id,
    async verify({data, signature}) {
      return multiverify({verifier, data, signature});
    }
  };
}

export async function multiverify({verifier, data, signature} = {}) {
  const {publicKey, nonMandatory, signatures, verifyData} = data;

  // 1. Import `publicKey`.
  const publicKeyMultibase = base58.encode(publicKey);
  const localKeyPair = await EcdsaMultikey.from({publicKeyMultibase});

  // 2. Verify all signatures.
  if(signatures.length !== nonMandatory.length) {
    // FIXME: bikeshed error text
    throw new Error(
      'Signature count does not match non-mandatory message count.');
  }
  const {verify} = localKeyPair.verifier();
  const results = await Promise.all(signatures.map(
    (signature, index) => verify({data: nonMandatory[index], signature})));
  // check results
  for(const {verified, error} of results) {
    // FIXME: bikeshed
    if(!verified) {
      throw error;
    }
  }
  return verifier.verify({data: verifyData, signature});
}

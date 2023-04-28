/*!
 * Copyright (c) 2023 Digital Bazaar, Inc. All rights reserved.
 */
import * as base58 from 'base58-universal';
import * as EcdsaMultikey from '@digitalbazaar/ecdsa-multikey';
import {
  serializeMandatoryPointers, stringToUtf8Bytes
} from './di-sd-primitives/index.js';

// wraps a regular signer with a selective-disclosure signer
export function selectiveDisclosureSigner({signer} = {}) {
  return {
    algorithm: signer.algorithm,
    id: signer.id,
    async sign({data}) {
      return multisign({signer, data});
    }
  };
}

export async function multisign({signer, data} = {}) {
  const {
    mandatoryPointers, mandatoryHash, nonMandatory, hmacKey
  } = data;

  // 1. Sign non-mandatory quads.
  let localKeyPair;
  let signatures;
  if(nonMandatory.length > 0) {
    // generate a local ECDSA key to sign the non-mandatory quads
    localKeyPair = await EcdsaMultikey.generate({curve: 'P-256'});
    const {sign} = localKeyPair.signer();
    signatures = await Promise.all(nonMandatory.map(
      nq => sign({data: stringToUtf8Bytes(nq)})));
  }

  // 2. Combine `mandatoryHash.combined`, local public key, and signatures.
  // FIXME: use CBOR
  const mhBytes = mandatoryHash || new Uint8Array(0);
  let publicKey;
  if(!localKeyPair) {
    publicKey = new Uint8Array(0);
  } else {
    publicKey = base58.decode(localKeyPair.publicKeyMultibase);
  }
  let signaturesBytes;
  if(!signatures) {
    signaturesBytes = new Uint8Array(0);
  } else {
    // FIXME: implement and use array concat utility
    signaturesBytes = new Uint8Array(
      signatures.reduce((acc, s) => acc + s.length, 0));
    let offset = 0;
    for(const s of signatures) {
      signaturesBytes.set(s, offset);
      offset += s.length;
    }
  }
  // FIXME: implement and use array concat utility
  const toSign = new Uint8Array(
    mhBytes.length +
    publicKey.length +
    signaturesBytes.length);
  let offset = 0;
  toSign.set(mhBytes);
  offset += mhBytes.length;
  toSign.set(publicKey, offset);
  offset += publicKey.length;
  toSign.set(signaturesBytes, offset);
  offset += signaturesBytes.length;

  // FIXME:
  // 3. Sign data.
  const baseSignature = await signer.sign({data: toSign});

  // 4. Generate `proofValue`.
  // FIXME: include:
  // * baseSignature
  // * mandatoryPointers
  // * publicKey
  // * signatures
  // * hmacKey
  // FIXME: convert to CBOR
  // FIXME: implement and use array concat utility
  const mpBytes = serializeMandatoryPointers({mandatoryPointers});
  const proofValue = new Uint8Array(
    mpBytes.length +
    publicKey.length +
    signaturesBytes.length +
    hmacKey.length
  );
  offset = 0;
  proofValue.set(baseSignature);
  offset += baseSignature.length;
  proofValue.set(mpBytes);
  offset += mpBytes.length;
  proofValue.set(publicKey, offset);
  offset += publicKey.length;
  proofValue.set(signaturesBytes, offset);
  offset += signaturesBytes.length;
  proofValue.set(hmacKey, offset);
  return proofValue;
}

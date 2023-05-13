/*!
 * Copyright (c) 2023 Digital Bazaar, Inc. All rights reserved.
 */
import * as base58 from 'base58-universal';
import * as EcdsaMultikey from '@digitalbazaar/ecdsa-multikey';
import {
  serializeBaseProofValue,
  serializeBaseVerifyData
} from './proofValue.js';
import {stringToUtf8Bytes} from './di-sd-primitives/index.js';

// wraps a regular signer with a selective-disclosure signer
export function selectiveDisclosureSigner({signer} = {}) {
  return {
    algorithm: signer.algorithm,
    id: signer.id,
    async sign({data}) {
      return _multisign({signer, data});
    }
  };
}

async function _multisign({signer, data} = {}) {
  const {
    proofHash, mandatoryPointers, mandatoryHash, nonMandatory, hmacKey
  } = data;

  // 1. Sign non-mandatory quads using a locally generated key.
  const localKeyPair = await EcdsaMultikey.generate({curve: 'P-256'});
  const {sign} = localKeyPair.signer();
  const signatures = await Promise.all(nonMandatory.map(
    nq => sign({data: stringToUtf8Bytes(nq)})));

  // 2. Create data to be signed.
  const publicKey = base58.decode(localKeyPair.publicKeyMultibase);
  const toSign = await serializeBaseVerifyData(
    {proofHash, publicKey, mandatoryHash});

  // 3. Sign data.
  const baseSignature = await signer.sign({data: toSign});

  // 4. Generate `proofValue`.
  const proofValue = serializeBaseProofValue({
    baseSignature, publicKey, hmacKey, signatures, mandatoryPointers
  });
  return proofValue;
}

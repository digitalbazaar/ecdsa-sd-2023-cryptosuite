/*!
 * Copyright (c) 2023 Digital Bazaar, Inc. All rights reserved.
 */
import * as base64url from 'base64url-universal';
import {stringToUtf8Bytes} from './di-sd-primitives/index.js';

// FIXME: determine where `proofHash` should be generated / obtained and if
// `proof.proofValue` can just be passed here instead of `proof`
export function parseBaseProofValue({proof} = {}) {
  // FIXME: implement parsing of CBOR `baseProof.proofValue`
  const proofValue = base64url.decode(proof.proofValue.slice(1));
  const string = (new TextDecoder()).decode(proofValue);
  const parsed = JSON.parse(string);
  // FIXME: validate `parsed`
  return parsed;
}

// FIXME: determine where `proofHash` should be generated / obtained and if
// `proof.proofValue` can just be passed here instead of `proof`
export function parseDisclosureProofValue({proof} = {}) {
  // FIXME: implement parsing of CBOR `proof.proofValue`
  const proofValue = base64url.decode(proof.proofValue.slice(1));
  const string = (new TextDecoder()).decode(proofValue);
  const parsed = JSON.parse(string);
  // FIXME: validate `parsed`
  return parsed;
}

export function serializeBaseProofValue({
  baseSignature, publicKey, hmacKey, signatures, mandatoryPointers
} = {}) {
  // FIXME: assert all params

  // FIXME: use CBOR instead
  // FIXME: include:
  // * baseSignature
  // * publicKey
  // * hmacKey
  // * signatures
  // * mandatoryPointers
  const tmp = {
    baseSignature: base64url.encode(baseSignature),
    publicKey: base64url.encode(publicKey),
    hmacKey: base64url.encode(hmacKey),
    signatures: base64url.encode(_serializeSignatures({signatures})),
    mandatoryPointers: base64url.encode(_serializeMandatoryPointers(
      {mandatoryPointers}))
  };
  const proofValue = new Uint8Array(stringToUtf8Bytes(JSON.stringify(tmp)));
  return proofValue;
}

export function serializeBaseVerifyData({
  proofHash, publicKey, mandatoryHash
} = {}) {
  // FIXME: assert all params

  // FIXME: use CBOR instead
  // FIXME: include:
  // * proofHash
  // * publicKey
  // * mandatoryHash
  const tmp = {
    proofHash: base64url.encode(proofHash),
    publicKey: base64url.encode(publicKey),
    mandatoryHash: base64url.encode(mandatoryHash)
  };
  const verifyData = new Uint8Array(stringToUtf8Bytes(JSON.stringify(tmp)));
  return verifyData;
}

export function serializeDisclosureProofValue({
  baseSignature, publicKey, signatures, labelMap, mandatoryIndexes
} = {}) {
  // FIXME: assert all params

  // FIXME: use CBOR instead
  // FIXME: include:
  // * baseSignature
  // * publicKey
  // * signatures
  // * labelMap
  // * mandatoryIndexes
  const tmp = {
    baseSignature: base64url.encode(baseSignature),
    publicKey: base64url.encode(publicKey),
    signatures: base64url.encode(_serializeSignatures({signatures})),
    labelMap: base64url.encode(_serializeLabelMap({labelMap})),
    mandatoryIndexes: base64url.encode(_serializeMandatoryIndexes(
      {mandatoryIndexes}))
  };
  const proofValue = new Uint8Array(stringToUtf8Bytes(JSON.stringify(tmp)));
  return proofValue;
}

function _serializeLabelMap({labelMap} = {}) {
  // FIXME: use CBOR instead
  return new Uint8Array(stringToUtf8Bytes(
    JSON.stringify([...labelMap.entries()])));
}

function _serializeMandatoryIndexes({mandatoryIndexes} = {}) {
  // FIXME: use CBOR instead
  return new Uint8Array(stringToUtf8Bytes(JSON.stringify(mandatoryIndexes)));
}

function _serializeMandatoryPointers({mandatoryPointers} = {}) {
  // FIXME: use CBOR instead
  if(!mandatoryPointers) {
    return new Uint8Array(0);
  }
  return stringToUtf8Bytes(JSON.stringify(mandatoryPointers, null, 2));
}

function _serializeSignatures({signatures} = {}) {
  // FIXME: use CBOR instead
  if(!signatures) {
    return new Uint8Array(0);
  }
  const signaturesBytes = new Uint8Array(
    signatures.reduce((acc, s) => acc + s.length, 0));
  let offset = 0;
  for(const s of signatures) {
    signaturesBytes.set(s, offset);
    offset += s.length;
  }
  return signaturesBytes;
}

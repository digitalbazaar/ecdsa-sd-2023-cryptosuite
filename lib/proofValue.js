/*!
 * Copyright (c) 2023 Digital Bazaar, Inc. All rights reserved.
 */
import * as base64url from 'base64url-universal';
import {stringToUtf8Bytes} from './di-sd-primitives/index.js';

export function parseBaseProofValue({} = {}) {
  // FIXME: implement
}

export function parseDisclosureProofValue({} = {}) {
  // FIXME: implement
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

// FIXME: remove `h2` if adds unnecessary complexity
export function serializeDisclosureProofValue({
  baseSignature, publicKey, h2, signatures,
  labelMap, mandatoryIndexMap
} = {}) {
  // FIXME: assert all params

  // FIXME: use CBOR instead
  // FIXME: include:
  // * baseSignature
  // * publicKey
  // * h2 (FIXME: remove this if unnecessary)
  // * signatures
  // * labelMap
  // * mandatoryIndexMap
  const tmp = {
    baseSignature: base64url.encode(baseSignature),
    publicKey: base64url.encode(publicKey),
    h2: base64url.encode(h2),
    signatures: base64url.encode(_serializeSignatures({signatures})),
    labelMap: base64url.encode(_serializeLabelMap({labelMap})),
    mandatoryIndexMap: base64url.encode(_serializeMandatoryIndexMap(
      {mandatoryIndexMap}))
  };
  const proofValue = new Uint8Array(stringToUtf8Bytes(JSON.stringify(tmp)));
  return proofValue;
}

function _serializeLabelMap({labelMap} = {}) {
  // FIXME: use CBOR instead
  return new Uint8Array(stringToUtf8Bytes(
    JSON.stringify([...labelMap.entries()])));
}

function _serializeMandatoryIndexMap({mandatoryIndexMap} = {}) {
  // FIXME: use CBOR instead
  return new Uint8Array(stringToUtf8Bytes(
    JSON.stringify([...mandatoryIndexMap.entries()])));
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

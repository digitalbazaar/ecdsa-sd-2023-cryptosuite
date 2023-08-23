/*!
 * Copyright (c) 2023 Digital Bazaar, Inc. All rights reserved.
 */
import * as base64url from 'base64url-universal';
import * as cborg from 'cborg';

/* CBOR proof value representation:
0xd9 == 11011001
110 = CBOR major type 6
11001 = 25, 16-bit tag size (65536 possible values)
0x5d = always the first 8-bits of an ECDSA-SD tag
0x00 | 0x01 = last 8-bits of a ECDSA-SD tag indicating proof mode
proof mode can be 0 = base, 1 = derived
*/
const CBOR_PREFIX_BASE = new Uint8Array([0xd9, 0x5d, 0x00]);
const CBOR_PREFIX_DERIVED = new Uint8Array([0xd9, 0x5d, 0x01]);

export function parseBaseProofValue({proof} = {}) {
  try {
    if(typeof proof?.proofValue !== 'string') {
      throw new TypeError('"proof.proofValue" must be a string.');
    }
    if(proof.proofValue[0] !== 'u') {
      throw new Error('Only base64url multibase encoding is supported.');
    }

    // decode from base64url
    const proofValue = base64url.decode(proof.proofValue.slice(1));
    if(!_startsWithBytes(proofValue, CBOR_PREFIX_BASE)) {
      throw new TypeError('"proof.proofValue" must be a base proof.');
    }

    const payload = proofValue.subarray(CBOR_PREFIX_BASE.length);
    const [
      baseSignature,
      publicKey,
      hmacKey,
      signatures,
      mandatoryPointers
    ] = cborg.decode(payload, {useMaps: true});

    const params = {
      baseSignature, publicKey, hmacKey, signatures, mandatoryPointers
    };
    _validateBaseProofParams(params);
    return params;
  } catch(e) {
    const err = new TypeError(
      'The proof does not include a valid "proofValue" property.');
    err.cause = e;
    throw err;
  }
}

export function parseDisclosureProofValue({proof} = {}) {
  try {
    if(typeof proof?.proofValue !== 'string') {
      throw new TypeError('"proof.proofValue" must be a string.');
    }
    if(proof.proofValue[0] !== 'u') {
      throw new Error('Only base64url multibase encoding is supported.');
    }

    // decode from base64url
    const proofValue = base64url.decode(proof.proofValue.slice(1));
    if(!_startsWithBytes(proofValue, CBOR_PREFIX_DERIVED)) {
      throw new TypeError('"proof.proofValue" must be a derived proof.');
    }

    const payload = proofValue.subarray(CBOR_PREFIX_DERIVED.length);
    const [
      baseSignature,
      publicKey,
      signatures,
      compressedLabelMap,
      mandatoryIndexes
    ] = cborg.decode(payload, {useMaps: true});

    const labelMap = _decompressLabelMap(compressedLabelMap);
    const params = {
      baseSignature, publicKey, signatures, labelMap, mandatoryIndexes
    };
    _validateDerivedProofParams(params);
    return params;
  } catch(e) {
    const err = new TypeError(
      'The proof does not include a valid "proofValue" property.');
    err.cause = e;
    throw err;
  }
}

export function serializeBaseProofValue({
  baseSignature, publicKey, hmacKey, signatures, mandatoryPointers
} = {}) {
  _validateBaseProofParams({
    baseSignature, publicKey, hmacKey, signatures, mandatoryPointers
  });

  // encode as multibase (base64url no pad) CBOR
  const payload = [
    // Uint8Array
    baseSignature,
    // Uint8Array
    publicKey,
    // Uint8Array
    hmacKey,
    // array of Uint8Arrays
    signatures,
    // array of strings
    mandatoryPointers
  ];
  const cbor = _concatBuffers([CBOR_PREFIX_BASE, cborg.encode(payload)]);
  return `u${base64url.encode(cbor)}`;
}

export function serializeBaseVerifyData({
  proofHash, publicKey, mandatoryHash
} = {}) {
  _validateBaseVerifyDataParams({proofHash, publicKey, mandatoryHash});

  // concatenate, in order: `proofHash` + `publicKey` + `mandatoryHash`
  const verifyData = _concatBuffers([proofHash, publicKey, mandatoryHash]);
  return verifyData;
}

export function serializeDisclosureProofValue({
  baseSignature, publicKey, signatures, labelMap, mandatoryIndexes
} = {}) {
  _validateDerivedProofParams({
    baseSignature, publicKey, signatures, labelMap, mandatoryIndexes
  });

  // encode as multibase (base64url no pad) CBOR
  const payload = [
    // Uint8Array
    baseSignature,
    // Uint8Array
    publicKey,
    // array of Uint8Arrays
    signatures,
    // Map of strings => strings compressed to ints => Uint8Arrays
    _compressLabelMap(labelMap),
    // array of numbers
    mandatoryIndexes
  ];
  const cbor = _concatBuffers([CBOR_PREFIX_DERIVED, cborg.encode(payload)]);
  return `u${base64url.encode(cbor)}`;
}

function _compressLabelMap(labelMap) {
  const map = new Map();
  for(const [k, v] of labelMap.entries()) {
    map.set(parseInt(k.slice(4), 10), base64url.decode(v.slice(1)));
  }
  return map;
}

function _concatBuffers(buffers) {
  const bytes = new Uint8Array(buffers.reduce((acc, b) => acc + b.length, 0));
  let offset = 0;
  for(const b of buffers) {
    bytes.set(b, offset);
    offset += b.length;
  }
  return bytes;
}

function _decompressLabelMap(compressedLabelMap) {
  const map = new Map();
  for(const [k, v] of compressedLabelMap.entries()) {
    map.set(`c14n${k}`, `u${base64url.encode(v)}`);
  }
  return map;
}

function _startsWithBytes(buffer, prefix) {
  for(let i = 0; i < prefix.length; ++i) {
    if(buffer[i] !== prefix[i]) {
      return false;
    }
  }
  return true;
}

function _validateBaseProofParams({
  baseSignature, publicKey, hmacKey, signatures, mandatoryPointers
}) {
  if(!(baseSignature instanceof Uint8Array && baseSignature.length === 64)) {
    throw new TypeError('"baseSignature" must be a Uint8Array of length 64.');
  }
  if(!(publicKey instanceof Uint8Array &&
    publicKey.length === 35)) {
    throw new TypeError('"publicKey" must be a Uint8Array of length 35.');
  }
  if(!(hmacKey instanceof Uint8Array && hmacKey.length === 32)) {
    throw new TypeError('"hmacKey" must be a Uint8Array of length 32.');
  }
  if(!(Array.isArray(signatures) &&
    signatures.every(s => s instanceof Uint8Array && s.length === 64))) {
    throw new TypeError(
      '"signatures" must be an array of Uint8Arrays, each of length 64.');
  }
  if(!(Array.isArray(mandatoryPointers) &&
    mandatoryPointers.every(p => typeof p === 'string'))) {
    throw new TypeError('"mandatoryPointers" must be an array of strings.');
  }
}

function _validateBaseVerifyDataParams({
  proofHash, publicKey, mandatoryHash
}) {
  if(!(proofHash instanceof Uint8Array && proofHash.length === 32)) {
    throw new TypeError('"proofHash" must be a Uint8Array of length 32.');
  }
  if(!(publicKey instanceof Uint8Array &&
    publicKey.length === 35)) {
    throw new TypeError('"publicKey" must be a Uint8Array of length 35.');
  }
  if(!(mandatoryHash instanceof Uint8Array && mandatoryHash.length === 32)) {
    throw new TypeError('"mandatoryHash" must be a Uint8Array of length 32.');
  }
}

function _validateDerivedProofParams({
  baseSignature, publicKey, signatures, labelMap, mandatoryIndexes
}) {
  if(!(baseSignature instanceof Uint8Array && baseSignature.length === 64)) {
    throw new TypeError('"baseSignature" must be a Uint8Array of length 64.');
  }
  if(!(publicKey instanceof Uint8Array &&
    publicKey.length === 35)) {
    throw new TypeError('"publicKey" must be a Uint8Array of length 35.');
  }
  if(!(Array.isArray(signatures) &&
    signatures.every(s => s instanceof Uint8Array))) {
    throw new TypeError('"signatures" must be an array of Uint8Arrays.');
  }
  if(!(labelMap instanceof Map &&
    [...labelMap.entries()].every(
      ([k, v]) => typeof k === 'string' && typeof v === 'string'))) {
    throw new TypeError('"labelMap" must be a Map of strings to strings.');
  }
  if(!(Array.isArray(mandatoryIndexes) &&
    mandatoryIndexes.every(Number.isInteger))) {
    throw new TypeError('"mandatoryPointers" must be an array of integers.');
  }
}

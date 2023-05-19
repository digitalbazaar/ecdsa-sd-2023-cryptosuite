/*!
 * Copyright (c) 2023 Digital Bazaar, Inc. All rights reserved.
 */
import * as base64url from 'base64url-universal';
import * as cborg from 'cborg';
import {stringToUtf8Bytes} from './di-sd-primitives/index.js';

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

// tags for CBOR representation of proof values
const TAG_BASE_SIGNATURE = 0;
const TAG_PUBLIC_KEY = 1;
const TAG_HMAC_KEY = 2;
const TAG_SIGNATURES = 3;
const TAG_LABEL_MAP = 4;
const TAG_MANDATORY_POINTERS = 5;
const TAG_MANDATORY_INDEXES = 6;

const SIGNATURE_SIZE = 64;
const TEXT_DECODER = new TextDecoder();

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
    const map = cborg.decode(payload, {useMaps: true});
    const baseSignature = map.get(TAG_BASE_SIGNATURE);
    const publicKey = map.get(TAG_PUBLIC_KEY);
    const hmacKey = map.get(TAG_HMAC_KEY);
    const signatures = map.get(TAG_SIGNATURES);
    const mandatoryPointers = map.get(TAG_MANDATORY_POINTERS);

    // FIXME: validate

    return {baseSignature, publicKey, hmacKey, signatures, mandatoryPointers};
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

    // // decode from base64url
    // const proofValue = base64url.decode(proof.proofValue.slice(1));
    // if(!_startsWithBytes(proofValue, CBOR_PREFIX_DERIVED)) {
    //   throw new TypeError('"proof.proofValue" must be a derived proof.');
    // }

    // FIXME: implement parsing of CBOR `proof.proofValue`
    const proofValue = base64url.decode(proof.proofValue.slice(1));
    const string = (new TextDecoder()).decode(proofValue);
    const parsed = JSON.parse(string);
    // FIXME: validate `parsed`
    const decoded = {
      baseSignature: base64url.decode(parsed.baseSignature),
      publicKey: base64url.decode(parsed.publicKey),
      signatures: _parseSignatures(
        {signatures: base64url.decode(parsed.signatures)}),
      labelMap: _parseLabelMap(
        {labelMap: base64url.decode(parsed.labelMap)}),
      mandatoryIndexes: _parseMandatoryIndexes(
        {mandatoryIndexes: base64url.decode(parsed.mandatoryIndexes)})
    };
    return decoded;
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
  if(!(baseSignature instanceof Uint8Array)) {
    throw new TypeError('"baseSignature" must be a Uint8Array.');
  }
  if(!(publicKey instanceof Uint8Array)) {
    throw new TypeError('"publicKey" must be a Uint8Array.');
  }
  if(!(hmacKey instanceof Uint8Array)) {
    throw new TypeError('"hmacKey" must be a Uint8Array.');
  }
  if(!Array.isArray(signatures)) {
    throw new TypeError('"signatures" must be an array.');
  }
  if(!Array.isArray(mandatoryPointers)) {
    throw new TypeError('"mandatoryPointers" must be an array.');
  }

  // encode as multibase (base64url no pad) CBOR
  const map = new Map([
    // Uint8Array
    [TAG_BASE_SIGNATURE, baseSignature],
    // Uint8Array
    [TAG_PUBLIC_KEY, publicKey],
    // Uint8Array
    [TAG_HMAC_KEY, hmacKey],
    // array of Uint8Arrays
    [TAG_SIGNATURES, signatures],
    // array of strings
    [TAG_MANDATORY_POINTERS, mandatoryPointers],
  ]);
  const cbor = _concatBuffers([CBOR_PREFIX_BASE, cborg.encode(map)]);
  return `u${base64url.encode(cbor)}`;
}

export function serializeBaseVerifyData({
  proofHash, publicKey, mandatoryHash
} = {}) {
  // FIXME: assert all params

  // concatenate, in order: `proofHash` + `publicKey` + `mandatoryHash`
  // FIXME: use `_concatBuffers` instead of JSON
  const tmp = {
    proofHash: base64url.encode(proofHash),
    publicKey: base64url.encode(publicKey),
    mandatoryHash: base64url.encode(mandatoryHash)
  };
  const verifyData = stringToUtf8Bytes(JSON.stringify(tmp));
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
    signatures: base64url.encode(_concatBuffers(signatures)),
    labelMap: base64url.encode(_serializeLabelMap({labelMap})),
    mandatoryIndexes: base64url.encode(_serializeMandatoryIndexes(
      {mandatoryIndexes}))
  };
  const proofValue = stringToUtf8Bytes(JSON.stringify(tmp));
  return `u${base64url.encode(proofValue)}`;
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

function _parseLabelMap({labelMap} = {}) {
  const parsed = _fromJSONBytes(labelMap);
  return new Map(parsed);
}

function _parseMandatoryIndexes({mandatoryIndexes} = {}) {
  return _fromJSONBytes(mandatoryIndexes);
}

function _parseSignatures({signatures} = {}) {
  // FIXME: use CBOR instead... minimally need a total size preceeding this
  // or encode an array of Uint8Arrays
  signatures = new Uint8Array(signatures);
  const count = signatures.length / 64;
  if(!Number.isInteger(count)) {
    throw new Error(
      `Invalid signature block size "${signatures.length}"; ` +
      `it must be a multiple of ${SIGNATURE_SIZE}.`);
  }
  const parsed = [];
  for(let offset = 0; offset < signatures.length; offset += SIGNATURE_SIZE) {
    parsed.push(signatures.subarray(offset, offset + SIGNATURE_SIZE));
  }
  return parsed;
}

function _serializeLabelMap({labelMap} = {}) {
  // FIXME: use CBOR instead
  if(!(labelMap instanceof Map)) {
    throw new TypeError('"labelMap" must be a Map.');
  }
  return stringToUtf8Bytes(JSON.stringify([...labelMap.entries()]));
}

function _fromJSONBytes(x) {
  return JSON.parse(TEXT_DECODER.decode(x));
}

function _toJSONBytes(x) {
  return stringToUtf8Bytes(JSON.stringify(x));
}

function _serializeMandatoryIndexes({mandatoryIndexes} = {}) {
  // FIXME: use CBOR instead
  if(!Array.isArray(mandatoryIndexes)) {
    throw new TypeError('"mandatoryIndexes" must be an array.');
  }
  return _toJSONBytes(mandatoryIndexes);
}

function _startsWithBytes(buffer, prefix) {
  for(let i = 0; i < prefix.length; ++i) {
    if(buffer[i] !== prefix[i]) {
      return false;
    }
  }
  return true;
}

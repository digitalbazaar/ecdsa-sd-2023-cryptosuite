/*!
 * Copyright (c) 2023 Digital Bazaar, Inc. All rights reserved.
 */
import * as base64url from 'base64url-universal';
import {stringToUtf8Bytes} from './di-sd-primitives/index.js';

const SIGNATURE_SIZE = 64;

export function parseBaseProofValue({proof} = {}) {
  try {
    if(typeof proof?.proofValue !== 'string') {
      throw new TypeError('"proof.proofValue" must be a string.');
    }
    if(proof.proofValue[0] !== 'u') {
      throw new Error('Only base64url multibase encoding is supported.');
    }

    // FIXME: implement parsing of CBOR `proof.proofValue`
    const proofValue = base64url.decode(proof.proofValue.slice(1));
    const string = (new TextDecoder()).decode(proofValue);
    const parsed = JSON.parse(string);
    // FIXME: validate `parsed`
    const decoded = {
      baseSignature: base64url.decode(parsed.baseSignature),
      publicKey: base64url.decode(parsed.publicKey),
      hmacKey: base64url.decode(parsed.hmacKey),
      signatures: _parseSignatures(
        {signatures: base64url.decode(parsed.signatures)}),
      mandatoryPointers: _parseMandatoryPointers(
        {mandatoryPointers: base64url.decode(parsed.mandatoryPointers)})
    };
    return decoded;
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
  const proofValue = stringToUtf8Bytes(JSON.stringify(tmp));
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
    signatures: base64url.encode(_serializeSignatures({signatures})),
    labelMap: base64url.encode(_serializeLabelMap({labelMap})),
    mandatoryIndexes: base64url.encode(_serializeMandatoryIndexes(
      {mandatoryIndexes}))
  };
  const proofValue = stringToUtf8Bytes(JSON.stringify(tmp));
  return proofValue;
}

// FIXME: remove this helper once CBOR is used
function _deserializeJSONBytes(jsonBytes) {
  // FIXME: use CBOR instead
  return JSON.parse((new TextDecoder()).decode(jsonBytes));
}

function _parseLabelMap({labelMap} = {}) {
  const parsed = _deserializeJSONBytes(labelMap);
  return new Map(parsed);
}

function _parseMandatoryIndexes({mandatoryIndexes} = {}) {
  return _deserializeJSONBytes(mandatoryIndexes);
}

function _parseMandatoryPointers({mandatoryPointers} = {}) {
  return _deserializeJSONBytes(mandatoryPointers);
}

function _parseSignatures({signatures} = {}) {
  // FIXME: use CBOR instead
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
  return stringToUtf8Bytes(
    JSON.stringify([...labelMap.entries()]));
}

function _serializeMandatoryIndexes({mandatoryIndexes} = {}) {
  // FIXME: use CBOR instead
  return stringToUtf8Bytes(JSON.stringify(mandatoryIndexes));
}

function _serializeMandatoryPointers({mandatoryPointers} = {}) {
  // FIXME: use CBOR instead
  return stringToUtf8Bytes(JSON.stringify(mandatoryPointers));
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

/*!
 * Copyright (c) 2022-2023 Digital Bazaar, Inc. All rights reserved.
*/
import {createBaseProofValue, createSignData} from './sign.js';
import {createVerifier, createVerifyData} from './verify.js';
import {canonize} from './canonize.js';
import {derive} from './disclose.js';
import {name} from './name.js';
import {requiredAlgorithm} from './requiredAlgorithm.js';

// common to all cryptosuites below
const _cryptosuite = {
  canonize,
  name,
  requiredAlgorithm
};

export function createSignCryptosuite({mandatoryPointers} = {}) {
  const options = {mandatoryPointers};
  return {
    ..._cryptosuite,
    createVerifier: _throwSignUsageError,
    createVerifyData: createSignData,
    createProofValue: createBaseProofValue,
    options};
}

export function createDiscloseCryptosuite({proofId, selectivePointers} = {}) {
  const options = {proofId, selectivePointers};
  return {
    ..._cryptosuite,
    createVerifier: _throwDeriveUsageError,
    createProofValue: _throwDeriveUsageError,
    createVerifyData: _throwDeriveUsageError,
    derive,
    options
  };
}

export function createVerifyCryptosuite() {
  return {..._cryptosuite, createVerifier, createVerifyData};
}

function _throwDeriveUsageError() {
  throw new Error('This cryptosuite must be used with "derive".');
}

function _throwSignUsageError() {
  throw new Error('This cryptosuite must be used with "sign".');
}

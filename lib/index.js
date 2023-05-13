/*!
 * Copyright (c) 2022-2023 Digital Bazaar, Inc. All rights reserved.
*/
import {canonize} from './canonize.js';
import {createSignData} from './createSignData.js';
import {createVerifier} from './createVerifier.js';
import {createVerifyData} from './createVerifyData.js';
import {derive} from './createDiscloseData.js';
import {name} from './name.js';
import {requiredAlgorithm} from './requiredAlgorithm.js';

// common to all cryptosuites below
const _cryptosuite = {
  canonize,
  createVerifier,
  name,
  requiredAlgorithm
};

export function createSignCryptosuite({mandatoryPointers} = {}) {
  const options = {mandatoryPointers};
  return {..._cryptosuite, createVerifyData: createSignData, options};
}

export function createDiscloseCryptosuite({proofId, selectivePointers} = {}) {
  const options = {proofId, selectivePointers};
  return {
    ..._cryptosuite,
    createProofValue: _throwDeriveUsageError,
    createVerifyData: _throwDeriveUsageError,
    derive,
    options
  };
}

export function createVerifyCryptosuite() {
  return {..._cryptosuite, createVerifyData};
}

function _throwDeriveUsageError() {
  throw new Error('This cryptosuite must be used with "derive".');
}

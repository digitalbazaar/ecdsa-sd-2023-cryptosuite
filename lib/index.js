/*!
 * Copyright (c) 2022-2023 Digital Bazaar, Inc. All rights reserved.
*/
import {canonize} from './canonize.js';
import {createDiscloseData} from './createDiscloseData.js';
import {createSignData} from './createSignData.js';
import {createVerifier} from './createVerifier.js';
import {createVerifyData} from './createVerifyData.js';
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

export function createDiscloseCryptosuite({disclosurePointers} = {}) {
  const options = {disclosurePointers};
  return {
    ..._cryptosuite, createVerifyData: createDiscloseData, options
  };
}

export function createVerifyCryptosuite() {
  return {..._cryptosuite, createVerifyData};
}

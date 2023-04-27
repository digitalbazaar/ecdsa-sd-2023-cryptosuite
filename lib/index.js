/*!
 * Copyright (c) 2022-2023 Digital Bazaar, Inc. All rights reserved.
*/
import {canonize} from './canonize.js';
import {createBaseVerifyData} from './createBaseVerifyData.js';
import {createDisclosureVerifyData} from './createDisclosureVerifyData.js';
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

export function createBaseCryptosuite({mandatoryPointers} = {}) {
  const options = {mandatoryPointers};
  return {..._cryptosuite, createVerifyData: createBaseVerifyData, options};
}

export function createDisclosureCryptosuite({disclosurePointers} = {}) {
  const options = {disclosurePointers};
  return {
    ..._cryptosuite, createVerifyData: createDisclosureVerifyData, options
  };
}

export function createVerifyCryptosuite() {
  return {..._cryptosuite, createVerifyData};
}

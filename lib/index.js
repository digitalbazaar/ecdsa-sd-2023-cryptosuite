/*!
 * Copyright (c) 2022 Digital Bazaar, Inc. All rights reserved.
*/
import {canonize} from './canonize.js';
import {createVerifier} from './createVerifier.js';
import {name} from './name.js';
import {requiredAlgorithm} from './requiredAlgorithm.js';

export const cryptosuite = {
  canonize,
  createVerifier,
  name,
  requiredAlgorithm,
};

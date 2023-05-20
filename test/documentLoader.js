/*!
 * Copyright (c) 2023 Digital Bazaar, Inc. All rights reserved.
 */
import {
  controllerDocEcdsaMultikey,
  ecdsaMultikeyKeyPair,
  publicEcdsaMultikey,
} from './mock-data.js';
import dataIntegrityContext from '@digitalbazaar/data-integrity-context';
import multikeyContext from '@digitalbazaar/multikey-context';
import {securityLoader} from '@digitalbazaar/security-document-loader';

export const loader = securityLoader();

loader.addStatic(
  ecdsaMultikeyKeyPair.controller,
  controllerDocEcdsaMultikey);
loader.addStatic(
  publicEcdsaMultikey.id,
  publicEcdsaMultikey);

loader.addStatic(
  dataIntegrityContext.constants.CONTEXT_URL,
  dataIntegrityContext.contexts.get(
    dataIntegrityContext.constants.CONTEXT_URL));

loader.addStatic(
  multikeyContext.constants.CONTEXT_URL,
  multikeyContext.contexts.get(
    multikeyContext.constants.CONTEXT_URL));

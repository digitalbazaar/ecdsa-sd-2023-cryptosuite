/*!
 * Copyright (c) 2022 Digital Bazaar, Inc. All rights reserved.
 */
import * as Ed25519Multikey from '@digitalbazaar/ed25519-multikey';

export async function createVerifier({verificationMethod}) {
  const key = await Ed25519Multikey.from(verificationMethod);
  const verifier = key.verifier();
  return verifier;
}

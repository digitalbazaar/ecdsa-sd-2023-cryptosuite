/*!
 * Copyright (c) 2023 Digital Bazaar, Inc. All rights reserved.
 */
export function createVerifyData({
  publicKey, mandatoryHash, proofHash, signatures
} = {}) {
  // combine `mandatoryHash`, public key, and signatures.
  // FIXME: include `proofHash` as well
  // FIXME: use CBOR
  const mhBytes = mandatoryHash || new Uint8Array(0);
  // FIXME: implement and use array concat utility or just skip and do
  // JSON.stringify => UTF-8 ... until CBOR is ready
  const verifyData = new Uint8Array(
    proofHash.length +
    mhBytes.length +
    publicKey.length +
    signatures.length);
  let offset = 0;
  verifyData.set(mhBytes);
  offset += mhBytes.length;
  verifyData.set(publicKey, offset);
  offset += publicKey.length;
  verifyData.set(signatures, offset);
  offset += signatures.length;

  return verifyData;
}

/*!
 * Copyright (c) 2023 Digital Bazaar, Inc. All rights reserved.
 */
const TEXT_ENCODER = new TextEncoder();

export function stringToUtf8Bytes(str) {
  return TEXT_ENCODER.encode(str);
}

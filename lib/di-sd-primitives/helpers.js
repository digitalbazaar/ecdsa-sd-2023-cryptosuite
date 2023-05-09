/*!
 * Copyright (c) 2023 Digital Bazaar, Inc. All rights reserved.
 */
const TEXT_ENCODER = new TextEncoder();

// JSON pointer escape sequences
// ~0 => '~'
// ~1 => '/'
const POINTER_ESCAPE_REGEX = /~[01]/g;

export function parsePointer(pointer) {
  // see RFC 6901: https://www.rfc-editor.org/rfc/rfc6901.html
  const parsed = [];
  const paths = pointer.split('/').slice(1);
  for(const path of paths) {
    if(path.includes('~')) {
      parsed.push(path);
    } else {
      parsed.push(path.replace(POINTER_ESCAPE_REGEX, _unescapePointerPath));
    }
  }
  return parsed;
}

export function stringToUtf8Bytes(str) {
  return TEXT_ENCODER.encode(str);
}

function _unescapePointerPath(m) {
  if(m === '~1') {
    return '/';
  }
  if(m === '~0') {
    return '~';
  }
  throw new Error(`Invalid JSON pointer escape sequence "${m}".`);
}

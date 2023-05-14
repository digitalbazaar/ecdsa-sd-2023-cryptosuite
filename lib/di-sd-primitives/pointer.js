/*!
 * Copyright (c) 2023 Digital Bazaar, Inc. All rights reserved.
 */
import {klona} from 'klona';

// JSON pointer escape sequences
// ~0 => '~'
// ~1 => '/'
const POINTER_ESCAPE_REGEX = /~[01]/g;

export function pointersToFrame({
  document, pointers, includeTypes = true
} = {}) {
  if(!(document && typeof document === 'object')) {
    throw new TypeError('"document" must be an object.');
  }
  if(!Array.isArray(pointers)) {
    throw new TypeError('"pointers" must be an array.');
  }
  if(pointers.length === 0) {
    // no pointers, so no frame
    return null;
  }
  let frame = _initFrame({value: document, includeTypes});
  for(const pointer of pointers) {
    // walk document building frames from root to value
    let parentFrame = frame;
    let parentValue = document;
    let value = parentValue;
    let valueFrame = parentFrame;
    const paths = _parsePointer(pointer);
    for(const path of paths) {
      parentFrame = valueFrame;
      parentValue = value;

      // get next document value
      value = parentValue[path];
      if(value === undefined) {
        throw new TypeError(
          `JSON pointer "${pointer}" does not match document.`);
      }

      // get next value frame
      valueFrame = parentFrame[path];
      if(valueFrame === undefined) {
        if(Array.isArray(value)) {
          valueFrame = [];
        } else {
          valueFrame = _initFrame({value, includeTypes});
        }
        parentFrame[path] = valueFrame;
      }
    }

    // generate final value frame
    if(typeof value !== 'object') {
      // literal selected
      valueFrame = value;
    } else {
      if(Array.isArray(value)) {
        valueFrame = value.map(e => {
          if(Array.isArray(e)) {
            // FIXME: determine if these can be supported
            throw new TypeError('Arrays of arrays are not supported.');
          }
          return klona(e);
        });
      } else {
        valueFrame = {...valueFrame, ...klona(value)};
      }
    }

    // set final value frame
    if(paths.length === 0) {
      // whole document selected
      frame = valueFrame;
    } else {
      // partial selection made
      parentFrame[paths.at(-1)] = valueFrame;
    }
  }

  frame['@context'] = klona(document['@context']);
  return frame;
}

function _initFrame({value, includeTypes}) {
  const frame = {};
  // must include non-blank node IDs
  if(value.id && !value.id.startsWith('_:')) {
    frame.id = value.id;
  }
  // include types if directed to do so
  if(includeTypes && value.type) {
    frame.type = value.type;
  }
  return frame;
}

function _parsePointer(pointer) {
  // see RFC 6901: https://www.rfc-editor.org/rfc/rfc6901.html
  const parsed = [];
  const paths = pointer.split('/').slice(1);
  for(const path of paths) {
    if(!path.includes('~')) {
      // convert any numerical path to a number as an array index
      const index = parseInt(path, 10);
      parsed.push(isNaN(index) ? path : index);
    } else {
      parsed.push(path.replace(POINTER_ESCAPE_REGEX, _unescapePointerPath));
    }
  }
  return parsed;
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

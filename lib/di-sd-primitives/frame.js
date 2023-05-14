/*!
 * Copyright (c) 2023 Digital Bazaar, Inc. All rights reserved.
 */
import jsonld from 'jsonld';

// these frame options are always used to exclude any data not matching
// filters in a frame
const FRAME_FLAGS = {
  requireAll: true,
  explicit: true,
  omitGraph: true
};

export async function frame(document, frame, options) {
  return jsonld.frame(document, frame, {...options, ...FRAME_FLAGS});
}

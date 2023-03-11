/*!
 * Copyright (c) 2023 Digital Bazaar, Inc. All rights reserved.
*/
import * as mod from './modular.js';
// FIXME: abstract; perhaps just pass curve into accumulator and rely on
// interface always matching `@noble/curves`
import {p256} from '@noble/curves/p256';

const {CURVE, ProjectivePoint: Point, isWithinCurveOrder} = p256;

export class StaticAccumulator {
  constructor({accumulator, secret} = {}) {
    // pass existing accumulator value (for public use) OR secret (for
    // secret use), not both
    if(accumulator && secret) {
      throw new Error('Only one of "accumulator" or "secret" is allowed.');
    }
    // public use
    if(accumulator) {
      this.k = null;
      this.z = CURVE.fromBytes(accumulator);
    } else {
      // secret use, initialization of static accumulator only

      // FIXME: add helper function for safely generating secrets that avoid
      // bias by rejecting randoms that are not within the curve order

      // secret key is referred to as `k` in the literature
      this.k = CURVE.fp.fromBytes(secret);
      if(!isWithinCurveOrder(this.k)) {
        throw new Error('"secret" is not within curve order.');
      }

      // the accumulated value `z` refers to some point on an elliptic curve,
      // starting at curve base point `G` for an uninitialized accumulator
      this.z = Point.BASE;
    }
  }

  // FIXME: actually, consider instead of having an `add` function at all, just
  // pick a random point on the curve as `z` ... which should be fine since
  // it's a static accumulator, then just do independent subtractions from that
  // value to compute the witnesses for each separate value `y` as if those
  // values were added last

  // only to be used when initializing the accumulator since it's static
  add({value} = {}) {
    const {z, k} = this;
    if(k === null) {
      // invalid use
      throw new Error('Cannot initialize accumulator; no secret key set.');
    }

    // value to accumulate referred to as `y` in literature
    const y = modN(CURVE.Fp.fromBytes(value));

    // next accumulator value is called `z'`
    // z' = z ^ ((y + k) mod n)
    this.z = z.multiply(modN(y + k));
  }

  computeWitness({value} = {}) {
    const {z, k} = this;
    if(k === null) {
      // invalid use
      throw new Error('Cannot initialize accumulator; no secret key set.');
    }

    // value to accumulate referred to as `y` in literature
    const y = modN(CURVE.Fp.fromBytes(value));

    // FIXME: note, there is also mod.invertBatch() ... which could take in
    // multiple `y` values at once to speed up witness computation?

    // zi = z ^ ((y + k)^-1 mod n)
    const zi = z.multiply(invN(y + k));

    // represent `previous` and `witness` as compressed points in bytes
    const previous = zi.toRawBytes();
    const witness = zi.multiply(k).toRawBytes();
    return {previous, witness};
  }

  has({value, previous, witness} = {}) {
    const {z} = this;

    // value to verify accumulation of referred to as `y` in literature
    const y = CURVE.Fp.fromBytes(value);

    // convert `previous` and `witness` from compressed points as bytes
    const zi = CURVE.fromBytes(previous);
    const w = CURVE.fromBytes(witness);

    // if `z == zi ^ y + w`, then accumulator has `value`
    return z.equals(zi.multiply(y).add(w));
  }
}

function modN(a) {
  return mod.mod(a, CURVE.n);
}
function invN(a) {
  return mod.invert(a, CURVE.n);
}

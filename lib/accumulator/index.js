/*!
 * Copyright (c) 2023 Digital Bazaar, Inc. All rights reserved.
*/
// FIXME: abstract; perhaps just pass curve into accumulator and rely on
// interface always matching `@noble/curves`
import {p256} from '@noble/curves/p256';

const {CURVE, ProjectivePoint: Point} = p256;

// FIXME: this API may be able to initialize one value at a time via `add()`
//   if `computeWitness()` can be run after all values are added using inverse
//   of secret independently (w/o modifying accumulator) ... and still be
//   secure because accumulator is static?
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

      // secret key is referred to as `k` in the literature
      this.k = CURVE.fp.fromBytes(secret);

      // the accumulated value `z` refers to some point on an elliptic curve,
      // starting at curve base point `G` for an uninitialized accumulator
      this.z = Point.BASE;
    }
  }

  // only to be used when initializing the accumulator since it's static
  add({value} = {}) {
    const {z, k} = this;
    if(k === null) {
      // invalid use
      throw new Error('Cannot initialize accumulator; no secret key set.');
    }

    // value to accumulate referred to as `y` in literature
    const y = CURVE.Fp.fromBytes(value);

    // next accumulator value is called `z'`
    // z' = z ^ ((y + k) mod n)
    this.z = z.multiply(CURVE.Fp.add(y, k));
  }

  computeWitness({value} = {}) {
    const {z, k} = this;
    if(k === null) {
      // invalid use
      throw new Error('Cannot initialize accumulator; no secret key set.');
    }

    // value to accumulate referred to as `y` in literature
    const y = CURVE.Fp.fromBytes(value);

    // zi = z ^ ((y + k)^-1 mod n)
    const zi = z.multiply(CURVE.Fp.inv(y + k));

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

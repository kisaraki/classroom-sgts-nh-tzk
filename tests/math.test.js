import assert from "node:assert/strict";
import test from "node:test";

import {
  clamp,
  lerp,
  positiveModulo,
  safeRatio,
  smoothstep
} from "../js/utils/math.js";

test("math utilities clamp and interpolate finite values", () => {
  assert.equal(clamp(-2, 0, 1), 0);
  assert.equal(clamp(2, 0, 1), 1);
  assert.equal(lerp(10, 20, 0.25), 12.5);
  assert.equal(smoothstep(0, 10, 0), 0);
  assert.equal(smoothstep(0, 10, 5), 0.5);
  assert.equal(smoothstep(0, 10, 10), 1);
  assert.equal(safeRatio(12, 4), 3);
  assert.equal(safeRatio(12, 0, -1), -1);
  assert.equal(positiveModulo(-1, 360), 359);
});

test("math utilities reject invalid ranges", () => {
  assert.throws(() => clamp(1, 2, 0), /minimum must not exceed maximum/);
  assert.equal(smoothstep(1, 1, 1), 1);
  assert.throws(() => positiveModulo(1, 0), /divisor/);
});

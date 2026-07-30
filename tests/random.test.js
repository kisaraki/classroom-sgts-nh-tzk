import assert from "node:assert/strict";
import test from "node:test";

import {
  PRNG_ALGORITHM,
  PRNG_VERSION,
  SeededRandom,
  createFingerprint,
  createRandomStreams
} from "../js/utils/random.js";

test("seeded PRNG has a fixed version and repeatable sequence", () => {
  const first = new SeededRandom("repeatable");
  const second = new SeededRandom("repeatable");
  const firstSequence = Array.from({ length: 12 }, () => first.nextUint32());
  const secondSequence = Array.from({ length: 12 }, () => second.nextUint32());

  assert.equal(PRNG_ALGORITHM, "mulberry32");
  assert.equal(PRNG_VERSION, "mulberry32-v1");
  assert.deepEqual(firstSequence, secondSequence);
  assert.equal(first.snapshot().state, second.snapshot().state);
});

test("random substreams are isolated by purpose", () => {
  const baseline = createRandomStreams("substreams");
  const visualHeavy = createRandomStreams("substreams");

  for (let index = 0; index < 10_000; index += 1) {
    visualHeavy.visual.nextFloat();
  }

  assert.equal(
    baseline.intensity.nextUint32(),
    visualHeavy.intensity.nextUint32()
  );
  assert.equal(
    baseline.steering.nextUint32(),
    visualHeavy.steering.nextUint32()
  );
  assert.equal(
    baseline.environment.nextUint32(),
    visualHeavy.environment.nextUint32()
  );
});

test("fingerprints ignore object key insertion order", () => {
  assert.equal(
    createFingerprint({ beta: [2, 3], alpha: 1 }),
    createFingerprint({ alpha: 1, beta: [2, 3] })
  );
});

test("fingerprints normalize insignificant cross-platform float drift", () => {
  assert.equal(
    createFingerprint({ value: 1.234567891 }),
    createFingerprint({ value: 1.234567892 })
  );
  assert.notEqual(
    createFingerprint({ value: 1.23456789 }),
    createFingerprint({ value: 1.23456889 })
  );
  assert.equal(createFingerprint({ value: -0 }), createFingerprint({ value: 0 }));
});

import assert from "node:assert/strict";
import test from "node:test";

import { ParticleRenderer } from "../js/rendering/ParticleRenderer.js";

test("particle renderer supports deterministic Phase 9 profile sizes", () => {
  const renderer = new ParticleRenderer({ count: 300 });

  assert.equal(renderer.count, 300);
  renderer.setCount(700);
  assert.equal(renderer.count, 700);
  renderer.setCount(1200);
  assert.equal(renderer.count, 1200);
  assert.throws(() => renderer.setCount(2001), /0 to 2000/);
});

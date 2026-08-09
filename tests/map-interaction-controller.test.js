import assert from "node:assert/strict";
import test from "node:test";

import { wheelZoomFactor } from "../js/ui/MapInteractionController.js";

test("wheel zoom normalizes pixels, lines, pages, and extreme deltas", () => {
  assert.ok(wheelZoomFactor({ deltaY: -120 }) > 1);
  assert.ok(wheelZoomFactor({ deltaY: 120 }) < 1);
  assert.equal(wheelZoomFactor({ deltaY: -100_000 }), 1.25);
  assert.equal(wheelZoomFactor({ deltaY: 100_000 }), 0.8);
  assert.ok(wheelZoomFactor({ deltaMode: 1, deltaY: -3 }) > 1);
  assert.ok(
    wheelZoomFactor({ deltaMode: 2, deltaY: 1, pageHeight: 600 }) < 1
  );
});

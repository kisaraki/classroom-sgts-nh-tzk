import assert from "node:assert/strict";
import test from "node:test";

import {
  describeControlTrend,
  formatControlValue
} from "../js/ui/ControlPanel.js";

test("environment control readouts preserve units", () => {
  assert.equal(
    formatControlValue("subtropicalHighIntensity", 0.72),
    "72%"
  );
  assert.equal(
    formatControlValue("subtropicalHighWestwardExtent", 128),
    "128 °E"
  );
  assert.equal(formatControlValue("verticalWindShear", 7), "7 m/s");
});

test("environment control trends include a non-color text direction", () => {
  assert.equal(describeControlTrend(1), "↑ 上升");
  assert.equal(describeControlTrend(-1), "↓ 下降");
  assert.equal(describeControlTrend(0), "→ 穩定");
});

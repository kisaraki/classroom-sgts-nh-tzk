import assert from "node:assert/strict";
import test from "node:test";

import {
  FAILURE_METRICS,
  LEVELS,
  NAHA_STORM_LEVEL,
  OBJECTIVE_METRICS,
  validateLevel
} from "../js/data/levels.js";

const clone = (value) => JSON.parse(JSON.stringify(value));

test("Phase 6 exposes exactly one validated Naha level", () => {
  assert.equal(LEVELS.length, 1);
  assert.equal(NAHA_STORM_LEVEL.id, "naha-storm");
  assert.equal(NAHA_STORM_LEVEL.title, "那霸風雨");
  assert.equal(NAHA_STORM_LEVEL.historicalInspiration, "2018 潭美");
  assert.equal(NAHA_STORM_LEVEL.spawn.lat, 14);
  assert.equal(NAHA_STORM_LEVEL.spawn.lon, 145);
  assert.equal(NAHA_STORM_LEVEL.spawn.maxWind, 15);
  assert.equal(NAHA_STORM_LEVEL.spawn.centralPressure, 1005);
  assert.equal(NAHA_STORM_LEVEL.durationHours, 168);
  assert.equal(NAHA_STORM_LEVEL.objectives.length, 4);
  assert.equal(NAHA_STORM_LEVEL.failureConditions.length, 4);
  assert.match(NAHA_STORM_LEVEL.disclaimer, /非歷史重建/u);
});

test("level validation rejects unknown fields, metrics, and executable DSL", () => {
  const unknownField = clone(NAHA_STORM_LEVEL);
  unknownField.execute = "alert(1)";
  assert.throws(() => validateLevel(unknownField), /unknown fields/u);

  const unknownMetric = clone(NAHA_STORM_LEVEL);
  unknownMetric.objectives[0].metric = "javascript:alert(1)";
  assert.throws(() => validateLevel(unknownMetric), /must be one of/u);

  const executable = clone(NAHA_STORM_LEVEL);
  executable.objectives[0].predicate = "() => true";
  assert.throws(() => validateLevel(executable), /unknown fields/u);
  assert.equal(OBJECTIVE_METRICS.includes("eval"), false);
  assert.equal(FAILURE_METRICS.includes("Function"), false);
});

test("scoring and control definitions are complete and transparent", () => {
  const scoring = NAHA_STORM_LEVEL.scoring;

  assert.deepEqual(
    Object.keys(scoring.objectivePoints).sort(),
    NAHA_STORM_LEVEL.objectives.map((objective) => objective.id).sort()
  );
  assert.equal(
    NAHA_STORM_LEVEL.allowedControls.length,
    Object.keys(NAHA_STORM_LEVEL.environmentPreset).length
  );
  assert.equal(scoring.maximumTotal, 6250);
  assert.equal(scoring.rounding, "nearest");
});

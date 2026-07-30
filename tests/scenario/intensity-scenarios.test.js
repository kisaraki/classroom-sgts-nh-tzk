import assert from "node:assert/strict";
import test from "node:test";

import { SimulationClock } from "../../js/core/SimulationClock.js";
import { GridCell } from "../../js/model/GridCell.js";
import { Typhoon } from "../../js/model/Typhoon.js";
import { IntensityModel } from "../../js/simulation/IntensityModel.js";

const createStorm = (lat = 15) =>
  new Typhoon({
    active: true,
    centralPressure: 1004,
    galeRadius: 80,
    heading: 0,
    id: "scenario-storm",
    isOverLand: false,
    lat,
    lon: 135,
    maxWind: 15,
    moisture: 0.72,
    name: "SCENARIO",
    organization: 0.28,
    structureStage: "cluster",
    symmetry: 0.32,
    translationSpeed: 0
  });

const createCell = (lat = 15, overrides = {}) =>
  new GridCell({
    OHC: 0.82,
    SST: 29,
    coldWake: 0,
    landFraction: 0,
    lat,
    lon: 135,
    relativeHumidity: 0.78,
    steeringU: 0,
    steeringV: 0,
    surfacePressure: 1010,
    surfaceRoughness: 0.03,
    terrainHeight: 0,
    verticalWindShear: 6,
    ...overrides
  });

const simulate = ({
  cell,
  count = 216,
  seed = "phase-3-scenario",
  storm
}) => {
  const model = new IntensityModel({ seed });

  for (let stepIndex = 1; stepIndex <= count; stepIndex += 1) {
    model.step({
      cell,
      simulationMinutes: stepIndex * 10,
      stepIndex,
      stepMinutes: 10,
      typhoon: storm
    });
  }

  return storm;
};

test("1°N warm ocean and low shear does not rapidly mature", () => {
  const storm = simulate({
    cell: createCell(1),
    storm: createStorm(1)
  });

  assert.ok(storm.maxWind < 20);
  assert.notEqual(storm.structureStage, "eye");
  assert.ok(storm.organization < 0.2);
});

test("15°N warm ocean and low shear strengthens gradually", () => {
  const storm = createStorm(15);
  const cell = createCell(15);
  const afterSixHours = simulate({ cell, count: 36, storm });
  const sixHourWind = afterSixHours.maxWind;

  assert.ok(sixHourWind > 15);
  assert.ok(sixHourWind < 25);

  const afterThirtySixHours = simulate({
    cell,
    count: 180,
    seed: "continued-scenario",
    storm
  });
  assert.ok(afterThirtySixHours.maxWind > sixHourWind);
  assert.ok(afterThirtySixHours.maxWind < 50);
});

test("high vertical shear reduces symmetry", () => {
  const storm = simulate({
    cell: createCell(15, { verticalWindShear: 30 }),
    storm: createStorm(15)
  });

  assert.ok(storm.symmetry < 0.15);
  assert.notEqual(storm.structureStage, "eye");
});

test("low SST produces gradual weakening", () => {
  const storm = createStorm(15);
  const result = simulate({
    cell: createCell(15, { SST: 24 }),
    count: 72,
    storm
  });

  assert.ok(result.maxWind < 15);
  assert.ok(result.maxWind > 8);
});

const runAtFps = (fps) => {
  const storm = createStorm(15);
  const cell = createCell(15);
  const model = new IntensityModel({ seed: "fps-independent" });
  const clock = new SimulationClock();
  const frameDelta = 1000 / fps;
  let timestamp = 0;

  clock.resume();
  while (clock.stepIndex < 120) {
    timestamp += frameDelta;
    clock.advance(frameDelta, (step) => {
      model.step({ ...step, cell, typhoon: storm });
    });
  }

  return {
    fingerprint: model.fingerprint(storm),
    physics: storm.physicsSnapshot(),
    timestamp
  };
};

test("different FPS with the same fixed steps yields identical physics", () => {
  const at60 = runAtFps(60);
  const at120 = runAtFps(120);

  assert.deepEqual(at60.physics, at120.physics);
  assert.equal(at60.fingerprint, at120.fingerprint);
  assert.notEqual(at60.timestamp, at120.timestamp);
});

import assert from "node:assert/strict";
import test from "node:test";

import { createEnvironmentGrid } from "../js/model/Environment.js";
import { Typhoon } from "../js/model/Typhoon.js";
import { OceanCoolingModel } from "../js/simulation/OceanCoolingModel.js";
import { createRandomStreams } from "../js/utils/random.js";

const createStorm = (overrides = {}) =>
  new Typhoon({
    active: true,
    centralPressure: 950,
    eventHistory: [],
    galeRadius: 180,
    heading: 270,
    id: "wake-test",
    isOverLand: false,
    lat: 18,
    lon: 135,
    maxWind: 50,
    moisture: 0.8,
    name: "WAKE TEST",
    organization: 0.8,
    structureStage: "eye",
    symmetry: 0.8,
    trackHistory: [],
    translationSpeed: 3,
    ...overrides
  });

const createEnvironment = (seed) =>
  createEnvironmentGrid({
    random: createRandomStreams(seed).environment
  });

test("slow strong storms produce a larger cold wake than fast weak storms", () => {
  const strongEnvironment = createEnvironment("wake-strong");
  const weakEnvironment = createEnvironment("wake-weak");
  const strong = createStorm();
  const weak = createStorm({
    id: "wake-weak",
    maxWind: 18,
    structureStage: "spiral",
    translationSpeed: 35
  });
  const strongModel = new OceanCoolingModel();
  const weakModel = new OceanCoolingModel();
  let strongResult;
  let weakResult;

  for (let index = 0; index < 72; index += 1) {
    strongResult = strongModel.step({
      environment: strongEnvironment,
      stepMinutes: 10,
      typhoon: strong
    });
    weakResult = weakModel.step({
      environment: weakEnvironment,
      stepMinutes: 10,
      typhoon: weak
    });
  }

  assert.ok(strongResult.maximumColdWake > weakResult.maximumColdWake * 8);
  assert.ok(strongResult.maximumColdWake > 0.5);
  assert.ok(strongResult.affectedCellCount > 0);
  assert.ok(strongResult.coverageRadiusKm >= strong.galeRadius);
});

test("cold wake recovers gradually and reset clears every grid cell", () => {
  const environment = createEnvironment("wake-recovery");
  const typhoon = createStorm();
  const model = new OceanCoolingModel();

  for (let index = 0; index < 36; index += 1) {
    model.step({ environment, stepMinutes: 10, typhoon });
  }

  const before = Math.max(...environment.cells.map((cell) => cell.coldWake));
  typhoon.active = false;
  const recovered = model.step({
    environment,
    stepMinutes: 1440,
    typhoon
  });

  assert.ok(recovered.maximumColdWake < before);
  assert.ok(recovered.maximumColdWake > 0);

  model.reset(environment);
  assert.equal(
    environment.cells.every((cell) => cell.coldWake === 0),
    true
  );
});

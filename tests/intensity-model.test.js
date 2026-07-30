import assert from "node:assert/strict";
import test from "node:test";

import { PROJECT_CONFIG } from "../js/config.js";
import { Environment } from "../js/model/Environment.js";
import { GridCell } from "../js/model/GridCell.js";
import { Typhoon } from "../js/model/Typhoon.js";
import { ParticleRenderer } from "../js/rendering/ParticleRenderer.js";
import {
  IntensityModel,
  mapWindToPressure,
  resolveStructureStage
} from "../js/simulation/IntensityModel.js";
import { createRandomStreams } from "../js/utils/random.js";

const createTyphoon = (overrides = {}) =>
  new Typhoon({
    active: true,
    centralPressure: 1004,
    eventHistory: [],
    galeRadius: 80,
    heading: 0,
    id: "test-storm",
    isOverLand: false,
    lat: 15,
    lon: 135,
    maxWind: 15,
    moisture: 0.72,
    name: "TEST",
    organization: 0.28,
    structureStage: "cluster",
    symmetry: 0.32,
    trackHistory: [],
    translationSpeed: 0,
    ...overrides
  });

const createCell = (overrides = {}) =>
  new GridCell({
    OHC: 0.82,
    SST: 29,
    coldWake: 0,
    landFraction: 0,
    lat: 15,
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

const runSteps = ({
  cell = createCell(),
  count = 144,
  seed = "scenario",
  typhoon = createTyphoon()
} = {}) => {
  const model = new IntensityModel({ seed });

  for (let stepIndex = 1; stepIndex <= count; stepIndex += 1) {
    model.step({
      cell,
      simulationMinutes: stepIndex * 10,
      stepIndex,
      stepMinutes: 10,
      typhoon
    });
  }

  return { model, typhoon };
};

test("Typhoon contains complete mutable physics fields and bounded histories", () => {
  const typhoon = createTyphoon();

  typhoon.recordTrack({ simulationMinutes: 0, stepIndex: 0 });
  typhoon.recordEvent({
    simulationMinutes: 10,
    stepIndex: 1,
    type: "test"
  });

  assert.deepEqual(
    Object.keys(typhoon.physicsSnapshot()).sort(),
    [
      "active",
      "centralPressure",
      "galeRadius",
      "heading",
      "id",
      "isOverLand",
      "lat",
      "lon",
      "maxWind",
      "moisture",
      "name",
      "organization",
      "structureStage",
      "symmetry",
      "translationSpeed"
    ]
  );
  assert.equal(typhoon.trackHistory.length, 1);
  assert.equal(typhoon.eventHistory.length, 1);
  assert.throws(
    () => createTyphoon({ unexpectedField: true }),
    /unknown fields/u
  );
});

test("GridCell and Environment expose the Phase 3 environmental contract", () => {
  const cell = createCell();
  const environment = new Environment({ cells: [cell] });

  assert.equal(environment.cells[0], cell);
  assert.equal(environment.gridResolution, 1);
  assert.deepEqual(
    Object.keys(cell.snapshot()).sort(),
    [
      "OHC",
      "SST",
      "coldWake",
      "landFraction",
      "lat",
      "lon",
      "relativeHumidity",
      "steeringU",
      "steeringV",
      "surfacePressure",
      "surfaceRoughness",
      "terrainHeight",
      "verticalWindShear"
    ]
  );
  assert.throws(
    () => createCell({ relativeHumidity: 1.1 }),
    /relativeHumidity/u
  );
  assert.throws(() => createCell({ unexpectedField: true }), /unknown fields/u);
  assert.throws(
    () => new Environment({ cells: [cell], unexpectedField: true }),
    /unknown fields/u
  );
});

test("wind and game-like pressure mapping remain within model bounds", () => {
  const parameters = PROJECT_CONFIG.modelParameters;

  assert.equal(
    mapWindToPressure(parameters.minimumWind, 0),
    parameters.pressureMaximum
  );
  assert.equal(
    mapWindToPressure(parameters.maximumWind, 1),
    parameters.pressureMinimum
  );

  const { typhoon } = runSteps({ count: 3_000 });
  assert.ok(typhoon.maxWind >= parameters.minimumWind);
  assert.ok(typhoon.maxWind <= parameters.maximumWind);
  assert.ok(typhoon.centralPressure >= parameters.pressureMinimum);
  assert.ok(typhoon.centralPressure <= parameters.pressureMaximum);
  assert.ok(typhoon.galeRadius >= parameters.galeRadiusMinimum);
  assert.ok(typhoon.galeRadius <= parameters.galeRadiusMaximum);
});

test("same model version, seed and action sequence yield the same fingerprint", () => {
  const first = runSteps({ count: 240, seed: "fingerprint-seed" });
  const second = runSteps({ count: 240, seed: "fingerprint-seed" });

  assert.deepEqual(
    first.typhoon.physicsSnapshot(),
    second.typhoon.physicsSnapshot()
  );
  assert.equal(
    first.model.fingerprint(first.typhoon),
    second.model.fingerprint(second.typhoon)
  );
});

test("visual particles can be disabled or consumed without changing physics", () => {
  const streamsWithParticles = createRandomStreams("visual-isolation");
  const streamsWithoutParticles = createRandomStreams("visual-isolation");
  const renderer = new ParticleRenderer({
    enabled: true,
    random: streamsWithParticles.visual
  });
  const enabledStorm = createTyphoon();
  const disabledStorm = createTyphoon();
  const enabledModel = new IntensityModel({
    randomStreams: streamsWithParticles,
    seed: "visual-isolation"
  });
  const disabledModel = new IntensityModel({
    randomStreams: streamsWithoutParticles,
    seed: "visual-isolation"
  });
  const cell = createCell();

  renderer.setEnabled(false);
  assert.equal(renderer.enabled, false);

  for (let stepIndex = 1; stepIndex <= 180; stepIndex += 1) {
    enabledModel.step({
      cell,
      stepIndex,
      stepMinutes: 10,
      typhoon: enabledStorm
    });
    disabledModel.step({
      cell,
      stepIndex,
      stepMinutes: 10,
      typhoon: disabledStorm
    });
  }

  assert.deepEqual(
    enabledStorm.physicsSnapshot(),
    disabledStorm.physicsSnapshot()
  );
  assert.equal(
    enabledModel.fingerprint(enabledStorm),
    disabledModel.fingerprint(disabledStorm)
  );
});

test("structure hysteresis prevents threshold thrashing", () => {
  let stage = "spiral";

  stage = resolveStructureStage({
    currentStage: stage,
    developmentPotential: 0.6,
    maxWind: 25,
    organization: 0.53,
    symmetry: 0.5
  });
  assert.equal(stage, "comma");

  for (const organization of [0.51, 0.53, 0.49, 0.52, 0.5]) {
    stage = resolveStructureStage({
      currentStage: stage,
      developmentPotential: 0.6,
      maxWind: 25,
      organization,
      symmetry: 0.5
    });
    assert.equal(stage, "comma");
  }

  stage = resolveStructureStage({
    currentStage: stage,
    developmentPotential: 0.4,
    maxWind: 23,
    organization: 0.41,
    symmetry: 0.34
  });
  assert.equal(stage, "spiral");
});

import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { validateMapData } from "../../js/data/geography.js";
import { createEnvironmentGrid } from "../../js/model/Environment.js";
import { GridCell } from "../../js/model/GridCell.js";
import { Typhoon } from "../../js/model/Typhoon.js";
import { LandInteractionModel } from "../../js/simulation/LandInteractionModel.js";
import { OceanCoolingModel } from "../../js/simulation/OceanCoolingModel.js";
import { RainfallModel } from "../../js/simulation/RainfallModel.js";
import { createRandomStreams } from "../../js/utils/random.js";

const TEST_DIRECTORY = path.dirname(fileURLToPath(import.meta.url));
const MAP_PATH = path.join(
  TEST_DIRECTORY,
  "../../assets/maps/northwest-pacific.json"
);
const loadMap = async () =>
  validateMapData(JSON.parse(await readFile(MAP_PATH, "utf8")));

const createStorm = (overrides = {}) =>
  new Typhoon({
    active: true,
    centralPressure: 950,
    eventHistory: [],
    galeRadius: 180,
    heading: 270,
    id: "phase-5-scenario",
    isOverLand: false,
    lat: 23.7,
    lon: 121,
    maxWind: 50,
    moisture: 0.82,
    name: "PHASE 5",
    organization: 0.82,
    structureStage: "eye",
    symmetry: 0.8,
    trackHistory: [],
    translationSpeed: 3,
    ...overrides
  });

test("12-hour slow strong storm wake exceeds fast weak storm by eightfold", () => {
  const environmentFor = (seed) =>
    createEnvironmentGrid({
      random: createRandomStreams(seed).environment
    });
  const strongEnvironment = environmentFor("scenario-strong-wake");
  const weakEnvironment = environmentFor("scenario-weak-wake");
  const strong = createStorm({ lat: 18, lon: 135 });
  const weak = createStorm({
    id: "phase-5-weak",
    lat: 18,
    lon: 135,
    maxWind: 18,
    structureStage: "spiral",
    translationSpeed: 35
  });
  const strongModel = new OceanCoolingModel();
  const weakModel = new OceanCoolingModel();
  let strongWake;
  let weakWake;

  for (let stepIndex = 1; stepIndex <= 72; stepIndex += 1) {
    strongWake = strongModel.step({
      environment: strongEnvironment,
      stepMinutes: 10,
      typhoon: strong
    });
    weakWake = weakModel.step({
      environment: weakEnvironment,
      stepMinutes: 10,
      typhoon: weak
    });
  }

  assert.ok(strongWake.maximumColdWake > 0.5);
  assert.ok(strongWake.maximumColdWake > weakWake.maximumColdWake * 8);
});

test("three hours over the Central Mountain Range causes quantified damage", async () => {
  const mapData = await loadMap();
  const mountainStorm = createStorm();
  const oceanStorm = createStorm({ id: "phase-5-ocean", lon: 123 });
  const mountainModel = new LandInteractionModel();
  const oceanModel = new LandInteractionModel();

  mountainModel.step({
    mapData,
    pathPoints: [{ lat: 23.7, lon: 121 }],
    simulationMinutes: 180,
    stepIndex: 1,
    stepMinutes: 180,
    typhoon: mountainStorm
  });
  oceanModel.step({
    mapData,
    pathPoints: [{ lat: 23.7, lon: 123 }],
    simulationMinutes: 180,
    stepIndex: 1,
    stepMinutes: 180,
    typhoon: oceanStorm
  });

  assert.ok(oceanStorm.maxWind - mountainStorm.maxWind > 2);
  assert.ok(oceanStorm.organization - mountainStorm.organization > 0.1);
  assert.ok(oceanStorm.symmetry - mountainStorm.symmetry > 0.15);
});

test("easterly low-level flow produces more rain west of the ridge than east", async () => {
  const mapData = await loadMap();
  const rainfall = new RainfallModel();
  const environment = {
    southwestMonsoon: { intensity: 0.5 }
  };
  const typhoon = createStorm({ lon: 121 });
  const cell = new GridCell({
    OHC: 0.82,
    SST: 29,
    coldWake: 0,
    landFraction: 1,
    lat: 23.7,
    lon: 121,
    relativeHumidity: 0.88,
    steeringU: 8,
    steeringV: 1,
    surfacePressure: 1005,
    surfaceRoughness: 0.8,
    terrainHeight: 2600,
    verticalWindShear: 6
  });
  const west = rainfall.calculate({
    cell,
    environment,
    mapData,
    station: { lat: 23.7, lon: 120.9 },
    typhoon
  });
  const east = rainfall.calculate({
    cell,
    environment,
    mapData,
    station: { lat: 23.7, lon: 121.1 },
    typhoon
  });

  assert.ok(west.terrainLiftFactor > 1.5);
  assert.ok(east.terrainLiftFactor < 0.7);
  assert.ok(west.hourlyRainRate > east.hourlyRainRate * 2);
});

test("sea re-entry starts a nine-hour gradual reorganization delay", async () => {
  const mapData = await loadMap();
  const typhoon = createStorm();
  const model = new LandInteractionModel();

  model.step({
    mapData,
    pathPoints: [{ lat: 23.7, lon: 121 }],
    simulationMinutes: 60,
    stepIndex: 1,
    stepMinutes: 60,
    typhoon
  });
  const immediate = model.step({
    mapData,
    pathPoints: [{ lat: 23.7, lon: 123 }],
    simulationMinutes: 70,
    stepIndex: 2,
    stepMinutes: 10,
    typhoon
  });
  const recovered = model.step({
    mapData,
    pathPoints: [{ lat: 23.7, lon: 123 }],
    simulationMinutes: 610,
    stepIndex: 3,
    stepMinutes: 540,
    typhoon
  });

  assert.ok(immediate.reorganizationFactor < 0.4);
  assert.equal(recovered.reorganizationFactor, 1);
});

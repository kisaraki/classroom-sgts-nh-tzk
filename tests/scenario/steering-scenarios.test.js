import assert from "node:assert/strict";
import test from "node:test";

import { createEnvironmentGrid } from "../../js/model/Environment.js";
import { Typhoon } from "../../js/model/Typhoon.js";
import { SteeringModel } from "../../js/simulation/SteeringModel.js";
import { createRandomStreams } from "../../js/utils/random.js";

const createStorm = () =>
  new Typhoon({
    active: true,
    centralPressure: 1000,
    galeRadius: 90,
    heading: 285,
    id: "steering-scenario",
    isOverLand: false,
    lat: 15,
    lon: 135,
    maxWind: 20,
    moisture: 0.7,
    name: "SCENARIO",
    organization: 0.4,
    structureStage: "spiral",
    symmetry: 0.4,
    translationSpeed: 8
  });

const simulate = (controls, count = 288) => {
  const seed = "phase-4-scenario";
  const streams = createRandomStreams(seed);
  const environment = createEnvironmentGrid({
    controls,
    random: streams.environment,
    targetControls: controls
  });
  const typhoon = createStorm();
  const model = new SteeringModel({ random: streams.steering, seed });
  let diagnostic;

  for (let stepIndex = 1; stepIndex <= count; stepIndex += 1) {
    environment.update(10);
    diagnostic = model.step({
      cell: environment.sampleAt(typhoon),
      environment,
      stepMinutes: 10,
      typhoon
    });
  }

  return {
    cell: environment.sampleAt(typhoon),
    diagnostic,
    typhoon
  };
};

test("strong westward subtropical high drives a quantified westward track", () => {
  const result = simulate({
    subtropicalHighIntensity: 1,
    subtropicalHighWestwardExtent: 112,
    southwestMonsoonIntensity: 0.15
  });

  assert.ok(result.typhoon.lon < 126);
  assert.ok(result.diagnostic.actualVector.u < -5);
  assert.ok(result.typhoon.translationSpeed <= 45);
});

test("eastward-retreated subtropical high permits poleward recurvature", () => {
  const result = simulate({
    subtropicalHighIntensity: 0.65,
    subtropicalHighWestwardExtent: 150,
    southwestMonsoonIntensity: 0.38
  });

  assert.ok(result.typhoon.lat > 18);
  assert.ok(result.typhoon.lon > 135);
  assert.ok(result.diagnostic.actualVector.u > 0);
  assert.ok(result.diagnostic.actualVector.v > 2);
});

test("strong southwest monsoon increases northeast flow and moisture", () => {
  const baseline = simulate({
    subtropicalHighIntensity: 0.3,
    subtropicalHighWestwardExtent: 145,
    southwestMonsoonIntensity: 0.1,
    southwestMonsoonMoisture: 0.6
  });
  const strong = simulate({
    subtropicalHighIntensity: 0.3,
    subtropicalHighWestwardExtent: 145,
    southwestMonsoonIntensity: 1,
    southwestMonsoonMoisture: 0.95
  });

  assert.ok(
    strong.diagnostic.actualVector.u >
      baseline.diagnostic.actualVector.u + 2
  );
  assert.ok(
    strong.diagnostic.actualVector.v >
      baseline.diagnostic.actualVector.v + 2
  );
  assert.ok(strong.cell.relativeHumidity > baseline.cell.relativeHumidity + 0.1);
  assert.ok(strong.typhoon.lat > baseline.typhoon.lat);
  assert.ok(strong.typhoon.lon > baseline.typhoon.lon);
});

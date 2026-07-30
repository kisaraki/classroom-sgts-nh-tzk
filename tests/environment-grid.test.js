import assert from "node:assert/strict";
import test from "node:test";

import { PROJECT_CONFIG } from "../js/config.js";
import {
  calculateEnvironmentField,
  createEnvironmentGrid
} from "../js/model/Environment.js";
import { createRandomStreams } from "../js/utils/random.js";

const createGrid = (overrides = {}) => {
  const streams = createRandomStreams("environment-grid-test");
  return createEnvironmentGrid({
    random: streams.environment,
    ...overrides
  });
};

test("one-degree environment grid covers every inclusive map coordinate", () => {
  const environment = createGrid({
    isLandAt: ({ lat, lon }) => lat === 23 && lon === 121
  });
  const { bounds } = PROJECT_CONFIG.geography;
  const expectedCount =
    (bounds.maxLat - bounds.minLat + 1) *
    (bounds.maxLon - bounds.minLon + 1);
  const coordinates = new Set(
    environment.cells.map((cell) => `${cell.lat}:${cell.lon}`)
  );

  assert.equal(environment.gridResolution, 1);
  assert.equal(environment.cells.length, expectedCount);
  assert.equal(coordinates.size, expectedCount);
  assert.equal(environment.sampleAt({ lat: 23, lon: 121 }).landFraction, 1);
  assert.equal(environment.sampleAt({ lat: 23, lon: 122 }).landFraction, 0);
});

test("grid sampling bilinearly interpolates every required environmental field", () => {
  const environment = createGrid();
  const sample = environment.sampleAt({ lat: 15.5, lon: 135.5 });

  assert.equal(sample.lat, 15.5);
  assert.equal(sample.lon, 135.5);
  assert.ok(sample.SST >= 24 && sample.SST <= 30);
  assert.ok(sample.OHC >= 0.25 && sample.OHC <= 1);
  assert.ok(Number.isFinite(sample.surfacePressure));
  assert.ok(Number.isFinite(sample.steeringU));
  assert.ok(Number.isFinite(sample.steeringV));
  assert.ok(sample.relativeHumidity >= 0 && sample.relativeHumidity <= 1);
  assert.ok(sample.surfaceRoughness >= 0 && sample.surfaceRoughness <= 1);
});

test("target controls respond gradually and expose actual, target and trend", () => {
  const environment = createGrid();
  const initial = environment.getControlState("subtropicalHighIntensity");

  environment.setTargetControl("subtropicalHighIntensity", 1);
  const beforeStep = environment.getControlState(
    "subtropicalHighIntensity"
  );
  environment.update(10);
  const afterStep = environment.getControlState("subtropicalHighIntensity");

  assert.equal(initial.actual, initial.target);
  assert.equal(beforeStep.actual, initial.actual);
  assert.equal(beforeStep.target, 1);
  assert.equal(beforeStep.trend, 1);
  assert.ok(afterStep.actual > initial.actual);
  assert.ok(afterStep.actual < 1);
  assert.equal(afterStep.responseHours, 12);
});

test("strong westward subtropical high produces more westward flow than retreat", () => {
  const point = { lat: 15, lon: 135 };
  const strongWest = calculateEnvironmentField(point, {
    ...Object.fromEntries(
      Object.entries(PROJECT_CONFIG.environmentControls).map(
        ([name, definition]) => [name, definition.defaultValue]
      )
    ),
    subtropicalHighIntensity: 1,
    subtropicalHighWestwardExtent: 112
  });
  const retreat = calculateEnvironmentField(point, {
    ...Object.fromEntries(
      Object.entries(PROJECT_CONFIG.environmentControls).map(
        ([name, definition]) => [name, definition.defaultValue]
      )
    ),
    subtropicalHighIntensity: 0.65,
    subtropicalHighWestwardExtent: 150
  });

  assert.ok(strongWest.steeringU < -4);
  assert.ok(retreat.steeringU > strongWest.steeringU + 4);
  assert.ok(retreat.steeringV > strongWest.steeringV);
});

test("environment controls reject unknown and out-of-range targets", () => {
  const environment = createGrid();

  assert.throws(
    () => environment.setTargetControl("stormLatitude", 20),
    /Unknown environment control/u
  );
  assert.throws(
    () => environment.setTargetControl("verticalWindShear", 31),
    /between 0 and 30/u
  );
});

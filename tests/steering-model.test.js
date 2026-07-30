import assert from "node:assert/strict";
import test from "node:test";

import { PROJECT_CONFIG } from "../js/config.js";
import { createEnvironmentGrid } from "../js/model/Environment.js";
import { GridCell } from "../js/model/GridCell.js";
import { Typhoon } from "../js/model/Typhoon.js";
import { vectorToCanvasDelta } from "../js/rendering/FieldRenderer.js";
import {
  SteeringModel,
  findCrossedLandRegions,
  headingFromVector,
  subdivideMovementPath
} from "../js/simulation/SteeringModel.js";
import { createRandomStreams } from "../js/utils/random.js";

const createTyphoon = () =>
  new Typhoon({
    active: true,
    centralPressure: 1000,
    galeRadius: 90,
    heading: 285,
    id: "steering-test",
    isOverLand: false,
    lat: 15,
    lon: 135,
    maxWind: 20,
    moisture: 0.7,
    name: "STEERING",
    organization: 0.4,
    structureStage: "spiral",
    symmetry: 0.4,
    translationSpeed: 8
  });

const createModelSession = (seed = "steering-model-test") => {
  const streams = createRandomStreams(seed);
  const environment = createEnvironmentGrid({
    random: streams.environment
  });

  return {
    environment,
    model: new SteeringModel({ random: streams.steering, seed }),
    typhoon: createTyphoon()
  };
};

test("steering model keeps U east-positive and V north-positive", () => {
  const session = createModelSession();
  session.environment.setTargetControls({
    subtropicalHighIntensity: 0,
    southwestMonsoonIntensity: 1
  });

  for (let index = 0; index < 180; index += 1) {
    session.environment.update(10);
  }

  const cell = session.environment.sampleAt(session.typhoon);
  const result = session.model.step({
    cell,
    environment: session.environment,
    stepMinutes: 10,
    typhoon: session.typhoon
  });

  assert.ok(result.components.environment.u > 0);
  assert.ok(result.components.environment.v > 0);
  assert.ok(result.targetVector.u > 0);
  assert.ok(result.targetVector.v > 0);
  assert.ok(
    headingFromVector(result.targetVector.u, result.targetVector.v) > 0 &&
      headingFromVector(result.targetVector.u, result.targetVector.v) < 90
  );
  assert.ok(result.heading > 270);
});

test("weak environmental flow still contains small northwest beta drift", () => {
  const session = createModelSession();
  const cell = new GridCell({
    OHC: 0.8,
    SST: 29,
    coldWake: 0,
    landFraction: 0,
    lat: 15,
    lon: 135,
    relativeHumidity: 0.75,
    steeringU: 0,
    steeringV: 0,
    surfacePressure: 1010,
    surfaceRoughness: 0.03,
    terrainHeight: 0,
    verticalWindShear: 6
  });
  const result = session.model.step({
    cell,
    environment: session.environment,
    stepMinutes: 10,
    typhoon: session.typhoon
  });

  assert.equal(
    result.components.betaDrift.u,
    PROJECT_CONFIG.steeringConfig.betaDriftU
  );
  assert.equal(
    result.components.betaDrift.v,
    PROJECT_CONFIG.steeringConfig.betaDriftV
  );
  assert.ok(result.components.betaDrift.u < 0);
  assert.ok(result.components.betaDrift.v > 0);
});

test("movement speed is capped and converted into bounded geographic segments", () => {
  const session = createModelSession();
  const extremeCell = new GridCell({
    OHC: 0.8,
    SST: 29,
    coldWake: 0,
    landFraction: 0,
    lat: 15,
    lon: 135,
    relativeHumidity: 0.75,
    steeringU: 100,
    steeringV: 100,
    surfacePressure: 1010,
    surfaceRoughness: 0.03,
    terrainHeight: 0,
    verticalWindShear: 6
  });
  const result = session.model.step({
    cell: extremeCell,
    environment: session.environment,
    stepMinutes: 180,
    typhoon: session.typhoon
  });

  assert.equal(
    result.speedKmh,
    PROJECT_CONFIG.steeringConfig.maximumTranslationSpeedKmh
  );
  assert.ok(
    result.pathPoints.length >
      result.distanceKm /
        PROJECT_CONFIG.steeringConfig.maximumPathSegmentKm
  );
  assert.ok(session.typhoon.lat <= PROJECT_CONFIG.geography.bounds.maxLat);
  assert.ok(session.typhoon.lon <= PROJECT_CONFIG.geography.bounds.maxLon);
});

test("subdivided path cannot skip a narrow synthetic island", () => {
  const points = subdivideMovementPath(
    { lat: 15, lon: 134.8 },
    45,
    90,
    3
  );
  const mapData = {
    features: [
      {
        geometry: {
          coordinates: [
            [
              [135, 14.9],
              [135, 15.1],
              [135.02, 15.1],
              [135.02, 14.9],
              [135, 14.9]
            ]
          ]
        },
        properties: { regionId: "narrow-island" }
      }
    ]
  };

  assert.ok(points.length > 10);
  assert.deepEqual(findCrossedLandRegions(points, mapData), [
    "narrow-island"
  ]);
});

test("rendered vector delta preserves the computed vector direction", () => {
  const vector = { u: 2, v: 1 };
  const delta = vectorToCanvasDelta(vector, 3);

  assert.equal(delta.x, 6);
  assert.equal(delta.y, -3);
  assert.equal(headingFromVector(vector.u, vector.v), 63.434948822922024);
});

test("same seed and scheduled controls produce the same path fingerprint", () => {
  const run = () => {
    const session = createModelSession("scheduled-path");
    const path = [];

    for (let stepIndex = 1; stepIndex <= 180; stepIndex += 1) {
      if (stepIndex === 36) {
        session.environment.setTargetControls({
          subtropicalHighWestwardExtent: 150,
          southwestMonsoonIntensity: 0.8
        });
      }

      session.environment.update(10);
      const result = session.model.step({
        cell: session.environment.sampleAt(session.typhoon),
        environment: session.environment,
        stepMinutes: 10,
        typhoon: session.typhoon
      });
      path.push([result.end.lat, result.end.lon]);
    }

    return {
      fingerprint: session.model.fingerprint(session.typhoon),
      path
    };
  };
  const first = run();
  const second = run();

  assert.deepEqual(first.path, second.path);
  assert.equal(first.fingerprint, second.fingerprint);
});

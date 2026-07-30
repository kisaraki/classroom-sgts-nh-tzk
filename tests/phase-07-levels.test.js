import assert from "node:assert/strict";
import test from "node:test";

import { ObjectiveEvaluator } from "../js/core/ObjectiveEvaluator.js";
import {
  MOUNTAIN_SHIELD_LEVEL,
  NAHA_STORM_LEVEL,
  WAYNE_THREE_ENTRIES_LEVEL
} from "../js/data/levels.js";
import { LevelState } from "../js/model/LevelState.js";

const surfaceEvent = (type, coastSide, stepIndex) => ({
  centralPressure: 960,
  coastSide,
  galeRadius: 150,
  heading: 270,
  lat: 23.7,
  lon: 121,
  maxWind: 42,
  regionId: "taiwan-main",
  simulationMinutes: stepIndex * 10,
  stepIndex,
  translationSpeed: 12,
  type
});

const createSyntheticDriver = (level) => {
  const levelState = new LevelState(level);
  const evaluator = new ObjectiveEvaluator();
  let accumulatedRain = 0;
  let stepIndex = 0;

  const advance = ({
    coastSide = null,
    gust = 36,
    inside,
    rainDelta = 5,
    surfaceType = null,
    terrainZone = "ocean",
    wind = 32
  }) => {
    stepIndex += 1;
    accumulatedRain += rainDelta;
    const typhoon = {
      centralPressure: 970,
      lat: inside ? 23.7 : 10,
      lon: inside ? 120.95 : 110,
      maxWind: wind
    };
    const observations = ["taichung", "sun-moon-lake"].map((id) => ({
      distanceKm: inside ? 50 : 1500,
      station: {
        accumulatedRain,
        gust,
        id,
        name: id,
        sustainedWind: gust / 1.4
      }
    }));
    const landDiagnostic = {
      events:
        surfaceType === null
          ? []
          : [surfaceEvent(surfaceType, coastSide, stepIndex)],
      intervals: [{ terrain: { zone: terrainZone } }]
    };
    const steeringDiagnostic = {
      boundaryReached: false,
      crossedLandRegions: [],
      distanceKm: 10
    };
    const simulationMinutes = stepIndex * 10;
    levelState.recordStep({
      landDiagnostic,
      observations,
      oceanDiagnostic: { maximumColdWake: 0 },
      simulationMinutes,
      steeringDiagnostic,
      stepIndex,
      typhoon
    });
    const context = {
      enteredRegions: [],
      inlandDepths: {},
      observations,
      simulationMinutes,
      steeringDiagnostic,
      stepIndex,
      typhoon
    };

    return evaluator.evaluate({ context, levelState });
  };

  const repeat = (count, options) => {
    let result = null;

    for (let index = 0; index < count; index += 1) {
      result = advance(options);
    }

    return result;
  };

  return { advance, levelState, repeat };
};

test("west-coast landfall and a route without the Central Mountains do not satisfy Mountain Shield", () => {
  const driver = createSyntheticDriver(MOUNTAIN_SHIELD_LEVEL);
  driver.advance({
    coastSide: "west",
    gust: 50,
    inside: true,
    rainDelta: 700,
    surfaceType: "LANDFALL",
    terrainZone: "west-plain",
    wind: 52
  });
  const objectives = Object.fromEntries(
    driver.levelState.objectivesSnapshot().map((objective) => [
      objective.id,
      objective
    ])
  );

  assert.notEqual(objectives["east-landfall"].status, "completed");
  assert.notEqual(
    objectives["central-mountain-crossing"].status,
    "completed"
  );
});

test("warning-zone boundary jitter and a short exit cannot create a duplicate entry", () => {
  const driver = createSyntheticDriver(WAYNE_THREE_ENTRIES_LEVEL);
  driver.repeat(36, { inside: false, rainDelta: 0 });
  driver.repeat(18, { inside: true });
  assert.equal(
    driver.levelState.statisticsSnapshot().warningZones["taiwan-warning"]
      .entryCount,
    1
  );

  driver.repeat(10, { inside: false, rainDelta: 0 });
  driver.repeat(18, { inside: true });
  assert.equal(
    driver.levelState.statisticsSnapshot().warningZones["taiwan-warning"]
      .entryCount,
    1
  );

  driver.repeat(36, { inside: false, rainDelta: 0 });
  driver.repeat(18, { inside: true });
  assert.equal(
    driver.levelState.statisticsSnapshot().warningZones["taiwan-warning"]
      .entryCount,
    2
  );
});

test("Wayne victory is possible only after the third valid entry and two landfalls", () => {
  const driver = createSyntheticDriver(WAYNE_THREE_ENTRIES_LEVEL);
  driver.repeat(36, { inside: false, rainDelta: 0 });
  driver.advance({
    coastSide: "south",
    inside: true,
    surfaceType: "LANDFALL"
  });
  driver.repeat(17, { inside: true });
  driver.repeat(36, { inside: false, rainDelta: 0 });
  driver.advance({
    coastSide: "east",
    inside: true,
    surfaceType: "LANDFALL"
  });
  let result = driver.repeat(17, { inside: true });
  assert.equal(result.allRequiredCompleted, false);
  assert.equal(
    driver.levelState.statisticsSnapshot().warningZones["taiwan-warning"]
      .entryCount,
    2
  );

  driver.repeat(36, { inside: false, rainDelta: 0 });
  result = driver.repeat(18, { inside: true });
  assert.equal(
    driver.levelState.statisticsSnapshot().warningZones["taiwan-warning"]
      .entryCount,
    3
  );
  assert.equal(result.allRequiredCompleted, true);
});

test("three entries with only one Taiwan landfall still cannot win", () => {
  const driver = createSyntheticDriver(WAYNE_THREE_ENTRIES_LEVEL);
  driver.repeat(36, { inside: false, rainDelta: 0 });
  driver.advance({
    coastSide: "south",
    inside: true,
    surfaceType: "LANDFALL"
  });
  driver.repeat(17, { inside: true });

  for (let entry = 2; entry <= 3; entry += 1) {
    driver.repeat(36, { inside: false, rainDelta: 0 });
    driver.repeat(18, { inside: true });
  }

  const result = driver.advance({ inside: true });
  const landfalls = driver.levelState
    .objectivesSnapshot()
    .find((objective) => objective.id === "two-taiwan-landfalls");
  assert.notEqual(landfalls.status, "completed");
  assert.equal(result.allRequiredCompleted, false);
});

test("switching levels creates isolated objective, warning, and event state", () => {
  const wayne = createSyntheticDriver(WAYNE_THREE_ENTRIES_LEVEL);
  wayne.repeat(36, { inside: false, rainDelta: 0 });
  wayne.repeat(18, { inside: true });
  const naha = new LevelState(NAHA_STORM_LEVEL);

  assert.equal(
    wayne.levelState.statisticsSnapshot().warningZones["taiwan-warning"]
      .entryCount,
    1
  );
  assert.deepEqual(naha.statisticsSnapshot().warningZones, {});
  assert.deepEqual(naha.statistics.surfaceEvents, []);
  assert.ok(
    naha
      .objectivesSnapshot()
      .every((objective) => objective.status === "pending")
  );
});

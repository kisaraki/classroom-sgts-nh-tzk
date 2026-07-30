import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { PROJECT_CONFIG } from "../../js/config.js";
import { validateMapData } from "../../js/data/geography.js";
import { NAHA_STORM_LEVEL } from "../../js/data/levels.js";
import { PRNG_VERSION } from "../../js/utils/random.js";
import { runLevelReplay } from "../helpers/level-simulation.js";

const TEST_DIRECTORY = path.dirname(fileURLToPath(import.meta.url));
const MAP_PATH = path.join(
  TEST_DIRECTORY,
  "../../assets/maps/northwest-pacific.json"
);
const FIXTURE_PATH = path.join(
  TEST_DIRECTORY,
  "../fixtures/naha-storm-golden-replay.json"
);
const loadInputs = async () => ({
  fixture: JSON.parse(await readFile(FIXTURE_PATH, "utf8")),
  mapData: validateMapData(JSON.parse(await readFile(MAP_PATH, "utf8")))
});

test("Naha golden replay wins through the formal model pipeline", async () => {
  const { fixture, mapData } = await loadInputs();
  const result = runLevelReplay({
    level: NAHA_STORM_LEVEL,
    mapData,
    operations: fixture.operations
  });
  const levelResult = result.session.levelState.result;
  const objectiveSteps = Object.fromEntries(
    levelResult.objectives.map((objective) => [
      objective.id,
      objective.completedAtStep
    ])
  );

  assert.equal(fixture.schemaVersion, PROJECT_CONFIG.schemaVersion);
  assert.equal(fixture.modelVersion, PROJECT_CONFIG.modelVersion);
  assert.equal(fixture.prngVersion, PRNG_VERSION);
  assert.equal(fixture.levelId, NAHA_STORM_LEVEL.id);
  assert.equal(fixture.seed, NAHA_STORM_LEVEL.seed);
  assert.deepEqual(
    fixture.initialEnvironment,
    NAHA_STORM_LEVEL.environmentPreset
  );
  assert.equal(levelResult.outcome, fixture.expected.outcome);
  assert.equal(levelResult.stepIndex, fixture.expected.victoryStep);
  assert.equal(
    levelResult.simulationMinutes,
    fixture.expected.simulationMinutes
  );
  assert.equal(levelResult.fingerprint, fixture.expected.resultFingerprint);
  assert.equal(levelResult.score.total, fixture.expected.score);
  assert.deepEqual(
    objectiveSteps,
    fixture.expected.objectiveCompletionSteps
  );
  assert.ok(
    Math.abs(
      levelResult.statistics.stations.naha.minimumDistanceKm -
        fixture.expected.minimumNahaDistanceKm
    ) <= fixture.tolerance.sameEngineAbsolute
  );
  assert.equal(
    result.session.events.filter(
      (event) => event.type === "OBJECTIVE_COMPLETED"
    ).length,
    4
  );
  assert.equal(
    result.session.events.some(
      (event) => event.type === "FAILURE_TRIGGERED"
    ),
    false
  );
});

test("eastward retreat misses Naha and cannot win", async () => {
  const { mapData } = await loadInputs();
  const result = runLevelReplay({
    level: NAHA_STORM_LEVEL,
    mapData,
    operations: [
      {
        control: "subtropicalHighWestwardExtent",
        sequence: 1,
        stepIndex: 1,
        value: 150
      },
      {
        control: "subtropicalHighIntensity",
        sequence: 2,
        stepIndex: 1,
        value: 0.25
      }
    ]
  });
  const proximity = result.session.levelState
    .objectivesSnapshot()
    .find((objective) => objective.id === "naha-proximity");

  assert.equal(result.session.levelState.outcome, "failure");
  assert.notEqual(proximity.status, "completed");
  assert.ok(
    result.session.levelState.statistics.stations.naha.minimumDistanceKm > 50
  );
});

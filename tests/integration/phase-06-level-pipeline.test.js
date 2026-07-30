import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { validateMapData } from "../../js/data/geography.js";
import { NAHA_STORM_LEVEL } from "../../js/data/levels.js";
import {
  createHeadlessLevelSession,
  runLevelReplay
} from "../helpers/level-simulation.js";

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

test("formal Level pipeline settles the Naha golden replay exactly once", async () => {
  const { fixture, mapData } = await loadInputs();
  const replay = runLevelReplay({
    level: NAHA_STORM_LEVEL,
    mapData,
    operations: fixture.operations
  });
  const result = replay.session.levelState.result;
  const duplicate = replay.session.levelState.finalize({
    fingerprint: "must-not-replace-the-result",
    observations: replay.latest.observations,
    outcome: "failure",
    simulationMinutes: replay.latest.simulationMinutes + 10,
    stepIndex: replay.latest.stepIndex + 1,
    typhoon: replay.session.typhoon
  });

  assert.equal(result.outcome, "victory");
  assert.equal(result.fingerprint, fixture.expected.resultFingerprint);
  assert.equal(result.score.total, fixture.expected.score);
  assert.ok(result.path.length > 1);
  assert.ok(
    fixture.expected.victoryStep - result.path.at(-1).stepIndex <= 6
  );
  assert.ok(result.statistics.pathLengthKm > 0);
  assert.equal(result.statistics.stations.naha.name, "那霸");
  assert.strictEqual(duplicate, result);
  assert.equal(
    replay.session.events.filter(
      (event) => event.type === "OBJECTIVE_COMPLETED"
    ).length,
    4
  );
  assert.equal(
    replay.session.events.filter(
      (event) => event.type === "FAILURE_TRIGGERED"
    ).length,
    0
  );
});

test("a fresh level session clears all mutable replay state", async () => {
  const { fixture, mapData } = await loadInputs();
  const completed = runLevelReplay({
    level: NAHA_STORM_LEVEL,
    mapData,
    operations: fixture.operations
  });
  const restarted = createHeadlessLevelSession(NAHA_STORM_LEVEL, mapData);

  assert.equal(completed.session.levelState.isTerminal, true);
  assert.equal(restarted.levelState.isTerminal, false);
  assert.equal(restarted.levelState.result, null);
  assert.deepEqual(restarted.levelState.controlOperations, []);
  assert.deepEqual(restarted.events, []);
  assert.equal(restarted.levelState.statistics.steps, 0);
  assert.deepEqual(restarted.levelState.statistics.stations, {});
  assert.equal(restarted.levelState.statistics.maximumColdWake, 0);
  assert.ok(
    restarted.levelState
      .objectivesSnapshot()
      .every((objective) => objective.status === "pending")
  );
  assert.deepEqual(
    restarted.environment.targetControls,
    NAHA_STORM_LEVEL.environmentPreset
  );
});

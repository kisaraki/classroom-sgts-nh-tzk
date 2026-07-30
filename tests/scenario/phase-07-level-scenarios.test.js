import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { PROJECT_CONFIG } from "../../js/config.js";
import { validateMapData } from "../../js/data/geography.js";
import {
  MOUNTAIN_SHIELD_LEVEL,
  WAYNE_THREE_ENTRIES_LEVEL
} from "../../js/data/levels.js";
import { PRNG_VERSION } from "../../js/utils/random.js";
import { runLevelReplay } from "../helpers/level-simulation.js";

const TEST_DIRECTORY = path.dirname(fileURLToPath(import.meta.url));
const readJson = async (relativePath) =>
  JSON.parse(
    await readFile(path.join(TEST_DIRECTORY, relativePath), "utf8")
  );
const objectiveSteps = (result) =>
  Object.fromEntries(
    result.objectives.map((objective) => [
      objective.id,
      objective.completedAtStep
    ])
  );

test("Mountain Shield golden replay crosses Taiwan east-to-west and wins", async () => {
  const [mapData, fixture] = await Promise.all([
    readJson("../../assets/maps/northwest-pacific.json"),
    readJson("../fixtures/mountain-shield-golden-replay.json")
  ]);
  const replay = runLevelReplay({
    level: MOUNTAIN_SHIELD_LEVEL,
    mapData: validateMapData(mapData),
    operations: fixture.operations
  });
  const result = replay.session.levelState.result;

  assert.equal(fixture.modelVersion, PROJECT_CONFIG.modelVersion);
  assert.equal(fixture.prngVersion, PRNG_VERSION);
  assert.equal(result.outcome, fixture.expected.outcome);
  assert.equal(result.stepIndex, fixture.expected.victoryStep);
  assert.equal(result.fingerprint, fixture.expected.resultFingerprint);
  assert.equal(result.score.total, fixture.expected.score);
  assert.deepEqual(
    objectiveSteps(result),
    fixture.expected.objectiveCompletionSteps
  );
  assert.equal(result.statistics.taiwanLandfalls[0].coastSide, "east");
  assert.equal(result.statistics.taiwanSeaReentries[0].coastSide, "west");
  assert.equal(result.statistics.centralMountainCrossed, true);
});

test("Wayne golden replay wins on the third valid entry with two landfalls", async () => {
  const [mapData, fixture] = await Promise.all([
    readJson("../../assets/maps/northwest-pacific.json"),
    readJson("../fixtures/wayne-three-entries-golden-replay.json")
  ]);
  const replay = runLevelReplay({
    level: WAYNE_THREE_ENTRIES_LEVEL,
    mapData: validateMapData(mapData),
    operations: fixture.operations
  });
  const result = replay.session.levelState.result;
  const warning =
    result.statistics.warningZones["taiwan-warning"];

  assert.equal(fixture.modelVersion, PROJECT_CONFIG.modelVersion);
  assert.equal(fixture.prngVersion, PRNG_VERSION);
  assert.equal(result.outcome, fixture.expected.outcome);
  assert.equal(result.stepIndex, fixture.expected.victoryStep);
  assert.equal(result.fingerprint, fixture.expected.resultFingerprint);
  assert.equal(result.score.total, fixture.expected.score);
  assert.deepEqual(
    objectiveSteps(result),
    fixture.expected.objectiveCompletionSteps
  );
  assert.equal(warning.entryCount, 3);
  assert.deepEqual(warning.entryPeakWinds, fixture.expected.entryPeakWinds);
  assert.equal(result.statistics.taiwanLandfalls.length, 2);
  assert.ok(warning.entryPeakWinds.every((wind) => wind >= 28));
});

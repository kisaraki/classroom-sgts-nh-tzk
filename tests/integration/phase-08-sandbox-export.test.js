import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { validateMapData } from "../../js/data/geography.js";
import {
  DEFAULT_SANDBOX_PRESET,
  createSandboxLevel
} from "../../js/data/sandbox.js";
import {
  createSimulationExport,
  validateImportPackage
} from "../../js/io/SimulationIO.js";
import { runLevelReplay } from "../helpers/level-simulation.js";

const TEST_DIRECTORY = path.dirname(fileURLToPath(import.meta.url));
const MAP_PATH = path.join(
  TEST_DIRECTORY,
  "../../assets/maps/northwest-pacific.json"
);

test("sandbox simulation export imports and deterministically replays", async () => {
  const mapData = validateMapData(
    JSON.parse(await readFile(MAP_PATH, "utf8"))
  );
  const preset = {
    ...DEFAULT_SANDBOX_PRESET,
    seed: "phase-08-replay"
  };
  const level = createSandboxLevel(preset);
  const operations = [
    {
      control: "verticalWindShear",
      stepIndex: 0,
      value: 4
    },
    {
      control: "subtropicalHighIntensity",
      stepIndex: 30,
      value: 0.85
    }
  ];
  const first = runLevelReplay({
    level,
    mapData,
    maximumSteps: 90,
    operations,
    sandboxPreset: preset
  });
  const exported = createSimulationExport({
    environmentTargets: first.session.environment.targetControls,
    fingerprint: first.latest.fingerprint,
    levelId: level.id,
    mode: "sandbox",
    observations: first.latest.observations,
    operations: first.session.levelState.controlOperations,
    sandboxPreset: preset,
    seed: level.seed,
    simulationMinutes: first.latest.simulationMinutes,
    stepIndex: first.latest.stepIndex,
    storm: first.session.typhoon
  });
  const imported = validateImportPackage(JSON.stringify(exported));
  const second = runLevelReplay({
    level: createSandboxLevel(imported.sandboxPreset),
    mapData,
    maximumSteps: imported.simulation.stepIndex,
    operations: imported.operations,
    sandboxPreset: imported.sandboxPreset
  });

  assert.equal(first.session.levelState.result, null);
  assert.equal(imported.mode, "sandbox");
  assert.equal(second.latest.fingerprint, imported.simulation.fingerprint);
  assert.deepEqual(
    second.session.typhoon.trackHistory,
    imported.simulation.track
  );
});

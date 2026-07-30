import assert from "node:assert/strict";
import test from "node:test";

import { PROJECT_CONFIG } from "../js/config.js";
import {
  DEFAULT_SANDBOX_PRESET,
  createSandboxLevel,
  validateSandboxPreset
} from "../js/data/sandbox.js";
import {
  MAX_IMPORT_BYTES,
  createPngBlob,
  createSandboxPresetExport,
  createSimulationExport,
  createSimulationSummary,
  createTrackCsv,
  validateImportPackage
} from "../js/io/SimulationIO.js";
import { createEnvironmentGrid } from "../js/model/Environment.js";
import { Typhoon } from "../js/model/Typhoon.js";
import {
  STORAGE_KEY,
  StorageManager,
  createDefaultStorageRecord,
  migrateStorageRecord
} from "../js/persistence/StorageManager.js";
import { SeededRandom } from "../js/utils/random.js";

class MemoryStorage {
  values = new Map();
  removed = [];

  getItem(key) {
    return this.values.get(key) ?? null;
  }

  removeItem(key) {
    this.removed.push(key);
    this.values.delete(key);
  }

  setItem(key, value) {
    this.values.set(key, value);
  }
}

const createStorm = () => {
  const storm = new Typhoon({
    active: true,
    centralPressure: 995,
    eventHistory: [],
    galeRadius: 100,
    heading: 285,
    id: "sandbox-cyclone",
    isOverLand: false,
    lat: 15,
    lon: 135,
    maxWind: 24,
    moisture: 0.75,
    name: "KOSMOS-SBX",
    organization: 0.5,
    structureStage: "spiral",
    symmetry: 0.5,
    trackHistory: [],
    translationSpeed: 12
  });
  storm.recordTrack({ simulationMinutes: 0, stepIndex: 0 });
  return storm;
};

const createObservation = () => ({
  station: {
    accumulatedRain: 12,
    gust: 30,
    hourlyRainRate: 5,
    id: "naha",
    lat: 26.21,
    lon: 127.69,
    name: "那霸",
    sustainedWind: 20
  }
});

test("sandbox preset creates a no-win/no-loss validated level", () => {
  const preset = validateSandboxPreset(DEFAULT_SANDBOX_PRESET);
  const level = createSandboxLevel(preset);

  assert.equal(level.id, "sandbox");
  assert.equal(level.objectives.length, 0);
  assert.equal(level.failureConditions.length, 0);
  assert.equal(level.spawn.lat, preset.lat);
  assert.equal(level.spawn.centralPressure, preset.centralPressure);
  assert.equal(level.environmentPreset.verticalWindShear, preset.verticalWindShear);
  assert.match(level.disclaimer, /沒有勝敗/u);
});

test("sandbox preset rejects unknown fields and out-of-range values", () => {
  assert.throws(
    () =>
      validateSandboxPreset({
        ...DEFAULT_SANDBOX_PRESET,
        executable: "() => true"
      }),
    /unknown fields/u
  );
  assert.throws(
    () =>
      validateSandboxPreset({
        ...DEFAULT_SANDBOX_PRESET,
        seaSurfaceTemperature: 50
      }),
    /seaSurfaceTemperature/u
  );
});

test("sandbox SST and OHC become environment baselines", () => {
  const environment = createEnvironmentGrid({
    baseOceanHeatContent: 0.65,
    baseSeaSurfaceTemperature: 28,
    controls: createSandboxLevel(DEFAULT_SANDBOX_PRESET).environmentPreset,
    random: new SeededRandom("sandbox-environment"),
    targetControls: createSandboxLevel(DEFAULT_SANDBOX_PRESET).environmentPreset
  });
  const sample = environment.sampleAt({ lat: 15, lon: 135 });

  assert.equal(sample.OHC, 0.65);
  assert.equal(sample.SST, 28);
});

test("storage round trip restores settings and last sandbox preset", () => {
  const storage = new MemoryStorage();
  const manager = new StorageManager(storage);
  const record = createDefaultStorageRecord();
  record.settings.speed = 12;
  record.settings.trackLayer = false;
  record.lastSandboxPreset.seed = "restored-seed";
  manager.save(record);

  const restored = manager.load();
  assert.equal(restored.settings.speed, 12);
  assert.equal(restored.settings.trackLayer, false);
  assert.equal(restored.lastSandboxPreset.seed, "restored-seed");
  assert.equal(JSON.parse(storage.getItem(STORAGE_KEY)).version, 1);
});

test("corrupt or unsupported storage safely falls back to defaults", () => {
  const storage = new MemoryStorage();
  storage.setItem(STORAGE_KEY, "{broken");
  const restored = new StorageManager(storage).load();

  assert.equal(restored.version, 1);
  assert.equal(restored.settings.speed, 1);
  assert.deepEqual(storage.removed, [STORAGE_KEY]);
  assert.throws(() => migrateStorageRecord({ version: 999 }), /migration/u);
});

test("simulation and sandbox JSON exports validate after round trip", () => {
  const storm = createStorm();
  const simulation = createSimulationExport({
    environmentTargets: createSandboxLevel(
      DEFAULT_SANDBOX_PRESET
    ).environmentPreset,
    fingerprint: "1234abcd",
    levelId: "sandbox",
    mode: "sandbox",
    observations: [createObservation()],
    operations: [
      {
        control: "verticalWindShear",
        sequence: 1,
        simulationMinutes: 0,
        stepIndex: 0,
        value: 4
      }
    ],
    sandboxPreset: DEFAULT_SANDBOX_PRESET,
    seed: DEFAULT_SANDBOX_PRESET.seed,
    simulationMinutes: 0,
    stepIndex: 0,
    storm
  });
  const importedSimulation = validateImportPackage(
    JSON.stringify(simulation)
  );
  const importedPreset = validateImportPackage(
    JSON.stringify(createSandboxPresetExport(DEFAULT_SANDBOX_PRESET))
  );

  assert.equal(importedSimulation.simulation.fingerprint, "1234abcd");
  assert.equal(importedSimulation.operations[0].control, "verticalWindShear");
  assert.equal(importedPreset.preset.seed, DEFAULT_SANDBOX_PRESET.seed);
  assert.equal(importedSimulation.modelVersion, PROJECT_CONFIG.modelVersion);
  assert.equal(importedSimulation.buildCommit, PROJECT_CONFIG.buildCommit);
});

test("imports reject invalid, oversized, deep, unknown, and pollution JSON", () => {
  assert.throws(() => validateImportPackage("{bad"), /valid JSON/u);
  assert.throws(
    () => validateImportPackage(" ".repeat(MAX_IMPORT_BYTES + 1)),
    /exceeds 1 MB/u
  );

  let deep = 0;
  for (let index = 0; index < 14; index += 1) {
    deep = { nested: deep };
  }
  assert.throws(
    () => validateImportPackage(JSON.stringify(deep)),
    /nesting is too deep/u
  );
  assert.throws(
    () => validateImportPackage('{"exportType":"simulation","__proto__":{}}'),
    /Forbidden JSON field/u
  );

  const exported = createSandboxPresetExport(DEFAULT_SANDBOX_PRESET);
  assert.throws(
    () =>
      validateImportPackage(
        JSON.stringify({ ...exported, arbitraryHtml: "<script>" })
      ),
    /unknown fields/u
  );
});

test("track CSV includes complete fields and prevents formula injection", () => {
  const csv = createTrackCsv({
    name: "=HYPERLINK(\"https://invalid.example\")",
    track: createStorm().trackHistory
  });

  assert.match(
    csv,
    /"name","stepIndex","simulationMinutes","lat","lon","maxWindMps","centralPressureHpa"/u
  );
  assert.match(csv, /"'=HYPERLINK/u);
});

test("PNG export adds identity, time, brand, and forecasting disclaimer", async () => {
  const text = [];
  let sourceDrawn = false;
  const context = {
    drawImage() {
      sourceDrawn = true;
    },
    fillRect() {},
    fillText(value) {
      text.push(value);
    }
  };
  const blob = await createPngBlob(
    { height: 600, width: 960 },
    { name: "KOSMOS-SBX", simulationMinutes: 120 },
    {
      createCanvas: () => ({
        getContext: () => context,
        height: 0,
        toBlob: (callback) =>
          callback(new globalThis.Blob(["png"], { type: "image/png" })),
        width: 0
      })
    }
  );

  assert.equal(blob.type, "image/png");
  assert.equal(sourceDrawn, true);
  assert.ok(text.some((value) => value.includes("KOSMOS-SBX")));
  assert.ok(text.includes(PROJECT_CONFIG.brand));
  assert.ok(text.includes("Not for Forecasting"));
});

test("plain-text summary contains simulation and traceability metadata", () => {
  const summary = createSimulationSummary({
    fingerprint: "1234abcd",
    levelTitle: "沙盒實驗室",
    simulationMinutes: 120,
    storm: createStorm()
  });

  assert.match(summary, /沙盒實驗室/u);
  assert.match(summary, /KOSMOS-SBX/u);
  assert.match(summary, /modelVersion/u);
  assert.match(summary, /build commit/u);
  assert.match(summary, /Not for Forecasting/u);
});

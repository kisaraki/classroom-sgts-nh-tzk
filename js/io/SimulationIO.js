import { PROJECT_CONFIG } from "../config.js";
import { validateSandboxPreset } from "../data/sandbox.js";
import { Typhoon } from "../model/Typhoon.js";
import { formatSimulationTime } from "../ui/CanvasViewport.js";
import { PRNG_VERSION } from "../utils/random.js";
import {
  ValidationError,
  assertExactObjectKeys,
  assertFiniteNumber,
  assertInteger
} from "../utils/validation.js";

export const EXPORT_SCHEMA_VERSION = 1;
export const MAX_IMPORT_BYTES = 1_000_000;
export const MAX_IMPORT_DEPTH = 12;
export const MAX_EXPORT_RECORDS = 5_000;
const FORBIDDEN_KEYS = new Set(["__proto__", "constructor", "prototype"]);
const CONTROL_NAMES = Object.freeze(
  Object.keys(PROJECT_CONFIG.environmentControls)
);
const TRACK_FIELDS = Object.freeze([
  "centralPressure",
  "lat",
  "lon",
  "maxWind",
  "simulationMinutes",
  "stepIndex"
]);
const OPERATION_FIELDS = Object.freeze([
  "control",
  "simulationMinutes",
  "stepIndex",
  "value"
]);
const OBSERVATION_FIELDS = Object.freeze([
  "accumulatedRain",
  "gust",
  "hourlyRainRate",
  "id",
  "lat",
  "lon",
  "name",
  "sustainedWind"
]);
const SIMULATION_FIELDS = Object.freeze([
  "environmentTargets",
  "fingerprint",
  "observations",
  "simulationMinutes",
  "stepIndex",
  "storm",
  "track"
]);
const PACKAGE_FIELDS = Object.freeze([
  "buildCommit",
  "exportType",
  "exportedAt",
  "levelId",
  "mode",
  "modelVersion",
  "operations",
  "prngVersion",
  "sandboxPreset",
  "schemaVersion",
  "seed",
  "simulation"
]);
const PRESET_PACKAGE_FIELDS = Object.freeze([
  "buildCommit",
  "exportType",
  "exportedAt",
  "modelVersion",
  "preset",
  "prngVersion",
  "schemaVersion"
]);

const assertPlainObject = (value, name) => {
  if (
    value === null ||
    typeof value !== "object" ||
    Array.isArray(value) ||
    Object.getPrototypeOf(value) !== Object.prototype
  ) {
    throw new ValidationError(`${name} must be a plain object.`);
  }
};

const inspectJsonValue = (value, depth = 0) => {
  if (depth > MAX_IMPORT_DEPTH) {
    throw new ValidationError("JSON nesting is too deep.");
  }

  if (Array.isArray(value)) {
    if (value.length > MAX_EXPORT_RECORDS) {
      throw new ValidationError("JSON array is too large.");
    }
    value.forEach((entry) => inspectJsonValue(entry, depth + 1));
    return;
  }

  if (value && typeof value === "object") {
    for (const [key, entry] of Object.entries(value)) {
      if (FORBIDDEN_KEYS.has(key)) {
        throw new ValidationError(`Forbidden JSON field: ${key}.`);
      }
      inspectJsonValue(entry, depth + 1);
    }
  }
};

export const parseSafeJson = (text) => {
  if (typeof text !== "string") {
    throw new ValidationError("Imported JSON must be text.");
  }

  const bytes = new globalThis.TextEncoder().encode(text).byteLength;

  if (bytes > MAX_IMPORT_BYTES) {
    throw new ValidationError("Imported JSON exceeds 1 MB.");
  }

  let value;
  try {
    value = JSON.parse(text);
  } catch {
    throw new ValidationError("Imported file is not valid JSON.");
  }

  inspectJsonValue(value);
  return value;
};

const validateMetadata = (input) => {
  if (input.schemaVersion !== EXPORT_SCHEMA_VERSION) {
    throw new ValidationError("Unsupported export schemaVersion.");
  }

  if (input.modelVersion !== PROJECT_CONFIG.modelVersion) {
    throw new ValidationError("Export modelVersion is incompatible.");
  }

  if (input.prngVersion !== PRNG_VERSION) {
    throw new ValidationError("Export PRNG version is incompatible.");
  }

  for (const field of ["buildCommit", "exportedAt"]) {
    if (typeof input[field] !== "string" || input[field].length > 128) {
      throw new ValidationError(`${field} is invalid.`);
    }
  }
};

const validateTrack = (track) => {
  if (!Array.isArray(track) || track.length > MAX_EXPORT_RECORDS) {
    throw new ValidationError("track is invalid or too large.");
  }

  return track.map((entry, index) => {
    assertExactObjectKeys(entry, TRACK_FIELDS, `track[${index}]`);
    TRACK_FIELDS.forEach((field) => assertFiniteNumber(entry[field], field));
    assertInteger(entry.stepIndex, "track.stepIndex");
    return Object.freeze({ ...entry });
  });
};

const validateOperations = (operations) => {
  if (!Array.isArray(operations) || operations.length > MAX_EXPORT_RECORDS) {
    throw new ValidationError("operations is invalid or too large.");
  }

  return operations.map((entry, index) => {
    assertExactObjectKeys(entry, OPERATION_FIELDS, `operations[${index}]`);

    if (!CONTROL_NAMES.includes(entry.control)) {
      throw new ValidationError("operation.control is unsupported.");
    }
    assertFiniteNumber(entry.value, "operation.value");
    assertFiniteNumber(entry.simulationMinutes, "operation.simulationMinutes");
    assertInteger(entry.stepIndex, "operation.stepIndex");
    return Object.freeze({ ...entry });
  });
};

const validateObservations = (observations) => {
  if (!Array.isArray(observations) || observations.length > 64) {
    throw new ValidationError("observations is invalid.");
  }

  return observations.map((entry, index) => {
    assertExactObjectKeys(entry, OBSERVATION_FIELDS, `observations[${index}]`);

    for (const field of OBSERVATION_FIELDS.filter(
      (name) => !["id", "name"].includes(name)
    )) {
      assertFiniteNumber(entry[field], `observation.${field}`);
    }

    if (
      typeof entry.id !== "string" ||
      typeof entry.name !== "string" ||
      entry.id.length > 64 ||
      entry.name.length > 64
    ) {
      throw new ValidationError("observation identity is invalid.");
    }
    return Object.freeze({ ...entry });
  });
};

const validateEnvironmentTargets = (targets) => {
  assertExactObjectKeys(targets, CONTROL_NAMES, "environmentTargets");

  for (const [name, value] of Object.entries(targets)) {
    const definition = PROJECT_CONFIG.environmentControls[name];
    assertFiniteNumber(value, name);

    if (value < definition.minimum || value > definition.maximum) {
      throw new ValidationError(`${name} is outside its allowed range.`);
    }
  }

  return Object.freeze({ ...targets });
};

export const validateSimulationExport = (input) => {
  assertExactObjectKeys(input, PACKAGE_FIELDS, "simulation export");
  validateMetadata(input);

  if (input.exportType !== "simulation") {
    throw new ValidationError("exportType must be simulation.");
  }

  if (!["level", "sandbox"].includes(input.mode)) {
    throw new ValidationError("mode is unsupported.");
  }

  for (const field of ["levelId", "seed"]) {
    if (typeof input[field] !== "string" || input[field].length > 128) {
      throw new ValidationError(`${field} is invalid.`);
    }
  }

  assertExactObjectKeys(input.simulation, SIMULATION_FIELDS, "simulation");
  assertFiniteNumber(
    input.simulation.simulationMinutes,
    "simulation.simulationMinutes"
  );
  assertInteger(input.simulation.stepIndex, "simulation.stepIndex");

  if (
    typeof input.simulation.fingerprint !== "string" ||
    !/^[a-f0-9]{8}$/u.test(input.simulation.fingerprint)
  ) {
    throw new ValidationError("simulation.fingerprint is invalid.");
  }

  assertPlainObject(input.simulation.storm, "simulation.storm");
  const storm = new Typhoon({
    ...input.simulation.storm,
    eventHistory: [],
    trackHistory: []
  }).physicsSnapshot();

  return Object.freeze({
    ...input,
    operations: Object.freeze(validateOperations(input.operations)),
    sandboxPreset:
      input.sandboxPreset === null
        ? null
        : validateSandboxPreset(input.sandboxPreset),
    simulation: Object.freeze({
      ...input.simulation,
      environmentTargets: validateEnvironmentTargets(
        input.simulation.environmentTargets
      ),
      observations: Object.freeze(
        validateObservations(input.simulation.observations)
      ),
      storm,
      track: Object.freeze(validateTrack(input.simulation.track))
    })
  });
};

export const validateSandboxPresetExport = (input) => {
  assertExactObjectKeys(input, PRESET_PACKAGE_FIELDS, "sandbox preset export");
  validateMetadata(input);

  if (input.exportType !== "sandbox-preset") {
    throw new ValidationError("exportType must be sandbox-preset.");
  }

  return Object.freeze({
    ...input,
    preset: validateSandboxPreset(input.preset)
  });
};

export const validateImportPackage = (text) => {
  const input = parseSafeJson(text);
  assertPlainObject(input, "import package");

  if (input.exportType === "simulation") {
    return validateSimulationExport(input);
  }

  if (input.exportType === "sandbox-preset") {
    return validateSandboxPresetExport(input);
  }

  throw new ValidationError("Unknown exportType.");
};

const metadata = () => ({
  buildCommit: PROJECT_CONFIG.buildCommit,
  exportedAt: new Date().toISOString(),
  modelVersion: PROJECT_CONFIG.modelVersion,
  prngVersion: PRNG_VERSION,
  schemaVersion: EXPORT_SCHEMA_VERSION
});

const simplifyObservation = ({ station }) => ({
  accumulatedRain: station.accumulatedRain,
  gust: station.gust,
  hourlyRainRate: station.hourlyRainRate,
  id: station.id,
  lat: station.lat,
  lon: station.lon,
  name: station.name,
  sustainedWind: station.sustainedWind
});

export const createSimulationExport = ({
  environmentTargets,
  fingerprint,
  levelId,
  mode,
  observations,
  operations,
  sandboxPreset = null,
  seed,
  simulationMinutes,
  stepIndex,
  storm
}) =>
  validateSimulationExport({
    ...metadata(),
    exportType: "simulation",
    levelId,
    mode,
    operations: operations.map((entry) => ({
      control: entry.control,
      simulationMinutes: entry.simulationMinutes,
      stepIndex: entry.stepIndex,
      value: entry.value
    })),
    sandboxPreset,
    seed: String(seed),
    simulation: {
      environmentTargets: { ...environmentTargets },
      fingerprint,
      observations: observations.map(simplifyObservation),
      simulationMinutes,
      stepIndex,
      storm: storm.physicsSnapshot(),
      track: storm.trackHistory.map((entry) => ({ ...entry }))
    }
  });

export const createSandboxPresetExport = (preset) =>
  validateSandboxPresetExport({
    ...metadata(),
    exportType: "sandbox-preset",
    preset: { ...preset }
  });

const protectCsvCell = (value) => {
  let text = String(value ?? "");

  if (/^[=+\-@\t\r]/u.test(text)) {
    text = `'${text}`;
  }

  return `"${text.replaceAll("\"", "\"\"")}"`;
};

export const createTrackCsv = ({ name, track }) => {
  const headers = [
    "name",
    "stepIndex",
    "simulationMinutes",
    "lat",
    "lon",
    "maxWindMps",
    "centralPressureHpa"
  ];
  const rows = track.map((entry) => [
    name,
    entry.stepIndex,
    entry.simulationMinutes,
    entry.lat,
    entry.lon,
    entry.maxWind,
    entry.centralPressure
  ]);

  return [headers, ...rows]
    .map((row) => row.map(protectCsvCell).join(","))
    .join("\r\n");
};

export const createSimulationSummary = ({
  fingerprint,
  levelTitle,
  simulationMinutes,
  storm
}) =>
  [
    "風暴創世神：北半球颱風模擬器",
    `模式：${levelTitle}`,
    `名稱：${storm.name}`,
    `模擬時間：${formatSimulationTime(simulationMinutes)}`,
    `位置：${storm.lat.toFixed(2)}°N, ${storm.lon.toFixed(2)}°E`,
    `最大風速：${storm.maxWind.toFixed(1)} m/s`,
    `中心氣壓：${storm.centralPressure.toFixed(0)} hPa`,
    `fingerprint：${fingerprint}`,
    `schemaVersion：${EXPORT_SCHEMA_VERSION}`,
    `modelVersion：${PROJECT_CONFIG.modelVersion}`,
    `PRNG：${PRNG_VERSION}`,
    `build commit：${PROJECT_CONFIG.buildCommit}`,
    PROJECT_CONFIG.brand,
    "Not for Forecasting"
  ].join("\n");

export const createPngBlob = (
  sourceCanvas,
  { name, simulationMinutes },
  { createCanvas = () => document.createElement("canvas") } = {}
) =>
  new Promise((resolve, reject) => {
    const output = createCanvas();
    const footerHeight = 96;
    output.width = sourceCanvas.width;
    output.height = sourceCanvas.height + footerHeight;
    const context = output.getContext("2d");

    if (!context) {
      reject(new Error("PNG export requires a Canvas 2D context."));
      return;
    }

    context.drawImage(sourceCanvas, 0, 0);
    context.fillStyle = "#06111f";
    context.fillRect(0, sourceCanvas.height, output.width, footerHeight);
    context.fillStyle = "#eef7ff";
    context.font = "700 24px system-ui, sans-serif";
    context.fillText(
      `${name} · ${formatSimulationTime(simulationMinutes)}`,
      24,
      sourceCanvas.height + 34
    );
    context.fillStyle = "#76e4f7";
    context.font = "650 18px system-ui, sans-serif";
    context.fillText(PROJECT_CONFIG.brand, 24, sourceCanvas.height + 62);
    context.fillStyle = "#ffd27d";
    context.font = "700 16px system-ui, sans-serif";
    context.fillText(
      "Not for Forecasting",
      24,
      sourceCanvas.height + 86
    );
    output.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error("PNG export failed."));
      }
    }, "image/png");
  });

export const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
};

export const textBlob = (text, type) =>
  new globalThis.Blob([text], { type: `${type};charset=utf-8` });

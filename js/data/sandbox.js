import { PROJECT_CONFIG } from "../config.js";
import {
  ValidationError,
  assertExactObjectKeys,
  assertFiniteNumber
} from "../utils/validation.js";
import { validateLevel } from "./levels.js";

export const SANDBOX_PRESET_FIELDS = Object.freeze([
  "centralPressure",
  "lat",
  "lon",
  "maxWind",
  "moisture",
  "name",
  "oceanHeatContent",
  "organization",
  "seaSurfaceTemperature",
  "seed",
  "southwestMonsoonIntensity",
  "southwestMonsoonMoisture",
  "subtropicalHighIntensity",
  "subtropicalHighRidgeLatitude",
  "subtropicalHighWestwardExtent",
  "symmetry",
  "terrainMultiplier",
  "verticalWindShear"
]);

export const DEFAULT_SANDBOX_PRESET = Object.freeze({
  centralPressure: 1000,
  lat: 15,
  lon: 135,
  maxWind: 18,
  moisture: 0.75,
  name: "KOSMOS-SBX",
  oceanHeatContent: 0.82,
  organization: 0.4,
  seaSurfaceTemperature: 29,
  seed: "sandbox-001",
  southwestMonsoonIntensity: 0.4,
  southwestMonsoonMoisture: 0.8,
  subtropicalHighIntensity: 0.65,
  subtropicalHighRidgeLatitude: 26,
  subtropicalHighWestwardExtent: 128,
  symmetry: 0.4,
  terrainMultiplier: 1,
  verticalWindShear: 7
});

const assertRange = (value, minimum, maximum, name) => {
  assertFiniteNumber(value, name);

  if (value < minimum || value > maximum) {
    throw new ValidationError(
      `${name} 必須介於 ${minimum} 與 ${maximum}。`
    );
  }

  return value;
};

const assertShortText = (value, name, maximumLength) => {
  if (
    typeof value !== "string" ||
    value.trim().length === 0 ||
    value.length > maximumLength
  ) {
    throw new ValidationError(`${name} 必須是 1～${maximumLength} 字元文字。`);
  }

  return value;
};

export const validateSandboxPreset = (input) => {
  assertExactObjectKeys(input, SANDBOX_PRESET_FIELDS, "sandbox preset");
  const bounds = PROJECT_CONFIG.geography.bounds;
  const controls = PROJECT_CONFIG.environmentControls;

  assertRange(input.lat, bounds.minLat, bounds.maxLat, "lat");
  assertRange(input.lon, bounds.minLon, bounds.maxLon, "lon");
  assertRange(input.maxWind, 5, 85, "maxWind");
  assertRange(input.centralPressure, 880, 1010, "centralPressure");
  assertRange(input.organization, 0, 1, "organization");
  assertRange(input.symmetry, 0, 1, "symmetry");
  assertRange(input.moisture, 0, 1, "moisture");
  assertRange(input.seaSurfaceTemperature, 24, 34, "seaSurfaceTemperature");
  assertRange(input.oceanHeatContent, 0.2, 1, "oceanHeatContent");
  assertRange(input.terrainMultiplier, 0, 2, "terrainMultiplier");

  for (const name of [
    "subtropicalHighIntensity",
    "subtropicalHighRidgeLatitude",
    "subtropicalHighWestwardExtent",
    "southwestMonsoonIntensity",
    "southwestMonsoonMoisture",
    "verticalWindShear"
  ]) {
    const definition = controls[name];
    assertRange(input[name], definition.minimum, definition.maximum, name);
  }

  assertShortText(input.name, "name", 48);
  assertShortText(String(input.seed), "seed", 128);

  return Object.freeze({
    ...input,
    name: input.name.trim(),
    seed: String(input.seed)
  });
};

export const createSandboxLevel = (presetInput) => {
  const preset = validateSandboxPreset(presetInput);
  const environmentPreset = {
    southwestMonsoonIntensity: preset.southwestMonsoonIntensity,
    southwestMonsoonMoisture: preset.southwestMonsoonMoisture,
    subtropicalHighIntensity: preset.subtropicalHighIntensity,
    subtropicalHighRidgeLatitude: preset.subtropicalHighRidgeLatitude,
    subtropicalHighWestwardExtent: preset.subtropicalHighWestwardExtent,
    verticalWindShear: preset.verticalWindShear
  };
  const zeroScoreComponent = {
    cutoffKm: 1,
    formula: "station-distance-linear",
    maximumChanges: 1,
    maximumPoints: 0,
    stationId: "naha",
    targetWind: 1
  };

  return validateLevel({
    allowedControls: Object.keys(PROJECT_CONFIG.environmentControls),
    bonusObjectives: [],
    disclaimer: "自由教育實驗，沒有勝敗；輸出不得用於真實天氣預報。",
    durationHours: 1000,
    environmentPreset,
    failureConditions: [],
    historicalInspiration: "自由設定，非歷史重建",
    id: "sandbox",
    objectives: [],
    oceanCoolingMultiplier: 1,
    referenceZones: [],
    schemaVersion: PROJECT_CONFIG.schemaVersion,
    scoring: {
      controlStability: {
        ...zeroScoreComponent,
        formula: "linear-change-penalty"
      },
      intensityManagement: {
        ...zeroScoreComponent,
        formula: "peak-wind-ratio"
      },
      maximumTotal: 0,
      minimumTotal: 0,
      objectivePoints: {},
      pathPrecision: zeroScoreComponent,
      penalties: {
        coldWake: {
          formula: "excess-linear",
          maximumDeduction: 0,
          pointsPerUnit: 0,
          threshold: 0
        }
      },
      rounding: "nearest",
      timeEfficiency: {
        ...zeroScoreComponent,
        formula: "remaining-time-linear"
      }
    },
    seed: preset.seed,
    spawn: {
      centralPressure: preset.centralPressure,
      galeRadius: 90,
      heading: 285,
      lat: preset.lat,
      lon: preset.lon,
      maxWind: preset.maxWind,
      moisture: preset.moisture,
      organization: preset.organization,
      structureStage: preset.maxWind >= 24 ? "spiral" : "cluster",
      symmetry: preset.symmetry,
      translationSpeed: 12
    },
    stationGroups: [],
    steeringMeridionalMultiplier: 1,
    title: "沙盒實驗室",
    tutorialMessages: [
      {
        body: "沙盒不設勝敗；可暫停、倍速、重啟、切換圖層並匯出完整紀錄。",
        id: "sandbox-free-experiment",
        title: "自由實驗",
        triggerStep: 0
      }
    ],
    warningZones: []
  });
};

import { PROJECT_CONFIG } from "../config.js";
import {
  ValidationError,
  assertExactObjectKeys,
  assertFiniteNumber,
  assertInteger,
  assertOneOf
} from "../utils/validation.js";

export const OBJECTIVE_METRICS = Object.freeze([
  "storm.distanceToStation",
  "station.gust",
  "station.accumulatedRain",
  "storm.maxWindWithinStationRadius"
]);

export const FAILURE_METRICS = Object.freeze([
  "simulation.boundaryReached",
  "storm.maxWind",
  "simulation.minutes",
  "event.regionEnteredBeforeZone"
]);

export const DSL_OPERATORS = Object.freeze(["<", "<=", "==", ">=", ">"]);
export const DSL_AGGREGATIONS = Object.freeze([
  "any",
  "current",
  "maximum",
  "minimum"
]);

const LEVEL_FIELDS = Object.freeze([
  "allowedControls",
  "bonusObjectives",
  "disclaimer",
  "durationHours",
  "environmentPreset",
  "failureConditions",
  "historicalInspiration",
  "id",
  "objectives",
  "referenceZones",
  "schemaVersion",
  "scoring",
  "seed",
  "spawn",
  "title",
  "tutorialMessages"
]);
const SPAWN_FIELDS = Object.freeze([
  "centralPressure",
  "galeRadius",
  "heading",
  "lat",
  "lon",
  "maxWind",
  "moisture",
  "organization",
  "structureStage",
  "symmetry",
  "translationSpeed"
]);
const RULE_FIELDS = Object.freeze([
  "aggregation",
  "description",
  "durationSteps",
  "duringEvent",
  "id",
  "label",
  "metric",
  "once",
  "operator",
  "prerequisite",
  "radiusKm",
  "reference",
  "subject",
  "threshold",
  "unit",
  "windowSteps"
]);
const REFERENCE_ZONE_FIELDS = Object.freeze([
  "id",
  "radiusKm",
  "regionPrefixes",
  "stationId"
]);
const TUTORIAL_FIELDS = Object.freeze(["body", "id", "title", "triggerStep"]);
const SCORING_FIELDS = Object.freeze([
  "controlStability",
  "intensityManagement",
  "maximumTotal",
  "minimumTotal",
  "objectivePoints",
  "pathPrecision",
  "penalties",
  "rounding",
  "timeEfficiency"
]);
const SCORE_COMPONENT_FIELDS = Object.freeze([
  "cutoffKm",
  "formula",
  "maximumChanges",
  "maximumPoints",
  "stationId",
  "targetWind"
]);
const PENALTY_FIELDS = Object.freeze([
  "formula",
  "maximumDeduction",
  "pointsPerUnit",
  "threshold"
]);
const ENVIRONMENT_CONTROL_NAMES = Object.freeze(
  Object.keys(PROJECT_CONFIG.environmentControls)
);

const assertPlainArray = (value, name, maximum) => {
  if (!Array.isArray(value) || value.length > maximum) {
    throw new ValidationError(`${name} must be an array of at most ${maximum}.`);
  }

  return value;
};

const assertText = (value, name, maximum = 240) => {
  if (typeof value !== "string" || value.length < 1 || value.length > maximum) {
    throw new ValidationError(`${name} must contain 1–${maximum} characters.`);
  }

  return value;
};

const assertNullableText = (value, name) => {
  if (value !== null) {
    assertText(value, name, 80);
  }
};

const assertRange = (value, minimum, maximum, name) => {
  assertFiniteNumber(value, name);

  if (value < minimum || value > maximum) {
    throw new ValidationError(
      `${name} must be between ${minimum} and ${maximum}.`
    );
  }

  return value;
};

const validateRule = (rule, metrics, name) => {
  assertExactObjectKeys(rule, RULE_FIELDS, name);
  assertText(rule.id, `${name}.id`, 64);
  assertText(rule.label, `${name}.label`, 80);
  assertText(rule.description, `${name}.description`, 240);
  assertOneOf(rule.metric, metrics, `${name}.metric`);
  assertOneOf(rule.operator, DSL_OPERATORS, `${name}.operator`);
  assertOneOf(rule.aggregation, DSL_AGGREGATIONS, `${name}.aggregation`);

  if (
    !Number.isFinite(rule.threshold) &&
    typeof rule.threshold !== "boolean"
  ) {
    throw new ValidationError(`${name}.threshold must be finite or boolean.`);
  }

  if (rule.subject !== null) {
    assertText(rule.subject, `${name}.subject`, 80);
  }

  assertNullableText(rule.reference, `${name}.reference`);
  assertNullableText(rule.prerequisite, `${name}.prerequisite`);
  assertNullableText(rule.duringEvent, `${name}.duringEvent`);
  assertText(rule.unit, `${name}.unit`, 24);
  assertInteger(rule.durationSteps, `${name}.durationSteps`);
  assertRange(rule.durationSteps, 1, 100_000, `${name}.durationSteps`);

  if (rule.windowSteps !== null) {
    assertInteger(rule.windowSteps, `${name}.windowSteps`);
    assertRange(rule.windowSteps, 1, 100_000, `${name}.windowSteps`);
  }

  if (rule.radiusKm !== null) {
    assertRange(rule.radiusKm, 0.1, 5000, `${name}.radiusKm`);
  }

  if (typeof rule.once !== "boolean") {
    throw new ValidationError(`${name}.once must be boolean.`);
  }

  return Object.freeze({ ...rule });
};

const validateReferenceZone = (zone, name) => {
  assertExactObjectKeys(zone, REFERENCE_ZONE_FIELDS, name);
  assertText(zone.id, `${name}.id`, 64);
  assertText(zone.stationId, `${name}.stationId`, 64);
  assertRange(zone.radiusKm, 0.1, 5000, `${name}.radiusKm`);
  assertPlainArray(zone.regionPrefixes, `${name}.regionPrefixes`, 16);

  for (const prefix of zone.regionPrefixes) {
    assertText(prefix, `${name}.regionPrefixes[]`, 64);
  }

  return Object.freeze({
    ...zone,
    regionPrefixes: Object.freeze([...zone.regionPrefixes])
  });
};

const validateScoreComponent = (component, name, formulas) => {
  assertExactObjectKeys(component, SCORE_COMPONENT_FIELDS, name);
  assertOneOf(component.formula, formulas, `${name}.formula`);
  assertRange(component.maximumPoints, 0, 100_000, `${name}.maximumPoints`);

  for (const field of ["cutoffKm", "maximumChanges", "targetWind"]) {
    if (component[field] !== null) {
      assertRange(component[field], 0, 100_000, `${name}.${field}`);
    }
  }

  if (component.stationId !== null) {
    assertText(component.stationId, `${name}.stationId`, 64);
  }

  return Object.freeze({ ...component });
};

const validateScoring = (scoring, objectiveIds) => {
  assertExactObjectKeys(scoring, SCORING_FIELDS, "Level.scoring");
  assertExactObjectKeys(
    scoring.objectivePoints,
    objectiveIds,
    "Level.scoring.objectivePoints"
  );

  for (const [id, points] of Object.entries(scoring.objectivePoints)) {
    assertRange(points, 0, 100_000, `objectivePoints.${id}`);
  }

  assertExactObjectKeys(
    scoring.penalties,
    ["coldWake"],
    "Level.scoring.penalties"
  );
  assertExactObjectKeys(
    scoring.penalties.coldWake,
    PENALTY_FIELDS,
    "Level.scoring.penalties.coldWake"
  );
  assertOneOf(
    scoring.penalties.coldWake.formula,
    ["excess-linear"],
    "coldWake.formula"
  );

  for (const field of ["maximumDeduction", "pointsPerUnit", "threshold"]) {
    assertRange(
      scoring.penalties.coldWake[field],
      0,
      100_000,
      `coldWake.${field}`
    );
  }

  assertRange(scoring.minimumTotal, 0, 1_000_000, "minimumTotal");
  assertRange(scoring.maximumTotal, 0, 1_000_000, "maximumTotal");

  if (scoring.minimumTotal > scoring.maximumTotal) {
    throw new ValidationError("minimumTotal must not exceed maximumTotal.");
  }

  assertOneOf(scoring.rounding, ["nearest"], "scoring.rounding");

  return Object.freeze({
    ...scoring,
    controlStability: validateScoreComponent(
      scoring.controlStability,
      "Level.scoring.controlStability",
      ["linear-change-penalty"]
    ),
    intensityManagement: validateScoreComponent(
      scoring.intensityManagement,
      "Level.scoring.intensityManagement",
      ["peak-wind-ratio"]
    ),
    objectivePoints: Object.freeze({ ...scoring.objectivePoints }),
    pathPrecision: validateScoreComponent(
      scoring.pathPrecision,
      "Level.scoring.pathPrecision",
      ["station-distance-linear"]
    ),
    penalties: Object.freeze({
      coldWake: Object.freeze({ ...scoring.penalties.coldWake })
    }),
    timeEfficiency: validateScoreComponent(
      scoring.timeEfficiency,
      "Level.scoring.timeEfficiency",
      ["remaining-time-linear"]
    )
  });
};

export const validateLevel = (input) => {
  assertExactObjectKeys(input, LEVEL_FIELDS, "Level");
  assertInteger(input.schemaVersion, "Level.schemaVersion");

  if (input.schemaVersion !== PROJECT_CONFIG.schemaVersion) {
    throw new ValidationError("Level schemaVersion is unsupported.");
  }

  assertText(input.id, "Level.id", 64);

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(input.id)) {
    throw new ValidationError("Level.id must be lowercase kebab-case.");
  }

  assertText(input.title, "Level.title", 80);
  assertText(input.historicalInspiration, "Level.historicalInspiration", 120);
  assertText(input.disclaimer, "Level.disclaimer", 240);
  assertRange(input.durationHours, 1, 1000, "Level.durationHours");

  if (
    !["string", "number"].includes(typeof input.seed) ||
    String(input.seed).length > 128
  ) {
    throw new ValidationError("Level.seed must be a short string or number.");
  }

  assertExactObjectKeys(input.spawn, SPAWN_FIELDS, "Level.spawn");
  const { bounds } = PROJECT_CONFIG.geography;
  assertRange(input.spawn.lat, bounds.minLat, bounds.maxLat, "spawn.lat");
  assertRange(input.spawn.lon, bounds.minLon, bounds.maxLon, "spawn.lon");
  assertRange(input.spawn.maxWind, 0, 120, "spawn.maxWind");
  assertRange(
    input.spawn.centralPressure,
    800,
    1100,
    "spawn.centralPressure"
  );
  assertRange(input.spawn.galeRadius, 0, 1000, "spawn.galeRadius");
  assertRange(input.spawn.heading, 0, 359.999_999, "spawn.heading");
  assertRange(
    input.spawn.translationSpeed,
    0,
    PROJECT_CONFIG.steeringConfig.maximumTranslationSpeedKmh,
    "spawn.translationSpeed"
  );

  for (const name of ["organization", "symmetry", "moisture"]) {
    assertRange(input.spawn[name], 0, 1, `spawn.${name}`);
  }

  assertOneOf(
    input.spawn.structureStage,
    ["cluster", "spiral", "comma", "eye", "decaying"],
    "spawn.structureStage"
  );
  assertExactObjectKeys(
    input.environmentPreset,
    ENVIRONMENT_CONTROL_NAMES,
    "Level.environmentPreset"
  );

  for (const [name, value] of Object.entries(input.environmentPreset)) {
    const definition = PROJECT_CONFIG.environmentControls[name];
    assertRange(value, definition.minimum, definition.maximum, name);
  }

  assertPlainArray(input.allowedControls, "Level.allowedControls", 32);

  for (const name of input.allowedControls) {
    assertOneOf(name, ENVIRONMENT_CONTROL_NAMES, "allowed control");
  }

  if (new Set(input.allowedControls).size !== input.allowedControls.length) {
    throw new ValidationError("Level.allowedControls must be unique.");
  }

  assertPlainArray(input.objectives, "Level.objectives", 32);
  assertPlainArray(input.bonusObjectives, "Level.bonusObjectives", 32);
  assertPlainArray(input.failureConditions, "Level.failureConditions", 32);
  assertPlainArray(input.referenceZones, "Level.referenceZones", 16);
  assertPlainArray(input.tutorialMessages, "Level.tutorialMessages", 32);

  const objectives = input.objectives.map((rule, index) =>
    validateRule(rule, OBJECTIVE_METRICS, `objectives[${index}]`)
  );
  const bonusObjectives = input.bonusObjectives.map((rule, index) =>
    validateRule(rule, OBJECTIVE_METRICS, `bonusObjectives[${index}]`)
  );
  const failureConditions = input.failureConditions.map((rule, index) =>
    validateRule(rule, FAILURE_METRICS, `failureConditions[${index}]`)
  );
  const ids = [
    ...objectives,
    ...bonusObjectives,
    ...failureConditions
  ].map((rule) => rule.id);

  if (new Set(ids).size !== ids.length) {
    throw new ValidationError("Level rule ids must be unique.");
  }

  const referenceZones = input.referenceZones.map((zone, index) =>
    validateReferenceZone(zone, `referenceZones[${index}]`)
  );
  const zoneIds = referenceZones.map((zone) => zone.id);

  if (new Set(zoneIds).size !== zoneIds.length) {
    throw new ValidationError("Level reference zone ids must be unique.");
  }

  const tutorialMessages = input.tutorialMessages.map((message, index) => {
    assertExactObjectKeys(message, TUTORIAL_FIELDS, `tutorialMessages[${index}]`);
    assertText(message.id, `tutorialMessages[${index}].id`, 64);
    assertText(message.title, `tutorialMessages[${index}].title`, 80);
    assertText(message.body, `tutorialMessages[${index}].body`, 360);
    assertInteger(message.triggerStep, `tutorialMessages[${index}].triggerStep`);
    assertRange(
      message.triggerStep,
      0,
      input.durationHours * 6,
      `tutorialMessages[${index}].triggerStep`
    );
    return Object.freeze({ ...message });
  });
  const objectiveIds = [...objectives, ...bonusObjectives].map(
    (rule) => rule.id
  );

  return Object.freeze({
    ...input,
    allowedControls: Object.freeze([...input.allowedControls]),
    bonusObjectives: Object.freeze(bonusObjectives),
    environmentPreset: Object.freeze({ ...input.environmentPreset }),
    failureConditions: Object.freeze(failureConditions),
    objectives: Object.freeze(objectives),
    referenceZones: Object.freeze(referenceZones),
    scoring: validateScoring(input.scoring, objectiveIds),
    seed: String(input.seed),
    spawn: Object.freeze({ ...input.spawn }),
    tutorialMessages: Object.freeze(tutorialMessages)
  });
};

const rule = (overrides) =>
  Object.freeze({
    aggregation: "current",
    description: "",
    durationSteps: 1,
    duringEvent: null,
    id: "",
    label: "",
    metric: "",
    once: true,
    operator: ">=",
    prerequisite: null,
    radiusKm: null,
    reference: null,
    subject: null,
    threshold: 0,
    unit: "",
    windowSteps: null,
    ...overrides
  });

export const NAHA_STORM_LEVEL = validateLevel({
  allowedControls: [
    "subtropicalHighIntensity",
    "subtropicalHighWestwardExtent",
    "subtropicalHighRidgeLatitude",
    "southwestMonsoonIntensity",
    "southwestMonsoonMoisture",
    "verticalWindShear"
  ],
  bonusObjectives: [],
  disclaimer: "歷史靈感關卡，非歷史重建；模型數值不是官方觀測或預報。",
  durationHours: 168,
  environmentPreset: {
    southwestMonsoonIntensity: 0.52,
    southwestMonsoonMoisture: 0.9,
    subtropicalHighIntensity: 0.82,
    subtropicalHighRidgeLatitude: 28,
    subtropicalHighWestwardExtent: 124,
    verticalWindShear: 5
  },
  failureConditions: [
    rule({
      aggregation: "any",
      description: "颱風中心碰到模擬範圍邊界。",
      id: "leave-map",
      label: "離開地圖",
      metric: "simulation.boundaryReached",
      operator: "==",
      threshold: true,
      unit: "boolean"
    }),
    rule({
      description: "最大風速低於 8 m/s 並連續維持 12 小時。",
      durationSteps: 72,
      id: "dissipated",
      label: "持續消散",
      metric: "storm.maxWind",
      operator: "<",
      threshold: 8,
      unit: "m/s"
    }),
    rule({
      description: "超過 168 模擬小時仍未完成全部主要目標。",
      id: "time-limit",
      label: "超過時限",
      metric: "simulation.minutes",
      operator: ">=",
      threshold: 10_080,
      unit: "min"
    }),
    rule({
      aggregation: "any",
      description: "抵達琉球目標區之前先登陸中國大陸。",
      id: "china-before-ryukyu",
      label: "先抵達中國大陸",
      metric: "event.regionEnteredBeforeZone",
      operator: "==",
      reference: "ryukyu",
      subject: "china-mainland",
      threshold: true,
      unit: "boolean"
    })
  ],
  historicalInspiration: "2018 潭美",
  id: "naha-storm",
  objectives: [
    rule({
      aggregation: "minimum",
      description: "讓颱風中心進入那霸測站 50 km 內。",
      id: "naha-proximity",
      label: "中心接近那霸",
      metric: "storm.distanceToStation",
      operator: "<=",
      subject: "naha",
      threshold: 50,
      unit: "km"
    }),
    rule({
      aggregation: "maximum",
      description: "由正式測站模型計算的那霸最大陣風達 45 m/s。",
      id: "naha-gust",
      label: "那霸強風",
      metric: "station.gust",
      operator: ">=",
      subject: "naha",
      threshold: 45,
      unit: "m/s"
    }),
    rule({
      aggregation: "maximum",
      description: "由每 10 分鐘雨率積分的那霸累積雨量達 250 mm。",
      id: "naha-rain",
      label: "那霸累積降雨",
      metric: "station.accumulatedRain",
      operator: ">=",
      subject: "naha",
      threshold: 250,
      unit: "mm"
    }),
    rule({
      aggregation: "maximum",
      description: "中心進入那霸 150 km 時，最大風速至少 33 m/s。",
      id: "naha-strength",
      label: "接近時維持強度",
      metric: "storm.maxWindWithinStationRadius",
      operator: ">=",
      radiusKm: 150,
      subject: "naha",
      threshold: 33,
      unit: "m/s"
    })
  ],
  referenceZones: [
    {
      id: "ryukyu",
      radiusKm: 150,
      regionPrefixes: ["ryukyu-"],
      stationId: "naha"
    }
  ],
  schemaVersion: 1,
  scoring: {
    controlStability: {
      cutoffKm: null,
      formula: "linear-change-penalty",
      maximumChanges: 24,
      maximumPoints: 500,
      stationId: null,
      targetWind: null
    },
    intensityManagement: {
      cutoffKm: null,
      formula: "peak-wind-ratio",
      maximumChanges: null,
      maximumPoints: 500,
      stationId: null,
      targetWind: 45
    },
    maximumTotal: 6250,
    minimumTotal: 0,
    objectivePoints: {
      "naha-gust": 1000,
      "naha-proximity": 1000,
      "naha-rain": 1000,
      "naha-strength": 1000
    },
    pathPrecision: {
      cutoffKm: 500,
      formula: "station-distance-linear",
      maximumChanges: null,
      maximumPoints: 500,
      stationId: "naha",
      targetWind: null
    },
    penalties: {
      coldWake: {
        formula: "excess-linear",
        maximumDeduction: 250,
        pointsPerUnit: 100,
        threshold: 2
      }
    },
    rounding: "nearest",
    timeEfficiency: {
      cutoffKm: null,
      formula: "remaining-time-linear",
      maximumChanges: null,
      maximumPoints: 750,
      stationId: null,
      targetWind: null
    }
  },
  seed: "naha-storm-201809",
  spawn: {
    centralPressure: 1005,
    galeRadius: 80,
    heading: 305,
    lat: 14,
    lon: 145,
    maxWind: 15,
    moisture: 0.72,
    organization: 0.28,
    structureStage: "cluster",
    symmetry: 0.34,
    translationSpeed: 12
  },
  title: "那霸風雨",
  tutorialMessages: [
    {
      body: "副高較強且向西伸時，會提供偏西導引；環境需要數小時才會回應。",
      id: "high-guidance",
      title: "先觀察副高",
      triggerStep: 0
    },
    {
      body: "保持低風切與充足水氣，讓初始擾動逐步組織，不能直接增加風速。",
      id: "intensity-balance",
      title: "管理強度",
      triggerStep: 72
    },
    {
      body: "慢速強颱會攪拌海洋形成冷水尾流，可能反過來抑制強度與降雨。",
      id: "cold-wake",
      title: "留意冷水尾流",
      triggerStep: 360
    }
  ]
});

export const LEVELS = Object.freeze([NAHA_STORM_LEVEL]);

export const getLevelById = (id) =>
  LEVELS.find((level) => level.id === id) ?? null;

import { PROJECT_CONFIG } from "../config.js";
import {
  ValidationError,
  assertExactObjectKeys,
  assertFiniteNumber,
  assertInteger,
  assertOneOf
} from "../utils/validation.js";

export const OBJECTIVE_METRICS = Object.freeze([
  "event.centralMountainCrossed",
  "event.landfallCoastOccurred",
  "event.landfallCount",
  "event.seaReentryCoastOccurred",
  "station.groupAccumulatedRain",
  "station.groupMaximumGust",
  "station.groupRainThresholdCount",
  "storm.distanceToStation",
  "storm.maximumWindAfterFirstSeaReentry",
  "storm.maximumWindBeforeFirstLandfall",
  "storm.minimumPressureBeforeFirstLandfall",
  "station.gust",
  "station.accumulatedRain",
  "storm.maxWindWithinStationRadius",
  "warningZone.entryCount",
  "warningZone.minimumEntryPeakWind",
  "warningZone.stationGroupAccumulatedRain",
  "warningZone.stationGroupMaximumGust"
]);

export const FAILURE_METRICS = Object.freeze([
  "simulation.boundaryReached",
  "storm.maxWind",
  "storm.inlandDepthInRegion",
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
  "oceanCoolingMultiplier",
  "referenceZones",
  "schemaVersion",
  "scoring",
  "seed",
  "spawn",
  "stationGroups",
  "steeringMeridionalMultiplier",
  "title",
  "tutorialMessages",
  "warningZones"
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
const STATION_GROUP_FIELDS = Object.freeze(["id", "stationIds"]);
const WARNING_ZONE_FIELDS = Object.freeze([
  "center",
  "id",
  "insideSteps",
  "outsideSteps",
  "stationGroupId",
  "radiusKm"
]);
const WARNING_ZONE_CENTER_FIELDS = Object.freeze(["lat", "lon"]);
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

const validateStationGroup = (group, name) => {
  assertExactObjectKeys(group, STATION_GROUP_FIELDS, name);
  assertText(group.id, `${name}.id`, 64);
  assertPlainArray(group.stationIds, `${name}.stationIds`, 64);

  if (group.stationIds.length === 0) {
    throw new ValidationError(`${name}.stationIds must not be empty.`);
  }

  for (const stationId of group.stationIds) {
    assertText(stationId, `${name}.stationIds[]`, 64);
  }

  if (new Set(group.stationIds).size !== group.stationIds.length) {
    throw new ValidationError(`${name}.stationIds must be unique.`);
  }

  return Object.freeze({
    ...group,
    stationIds: Object.freeze([...group.stationIds])
  });
};

const validateWarningZone = (zone, stationGroupIds, name) => {
  assertExactObjectKeys(zone, WARNING_ZONE_FIELDS, name);
  assertText(zone.id, `${name}.id`, 64);
  assertExactObjectKeys(zone.center, WARNING_ZONE_CENTER_FIELDS, `${name}.center`);
  const { bounds } = PROJECT_CONFIG.geography;
  assertRange(zone.center.lat, bounds.minLat, bounds.maxLat, `${name}.center.lat`);
  assertRange(zone.center.lon, bounds.minLon, bounds.maxLon, `${name}.center.lon`);
  assertRange(zone.radiusKm, 0.1, 5000, `${name}.radiusKm`);
  assertInteger(zone.insideSteps, `${name}.insideSteps`);
  assertRange(zone.insideSteps, 1, 100_000, `${name}.insideSteps`);
  assertInteger(zone.outsideSteps, `${name}.outsideSteps`);
  assertRange(zone.outsideSteps, 1, 100_000, `${name}.outsideSteps`);
  assertOneOf(zone.stationGroupId, stationGroupIds, `${name}.stationGroupId`);

  return Object.freeze({
    ...zone,
    center: Object.freeze({ ...zone.center })
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
  assertRange(
    input.oceanCoolingMultiplier,
    0,
    2,
    "Level.oceanCoolingMultiplier"
  );
  assertRange(
    input.steeringMeridionalMultiplier,
    0.05,
    2,
    "Level.steeringMeridionalMultiplier"
  );

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
  assertPlainArray(input.stationGroups, "Level.stationGroups", 16);
  assertPlainArray(input.tutorialMessages, "Level.tutorialMessages", 32);
  assertPlainArray(input.warningZones, "Level.warningZones", 16);

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

  const stationGroups = input.stationGroups.map((group, index) =>
    validateStationGroup(group, `stationGroups[${index}]`)
  );
  const stationGroupIds = stationGroups.map((group) => group.id);

  if (new Set(stationGroupIds).size !== stationGroupIds.length) {
    throw new ValidationError("Level station group ids must be unique.");
  }

  const warningZones = input.warningZones.map((zone, index) =>
    validateWarningZone(zone, stationGroupIds, `warningZones[${index}]`)
  );
  const warningZoneIds = warningZones.map((zone) => zone.id);

  if (new Set(warningZoneIds).size !== warningZoneIds.length) {
    throw new ValidationError("Level warning zone ids must be unique.");
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
    stationGroups: Object.freeze(stationGroups),
    tutorialMessages: Object.freeze(tutorialMessages),
    warningZones: Object.freeze(warningZones)
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
  oceanCoolingMultiplier: 1,
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
  stationGroups: [],
  steeringMeridionalMultiplier: 1,
  tutorialMessages: [
    {
      body: "太平洋副熱帶高壓較強且向西伸展時，會提供偏西導引；環境需要數小時才會回應。",
      id: "high-guidance",
      title: "先觀察太平洋副熱帶高壓",
      triggerStep: 0
    },
    {
      body: "保持較弱的垂直風切與充足水氣，讓初始擾動逐步組織，不能直接增加風速。",
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
  ],
  warningZones: []
});

export const MOUNTAIN_SHIELD_LEVEL = validateLevel({
  allowedControls: [
    "subtropicalHighIntensity",
    "subtropicalHighWestwardExtent",
    "subtropicalHighRidgeLatitude",
    "southwestMonsoonIntensity",
    "southwestMonsoonMoisture",
    "verticalWindShear"
  ],
  bonusObjectives: [
    rule({
      aggregation: "minimum",
      description: "首次登陸臺灣前最低中心氣壓低於 940 hPa。",
      id: "pre-landfall-pressure",
      label: "登陸前深度增強",
      metric: "storm.minimumPressureBeforeFirstLandfall",
      operator: "<",
      subject: "taiwan-main",
      threshold: 940,
      unit: "hPa"
    }),
    rule({
      aggregation: "maximum",
      description: "花蓮測站最大陣風達 45 m/s。",
      id: "hualien-gust",
      label: "花蓮強陣風",
      metric: "station.gust",
      operator: ">=",
      subject: "hualien",
      threshold: 45,
      unit: "m/s"
    }),
    rule({
      aggregation: "maximum",
      description: "首次由臺灣西岸出海後重新增強至 25 m/s。",
      id: "post-exit-reintensification",
      label: "出海後再增強",
      metric: "storm.maximumWindAfterFirstSeaReentry",
      operator: ">=",
      subject: "taiwan-main",
      threshold: 25,
      unit: "m/s"
    }),
    rule({
      aggregation: "maximum",
      description: "北部與中部代表站同時達 200 mm 累積雨量。",
      id: "north-central-heavy-rain",
      label: "北中部同步豪雨",
      metric: "station.groupRainThresholdCount",
      operator: ">=",
      radiusKm: 200,
      subject: "north-central",
      threshold: 2,
      unit: "stations"
    })
  ],
  disclaimer: "歷史靈感關卡，非歷史重建；模型數值不是官方觀測或預報。",
  durationHours: 216,
  environmentPreset: {
    southwestMonsoonIntensity: 0.58,
    southwestMonsoonMoisture: 0.94,
    subtropicalHighIntensity: 0.9,
    subtropicalHighRidgeLatitude: 27,
    subtropicalHighWestwardExtent: 132,
    verticalWindShear: 4
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
      description: "最大風速低於 8 m/s 並連續維持 18 小時。",
      durationSteps: 108,
      id: "dissipated",
      label: "持續消散",
      metric: "storm.maxWind",
      operator: "<",
      threshold: 8,
      unit: "m/s"
    }),
    rule({
      description: "超過 216 模擬小時仍未完成全部主要目標。",
      id: "time-limit",
      label: "超過時限",
      metric: "simulation.minutes",
      operator: ">=",
      threshold: 12_960,
      unit: "min"
    })
  ],
  historicalInspiration: "2015 蘇迪勒",
  id: "mountain-shield",
  objectives: [
    rule({
      aggregation: "any",
      description: "颱風中心由臺灣東岸登陸。",
      id: "east-landfall",
      label: "東岸登陸",
      metric: "event.landfallCoastOccurred",
      operator: "==",
      subject: "east",
      threshold: true,
      unit: "boolean"
    }),
    rule({
      aggregation: "any",
      description: "穿越臺灣後由西岸出海。",
      id: "west-sea-reentry",
      label: "西岸出海",
      metric: "event.seaReentryCoastOccurred",
      operator: "==",
      prerequisite: "east-landfall",
      subject: "west",
      threshold: true,
      unit: "boolean"
    }),
    rule({
      aggregation: "maximum",
      description: "首次登陸臺灣前最大風速達 48 m/s。",
      id: "pre-landfall-wind",
      label: "登陸前強度",
      metric: "storm.maximumWindBeforeFirstLandfall",
      operator: ">=",
      subject: "taiwan-main",
      threshold: 48,
      unit: "m/s"
    }),
    rule({
      aggregation: "any",
      description: "路徑實際穿越中央山脈地形帶。",
      id: "central-mountain-crossing",
      label: "穿越中央山脈",
      metric: "event.centralMountainCrossed",
      operator: "==",
      threshold: true,
      unit: "boolean"
    }),
    rule({
      aggregation: "maximum",
      description: "中部代表站群最大陣風達 35 m/s。",
      id: "central-gust",
      label: "中部強陣風",
      metric: "station.groupMaximumGust",
      operator: ">=",
      subject: "central",
      threshold: 35,
      unit: "m/s"
    }),
    rule({
      aggregation: "maximum",
      description: "中央山區代表站累積雨量達 600 mm。",
      id: "central-mountain-rain",
      label: "中央山區豪雨",
      metric: "station.groupAccumulatedRain",
      operator: ">=",
      subject: "central-mountain",
      threshold: 600,
      unit: "mm"
    })
  ],
  oceanCoolingMultiplier: 1,
  referenceZones: [],
  schemaVersion: 1,
  scoring: {
    controlStability: {
      cutoffKm: null, formula: "linear-change-penalty", maximumChanges: 30,
      maximumPoints: 500, stationId: null, targetWind: null
    },
    intensityManagement: {
      cutoffKm: null, formula: "peak-wind-ratio", maximumChanges: null,
      maximumPoints: 500, stationId: null, targetWind: 48
    },
    maximumTotal: 8750,
    minimumTotal: 0,
    objectivePoints: {
      "central-gust": 1000,
      "central-mountain-crossing": 1000,
      "central-mountain-rain": 1000,
      "east-landfall": 1000,
      "hualien-gust": 500,
      "north-central-heavy-rain": 500,
      "post-exit-reintensification": 500,
      "pre-landfall-pressure": 500,
      "pre-landfall-wind": 1000,
      "west-sea-reentry": 1000
    },
    pathPrecision: {
      cutoffKm: 500, formula: "station-distance-linear", maximumChanges: null,
      maximumPoints: 500, stationId: "hualien", targetWind: null
    },
    penalties: {
      coldWake: {
        formula: "excess-linear", maximumDeduction: 250,
        pointsPerUnit: 100, threshold: 2
      }
    },
    rounding: "nearest",
    timeEfficiency: {
      cutoffKm: null, formula: "remaining-time-linear", maximumChanges: null,
      maximumPoints: 750, stationId: null, targetWind: null
    }
  },
  seed: "mountain-shield-201508",
  spawn: {
    centralPressure: 1004,
    galeRadius: 90,
    heading: 285,
    lat: 13.6,
    lon: 159.3,
    maxWind: 16,
    moisture: 0.76,
    organization: 0.4,
    structureStage: "cluster",
    symmetry: 0.42,
    translationSpeed: 13
  },
  stationGroups: [
    { id: "central", stationIds: ["taichung", "sun-moon-lake"] },
    { id: "central-mountain", stationIds: ["sun-moon-lake"] },
    { id: "north-central", stationIds: ["taipei", "taichung"] }
  ],
  steeringMeridionalMultiplier: 1,
  title: "護國神山",
  tutorialMessages: [
    {
      body: "引導颱風由東岸接近；中央山脈會顯著削弱結構，也可能在背風側重新組織。",
      id: "east-approach",
      title: "瞄準東岸",
      triggerStep: 0
    },
    {
      body: "充足西南季風水氣會放大迎風坡降雨，但慢速移動也會增加冷水尾流。",
      id: "terrain-rain",
      title: "地形與水氣",
      triggerStep: 360
    }
  ],
  warningZones: []
});

export const WAYNE_THREE_ENTRIES_LEVEL = validateLevel({
  allowedControls: [
    "subtropicalHighIntensity",
    "subtropicalHighWestwardExtent",
    "subtropicalHighRidgeLatitude",
    "southwestMonsoonIntensity",
    "southwestMonsoonMoisture",
    "verticalWindShear"
  ],
  bonusObjectives: [],
  disclaimer: "歷史靈感關卡，非歷史重建；警戒圈為教育用途，不代表官方警報或預報。",
  durationHours: 360,
  environmentPreset: {
    southwestMonsoonIntensity: 0.65,
    southwestMonsoonMoisture: 0.92,
    subtropicalHighIntensity: 0.38,
    subtropicalHighRidgeLatitude: 25,
    subtropicalHighWestwardExtent: 119,
    verticalWindShear: 6
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
      description: "最大風速低於 8 m/s 並連續維持 18 小時。",
      durationSteps: 108,
      id: "dissipated",
      label: "持續消散",
      metric: "storm.maxWind",
      operator: "<",
      threshold: 8,
      unit: "m/s"
    }),
    rule({
      description: "中心進入中國大陸後深入內陸超過 300 km。",
      id: "china-inland",
      label: "深入中國內陸",
      metric: "storm.inlandDepthInRegion",
      operator: ">",
      subject: "china-mainland",
      threshold: 300,
      unit: "km"
    }),
    rule({
      description: "超過 360 模擬小時仍未完成全部主要目標。",
      id: "time-limit",
      label: "超過時限",
      metric: "simulation.minutes",
      operator: ">=",
      threshold: 21_600,
      unit: "min"
    })
  ],
  historicalInspiration: "1986 韋恩",
  id: "wayne-three-entries",
  objectives: [
    rule({
      aggregation: "maximum",
      description: "符合圈外 36 步、圈內 18 步與再次圈外 36 步的有效進圈共三次。",
      id: "three-valid-entries",
      label: "三次有效進圈",
      metric: "warningZone.entryCount",
      operator: ">=",
      subject: "taiwan-warning",
      threshold: 3,
      unit: "entries"
    }),
    rule({
      aggregation: "maximum",
      description: "在三次有效進圈過程中至少兩次登陸臺灣。",
      id: "two-taiwan-landfalls",
      label: "兩次臺灣登陸",
      metric: "event.landfallCount",
      operator: ">=",
      subject: "taiwan-main",
      threshold: 2,
      unit: "landfalls"
    }),
    rule({
      aggregation: "minimum",
      description: "每次有效進圈期間的峰值風速皆至少 28 m/s。",
      id: "entry-strength",
      label: "每次進圈維持強度",
      metric: "warningZone.minimumEntryPeakWind",
      operator: ">=",
      prerequisite: "three-valid-entries",
      subject: "taiwan-warning",
      threshold: 28,
      unit: "m/s"
    }),
    rule({
      aggregation: "maximum",
      description: "三個有效事件期間中央代表站群合計新增雨量達 400 mm。",
      id: "event-central-rain",
      label: "事件期間中央豪雨",
      metric: "warningZone.stationGroupAccumulatedRain",
      operator: ">=",
      subject: "taiwan-warning",
      threshold: 400,
      unit: "mm"
    }),
    rule({
      aggregation: "maximum",
      description: "任一有效事件期間中央代表站群最大陣風達 35 m/s。",
      id: "event-central-gust",
      label: "事件期間中央強陣風",
      metric: "warningZone.stationGroupMaximumGust",
      operator: ">=",
      subject: "taiwan-warning",
      threshold: 35,
      unit: "m/s"
    })
  ],
  oceanCoolingMultiplier: 0,
  referenceZones: [],
  schemaVersion: 1,
  scoring: {
    controlStability: {
      cutoffKm: null, formula: "linear-change-penalty", maximumChanges: 48,
      maximumPoints: 500, stationId: null, targetWind: null
    },
    intensityManagement: {
      cutoffKm: null, formula: "peak-wind-ratio", maximumChanges: null,
      maximumPoints: 500, stationId: null, targetWind: 35
    },
    maximumTotal: 6250,
    minimumTotal: 0,
    objectivePoints: {
      "entry-strength": 1000,
      "event-central-gust": 1000,
      "event-central-rain": 1000,
      "three-valid-entries": 1000,
      "two-taiwan-landfalls": 1000
    },
    pathPrecision: {
      cutoffKm: 600, formula: "station-distance-linear", maximumChanges: null,
      maximumPoints: 500, stationId: "taichung", targetWind: null
    },
    penalties: {
      coldWake: {
        formula: "excess-linear", maximumDeduction: 250,
        pointsPerUnit: 100, threshold: 2
      }
    },
    rounding: "nearest",
    timeEfficiency: {
      cutoffKm: null, formula: "remaining-time-linear", maximumChanges: null,
      maximumPoints: 750, stationId: null, targetWind: null
    }
  },
  seed: "wayne-three-entries-198608",
  spawn: {
    centralPressure: 1002,
    galeRadius: 85,
    heading: 65,
    lat: 16,
    lon: 117,
    maxWind: 18,
    moisture: 0.75,
    organization: 0.32,
    structureStage: "cluster",
    symmetry: 0.35,
    translationSpeed: 15
  },
  stationGroups: [
    { id: "central", stationIds: ["taichung", "sun-moon-lake"] }
  ],
  steeringMeridionalMultiplier: 0.15,
  title: "韋恩三進",
  tutorialMessages: [
    {
      body: "教育警戒圈以北緯 23.70°、東經 120.95°為中心、半徑 400 公里；短暫擦邊不算一次有效進圈。",
      id: "warning-zone",
      title: "先理解警戒圈",
      triggerStep: 0
    },
    {
      body: "必須先在圈外連續 36 步、圈內連續 18 步，再離圈連續 36 步，才能開始計算下一次。",
      id: "entry-debounce",
      title: "三段式狀態",
      triggerStep: 180
    }
  ],
  warningZones: [
    {
      center: { lat: 23.7, lon: 120.95 },
      id: "taiwan-warning",
      insideSteps: 18,
      outsideSteps: 36,
      radiusKm: 400,
      stationGroupId: "central"
    }
  ]
});

export const LEVELS = Object.freeze([
  NAHA_STORM_LEVEL,
  MOUNTAIN_SHIELD_LEVEL,
  WAYNE_THREE_ENTRIES_LEVEL
]);

export const getLevelById = (id) =>
  LEVELS.find((level) => level.id === id) ?? null;

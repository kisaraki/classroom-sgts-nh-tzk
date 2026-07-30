import { PROJECT_CONFIG } from "../config.js";
import { clamp, lerp, smoothstep } from "../utils/math.js";
import {
  assertExactObjectKeys,
  assertPositiveNumber
} from "../utils/validation.js";
import { GridCell } from "./GridCell.js";

const ENVIRONMENT_FIELDS = Object.freeze([
  "bounds",
  "cells",
  "controls",
  "gridResolution",
  "southwestMonsoon",
  "subtropicalHigh",
  "targetControls"
]);
const CONTROL_NAMES = Object.freeze(
  Object.keys(PROJECT_CONFIG.environmentControls)
);
const CELL_INTERPOLATION_FIELDS = Object.freeze([
  "SST",
  "OHC",
  "surfacePressure",
  "steeringU",
  "steeringV",
  "verticalWindShear",
  "relativeHumidity",
  "terrainHeight",
  "surfaceRoughness",
  "landFraction",
  "coldWake"
]);

const gridKey = (lat, lon) => `${lat}:${lon}`;

export const createDefaultEnvironmentControls = () =>
  Object.fromEntries(
    CONTROL_NAMES.map((name) => [
      name,
      PROJECT_CONFIG.environmentControls[name].defaultValue
    ])
  );

const validateControlValue = (name, value) => {
  const definition = PROJECT_CONFIG.environmentControls[name];

  if (!definition) {
    throw new TypeError(`Unknown environment control: ${name}.`);
  }

  if (
    !Number.isFinite(value) ||
    value < definition.minimum ||
    value > definition.maximum
  ) {
    throw new RangeError(
      `${name} must be between ${definition.minimum} and ${definition.maximum}.`
    );
  }

  return value;
};

const normalizeControls = (controls = {}) => {
  assertExactObjectKeys(controls, CONTROL_NAMES, "environment controls");
  const defaults = createDefaultEnvironmentControls();

  for (const [name, value] of Object.entries(controls)) {
    defaults[name] = validateControlValue(name, value);
  }

  return defaults;
};

const mirrorSubtropicalHigh = (controls) =>
  Object.freeze({
    intensity: controls.subtropicalHighIntensity,
    ridgeLatitude: controls.subtropicalHighRidgeLatitude,
    westwardExtent: controls.subtropicalHighWestwardExtent
  });

const mirrorSouthwestMonsoon = (controls) => {
  const environmentConfig = PROJECT_CONFIG.environmentConfig;
  const intensity = controls.southwestMonsoonIntensity;

  return Object.freeze({
    intensity,
    moisture: controls.southwestMonsoonMoisture,
    steeringEffect:
      intensity *
      Math.hypot(
        environmentConfig.monsoonUMaximum,
        environmentConfig.monsoonVMaximum
      )
  });
};

export const calculateEnvironmentField = (
  { lat, lon },
  controls,
  { pressureOffset = 0, steeringUOffset = 0, steeringVOffset = 0 } = {}
) => {
  const config = PROJECT_CONFIG.environmentConfig;
  const extentInfluence = smoothstep(
    controls.subtropicalHighWestwardExtent - 2,
    controls.subtropicalHighWestwardExtent +
      config.highInfluenceLongitudeSpan,
    lon
  );
  const southOfRidgeInfluence =
    1 -
    smoothstep(
      controls.subtropicalHighRidgeLatitude - 2,
      controls.subtropicalHighRidgeLatitude +
        config.highInfluenceLatitudeSpan,
      lat
    );
  const recurvatureInfluence =
    (1 - extentInfluence) *
    smoothstep(8, controls.subtropicalHighRidgeLatitude, lat);
  const highIntensity = controls.subtropicalHighIntensity;
  const highU =
    -config.highWestwardFlowMaximum *
      highIntensity *
      extentInfluence *
      southOfRidgeInfluence +
    config.highEastwardTurnMaximum * highIntensity * recurvatureInfluence;
  const highV =
    config.highPolewardFlowMaximum *
    highIntensity *
    recurvatureInfluence;
  const monsoonSpatialInfluence =
    0.55 + 0.45 * (1 - smoothstep(120, 152, lon));
  const monsoonU =
    config.monsoonUMaximum *
    controls.southwestMonsoonIntensity *
    monsoonSpatialInfluence;
  const monsoonV =
    config.monsoonVMaximum *
    controls.southwestMonsoonIntensity *
    monsoonSpatialInfluence;
  const highCenterLon = Math.max(
    controls.subtropicalHighWestwardExtent +
      config.highInfluenceLongitudeSpan,
    145
  );
  const highDistance = Math.hypot(
    (lon - highCenterLon) / PROJECT_CONFIG.renderingConfig.highRangeLongitudeRadius,
    (lat - controls.subtropicalHighRidgeLatitude) /
      PROJECT_CONFIG.renderingConfig.highRangeLatitudeRadius
  );
  const highPressureInfluence = 1 - smoothstep(0.35, 1.15, highDistance);
  const troughDistance = Math.abs(
    lat - PROJECT_CONFIG.renderingConfig.monsoonTroughLatitude
  );
  const troughInfluence =
    (1 - smoothstep(1, 7, troughDistance)) * monsoonSpatialInfluence;
  const relativeHumidity = clamp(
    config.humidityBase +
      (controls.southwestMonsoonMoisture - config.humidityBase) *
        controls.southwestMonsoonIntensity *
        monsoonSpatialInfluence,
    0,
    1
  );

  return Object.freeze({
    relativeHumidity,
    steeringU:
      config.backgroundFlowU + highU + monsoonU + steeringUOffset,
    steeringV:
      config.backgroundFlowV + highV + monsoonV + steeringVOffset,
    surfacePressure:
      config.baseSurfacePressure +
      config.highPressureAnomalyMaximum *
        highIntensity *
        highPressureInfluence -
      config.monsoonTroughPressureDropMaximum *
        controls.southwestMonsoonIntensity *
        troughInfluence +
      pressureOffset,
    verticalWindShear: controls.verticalWindShear
  });
};

export class Environment {
  #baselines;
  #cellIndex;

  constructor(input = {}) {
    assertExactObjectKeys(input, ENVIRONMENT_FIELDS, "Environment");
    const {
      bounds = PROJECT_CONFIG.geography.bounds,
      cells = [],
      controls = {},
      gridResolution = PROJECT_CONFIG.geography.gridResolutionDegrees,
      southwestMonsoon = {},
      subtropicalHigh = {},
      targetControls = {}
    } = input;

    if (!Array.isArray(cells) || !cells.every((cell) => cell instanceof GridCell)) {
      throw new TypeError("Environment cells must be GridCell instances.");
    }

    assertPositiveNumber(gridResolution, "gridResolution");
    const actualOverrides = {
      ...controls,
      ...(subtropicalHigh.intensity === undefined
        ? {}
        : { subtropicalHighIntensity: subtropicalHigh.intensity }),
      ...(subtropicalHigh.ridgeLatitude === undefined
        ? {}
        : { subtropicalHighRidgeLatitude: subtropicalHigh.ridgeLatitude }),
      ...(subtropicalHigh.westwardExtent === undefined
        ? {}
        : { subtropicalHighWestwardExtent: subtropicalHigh.westwardExtent }),
      ...(southwestMonsoon.intensity === undefined
        ? {}
        : { southwestMonsoonIntensity: southwestMonsoon.intensity }),
      ...(southwestMonsoon.moisture === undefined
        ? {}
        : { southwestMonsoonMoisture: southwestMonsoon.moisture })
    };

    this.bounds = Object.freeze({ ...bounds });
    this.gridResolution = gridResolution;
    this.cells = Object.freeze([...cells]);
    this.controls = normalizeControls(actualOverrides);
    this.targetControls = normalizeControls({
      ...this.controls,
      ...targetControls
    });
    this.subtropicalHigh = mirrorSubtropicalHigh(this.controls);
    this.southwestMonsoon = mirrorSouthwestMonsoon(this.controls);
    this.#cellIndex = new Map(
      this.cells.map((cell) => [gridKey(cell.lat, cell.lon), cell])
    );
    const config = PROJECT_CONFIG.environmentConfig;
    this.#baselines = new Map(
      this.cells.map((cell) => [
        gridKey(cell.lat, cell.lon),
        Object.freeze({
          pressureOffset: cell.surfacePressure - config.baseSurfacePressure,
          steeringUOffset: cell.steeringU,
          steeringVOffset: cell.steeringV
        })
      ])
    );
    this.#refreshCells();
  }

  getControlState(name) {
    validateControlValue(name, this.controls[name]);
    const actual = this.controls[name];
    const target = this.targetControls[name];

    return Object.freeze({
      actual,
      responseHours: PROJECT_CONFIG.environmentControls[name].responseHours,
      target,
      trend: Math.sign(target - actual)
    });
  }

  setTargetControl(name, value) {
    validateControlValue(name, value);
    this.targetControls = {
      ...this.targetControls,
      [name]: value
    };
  }

  setTargetControls(values) {
    assertExactObjectKeys(values, CONTROL_NAMES, "target controls");

    for (const [name, value] of Object.entries(values)) {
      validateControlValue(name, value);
    }

    this.targetControls = { ...this.targetControls, ...values };
  }

  update(stepMinutes) {
    assertPositiveNumber(stepMinutes, "stepMinutes");
    const stepHours = stepMinutes / 60;
    const nextControls = { ...this.controls };

    for (const name of CONTROL_NAMES) {
      const responseHours =
        PROJECT_CONFIG.environmentControls[name].responseHours;
      const responseFraction = 1 - Math.exp(-stepHours / responseHours);
      nextControls[name] +=
        (this.targetControls[name] - nextControls[name]) * responseFraction;
    }

    this.controls = nextControls;
    this.subtropicalHigh = mirrorSubtropicalHigh(this.controls);
    this.southwestMonsoon = mirrorSouthwestMonsoon(this.controls);
    this.#refreshCells();

    return this.controlSnapshot();
  }

  sampleAt(point) {
    const lat = clamp(point.lat, this.bounds.minLat, this.bounds.maxLat);
    const lon = clamp(point.lon, this.bounds.minLon, this.bounds.maxLon);
    const resolution = this.gridResolution;
    const lat0 =
      Math.floor((lat - this.bounds.minLat) / resolution) * resolution +
      this.bounds.minLat;
    const lon0 =
      Math.floor((lon - this.bounds.minLon) / resolution) * resolution +
      this.bounds.minLon;
    const lat1 = Math.min(this.bounds.maxLat, lat0 + resolution);
    const lon1 = Math.min(this.bounds.maxLon, lon0 + resolution);
    const corners = [
      this.#requireCell(lat0, lon0),
      this.#requireCell(lat0, lon1),
      this.#requireCell(lat1, lon0),
      this.#requireCell(lat1, lon1)
    ];
    const latAmount = lat1 === lat0 ? 0 : (lat - lat0) / (lat1 - lat0);
    const lonAmount = lon1 === lon0 ? 0 : (lon - lon0) / (lon1 - lon0);
    const values = Object.fromEntries(
      CELL_INTERPOLATION_FIELDS.map((field) => {
        const south = lerp(corners[0][field], corners[1][field], lonAmount);
        const north = lerp(corners[2][field], corners[3][field], lonAmount);
        return [field, lerp(south, north, latAmount)];
      })
    );

    return new GridCell({ ...values, lat, lon });
  }

  controlSnapshot() {
    return Object.freeze({
      controls: Object.freeze({ ...this.controls }),
      southwestMonsoon: this.southwestMonsoon,
      subtropicalHigh: this.subtropicalHigh,
      targetControls: Object.freeze({ ...this.targetControls })
    });
  }

  snapshot() {
    return Object.freeze({
      bounds: this.bounds,
      cells: Object.freeze(this.cells.map((cell) => cell.snapshot())),
      ...this.controlSnapshot(),
      gridResolution: this.gridResolution
    });
  }

  #refreshCells() {
    for (const cell of this.cells) {
      cell.applyEnvironmentUpdate(
        calculateEnvironmentField(
          cell,
          this.controls,
          this.#baselines.get(gridKey(cell.lat, cell.lon))
        )
      );
    }
  }

  #requireCell(lat, lon) {
    const cell = this.#cellIndex.get(gridKey(lat, lon));

    if (!cell) {
      throw new RangeError(`Environment grid is missing ${lat}, ${lon}.`);
    }

    return cell;
  }
}

export const createEnvironmentGrid = ({
  controls = {},
  isLandAt = () => false,
  random,
  targetControls = {}
} = {}) => {
  if (!random || typeof random.nextRange !== "function") {
    throw new TypeError("Environment grid requires a seeded random stream.");
  }

  if (typeof isLandAt !== "function") {
    throw new TypeError("isLandAt must be a function.");
  }

  const config = PROJECT_CONFIG.environmentConfig;
  const bounds = PROJECT_CONFIG.geography.bounds;
  const resolution = PROJECT_CONFIG.geography.gridResolutionDegrees;
  const cells = [];

  for (let lat = bounds.minLat; lat <= bounds.maxLat; lat += resolution) {
    for (let lon = bounds.minLon; lon <= bounds.maxLon; lon += resolution) {
      const landFraction = isLandAt({ lat, lon }) ? 1 : 0;
      cells.push(
        new GridCell({
          OHC: clamp(
            config.baseOceanHeatContent -
              Math.abs(lat - 15) * config.latitudeOceanHeatLoss,
            config.oceanHeatContentMinimum,
            1
          ),
          SST: clamp(
            config.baseSeaSurfaceTemperature -
              Math.max(0, lat - 15) * config.latitudeTemperatureLoss,
            config.seaSurfaceTemperatureMinimum,
            40
          ),
          coldWake: 0,
          landFraction,
          lat,
          lon,
          relativeHumidity: config.humidityBase,
          steeringU: random.nextRange(
            -config.steeringNoiseMaximum,
            config.steeringNoiseMaximum
          ),
          steeringV: random.nextRange(
            -config.steeringNoiseMaximum,
            config.steeringNoiseMaximum
          ),
          surfacePressure:
            config.baseSurfacePressure +
            random.nextRange(
              -config.pressureNoiseMaximum,
              config.pressureNoiseMaximum
            ),
          surfaceRoughness: landFraction
            ? config.roughnessLand
            : config.roughnessOcean,
          terrainHeight: landFraction
            ? config.terrainPlaceholderLandHeight
            : 0,
          verticalWindShear:
            PROJECT_CONFIG.environmentControls.verticalWindShear.defaultValue
        })
      );
    }
  }

  return new Environment({
    bounds,
    cells,
    controls,
    gridResolution: resolution,
    targetControls
  });
};

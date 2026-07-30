import { PROJECT_CONFIG } from "../config.js";
import {
  ValidationError,
  assertExactObjectKeys,
  assertFiniteNumber
} from "../utils/validation.js";

const GRID_CELL_FIELDS = Object.freeze([
  "SST",
  "OHC",
  "coldWake",
  "landFraction",
  "lat",
  "lon",
  "relativeHumidity",
  "steeringU",
  "steeringV",
  "surfacePressure",
  "surfaceRoughness",
  "terrainHeight",
  "verticalWindShear"
]);

const assertRange = (value, minimum, maximum, name) => {
  assertFiniteNumber(value, name);

  if (value < minimum || value > maximum) {
    throw new ValidationError(
      `${name} must be between ${minimum} and ${maximum}.`
    );
  }

  return value;
};

export class GridCell {
  constructor(input) {
    assertExactObjectKeys(input, GRID_CELL_FIELDS, "GridCell");
    const {
      SST,
      OHC,
      coldWake,
      landFraction,
      lat,
      lon,
      relativeHumidity,
      steeringU,
      steeringV,
      surfacePressure,
      surfaceRoughness,
      terrainHeight,
      verticalWindShear
    } = input;
    const { bounds } = PROJECT_CONFIG.geography;
    this.lat = assertRange(lat, bounds.minLat, bounds.maxLat, "lat");
    this.lon = assertRange(lon, bounds.minLon, bounds.maxLon, "lon");
    this.SST = assertRange(SST, -5, 40, "SST");
    this.OHC = assertRange(OHC, 0, 1, "OHC");
    this.surfacePressure = assertRange(
      surfacePressure,
      850,
      1100,
      "surfacePressure"
    );
    this.steeringU = assertRange(steeringU, -100, 100, "steeringU");
    this.steeringV = assertRange(steeringV, -100, 100, "steeringV");
    this.verticalWindShear = assertRange(
      verticalWindShear,
      0,
      100,
      "verticalWindShear"
    );
    this.relativeHumidity = assertRange(
      relativeHumidity,
      0,
      1,
      "relativeHumidity"
    );
    this.terrainHeight = assertRange(
      terrainHeight,
      -500,
      9000,
      "terrainHeight"
    );
    this.surfaceRoughness = assertRange(
      surfaceRoughness,
      0,
      1,
      "surfaceRoughness"
    );
    this.landFraction = assertRange(
      landFraction,
      0,
      1,
      "landFraction"
    );
    this.coldWake = assertRange(coldWake, 0, 15, "coldWake");
  }

  applyEnvironmentUpdate({
    relativeHumidity,
    steeringU,
    steeringV,
    surfacePressure,
    verticalWindShear
  }) {
    this.surfacePressure = assertRange(
      surfacePressure,
      850,
      1100,
      "surfacePressure"
    );
    this.steeringU = assertRange(steeringU, -100, 100, "steeringU");
    this.steeringV = assertRange(steeringV, -100, 100, "steeringV");
    this.verticalWindShear = assertRange(
      verticalWindShear,
      0,
      100,
      "verticalWindShear"
    );
    this.relativeHumidity = assertRange(
      relativeHumidity,
      0,
      1,
      "relativeHumidity"
    );
  }

  applyColdWake(coldWake) {
    this.coldWake = assertRange(coldWake, 0, 15, "coldWake");
  }

  snapshot() {
    return Object.freeze({
      OHC: this.OHC,
      SST: this.SST,
      coldWake: this.coldWake,
      landFraction: this.landFraction,
      lat: this.lat,
      lon: this.lon,
      relativeHumidity: this.relativeHumidity,
      steeringU: this.steeringU,
      steeringV: this.steeringV,
      surfacePressure: this.surfacePressure,
      surfaceRoughness: this.surfaceRoughness,
      terrainHeight: this.terrainHeight,
      verticalWindShear: this.verticalWindShear
    });
  }
}

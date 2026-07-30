import { PROJECT_CONFIG } from "../config.js";
import { createFingerprint } from "../utils/random.js";
import {
  ValidationError,
  assertExactObjectKeys,
  assertFiniteNumber,
  assertInteger,
  assertOneOf
} from "../utils/validation.js";

export const STRUCTURE_STAGES = Object.freeze([
  "cluster",
  "spiral",
  "comma",
  "eye",
  "decaying"
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

const cloneEntry = (entry) => Object.freeze({ ...entry });
const TYPHOON_FIELDS = Object.freeze([
  "active",
  "centralPressure",
  "eventHistory",
  "galeRadius",
  "heading",
  "id",
  "isOverLand",
  "lat",
  "lon",
  "maxWind",
  "moisture",
  "name",
  "organization",
  "structureStage",
  "symmetry",
  "trackHistory",
  "translationSpeed"
]);

export class Typhoon {
  constructor(input) {
    assertExactObjectKeys(input, TYPHOON_FIELDS, "Typhoon");
    const {
      active = true,
      centralPressure,
      eventHistory = [],
      galeRadius,
      heading,
      id,
      isOverLand = false,
      lat,
      lon,
      maxWind,
      moisture,
      name,
      organization,
      structureStage,
      symmetry,
      trackHistory = [],
      translationSpeed
    } = input;
    const { bounds } = PROJECT_CONFIG.geography;

    if (typeof id !== "string" || !/^[a-z0-9-]{1,64}$/u.test(id)) {
      throw new ValidationError("id must be 1–64 lowercase kebab-case characters.");
    }

    if (typeof name !== "string" || name.length < 1 || name.length > 64) {
      throw new ValidationError("name must contain 1–64 characters.");
    }

    if (!Array.isArray(trackHistory) || !Array.isArray(eventHistory)) {
      throw new ValidationError("Typhoon histories must be arrays.");
    }

    if (
      trackHistory.length > PROJECT_CONFIG.renderingConfig.trackMaximumPoints ||
      eventHistory.length >
        PROJECT_CONFIG.performanceConfig.eventHistoryMaximumEntries
    ) {
      throw new ValidationError("Typhoon history exceeds its maximum size.");
    }

    this.id = id;
    this.name = name;
    this.lat = assertRange(lat, bounds.minLat, bounds.maxLat, "lat");
    this.lon = assertRange(lon, bounds.minLon, bounds.maxLon, "lon");
    this.maxWind = assertRange(maxWind, 0, 120, "maxWind");
    this.centralPressure = assertRange(
      centralPressure,
      800,
      1100,
      "centralPressure"
    );
    this.galeRadius = assertRange(galeRadius, 0, 1000, "galeRadius");
    this.heading = assertRange(heading, 0, 359.999_999, "heading");
    this.translationSpeed = assertRange(
      translationSpeed,
      0,
      150,
      "translationSpeed"
    );
    this.organization = assertRange(organization, 0, 1, "organization");
    this.symmetry = assertRange(symmetry, 0, 1, "symmetry");
    this.moisture = assertRange(moisture, 0, 1, "moisture");
    this.structureStage = assertOneOf(
      structureStage,
      STRUCTURE_STAGES,
      "structureStage"
    );
    this.isOverLand = Boolean(isOverLand);
    this.active = Boolean(active);
    this.trackHistory = trackHistory.map(cloneEntry);
    this.eventHistory = eventHistory.map(cloneEntry);
  }

  applyIntensityUpdate(update) {
    this.maxWind = update.maxWind;
    this.centralPressure = update.centralPressure;
    this.galeRadius = update.galeRadius;
    this.organization = update.organization;
    this.symmetry = update.symmetry;
    this.moisture = update.moisture;
    this.structureStage = update.structureStage;
    this.isOverLand = update.isOverLand;
    this.active = update.active;
  }

  recordTrack({ simulationMinutes, stepIndex }) {
    assertFiniteNumber(simulationMinutes, "simulationMinutes");
    assertInteger(stepIndex, "stepIndex");
    this.trackHistory.push(
      cloneEntry({
        centralPressure: this.centralPressure,
        lat: this.lat,
        lon: this.lon,
        maxWind: this.maxWind,
        simulationMinutes,
        stepIndex
      })
    );

    const maximum = PROJECT_CONFIG.renderingConfig.trackMaximumPoints;
    if (this.trackHistory.length > maximum) {
      this.trackHistory.splice(0, this.trackHistory.length - maximum);
    }
  }

  recordEvent({ simulationMinutes, stepIndex, type, ...details }) {
    if (typeof type !== "string" || type.length === 0) {
      throw new ValidationError("Typhoon event type must be a non-empty string.");
    }

    assertFiniteNumber(simulationMinutes, "simulationMinutes");
    assertInteger(stepIndex, "stepIndex");
    this.eventHistory.push(
      cloneEntry({ ...details, simulationMinutes, stepIndex, type })
    );

    const maximum =
      PROJECT_CONFIG.performanceConfig.eventHistoryMaximumEntries;
    if (this.eventHistory.length > maximum) {
      this.eventHistory.splice(0, this.eventHistory.length - maximum);
    }
  }

  physicsSnapshot() {
    return Object.freeze({
      active: this.active,
      centralPressure: this.centralPressure,
      galeRadius: this.galeRadius,
      heading: this.heading,
      id: this.id,
      isOverLand: this.isOverLand,
      lat: this.lat,
      lon: this.lon,
      maxWind: this.maxWind,
      moisture: this.moisture,
      name: this.name,
      organization: this.organization,
      structureStage: this.structureStage,
      symmetry: this.symmetry,
      translationSpeed: this.translationSpeed
    });
  }

  fingerprint() {
    return createFingerprint(this.physicsSnapshot());
  }

  snapshot() {
    return Object.freeze({
      ...this.physicsSnapshot(),
      eventHistory: Object.freeze([...this.eventHistory]),
      trackHistory: Object.freeze([...this.trackHistory])
    });
  }
}

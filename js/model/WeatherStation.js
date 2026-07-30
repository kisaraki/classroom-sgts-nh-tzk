import { PROJECT_CONFIG } from "../config.js";
import {
  ValidationError,
  assertExactObjectKeys,
  assertFiniteNumber
} from "../utils/validation.js";

const WEATHER_STATION_FIELDS = Object.freeze([
  "accumulatedRain",
  "elevation",
  "exposure",
  "gust",
  "hourlyRainRate",
  "id",
  "isVirtual",
  "lat",
  "lon",
  "name",
  "region",
  "source",
  "sustainedWind",
  "terrainCorrection",
  "updateSimulationMinutes"
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

const assertText = (value, name) => {
  if (typeof value !== "string" || value.length < 1 || value.length > 128) {
    throw new ValidationError(`${name} must contain 1–128 characters.`);
  }

  return value;
};

export class WeatherStation {
  constructor(input) {
    assertExactObjectKeys(input, WEATHER_STATION_FIELDS, "WeatherStation");
    const {
      accumulatedRain = 0,
      elevation,
      exposure,
      gust = 0,
      hourlyRainRate = 0,
      id,
      isVirtual = false,
      lat,
      lon,
      name,
      region,
      source = {},
      sustainedWind = 0,
      terrainCorrection = 1,
      updateSimulationMinutes = 0
    } = input;
    const { bounds } = PROJECT_CONFIG.geography;

    if (typeof id !== "string" || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(id)) {
      throw new ValidationError("WeatherStation id must be lowercase kebab-case.");
    }

    this.id = id;
    this.name = assertText(name, "name");
    this.lat = assertRange(lat, bounds.minLat, bounds.maxLat, "lat");
    this.lon = assertRange(lon, bounds.minLon, bounds.maxLon, "lon");
    this.elevation = assertRange(elevation, -500, 9000, "elevation");
    this.exposure = assertRange(exposure, 0, 1, "exposure");
    this.region = assertText(region, "region");
    this.isVirtual = Boolean(isVirtual);
    this.source = Object.freeze({ ...source });
    this.sustainedWind = assertRange(sustainedWind, 0, 150, "sustainedWind");
    this.gust = assertRange(gust, 0, 180, "gust");
    this.hourlyRainRate = assertRange(
      hourlyRainRate,
      0,
      500,
      "hourlyRainRate"
    );
    this.accumulatedRain = assertRange(
      accumulatedRain,
      0,
      100_000,
      "accumulatedRain"
    );
    this.terrainCorrection = assertRange(
      terrainCorrection,
      0,
      5,
      "terrainCorrection"
    );
    this.updateSimulationMinutes = assertRange(
      updateSimulationMinutes,
      0,
      Number.MAX_SAFE_INTEGER,
      "updateSimulationMinutes"
    );
  }

  applyObservation({
    gust,
    hourlyRainRate,
    simulationMinutes,
    stepMinutes,
    sustainedWind,
    terrainCorrection
  }) {
    assertRange(stepMinutes, 0, 1440, "stepMinutes");
    this.sustainedWind = assertRange(
      sustainedWind,
      0,
      PROJECT_CONFIG.observationConfig.maximumSustainedWindMps,
      "sustainedWind"
    );
    this.gust = assertRange(
      gust,
      0,
      PROJECT_CONFIG.observationConfig.maximumGustMps,
      "gust"
    );
    this.hourlyRainRate = assertRange(
      hourlyRainRate,
      0,
      PROJECT_CONFIG.rainfallConfig.maximumRainRateMmPerHour,
      "hourlyRainRate"
    );
    this.terrainCorrection = assertRange(
      terrainCorrection,
      0,
      5,
      "terrainCorrection"
    );
    this.accumulatedRain = assertRange(
      this.accumulatedRain + hourlyRainRate * (stepMinutes / 60),
      0,
      100_000,
      "accumulatedRain"
    );
    this.updateSimulationMinutes = assertRange(
      simulationMinutes,
      0,
      Number.MAX_SAFE_INTEGER,
      "simulationMinutes"
    );
  }

  reset() {
    this.sustainedWind = 0;
    this.gust = 0;
    this.hourlyRainRate = 0;
    this.accumulatedRain = 0;
    this.terrainCorrection = 1;
    this.updateSimulationMinutes = 0;
  }

  snapshot() {
    return Object.freeze({
      accumulatedRain: this.accumulatedRain,
      elevation: this.elevation,
      exposure: this.exposure,
      gust: this.gust,
      hourlyRainRate: this.hourlyRainRate,
      id: this.id,
      isVirtual: this.isVirtual,
      lat: this.lat,
      lon: this.lon,
      name: this.name,
      region: this.region,
      source: this.source,
      sustainedWind: this.sustainedWind,
      terrainCorrection: this.terrainCorrection,
      updateSimulationMinutes: this.updateSimulationMinutes
    });
  }
}

export const createWeatherStations = (definitions) =>
  definitions.map(
    (definition) =>
      new WeatherStation({
        ...definition,
        accumulatedRain: 0,
        gust: 0,
        hourlyRainRate: 0,
        sustainedWind: 0,
        terrainCorrection: 1,
        updateSimulationMinutes: 0
      })
  );

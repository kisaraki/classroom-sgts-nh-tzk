import { PROJECT_CONFIG } from "../config.js";
import { WEATHER_STATIONS } from "../data/stations.js";
import { getTerrainProfile } from "../data/terrain.js";
import { Environment } from "../model/Environment.js";
import {
  WeatherStation,
  createWeatherStations
} from "../model/WeatherStation.js";
import { Typhoon } from "../model/Typhoon.js";
import { haversineDistanceKm } from "../utils/geo.js";
import { clamp } from "../utils/math.js";
import { assertPositiveNumber } from "../utils/validation.js";
import { RainfallModel } from "./RainfallModel.js";

export const calculateStationWind = ({ distanceKm, station, terrain, typhoon }) => {
  const config = PROJECT_CONFIG.observationConfig;
  const radiusKm = Math.max(
    PROJECT_CONFIG.modelParameters.galeRadiusMinimum,
    typhoon.galeRadius
  );
  const innerRadiusKm = radiusKm * config.innerWindRadiusFraction;
  const outerDecayKm = radiusKm * config.windDecayRadiusMultiplier;
  const radialWindFactor =
    distanceKm <= innerRadiusKm
      ? 0.82 + 0.18 * (distanceKm / Math.max(innerRadiusKm, 1))
      : Math.exp(-(distanceKm - innerRadiusKm) / outerDecayKm);
  const terrainHeightFactor = clamp(
    terrain.elevation /
      PROJECT_CONFIG.landInteractionConfig.centralMountainHeight,
    0,
    1
  );
  const terrainShelter =
    1 -
    config.terrainShelterMaximum *
      terrainHeightFactor *
      (1 - station.exposure * 0.3);
  const sustainedWind = clamp(
    typhoon.maxWind *
      radialWindFactor *
      station.exposure *
      terrainShelter,
    0,
    config.maximumSustainedWindMps
  );
  const gust = clamp(
    sustainedWind *
      config.gustFactor *
      (1 + terrain.roughness * 0.08),
    0,
    config.maximumGustMps
  );

  return Object.freeze({
    gust,
    radialWindFactor,
    sustainedWind,
    terrainShelter
  });
};

export class ObservationModel {
  #rainfallModel;

  constructor({
    rainfallModel = new RainfallModel(),
    stationDefinitions = WEATHER_STATIONS
  } = {}) {
    if (!(rainfallModel instanceof RainfallModel)) {
      throw new TypeError("ObservationModel requires a RainfallModel.");
    }

    this.#rainfallModel = rainfallModel;
    this.stations = createWeatherStations(stationDefinitions);
  }

  step({
    environment,
    mapData,
    simulationMinutes,
    stepMinutes = PROJECT_CONFIG.simulation.stepMinutes,
    typhoon
  }) {
    if (!(environment instanceof Environment) || !(typhoon instanceof Typhoon)) {
      throw new TypeError("Observation step requires Environment and Typhoon.");
    }

    assertPositiveNumber(stepMinutes, "stepMinutes");
    const observations = [];

    for (const station of this.stations) {
      if (!(station instanceof WeatherStation)) {
        throw new TypeError("Observation stations must be WeatherStation instances.");
      }

      const distanceKm = haversineDistanceKm(typhoon, station);
      const terrain = getTerrainProfile(station, mapData);
      const cell = environment.sampleAt(station);
      const wind = calculateStationWind({
        distanceKm,
        station,
        terrain,
        typhoon
      });
      const rain = this.#rainfallModel.calculate({
        cell,
        environment,
        mapData,
        station,
        typhoon
      });

      station.applyObservation({
        gust: wind.gust,
        hourlyRainRate: rain.hourlyRainRate,
        simulationMinutes,
        stepMinutes,
        sustainedWind: wind.sustainedWind,
        terrainCorrection: rain.terrainLiftFactor
      });
      observations.push(
        Object.freeze({
          distanceKm,
          rain,
          station: station.snapshot(),
          terrain,
          wind
        })
      );
    }

    return Object.freeze(observations);
  }

  reset() {
    for (const station of this.stations) {
      station.reset();
    }
  }

  snapshot() {
    return Object.freeze(this.stations.map((station) => station.snapshot()));
  }
}

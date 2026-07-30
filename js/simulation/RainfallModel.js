import { PROJECT_CONFIG } from "../config.js";
import { TerrainZone, getTerrainProfile } from "../data/terrain.js";
import { GridCell } from "../model/GridCell.js";
import { Typhoon } from "../model/Typhoon.js";
import { haversineDistanceKm } from "../utils/geo.js";
import { clamp } from "../utils/math.js";
import { assertPositiveNumber } from "../utils/validation.js";

export const integrateRainfall = (
  accumulatedRain,
  hourlyRainRate,
  stepMinutes
) => {
  if (
    !Number.isFinite(accumulatedRain) ||
    accumulatedRain < 0 ||
    !Number.isFinite(hourlyRainRate) ||
    hourlyRainRate < 0
  ) {
    throw new RangeError("Rainfall values must be finite and non-negative.");
  }

  assertPositiveNumber(stepMinutes, "stepMinutes");
  return accumulatedRain + hourlyRainRate * (stepMinutes / 60);
};

export const calculateTerrainRainFactor = (
  terrain,
  { steeringU, steeringV }
) => {
  const config = PROJECT_CONFIG.rainfallConfig;

  if (!terrain.isLand || terrain.zone === TerrainZone.GENERIC_LAND) {
    return 1;
  }

  const flowSpeed = Math.hypot(steeringU, steeringV);

  if (flowSpeed < 0.1 || terrain.slopeAspect === "flat") {
    return 1;
  }

  const eastWestAlignment = Math.abs(steeringU) / flowSpeed;
  const heightFactor = clamp(
    terrain.elevation /
      PROJECT_CONFIG.landInteractionConfig.centralMountainHeight,
    0,
    1
  );

  if (terrain.slopeAspect === "valley") {
    return 1 + 0.12 * eastWestAlignment;
  }

  const isWindward =
    (terrain.slopeAspect === "west" && steeringU > 0) ||
    (terrain.slopeAspect === "east" && steeringU < 0);

  if (isWindward) {
    return (
      1 +
      (config.terrainLiftMaximum - 1) *
        heightFactor *
        eastWestAlignment
    );
  }

  return (
    1 -
    (1 - config.rainShadowMinimum) *
      heightFactor *
      eastWestAlignment
  );
};

export class RainfallModel {
  calculate({
    cell,
    environment,
    mapData,
    station,
    typhoon
  }) {
    if (!(typhoon instanceof Typhoon) || !(cell instanceof GridCell)) {
      throw new TypeError("Rainfall calculation requires Typhoon and GridCell.");
    }

    if (!station || !Number.isFinite(station.lat) || !Number.isFinite(station.lon)) {
      throw new TypeError("Rainfall calculation requires a station coordinate.");
    }

    const config = PROJECT_CONFIG.rainfallConfig;
    const distanceKm = haversineDistanceKm(typhoon, station);
    const rainRadiusKm = Math.max(
      config.minimumRainRadiusKm,
      typhoon.galeRadius * config.radialRadiusMultiplier
    );
    const radialRainFactor =
      distanceKm >= rainRadiusKm
        ? 0
        : Math.exp(-2.2 * (distanceKm / rainRadiusKm) ** 2);
    const moistureFactor = clamp(
      (cell.relativeHumidity - 0.35) / 0.55,
      0,
      1
    );
    const intensityFactor = clamp(
      (typhoon.maxWind - PROJECT_CONFIG.modelParameters.minimumWind) / 45,
      0,
      1
    );
    const monsoonFactor =
      1 +
      (environment?.southwestMonsoon?.intensity ?? 0) *
        config.monsoonContribution;
    const terrain = getTerrainProfile(station, mapData);
    const terrainLiftFactor = calculateTerrainRainFactor(terrain, cell);
    const asymmetryFactor =
      config.asymmetryFloor +
      (1 - config.asymmetryFloor) * typhoon.symmetry;
    const coldWakeFactor =
      1 -
      clamp(
        cell.coldWake /
          PROJECT_CONFIG.oceanCoolingConfig.maximumColdWake,
        0,
        1
      ) *
        config.coldWakeRainPenaltyMaximum;
    const hourlyRainRate = clamp(
      config.maximumRainRateMmPerHour *
        radialRainFactor *
        moistureFactor *
        intensityFactor *
        monsoonFactor *
        terrainLiftFactor *
        asymmetryFactor *
        coldWakeFactor,
      0,
      config.maximumRainRateMmPerHour
    );

    return Object.freeze({
      asymmetryFactor,
      coldWakeFactor,
      distanceKm,
      hourlyRainRate,
      intensityFactor,
      moistureFactor,
      monsoonFactor,
      radialRainFactor,
      rainRadiusKm,
      terrain,
      terrainLiftFactor
    });
  }
}

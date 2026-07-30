import { PROJECT_CONFIG } from "../config.js";
import { EventType } from "../core/EventBus.js";
import { getTerrainProfile } from "../data/terrain.js";
import { GridCell } from "../model/GridCell.js";
import { Typhoon } from "../model/Typhoon.js";
import {
  destinationPoint,
  haversineDistanceKm,
  initialBearingDegrees
} from "../utils/geo.js";
import { clamp } from "../utils/math.js";
import { assertPositiveNumber } from "../utils/validation.js";

const freezePoint = (point) => Object.freeze({ lat: point.lat, lon: point.lon });

const coastSideAt = (point, regionId, mapData) => {
  if (regionId !== "taiwan-main") {
    return null;
  }

  const taiwan = mapData.features.find(
    (feature) => feature.properties.regionId === "taiwan-main"
  );
  let nearest = null;

  for (const segment of taiwan?.properties.coastSegments ?? []) {
    for (const [lon, lat] of segment.coordinates) {
      const distanceKm = haversineDistanceKm(point, { lat, lon });

      if (!nearest || distanceKm < nearest.distanceKm) {
        nearest = { coastSide: segment.coastSide, distanceKm };
      }
    }
  }

  return nearest?.coastSide ?? null;
};

const preparePath = (pathPoints) => {
  if (!Array.isArray(pathPoints) || pathPoints.length === 0) {
    throw new TypeError("Land interaction requires path points.");
  }

  const segments = [];
  let totalDistanceKm = 0;

  for (let index = 1; index < pathPoints.length; index += 1) {
    const start = pathPoints[index - 1];
    const end = pathPoints[index];
    const distanceKm = haversineDistanceKm(start, end);

    if (distanceKm > 0) {
      segments.push(
        Object.freeze({
          bearing: initialBearingDegrees(start, end),
          distanceKm,
          end,
          start,
          startDistanceKm: totalDistanceKm
        })
      );
      totalDistanceKm += distanceKm;
    }
  }

  return Object.freeze({
    end: pathPoints.at(-1),
    segments: Object.freeze(segments),
    start: pathPoints[0],
    totalDistanceKm
  });
};

const pointAtDistance = (prepared, distanceKm) => {
  if (prepared.segments.length === 0 || distanceKm <= 0) {
    return freezePoint(prepared.start);
  }

  const segment =
    prepared.segments.find(
      (entry) =>
        distanceKm <= entry.startDistanceKm + entry.distanceKm
    ) ?? prepared.segments.at(-1);
  const localDistance = clamp(
    distanceKm - segment.startDistanceKm,
    0,
    segment.distanceKm
  );

  return destinationPoint(segment.start, localDistance, segment.bearing);
};

export const sampleMovementPath = (
  pathPoints,
  {
    maximumSamples = PROJECT_CONFIG.landInteractionConfig.maximumPathSamples,
    sampleKm = PROJECT_CONFIG.landInteractionConfig.pathSampleKm
  } = {}
) => {
  assertPositiveNumber(maximumSamples, "maximumSamples");
  assertPositiveNumber(sampleKm, "sampleKm");
  const prepared = preparePath(pathPoints);

  if (prepared.totalDistanceKm === 0) {
    return Object.freeze([freezePoint(prepared.start)]);
  }

  const intervalCount = Math.max(
    1,
    Math.min(
      Math.floor(maximumSamples) - 1,
      Math.ceil(prepared.totalDistanceKm / sampleKm)
    )
  );

  return Object.freeze(
    Array.from({ length: intervalCount + 1 }, (_, index) =>
      freezePoint(
        pointAtDistance(
          prepared,
          (prepared.totalDistanceKm * index) / intervalCount
        )
      )
    )
  );
};

export const createLandImpactCell = (cell, diagnostic) => {
  if (!(cell instanceof GridCell)) {
    throw new TypeError("Land impact requires a GridCell.");
  }

  return new GridCell({
    ...cell.snapshot(),
    landFraction: diagnostic.landFraction,
    surfaceRoughness: diagnostic.surfaceRoughness,
    terrainHeight: diagnostic.terrainHeight
  });
};

export class LandInteractionModel {
  #eventBus;
  #isOverLand = null;
  #landfallCount = 0;
  #seaRecoveryHours;
  #seaReentryCount = 0;
  #transitionSequence = 0;
  #terrainMultiplier;

  constructor({ eventBus = null, terrainMultiplier = 1 } = {}) {
    if (
      eventBus !== null &&
      (typeof eventBus.emit !== "function" ||
        typeof eventBus.clearDedupe !== "function")
    ) {
      throw new TypeError("LandInteractionModel eventBus is invalid.");
    }

    if (
      !Number.isFinite(terrainMultiplier) ||
      terrainMultiplier < 0 ||
      terrainMultiplier > 2
    ) {
      throw new RangeError("terrainMultiplier must be between 0 and 2.");
    }

    this.#eventBus = eventBus;
    this.#terrainMultiplier = terrainMultiplier;
    this.#seaRecoveryHours =
      PROJECT_CONFIG.landInteractionConfig.reorganizationDelayHours;
  }

  step({
    mapData,
    pathPoints,
    simulationMinutes,
    stepIndex,
    stepMinutes = PROJECT_CONFIG.simulation.stepMinutes,
    typhoon
  }) {
    if (!(typhoon instanceof Typhoon)) {
      throw new TypeError("Land interaction requires a Typhoon.");
    }

    if (!mapData?.features) {
      throw new TypeError("Land interaction requires map data.");
    }

    assertPositiveNumber(stepMinutes, "stepMinutes");
    const config = PROJECT_CONFIG.landInteractionConfig;
    const stepHours = stepMinutes / 60;
    const samples = sampleMovementPath(pathPoints);
    const profiles = samples.map((point) => getTerrainProfile(point, mapData));
    const events = [];

    if (this.#isOverLand === null) {
      this.#isOverLand = profiles[0].isLand;
    } else if (this.#isOverLand !== profiles[0].isLand) {
      events.push(
        this.#recordTransition({
          mapData,
          point: samples[0],
          profile: profiles[0],
          simulationMinutes,
          stepIndex,
          typhoon
        })
      );
    }

    for (let index = 1; index < samples.length; index += 1) {
      if (profiles[index].isLand !== profiles[index - 1].isLand) {
        events.push(
          this.#recordTransition({
            mapData,
            point: samples[index],
            profile: profiles[index],
            previousProfile: profiles[index - 1],
            simulationMinutes,
            stepIndex,
            typhoon
          })
        );
      }
    }

    const intervals = [];
    let totalDistanceKm = 0;
    let landDistanceKm = 0;
    let terrainDistance = 0;
    let roughnessDistance = 0;

    for (let index = 1; index < samples.length; index += 1) {
      const distanceKm = haversineDistanceKm(
        samples[index - 1],
        samples[index]
      );
      const midpoint = pointAtDistance(
        preparePath([samples[index - 1], samples[index]]),
        distanceKm / 2
      );
      const terrain = getTerrainProfile(midpoint, mapData);
      totalDistanceKm += distanceKm;

      if (terrain.isLand) {
        landDistanceKm += distanceKm;
        terrainDistance += terrain.elevation * distanceKm;
        roughnessDistance += terrain.roughness * distanceKm;
      }

      intervals.push(Object.freeze({ distanceKm, terrain }));
    }

    const endProfile = profiles.at(-1);
    const stationary = totalDistanceKm === 0;
    const landFraction = stationary
      ? Number(endProfile.isLand)
      : landDistanceKm / totalDistanceKm;
    const landHours = stepHours * landFraction;
    const terrainHeight = stationary
      ? endProfile.elevation
      : landDistanceKm === 0
        ? 0
        : terrainDistance / landDistanceKm;
    const surfaceRoughness =
      stationary
        ? endProfile.roughness
        : landDistanceKm === 0
          ? PROJECT_CONFIG.environmentConfig.roughnessOcean
          : roughnessDistance / landDistanceKm;
    const terrainSeverity = clamp(
      (terrainHeight / config.centralMountainHeight) *
        this.#terrainMultiplier,
      0,
      1
    );
    const roughnessSeverity = clamp(surfaceRoughness, 0, 1);
    const windLoss =
      config.windLossPerHour *
      landHours *
      (0.35 + terrainSeverity * 0.65) *
      (0.65 + roughnessSeverity * 0.35);
    const organizationLoss =
      config.organizationLossPerHour *
      landHours *
      (0.4 + terrainSeverity * 0.6);
    const symmetryLoss =
      config.symmetryLossPerHour *
      landHours *
      (0.4 + terrainSeverity * 0.6);

    if (landFraction > 0) {
      this.#seaRecoveryHours = 0;
    } else if (this.#seaRecoveryHours < config.reorganizationDelayHours) {
      this.#seaRecoveryHours = Math.min(
        config.reorganizationDelayHours,
        this.#seaRecoveryHours + stepHours
      );
    }

    const recoveryProgress = clamp(
      this.#seaRecoveryHours / config.reorganizationDelayHours,
      0,
      1
    );
    const reorganizationFactor =
      config.minimumReorganizationFactor +
      (1 - config.minimumReorganizationFactor) * recoveryProgress;

    typhoon.applyLandInteraction({
      isOverLand: endProfile.isLand,
      maxWind: Math.max(
        PROJECT_CONFIG.modelParameters.minimumWind,
        typhoon.maxWind - windLoss
      ),
      organization: clamp(typhoon.organization - organizationLoss, 0, 1),
      symmetry: clamp(typhoon.symmetry - symmetryLoss, 0, 1)
    });

    return Object.freeze({
      endProfile,
      events: Object.freeze(events),
      intervals: Object.freeze(intervals),
      isOverLand: endProfile.isLand,
      landFraction,
      landHours,
      landfallCount: this.#landfallCount,
      organizationLoss,
      reorganizationFactor,
      seaRecoveryHours: this.#seaRecoveryHours,
      seaReentryCount: this.#seaReentryCount,
      surfaceRoughness,
      symmetryLoss,
      terrainHeight,
      windLoss
    });
  }

  reset() {
    this.#isOverLand = null;
    this.#landfallCount = 0;
    this.#seaReentryCount = 0;
    this.#transitionSequence = 0;
    this.#seaRecoveryHours =
      PROJECT_CONFIG.landInteractionConfig.reorganizationDelayHours;
  }

  snapshot() {
    return Object.freeze({
      isOverLand: this.#isOverLand,
      landfallCount: this.#landfallCount,
      seaRecoveryHours: this.#seaRecoveryHours,
      seaReentryCount: this.#seaReentryCount,
      transitionSequence: this.#transitionSequence
    });
  }

  #recordTransition({
    mapData,
    point,
    previousProfile = null,
    profile,
    simulationMinutes,
    stepIndex,
    typhoon
  }) {
    this.#isOverLand = profile.isLand;
    this.#transitionSequence += 1;
    const type = profile.isLand ? EventType.LANDFALL : EventType.SEA_REENTRY;
    const regionId = profile.isLand
      ? profile.regionId
      : previousProfile?.regionId ?? null;

    if (profile.isLand) {
      this.#landfallCount += 1;
      this.#seaRecoveryHours = 0;
    } else {
      this.#seaReentryCount += 1;
      this.#seaRecoveryHours = 0;
    }

    const details = Object.freeze({
      centralPressure: typhoon.centralPressure,
      coastSide: coastSideAt(point, regionId, mapData),
      galeRadius: typhoon.galeRadius,
      heading: typhoon.heading,
      lat: point.lat,
      lon: point.lon,
      maxWind: typhoon.maxWind,
      regionId,
      translationSpeed: typhoon.translationSpeed
    });

    typhoon.recordEvent({
      ...details,
      simulationMinutes,
      stepIndex,
      type
    });
    const event = this.#eventBus?.emit(type, details, {
      dedupeKey:
        `${typhoon.id}:surface:${type}:${this.#transitionSequence}`,
      simulationMinutes,
      sourceId: typhoon.id,
      stepIndex
    });

    return Object.freeze({
      ...details,
      eventId: event?.id ?? null,
      simulationMinutes,
      stepIndex,
      type
    });
  }
}

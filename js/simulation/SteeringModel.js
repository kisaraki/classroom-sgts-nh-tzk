import { PROJECT_CONFIG } from "../config.js";
import { Typhoon } from "../model/Typhoon.js";
import { clamp, smoothstep } from "../utils/math.js";
import { createFingerprint } from "../utils/random.js";
import {
  destinationPoint,
  segmentIntersectsPolygon
} from "../utils/geo.js";
import { assertPositiveNumber } from "../utils/validation.js";

const vectorFromMotion = (heading, speedKmh) => {
  const radians = (heading * Math.PI) / 180;
  const speedMps = speedKmh / 3.6;

  return Object.freeze({
    u: Math.sin(radians) * speedMps,
    v: Math.cos(radians) * speedMps
  });
};

export const headingFromVector = (u, v, fallback = 0) => {
  if (Math.hypot(u, v) < 1e-9) {
    return fallback;
  }

  return ((Math.atan2(u, v) * 180) / Math.PI + 360) % 360;
};

export const subdivideMovementPath = (
  start,
  distanceKm,
  heading,
  maximumSegmentKm = PROJECT_CONFIG.steeringConfig.maximumPathSegmentKm
) => {
  assertPositiveNumber(maximumSegmentKm, "maximumSegmentKm");

  if (distanceKm === 0) {
    return Object.freeze([Object.freeze({ ...start })]);
  }

  assertPositiveNumber(distanceKm, "distanceKm");
  const segmentCount = Math.max(1, Math.ceil(distanceKm / maximumSegmentKm));

  return Object.freeze(
    Array.from({ length: segmentCount + 1 }, (_, index) =>
      destinationPoint(start, (distanceKm * index) / segmentCount, heading)
    )
  );
};

export const findCrossedLandRegions = (points, mapData) => {
  if (!mapData) {
    return Object.freeze([]);
  }

  const crossed = new Set();

  for (let index = 1; index < points.length; index += 1) {
    for (const feature of mapData.features) {
      if (
        segmentIntersectsPolygon(
          points[index - 1],
          points[index],
          feature.geometry.coordinates[0]
        )
      ) {
        crossed.add(feature.properties.regionId);
      }
    }
  }

  return Object.freeze([...crossed]);
};

export class SteeringModel {
  #meridionalMultiplier;
  #random;
  #seed;
  #stepCount = 0;

  constructor({
    meridionalMultiplier = 1,
    random,
    seed = PROJECT_CONFIG.gameBalance.demoSeed
  } = {}) {
    if (!random || typeof random.nextRange !== "function") {
      throw new TypeError("SteeringModel requires a seeded steering stream.");
    }

    if (
      !Number.isFinite(meridionalMultiplier) ||
      meridionalMultiplier < 0.05 ||
      meridionalMultiplier > 2
    ) {
      throw new RangeError("meridionalMultiplier must be between 0.05 and 2.");
    }

    this.#meridionalMultiplier = meridionalMultiplier;
    this.#random = random;
    this.#seed = String(seed);
  }

  step({
    cell,
    environment,
    mapData = null,
    stepMinutes = PROJECT_CONFIG.simulation.stepMinutes,
    typhoon
  }) {
    if (!(typhoon instanceof Typhoon)) {
      throw new TypeError("Steering step requires a Typhoon.");
    }

    if (!cell || !environment) {
      throw new TypeError("Steering step requires a cell and environment.");
    }

    assertPositiveNumber(stepMinutes, "stepMinutes");
    const config = PROJECT_CONFIG.steeringConfig;
    const stepHours = stepMinutes / 60;
    const perturbation = Object.freeze({
      u: this.#random.nextRange(
        -config.perturbationMaximumMps,
        config.perturbationMaximumMps
      ),
      v: this.#random.nextRange(
        -config.perturbationMaximumMps,
        config.perturbationMaximumMps
      )
    });
    const monsoonSpatialInfluence =
      0.55 + 0.45 * (1 - smoothstep(120, 152, typhoon.lon));
    const monsoonV =
      PROJECT_CONFIG.environmentConfig.monsoonVMaximum *
      environment.controls.southwestMonsoonIntensity *
      monsoonSpatialInfluence;
    const components = Object.freeze({
      betaDrift: Object.freeze({
        u: config.betaDriftU,
        v: config.betaDriftV * this.#meridionalMultiplier
      }),
      environment: Object.freeze({
        u: cell.steeringU,
        v:
          monsoonV +
          (cell.steeringV - monsoonV) * this.#meridionalMultiplier
      }),
      perturbation
    });
    const targetVector = Object.freeze({
      u:
        components.environment.u +
        components.betaDrift.u +
        components.perturbation.u,
      v:
        components.environment.v +
        components.betaDrift.v +
        components.perturbation.v
    });
    const previousVector = vectorFromMotion(
      typhoon.heading,
      typhoon.translationSpeed
    );
    const responseFraction = 1 - Math.exp(-stepHours / config.responseHours);
    let actualU =
      previousVector.u + (targetVector.u - previousVector.u) * responseFraction;
    let actualV =
      previousVector.v + (targetVector.v - previousVector.v) * responseFraction;
    const rawSpeedKmh = Math.hypot(actualU, actualV) * 3.6;
    const speedKmh = Math.min(
      rawSpeedKmh,
      config.maximumTranslationSpeedKmh
    );

    if (rawSpeedKmh > config.maximumTranslationSpeedKmh) {
      const scale = config.maximumTranslationSpeedKmh / rawSpeedKmh;
      actualU *= scale;
      actualV *= scale;
    }

    const heading = headingFromVector(actualU, actualV, typhoon.heading);
    const distanceKm = speedKmh * stepHours;
    const start = Object.freeze({ lat: typhoon.lat, lon: typhoon.lon });
    const unboundedPoints = subdivideMovementPath(
      start,
      distanceKm,
      heading
    );
    const { bounds } = environment;
    const points = Object.freeze(
      unboundedPoints.map((point) =>
        Object.freeze({
          lat: clamp(point.lat, bounds.minLat, bounds.maxLat),
          lon: clamp(point.lon, bounds.minLon, bounds.maxLon)
        })
      )
    );
    const end = points.at(-1);
    const unboundedEnd = unboundedPoints.at(-1);
    const boundaryReached =
      end.lat !== unboundedEnd.lat || end.lon !== unboundedEnd.lon;
    const crossedLandRegions = findCrossedLandRegions(points, mapData);

    typhoon.applyMovement({
      heading,
      lat: end.lat,
      lon: end.lon,
      translationSpeed: speedKmh
    });
    this.#stepCount += 1;

    return Object.freeze({
      actualVector: Object.freeze({ u: actualU, v: actualV }),
      boundaryReached,
      components,
      crossedLandRegions,
      distanceKm,
      end,
      fingerprint: this.fingerprint(typhoon),
      heading,
      pathPoints: points,
      speedKmh,
      start,
      targetVector
    });
  }

  fingerprint(typhoon) {
    return createFingerprint({
      modelVersion: PROJECT_CONFIG.modelVersion,
      random: this.#random.snapshot(),
      seed: this.#seed,
      stepCount: this.#stepCount,
      typhoon: typhoon.physicsSnapshot()
    });
  }
}

import { PROJECT_CONFIG } from "../config.js";
import { Environment } from "../model/Environment.js";
import { Typhoon } from "../model/Typhoon.js";
import { haversineDistanceKm } from "../utils/geo.js";
import { clamp } from "../utils/math.js";
import { assertPositiveNumber } from "../utils/validation.js";

export const calculateCoolingPotential = (typhoon, cell) => {
  const config = PROJECT_CONFIG.oceanCoolingConfig;
  const minimumWind = PROJECT_CONFIG.modelParameters.minimumWind;
  const intensity = clamp(
    (typhoon.maxWind - minimumWind) /
      (config.referenceWindMps - minimumWind),
    0,
    1
  );
  const slowMotion =
    1 / (1 + typhoon.translationSpeed / config.slowSpeedScaleKmh);
  const shallowOcean = 1 - cell.OHC * 0.65;
  const thermalHeadroom = clamp(
    (cell.SST - config.minimumEffectiveSST) / 8,
    0,
    1
  );

  return clamp(
    intensity ** 2 *
      slowMotion *
      shallowOcean *
      (0.5 + thermalHeadroom * 0.5),
    0,
    1
  );
};

export class OceanCoolingModel {
  step({
    environment,
    stepMinutes = PROJECT_CONFIG.simulation.stepMinutes,
    typhoon
  }) {
    if (!(environment instanceof Environment)) {
      throw new TypeError("Ocean cooling requires an Environment.");
    }

    if (!(typhoon instanceof Typhoon)) {
      throw new TypeError("Ocean cooling requires a Typhoon.");
    }

    assertPositiveNumber(stepMinutes, "stepMinutes");
    const config = PROJECT_CONFIG.oceanCoolingConfig;
    const stepHours = stepMinutes / 60;
    const recoveryMultiplier = Math.exp(-stepHours / config.recoveryHours);
    const coverageRadiusKm = Math.max(
      config.minimumCoverageRadiusKm,
      typhoon.galeRadius * config.coverageRadiusMultiplier
    );
    let affectedCellCount = 0;
    let maximumColdWake = 0;
    let totalColdWake = 0;

    for (const cell of environment.cells) {
      let coldWake = cell.coldWake * recoveryMultiplier;

      if (typhoon.active && cell.landFraction < 0.5) {
        const distanceKm = haversineDistanceKm(typhoon, cell);

        if (distanceKm <= coverageRadiusKm) {
          const radialFactor = 1 - (distanceKm / coverageRadiusKm) ** 2;
          const cooling =
            config.coolingRateCelsiusPerHour *
            stepHours *
            calculateCoolingPotential(typhoon, cell) *
            radialFactor;
          coldWake += cooling;

          if (cooling > 0) {
            affectedCellCount += 1;
          }
        }
      }

      coldWake = clamp(coldWake, 0, config.maximumColdWake);
      cell.applyColdWake(coldWake);
      maximumColdWake = Math.max(maximumColdWake, coldWake);
      totalColdWake += coldWake;
    }

    const centerCell = environment.sampleAt(typhoon);

    return Object.freeze({
      affectedCellCount,
      centerColdWake: centerCell.coldWake,
      coverageRadiusKm,
      effectiveSST: Math.max(
        config.minimumEffectiveSST,
        centerCell.SST - centerCell.coldWake
      ),
      maximumColdWake,
      meanColdWake: totalColdWake / environment.cells.length
    });
  }

  reset(environment) {
    if (!(environment instanceof Environment)) {
      throw new TypeError("Ocean cooling reset requires an Environment.");
    }

    environment.resetMutableState();
  }
}

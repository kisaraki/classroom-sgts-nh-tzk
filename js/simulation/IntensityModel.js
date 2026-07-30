import { PROJECT_CONFIG } from "../config.js";
import { Typhoon } from "../model/Typhoon.js";
import { GridCell } from "../model/GridCell.js";
import {
  PRNG_VERSION,
  createFingerprint,
  createRandomStreams
} from "../utils/random.js";
import { assertPositiveNumber } from "../utils/validation.js";

const clamp = (value, minimum = 0, maximum = 1) =>
  Math.min(maximum, Math.max(minimum, value));

const smoothStep = (minimum, maximum, value) => {
  if (minimum === maximum) {
    return value >= maximum ? 1 : 0;
  }

  const normalized = clamp((value - minimum) / (maximum - minimum));
  return normalized * normalized * (3 - 2 * normalized);
};

const approach = (current, target, responseHours, stepHours, maximumChange) => {
  const rawChange = ((target - current) / responseHours) * stepHours;
  return clamp(
    current + clamp(rawChange, -maximumChange, maximumChange)
  );
};

export const calculateEnvironmentalFactors = (
  typhoon,
  cell,
  { reorganizationFactor = 1 } = {}
) => {
  if (!(typhoon instanceof Typhoon) || !(cell instanceof GridCell)) {
    throw new TypeError("Environmental factors require Typhoon and GridCell.");
  }

  const constants = PROJECT_CONFIG.physicalConstants;
  const parameters = PROJECT_CONFIG.modelParameters;
  const effectiveSST = cell.SST - cell.coldWake;
  const heat = smoothStep(
    constants.seaSurfaceTemperatureMinimum,
    constants.seaSurfaceTemperatureFull,
    effectiveSST
  );
  const oceanDepth = smoothStep(
    0,
    constants.oceanHeatContentFull,
    cell.OHC
  );
  const coriolisOrganization = smoothStep(
    constants.coriolisMinimumLatitude,
    constants.coriolisFullLatitude,
    Math.abs(typhoon.lat)
  );
  const shear =
    1 -
    smoothStep(
      parameters.shearLowPenalty,
      parameters.shearFullPenalty,
      cell.verticalWindShear
    );
  const moisture = smoothStep(
    parameters.moistureMinimum,
    parameters.moistureFull,
    cell.relativeHumidity
  );
  const land = 1 - cell.landFraction * parameters.landPenaltyMaximum;
  const terrain =
    1 -
    clamp(cell.terrainHeight / parameters.terrainPenaltyHeight) *
      cell.landFraction;
  const coldWake =
    1 -
    smoothStep(0, parameters.coldWakeFullPenalty, cell.coldWake) *
      parameters.coldWakePenaltyMaximum;
  const structure =
    parameters.structurePotentialFloor +
    (1 - parameters.structurePotentialFloor) * typhoon.organization;
  const reorganization = clamp(reorganizationFactor);
  const developmentPotential = clamp(
    heat *
      oceanDepth *
      coriolisOrganization *
      shear *
      moisture *
      land *
      terrain *
      coldWake *
      structure *
      reorganization
  );

  return Object.freeze({
    coldWake,
    coriolisOrganization,
    developmentPotential,
    effectiveSST,
    heat,
    land,
    moisture,
    oceanDepth,
    reorganization,
    shear,
    structure,
    terrain
  });
};

export const mapWindToPressure = (maxWind, organization) => {
  const parameters = PROJECT_CONFIG.modelParameters;
  const windRatio = clamp(
    (maxWind - parameters.minimumWind) /
      (parameters.maximumWind - parameters.minimumWind)
  );
  const organizationScale =
    1 -
    parameters.pressureOrganizationWeight +
    parameters.pressureOrganizationWeight * clamp(organization);
  const pressureDrop =
    (parameters.pressureMaximum - parameters.pressureMinimum) *
    windRatio ** parameters.pressureWindExponent *
    organizationScale;

  return clamp(
    parameters.pressureMaximum - pressureDrop,
    parameters.pressureMinimum,
    parameters.pressureMaximum
  );
};

export const resolveStructureStage = ({
  currentStage,
  developmentPotential,
  maxWind,
  organization,
  symmetry
}) => {
  const threshold = PROJECT_CONFIG.modelParameters.structureHysteresis;

  if (
    developmentPotential <= threshold.decayEnterPotential &&
    maxWind <= threshold.decayEnterWind
  ) {
    return "decaying";
  }

  if (currentStage === "decaying") {
    return developmentPotential >= threshold.decayExitPotential &&
      organization >= threshold.decayExitOrganization
      ? "cluster"
      : "decaying";
  }

  if (currentStage === "eye") {
    return organization < threshold.eyeExitOrganization ||
      symmetry < threshold.eyeExitSymmetry ||
      maxWind < threshold.eyeExitWind
      ? "comma"
      : "eye";
  }

  if (
    currentStage === "comma" &&
    organization >= threshold.eyeEnterOrganization &&
    symmetry >= threshold.eyeEnterSymmetry &&
    maxWind >= threshold.eyeEnterWind
  ) {
    return "eye";
  }

  if (currentStage === "comma") {
    return organization < threshold.commaExitOrganization ||
      symmetry < threshold.commaExitSymmetry
      ? "spiral"
      : "comma";
  }

  if (
    currentStage === "spiral" &&
    organization >= threshold.commaEnterOrganization &&
    maxWind >= threshold.commaEnterWind
  ) {
    return "comma";
  }

  if (currentStage === "spiral") {
    return organization < threshold.spiralExitOrganization
      ? "cluster"
      : "spiral";
  }

  return organization >= threshold.spiralEnterOrganization &&
    maxWind >= threshold.spiralEnterWind
    ? "spiral"
    : "cluster";
};

export class IntensityModel {
  #randomStreams;
  #seed;
  #stepCount = 0;

  constructor({
    randomStreams,
    seed = PROJECT_CONFIG.gameBalance.demoSeed
  } = {}) {
    this.#seed = String(seed);
    this.#randomStreams = randomStreams ?? createRandomStreams(this.#seed);
  }

  step({
    cell,
    landInteraction = null,
    simulationMinutes = this.#stepCount * PROJECT_CONFIG.simulation.stepMinutes,
    stepIndex = this.#stepCount + 1,
    stepMinutes = PROJECT_CONFIG.simulation.stepMinutes,
    typhoon
  }) {
    if (!(typhoon instanceof Typhoon) || !(cell instanceof GridCell)) {
      throw new TypeError("Intensity step requires Typhoon and GridCell.");
    }

    assertPositiveNumber(stepMinutes, "stepMinutes");
    const parameters = PROJECT_CONFIG.modelParameters;
    const stepHours = stepMinutes / 60;
    const factors = calculateEnvironmentalFactors(typhoon, cell, {
      reorganizationFactor:
        landInteraction?.reorganizationFactor ?? 1
    });
    const targetWind =
      parameters.minimumWind +
      (parameters.maximumWind - parameters.minimumWind) *
        factors.developmentPotential;
    const responseChange =
      ((targetWind - typhoon.maxWind) / parameters.intensityResponseHours) *
      stepHours;
    const stochasticChange =
      this.#randomStreams.intensity.nextRange(-1, 1) *
      parameters.intensityNoiseMpsPerHour *
      stepHours;
    const windChange = clamp(
      responseChange + stochasticChange,
      -parameters.maximumDecreasePerStep,
      parameters.maximumIncreasePerStep
    );
    const maxWind = clamp(
      typhoon.maxWind + windChange,
      parameters.minimumWind,
      parameters.maximumWind
    );
    const organization = approach(
      typhoon.organization,
      factors.developmentPotential,
      parameters.organizationResponseHours,
      stepHours,
      parameters.organizationMaximumChangePerStep
    );
    const symmetryTarget =
      factors.shear *
      factors.moisture *
      (parameters.symmetryOrganizationFloor +
        (1 - parameters.symmetryOrganizationFloor) * organization);
    const symmetry = approach(
      typhoon.symmetry,
      symmetryTarget,
      parameters.organizationResponseHours,
      stepHours,
      parameters.symmetryMaximumChangePerStep
    );
    const moisture = approach(
      typhoon.moisture,
      cell.relativeHumidity * factors.land,
      parameters.organizationResponseHours,
      stepHours,
      parameters.organizationMaximumChangePerStep
    );
    const structureStage = resolveStructureStage({
      currentStage: typhoon.structureStage,
      developmentPotential: factors.developmentPotential,
      maxWind,
      organization,
      symmetry
    });
    const stageFactor =
      parameters.galeRadiusStageFactors[structureStage];
    const targetRadius = clamp(
      parameters.galeRadiusMinimum +
        (maxWind - parameters.minimumWind) *
          parameters.galeRadiusWindScale *
          stageFactor,
      parameters.galeRadiusMinimum,
      parameters.galeRadiusMaximum
    );
    const galeRadius = clamp(
      typhoon.galeRadius +
        ((targetRadius - typhoon.galeRadius) /
          parameters.galeRadiusResponseHours) *
          stepHours,
      parameters.galeRadiusMinimum,
      parameters.galeRadiusMaximum
    );
    const previousStage = typhoon.structureStage;
    const active = maxWind >= parameters.activeWindMinimum;

    typhoon.applyIntensityUpdate({
      active,
      centralPressure: mapWindToPressure(maxWind, organization),
      galeRadius,
      isOverLand:
        landInteraction?.isOverLand ?? cell.landFraction >= 0.5,
      maxWind,
      moisture,
      organization,
      structureStage: active ? structureStage : "decaying",
      symmetry
    });

    if (previousStage !== typhoon.structureStage) {
      typhoon.recordEvent({
        from: previousStage,
        simulationMinutes,
        stepIndex,
        to: typhoon.structureStage,
        type: "structure-changed"
      });
    }

    if (
      stepIndex %
        PROJECT_CONFIG.performanceConfig.trackRecordEverySteps ===
      0
    ) {
      typhoon.recordTrack({ simulationMinutes, stepIndex });
    }

    this.#stepCount += 1;
    return Object.freeze({
      factors,
      fingerprint: this.fingerprint(typhoon),
      targetWind,
      typhoon: typhoon.snapshot(),
      windChange
    });
  }

  fingerprint(typhoon) {
    return createFingerprint({
      modelVersion: PROJECT_CONFIG.modelVersion,
      physicsRandomStreams: {
        environment: this.#randomStreams.environment.snapshot(),
        intensity: this.#randomStreams.intensity.snapshot(),
        steering: this.#randomStreams.steering.snapshot()
      },
      prngVersion: PRNG_VERSION,
      seed: this.#seed,
      stepCount: this.#stepCount,
      typhoon: typhoon.physicsSnapshot()
    });
  }

  snapshot() {
    return Object.freeze({
      modelVersion: PROJECT_CONFIG.modelVersion,
      prngVersion: PRNG_VERSION,
      seed: this.#seed,
      stepCount: this.#stepCount
    });
  }
}

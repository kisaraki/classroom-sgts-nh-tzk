import { clamp } from "../utils/math.js";
import {
  ValidationError,
  assertFiniteNumber,
  assertInteger
} from "../utils/validation.js";

const freezeRecord = (record) => Object.freeze({ ...record });

const createRuleState = (rule) => ({
  aggregatedValue: null,
  completedAtStep: null,
  currentValue: null,
  id: rule.id,
  progress: 0,
  status: "pending",
  streakSteps: 0,
  triggeredAtStep: null
});

const progressFor = (rule, value) => {
  if (value === null || typeof value === "boolean") {
    return Number(value === rule.threshold);
  }

  if (rule.operator === "<" || rule.operator === "<=") {
    return value <= rule.threshold
      ? 1
      : clamp(rule.threshold / Math.max(value, 1e-9), 0, 1);
  }

  return rule.threshold === 0
    ? Number(value >= 0)
    : clamp(value / rule.threshold, 0, 1);
};

const aggregate = (mode, previous, current) => {
  if (current === null) {
    return previous;
  }

  if (previous === null || mode === "current") {
    return current;
  }

  if (mode === "maximum") {
    return Math.max(previous, current);
  }

  if (mode === "minimum") {
    return Math.min(previous, current);
  }

  if (mode === "any") {
    return Boolean(previous || current);
  }

  throw new ValidationError(`Unsupported aggregation: ${mode}.`);
};

const snapshotRuleState = (state) =>
  Object.freeze({
    aggregatedValue: state.aggregatedValue,
    completedAtStep: state.completedAtStep,
    currentValue: state.currentValue,
    id: state.id,
    progress: state.progress,
    status: state.status,
    streakSteps: state.streakSteps,
    triggeredAtStep: state.triggeredAtStep
  });

export class LevelState {
  #failureStates;
  #objectiveStates;
  #operationSequence = 0;
  #reachedZones = new Set();

  constructor(level) {
    if (!level || !Array.isArray(level.objectives)) {
      throw new TypeError("LevelState requires a validated Level.");
    }

    this.level = level;
    this.#objectiveStates = new Map(
      [...level.objectives, ...level.bonusObjectives].map((rule) => [
        rule.id,
        createRuleState(rule)
      ])
    );
    this.#failureStates = new Map(
      level.failureConditions.map((rule) => [rule.id, createRuleState(rule)])
    );
    this.controlOperations = [];
    this.result = null;
    this.statistics = this.#createStatistics();
  }

  get isTerminal() {
    return this.result !== null;
  }

  get outcome() {
    return this.result?.outcome ?? null;
  }

  hasReachedZone(id) {
    return this.#reachedZones.has(id);
  }

  isObjectiveComplete(id) {
    return this.#requireObjective(id).status === "completed";
  }

  recordControlOperation({
    control,
    simulationMinutes,
    stepIndex,
    value
  }) {
    if (!this.level.allowedControls.includes(control)) {
      throw new ValidationError(`Control is not allowed in this level: ${control}.`);
    }

    assertInteger(stepIndex, "stepIndex");
    assertFiniteNumber(simulationMinutes, "simulationMinutes");
    assertFiniteNumber(value, "control value");
    this.#operationSequence += 1;
    this.controlOperations.push(
      freezeRecord({
        control,
        sequence: this.#operationSequence,
        simulationMinutes,
        stepIndex,
        value
      })
    );
  }

  recordStep({
    landDiagnostic,
    observations,
    oceanDiagnostic,
    simulationMinutes,
    steeringDiagnostic,
    stepIndex,
    typhoon
  }) {
    if (this.isTerminal) {
      return this.statisticsSnapshot();
    }

    assertInteger(stepIndex, "stepIndex");
    assertFiniteNumber(simulationMinutes, "simulationMinutes");
    const stats = this.statistics;
    stats.elapsedMinutes = simulationMinutes;
    stats.steps = stepIndex;
    stats.maximumWind = Math.max(stats.maximumWind, typhoon.maxWind);
    stats.minimumPressure = Math.min(
      stats.minimumPressure,
      typhoon.centralPressure
    );
    stats.maximumColdWake = Math.max(
      stats.maximumColdWake,
      oceanDiagnostic.maximumColdWake
    );
    stats.pathLengthKm += steeringDiagnostic.distanceKm;
    const enteredRegions = new Set([
      ...steeringDiagnostic.crossedLandRegions,
      ...landDiagnostic.events
        .filter((event) => event.type === "LANDFALL")
        .map((event) => event.regionId)
        .filter(Boolean)
    ]);
    stats.enteredRegionsThisStep = [...enteredRegions];

    for (const observation of observations) {
      const station = observation.station;
      const previous = stats.stations[station.id] ?? {
        accumulatedRain: 0,
        maximumGust: 0,
        maximumSustainedWind: 0,
        minimumDistanceKm: Number.POSITIVE_INFINITY,
        name: station.name
      };
      stats.stations[station.id] = {
        accumulatedRain: station.accumulatedRain,
        maximumGust: Math.max(previous.maximumGust, station.gust),
        maximumSustainedWind: Math.max(
          previous.maximumSustainedWind,
          station.sustainedWind
        ),
        minimumDistanceKm: Math.min(
          previous.minimumDistanceKm,
          observation.distanceKm
        ),
        name: station.name
      };
    }

    for (const zone of this.level.referenceZones) {
      const stationObservation = observations.find(
        (observation) => observation.station.id === zone.stationId
      );
      const enteredZoneRegion = [...enteredRegions].some((regionId) =>
        zone.regionPrefixes.some((prefix) => regionId.startsWith(prefix))
      );

      if (
        enteredZoneRegion ||
        (stationObservation &&
          stationObservation.distanceKm <= zone.radiusKm)
      ) {
        this.#reachedZones.add(zone.id);
      }
    }

    return this.statisticsSnapshot();
  }

  applyObjectiveEvaluation(rule, currentValue, conditionMet, stepIndex) {
    const state = this.#requireObjective(rule.id);

    if (state.status === "completed" && rule.once) {
      return false;
    }

    state.currentValue = currentValue;
    state.aggregatedValue = aggregate(
      rule.aggregation,
      state.aggregatedValue,
      currentValue
    );
    state.progress = progressFor(rule, state.aggregatedValue);
    state.streakSteps = conditionMet ? state.streakSteps + 1 : 0;

    if (state.streakSteps >= rule.durationSteps) {
      const completedNow = state.status !== "completed";
      state.status = "completed";
      state.completedAtStep ??= stepIndex;
      return completedNow;
    }

    state.status = stepIndex > 0 ? "in_progress" : "pending";
    return false;
  }

  applyFailureEvaluation(rule, currentValue, conditionMet, stepIndex) {
    const state = this.#requireFailure(rule.id);

    if (state.status === "failed" && rule.once) {
      return false;
    }

    state.currentValue = currentValue;
    state.aggregatedValue = aggregate(
      rule.aggregation,
      state.aggregatedValue,
      currentValue
    );
    state.streakSteps = conditionMet ? state.streakSteps + 1 : 0;
    state.progress = clamp(state.streakSteps / rule.durationSteps, 0, 1);

    if (state.streakSteps >= rule.durationSteps) {
      const triggeredNow = state.status !== "failed";
      state.status = "failed";
      state.triggeredAtStep ??= stepIndex;
      return triggeredNow;
    }

    state.status = stepIndex > 0 ? "in_progress" : "pending";
    return false;
  }

  finalize({
    failureId = null,
    fingerprint,
    observations,
    outcome,
    simulationMinutes,
    stepIndex,
    typhoon
  }) {
    if (this.result) {
      return this.result;
    }

    if (!["victory", "failure"].includes(outcome)) {
      throw new ValidationError("Level outcome must be victory or failure.");
    }

    if (outcome === "failure") {
      for (const state of this.#objectiveStates.values()) {
        if (state.status !== "completed") {
          state.status = "failed";
        }
      }
    }

    const scoring = this.#calculateScore(simulationMinutes);
    this.result = Object.freeze({
      failureId,
      fingerprint,
      levelId: this.level.id,
      objectives: this.objectivesSnapshot(),
      observations: Object.freeze(
        observations.map((entry) => entry.station)
      ),
      outcome,
      path: Object.freeze(typhoon.trackHistory.map(freezeRecord)),
      score: scoring,
      simulationMinutes,
      statistics: this.statisticsSnapshot(),
      stepIndex
    });

    return this.result;
  }

  objectivesSnapshot() {
    return Object.freeze(
      [...this.level.objectives, ...this.level.bonusObjectives].map((rule) =>
        Object.freeze({
          ...snapshotRuleState(this.#requireObjective(rule.id)),
          description: rule.description,
          label: rule.label,
          threshold: rule.threshold,
          unit: rule.unit
        })
      )
    );
  }

  failuresSnapshot() {
    return Object.freeze(
      this.level.failureConditions.map((rule) =>
        Object.freeze({
          ...snapshotRuleState(this.#requireFailure(rule.id)),
          description: rule.description,
          label: rule.label,
          threshold: rule.threshold,
          unit: rule.unit
        })
      )
    );
  }

  statisticsSnapshot() {
    return Object.freeze({
      ...this.statistics,
      enteredRegionsThisStep: Object.freeze([
        ...this.statistics.enteredRegionsThisStep
      ]),
      reachedZones: Object.freeze([...this.#reachedZones]),
      stations: Object.freeze(
        Object.fromEntries(
          Object.entries(this.statistics.stations).map(([id, station]) => [
            id,
            Object.freeze({ ...station })
          ])
        )
      )
    });
  }

  snapshot() {
    return Object.freeze({
      controlOperations: Object.freeze(this.controlOperations.map(freezeRecord)),
      failures: this.failuresSnapshot(),
      levelId: this.level.id,
      objectives: this.objectivesSnapshot(),
      outcome: this.outcome,
      result: this.result,
      statistics: this.statisticsSnapshot()
    });
  }

  #calculateScore(simulationMinutes) {
    const config = this.level.scoring;
    const items = [];
    let total = 0;

    for (const objective of this.objectivesSnapshot()) {
      const points =
        objective.status === "completed"
          ? config.objectivePoints[objective.id] ?? 0
          : 0;
      items.push(
        freezeRecord({
          id: objective.id,
          label: objective.label,
          points,
          raw: objective.status
        })
      );
      total += points;
    }

    const remainingFraction = clamp(
      1 - simulationMinutes / (this.level.durationHours * 60),
      0,
      1
    );
    const timePoints =
      remainingFraction * config.timeEfficiency.maximumPoints;
    items.push(
      freezeRecord({
        id: "time-efficiency",
        label: "時間效率",
        points: timePoints,
        raw: remainingFraction
      })
    );
    total += timePoints;

    const stabilityFraction = clamp(
      1 -
        this.controlOperations.length /
          Math.max(config.controlStability.maximumChanges, 1),
      0,
      1
    );
    const stabilityPoints =
      stabilityFraction * config.controlStability.maximumPoints;
    items.push(
      freezeRecord({
        id: "control-stability",
        label: "控制穩定度",
        points: stabilityPoints,
        raw: this.controlOperations.length
      })
    );
    total += stabilityPoints;

    const intensityFraction = clamp(
      this.statistics.maximumWind /
        Math.max(config.intensityManagement.targetWind, 1),
      0,
      1
    );
    const intensityPoints =
      intensityFraction * config.intensityManagement.maximumPoints;
    items.push(
      freezeRecord({
        id: "intensity-management",
        label: "強度管理",
        points: intensityPoints,
        raw: this.statistics.maximumWind
      })
    );
    total += intensityPoints;

    const station =
      this.statistics.stations[config.pathPrecision.stationId];
    const minimumDistance = station?.minimumDistanceKm ?? Number.POSITIVE_INFINITY;
    const pathFraction = clamp(
      1 - minimumDistance / config.pathPrecision.cutoffKm,
      0,
      1
    );
    const pathPoints = pathFraction * config.pathPrecision.maximumPoints;
    items.push(
      freezeRecord({
        id: "path-precision",
        label: "路徑精度",
        points: pathPoints,
        raw: minimumDistance
      })
    );
    total += pathPoints;

    const penaltyConfig = config.penalties.coldWake;
    const coldWakeDeduction = Math.min(
      penaltyConfig.maximumDeduction,
      Math.max(0, this.statistics.maximumColdWake - penaltyConfig.threshold) *
        penaltyConfig.pointsPerUnit
    );
    items.push(
      freezeRecord({
        id: "cold-wake-penalty",
        label: "過度冷水尾流",
        points: -coldWakeDeduction,
        raw: this.statistics.maximumColdWake
      })
    );
    total -= coldWakeDeduction;

    return Object.freeze({
      items: Object.freeze(
        items.map((item) =>
          Object.freeze({ ...item, points: Math.round(item.points) })
        )
      ),
      maximum: config.maximumTotal,
      minimum: config.minimumTotal,
      total: Math.round(
        clamp(total, config.minimumTotal, config.maximumTotal)
      )
    });
  }

  #createStatistics() {
    return {
      elapsedMinutes: 0,
      enteredRegionsThisStep: [],
      maximumColdWake: 0,
      maximumWind: this.level.spawn.maxWind,
      minimumPressure: this.level.spawn.centralPressure,
      pathLengthKm: 0,
      stations: {},
      steps: 0
    };
  }

  #requireObjective(id) {
    const state = this.#objectiveStates.get(id);

    if (!state) {
      throw new ValidationError(`Unknown objective state: ${id}.`);
    }

    return state;
  }

  #requireFailure(id) {
    const state = this.#failureStates.get(id);

    if (!state) {
      throw new ValidationError(`Unknown failure state: ${id}.`);
    }

    return state;
  }
}

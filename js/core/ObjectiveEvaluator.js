import { EventType } from "./EventBus.js";

const compare = (value, operator, threshold) => {
  if (value === null) {
    return false;
  }

  const comparators = {
    "<": () => value < threshold,
    "<=": () => value <= threshold,
    "==": () => value === threshold,
    ">=": () => value >= threshold,
    ">": () => value > threshold
  };
  const comparator = comparators[operator];

  if (!comparator) {
    throw new TypeError(`Unsupported objective operator: ${operator}.`);
  }

  return comparator();
};

const stationObservation = (context, stationId) =>
  context.observations.find(
    (observation) => observation.station.id === stationId
  ) ?? null;

const METRIC_RESOLVERS = Object.freeze({
  "station.accumulatedRain": (rule, context) =>
    stationObservation(context, rule.subject)?.station.accumulatedRain ?? null,
  "station.gust": (rule, context) =>
    stationObservation(context, rule.subject)?.station.gust ?? null,
  "storm.distanceToStation": (rule, context) =>
    stationObservation(context, rule.subject)?.distanceKm ?? null,
  "storm.maxWindWithinStationRadius": (rule, context) => {
    const observation = stationObservation(context, rule.subject);
    return observation && observation.distanceKm <= rule.radiusKm
      ? context.typhoon.maxWind
      : null;
  }
});

export class ObjectiveEvaluator {
  #eventBus;

  constructor({ eventBus = null } = {}) {
    if (eventBus !== null && typeof eventBus.emit !== "function") {
      throw new TypeError("ObjectiveEvaluator eventBus is invalid.");
    }

    this.#eventBus = eventBus;
  }

  evaluate({ context, levelState }) {
    const newlyCompleted = [];

    for (const rule of [
      ...levelState.level.objectives,
      ...levelState.level.bonusObjectives
    ]) {
      if (
        rule.prerequisite !== null &&
        !levelState.isObjectiveComplete(rule.prerequisite)
      ) {
        continue;
      }

      const resolver = METRIC_RESOLVERS[rule.metric];

      if (!resolver) {
        throw new TypeError(`Objective metric is not whitelisted: ${rule.metric}.`);
      }

      const currentValue = resolver(rule, context);
      const previous = levelState
        .objectivesSnapshot()
        .find((objective) => objective.id === rule.id)?.aggregatedValue;
      const candidate =
        currentValue === null
          ? previous ?? null
          : rule.aggregation === "maximum" && previous !== null
            ? Math.max(previous, currentValue)
            : rule.aggregation === "minimum" && previous !== null
              ? Math.min(previous, currentValue)
              : currentValue;
      const conditionMet = compare(candidate, rule.operator, rule.threshold);
      const completedNow = levelState.applyObjectiveEvaluation(
        rule,
        currentValue,
        conditionMet,
        context.stepIndex
      );

      if (completedNow) {
        newlyCompleted.push(rule.id);
        this.#eventBus?.emit(
          EventType.OBJECTIVE_COMPLETED,
          {
            objectiveId: rule.id,
            value: candidate
          },
          {
            dedupeKey: `${levelState.level.id}:objective:${rule.id}`,
            simulationMinutes: context.simulationMinutes,
            sourceId: levelState.level.id,
            stepIndex: context.stepIndex
          }
        );
      }
    }

    return Object.freeze({
      allRequiredCompleted: levelState.level.objectives.every((rule) =>
        levelState.isObjectiveComplete(rule.id)
      ),
      newlyCompleted: Object.freeze(newlyCompleted),
      objectives: levelState.objectivesSnapshot()
    });
  }
}

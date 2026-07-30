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
    throw new TypeError(`Unsupported failure operator: ${operator}.`);
  }

  return comparator();
};

const METRIC_RESOLVERS = Object.freeze({
  "event.regionEnteredBeforeZone": (rule, context, levelState) =>
    context.enteredRegions.includes(rule.subject) &&
    !levelState.hasReachedZone(rule.reference),
  "simulation.boundaryReached": (_rule, context) =>
    context.steeringDiagnostic.boundaryReached,
  "simulation.minutes": (_rule, context) => context.simulationMinutes,
  "storm.maxWind": (_rule, context) => context.typhoon.maxWind
});

export class FailureEvaluator {
  #eventBus;

  constructor({ eventBus = null } = {}) {
    if (eventBus !== null && typeof eventBus.emit !== "function") {
      throw new TypeError("FailureEvaluator eventBus is invalid.");
    }

    this.#eventBus = eventBus;
  }

  evaluate({ context, levelState }) {
    const newlyTriggered = [];

    for (const rule of levelState.level.failureConditions) {
      const resolver = METRIC_RESOLVERS[rule.metric];

      if (!resolver) {
        throw new TypeError(`Failure metric is not whitelisted: ${rule.metric}.`);
      }

      const currentValue = resolver(rule, context, levelState);
      const conditionMet = compare(
        currentValue,
        rule.operator,
        rule.threshold
      );
      const triggeredNow = levelState.applyFailureEvaluation(
        rule,
        currentValue,
        conditionMet,
        context.stepIndex
      );

      if (triggeredNow) {
        newlyTriggered.push(rule.id);
        this.#eventBus?.emit(
          EventType.FAILURE_TRIGGERED,
          { failureId: rule.id, value: currentValue },
          {
            dedupeKey: `${levelState.level.id}:failure:${rule.id}`,
            simulationMinutes: context.simulationMinutes,
            sourceId: levelState.level.id,
            stepIndex: context.stepIndex
          }
        );
      }
    }

    return Object.freeze({
      anyTriggered: newlyTriggered.length > 0,
      failures: levelState.failuresSnapshot(),
      newlyTriggered: Object.freeze(newlyTriggered)
    });
  }
}

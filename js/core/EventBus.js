import {
  assertFunction,
  assertInteger,
  assertNonNegativeNumber,
  assertOneOf
} from "../utils/validation.js";

export const EventType = Object.freeze({
  SIMULATION_STARTED: "SIMULATION_STARTED",
  SIMULATION_PAUSED: "SIMULATION_PAUSED",
  SIMULATION_RESUMED: "SIMULATION_RESUMED",
  SIMULATION_STEP: "SIMULATION_STEP",
  TYPHOON_FORMED: "TYPHOON_FORMED",
  STRUCTURE_CHANGED: "STRUCTURE_CHANGED",
  LANDFALL: "LANDFALL",
  SEA_REENTRY: "SEA_REENTRY",
  WARNING_ZONE_ENTERED: "WARNING_ZONE_ENTERED",
  WARNING_ZONE_EXITED: "WARNING_ZONE_EXITED",
  OBJECTIVE_COMPLETED: "OBJECTIVE_COMPLETED",
  FAILURE_TRIGGERED: "FAILURE_TRIGGERED",
  LEVEL_COMPLETED: "LEVEL_COMPLETED",
  LEVEL_RESTARTED: "LEVEL_RESTARTED"
});

export const EVENT_TYPES = Object.freeze(Object.values(EventType));

const padEventId = (sequence) => `event-${String(sequence).padStart(6, "0")}`;

export class EventBus {
  #dedupeKeys = new Set();
  #listeners = new Map();
  #sequence = 0;

  on(type, listener) {
    assertOneOf(type, EVENT_TYPES, "event type");
    assertFunction(listener, "event listener");

    const listeners = this.#listeners.get(type) ?? new Set();
    listeners.add(listener);
    this.#listeners.set(type, listeners);

    return () => {
      listeners.delete(listener);
    };
  }

  once(type, listener) {
    let unsubscribe = () => {};

    unsubscribe = this.on(type, (event) => {
      unsubscribe();
      listener(event);
    });

    return unsubscribe;
  }

  emit(
    type,
    payload = {},
    {
      dedupeKey = null,
      simulationMinutes = 0,
      sourceId = "engine",
      stepIndex = 0
    } = {}
  ) {
    assertOneOf(type, EVENT_TYPES, "event type");
    assertInteger(stepIndex, "stepIndex");
    assertNonNegativeNumber(stepIndex, "stepIndex");
    assertNonNegativeNumber(simulationMinutes, "simulationMinutes");

    if (dedupeKey !== null && this.#dedupeKeys.has(dedupeKey)) {
      return null;
    }

    if (dedupeKey !== null) {
      this.#dedupeKeys.add(dedupeKey);
    }

    this.#sequence += 1;
    const event = Object.freeze({
      id: padEventId(this.#sequence),
      payload: Object.freeze({ ...payload }),
      sequence: this.#sequence,
      simulationMinutes,
      sourceId,
      stepIndex,
      type
    });

    const listeners = this.#listeners.get(type);

    if (listeners) {
      for (const listener of [...listeners]) {
        listener(event);
      }
    }

    return event;
  }

  clearDedupe(dedupeKey = null) {
    if (dedupeKey === null) {
      this.#dedupeKeys.clear();
      return;
    }

    this.#dedupeKeys.delete(dedupeKey);
  }

  reset() {
    this.#dedupeKeys.clear();
    this.#sequence = 0;
  }
}

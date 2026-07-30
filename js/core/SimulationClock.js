import { clamp } from "../utils/math.js";
import {
  assertFunction,
  assertInteger,
  assertNonNegativeNumber,
  assertOneOf,
  assertPositiveNumber
} from "../utils/validation.js";

export const SIMULATION_SPEEDS = Object.freeze([1, 4, 12, 24]);
export const DEFAULT_STEP_MINUTES = 10;
export const DEFAULT_REAL_STEP_MS = 1000;
export const DEFAULT_MAX_FRAME_DELTA_MS = 250;
export const DEFAULT_MAX_CATCH_UP_STEPS = 8;

const STEP_EPSILON_MS = 1e-7;

export class SimulationClock {
  #accumulatorMs = 0;
  #hidden = false;
  #maxCatchUpSteps;
  #maxFrameDeltaMs;
  #paused = true;
  #realStepMs;
  #simulationMinutes = 0;
  #speed = 1;
  #stepIndex = 0;
  #stepMinutes;

  constructor({
    maxCatchUpSteps = DEFAULT_MAX_CATCH_UP_STEPS,
    maxFrameDeltaMs = DEFAULT_MAX_FRAME_DELTA_MS,
    realStepMs = DEFAULT_REAL_STEP_MS,
    stepMinutes = DEFAULT_STEP_MINUTES
  } = {}) {
    assertInteger(maxCatchUpSteps, "maxCatchUpSteps");
    assertPositiveNumber(maxCatchUpSteps, "maxCatchUpSteps");
    assertPositiveNumber(maxFrameDeltaMs, "maxFrameDeltaMs");
    assertPositiveNumber(realStepMs, "realStepMs");
    assertPositiveNumber(stepMinutes, "stepMinutes");

    this.#maxCatchUpSteps = maxCatchUpSteps;
    this.#maxFrameDeltaMs = maxFrameDeltaMs;
    this.#realStepMs = realStepMs;
    this.#stepMinutes = stepMinutes;
  }

  get interpolationAlpha() {
    return clamp(this.#accumulatorMs / this.#realStepMs, 0, 1);
  }

  get isHidden() {
    return this.#hidden;
  }

  get isPaused() {
    return this.#paused;
  }

  get simulationMinutes() {
    return this.#simulationMinutes;
  }

  get speed() {
    return this.#speed;
  }

  get stepIndex() {
    return this.#stepIndex;
  }

  get stepMinutes() {
    return this.#stepMinutes;
  }

  setSpeed(speed) {
    assertOneOf(speed, SIMULATION_SPEEDS, "simulation speed");
    this.#speed = speed;
    return this.#speed;
  }

  pause() {
    this.#paused = true;
  }

  resume() {
    this.#paused = false;
  }

  setVisibilityHidden(hidden) {
    this.#hidden = Boolean(hidden);
    this.#accumulatorMs = 0;
  }

  advance(realDeltaMs, onStep = () => {}) {
    assertNonNegativeNumber(realDeltaMs, "realDeltaMs");
    assertFunction(onStep, "onStep");

    if (this.#paused || this.#hidden) {
      return this.#result({
        clampedDeltaMs: 0,
        droppedSteps: 0,
        executedSteps: 0
      });
    }

    const clampedDeltaMs = Math.min(realDeltaMs, this.#maxFrameDeltaMs);
    this.#accumulatorMs += clampedDeltaMs * this.#speed;

    let executedSteps = 0;

    while (
      this.#accumulatorMs + STEP_EPSILON_MS >= this.#realStepMs &&
      executedSteps < this.#maxCatchUpSteps
    ) {
      this.#accumulatorMs = Math.max(
        0,
        this.#accumulatorMs - this.#realStepMs
      );
      this.#stepIndex += 1;
      this.#simulationMinutes += this.#stepMinutes;
      executedSteps += 1;

      onStep(
        Object.freeze({
          simulationMinutes: this.#simulationMinutes,
          stepIndex: this.#stepIndex,
          stepMinutes: this.#stepMinutes
        })
      );
    }

    let droppedSteps = 0;

    if (this.#accumulatorMs + STEP_EPSILON_MS >= this.#realStepMs) {
      droppedSteps = Math.floor(
        (this.#accumulatorMs + STEP_EPSILON_MS) / this.#realStepMs
      );
      this.#accumulatorMs %= this.#realStepMs;
    }

    return this.#result({
      clampedDeltaMs,
      droppedSteps,
      executedSteps
    });
  }

  reset({ paused = true, speed = 1 } = {}) {
    assertOneOf(speed, SIMULATION_SPEEDS, "simulation speed");
    this.#accumulatorMs = 0;
    this.#hidden = false;
    this.#paused = Boolean(paused);
    this.#simulationMinutes = 0;
    this.#speed = speed;
    this.#stepIndex = 0;
  }

  snapshot() {
    return Object.freeze({
      interpolationAlpha: this.interpolationAlpha,
      isHidden: this.#hidden,
      isPaused: this.#paused,
      maxCatchUpSteps: this.#maxCatchUpSteps,
      maxFrameDeltaMs: this.#maxFrameDeltaMs,
      realStepMs: this.#realStepMs,
      simulationMinutes: this.#simulationMinutes,
      speed: this.#speed,
      stepIndex: this.#stepIndex,
      stepMinutes: this.#stepMinutes
    });
  }

  #result({ clampedDeltaMs, droppedSteps, executedSteps }) {
    return Object.freeze({
      clampedDeltaMs,
      droppedSteps,
      executedSteps,
      interpolationAlpha: this.interpolationAlpha,
      simulationMinutes: this.#simulationMinutes,
      speed: this.#speed,
      stepIndex: this.#stepIndex,
      stepMinutes: this.#stepMinutes
    });
  }
}

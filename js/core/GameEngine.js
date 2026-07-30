import { EventBus, EventType } from "./EventBus.js";
import { SimulationClock } from "./SimulationClock.js";
import { GameState, StateMachine } from "./StateMachine.js";
import { assertFunction } from "../utils/validation.js";

const defaultRequestFrame = (callback) =>
  globalThis.requestAnimationFrame(callback);
const defaultCancelFrame = (frameId) =>
  globalThis.cancelAnimationFrame(frameId);

export class GameEngine {
  #cancelFrame;
  #clock;
  #eventBus;
  #fps = 0;
  #frameId = null;
  #lastTimestamp = null;
  #loopCallback;
  #render;
  #requestFrame;
  #stateMachine;
  #update;

  constructor({
    cancelFrame = defaultCancelFrame,
    clock = new SimulationClock(),
    eventBus = new EventBus(),
    render = () => {},
    requestFrame = defaultRequestFrame,
    stateMachine = new StateMachine(),
    update = () => {}
  } = {}) {
    assertFunction(cancelFrame, "cancelFrame");
    assertFunction(render, "render");
    assertFunction(requestFrame, "requestFrame");
    assertFunction(update, "update");

    this.#cancelFrame = cancelFrame;
    this.#clock = clock;
    this.#eventBus = eventBus;
    this.#render = render;
    this.#requestFrame = requestFrame;
    this.#stateMachine = stateMachine;
    this.#update = update;
    this.#loopCallback = (timestamp) => {
      this.runFrame(timestamp);
      this.#frameId = this.#requestFrame(this.#loopCallback);
    };
  }

  get clock() {
    return this.#clock;
  }

  get eventBus() {
    return this.#eventBus;
  }

  get state() {
    return this.#stateMachine.state;
  }

  boot({ startLoop = true } = {}) {
    if (this.state !== GameState.BOOT) {
      throw new Error(`Cannot boot engine from ${this.state}.`);
    }

    this.#stateMachine.transition(GameState.MENU, { reason: "boot-complete" });
    this.#renderFrame({
      clampedDeltaMs: 0,
      droppedSteps: 0,
      executedSteps: 0,
      interpolationAlpha: 0
    });

    if (startLoop) {
      this.startLoop();
    }
  }

  startLoop() {
    if (this.#frameId !== null) {
      return;
    }

    this.#lastTimestamp = null;
    this.#frameId = this.#requestFrame(this.#loopCallback);
  }

  stopLoop() {
    if (this.#frameId === null) {
      return;
    }

    this.#cancelFrame(this.#frameId);
    this.#frameId = null;
    this.#lastTimestamp = null;
  }

  startSimulation() {
    if (![GameState.MENU, GameState.TUTORIAL].includes(this.state)) {
      throw new Error(`Cannot start simulation from ${this.state}.`);
    }

    this.#clock.reset({ paused: false, speed: this.#clock.speed });
    this.#stateMachine.transition(GameState.RUNNING, {
      reason: "simulation-started"
    });
    this.#eventBus.emit(EventType.SIMULATION_STARTED, {}, this.#eventMetadata());
  }

  pauseSimulation() {
    if (this.state !== GameState.RUNNING) {
      throw new Error(`Cannot pause simulation from ${this.state}.`);
    }

    this.#clock.pause();
    this.#stateMachine.transition(GameState.PAUSED, {
      reason: "simulation-paused"
    });
    this.#eventBus.emit(EventType.SIMULATION_PAUSED, {}, this.#eventMetadata());
  }

  resumeSimulation() {
    if (this.state !== GameState.PAUSED) {
      throw new Error(`Cannot resume simulation from ${this.state}.`);
    }

    this.#clock.resume();
    this.#stateMachine.transition(GameState.RUNNING, {
      reason: "simulation-resumed"
    });
    this.#eventBus.emit(EventType.SIMULATION_RESUMED, {}, this.#eventMetadata());
  }

  completeLevel(payload = {}) {
    if (this.state !== GameState.RUNNING) {
      return false;
    }

    this.#clock.pause();
    this.#stateMachine.transition(GameState.VICTORY, {
      reason: "level-completed"
    });
    this.#eventBus.emit(EventType.LEVEL_COMPLETED, payload, {
      dedupeKey: `${payload.levelId ?? "level"}:completed`,
      ...this.#eventMetadata(),
      sourceId: payload.levelId ?? "level"
    });
    return true;
  }

  failLevel(payload = {}) {
    if (this.state !== GameState.RUNNING) {
      return false;
    }

    this.#clock.pause();
    this.#stateMachine.transition(GameState.FAILURE, {
      reason: payload.failureId ?? "level-failed"
    });
    return true;
  }

  resetSimulation({ emitLevelRestarted = false, levelId = "level" } = {}) {
    this.#clock.reset({ paused: true, speed: this.#clock.speed });

    if (this.state !== GameState.MENU) {
      this.#stateMachine.transition(GameState.MENU, {
        reason: "simulation-reset"
      });
    }

    this.#lastTimestamp = null;

    if (emitLevelRestarted) {
      this.#eventBus.emit(
        EventType.LEVEL_RESTARTED,
        { levelId },
        {
          dedupeKey: `${levelId}:restart:0`,
          simulationMinutes: 0,
          sourceId: levelId,
          stepIndex: 0
        }
      );
    }

    this.#renderFrame({
      clampedDeltaMs: 0,
      droppedSteps: 0,
      executedSteps: 0,
      interpolationAlpha: 0
    });
  }

  setSpeed(speed) {
    return this.#clock.setSpeed(speed);
  }

  setVisibilityHidden(hidden) {
    this.#clock.setVisibilityHidden(hidden);
    this.#lastTimestamp = null;
  }

  enterError(error) {
    this.#clock.pause();

    if (
      this.state !== GameState.ERROR &&
      this.#stateMachine.canTransition(GameState.ERROR)
    ) {
      this.#stateMachine.transition(GameState.ERROR, {
        message: error instanceof Error ? error.message : String(error),
        reason: "runtime-error"
      });
    }

    this.#renderFrame({
      clampedDeltaMs: 0,
      droppedSteps: 0,
      error,
      executedSteps: 0,
      interpolationAlpha: this.#clock.interpolationAlpha
    });
  }

  runFrame(timestamp) {
    const frameDeltaMs =
      this.#lastTimestamp === null ? 0 : Math.max(0, timestamp - this.#lastTimestamp);
    this.#lastTimestamp = timestamp;

    if (frameDeltaMs > 0) {
      const instantaneousFps = 1000 / frameDeltaMs;
      this.#fps =
        this.#fps === 0
          ? instantaneousFps
          : this.#fps * 0.9 + instantaneousFps * 0.1;
    }

    const result = this.#clock.advance(frameDeltaMs, (step) => {
      this.#update(step);
      this.#eventBus.emit(EventType.SIMULATION_STEP, step, {
        simulationMinutes: step.simulationMinutes,
        sourceId: "engine",
        stepIndex: step.stepIndex
      });
    });

    if (!this.#clock.isHidden) {
      this.#renderFrame({ ...result, frameDeltaMs });
    }

    return result;
  }

  snapshot() {
    return Object.freeze({
      clock: this.#clock.snapshot(),
      fps: this.#fps,
      state: this.state
    });
  }

  destroy() {
    this.stopLoop();
    this.#clock.pause();
  }

  #eventMetadata() {
    return {
      simulationMinutes: this.#clock.simulationMinutes,
      sourceId: "engine",
      stepIndex: this.#clock.stepIndex
    };
  }

  #renderFrame(frame) {
    this.#render(
      Object.freeze({
        clock: this.#clock.snapshot(),
        fps: this.#fps,
        frame: Object.freeze({ ...frame }),
        state: this.state
      })
    );
  }
}

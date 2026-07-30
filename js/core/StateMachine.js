import { assertFunction, assertOneOf } from "../utils/validation.js";

export const GameState = Object.freeze({
  BOOT: "BOOT",
  MENU: "MENU",
  TUTORIAL: "TUTORIAL",
  RUNNING: "RUNNING",
  PAUSED: "PAUSED",
  VICTORY: "VICTORY",
  FAILURE: "FAILURE",
  ERROR: "ERROR"
});

export const GAME_STATES = Object.freeze(Object.values(GameState));

export const DEFAULT_TRANSITIONS = Object.freeze({
  [GameState.BOOT]: Object.freeze([GameState.MENU, GameState.ERROR]),
  [GameState.MENU]: Object.freeze([
    GameState.TUTORIAL,
    GameState.RUNNING,
    GameState.ERROR
  ]),
  [GameState.TUTORIAL]: Object.freeze([
    GameState.MENU,
    GameState.RUNNING,
    GameState.ERROR
  ]),
  [GameState.RUNNING]: Object.freeze([
    GameState.PAUSED,
    GameState.VICTORY,
    GameState.FAILURE,
    GameState.MENU,
    GameState.ERROR
  ]),
  [GameState.PAUSED]: Object.freeze([
    GameState.RUNNING,
    GameState.MENU,
    GameState.ERROR
  ]),
  [GameState.VICTORY]: Object.freeze([
    GameState.MENU,
    GameState.RUNNING,
    GameState.ERROR
  ]),
  [GameState.FAILURE]: Object.freeze([
    GameState.MENU,
    GameState.RUNNING,
    GameState.ERROR
  ]),
  [GameState.ERROR]: Object.freeze([GameState.BOOT, GameState.MENU])
});

export class InvalidStateTransitionError extends Error {
  constructor(from, to) {
    super(`Invalid game-state transition: ${from} → ${to}.`);
    this.name = "InvalidStateTransitionError";
    this.from = from;
    this.to = to;
  }
}

const normalizeTransitions = (transitions) => {
  const normalized = {};

  for (const state of GAME_STATES) {
    const targets = transitions[state] ?? [];
    normalized[state] = new Set(targets);
  }

  return normalized;
};

export class StateMachine {
  #initialState;
  #listeners = new Set();
  #state;
  #transitions;

  constructor({
    initialState = GameState.BOOT,
    transitions = DEFAULT_TRANSITIONS
  } = {}) {
    assertOneOf(initialState, GAME_STATES, "initialState");
    this.#initialState = initialState;
    this.#state = initialState;
    this.#transitions = normalizeTransitions(transitions);
  }

  get state() {
    return this.#state;
  }

  canTransition(to) {
    assertOneOf(to, GAME_STATES, "target state");
    return this.#transitions[this.#state].has(to);
  }

  transition(to, metadata = {}) {
    assertOneOf(to, GAME_STATES, "target state");

    if (!this.canTransition(to)) {
      throw new InvalidStateTransitionError(this.#state, to);
    }

    const transition = Object.freeze({
      from: this.#state,
      metadata: Object.freeze({ ...metadata }),
      to
    });

    this.#state = to;

    for (const listener of this.#listeners) {
      listener(transition);
    }

    return transition;
  }

  onTransition(listener) {
    assertFunction(listener, "transition listener");
    this.#listeners.add(listener);

    return () => {
      this.#listeners.delete(listener);
    };
  }

  reset() {
    this.#state = this.#initialState;
  }

  snapshot() {
    return Object.freeze({
      initialState: this.#initialState,
      state: this.#state
    });
  }
}

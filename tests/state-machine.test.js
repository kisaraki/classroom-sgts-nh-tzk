import assert from "node:assert/strict";
import test from "node:test";

import {
  GAME_STATES,
  GameState,
  InvalidStateTransitionError,
  StateMachine
} from "../js/core/StateMachine.js";

test("state catalog contains every Phase 1 game state", () => {
  assert.deepEqual(GAME_STATES, [
    "BOOT",
    "MENU",
    "TUTORIAL",
    "RUNNING",
    "PAUSED",
    "VICTORY",
    "FAILURE",
    "ERROR"
  ]);
});

test("legal transitions update state and preserve listener order", () => {
  const machine = new StateMachine();
  const observed = [];

  machine.onTransition((transition) => observed.push(`first:${transition.to}`));
  machine.onTransition((transition) => observed.push(`second:${transition.to}`));

  machine.transition(GameState.MENU);
  machine.transition(GameState.TUTORIAL);
  machine.transition(GameState.RUNNING);
  machine.transition(GameState.PAUSED);
  machine.transition(GameState.RUNNING);
  machine.transition(GameState.VICTORY);

  assert.equal(machine.state, GameState.VICTORY);
  assert.deepEqual(observed.slice(0, 2), ["first:MENU", "second:MENU"]);
});

test("illegal transitions fail without mutating state", () => {
  const machine = new StateMachine();

  assert.throws(
    () => machine.transition(GameState.VICTORY),
    InvalidStateTransitionError
  );
  assert.equal(machine.state, GameState.BOOT);
});

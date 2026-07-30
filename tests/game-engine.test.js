import assert from "node:assert/strict";
import test from "node:test";

import { GameEngine } from "../js/core/GameEngine.js";
import { GameState } from "../js/core/StateMachine.js";

test("engine separates fixed updates from frame rendering", () => {
  let renders = 0;
  let updates = 0;
  const engine = new GameEngine({
    cancelFrame: () => {},
    render: () => {
      renders += 1;
    },
    requestFrame: () => 1,
    update: () => {
      updates += 1;
    }
  });

  engine.boot({ startLoop: false });
  engine.startSimulation();
  engine.runFrame(0);
  engine.runFrame(250);
  engine.runFrame(500);
  engine.runFrame(750);
  engine.runFrame(1000);

  assert.equal(engine.state, GameState.RUNNING);
  assert.equal(updates, 1);
  assert.equal(renders, 6);
});

test("hidden pages pause physics and rendering without catch-up", () => {
  let renders = 0;
  let updates = 0;
  const engine = new GameEngine({
    cancelFrame: () => {},
    render: () => {
      renders += 1;
    },
    requestFrame: () => 1,
    update: () => {
      updates += 1;
    }
  });

  engine.boot({ startLoop: false });
  engine.setSpeed(4);
  engine.startSimulation();
  engine.runFrame(0);
  const visibleRenderCount = renders;

  engine.setVisibilityHidden(true);
  engine.runFrame(50_000);
  assert.equal(updates, 0);
  assert.equal(renders, visibleRenderCount);

  engine.setVisibilityHidden(false);
  engine.runFrame(50_000);
  engine.runFrame(50_250);
  assert.equal(updates, 1);
  assert.equal(engine.clock.simulationMinutes, 10);
});

test("pause and resume drive the state machine and clock together", () => {
  const engine = new GameEngine({
    cancelFrame: () => {},
    requestFrame: () => 1
  });

  engine.boot({ startLoop: false });
  engine.setSpeed(4);
  engine.startSimulation();
  engine.pauseSimulation();
  engine.runFrame(0);
  engine.runFrame(10_000);

  assert.equal(engine.state, GameState.PAUSED);
  assert.equal(engine.clock.simulationMinutes, 0);

  engine.resumeSimulation();
  engine.runFrame(11_000);
  assert.equal(engine.state, GameState.RUNNING);
  assert.equal(engine.clock.simulationMinutes, 10);
});

test("runtime errors enter ERROR and render a readable error payload", () => {
  let lastRender = null;
  const engine = new GameEngine({
    cancelFrame: () => {},
    render: (frame) => {
      lastRender = frame;
    },
    requestFrame: () => 1
  });

  engine.boot({ startLoop: false });
  engine.enterError(new Error("Canvas unavailable"));

  assert.equal(engine.state, GameState.ERROR);
  assert.equal(lastRender.frame.error.message, "Canvas unavailable");
});

test("reset returns to MENU and clears fixed-step time", () => {
  const engine = new GameEngine({
    cancelFrame: () => {},
    requestFrame: () => 1
  });

  engine.boot({ startLoop: false });
  engine.setSpeed(4);
  engine.startSimulation();
  engine.clock.advance(1000);
  assert.equal(engine.clock.stepIndex, 1);

  engine.resetSimulation();

  assert.equal(engine.state, GameState.MENU);
  assert.equal(engine.clock.stepIndex, 0);
  assert.equal(engine.clock.simulationMinutes, 0);
  assert.equal(engine.clock.isPaused, true);
});

test("level completion stops remaining catch-up steps and emits once", () => {
  let completions = 0;
  let updates = 0;
  let engine;
  engine = new GameEngine({
    cancelFrame: () => {},
    requestFrame: () => 1,
    update: () => {
      updates += 1;
      engine.completeLevel({ levelId: "naha-storm" });
    }
  });
  engine.eventBus.on("LEVEL_COMPLETED", () => {
    completions += 1;
  });
  engine.boot({ startLoop: false });
  engine.setSpeed(24);
  engine.startSimulation();
  engine.runFrame(0);
  engine.runFrame(250);

  assert.equal(engine.state, GameState.VICTORY);
  assert.equal(engine.clock.isPaused, true);
  assert.equal(updates, 1);
  assert.equal(completions, 1);
  assert.equal(engine.completeLevel({ levelId: "naha-storm" }), false);
  assert.equal(completions, 1);
});

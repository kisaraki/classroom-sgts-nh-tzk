import assert from "node:assert/strict";
import test from "node:test";

import { EventType } from "../../js/core/EventBus.js";
import { GameEngine } from "../../js/core/GameEngine.js";

test("engine emits one ordered event for every completed fixed step", () => {
  const updates = [];
  const events = [];
  const engine = new GameEngine({
    cancelFrame: () => {},
    requestFrame: () => 1,
    update: (step) => updates.push(step.stepIndex)
  });

  engine.eventBus.on(EventType.SIMULATION_STEP, (event) => {
    events.push({
      id: event.id,
      simulationMinutes: event.simulationMinutes,
      stepIndex: event.stepIndex
    });
  });

  engine.boot({ startLoop: false });
  engine.setSpeed(4);
  engine.startSimulation();
  engine.runFrame(0);
  engine.runFrame(250);
  engine.runFrame(500);

  assert.deepEqual(updates, [1, 2]);
  assert.deepEqual(events, [
    { id: "event-000002", simulationMinutes: 10, stepIndex: 1 },
    { id: "event-000003", simulationMinutes: 20, stepIndex: 2 }
  ]);
});

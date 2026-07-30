import assert from "node:assert/strict";
import test from "node:test";

import { EventBus, EventType } from "../js/core/EventBus.js";

test("events preserve operation and listener order within one step", () => {
  const bus = new EventBus();
  const observed = [];

  bus.on(EventType.SIMULATION_STEP, (event) => {
    observed.push(`first:${event.payload.operation}`);
  });
  bus.on(EventType.SIMULATION_STEP, (event) => {
    observed.push(`second:${event.payload.operation}`);
  });

  const first = bus.emit(
    EventType.SIMULATION_STEP,
    { operation: "steer" },
    { simulationMinutes: 10, stepIndex: 1 }
  );
  const second = bus.emit(
    EventType.SIMULATION_STEP,
    { operation: "intensify" },
    { simulationMinutes: 10, stepIndex: 1 }
  );

  assert.equal(first.id, "event-000001");
  assert.equal(second.id, "event-000002");
  assert.deepEqual(observed, [
    "first:steer",
    "second:steer",
    "first:intensify",
    "second:intensify"
  ]);
});

test("dedupe keys prevent repeated transition events", () => {
  const bus = new EventBus();
  const first = bus.emit(
    EventType.WARNING_ZONE_ENTERED,
    {},
    { dedupeKey: "warning-zone-a", stepIndex: 4 }
  );
  const duplicate = bus.emit(
    EventType.WARNING_ZONE_ENTERED,
    {},
    { dedupeKey: "warning-zone-a", stepIndex: 4 }
  );

  assert.ok(first);
  assert.equal(duplicate, null);
});

test("once listeners unsubscribe after the first event", () => {
  const bus = new EventBus();
  let calls = 0;

  bus.once(EventType.SIMULATION_STARTED, () => {
    calls += 1;
  });
  bus.emit(EventType.SIMULATION_STARTED);
  bus.emit(EventType.SIMULATION_STARTED);

  assert.equal(calls, 1);
});

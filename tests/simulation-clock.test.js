import assert from "node:assert/strict";
import test from "node:test";

import { SimulationClock } from "../js/core/SimulationClock.js";

const runFrames = (clock, frameCount, frameDeltaMs) => {
  let steps = 0;

  for (let frame = 0; frame < frameCount; frame += 1) {
    clock.advance(frameDeltaMs, () => {
      steps += 1;
    });
  }

  return steps;
};

test("pause freezes simulation time and step index", () => {
  const clock = new SimulationClock();

  clock.resume();
  clock.advance(1000);
  clock.pause();
  const before = clock.snapshot();
  clock.advance(100_000);

  assert.equal(clock.simulationMinutes, before.simulationMinutes);
  assert.equal(clock.stepIndex, before.stepIndex);
});

test("60 Hz and 120 Hz produce the same fixed-step result", () => {
  const sixtyHz = new SimulationClock({ maxFrameDeltaMs: 1000 });
  const oneTwentyHz = new SimulationClock({ maxFrameDeltaMs: 1000 });

  sixtyHz.resume();
  oneTwentyHz.resume();

  assert.equal(runFrames(sixtyHz, 600, 1000 / 60), 10);
  assert.equal(runFrames(oneTwentyHz, 1200, 1000 / 120), 10);
  assert.equal(sixtyHz.simulationMinutes, 100);
  assert.equal(oneTwentyHz.simulationMinutes, 100);
});

test("speed changes frequency but never the ten-minute step size", () => {
  const clock = new SimulationClock();
  const observed = [];

  clock.setSpeed(4);
  clock.resume();
  const result = clock.advance(250, (step) => observed.push(step));

  assert.equal(result.executedSteps, 1);
  assert.equal(result.stepMinutes, 10);
  assert.equal(observed[0].stepMinutes, 10);
  assert.equal(observed[0].simulationMinutes, 10);
});

test("maximum catch-up steps cap work and report dropped steps", () => {
  const clock = new SimulationClock({
    maxCatchUpSteps: 2,
    maxFrameDeltaMs: 10_000
  });

  clock.setSpeed(24);
  clock.resume();
  const result = clock.advance(1000);

  assert.equal(result.executedSteps, 2);
  assert.equal(result.droppedSteps, 22);
  assert.equal(result.simulationMinutes, 20);
});

test("hidden pages stop steps and discard hidden elapsed time", () => {
  const clock = new SimulationClock({ maxFrameDeltaMs: 100_000 });

  clock.resume();
  clock.advance(1000);
  clock.setVisibilityHidden(true);
  const hiddenResult = clock.advance(90_000);
  clock.setVisibilityHidden(false);
  const returnFrame = clock.advance(0);
  const nextSecond = clock.advance(1000);

  assert.equal(hiddenResult.executedSteps, 0);
  assert.equal(returnFrame.executedSteps, 0);
  assert.equal(nextSecond.executedSteps, 1);
  assert.equal(clock.simulationMinutes, 20);
});

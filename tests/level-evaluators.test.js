import assert from "node:assert/strict";
import test from "node:test";

import { EventBus, EventType } from "../js/core/EventBus.js";
import { FailureEvaluator } from "../js/core/FailureEvaluator.js";
import { ObjectiveEvaluator } from "../js/core/ObjectiveEvaluator.js";
import { NAHA_STORM_LEVEL } from "../js/data/levels.js";
import { LevelState } from "../js/model/LevelState.js";

const observation = ({
  accumulatedRain = 0,
  distanceKm = 1000,
  gust = 0
} = {}) => ({
  distanceKm,
  station: {
    accumulatedRain,
    gust,
    id: "naha",
    name: "那霸"
  }
});

const context = (overrides = {}) => ({
  enteredRegions: [],
  observations: [observation()],
  simulationMinutes: 10,
  steeringDiagnostic: { boundaryReached: false },
  stepIndex: 1,
  typhoon: { maxWind: 15 },
  ...overrides
});

test("all Naha objectives complete once from model context", () => {
  const eventBus = new EventBus();
  const evaluator = new ObjectiveEvaluator({ eventBus });
  const levelState = new LevelState(NAHA_STORM_LEVEL);
  let completionEvents = 0;
  eventBus.on(EventType.OBJECTIVE_COMPLETED, () => {
    completionEvents += 1;
  });
  const passing = context({
    observations: [
      observation({
        accumulatedRain: 260,
        distanceKm: 40,
        gust: 47
      })
    ],
    typhoon: { maxWind: 36 }
  });
  const first = evaluator.evaluate({ context: passing, levelState });
  const duplicate = evaluator.evaluate({
    context: { ...passing, stepIndex: 2 },
    levelState
  });

  assert.equal(first.allRequiredCompleted, true);
  assert.equal(first.newlyCompleted.length, 4);
  assert.equal(duplicate.newlyCompleted.length, 0);
  assert.equal(completionEvents, 4);
  assert.equal(
    levelState.objectivesSnapshot().every(
      (objective) => objective.status === "completed"
    ),
    true
  );
});

test("proximity alone cannot satisfy strength, gust, or rainfall", () => {
  const levelState = new LevelState(NAHA_STORM_LEVEL);
  const result = new ObjectiveEvaluator().evaluate({
    context: context({
      observations: [
        observation({
          accumulatedRain: 120,
          distanceKm: 40,
          gust: 30
        })
      ],
      typhoon: { maxWind: 29 }
    }),
    levelState
  });

  assert.equal(result.allRequiredCompleted, false);
  assert.deepEqual(result.newlyCompleted, ["naha-proximity"]);
  assert.equal(
    result.objectives.find((entry) => entry.id === "naha-strength").status,
    "in_progress"
  );
});

test("strength below 33 m/s remains incomplete inside 150 km", () => {
  const levelState = new LevelState(NAHA_STORM_LEVEL);
  const result = new ObjectiveEvaluator().evaluate({
    context: context({
      observations: [
        observation({
          accumulatedRain: 300,
          distanceKm: 100,
          gust: 50
        })
      ],
      typhoon: { maxWind: 32.9 }
    }),
    levelState
  });

  assert.notEqual(
    result.objectives.find((entry) => entry.id === "naha-strength").status,
    "completed"
  );
});

test("rainfall below 250 mm remains incomplete after Naha passage", () => {
  const levelState = new LevelState(NAHA_STORM_LEVEL);
  const result = new ObjectiveEvaluator().evaluate({
    context: context({
      observations: [
        observation({
          accumulatedRain: 249.9,
          distanceKm: 40,
          gust: 50
        })
      ],
      typhoon: { maxWind: 36 }
    }),
    levelState
  });

  assert.notEqual(
    result.objectives.find((entry) => entry.id === "naha-rain").status,
    "completed"
  );
});

test("low wind must persist 72 steps and failure only triggers once", () => {
  const eventBus = new EventBus();
  const evaluator = new FailureEvaluator({ eventBus });
  const levelState = new LevelState(NAHA_STORM_LEVEL);
  let events = 0;
  eventBus.on(EventType.FAILURE_TRIGGERED, () => {
    events += 1;
  });
  let result;

  for (let stepIndex = 1; stepIndex <= 72; stepIndex += 1) {
    result = evaluator.evaluate({
      context: context({
        simulationMinutes: stepIndex * 10,
        stepIndex,
        typhoon: { maxWind: 7.9 }
      }),
      levelState
    });
  }

  assert.equal(result.newlyTriggered[0], "dissipated");
  assert.equal(events, 1);
  result = evaluator.evaluate({
    context: context({
      simulationMinutes: 730,
      stepIndex: 73,
      typhoon: { maxWind: 7.9 }
    }),
    levelState
  });
  assert.equal(result.newlyTriggered.length, 0);
  assert.equal(events, 1);
});

test("timeout and mainland-before-Ryukyu are distinct failures", () => {
  const timeoutState = new LevelState(NAHA_STORM_LEVEL);
  const evaluator = new FailureEvaluator();
  const timeout = evaluator.evaluate({
    context: context({
      simulationMinutes: 10_080,
      stepIndex: 1008
    }),
    levelState: timeoutState
  });
  assert.deepEqual(timeout.newlyTriggered, ["time-limit"]);

  const mainlandState = new LevelState(NAHA_STORM_LEVEL);
  const mainland = evaluator.evaluate({
    context: context({
      enteredRegions: ["china-mainland"]
    }),
    levelState: mainlandState
  });
  assert.deepEqual(mainland.newlyTriggered, ["china-before-ryukyu"]);
});

test("a new LevelState clears objectives, failures, score, and controls", () => {
  const first = new LevelState(NAHA_STORM_LEVEL);
  first.recordControlOperation({
    control: "verticalWindShear",
    simulationMinutes: 0,
    stepIndex: 0,
    value: 4
  });
  new ObjectiveEvaluator().evaluate({
    context: context({
      observations: [
        observation({
          accumulatedRain: 260,
          distanceKm: 40,
          gust: 47
        })
      ],
      typhoon: { maxWind: 36 }
    }),
    levelState: first
  });

  const restarted = new LevelState(NAHA_STORM_LEVEL);
  assert.equal(restarted.controlOperations.length, 0);
  assert.equal(restarted.result, null);
  assert.equal(
    restarted.objectivesSnapshot().every(
      (objective) => objective.status === "pending"
    ),
    true
  );
  assert.equal(
    restarted.failuresSnapshot().every(
      (failure) => failure.status === "pending"
    ),
    true
  );
});

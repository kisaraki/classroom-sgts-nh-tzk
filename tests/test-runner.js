import { SimulationClock } from "../js/core/SimulationClock.js";
import { GameState, StateMachine } from "../js/core/StateMachine.js";
import { computeCanvasDimensions } from "../js/ui/CanvasViewport.js";
import { haversineDistanceKm } from "../js/utils/geo.js";

const results = document.querySelector("#test-results");
const summary = document.querySelector("#test-summary");
const tests = [];

const test = (name, callback) => {
  tests.push({ callback, name });
};

const equal = (actual, expected, message) => {
  if (!Object.is(actual, expected)) {
    throw new Error(`${message}: expected ${expected}, received ${actual}`);
  }
};

test("狀態機拒絕非法切換", () => {
  const machine = new StateMachine();
  let rejected = false;

  try {
    machine.transition(GameState.VICTORY);
  } catch {
    rejected = true;
  }

  equal(rejected, true, "BOOT → VICTORY should fail");
  equal(machine.state, GameState.BOOT, "state should remain BOOT");
});

test("暫停時模擬時間不增加", () => {
  const clock = new SimulationClock();
  clock.setSpeed(4);
  clock.resume();
  clock.advance(1000);
  clock.pause();
  clock.advance(60_000);
  equal(clock.simulationMinutes, 10, "paused simulation minutes");
});

test("高 DPI Canvas 上限為 2", () => {
  const dimensions = computeCanvasDimensions({
    cssHeight: 200,
    cssWidth: 300,
    devicePixelRatio: 3
  });
  equal(dimensions.scale, 2, "DPR scale");
  equal(dimensions.pixelWidth, 600, "pixel width");
});

test("赤道一度經差約為 111.2 km", () => {
  const distance = haversineDistanceKm(
    { lat: 0, lon: 100 },
    { lat: 0, lon: 101 }
  );
  equal(Math.abs(distance - 111.195) < 0.01, true, "Haversine distance");
});

let passed = 0;

for (const { callback, name } of tests) {
  const item = document.createElement("li");

  try {
    callback();
    item.dataset.status = "passed";
    item.textContent = `PASS｜${name}`;
    passed += 1;
  } catch (error) {
    item.dataset.status = "failed";
    item.textContent = `FAIL｜${name}｜${
      error instanceof Error ? error.message : String(error)
    }`;
  }

  results.append(item);
}

const allPassed = passed === tests.length;
document.documentElement.dataset.testStatus = allPassed ? "passed" : "failed";
summary.textContent = `${passed}/${tests.length} tests passed`;

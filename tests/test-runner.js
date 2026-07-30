import { SimulationClock } from "../js/core/SimulationClock.js";
import { ObjectiveEvaluator } from "../js/core/ObjectiveEvaluator.js";
import { GameState, StateMachine } from "../js/core/StateMachine.js";
import { NAHA_STORM_LEVEL } from "../js/data/levels.js";
import { LevelState } from "../js/model/LevelState.js";
import { computeCanvasDimensions } from "../js/ui/CanvasViewport.js";
import { haversineDistanceKm } from "../js/utils/geo.js";
import { SeededRandom } from "../js/utils/random.js";
import { createEnvironmentGrid } from "../js/model/Environment.js";
import { createRandomStreams } from "../js/utils/random.js";
import { integrateRainfall } from "../js/simulation/RainfallModel.js";

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

test("相同種子的瀏覽器 PRNG 序列一致", () => {
  const first = new SeededRandom("browser-harness");
  const second = new SeededRandom("browser-harness");
  equal(first.nextUint32(), second.nextUint32(), "first PRNG value");
  equal(first.nextUint32(), second.nextUint32(), "second PRNG value");
});

test("瀏覽器可建立完整 1 度環境網格", () => {
  const streams = createRandomStreams("browser-grid");
  const environment = createEnvironmentGrid({
    random: streams.environment
  });
  equal(environment.cells.length, 2501, "grid cell count");
  equal(environment.gridResolution, 1, "grid resolution");
});

test("10 分鐘雨量使用每小時雨率的六分之一", () => {
  equal(integrateRainfall(10, 24, 10), 14, "rainfall integration");
});

test("那霸關卡白名單目標可由正式資料欄位完成", () => {
  const levelState = new LevelState(NAHA_STORM_LEVEL);
  const evaluator = new ObjectiveEvaluator();
  const result = evaluator.evaluate({
    context: {
      observations: [
        {
          distanceKm: 25,
          station: {
            accumulatedRain: 300,
            gust: 50,
            id: "naha"
          }
        }
      ],
      simulationMinutes: 10,
      stepIndex: 1,
      typhoon: {
        maxWind: 35
      }
    },
    levelState
  });

  equal(result.allRequiredCompleted, true, "Naha required objectives");
  equal(result.newlyCompleted.length, 4, "completed objective count");
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

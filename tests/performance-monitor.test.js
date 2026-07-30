import assert from "node:assert/strict";
import test from "node:test";

import { PerformanceMonitor } from "../js/performance/PerformanceMonitor.js";

test("performance monitor reports bounded frame, update, and render metrics", () => {
  const monitor = new PerformanceMonitor({
    maximumSamples: 2,
    PerformanceObserverClass: null
  });

  monitor.recordFrame(20);
  monitor.recordFrame(10);
  monitor.recordFrame(25);
  monitor.recordUpdate(2);
  monitor.recordUpdate(4);
  monitor.recordRender(5);
  monitor.recordRender(7);
  const snapshot = monitor.snapshot();

  assert.equal(snapshot.frameSamples, 2);
  assert.equal(snapshot.averageFps, 70);
  assert.equal(snapshot.minimumFps, 40);
  assert.equal(snapshot.medianFps, 40);
  assert.equal(snapshot.onePercentLowFps, 40);
  assert.equal(snapshot.updateAverageMs, 3);
  assert.equal(snapshot.updateMaximumMs, 4);
  assert.equal(snapshot.updateP95Ms, 4);
  assert.equal(snapshot.renderAverageMs, 6);
  assert.equal(snapshot.renderMaximumMs, 7);
  assert.equal(snapshot.longTaskCount, 0);
});

test("performance monitor observes and releases long-task entries", () => {
  let callback;
  let disconnected = false;
  class Observer {
    constructor(next) {
      callback = next;
    }

    observe() {}

    disconnect() {
      disconnected = true;
    }
  }
  const monitor = new PerformanceMonitor({
    PerformanceObserverClass: Observer
  });

  callback({
    getEntries: () => [{ duration: 64 }, { duration: 80 }]
  });

  assert.equal(monitor.snapshot().longTaskCount, 2);
  assert.equal(monitor.snapshot().longTaskDurationMs, 144);
  monitor.destroy();
  assert.equal(disconnected, true);
});

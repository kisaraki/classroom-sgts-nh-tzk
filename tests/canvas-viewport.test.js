import assert from "node:assert/strict";
import test from "node:test";

import {
  CanvasViewport,
  computeCanvasDimensions,
  formatSimulationTime
} from "../js/ui/CanvasViewport.js";

test("canvas dimensions cap DPR at two", () => {
  assert.deepEqual(
    computeCanvasDimensions({
      cssHeight: 360,
      cssWidth: 640,
      devicePixelRatio: 3
    }),
    {
      cssHeight: 360,
      cssWidth: 640,
      pixelHeight: 720,
      pixelWidth: 1280,
      scale: 2
    }
  );
});

test("canvas resize follows its latest CSS dimensions", () => {
  let rect = { height: 300, width: 500 };
  let resizeCallback = null;
  const canvas = {
    getBoundingClientRect: () => rect,
    getContext: () => ({}),
    height: 0,
    width: 0
  };

  class TestResizeObserver {
    constructor(callback) {
      resizeCallback = callback;
    }

    disconnect() {}

    observe() {}
  }

  const viewport = new CanvasViewport(canvas, {
    ResizeObserverClass: TestResizeObserver,
    getDevicePixelRatio: () => 1.5
  });

  assert.equal(canvas.width, 750);
  assert.equal(canvas.height, 450);

  rect = { height: 360, width: 640 };
  resizeCallback();

  assert.equal(canvas.width, 960);
  assert.equal(canvas.height, 540);
  assert.equal(viewport.dimensions.cssWidth, 640);
});

test("simulation time uses a stable day-hour-minute format", () => {
  assert.equal(formatSimulationTime(0), "00d 00h 00m");
  assert.equal(formatSimulationTime(1510), "01d 01h 10m");
});

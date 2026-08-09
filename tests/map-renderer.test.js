import assert from "node:assert/strict";
import test from "node:test";

import { MapRenderer } from "../js/rendering/MapRenderer.js";

const createContext = () => ({
  beginPath() {},
  clearRectCalls: 0,
  clearRect() {
    this.clearRectCalls += 1;
  },
  clip() {},
  createLinearGradient: () => ({ addColorStop() {} }),
  createRadialGradient: () => ({ addColorStop() {} }),
  drawImageCalls: [],
  drawImage(...args) {
    this.drawImageCalls.push(args);
  },
  fillRect() {},
  rect() {},
  restore() {},
  save() {},
  setTransformCalls: [],
  setTransform(...args) {
    this.setTransformCalls.push(args);
  }
});

const geography = Object.freeze({
  bounds: Object.freeze({
    maxLat: 40,
    maxLon: 160,
    minLat: 0,
    minLon: 100
  }),
  features: Object.freeze([])
});

test("MapRenderer reuses one high-DPI layer and redraws it for camera changes", () => {
  const layers = [];
  const renderer = new MapRenderer({
    canvasFactory: () => {
      const context = createContext();
      const canvas = {
        getContext: () => context,
        height: 0,
        width: 0
      };
      layers.push({ canvas, context });
      return canvas;
    }
  });
  const output = createContext();
  const drawOptions = {
    bounds: geography.bounds,
    cameraRevision: 0,
    context: output,
    geography,
    height: 400,
    padding: { bottom: 20, left: 30, right: 10, top: 10 },
    scale: 2,
    width: 600
  };

  renderer.draw(drawOptions);
  assert.equal(layers.length, 1);
  assert.equal(layers[0].canvas.width, 1200);
  assert.equal(layers[0].canvas.height, 800);
  assert.equal(layers[0].context.drawImageCalls.length, 0);
  assert.equal(layers[0].context.clearRectCalls, 1);
  renderer.draw(drawOptions);
  assert.equal(layers[0].context.clearRectCalls, 1);

  const image = {};
  renderer.setTerrainTexture({
    image,
    source: {
      bounds: geography.bounds,
      height: 1600,
      width: 2400
    }
  });
  renderer.draw(drawOptions);

  assert.equal(layers.length, 1);
  assert.equal(layers[0].context.drawImageCalls.length, 1);
  assert.equal(layers[0].context.drawImageCalls[0][0], image);
  assert.equal(layers[0].context.clearRectCalls, 2);
  renderer.draw(drawOptions);
  assert.equal(layers[0].context.clearRectCalls, 2);

  renderer.draw({
    ...drawOptions,
    bounds: { maxLat: 30, maxLon: 145, minLat: 10, minLon: 115 },
    cameraRevision: 1
  });
  assert.equal(layers.length, 1);
  assert.equal(layers[0].context.clearRectCalls, 3);
  assert.equal(layers[0].context.drawImageCalls.length, 2);
  assert.deepEqual(
    layers[0].context.drawImageCalls[1].slice(1, 5),
    [600, 400, 1200, 800]
  );
  assert.deepEqual(layers[0].context.setTransformCalls[0], [2, 0, 0, 2, 0, 0]);
  assert.throws(
    () => renderer.setTerrainTexture({ source: {} }),
    /decoded image/u
  );
});

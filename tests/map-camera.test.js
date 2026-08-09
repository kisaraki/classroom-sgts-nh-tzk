import assert from "node:assert/strict";
import test from "node:test";

import {
  createMapCamera,
  mapCameraViewBounds,
  panMapCameraByPixels,
  resetMapCamera,
  transformMapCameraByPinch,
  zoomMapCameraAtCanvasPoint
} from "../js/rendering/MapCamera.js";
import { canvasToGeo, geoToCanvas } from "../js/utils/geo.js";

const BOUNDS = Object.freeze({
  maxLat: 40,
  maxLon: 160,
  minLat: 0,
  minLon: 100
});
const VIEWPORT = Object.freeze({
  height: 400,
  padding: Object.freeze({ bottom: 20, left: 30, right: 10, top: 10 }),
  width: 600
});

const closeTo = (actual, expected, tolerance = 1e-10) => {
  assert.ok(
    Math.abs(actual - expected) <= tolerance,
    `${actual} should be within ${tolerance} of ${expected}`
  );
};

test("map camera starts at the full Northwest Pacific bounds", () => {
  const camera = createMapCamera({ worldBounds: BOUNDS });

  assert.deepEqual(mapCameraViewBounds(camera), BOUNDS);
  assert.equal(camera.centerLat, 20);
  assert.equal(camera.centerLon, 130);
  assert.equal(camera.zoom, 1);
  assert.equal(camera.revision, 0);
});

test("cursor-anchored zoom preserves the geographic point under the cursor", () => {
  const camera = createMapCamera({ worldBounds: BOUNDS });
  const point = Object.freeze({ x: 247, y: 173 });
  const anchor = canvasToGeo(point, {
    bounds: mapCameraViewBounds(camera),
    ...VIEWPORT
  });
  const zoomed = zoomMapCameraAtCanvasPoint(camera, {
    factor: 2,
    point,
    viewport: VIEWPORT
  });
  const projected = geoToCanvas(anchor, {
    bounds: mapCameraViewBounds(zoomed),
    ...VIEWPORT
  });

  closeTo(projected.x, point.x);
  closeTo(projected.y, point.y);
  assert.equal(zoomed.zoom, 2);
  assert.equal(zoomed.revision, 1);
});

test("drag pan uses CSS pixels and clamps the camera to world edges", () => {
  const camera = zoomMapCameraAtCanvasPoint(
    createMapCamera({ worldBounds: BOUNDS }),
    {
      factor: 2,
      point: { x: 310, y: 195 },
      viewport: VIEWPORT
    }
  );
  const panned = panMapCameraByPixels(camera, {
    deltaX: 80,
    deltaY: 40,
    viewport: VIEWPORT
  });

  assert.ok(panned.centerLon < camera.centerLon);
  assert.ok(panned.centerLat > camera.centerLat);

  const clamped = panMapCameraByPixels(panned, {
    deltaX: -100_000,
    deltaY: 100_000,
    viewport: VIEWPORT
  });
  const view = mapCameraViewBounds(clamped);
  closeTo(view.maxLon, BOUNDS.maxLon);
  closeTo(view.maxLat, BOUNDS.maxLat);
});

test("two-point gesture changes scale and keeps the previous midpoint anchor", () => {
  const camera = createMapCamera({ worldBounds: BOUNDS });
  const previousPoints = Object.freeze([
    Object.freeze({ x: 220, y: 180 }),
    Object.freeze({ x: 320, y: 180 })
  ]);
  const currentPoints = Object.freeze([
    Object.freeze({ x: 190, y: 205 }),
    Object.freeze({ x: 350, y: 205 })
  ]);
  const previousCenter = { x: 270, y: 180 };
  const currentCenter = { x: 270, y: 205 };
  const anchor = canvasToGeo(previousCenter, {
    bounds: mapCameraViewBounds(camera),
    ...VIEWPORT
  });
  const transformed = transformMapCameraByPinch(camera, {
    currentPoints,
    previousPoints,
    viewport: VIEWPORT
  });
  const projected = geoToCanvas(anchor, {
    bounds: mapCameraViewBounds(transformed),
    ...VIEWPORT
  });

  closeTo(transformed.zoom, 1.6);
  closeTo(projected.x, currentCenter.x);
  closeTo(projected.y, currentCenter.y);
});

test("camera zoom limits, outside-map input, and reset are stable", () => {
  const camera = createMapCamera({ maximumZoom: 4, worldBounds: BOUNDS });
  const outside = zoomMapCameraAtCanvasPoint(camera, {
    factor: 2,
    point: { x: 5, y: 5 },
    viewport: VIEWPORT
  });
  assert.equal(outside, camera);

  const maximum = zoomMapCameraAtCanvasPoint(camera, {
    factor: 100,
    point: { x: 310, y: 195 },
    viewport: VIEWPORT
  });
  assert.equal(maximum.zoom, 4);
  const reset = resetMapCamera(maximum);
  assert.equal(reset.zoom, 1);
  assert.deepEqual(mapCameraViewBounds(reset), BOUNDS);
});

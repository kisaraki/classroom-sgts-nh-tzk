import assert from "node:assert/strict";
import test from "node:test";

import {
  CanvasRenderer,
  MAP_PADDING
} from "../js/rendering/CanvasRenderer.js";
import { MAP_BOUNDS } from "../js/data/geography.js";
import { geoToCanvas } from "../js/utils/geo.js";

test("CanvasRenderer maps CSS client coordinates correctly after resize", () => {
  let rect = { height: 400, left: 20, top: 30, width: 600 };
  const canvas = {
    getBoundingClientRect: () => rect,
    getContext: () => ({}),
    height: 0,
    width: 0
  };
  const renderer = new CanvasRenderer(canvas, {
    viewportOptions: {
      ResizeObserverClass: null,
      getDevicePixelRatio: () => 1
    }
  });
  const coordinate = { lat: 23.7, lon: 121 };

  for (const nextRect of [
    rect,
    { height: 680, left: 75, top: 90, width: 1024 }
  ]) {
    rect = nextRect;
    const canvasPoint = geoToCanvas(coordinate, {
      bounds: MAP_BOUNDS,
      height: rect.height,
      padding: MAP_PADDING,
      width: rect.width
    });
    const result = renderer.clientPointToGeo({
      clientX: rect.left + canvasPoint.x,
      clientY: rect.top + canvasPoint.y
    });

    assert.ok(Math.abs(result.lat - coordinate.lat) < 1e-10);
    assert.ok(Math.abs(result.lon - coordinate.lon) < 1e-10);
  }
});

test("CanvasRenderer camera preserves zoom anchors and rejects padding input", () => {
  const rect = { height: 400, left: 20, top: 30, width: 600 };
  const canvas = {
    getBoundingClientRect: () => rect,
    getContext: () => ({}),
    height: 0,
    width: 0
  };
  const renderer = new CanvasRenderer(canvas, {
    viewportOptions: {
      ResizeObserverClass: null,
      getDevicePixelRatio: () => 2
    }
  });
  const clientPoint = { clientX: 280, clientY: 210 };
  const before = renderer.clientPointToGeo(clientPoint);

  renderer.zoomMapAtClientPoint(clientPoint, 2);
  const after = renderer.clientPointToGeo(clientPoint);
  assert.ok(Math.abs(after.lat - before.lat) < 1e-10);
  assert.ok(Math.abs(after.lon - before.lon) < 1e-10);
  assert.equal(renderer.mapView.zoom, 2);

  const centerBeforePan = renderer.mapView.centerLon;
  renderer.panMapByPixels({ deltaX: 40, deltaY: 0 });
  assert.ok(renderer.mapView.centerLon < centerBeforePan);
  assert.equal(
    renderer.clientPointToGeo({ clientX: rect.left + 5, clientY: 100 }),
    null
  );
  renderer.resetMapView();
  assert.equal(renderer.mapView.zoom, 1);
  assert.deepEqual(renderer.mapView.bounds, MAP_BOUNDS);
});

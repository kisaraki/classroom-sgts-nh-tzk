import assert from "node:assert/strict";
import test from "node:test";

import {
  canvasToGeo,
  clientPointToGeo,
  destinationPoint,
  findNearestStation,
  geoToCanvas,
  haversineDistanceKm,
  initialBearingDegrees,
  pointInPolygon,
  segmentIntersectsPolygon,
  segmentsIntersect
} from "../js/utils/geo.js";

const BOUNDS = Object.freeze({
  maxLat: 40,
  maxLon: 160,
  minLat: 0,
  minLon: 100
});

const VIEWPORT = Object.freeze({
  bounds: BOUNDS,
  height: 400,
  padding: Object.freeze({ bottom: 0, left: 0, right: 0, top: 0 }),
  width: 600
});

test("known equatorial Haversine distance is approximately 111.2 km", () => {
  const distance = haversineDistanceKm(
    { lat: 0, lon: 100 },
    { lat: 0, lon: 101 }
  );

  assert.ok(Math.abs(distance - 111.195) < 0.01);
});

test("all four geographic corners map to the Canvas corners", () => {
  assert.deepEqual(
    geoToCanvas({ lat: 40, lon: 100 }, VIEWPORT),
    { x: 0, y: 0 }
  );
  assert.deepEqual(
    geoToCanvas({ lat: 40, lon: 160 }, VIEWPORT),
    { x: 600, y: 0 }
  );
  assert.deepEqual(
    geoToCanvas({ lat: 0, lon: 100 }, VIEWPORT),
    { x: 0, y: 400 }
  );
  assert.deepEqual(
    geoToCanvas({ lat: 0, lon: 160 }, VIEWPORT),
    { x: 600, y: 400 }
  );
});

test("coordinate conversion round trips within floating-point tolerance", () => {
  const coordinate = { lat: 23.9751, lon: 121.6133 };
  const canvasPoint = geoToCanvas(coordinate, {
    ...VIEWPORT,
    padding: { bottom: 26, left: 38, right: 12, top: 14 }
  });
  const roundTrip = canvasToGeo(canvasPoint, {
    ...VIEWPORT,
    padding: { bottom: 26, left: 38, right: 12, top: 14 }
  });

  assert.ok(Math.abs(roundTrip.lat - coordinate.lat) < 1e-10);
  assert.ok(Math.abs(roundTrip.lon - coordinate.lon) < 1e-10);
});

test("initial bearing and destination point use north-zero headings", () => {
  const eastBearing = initialBearingDegrees(
    { lat: 0, lon: 100 },
    { lat: 0, lon: 101 }
  );
  const destination = destinationPoint({ lat: 0, lon: 100 }, 111.195, 90);

  assert.ok(Math.abs(eastBearing - 90) < 1e-10);
  assert.ok(Math.abs(destination.lat) < 1e-10);
  assert.ok(Math.abs(destination.lon - 101) < 0.001);
});

test("polygon boundary and vertices are treated as inside", () => {
  const square = [
    [120, 20],
    [122, 20],
    [122, 22],
    [120, 22],
    [120, 20]
  ];

  assert.equal(pointInPolygon({ lat: 21, lon: 121 }, square), true);
  assert.equal(pointInPolygon({ lat: 20, lon: 121 }, square), true);
  assert.equal(pointInPolygon({ lat: 20, lon: 120 }, square), true);
  assert.equal(pointInPolygon({ lat: 23, lon: 121 }, square), false);
});

test("segments include crossing, touching, and polygon intersections", () => {
  assert.equal(
    segmentsIntersect(
      { lat: 0, lon: 0 },
      { lat: 2, lon: 2 },
      { lat: 0, lon: 2 },
      { lat: 2, lon: 0 }
    ),
    true
  );

  const square = [
    [120, 20],
    [122, 20],
    [122, 22],
    [120, 22],
    [120, 20]
  ];
  assert.equal(
    segmentIntersectsPolygon(
      { lat: 21, lon: 119 },
      { lat: 21, lon: 123 },
      square
    ),
    true
  );
});

test("nearest station lookup returns distance with the station", () => {
  const stations = [
    { id: "near", lat: 23, lon: 121 },
    { id: "far", lat: 30, lon: 140 }
  ];
  const nearest = findNearestStation({ lat: 23.1, lon: 121.1 }, stations);

  assert.equal(nearest.station.id, "near");
  assert.ok(nearest.distanceKm < 20);
});

test("client coordinate conversion remains stable after Canvas resize", () => {
  const coordinate = { lat: 23.7, lon: 121 };
  const padding = { bottom: 26, left: 38, right: 12, top: 14 };

  for (const rect of [
    { height: 400, left: 50, top: 20, width: 600 },
    { height: 720, left: 12, top: 80, width: 1100 }
  ]) {
    const canvasPoint = geoToCanvas(coordinate, {
      bounds: BOUNDS,
      height: rect.height,
      padding,
      width: rect.width
    });
    const result = clientPointToGeo(
      {
        clientX: rect.left + canvasPoint.x,
        clientY: rect.top + canvasPoint.y
      },
      { bounds: BOUNDS, padding, rect }
    );

    assert.ok(Math.abs(result.lat - coordinate.lat) < 1e-10);
    assert.ok(Math.abs(result.lon - coordinate.lon) < 1e-10);
  }
});

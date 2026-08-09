import assert from "node:assert/strict";
import test from "node:test";

import {
  layoutStationCards,
  stationObservationPresentation
} from "../js/ui/StationMapOverlay.js";

const STATION_IDS = Object.freeze([
  "naha",
  "taipei",
  "taichung",
  "sun-moon-lake",
  "hualien",
  "penghu"
]);

const overlaps = (first, second) =>
  first.x < second.x + second.size.width &&
  first.x + first.size.width > second.x &&
  first.y < second.y + second.size.height &&
  first.y + first.size.height > second.y;

const assertLayout = (positions, viewport) => {
  const left = viewport.padding.left;
  const right = viewport.width - viewport.padding.right;
  const top = viewport.padding.top;
  const bottom = viewport.height - viewport.padding.bottom;

  assert.equal(positions.length, 6);
  for (const position of positions) {
    assert.ok(position.x >= left);
    assert.ok(position.x + position.size.width <= right);
    assert.ok(position.y >= top);
    assert.ok(position.y + position.size.height <= bottom);
  }

  for (let first = 0; first < positions.length; first += 1) {
    for (let second = first + 1; second < positions.length; second += 1) {
      assert.equal(
        overlaps(positions[first], positions[second]),
        false,
        `${positions[first].id} overlaps ${positions[second].id}`
      );
    }
  }
};

test("station presentation uses complete meteorological terms without mutation", () => {
  const observation = Object.freeze({
    distanceKm: 125.48,
    station: Object.freeze({
      accumulatedRain: 42.6,
      gust: 18.3,
      hourlyRainRate: 7.4,
      id: "hualien",
      lat: 23.9751,
      lon: 121.6133,
      name: "花蓮",
      sustainedWind: 12.8,
      terrainCorrection: 1.25,
      updateSimulationMinutes: 130
    })
  });
  const before = JSON.stringify(observation);
  const presentation = stationObservationPresentation(observation, {
    lat: 22,
    lon: 125
  });

  assert.match(presentation.accessibleText, /持續風每秒 12\.8 公尺/u);
  assert.match(presentation.accessibleText, /最大陣風每秒 18\.3 公尺/u);
  assert.match(presentation.accessibleText, /當前雨率每小時 7\.4 毫米/u);
  assert.match(presentation.accessibleText, /累積雨量 42\.6 毫米/u);
  assert.equal(presentation.updateTime, "00 日 02 時 10 分");
  assert.equal(JSON.stringify(observation), before);
});

test("desktop station callouts stay inside the map and never overlap", () => {
  const viewport = Object.freeze({
    height: 620,
    padding: Object.freeze({ bottom: 26, left: 38, right: 12, top: 14 }),
    width: 1000
  });
  const anchors = STATION_IDS.map((id, index) =>
    Object.freeze({
      id,
      visible: true,
      x: 385 + index * 22,
      y: 205 + index * 14
    })
  );
  const sizes = Object.fromEntries(
    STATION_IDS.map((id) => [id, Object.freeze({ height: 104, width: 184 })])
  );
  const positions = layoutStationCards({ anchors, sizes, viewport });

  assertLayout(positions, viewport);
  assert.deepEqual(
    layoutStationCards({ anchors, sizes, viewport }),
    positions
  );
});

test("compact station cards form a bounded three-by-two map overlay", () => {
  const viewport = Object.freeze({
    height: 336,
    padding: Object.freeze({ bottom: 26, left: 38, right: 12, top: 14 }),
    width: 358
  });
  const compactWidth =
    (viewport.width - viewport.padding.left - viewport.padding.right - 32) / 3;
  const anchors = STATION_IDS.map((id, index) =>
    Object.freeze({
      id,
      visible: true,
      x: 130 + index * 8,
      y: 145 + index * 4
    })
  );
  const sizes = Object.fromEntries(
    STATION_IDS.map((id) => [
      id,
      Object.freeze({ height: 74, width: compactWidth })
    ])
  );
  const positions = layoutStationCards({
    anchors,
    compact: true,
    sizes,
    viewport
  });

  assertLayout(positions, viewport);
  assert.equal(new Set(positions.map((position) => position.y)).size, 2);
  for (const anchor of anchors) {
    assert.equal(
      positions.some(
        (position) =>
          anchor.x >= position.x &&
          anchor.x <= position.x + position.size.width &&
          anchor.y >= position.y &&
          anchor.y <= position.y + position.size.height
      ),
      false,
      `${anchor.id} marker is covered by a compact station card`
    );
  }
});

test("desktop right rail stays above the map controls", () => {
  const viewport = Object.freeze({
    height: 620,
    padding: Object.freeze({ bottom: 26, left: 38, right: 12, top: 14 }),
    width: 1000
  });
  const anchors = STATION_IDS.map((id, index) =>
    Object.freeze({
      id,
      visible: true,
      x: 760 + index * 20,
      y: 280 + index * 18
    })
  );
  const sizes = Object.fromEntries(
    STATION_IDS.map((id) => [id, Object.freeze({ height: 104, width: 184 })])
  );
  const controls = Object.freeze({
    bottom: 608,
    left: 760,
    right: 990,
    top: 510
  });
  const positions = layoutStationCards({
    anchors,
    obstacles: [controls],
    sizes,
    viewport
  });

  assertLayout(positions, viewport);
  for (const position of positions) {
    assert.equal(
      position.x < controls.right &&
        position.x + position.size.width > controls.left &&
        position.y < controls.bottom &&
        position.y + position.size.height > controls.top,
      false,
      `${position.id} overlaps the map controls`
    );
  }
});

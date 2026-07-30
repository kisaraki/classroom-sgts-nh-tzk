import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  findLandRegion,
  MAP_BOUNDS,
  validateMapData
} from "../js/data/geography.js";
import { WEATHER_STATIONS } from "../js/data/stations.js";
import {
  isPointInBounds,
  pointInPolygon,
  segmentIntersectsPolygon
} from "../js/utils/geo.js";

const TEST_DIRECTORY = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(TEST_DIRECTORY, "..");
const MAP_PATH = path.join(
  PROJECT_ROOT,
  "assets/maps/northwest-pacific.json"
);
const loadMap = async () =>
  validateMapData(JSON.parse(await readFile(MAP_PATH, "utf8")));
const clone = (value) => JSON.parse(JSON.stringify(value));

test("map metadata contains source, license, version, and simplification", async () => {
  const mapData = await loadMap();

  assert.equal(mapData.schemaVersion, 1);
  assert.equal(mapData.metadata.formatVersion, "sgts-map-1");
  assert.match(mapData.metadata.source.url, /^https:\/\/www\.naturalearthdata\.com/);
  assert.equal(mapData.metadata.license.name, "Public domain");
  assert.match(mapData.metadata.simplification, /educational polygons/);
  assert.equal(mapData.metadata.generatedAt, "2026-07-30");
});

test("map includes every required first-edition geography group", async () => {
  const mapData = await loadMap();
  const ids = new Set(
    mapData.features.map((feature) => feature.properties.regionId)
  );

  for (const id of [
    "taiwan-main",
    "china-southeast",
    "vietnam-north",
    "hainan",
    "philippines-luzon",
    "ryukyu-okinawa",
    "japan-kyushu",
    "japan-shikoku",
    "japan-honshu",
    "japan-hokkaido"
  ]) {
    assert.equal(ids.has(id), true, `missing ${id}`);
  }
});

test("Taiwan interior is land and east-side sea is ocean", async () => {
  const mapData = await loadMap();

  assert.equal(
    findLandRegion({ lat: 23.7, lon: 121 }, mapData)?.properties.regionId,
    "taiwan-main"
  );
  assert.equal(findLandRegion({ lat: 23.7, lon: 123 }, mapData), null);
});

test("a west-east segment crossing Taiwan intersects its polygon", async () => {
  const mapData = await loadMap();
  const taiwan = mapData.features.find(
    (feature) => feature.properties.regionId === "taiwan-main"
  );

  assert.equal(
    segmentIntersectsPolygon(
      { lat: 24, lon: 119 },
      { lat: 24, lon: 123 },
      taiwan.geometry.coordinates[0]
    ),
    true
  );
});

test("Taiwan coastline boundary and vertex are land", async () => {
  const mapData = await loadMap();
  const taiwan = mapData.features.find(
    (feature) => feature.properties.regionId === "taiwan-main"
  );
  const ring = taiwan.geometry.coordinates[0];

  assert.equal(pointInPolygon({ lat: 25.3, lon: 121.55 }, ring), true);
  assert.equal(pointInPolygon({ lat: 24.8, lon: 121.9 }, ring), true);
});

test("Taiwan has stable identifiers and all four coast sides", async () => {
  const mapData = await loadMap();
  const taiwan = mapData.features.find(
    (feature) => feature.properties.regionId === "taiwan-main"
  );
  const sides = taiwan.properties.coastSegments
    .map((segment) => segment.coastSide)
    .sort();

  assert.deepEqual(sides, ["east", "north", "south", "west"]);
});

test("all required stations are unique and inside map bounds", () => {
  assert.deepEqual(
    WEATHER_STATIONS.map((station) => station.id),
    [
      "naha",
      "taipei",
      "taichung",
      "sun-moon-lake",
      "hualien",
      "penghu"
    ]
  );

  assert.equal(new Set(WEATHER_STATIONS.map((station) => station.id)).size, 6);

  for (const station of WEATHER_STATIONS) {
    assert.equal(isPointInBounds(station, MAP_BOUNDS), true, station.id);
    assert.equal(station.isVirtual, false);
  }
});

test("geographic data never uses alternate longitude field names", async () => {
  const mapData = await loadMap();
  const serialized = JSON.stringify({ mapData, stations: WEATHER_STATIONS });

  assert.doesNotMatch(serialized, /"(?:lng|long)"\s*:/);
});

test("map validation rejects missing license and duplicate region IDs", async () => {
  const mapData = await loadMap();
  const missingLicense = clone(mapData);
  delete missingLicense.metadata.license;
  assert.throws(() => validateMapData(missingLicense), /missing license/);

  const duplicateRegion = clone(mapData);
  duplicateRegion.features[1].properties.regionId =
    duplicateRegion.features[0].properties.regionId;
  assert.throws(() => validateMapData(duplicateRegion), /unique regionId/);

  const unknownField = clone(mapData);
  unknownField.metadata.untrusted = true;
  assert.throws(() => validateMapData(unknownField), /unknown fields/);
});

test("map validation rejects counterclockwise exterior rings", async () => {
  const mapData = await loadMap();
  const reversedRing = clone(mapData);
  reversedRing.features[0].geometry.coordinates[0].reverse();

  assert.throws(
    () => validateMapData(reversedRing),
    /exterior ring must be clockwise/
  );
});

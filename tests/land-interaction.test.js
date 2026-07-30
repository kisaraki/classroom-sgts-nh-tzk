import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { EventBus, EventType } from "../js/core/EventBus.js";
import { validateMapData } from "../js/data/geography.js";
import {
  TerrainZone,
  getTerrainProfile
} from "../js/data/terrain.js";
import { Typhoon } from "../js/model/Typhoon.js";
import { LandInteractionModel } from "../js/simulation/LandInteractionModel.js";

const TEST_DIRECTORY = path.dirname(fileURLToPath(import.meta.url));
const MAP_PATH = path.join(
  TEST_DIRECTORY,
  "../assets/maps/northwest-pacific.json"
);
const loadMap = async () =>
  validateMapData(JSON.parse(await readFile(MAP_PATH, "utf8")));

const createStorm = (overrides = {}) =>
  new Typhoon({
    active: true,
    centralPressure: 955,
    eventHistory: [],
    galeRadius: 180,
    heading: 270,
    id: "land-test",
    isOverLand: false,
    lat: 23.7,
    lon: 122.2,
    maxWind: 45,
    moisture: 0.82,
    name: "LAND TEST",
    organization: 0.82,
    structureStage: "eye",
    symmetry: 0.8,
    trackHistory: [],
    translationSpeed: 15,
    ...overrides
  });

test("Taiwan terrain distinguishes four required teaching regions", async () => {
  const mapData = await loadMap();
  const profiles = [
    getTerrainProfile({ lat: 23.7, lon: 120.5 }, mapData),
    getTerrainProfile({ lat: 23.7, lon: 121.0 }, mapData),
    getTerrainProfile({ lat: 23.7, lon: 121.28 }, mapData),
    getTerrainProfile({ lat: 23.7, lon: 121.62 }, mapData)
  ];

  assert.deepEqual(
    profiles.map((profile) => profile.zone),
    [
      TerrainZone.WEST_PLAIN,
      TerrainZone.CENTRAL_MOUNTAINS,
      TerrainZone.EAST_RIFT_VALLEY,
      TerrainZone.COAST_RANGE
    ]
  );
  assert.ok(profiles[1].elevation > profiles[3].elevation);
  assert.ok(profiles[3].elevation > profiles[2].elevation);
});

test("Taiwan landfall and sea re-entry each fire once per transition", async () => {
  const mapData = await loadMap();
  const eventBus = new EventBus();
  const observed = [];
  const typhoon = createStorm();
  const model = new LandInteractionModel({ eventBus });

  eventBus.on(EventType.LANDFALL, (event) => observed.push(event));
  eventBus.on(EventType.SEA_REENTRY, (event) => observed.push(event));

  const landfall = model.step({
    mapData,
    pathPoints: [
      { lat: 23.7, lon: 122.2 },
      { lat: 23.7, lon: 121.5 }
    ],
    simulationMinutes: 10,
    stepIndex: 1,
    stepMinutes: 10,
    typhoon
  });
  const inland = model.step({
    mapData,
    pathPoints: [
      { lat: 23.7, lon: 121.5 },
      { lat: 23.7, lon: 120.5 }
    ],
    simulationMinutes: 20,
    stepIndex: 2,
    stepMinutes: 10,
    typhoon
  });
  const reentry = model.step({
    mapData,
    pathPoints: [
      { lat: 23.7, lon: 120.5 },
      { lat: 23.7, lon: 119.6 }
    ],
    simulationMinutes: 30,
    stepIndex: 3,
    stepMinutes: 10,
    typhoon
  });
  const ocean = model.step({
    mapData,
    pathPoints: [
      { lat: 23.7, lon: 119.6 },
      { lat: 23.7, lon: 119.5 }
    ],
    simulationMinutes: 40,
    stepIndex: 4,
    stepMinutes: 10,
    typhoon
  });

  assert.equal(landfall.events.filter((event) => event.type === "LANDFALL").length, 1);
  assert.equal(inland.events.length, 0);
  assert.equal(reentry.events.filter((event) => event.type === "SEA_REENTRY").length, 1);
  assert.equal(ocean.events.length, 0);
  assert.deepEqual(observed.map((event) => event.type), [
    "LANDFALL",
    "SEA_REENTRY"
  ]);
  assert.equal(typhoon.eventHistory.length, 2);
  assert.equal(typhoon.eventHistory[0].regionId, "taiwan-main");
});

test("time-integrated Central Mountain Range crossing damages wind and symmetry", async () => {
  const mapData = await loadMap();
  const mountainStorm = createStorm({
    isOverLand: true,
    lat: 23.7,
    lon: 121
  });
  const oceanStorm = createStorm();
  const mountainModel = new LandInteractionModel();
  const oceanModel = new LandInteractionModel();

  const mountain = mountainModel.step({
    mapData,
    pathPoints: [{ lat: 23.7, lon: 121 }],
    simulationMinutes: 360,
    stepIndex: 1,
    stepMinutes: 360,
    typhoon: mountainStorm
  });
  const ocean = oceanModel.step({
    mapData,
    pathPoints: [{ lat: 23.7, lon: 123 }],
    simulationMinutes: 360,
    stepIndex: 1,
    stepMinutes: 360,
    typhoon: oceanStorm
  });

  assert.equal(mountain.endProfile.zone, TerrainZone.CENTRAL_MOUNTAINS);
  assert.ok(mountain.windLoss > 5);
  assert.ok(mountain.organizationLoss > 0.2);
  assert.ok(mountain.symmetryLoss > 0.3);
  assert.ok(mountainStorm.maxWind < oceanStorm.maxWind);
  assert.ok(mountainStorm.symmetry < oceanStorm.symmetry);
  assert.equal(ocean.landFraction, 0);
});

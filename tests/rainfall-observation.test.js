import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { validateMapData } from "../js/data/geography.js";
import { WEATHER_STATIONS } from "../js/data/stations.js";
import { getTerrainProfile } from "../js/data/terrain.js";
import { createEnvironmentGrid } from "../js/model/Environment.js";
import { Typhoon } from "../js/model/Typhoon.js";
import { createWeatherStations } from "../js/model/WeatherStation.js";
import { ObservationModel } from "../js/simulation/ObservationModel.js";
import {
  calculateTerrainRainFactor,
  integrateRainfall
} from "../js/simulation/RainfallModel.js";
import { createRandomStreams } from "../js/utils/random.js";

const TEST_DIRECTORY = path.dirname(fileURLToPath(import.meta.url));
const MAP_PATH = path.join(
  TEST_DIRECTORY,
  "../assets/maps/northwest-pacific.json"
);
const loadMap = async () =>
  validateMapData(JSON.parse(await readFile(MAP_PATH, "utf8")));

const createStorm = () =>
  new Typhoon({
    active: true,
    centralPressure: 945,
    eventHistory: [],
    galeRadius: 220,
    heading: 270,
    id: "rain-test",
    isOverLand: false,
    lat: 23.8,
    lon: 121.6,
    maxWind: 48,
    moisture: 0.86,
    name: "RAIN TEST",
    organization: 0.82,
    structureStage: "eye",
    symmetry: 0.78,
    trackHistory: [],
    translationSpeed: 12
  });

test("ten-minute rainfall integration uses one sixth of the hourly rate", () => {
  assert.equal(integrateRainfall(10, 24, 10), 14);
  assert.equal(integrateRainfall(0, 9, 20), 3);
});

test("windward terrain lift exceeds leeward rain shadow", async () => {
  const mapData = await loadMap();
  const westSlope = getTerrainProfile({ lat: 23.7, lon: 120.9 }, mapData);
  const eastSlope = getTerrainProfile({ lat: 23.7, lon: 121.12 }, mapData);
  const easterlyFlow = { steeringU: 8, steeringV: 1 };

  assert.equal(westSlope.slopeAspect, "west");
  assert.equal(eastSlope.slopeAspect, "east");
  assert.ok(
    calculateTerrainRainFactor(westSlope, easterlyFlow) >
      calculateTerrainRainFactor(eastSlope, easterlyFlow)
  );
});

test("station wind and rain are model-derived, integrated, and resettable", async () => {
  const mapData = await loadMap();
  const environment = createEnvironmentGrid({
    random: createRandomStreams("station-observation").environment,
    terrainAt: (point) => getTerrainProfile(point, mapData)
  });
  const model = new ObservationModel();
  const typhoon = createStorm();
  const first = model.step({
    environment,
    mapData,
    simulationMinutes: 10,
    stepMinutes: 10,
    typhoon
  });
  const second = model.step({
    environment,
    mapData,
    simulationMinutes: 20,
    stepMinutes: 10,
    typhoon
  });
  const hualienFirst = first.find(
    (observation) => observation.station.id === "hualien"
  ).station;
  const hualienSecond = second.find(
    (observation) => observation.station.id === "hualien"
  ).station;

  assert.equal(first.length, 6);
  assert.ok(hualienFirst.sustainedWind > 0);
  assert.ok(hualienFirst.gust > hualienFirst.sustainedWind);
  assert.ok(hualienFirst.hourlyRainRate > 0);
  assert.ok(hualienSecond.accumulatedRain > hualienFirst.accumulatedRain);
  assert.ok(
    Math.abs(
      hualienFirst.accumulatedRain -
        hualienFirst.hourlyRainRate / 6
    ) < 1e-9
  );

  model.reset();

  for (const station of model.stations) {
    assert.equal(station.sustainedWind, 0);
    assert.equal(station.gust, 0);
    assert.equal(station.hourlyRainRate, 0);
    assert.equal(station.accumulatedRain, 0);
  }
});

test("weather station runtime schema rejects unknown fields", () => {
  assert.throws(
    () =>
      createWeatherStations([
        {
          ...WEATHER_STATIONS[0],
          unexpected: true
        }
      ]),
    /unknown fields/u
  );
});

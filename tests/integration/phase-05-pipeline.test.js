import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { EventBus } from "../../js/core/EventBus.js";
import { validateMapData } from "../../js/data/geography.js";
import { getTerrainProfile } from "../../js/data/terrain.js";
import { createEnvironmentGrid } from "../../js/model/Environment.js";
import { Typhoon } from "../../js/model/Typhoon.js";
import { IntensityModel } from "../../js/simulation/IntensityModel.js";
import {
  LandInteractionModel,
  createLandImpactCell
} from "../../js/simulation/LandInteractionModel.js";
import { ObservationModel } from "../../js/simulation/ObservationModel.js";
import { OceanCoolingModel } from "../../js/simulation/OceanCoolingModel.js";
import { createRandomStreams } from "../../js/utils/random.js";

const TEST_DIRECTORY = path.dirname(fileURLToPath(import.meta.url));
const MAP_PATH = path.join(
  TEST_DIRECTORY,
  "../../assets/maps/northwest-pacific.json"
);
const loadMap = async () =>
  validateMapData(JSON.parse(await readFile(MAP_PATH, "utf8")));

const createSession = (mapData) => {
  const streams = createRandomStreams("phase-5-pipeline");
  const eventBus = new EventBus();
  const environment = createEnvironmentGrid({
    random: streams.environment,
    terrainAt: (point) => getTerrainProfile(point, mapData)
  });
  const typhoon = new Typhoon({
    active: true,
    centralPressure: 950,
    eventHistory: [],
    galeRadius: 220,
    heading: 270,
    id: "pipeline-storm",
    isOverLand: false,
    lat: 23.7,
    lon: 122.2,
    maxWind: 48,
    moisture: 0.84,
    name: "PIPELINE",
    organization: 0.82,
    structureStage: "eye",
    symmetry: 0.8,
    trackHistory: [],
    translationSpeed: 12
  });

  return {
    environment,
    eventBus,
    intensity: new IntensityModel({
      randomStreams: streams,
      seed: "phase-5-pipeline"
    }),
    land: new LandInteractionModel({ eventBus }),
    observations: new ObservationModel(),
    ocean: new OceanCoolingModel(),
    typhoon
  };
};

test("Phase 5 pipeline integrates wake, landfall, intensity, stations, and restart", async () => {
  const mapData = await loadMap();
  const session = createSession(mapData);

  session.ocean.step({
    environment: session.environment,
    stepMinutes: 10,
    typhoon: session.typhoon
  });
  assert.ok(
    session.environment.cells.some((cell) => cell.coldWake > 0)
  );

  session.typhoon.applyMovement({
    heading: 270,
    lat: 23.7,
    lon: 121.5,
    translationSpeed: 12
  });
  const land = session.land.step({
    mapData,
    pathPoints: [
      { lat: 23.7, lon: 122.2 },
      { lat: 23.7, lon: 121.5 }
    ],
    simulationMinutes: 20,
    stepIndex: 2,
    stepMinutes: 10,
    typhoon: session.typhoon
  });
  const cell = createLandImpactCell(
    session.environment.sampleAt(session.typhoon),
    land
  );
  session.intensity.step({
    cell,
    landInteraction: land,
    simulationMinutes: 20,
    stepIndex: 2,
    stepMinutes: 10,
    typhoon: session.typhoon
  });
  const observations = session.observations.step({
    environment: session.environment,
    mapData,
    simulationMinutes: 20,
    stepMinutes: 10,
    typhoon: session.typhoon
  });

  assert.deepEqual(
    land.events.map((event) => event.type),
    ["LANDFALL"]
  );
  assert.equal(session.typhoon.eventHistory[0].type, "LANDFALL");
  assert.equal(observations.length, 6);
  assert.ok(
    observations.some(
      (observation) => observation.station.accumulatedRain > 0
    )
  );

  const restarted = createSession(mapData);

  assert.equal(
    restarted.environment.cells.every((gridCell) => gridCell.coldWake === 0),
    true
  );
  assert.equal(
    restarted.observations.stations.every(
      (station) =>
        station.accumulatedRain === 0 &&
        station.hourlyRainRate === 0 &&
        station.sustainedWind === 0
    ),
    true
  );
  assert.equal(restarted.typhoon.eventHistory.length, 0);
  assert.equal(restarted.land.snapshot().landfallCount, 0);
});

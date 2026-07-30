import { PROJECT_CONFIG } from "./config.js";
import { GameEngine } from "./core/GameEngine.js";
import { GameState } from "./core/StateMachine.js";
import { SimulationClock } from "./core/SimulationClock.js";
import {
  describeGeographicPoint,
  loadGeography
} from "./data/geography.js";
import { Environment } from "./model/Environment.js";
import { GridCell } from "./model/GridCell.js";
import { Typhoon } from "./model/Typhoon.js";
import { CanvasRenderer } from "./rendering/CanvasRenderer.js";
import {
  IntensityModel,
  calculateEnvironmentalFactors
} from "./simulation/IntensityModel.js";
import { formatSimulationTime } from "./ui/CanvasViewport.js";
import { createRandomStreams } from "./utils/random.js";

const requireElement = (selector) => {
  const element = document.querySelector(selector);

  if (!element) {
    throw new Error(`Required element is missing: ${selector}`);
  }

  return element;
};

const createDemoSession = () => {
  const demo = PROJECT_CONFIG.gameBalance.demoTyphoon;
  const environmentConfig = PROJECT_CONFIG.gameBalance.demoEnvironment;
  const typhoon = new Typhoon({
    ...demo,
    active: true,
    eventHistory: [],
    id: "demo-kosmos-03",
    isOverLand: false,
    trackHistory: []
  });
  const cell = new GridCell({
    OHC: environmentConfig.oceanHeatContent,
    SST: environmentConfig.seaSurfaceTemperature,
    coldWake: environmentConfig.coldWake,
    landFraction: environmentConfig.landFraction,
    lat: typhoon.lat,
    lon: typhoon.lon,
    relativeHumidity: environmentConfig.relativeHumidity,
    steeringU: 0,
    steeringV: 0,
    surfacePressure: environmentConfig.surfacePressure,
    surfaceRoughness: environmentConfig.surfaceRoughness,
    terrainHeight: environmentConfig.terrainHeight,
    verticalWindShear: environmentConfig.verticalWindShear
  });
  const randomStreams = createRandomStreams(PROJECT_CONFIG.gameBalance.demoSeed);
  const intensityModel = new IntensityModel({
    randomStreams,
    seed: PROJECT_CONFIG.gameBalance.demoSeed
  });
  const environment = new Environment({ cells: [cell] });

  typhoon.recordTrack({ simulationMinutes: 0, stepIndex: 0 });

  return {
    cell,
    environment,
    factors: calculateEnvironmentalFactors(typhoon, cell),
    fingerprint: intensityModel.fingerprint(typhoon),
    intensityModel,
    randomStreams,
    targetWind: typhoon.maxWind,
    typhoon
  };
};

const bootstrap = async () => {
  const elements = {
    canvas: requireElement("#simulation-canvas"),
    currentSpeed: requireElement("#current-speed"),
    engineState: requireElement("#engine-state"),
    error: requireElement("#app-error"),
    fps: requireElement("#fps-readout"),
    mapDataStatus: requireElement("#map-data-status"),
    pauseButton: requireElement("#pause-button"),
    particlesEnabled: requireElement("#particles-enabled"),
    probeCoordinate: requireElement("#probe-coordinate"),
    probeStation: requireElement("#probe-station"),
    probeSurface: requireElement("#probe-surface"),
    simulationTime: requireElement("#sim-time"),
    speedButtons: [...document.querySelectorAll("[data-speed]")],
    startButton: requireElement("#start-button"),
    stepCount: requireElement("#step-count"),
    stormFingerprint: requireElement("#storm-fingerprint"),
    stormOrganization: requireElement("#storm-organization"),
    stormPressure: requireElement("#storm-pressure"),
    stormRadius: requireElement("#storm-radius"),
    stormStage: requireElement("#storm-stage"),
    stormSymmetry: requireElement("#storm-symmetry"),
    stormWind: requireElement("#storm-wind"),
    targetWind: requireElement("#target-wind"),
    updateCount: requireElement("#update-count"),
    visibility: requireElement("#visibility-status")
  };
  const factorElements = Object.fromEntries(
    [
      "coldWake",
      "coriolisOrganization",
      "developmentPotential",
      "heat",
      "land",
      "moisture",
      "oceanDepth",
      "shear",
      "terrain"
    ].map((name) => [name, requireElement(`[data-factor="${name}"]`)])
  );

  if (elements.speedButtons.length !== PROJECT_CONFIG.simulation.speeds.length) {
    throw new Error("Simulation speed controls are incomplete.");
  }

  const canvasRenderer = new CanvasRenderer(elements.canvas);
  let session = createDemoSession();
  let mapData = null;
  let mapReady = false;
  let updateCount = 0;

  const clock = new SimulationClock({
    maxCatchUpSteps: PROJECT_CONFIG.simulation.maxCatchUpSteps,
    maxFrameDeltaMs: PROJECT_CONFIG.simulation.maxFrameDeltaMs,
    realStepMs: PROJECT_CONFIG.simulation.realStepMs,
    stepMinutes: PROJECT_CONFIG.simulation.stepMinutes
  });

  const render = ({ clock: clockState, fps, state }) => {
    const storm = session.typhoon;
    document.documentElement.dataset.appState = state.toLowerCase();
    elements.engineState.textContent = state;
    elements.simulationTime.textContent = formatSimulationTime(
      clockState.simulationMinutes
    );
    elements.stepCount.textContent = String(clockState.stepIndex);
    elements.currentSpeed.textContent = `${clockState.speed}×`;
    elements.fps.textContent = Number.isFinite(fps) ? fps.toFixed(0) : "0";
    elements.updateCount.textContent = String(updateCount);
    elements.stormWind.textContent = `${storm.maxWind.toFixed(1)} m/s`;
    elements.stormPressure.textContent =
      `${storm.centralPressure.toFixed(0)} hPa`;
    elements.stormRadius.textContent = `${storm.galeRadius.toFixed(0)} km`;
    elements.stormOrganization.textContent =
      `${(storm.organization * 100).toFixed(0)}%`;
    elements.stormSymmetry.textContent =
      `${(storm.symmetry * 100).toFixed(0)}%`;
    elements.stormStage.textContent = storm.structureStage;
    elements.targetWind.textContent = `${session.targetWind.toFixed(1)} m/s`;
    elements.stormFingerprint.textContent = session.fingerprint;

    for (const [name, element] of Object.entries(factorElements)) {
      element.textContent =
        `${(session.factors[name] * 100).toFixed(0)}%`;
    }
    elements.visibility.textContent = clockState.isHidden
      ? "頁面隱藏｜停止累積"
      : "頁面可見";

    elements.startButton.disabled =
      !mapReady ||
      ![GameState.MENU, GameState.TUTORIAL].includes(state);
    elements.pauseButton.disabled = ![
      GameState.RUNNING,
      GameState.PAUSED
    ].includes(state);
    elements.pauseButton.textContent =
      state === GameState.PAUSED ? "繼續" : "暫停";

    for (const button of elements.speedButtons) {
      button.setAttribute(
        "aria-pressed",
        String(Number(button.dataset.speed) === clockState.speed)
      );
    }

    canvasRenderer.setTyphoon(storm);
    canvasRenderer.draw({
      fps,
      simulationMinutes: clockState.simulationMinutes,
      speed: clockState.speed,
      state,
      stepIndex: clockState.stepIndex
    });
  };

  const engine = new GameEngine({
    clock,
    render,
    update: (step) => {
      updateCount += 1;
      const result = session.intensityModel.step({
        cell: session.cell,
        simulationMinutes: step.simulationMinutes,
        stepIndex: step.stepIndex,
        stepMinutes: step.stepMinutes,
        typhoon: session.typhoon
      });
      session.factors = result.factors;
      session.fingerprint = result.fingerprint;
      session.targetWind = result.targetWind;
    }
  });

  const handleError = (error) => {
    const message = error instanceof Error ? error.message : String(error);
    elements.error.hidden = false;
    elements.error.textContent = `模擬器發生錯誤：${message}`;
    engine.enterError(error);
  };

  const selectMapPoint = (point) => {
    if (!mapData) {
      return;
    }

    const description = describeGeographicPoint(point, mapData);
    const { landRegion, nearestStation, nearestStationDistanceKm } =
      description;
    elements.probeCoordinate.textContent =
      `${point.lat.toFixed(2)}°N, ${point.lon.toFixed(2)}°E`;
    elements.probeSurface.textContent = landRegion
      ? `陸地｜${landRegion.properties.name} (${landRegion.properties.regionId})`
      : "海洋";
    elements.probeStation.textContent =
      `${nearestStation.name}｜${nearestStationDistanceKm.toFixed(1)} km`;
    elements.canvas.setAttribute(
      "aria-label",
      `查詢位置 ${elements.probeCoordinate.textContent}，` +
        `${elements.probeSurface.textContent}，最近測站` +
        `${elements.probeStation.textContent}`
    );
    canvasRenderer.setSelection(description);
  };

  elements.startButton.addEventListener("click", () => {
    try {
      elements.error.hidden = true;
      updateCount = 0;
      session = createDemoSession();
      canvasRenderer.setTyphoon(session.typhoon);
      engine.startSimulation();
    } catch (error) {
      handleError(error);
    }
  });

  elements.pauseButton.addEventListener("click", () => {
    try {
      if (engine.state === GameState.RUNNING) {
        engine.pauseSimulation();
      } else if (engine.state === GameState.PAUSED) {
        engine.resumeSimulation();
      }
    } catch (error) {
      handleError(error);
    }
  });

  for (const button of elements.speedButtons) {
    button.addEventListener("click", () => {
      try {
        engine.setSpeed(Number(button.dataset.speed));
      } catch (error) {
        handleError(error);
      }
    });
  }

  elements.particlesEnabled.addEventListener("change", () => {
    canvasRenderer.setParticlesEnabled(elements.particlesEnabled.checked);
  });

  elements.canvas.addEventListener("pointerup", (event) => {
    try {
      selectMapPoint(canvasRenderer.clientPointToGeo(event));
    } catch (error) {
      handleError(error);
    }
  });

  elements.canvas.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      selectMapPoint({ lat: 23.7, lon: 121 });
    }
  });

  document.addEventListener("visibilitychange", () => {
    engine.setVisibilityHidden(document.hidden);
  });

  window.addEventListener("error", (event) => {
    handleError(event.error ?? event.message);
  });

  window.addEventListener("unhandledrejection", (event) => {
    handleError(event.reason);
  });

  window.addEventListener(
    "pagehide",
    () => {
      canvasRenderer.destroy();
      engine.destroy();
    },
    { once: true }
  );

  engine.setVisibilityHidden(document.hidden);
  canvasRenderer.setTyphoon(session.typhoon);
  canvasRenderer.setParticlesEnabled(elements.particlesEnabled.checked);
  engine.boot();

  try {
    mapData = await loadGeography();
    canvasRenderer.setGeography(mapData);
    mapReady = true;
    elements.mapDataStatus.textContent =
      `${mapData.features.length} regions · v${mapData.metadata.formatVersion}`;
    selectMapPoint({ lat: 23.7, lon: 121 });
  } catch (error) {
    elements.mapDataStatus.textContent = "載入失敗";
    handleError(error);
  }
};

bootstrap().catch((error) => {
  document.documentElement.dataset.appState = "error";
  const errorMessage = document.querySelector("#app-error");

  if (errorMessage) {
    errorMessage.hidden = false;
    errorMessage.textContent = `模擬器無法啟動：${
      error instanceof Error ? error.message : String(error)
    }`;
  }
});

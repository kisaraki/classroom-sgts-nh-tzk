import { PROJECT_CONFIG } from "./config.js";
import { EventBus } from "./core/EventBus.js";
import { FailureEvaluator } from "./core/FailureEvaluator.js";
import { GameEngine } from "./core/GameEngine.js";
import { ObjectiveEvaluator } from "./core/ObjectiveEvaluator.js";
import { GameState } from "./core/StateMachine.js";
import { SimulationClock } from "./core/SimulationClock.js";
import {
  describeGeographicPoint,
  findLandRegion,
  getRegionInlandDepthKm,
  loadGeography
} from "./data/geography.js";
import {
  LEVELS,
  NAHA_STORM_LEVEL,
  getLevelById
} from "./data/levels.js";
import { getTerrainProfile } from "./data/terrain.js";
import { createEnvironmentGrid } from "./model/Environment.js";
import { LevelState } from "./model/LevelState.js";
import { Typhoon } from "./model/Typhoon.js";
import { CanvasRenderer } from "./rendering/CanvasRenderer.js";
import {
  IntensityModel,
  calculateEnvironmentalFactors
} from "./simulation/IntensityModel.js";
import {
  LandInteractionModel,
  createLandImpactCell
} from "./simulation/LandInteractionModel.js";
import { ObservationModel } from "./simulation/ObservationModel.js";
import { OceanCoolingModel } from "./simulation/OceanCoolingModel.js";
import { RainfallModel } from "./simulation/RainfallModel.js";
import { SteeringModel } from "./simulation/SteeringModel.js";
import { formatSimulationTime } from "./ui/CanvasViewport.js";
import { ControlPanel } from "./ui/ControlPanel.js";
import { Dashboard } from "./ui/Dashboard.js";
import { ResultDialog } from "./ui/ResultDialog.js";
import { Tutorial } from "./ui/Tutorial.js";
import {
  createFingerprint,
  createRandomStreams
} from "./utils/random.js";

const requireElement = (selector) => {
  const element = document.querySelector(selector);

  if (!element) {
    throw new Error(`Required element is missing: ${selector}`);
  }

  return element;
};

const createLevelSession = (
  mapData = null,
  {
    eventBus = null,
    level = NAHA_STORM_LEVEL,
    targetControls = level.environmentPreset
  } = {}
) => {
  const typhoon = new Typhoon({
    ...level.spawn,
    active: true,
    eventHistory: [],
    id: `${level.id}-cyclone`,
    isOverLand: false,
    name: "KOSMOS-06",
    trackHistory: []
  });
  const randomStreams = createRandomStreams(level.seed);
  const environment = createEnvironmentGrid({
    controls: level.environmentPreset,
    isLandAt: (point) => Boolean(mapData && findLandRegion(point, mapData)),
    random: randomStreams.environment,
    targetControls,
    terrainAt: mapData
      ? (point) => getTerrainProfile(point, mapData)
      : null
  });
  const cell = environment.sampleAt(typhoon);
  const intensityModel = new IntensityModel({
    randomStreams,
    seed: level.seed
  });
  const steeringModel = new SteeringModel({
    meridionalMultiplier: level.steeringMeridionalMultiplier,
    random: randomStreams.steering,
    seed: level.seed
  });
  const landInteractionModel = new LandInteractionModel({ eventBus });
  const oceanCoolingModel = new OceanCoolingModel({
    coolingMultiplier: level.oceanCoolingMultiplier
  });
  const rainfallModel = new RainfallModel();
  const observationModel = new ObservationModel({ rainfallModel });
  const levelState = new LevelState(level);
  const objectiveEvaluator = new ObjectiveEvaluator({ eventBus });
  const failureEvaluator = new FailureEvaluator({ eventBus });
  const endProfile = getTerrainProfile(typhoon, mapData);
  const landDiagnostic = Object.freeze({
    endProfile,
    events: Object.freeze([]),
    isOverLand: endProfile.isLand,
    landFraction: Number(endProfile.isLand),
    landHours: 0,
    landfallCount: 0,
    organizationLoss: 0,
    reorganizationFactor: 1,
    seaRecoveryHours:
      PROJECT_CONFIG.landInteractionConfig.reorganizationDelayHours,
    seaReentryCount: 0,
    surfaceRoughness: endProfile.roughness,
    symmetryLoss: 0,
    terrainHeight: endProfile.elevation,
    windLoss: 0
  });
  const observations = Object.freeze(
    observationModel.stations.map((station) =>
      Object.freeze({ station: station.snapshot() })
    )
  );
  const oceanDiagnostic = Object.freeze({
    affectedCellCount: 0,
    centerColdWake: cell.coldWake,
    coverageRadiusKm: Math.max(
      PROJECT_CONFIG.oceanCoolingConfig.minimumCoverageRadiusKm,
      typhoon.galeRadius *
        PROJECT_CONFIG.oceanCoolingConfig.coverageRadiusMultiplier
    ),
    effectiveSST: cell.SST - cell.coldWake,
    maximumColdWake: 0,
    meanColdWake: 0
  });
  const headingRadians = (typhoon.heading * Math.PI) / 180;
  const initialSpeedMps = typhoon.translationSpeed / 3.6;

  typhoon.recordTrack({ simulationMinutes: 0, stepIndex: 0 });

  return {
    cell,
    environment,
    factors: calculateEnvironmentalFactors(typhoon, cell),
    failureEvaluator,
    fingerprint: intensityModel.fingerprint(typhoon),
    intensityModel,
    landDiagnostic,
    landInteractionModel,
    latestSurfaceEvent: null,
    level,
    levelState,
    objectiveEvaluator,
    observationModel,
    observations,
    oceanCoolingModel,
    oceanDiagnostic,
    randomStreams,
    steeringDiagnostic: Object.freeze({
      actualVector: Object.freeze({
        u: Math.sin(headingRadians) * initialSpeedMps,
        v: Math.cos(headingRadians) * initialSpeedMps
      })
    }),
    steeringModel,
    targetWind: typhoon.maxWind,
    typhoon
  };
};

const bootstrap = async () => {
  const elements = {
    canvas: requireElement("#simulation-canvas"),
    centerColdWake: requireElement("#center-cold-wake"),
    currentSpeed: requireElement("#current-speed"),
    effectiveSST: requireElement("#effective-sst"),
    engineState: requireElement("#engine-state"),
    error: requireElement("#app-error"),
    fps: requireElement("#fps-readout"),
    environmentControls: requireElement("#environment-controls"),
    environmentGridStatus: requireElement("#environment-grid-status"),
    levelDashboard: requireElement("#level-dashboard"),
    levelSelect: requireElement("#level-select"),
    mapDataStatus: requireElement("#map-data-status"),
    pauseButton: requireElement("#pause-button"),
    particlesEnabled: requireElement("#particles-enabled"),
    probeCoordinate: requireElement("#probe-coordinate"),
    probeStation: requireElement("#probe-station"),
    probeSurface: requireElement("#probe-surface"),
    resetButton: requireElement("#reset-button"),
    resultDialog: requireElement("#result-dialog"),
    simulationTime: requireElement("#sim-time"),
    speedButtons: [...document.querySelectorAll("[data-speed]")],
    startButton: requireElement("#start-button"),
    stepCount: requireElement("#step-count"),
    stormFingerprint: requireElement("#storm-fingerprint"),
    stormSurface: requireElement("#storm-surface"),
    stormMotion: requireElement("#storm-motion"),
    stormOrganization: requireElement("#storm-organization"),
    stormPosition: requireElement("#storm-position"),
    stormPressure: requireElement("#storm-pressure"),
    stormRadius: requireElement("#storm-radius"),
    stormStage: requireElement("#storm-stage"),
    stormSymmetry: requireElement("#storm-symmetry"),
    stormWind: requireElement("#storm-wind"),
    steeringVector: requireElement("#steering-vector"),
    stationObservations: requireElement("#station-observations"),
    surfaceEvents: requireElement("#surface-events"),
    terrainRecovery: requireElement("#terrain-recovery"),
    terrainZone: requireElement("#terrain-zone"),
    tutorial: requireElement("#tutorial-panel"),
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
      "reorganization",
      "shear",
      "terrain"
    ].map((name) => [name, requireElement(`[data-factor="${name}"]`)])
  );

  if (elements.speedButtons.length !== PROJECT_CONFIG.simulation.speeds.length) {
    throw new Error("Simulation speed controls are incomplete.");
  }

  if (elements.levelSelect.options.length !== LEVELS.length) {
    throw new Error("Level selector is incomplete.");
  }

  const canvasRenderer = new CanvasRenderer(elements.canvas);
  const eventBus = new EventBus();
  let activeLevel = NAHA_STORM_LEVEL;
  let session = createLevelSession(null, { eventBus, level: activeLevel });
  let controlPanel = null;
  let resultDialog = null;
  let mapData = null;
  let mapReady = false;
  let updateCount = 0;
  const stationElements = new Map();
  const dashboard = new Dashboard(elements.levelDashboard, {
    level: activeLevel
  });
  const tutorial = new Tutorial(elements.tutorial, {
    level: activeLevel
  });

  const ensureStationElements = () => {
    for (const observation of session.observations) {
      const station = observation.station;

      if (stationElements.has(station.id)) {
        continue;
      }

      const article = document.createElement("article");
      const title = document.createElement("h4");
      const metrics = document.createElement("p");
      const rain = document.createElement("p");
      title.textContent = station.name;
      metrics.dataset.stationWind = station.id;
      rain.dataset.stationRain = station.id;
      article.dataset.stationId = station.id;
      article.append(title, metrics, rain);
      elements.stationObservations.append(article);
      stationElements.set(
        station.id,
        Object.freeze({ article, metrics, rain, title })
      );
    }
  };

  const renderStationObservations = () => {
    ensureStationElements();

    for (const observation of session.observations) {
      const station = observation.station;
      const row = stationElements.get(station.id);
      row.metrics.textContent =
        `風 ${station.sustainedWind.toFixed(1)} · ` +
        `陣風 ${station.gust.toFixed(1)} m/s`;
      row.rain.textContent =
        `雨 ${station.hourlyRainRate.toFixed(1)} mm/h · ` +
        `累積 ${station.accumulatedRain.toFixed(1)} mm · ` +
        `地形 ×${station.terrainCorrection.toFixed(2)}`;
    }
  };

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
    elements.stormPosition.textContent =
      `${storm.lat.toFixed(2)}°N, ${storm.lon.toFixed(2)}°E`;
    elements.stormMotion.textContent =
      `${storm.translationSpeed.toFixed(1)} km/h · ` +
      `${storm.heading.toFixed(0)}°`;
    const { actualVector } = session.steeringDiagnostic;
    elements.steeringVector.textContent =
      `U ${actualVector.u >= 0 ? "+" : ""}${actualVector.u.toFixed(2)} · ` +
      `V ${actualVector.v >= 0 ? "+" : ""}${actualVector.v.toFixed(2)} m/s`;
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
    elements.stormSurface.textContent = session.landDiagnostic.isOverLand
      ? `陸地｜${session.landDiagnostic.endProfile.regionId}`
      : "海洋";
    elements.terrainZone.textContent =
      `${session.landDiagnostic.endProfile.zone} · ` +
      `${session.landDiagnostic.terrainHeight.toFixed(0)} m`;
    elements.centerColdWake.textContent =
      `${session.oceanDiagnostic.centerColdWake.toFixed(2)} °C · ` +
      `${session.oceanDiagnostic.affectedCellCount} cells`;
    elements.effectiveSST.textContent =
      `${session.oceanDiagnostic.effectiveSST.toFixed(2)} °C`;
    elements.terrainRecovery.textContent =
      `${(session.landDiagnostic.reorganizationFactor * 100).toFixed(0)}% · ` +
      `${session.landDiagnostic.seaRecoveryHours.toFixed(1)} h`;
    elements.surfaceEvents.textContent = session.latestSurfaceEvent
      ? `${session.latestSurfaceEvent.type} · ` +
        `${session.latestSurfaceEvent.regionId ?? "海岸"} · ` +
        `${session.latestSurfaceEvent.lat.toFixed(2)}°N, ` +
        `${session.latestSurfaceEvent.lon.toFixed(2)}°E`
      : "尚無海陸轉換";

    for (const [name, element] of Object.entries(factorElements)) {
      element.textContent =
        `${(session.factors[name] * 100).toFixed(0)}%`;
    }
    renderStationObservations();
    dashboard.render({
      levelState: session.levelState,
      simulationMinutes: clockState.simulationMinutes
    });
    tutorial.render(clockState.stepIndex);
    controlPanel?.render();
    elements.visibility.textContent = clockState.isHidden
      ? "頁面隱藏｜停止累積"
      : "頁面可見";

    elements.startButton.disabled =
      !mapReady ||
      ![GameState.MENU, GameState.TUTORIAL].includes(state);
    elements.levelSelect.disabled =
      ![GameState.MENU, GameState.TUTORIAL].includes(state);
    elements.pauseButton.disabled = ![
      GameState.RUNNING,
      GameState.PAUSED
    ].includes(state);
    elements.resetButton.disabled = !mapReady;
    elements.pauseButton.textContent =
      state === GameState.PAUSED ? "繼續" : "暫停";

    for (const button of elements.speedButtons) {
      button.setAttribute(
        "aria-pressed",
        String(Number(button.dataset.speed) === clockState.speed)
      );
    }

    canvasRenderer.setTyphoon(storm);
    canvasRenderer.setLevel(session.level);
    canvasRenderer.setEnvironment(session.environment);
    canvasRenderer.setObservations(session.observations);
    canvasRenderer.setSteeringDiagnostic(session.steeringDiagnostic);
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
    eventBus,
    render,
    update: (step) => {
      updateCount += 1;
      session.environment.update(step.stepMinutes);
      const steeringCell = session.environment.sampleAt(session.typhoon);
      session.steeringDiagnostic = session.steeringModel.step({
        cell: steeringCell,
        environment: session.environment,
        mapData,
        stepMinutes: step.stepMinutes,
        typhoon: session.typhoon
      });
      session.landDiagnostic = session.landInteractionModel.step({
        mapData,
        pathPoints: session.steeringDiagnostic.pathPoints,
        simulationMinutes: step.simulationMinutes,
        stepIndex: step.stepIndex,
        stepMinutes: step.stepMinutes,
        typhoon: session.typhoon
      });
      session.oceanDiagnostic = session.oceanCoolingModel.step({
        environment: session.environment,
        stepMinutes: step.stepMinutes,
        typhoon: session.typhoon
      });
      session.cell = createLandImpactCell(
        session.environment.sampleAt(session.typhoon),
        session.landDiagnostic
      );
      const result = session.intensityModel.step({
        cell: session.cell,
        landInteraction: session.landDiagnostic,
        simulationMinutes: step.simulationMinutes,
        stepIndex: step.stepIndex,
        stepMinutes: step.stepMinutes,
        typhoon: session.typhoon
      });
      session.factors = result.factors;
      session.targetWind = result.targetWind;
      session.observations = session.observationModel.step({
        environment: session.environment,
        mapData,
        simulationMinutes: step.simulationMinutes,
        stepMinutes: step.stepMinutes,
        typhoon: session.typhoon
      });
      session.latestSurfaceEvent =
        session.landDiagnostic.events.at(-1) ??
        session.latestSurfaceEvent;
      session.levelState.recordStep({
        landDiagnostic: session.landDiagnostic,
        observations: session.observations,
        oceanDiagnostic: session.oceanDiagnostic,
        simulationMinutes: step.simulationMinutes,
        steeringDiagnostic: session.steeringDiagnostic,
        stepIndex: step.stepIndex,
        typhoon: session.typhoon
      });
      const levelContext = Object.freeze({
        enteredRegions:
          session.levelState.statistics.enteredRegionsThisStep,
        inlandDepths: Object.freeze(
          Object.fromEntries(
            session.level.failureConditions
              .filter(
                (condition) =>
                  condition.metric === "storm.inlandDepthInRegion"
              )
              .map((condition) => [
                condition.subject,
                getRegionInlandDepthKm(
                  session.typhoon,
                  condition.subject,
                  mapData
                )
              ])
          )
        ),
        observations: session.observations,
        simulationMinutes: step.simulationMinutes,
        steeringDiagnostic: session.steeringDiagnostic,
        stepIndex: step.stepIndex,
        typhoon: session.typhoon
      });
      const objectiveResult = session.objectiveEvaluator.evaluate({
        context: levelContext,
        levelState: session.levelState
      });
      const failureResult = session.failureEvaluator.evaluate({
        context: levelContext,
        levelState: session.levelState
      });
      session.fingerprint = createFingerprint({
        intensity: result.fingerprint,
        land: session.landInteractionModel.snapshot(),
        level: session.levelState.snapshot(),
        observations: session.observationModel.snapshot(),
        ocean: session.oceanDiagnostic,
        steering: session.steeringDiagnostic.fingerprint,
        typhoonEvents: session.typhoon.eventHistory
      });

      if (failureResult.anyTriggered) {
        const failureId = failureResult.newlyTriggered[0];
        const levelResult = session.levelState.finalize({
          failureId,
          fingerprint: session.fingerprint,
          observations: session.observations,
          outcome: "failure",
          simulationMinutes: step.simulationMinutes,
          stepIndex: step.stepIndex,
          typhoon: session.typhoon
        });
        engine.failLevel({
          failureId,
          levelId: session.level.id
        });
        resultDialog?.open(levelResult, session.level);
      } else if (objectiveResult.allRequiredCompleted) {
        const levelResult = session.levelState.finalize({
          fingerprint: session.fingerprint,
          observations: session.observations,
          outcome: "victory",
          simulationMinutes: step.simulationMinutes,
          stepIndex: step.stepIndex,
          typhoon: session.typhoon
        });
        engine.completeLevel({
          levelId: session.level.id,
          score: levelResult.score.total
        });
        resultDialog?.open(levelResult, session.level);
      }
    }
  });

  const handleError = (error) => {
    const message = error instanceof Error ? error.message : String(error);
    elements.error.hidden = false;
    elements.error.textContent = `模擬器發生錯誤：${message}`;
    engine.enterError(error);
  };

  controlPanel = new ControlPanel(elements.environmentControls, {
    allowedControls: activeLevel.allowedControls,
    environment: session.environment,
    onControlChange: ({ control, value }) => {
      session.levelState.recordControlOperation({
        control,
        simulationMinutes: clock.simulationMinutes,
        stepIndex: clock.stepIndex,
        value
      });
    },
    onError: handleError
  });

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

  const applySessionToView = () => {
    controlPanel.setEnvironment(session.environment);
    controlPanel.setAllowedControls(session.level.allowedControls);
    elements.environmentGridStatus.textContent =
      `${session.environment.cells.length} cells · ` +
      `${session.environment.gridResolution}°`;
    canvasRenderer.setLevel(session.level);
    canvasRenderer.setTyphoon(session.typhoon);
    canvasRenderer.setEnvironment(session.environment);
    canvasRenderer.setObservations(session.observations);
    canvasRenderer.setSteeringDiagnostic(session.steeringDiagnostic);
    elements.startButton.textContent = `開始「${session.level.title}」`;
    elements.levelDashboard.setAttribute(
      "aria-label",
      `${session.level.title}目標`
    );
    elements.canvas.setAttribute(
      "aria-label",
      `Phase 07「${session.level.title}」關卡地圖；點選或觸控以查詢位置`
    );
  };

  const resetLevel = () => {
    elements.error.hidden = true;
    updateCount = 0;
    eventBus.reset();
    session = createLevelSession(mapData, {
      eventBus,
      level: activeLevel
    });
    resultDialog?.reset();
    tutorial.reset();
    applySessionToView();
    engine.resetSimulation({
      emitLevelRestarted: true,
      levelId: session.level.id
    });
  };

  resultDialog = new ResultDialog(elements.resultDialog, {
    onRestart: resetLevel
  });

  elements.startButton.addEventListener("click", () => {
    try {
      elements.error.hidden = true;
      updateCount = 0;
      const targetControls = { ...session.environment.targetControls };
      const pendingOperations = [...session.levelState.controlOperations];
      eventBus.reset();
      session = createLevelSession(mapData, {
        eventBus,
        level: activeLevel,
        targetControls
      });

      for (const operation of pendingOperations) {
        session.levelState.recordControlOperation({
          control: operation.control,
          simulationMinutes: 0,
          stepIndex: 0,
          value: operation.value
        });
      }

      resultDialog.reset();
      tutorial.reset();
      applySessionToView();
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

  elements.resetButton.addEventListener("click", () => {
    try {
      resetLevel();
    } catch (error) {
      handleError(error);
    }
  });

  elements.levelSelect.addEventListener("change", () => {
    try {
      const level = getLevelById(elements.levelSelect.value);

      if (!level) {
        throw new Error(`未知關卡：${elements.levelSelect.value}`);
      }

      activeLevel = level;
      eventBus.reset();
      session = createLevelSession(mapData, {
        eventBus,
        level: activeLevel
      });
      dashboard.setLevel(activeLevel);
      tutorial.setLevel(activeLevel);
      resultDialog.reset();
      updateCount = 0;
      applySessionToView();
      engine.resetSimulation({
        emitLevelRestarted: false,
        levelId: activeLevel.id
      });
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
      controlPanel.destroy();
      resultDialog?.destroy();
      engine.destroy();
    },
    { once: true }
  );

  engine.setVisibilityHidden(document.hidden);
  canvasRenderer.setTyphoon(session.typhoon);
  canvasRenderer.setLevel(session.level);
  canvasRenderer.setEnvironment(session.environment);
  canvasRenderer.setObservations(session.observations);
  canvasRenderer.setSteeringDiagnostic(session.steeringDiagnostic);
  canvasRenderer.setParticlesEnabled(elements.particlesEnabled.checked);
  engine.boot();

  try {
    mapData = await loadGeography();
    canvasRenderer.setGeography(mapData);
    session = createLevelSession(mapData, {
      eventBus,
      level: activeLevel,
      targetControls: session.level.environmentPreset
    });
    applySessionToView();
    mapReady = true;
    elements.mapDataStatus.textContent =
      `${mapData.features.length} regions · v${mapData.metadata.formatVersion}`;
    elements.environmentGridStatus.textContent =
      `${session.environment.cells.length} cells · ` +
      `${session.environment.gridResolution}°`;
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

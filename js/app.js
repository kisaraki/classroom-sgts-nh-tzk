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
import {
  DEFAULT_SANDBOX_PRESET,
  createSandboxLevel,
  validateSandboxPreset
} from "./data/sandbox.js";
import { getTerrainProfile } from "./data/terrain.js";
import {
  createPngBlob,
  createSandboxPresetExport,
  createSimulationExport,
  createSimulationSummary,
  createTrackCsv,
  downloadBlob,
  textBlob,
  validateImportPackage
} from "./io/SimulationIO.js";
import { createEnvironmentGrid } from "./model/Environment.js";
import { LevelState } from "./model/LevelState.js";
import { Typhoon } from "./model/Typhoon.js";
import {
  StorageManager,
  createDefaultStorageRecord
} from "./persistence/StorageManager.js";
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
    sandboxPreset = null,
    targetControls = level.environmentPreset
  } = {}
) => {
  const typhoon = new Typhoon({
    ...level.spawn,
    active: true,
    eventHistory: [],
    id: `${level.id}-cyclone`,
    isOverLand: false,
    name: sandboxPreset?.name ?? "KOSMOS-06",
    trackHistory: []
  });
  const randomStreams = createRandomStreams(level.seed);
  const environment = createEnvironmentGrid({
    baseOceanHeatContent:
      sandboxPreset?.oceanHeatContent ??
      PROJECT_CONFIG.environmentConfig.baseOceanHeatContent,
    baseSeaSurfaceTemperature:
      sandboxPreset?.seaSurfaceTemperature ??
      PROJECT_CONFIG.environmentConfig.baseSeaSurfaceTemperature,
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
  const landInteractionModel = new LandInteractionModel({
    eventBus,
    terrainMultiplier: sandboxPreset?.terrainMultiplier ?? 1
  });
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
    sandboxPreset,
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
    applySandboxButton: requireElement("#apply-sandbox-button"),
    canvas: requireElement("#simulation-canvas"),
    centerColdWake: requireElement("#center-cold-wake"),
    currentSpeed: requireElement("#current-speed"),
    effectiveSST: requireElement("#effective-sst"),
    engineState: requireElement("#engine-state"),
    error: requireElement("#app-error"),
    fps: requireElement("#fps-readout"),
    fpsRange: requireElement("#fps-range-readout"),
    environmentControls: requireElement("#environment-controls"),
    environmentLayer: requireElement("#environment-layer"),
    environmentGridStatus: requireElement("#environment-grid-status"),
    levelDashboard: requireElement("#level-dashboard"),
    levelSelect: requireElement("#level-select"),
    importJson: requireElement("#import-json"),
    ioStatus: requireElement("#io-status"),
    mapDataStatus: requireElement("#map-data-status"),
    longTask: requireElement("#long-task-readout"),
    pauseButton: requireElement("#pause-button"),
    particlesEnabled: requireElement("#particles-enabled"),
    particleProfile: requireElement("#particle-profile"),
    particleReadout: requireElement("#particle-readout"),
    probeCoordinate: requireElement("#probe-coordinate"),
    probeStation: requireElement("#probe-station"),
    probeSurface: requireElement("#probe-surface"),
    resetButton: requireElement("#reset-button"),
    resultDialog: requireElement("#result-dialog"),
    simulationTime: requireElement("#sim-time"),
    canvasSummary: requireElement("#canvas-summary"),
    speedButtons: [...document.querySelectorAll("[data-speed]")],
    sandboxFields: [
      ...document.querySelectorAll("[data-sandbox-field]")
    ],
    sandboxSettings: requireElement("#sandbox-settings"),
    startButton: requireElement("#start-button"),
    stepCount: requireElement("#step-count"),
    stormFingerprint: requireElement("#storm-fingerprint"),
    stormDashboardTitle: requireElement("#storm-dashboard-title"),
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
    timing: requireElement("#timing-readout"),
    tutorial: requireElement("#tutorial-panel"),
    targetsLayer: requireElement("#targets-layer"),
    targetWind: requireElement("#target-wind"),
    updateCount: requireElement("#update-count"),
    visibility: requireElement("#visibility-status"),
    trackLayer: requireElement("#track-layer"),
    exportButtons: [...document.querySelectorAll("[data-export]")]
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

  if (elements.levelSelect.options.length !== LEVELS.length + 1) {
    throw new Error("Level selector is incomplete.");
  }

  if (elements.sandboxFields.length !== 18) {
    throw new Error("Sandbox settings are incomplete.");
  }

  const storageManager = new StorageManager(window.localStorage);
  let storageRecord;

  try {
    storageRecord = storageManager.load();
  } catch {
    storageRecord = Object.freeze(createDefaultStorageRecord());
  }

  let sandboxPreset = validateSandboxPreset(
    storageRecord.lastSandboxPreset ?? DEFAULT_SANDBOX_PRESET
  );
  const canvasRenderer = new CanvasRenderer(elements.canvas);
  const reducedMotionQuery = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  );
  const eventBus = new EventBus();
  let activeLevel = NAHA_STORM_LEVEL;
  let session = createLevelSession(null, { eventBus, level: activeLevel });
  let controlPanel = null;
  let resultDialog = null;
  let mapData = null;
  let mapReady = false;
  let updateCount = 0;
  let importedReplay = null;
  const stationElements = new Map();
  const dashboard = new Dashboard(elements.levelDashboard, {
    level: activeLevel
  });
  const tutorial = new Tutorial(elements.tutorial, {
    level: activeLevel
  });

  const saveStorage = (overrides = {}) => {
    const next = { ...storageRecord, ...overrides };

    try {
      storageRecord = storageManager.save(next);
    } catch {
      storageRecord = Object.freeze(next);
    }
    return storageRecord;
  };

  const writeSandboxFields = (preset) => {
    for (const input of elements.sandboxFields) {
      input.value = String(preset[input.dataset.sandboxField]);
    }
  };

  const readSandboxFields = () =>
    validateSandboxPreset(
      Object.fromEntries(
        elements.sandboxFields.map((input) => [
          input.dataset.sandboxField,
          input.type === "number" ? input.valueAsNumber : input.value
        ])
      )
    );

  const applyStoredSettings = () => {
    const settings = storageRecord.settings;
    elements.particlesEnabled.checked = settings.particlesEnabled;
    elements.environmentLayer.checked = settings.environmentLayer;
    elements.trackLayer.checked = settings.trackLayer;
    elements.targetsLayer.checked = settings.targetsLayer;
    canvasRenderer.setParticlesEnabled(
      settings.particlesEnabled && !reducedMotionQuery.matches
    );
    canvasRenderer.setLayers({
      environment: settings.environmentLayer,
      targets: settings.targetsLayer,
      track: settings.trackLayer
    });
  };

  const applyParticlePreferences = () => {
    const profile = elements.particleProfile.value;
    const count = PROJECT_CONFIG.renderingConfig.particleProfiles[profile];

    if (!count) {
      throw new Error(`Unknown particle profile: ${profile}.`);
    }

    canvasRenderer.setParticleCount(count);
    canvasRenderer.setParticlesEnabled(
      elements.particlesEnabled.checked && !reducedMotionQuery.matches
    );
    elements.particlesEnabled.disabled = reducedMotionQuery.matches;
    elements.particleProfile.disabled = reducedMotionQuery.matches;
    elements.particleReadout.textContent = reducedMotionQuery.matches
      ? `減少動態｜停用（原 ${count}）`
      : `${profile === "low" ? "低" : profile === "high" ? "高" : "中"}｜${count}`;
  };

  writeSandboxFields(sandboxPreset);
  applyStoredSettings();
  applyParticlePreferences();

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

  const createActiveSession = ({ targetControls } = {}) =>
    createLevelSession(mapData, {
      eventBus,
      level: activeLevel,
      sandboxPreset:
        activeLevel.id === "sandbox" ? sandboxPreset : null,
      targetControls: targetControls ?? activeLevel.environmentPreset
    });

  const clock = new SimulationClock({
    maxCatchUpSteps: PROJECT_CONFIG.simulation.maxCatchUpSteps,
    maxFrameDeltaMs: PROJECT_CONFIG.simulation.maxFrameDeltaMs,
    realStepMs: PROJECT_CONFIG.simulation.realStepMs,
    stepMinutes: PROJECT_CONFIG.simulation.stepMinutes
  });

  const render = ({
    clock: clockState,
    fps,
    performance: performanceState,
    state
  }) => {
    const storm = session.typhoon;
    document.documentElement.dataset.appState = state.toLowerCase();
    elements.engineState.textContent = state;
    elements.simulationTime.textContent = formatSimulationTime(
      clockState.simulationMinutes
    );
    elements.stepCount.textContent = String(clockState.stepIndex);
    elements.currentSpeed.textContent = `${clockState.speed}×`;
    elements.fps.textContent = Number.isFinite(fps) ? fps.toFixed(0) : "0";
    elements.fpsRange.textContent =
      `${performanceState.averageFps.toFixed(0)} / ` +
      `${performanceState.minimumFps.toFixed(0)}`;
    elements.timing.textContent =
      `${performanceState.updateAverageMs.toFixed(2)} / ` +
      `${performanceState.renderAverageMs.toFixed(2)} ms`;
    elements.timing.dataset.medianFps =
      performanceState.medianFps.toFixed(2);
    elements.timing.dataset.averageFps =
      performanceState.averageFps.toFixed(2);
    elements.timing.dataset.minimumFps =
      performanceState.minimumFps.toFixed(2);
    elements.timing.dataset.onePercentLowFps =
      performanceState.onePercentLowFps.toFixed(2);
    elements.timing.dataset.renderAverageMs =
      performanceState.renderAverageMs.toFixed(3);
    elements.timing.dataset.renderMaximumMs =
      performanceState.renderMaximumMs.toFixed(3);
    elements.timing.dataset.updateAverageMs =
      performanceState.updateAverageMs.toFixed(3);
    elements.timing.dataset.updateP95Ms =
      performanceState.updateP95Ms.toFixed(3);
    elements.timing.dataset.longTaskCount =
      String(performanceState.longTaskCount);
    elements.timing.dataset.longTaskDurationMs =
      performanceState.longTaskDurationMs.toFixed(1);
    elements.longTask.textContent =
      `${performanceState.longTaskCount} · ` +
      `${performanceState.longTaskDurationMs.toFixed(0)} ms`;
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
    elements.canvasSummary.textContent =
      `引擎 ${state}，模擬時間 ${formatSimulationTime(
        clockState.simulationMinutes
      )}。風暴 ${storm.name} 位於 ${storm.lat.toFixed(2)}°N、` +
      `${storm.lon.toFixed(2)}°E，最大風速 ${storm.maxWind.toFixed(1)} m/s，` +
      `中心氣壓 ${storm.centralPressure.toFixed(0)} hPa，` +
      `${session.landDiagnostic.isOverLand ? "目前位於陸地" : "目前位於海上"}。`;

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
    elements.applySandboxButton.disabled =
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

      for (const operation of importedReplay?.operations ?? []) {
        if (operation.stepIndex === step.stepIndex) {
          session.environment.setTargetControl(
            operation.control,
            operation.value
          );
          session.levelState.recordControlOperation({
            ...operation,
            simulationMinutes: step.simulationMinutes
          });
        }
      }

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
      const isSandbox = session.level.id === "sandbox";
      const objectiveResult = isSandbox
        ? { allRequiredCompleted: false, newlyCompleted: [] }
        : session.objectiveEvaluator.evaluate({
          context: levelContext,
          levelState: session.levelState
        });
      const failureResult = isSandbox
        ? { anyTriggered: false, newlyTriggered: [] }
        : session.failureEvaluator.evaluate({
          context: levelContext,
          levelState: session.levelState
        });
      const fingerprintPayload = {
        intensity: result.fingerprint,
        land: session.landInteractionModel.snapshot(),
        level: session.levelState.snapshot(),
        observations: session.observationModel.snapshot(),
        ocean: session.oceanDiagnostic,
        steering: session.steeringDiagnostic.fingerprint,
        typhoonEvents: session.typhoon.eventHistory
      };

      if (isSandbox) {
        fingerprintPayload.sandboxPreset = session.sandboxPreset;
      }

      session.fingerprint = createFingerprint(fingerprintPayload);

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
        saveStorage({
          bestScores: {
            ...storageRecord.bestScores,
            [session.level.id]: Math.max(
              storageRecord.bestScores[session.level.id] ?? 0,
              levelResult.score.total
            )
          },
          unlockedLevels: [
            ...new Set([
              ...storageRecord.unlockedLevels,
              session.level.id
            ])
          ]
        });
        engine.completeLevel({
          levelId: session.level.id,
          score: levelResult.score.total
        });
        resultDialog?.open(levelResult, session.level);
      } else if (
        importedReplay &&
        importedReplay.targetStep === step.stepIndex
      ) {
        engine.pauseSimulation();
        const matches =
          importedReplay.expectedFingerprint === session.fingerprint;
        elements.ioStatus.textContent = matches
          ? `重播完成：fingerprint ${session.fingerprint} 一致。`
          : `重播完成，但 fingerprint 不一致：${session.fingerprint}。`;
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
    const isSandbox = session.level.id === "sandbox";
    elements.startButton.textContent = isSandbox
      ? "啟動沙盒實驗"
      : `開始「${session.level.title}」`;
    elements.stormDashboardTitle.textContent =
      `${session.typhoon.name} ${isSandbox ? "沙盒風暴" : "關卡颱風"}`;
    elements.sandboxSettings.hidden = !isSandbox;
    elements.sandboxSettings.open = isSandbox;
    elements.applySandboxButton.disabled = ![
      GameState.MENU,
      GameState.TUTORIAL
    ].includes(engine.state);
    elements.levelDashboard.setAttribute(
      "aria-label",
      isSandbox
        ? "沙盒模式，沒有勝敗目標"
        : `${session.level.title}目標`
    );
    elements.canvas.setAttribute(
      "aria-label",
      `Phase 09「${session.level.title}」地圖；點選或觸控以查詢位置`
    );
  };

  const resetLevel = () => {
    elements.error.hidden = true;
    updateCount = 0;
    eventBus.reset();
    session = createActiveSession();
    importedReplay = null;
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
      session = createActiveSession({ targetControls });

      for (const operation of pendingOperations) {
        session.levelState.recordControlOperation({
          control: operation.control,
          simulationMinutes: 0,
          stepIndex: 0,
          value: operation.value
        });
      }

      for (const operation of importedReplay?.operations ?? []) {
        if (operation.stepIndex === 0) {
          session.environment.setTargetControl(
            operation.control,
            operation.value
          );
          session.levelState.recordControlOperation({
            ...operation,
            simulationMinutes: 0
          });
        }
      }

      resultDialog.reset();
      tutorial.reset();
      saveStorage({ tutorialCompleted: true });
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
      const level = elements.levelSelect.value === "sandbox"
        ? createSandboxLevel(sandboxPreset)
        : getLevelById(elements.levelSelect.value);

      if (!level) {
        throw new Error(`未知關卡：${elements.levelSelect.value}`);
      }

      activeLevel = level;
      eventBus.reset();
      session = createActiveSession();
      importedReplay = null;
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
        const speed = Number(button.dataset.speed);
        engine.setSpeed(speed);
        saveStorage({
          settings: { ...storageRecord.settings, speed }
        });
      } catch (error) {
        handleError(error);
      }
    });
  }

  elements.particlesEnabled.addEventListener("change", () => {
    applyParticlePreferences();
    saveStorage({
      settings: {
        ...storageRecord.settings,
        particlesEnabled: elements.particlesEnabled.checked
      }
    });
  });

  elements.particleProfile.addEventListener("change", () => {
    try {
      applyParticlePreferences();
    } catch (error) {
      handleError(error);
    }
  });

  const handleReducedMotionChange = () => {
    applyParticlePreferences();
  };
  reducedMotionQuery.addEventListener("change", handleReducedMotionChange);

  const updateLayers = () => {
    const layers = {
      environment: elements.environmentLayer.checked,
      targets: elements.targetsLayer.checked,
      track: elements.trackLayer.checked
    };
    canvasRenderer.setLayers(layers);
    saveStorage({
      settings: {
        ...storageRecord.settings,
        environmentLayer: layers.environment,
        targetsLayer: layers.targets,
        trackLayer: layers.track
      }
    });
  };

  for (const input of [
    elements.environmentLayer,
    elements.targetsLayer,
    elements.trackLayer
  ]) {
    input.addEventListener("change", updateLayers);
  }

  elements.applySandboxButton.addEventListener("click", () => {
    try {
      if (
        ![GameState.MENU, GameState.TUTORIAL].includes(engine.state)
      ) {
        throw new Error("請先重啟回到選單，再套用沙盒設定。");
      }

      sandboxPreset = readSandboxFields();
      saveStorage({ lastSandboxPreset: { ...sandboxPreset } });
      activeLevel = createSandboxLevel(sandboxPreset);
      elements.levelSelect.value = "sandbox";
      eventBus.reset();
      session = createActiveSession();
      importedReplay = null;
      dashboard.setLevel(activeLevel);
      tutorial.setLevel(activeLevel);
      resultDialog.reset();
      updateCount = 0;
      applySessionToView();
      engine.resetSimulation({
        emitLevelRestarted: false,
        levelId: activeLevel.id
      });
      elements.ioStatus.textContent = "沙盒設定已驗證、儲存並套用。";
    } catch (error) {
      elements.ioStatus.textContent =
        `沙盒設定錯誤：${error instanceof Error ? error.message : error}`;
    }
  });

  const currentSimulationExport = () =>
    createSimulationExport({
      environmentTargets: session.environment.targetControls,
      fingerprint: session.fingerprint,
      levelId: session.level.id,
      mode: session.level.id === "sandbox" ? "sandbox" : "level",
      observations: session.observations,
      operations: session.levelState.controlOperations,
      sandboxPreset:
        session.level.id === "sandbox" ? sandboxPreset : null,
      seed: session.level.seed,
      simulationMinutes: clock.simulationMinutes,
      stepIndex: clock.stepIndex,
      storm: session.typhoon
    });

  const exportArtifact = async (kind) => {
    const baseName =
      `sgts-nh-${session.level.id}-step-${clock.stepIndex}`;

    if (kind === "csv") {
      downloadBlob(
        textBlob(
          createTrackCsv({
            name: session.typhoon.name,
            track: session.typhoon.trackHistory
          }),
          "text/csv"
        ),
        `${baseName}-track.csv`
      );
    } else if (kind === "simulation-json") {
      downloadBlob(
        textBlob(
          JSON.stringify(currentSimulationExport(), null, 2),
          "application/json"
        ),
        `${baseName}-simulation.json`
      );
    } else if (kind === "preset-json") {
      downloadBlob(
        textBlob(
          JSON.stringify(createSandboxPresetExport(sandboxPreset), null, 2),
          "application/json"
        ),
        "sgts-nh-sandbox-preset.json"
      );
    } else if (kind === "png") {
      downloadBlob(
        await createPngBlob(elements.canvas, {
          name: session.typhoon.name,
          simulationMinutes: clock.simulationMinutes
        }),
        `${baseName}.png`
      );
    } else if (kind === "summary") {
      downloadBlob(
        textBlob(
          createSimulationSummary({
            fingerprint: session.fingerprint,
            levelTitle: session.level.title,
            simulationMinutes: clock.simulationMinutes,
            storm: session.typhoon
          }),
          "text/plain"
        ),
        `${baseName}-summary.txt`
      );
    } else {
      throw new Error(`未知匯出格式：${kind}`);
    }

    elements.ioStatus.textContent = `已建立 ${kind} 匯出。`;
  };

  for (const button of elements.exportButtons) {
    button.addEventListener("click", () => {
      exportArtifact(button.dataset.export).catch((error) => {
        elements.ioStatus.textContent =
          `匯出失敗：${error instanceof Error ? error.message : error}`;
      });
    });
  }

  elements.importJson.addEventListener("change", async () => {
    try {
      const file = elements.importJson.files?.[0];

      if (!file) {
        return;
      }

      const imported = validateImportPackage(await file.text());

      if (imported.exportType === "sandbox-preset") {
        sandboxPreset = imported.preset;
        importedReplay = null;
      } else {
        if (imported.mode === "sandbox") {
          sandboxPreset = imported.sandboxPreset;
        }

        const importedLevel = imported.mode === "sandbox"
          ? createSandboxLevel(sandboxPreset)
          : getLevelById(imported.levelId);

        if (!importedLevel || importedLevel.seed !== imported.seed) {
          throw new Error("匯入種子或關卡與目前版本不相容。");
        }

        activeLevel = importedLevel;
        importedReplay = {
          expectedFingerprint: imported.simulation.fingerprint,
          operations: imported.operations,
          targetStep: imported.simulation.stepIndex
        };
      }

      saveStorage({ lastSandboxPreset: { ...sandboxPreset } });
      writeSandboxFields(sandboxPreset);
      activeLevel = imported.exportType === "sandbox-preset"
        ? createSandboxLevel(sandboxPreset)
        : activeLevel;
      elements.levelSelect.value = activeLevel.id;
      eventBus.reset();
      session = createActiveSession();
      dashboard.setLevel(activeLevel);
      tutorial.setLevel(activeLevel);
      resultDialog.reset();
      updateCount = 0;
      applySessionToView();
      engine.resetSimulation({
        emitLevelRestarted: false,
        levelId: activeLevel.id
      });
      elements.ioStatus.textContent = importedReplay
        ? `模擬 JSON 已驗證；開始後將重播至 step ${importedReplay.targetStep}。`
        : "沙盒設定 JSON 已驗證並載入。";
    } catch (error) {
      elements.ioStatus.textContent =
        `匯入失敗：${error instanceof Error ? error.message : error}`;
    } finally {
      elements.importJson.value = "";
    }
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
      reducedMotionQuery.removeEventListener(
        "change",
        handleReducedMotionChange
      );
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
  applyParticlePreferences();
  engine.setSpeed(storageRecord.settings.speed);
  engine.boot();

  try {
    mapData = await loadGeography();
    canvasRenderer.setGeography(mapData);
    session = createActiveSession({
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

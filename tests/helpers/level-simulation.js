import {
  EVENT_TYPES,
  EventBus
} from "../../js/core/EventBus.js";
import { FailureEvaluator } from "../../js/core/FailureEvaluator.js";
import { ObjectiveEvaluator } from "../../js/core/ObjectiveEvaluator.js";
import { getTerrainProfile } from "../../js/data/terrain.js";
import { getRegionInlandDepthKm } from "../../js/data/geography.js";
import { createEnvironmentGrid } from "../../js/model/Environment.js";
import { LevelState } from "../../js/model/LevelState.js";
import { Typhoon } from "../../js/model/Typhoon.js";
import { IntensityModel } from "../../js/simulation/IntensityModel.js";
import {
  LandInteractionModel,
  createLandImpactCell
} from "../../js/simulation/LandInteractionModel.js";
import { ObservationModel } from "../../js/simulation/ObservationModel.js";
import { OceanCoolingModel } from "../../js/simulation/OceanCoolingModel.js";
import { SteeringModel } from "../../js/simulation/SteeringModel.js";
import {
  createFingerprint,
  createRandomStreams
} from "../../js/utils/random.js";

export const createHeadlessLevelSession = (level, mapData) => {
  const eventBus = new EventBus();
  const events = [];

  for (const type of EVENT_TYPES) {
    eventBus.on(type, (event) => {
      events.push(event);
    });
  }
  const randomStreams = createRandomStreams(level.seed);
  const typhoon = new Typhoon({
    ...level.spawn,
    active: true,
    eventHistory: [],
    id: `${level.id}-cyclone`,
    isOverLand: false,
    name: "KOSMOS-06",
    trackHistory: []
  });
  const environment = createEnvironmentGrid({
    controls: level.environmentPreset,
    random: randomStreams.environment,
    targetControls: level.environmentPreset,
    terrainAt: (point) => getTerrainProfile(point, mapData)
  });
  const levelState = new LevelState(level);
  typhoon.recordTrack({ simulationMinutes: 0, stepIndex: 0 });

  return {
    environment,
    eventBus,
    events,
    failureEvaluator: new FailureEvaluator({ eventBus }),
    intensityModel: new IntensityModel({
      randomStreams,
      seed: level.seed
    }),
    landInteractionModel: new LandInteractionModel({ eventBus }),
    level,
    levelState,
    objectiveEvaluator: new ObjectiveEvaluator({ eventBus }),
    observationModel: new ObservationModel(),
    oceanCoolingModel: new OceanCoolingModel({
      coolingMultiplier: level.oceanCoolingMultiplier
    }),
    randomStreams,
    steeringModel: new SteeringModel({
      meridionalMultiplier: level.steeringMeridionalMultiplier,
      random: randomStreams.steering,
      seed: level.seed
    }),
    typhoon
  };
};

export const runLevelReplay = ({
  level,
  mapData,
  maximumSteps = level.durationHours * 6 + 1,
  onStep = null,
  operations = []
}) => {
  const session = createHeadlessLevelSession(level, mapData);
  const operationsByStep = new Map();

  for (const operation of operations) {
    const entries = operationsByStep.get(operation.stepIndex) ?? [];
    entries.push(operation);
    operationsByStep.set(operation.stepIndex, entries);
  }

  for (const operation of operationsByStep.get(0) ?? []) {
    session.environment.setTargetControl(operation.control, operation.value);
    session.levelState.recordControlOperation({
      ...operation,
      simulationMinutes: 0
    });
  }

  let latest = null;

  for (let stepIndex = 1; stepIndex <= maximumSteps; stepIndex += 1) {
    const simulationMinutes = stepIndex * 10;

    for (const operation of operationsByStep.get(stepIndex) ?? []) {
      session.environment.setTargetControl(
        operation.control,
        operation.value
      );
      session.levelState.recordControlOperation({
        ...operation,
        simulationMinutes
      });
    }

    session.environment.update(10);
    const steeringDiagnostic = session.steeringModel.step({
      cell: session.environment.sampleAt(session.typhoon),
      environment: session.environment,
      mapData,
      stepMinutes: 10,
      typhoon: session.typhoon
    });
    const landDiagnostic = session.landInteractionModel.step({
      mapData,
      pathPoints: steeringDiagnostic.pathPoints,
      simulationMinutes,
      stepIndex,
      stepMinutes: 10,
      typhoon: session.typhoon
    });
    const oceanDiagnostic = session.oceanCoolingModel.step({
      environment: session.environment,
      stepMinutes: 10,
      typhoon: session.typhoon
    });
    const cell = createLandImpactCell(
      session.environment.sampleAt(session.typhoon),
      landDiagnostic
    );
    const intensity = session.intensityModel.step({
      cell,
      landInteraction: landDiagnostic,
      simulationMinutes,
      stepIndex,
      stepMinutes: 10,
      typhoon: session.typhoon
    });
    const observations = session.observationModel.step({
      environment: session.environment,
      mapData,
      simulationMinutes,
      stepMinutes: 10,
      typhoon: session.typhoon
    });
    session.levelState.recordStep({
      landDiagnostic,
      observations,
      oceanDiagnostic,
      simulationMinutes,
      steeringDiagnostic,
      stepIndex,
      typhoon: session.typhoon
    });
    const context = Object.freeze({
      enteredRegions: session.levelState.statistics.enteredRegionsThisStep,
      inlandDepths: Object.freeze(
        Object.fromEntries(
          level.failureConditions
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
      observations,
      simulationMinutes,
      steeringDiagnostic,
      stepIndex,
      typhoon: session.typhoon
    });
    const objectives = session.objectiveEvaluator.evaluate({
      context,
      levelState: session.levelState
    });
    const failures = session.failureEvaluator.evaluate({
      context,
      levelState: session.levelState
    });
    const fingerprint = createFingerprint({
      intensity: intensity.fingerprint,
      land: session.landInteractionModel.snapshot(),
      level: session.levelState.snapshot(),
      observations: session.observationModel.snapshot(),
      ocean: oceanDiagnostic,
      steering: steeringDiagnostic.fingerprint,
      typhoonEvents: session.typhoon.eventHistory
    });
    latest = {
      cell,
      failures,
      fingerprint,
      intensity,
      landDiagnostic,
      objectives,
      observations,
      oceanDiagnostic,
      simulationMinutes,
      steeringDiagnostic,
      stepIndex
    };
    onStep?.(Object.freeze({
      latest: Object.freeze(latest),
      session
    }));

    if (failures.anyTriggered || objectives.allRequiredCompleted) {
      const outcome = failures.anyTriggered ? "failure" : "victory";
      session.levelState.finalize({
        failureId: failures.newlyTriggered[0] ?? null,
        fingerprint,
        observations,
        outcome,
        simulationMinutes,
        stepIndex,
        typhoon: session.typhoon
      });
      break;
    }
  }

  return Object.freeze({ latest: Object.freeze(latest), session });
};

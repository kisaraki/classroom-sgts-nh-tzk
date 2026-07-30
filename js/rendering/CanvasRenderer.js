import { MAP_BOUNDS } from "../data/geography.js";
import { WEATHER_STATIONS } from "../data/stations.js";
import {
  CanvasViewport,
  formatSimulationTime
} from "../ui/CanvasViewport.js";
import { clientPointToGeo } from "../utils/geo.js";
import { FieldRenderer } from "./FieldRenderer.js";
import { MapRenderer } from "./MapRenderer.js";
import { ParticleRenderer } from "./ParticleRenderer.js";
import { TrackRenderer } from "./TrackRenderer.js";
import { TyphoonRenderer } from "./TyphoonRenderer.js";

export const MAP_PADDING = Object.freeze({
  bottom: 26,
  left: 38,
  right: 12,
  top: 14
});

export class CanvasRenderer {
  #canvas;
  #fieldRenderer;
  #environment = null;
  #geography = null;
  #mapRenderer;
  #observations = [];
  #particleRenderer;
  #selection = null;
  #stations;
  #steeringDiagnostic = null;
  #trackRenderer;
  #typhoon = null;
  #typhoonRenderer;
  #viewport;

  constructor(
    canvas,
    {
      fieldRenderer = new FieldRenderer(),
      mapRenderer = new MapRenderer(),
      particleRenderer = new ParticleRenderer(),
      stations = WEATHER_STATIONS,
      trackRenderer = new TrackRenderer(),
      typhoonRenderer = new TyphoonRenderer(),
      viewportOptions
    } = {}
  ) {
    this.#canvas = canvas;
    this.#fieldRenderer = fieldRenderer;
    this.#mapRenderer = mapRenderer;
    this.#particleRenderer = particleRenderer;
    this.#stations = stations;
    this.#trackRenderer = trackRenderer;
    this.#typhoonRenderer = typhoonRenderer;
    this.#viewport = new CanvasViewport(canvas, viewportOptions);
  }

  setGeography(geography) {
    this.#geography = geography;
  }

  setEnvironment(environment) {
    this.#environment = environment;
  }

  setSelection(selection) {
    this.#selection = selection;
  }

  setParticlesEnabled(enabled) {
    this.#particleRenderer.setEnabled(enabled);
  }

  setObservations(observations) {
    this.#observations = Array.isArray(observations) ? observations : [];

    if (this.#observations.length > 0) {
      this.#stations = this.#observations.map(
        (observation) => observation.station
      );
    }
  }

  setTyphoon(typhoon) {
    this.#typhoon = typhoon;
  }

  setSteeringDiagnostic(diagnostic) {
    this.#steeringDiagnostic = diagnostic;
  }

  clientPointToGeo(event) {
    return clientPointToGeo(event, {
      bounds: MAP_BOUNDS,
      padding: MAP_PADDING,
      rect: this.#canvas.getBoundingClientRect()
    });
  }

  draw({ fps, simulationMinutes, speed, state, stepIndex }) {
    const dimensions = this.#viewport.resize();

    if (!dimensions) {
      return;
    }

    const context = this.#canvas.getContext("2d");

    if (!context) {
      throw new Error("Canvas 2D context is unavailable.");
    }

    const { cssHeight: height, cssWidth: width, scale } = dimensions;
    context.setTransform(scale, 0, 0, scale, 0, 0);
    context.clearRect(0, 0, width, height);

    this.#fieldRenderer.draw({
      bounds: MAP_BOUNDS,
      context,
      environment: this.#environment,
      height,
      padding: MAP_PADDING,
      width
    });

    if (this.#geography) {
      this.#mapRenderer.draw({
        context,
        geography: this.#geography,
        height,
        padding: MAP_PADDING,
        selection: this.#selection,
        stations: this.#stations,
        width
      });

      this.#fieldRenderer.drawOverlay({
        bounds: MAP_BOUNDS,
        context,
        environment: this.#environment,
        height,
        observations: this.#observations,
        padding: MAP_PADDING,
        steeringDiagnostic: this.#steeringDiagnostic,
        typhoon: this.#typhoon,
        width
      });

      if (this.#typhoon) {
        const shared = {
          bounds: MAP_BOUNDS,
          context,
          height,
          padding: MAP_PADDING,
          typhoon: this.#typhoon,
          width
        };
        this.#trackRenderer.draw({
          ...shared,
          trackHistory: this.#typhoon.trackHistory
        });
        this.#typhoonRenderer.draw(shared);
        this.#particleRenderer.draw({
          ...shared,
          simulationMinutes
        });
      }
    } else {
      context.fillStyle = "#d9f9ff";
      context.font = "700 16px system-ui, sans-serif";
      context.fillText("載入地理資料…", 56, 48);
    }

    this.#drawDiagnostics({
      context,
      fps,
      height,
      simulationMinutes,
      speed,
      state,
      stepIndex,
      width
    });
  }

  destroy() {
    this.#viewport.destroy();
  }

  #drawDiagnostics({
    context,
    fps,
    height,
    simulationMinutes,
    speed,
    state,
    stepIndex,
    width
  }) {
    const lines = [
      `STATE ${state}`,
      `TIME ${formatSimulationTime(simulationMinutes)} · STEP ${stepIndex}`,
      `SPEED ${speed}× · FPS ${Number.isFinite(fps) ? fps.toFixed(0) : "0"}`
    ];
    const boxWidth = Math.min(310, width - 32);
    const boxHeight = 66;
    const boxX = 16;
    const boxY = height - boxHeight - 32;

    context.fillStyle = "rgba(6, 17, 31, 0.82)";
    context.fillRect(boxX, boxY, boxWidth, boxHeight);
    context.fillStyle = "#eef7ff";
    context.font = "650 11px ui-monospace, monospace";

    lines.forEach((line, index) => {
      context.fillText(line, boxX + 10, boxY + 17 + index * 18);
    });

    context.fillStyle = "rgba(217, 249, 255, 0.72)";
    context.font = "600 11px system-ui, sans-serif";
    const hint = "點選或觸控地圖以查詢";
    const measured = context.measureText(hint);
    context.fillText(hint, width - measured.width - 18, height - 36);
  }
}

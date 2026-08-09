import { MAP_BOUNDS } from "../data/geography.js";
import { WEATHER_STATIONS } from "../data/stations.js";
import { CanvasViewport } from "../ui/CanvasViewport.js";
import {
  clientPointToGeo,
  geoToCanvas,
  isPointInBounds
} from "../utils/geo.js";
import { FieldRenderer } from "./FieldRenderer.js";
import {
  createMapCamera,
  isCanvasPointInMapViewport,
  mapCameraSnapshot,
  mapCameraViewBounds,
  panMapCameraByPixels,
  resetMapCamera,
  transformMapCameraByPinch,
  zoomMapCameraAtCanvasPoint
} from "./MapCamera.js";
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
  #camera;
  #fieldRenderer;
  #environment = null;
  #geography = null;
  #level = null;
  #layers = {
    environment: true,
    targets: true,
    track: true
  };
  #mapRenderer;
  #observations = [];
  #particleRenderer;
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
    this.#camera = createMapCamera({ worldBounds: MAP_BOUNDS });
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

  setTerrainTexture(texture) {
    this.#mapRenderer.setTerrainTexture(texture);
  }

  setEnvironment(environment) {
    this.#environment = environment;
  }

  setLevel(level) {
    this.#level = level;
  }

  setLayers(layers) {
    const next = { ...this.#layers, ...layers };

    for (const [name, enabled] of Object.entries(next)) {
      if (
        !["environment", "targets", "track"].includes(name) ||
        typeof enabled !== "boolean"
      ) {
        throw new TypeError(`Invalid Canvas layer setting: ${name}.`);
      }
    }

    this.#layers = next;
  }

  setParticlesEnabled(enabled) {
    this.#particleRenderer.setEnabled(enabled);
  }

  setParticleCount(count) {
    this.#particleRenderer.setCount(count);
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

  get mapView() {
    return mapCameraSnapshot(this.#camera);
  }

  getMapViewport() {
    const dimensions = this.#viewport.dimensions ?? this.#viewport.resize();

    if (!dimensions) {
      return null;
    }

    return Object.freeze({
      bounds: mapCameraViewBounds(this.#camera),
      cameraRevision: this.#camera.revision,
      height: dimensions.cssHeight,
      padding: MAP_PADDING,
      width: dimensions.cssWidth
    });
  }

  #clientPointToCanvasPoint({ clientX, clientY }) {
    const rect = this.#canvas.getBoundingClientRect();

    return Object.freeze({
      point: Object.freeze({
        x: clientX - rect.left,
        y: clientY - rect.top
      }),
      rect
    });
  }

  isClientPointInMap(event) {
    const { point, rect } = this.#clientPointToCanvasPoint(event);

    return isCanvasPointInMapViewport(point, {
      height: rect.height,
      padding: MAP_PADDING,
      width: rect.width
    });
  }

  clientPointToGeo(event) {
    const { point, rect } = this.#clientPointToCanvasPoint(event);
    const viewport = {
      height: rect.height,
      padding: MAP_PADDING,
      width: rect.width
    };

    if (!isCanvasPointInMapViewport(point, viewport)) {
      return null;
    }

    return clientPointToGeo(event, {
      bounds: mapCameraViewBounds(this.#camera),
      padding: MAP_PADDING,
      rect
    });
  }

  zoomMapAtClientPoint(event, factor) {
    const { point, rect } = this.#clientPointToCanvasPoint(event);
    this.#camera = zoomMapCameraAtCanvasPoint(this.#camera, {
      factor,
      point,
      viewport: {
        height: rect.height,
        padding: MAP_PADDING,
        width: rect.width
      }
    });
    return this.mapView;
  }

  zoomMapAtCenter(factor) {
    const rect = this.#canvas.getBoundingClientRect();
    this.#camera = zoomMapCameraAtCanvasPoint(this.#camera, {
      factor,
      point: {
        x:
          MAP_PADDING.left +
          (rect.width - MAP_PADDING.left - MAP_PADDING.right) / 2,
        y:
          MAP_PADDING.top +
          (rect.height - MAP_PADDING.top - MAP_PADDING.bottom) / 2
      },
      viewport: {
        height: rect.height,
        padding: MAP_PADDING,
        width: rect.width
      }
    });
    return this.mapView;
  }

  panMapByPixels({ deltaX, deltaY }) {
    const rect = this.#canvas.getBoundingClientRect();
    this.#camera = panMapCameraByPixels(this.#camera, {
      deltaX,
      deltaY,
      viewport: {
        height: rect.height,
        padding: MAP_PADDING,
        width: rect.width
      }
    });
    return this.mapView;
  }

  transformMapByPinch({ currentPoints, previousPoints }) {
    const rect = this.#canvas.getBoundingClientRect();
    const toCanvasPoint = ({ clientX, clientY }) =>
      Object.freeze({
        x: clientX - rect.left,
        y: clientY - rect.top
      });
    this.#camera = transformMapCameraByPinch(this.#camera, {
      currentPoints: currentPoints.map(toCanvasPoint),
      previousPoints: previousPoints.map(toCanvasPoint),
      viewport: {
        height: rect.height,
        padding: MAP_PADDING,
        width: rect.width
      }
    });
    return this.mapView;
  }

  resetMapView() {
    this.#camera = resetMapCamera(this.#camera);
    return this.mapView;
  }

  projectGeographicPoint(point) {
    const viewport = this.getMapViewport();

    if (!viewport) {
      return null;
    }

    const projected = geoToCanvas(point, viewport);

    return Object.freeze({
      ...projected,
      visible: isPointInBounds(point, viewport.bounds)
    });
  }

  draw({ simulationMinutes }) {
    const dimensions = this.#viewport.dimensions ?? this.#viewport.resize();

    if (!dimensions) {
      return;
    }

    const context = this.#canvas.getContext("2d");

    if (!context) {
      throw new Error("Canvas 2D context is unavailable.");
    }

    const { cssHeight: height, cssWidth: width, scale } = dimensions;
    const bounds = mapCameraViewBounds(this.#camera);
    const mapViewport = Object.freeze({
      bounds,
      cameraRevision: this.#camera.revision,
      height,
      padding: MAP_PADDING,
      width
    });
    context.setTransform(scale, 0, 0, scale, 0, 0);
    context.clearRect(0, 0, width, height);

    this.#fieldRenderer.draw({
      bounds,
      context,
      environment: this.#environment,
      height,
      padding: MAP_PADDING,
      width
    });

    if (this.#geography) {
      context.save();
      context.beginPath();
      context.rect(
        MAP_PADDING.left,
        MAP_PADDING.top,
        width - MAP_PADDING.left - MAP_PADDING.right,
        height - MAP_PADDING.top - MAP_PADDING.bottom
      );
      context.clip();
      this.#mapRenderer.draw({
        bounds,
        cameraRevision: mapViewport.cameraRevision,
        context,
        geography: this.#geography,
        height,
        padding: MAP_PADDING,
        scale,
        width
      });

      if (this.#layers.environment) {
        this.#fieldRenderer.drawOverlay({
          bounds,
          context,
          environment: this.#environment,
          height,
          observations: this.#observations,
          padding: MAP_PADDING,
          steeringDiagnostic: this.#steeringDiagnostic,
          typhoon: this.#typhoon,
          width
        });
      }

      if (this.#typhoon) {
        const shared = {
          bounds,
          context,
          height,
          padding: MAP_PADDING,
          typhoon: this.#typhoon,
          width
        };
        if (this.#layers.track) {
          this.#trackRenderer.draw({
            ...shared,
            trackHistory: this.#typhoon.trackHistory
          });
        }
        this.#typhoonRenderer.draw(shared);
        this.#particleRenderer.draw({
          ...shared,
          simulationMinutes
        });
        if (this.#layers.targets) {
          this.#mapRenderer.drawTargets({
            ...shared,
            level: this.#level,
            stations: this.#stations
          });
        }
      }
      context.restore();
    } else {
      context.fillStyle = "#d9f9ff";
      context.font = "700 16px system-ui, sans-serif";
      context.fillText("載入地理資料…", 56, 48);
    }

  }

  destroy() {
    this.#viewport.destroy();
  }

}

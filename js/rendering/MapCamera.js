import { canvasToGeo } from "../utils/geo.js";
import { clamp } from "../utils/math.js";
import {
  assertFiniteNumber,
  assertPositiveNumber
} from "../utils/validation.js";

const DEFAULT_MINIMUM_ZOOM = 1;
const DEFAULT_MAXIMUM_ZOOM = 4;

const assertBounds = (bounds, name = "bounds") => {
  if (!bounds || typeof bounds !== "object") {
    throw new TypeError(`${name} must be an object.`);
  }

  for (const field of ["minLon", "maxLon", "minLat", "maxLat"]) {
    assertFiniteNumber(bounds[field], `${name}.${field}`);
  }

  if (bounds.minLon >= bounds.maxLon || bounds.minLat >= bounds.maxLat) {
    throw new RangeError(`${name} must have positive geographic spans.`);
  }
};

const normalizedPadding = (padding = {}) =>
  Object.freeze({
    bottom: padding.bottom ?? 0,
    left: padding.left ?? 0,
    right: padding.right ?? 0,
    top: padding.top ?? 0
  });

const normalizeViewport = ({ height, padding, width }) => {
  assertPositiveNumber(width, "viewport.width");
  assertPositiveNumber(height, "viewport.height");
  const nextPadding = normalizedPadding(padding);

  for (const [side, value] of Object.entries(nextPadding)) {
    assertFiniteNumber(value, `viewport.padding.${side}`);
    if (value < 0) {
      throw new RangeError(`viewport.padding.${side} must not be negative.`);
    }
  }

  if (
    nextPadding.left + nextPadding.right >= width ||
    nextPadding.top + nextPadding.bottom >= height
  ) {
    throw new RangeError("Viewport padding leaves no drawable map area.");
  }

  return Object.freeze({ height, padding: nextPadding, width });
};

const midpoint = (first, second) =>
  Object.freeze({
    x: (first.x + second.x) / 2,
    y: (first.y + second.y) / 2
  });

const distance = (first, second) =>
  Math.hypot(second.x - first.x, second.y - first.y);

const assertCanvasPoint = (point, name = "point") => {
  assertFiniteNumber(point?.x, `${name}.x`);
  assertFiniteNumber(point?.y, `${name}.y`);
};

const mapSpans = (camera, zoom = camera.zoom) =>
  Object.freeze({
    lat: (camera.worldBounds.maxLat - camera.worldBounds.minLat) / zoom,
    lon: (camera.worldBounds.maxLon - camera.worldBounds.minLon) / zoom
  });

const nextCamera = (camera, { centerLat, centerLon, zoom }) => {
  const nextZoom = clamp(zoom, camera.minimumZoom, camera.maximumZoom);
  const spans = mapSpans(camera, nextZoom);
  const halfLat = spans.lat / 2;
  const halfLon = spans.lon / 2;
  const nextCenterLat = clamp(
    centerLat,
    camera.worldBounds.minLat + halfLat,
    camera.worldBounds.maxLat - halfLat
  );
  const nextCenterLon = clamp(
    centerLon,
    camera.worldBounds.minLon + halfLon,
    camera.worldBounds.maxLon - halfLon
  );

  if (
    Math.abs(nextCenterLat - camera.centerLat) < 1e-12 &&
    Math.abs(nextCenterLon - camera.centerLon) < 1e-12 &&
    Math.abs(nextZoom - camera.zoom) < 1e-12
  ) {
    return camera;
  }

  return Object.freeze({
    ...camera,
    centerLat: nextCenterLat,
    centerLon: nextCenterLon,
    revision: camera.revision + 1,
    zoom: nextZoom
  });
};

const cameraAtAnchor = (
  camera,
  { anchor, canvasPoint, viewport, zoom }
) => {
  const normalized = normalizeViewport(viewport);
  const drawableWidth =
    normalized.width - normalized.padding.left - normalized.padding.right;
  const drawableHeight =
    normalized.height - normalized.padding.top - normalized.padding.bottom;
  const horizontalRatio =
    (canvasPoint.x - normalized.padding.left) / drawableWidth;
  const verticalRatio =
    (canvasPoint.y - normalized.padding.top) / drawableHeight;
  const nextZoom = clamp(
    zoom,
    camera.minimumZoom,
    camera.maximumZoom
  );
  const spans = mapSpans(camera, nextZoom);

  return nextCamera(camera, {
    centerLat: anchor.lat + (verticalRatio - 0.5) * spans.lat,
    centerLon: anchor.lon + (0.5 - horizontalRatio) * spans.lon,
    zoom: nextZoom
  });
};

const clampCanvasPoint = (point, viewport) =>
  Object.freeze({
    x: clamp(
      point.x,
      viewport.padding.left,
      viewport.width - viewport.padding.right
    ),
    y: clamp(
      point.y,
      viewport.padding.top,
      viewport.height - viewport.padding.bottom
    )
  });

export const createMapCamera = ({
  maximumZoom = DEFAULT_MAXIMUM_ZOOM,
  minimumZoom = DEFAULT_MINIMUM_ZOOM,
  worldBounds
}) => {
  assertBounds(worldBounds, "worldBounds");
  assertPositiveNumber(minimumZoom, "minimumZoom");
  assertPositiveNumber(maximumZoom, "maximumZoom");

  if (minimumZoom > maximumZoom) {
    throw new RangeError("minimumZoom must not exceed maximumZoom.");
  }

  const bounds = Object.freeze({ ...worldBounds });

  return Object.freeze({
    centerLat: (bounds.minLat + bounds.maxLat) / 2,
    centerLon: (bounds.minLon + bounds.maxLon) / 2,
    maximumZoom,
    minimumZoom,
    revision: 0,
    worldBounds: bounds,
    zoom: minimumZoom
  });
};

export const mapCameraViewBounds = (camera) => {
  const spans = mapSpans(camera);

  return Object.freeze({
    maxLat: camera.centerLat + spans.lat / 2,
    maxLon: camera.centerLon + spans.lon / 2,
    minLat: camera.centerLat - spans.lat / 2,
    minLon: camera.centerLon - spans.lon / 2
  });
};

export const mapCameraSnapshot = (camera) =>
  Object.freeze({
    bounds: mapCameraViewBounds(camera),
    centerLat: camera.centerLat,
    centerLon: camera.centerLon,
    maximumZoom: camera.maximumZoom,
    minimumZoom: camera.minimumZoom,
    revision: camera.revision,
    zoom: camera.zoom
  });

export const isCanvasPointInMapViewport = (point, viewport) => {
  assertCanvasPoint(point);
  const normalized = normalizeViewport(viewport);

  return (
    point.x >= normalized.padding.left &&
    point.x <= normalized.width - normalized.padding.right &&
    point.y >= normalized.padding.top &&
    point.y <= normalized.height - normalized.padding.bottom
  );
};

export const zoomMapCameraAtCanvasPoint = (
  camera,
  { factor, point, viewport }
) => {
  assertPositiveNumber(factor, "factor");
  assertCanvasPoint(point);
  const normalized = normalizeViewport(viewport);

  if (!isCanvasPointInMapViewport(point, normalized)) {
    return camera;
  }

  const anchor = canvasToGeo(point, {
    bounds: mapCameraViewBounds(camera),
    ...normalized
  });

  return cameraAtAnchor(camera, {
    anchor,
    canvasPoint: point,
    viewport: normalized,
    zoom: camera.zoom * factor
  });
};

export const panMapCameraByPixels = (
  camera,
  { deltaX, deltaY, viewport }
) => {
  assertFiniteNumber(deltaX, "deltaX");
  assertFiniteNumber(deltaY, "deltaY");
  const normalized = normalizeViewport(viewport);
  const drawableWidth =
    normalized.width - normalized.padding.left - normalized.padding.right;
  const drawableHeight =
    normalized.height - normalized.padding.top - normalized.padding.bottom;
  const spans = mapSpans(camera);

  return nextCamera(camera, {
    centerLat: camera.centerLat + (deltaY / drawableHeight) * spans.lat,
    centerLon: camera.centerLon - (deltaX / drawableWidth) * spans.lon,
    zoom: camera.zoom
  });
};

export const transformMapCameraByPinch = (
  camera,
  { currentPoints, previousPoints, viewport }
) => {
  if (currentPoints?.length !== 2 || previousPoints?.length !== 2) {
    throw new TypeError("Pinch transformation requires two point pairs.");
  }

  currentPoints.forEach((point, index) =>
    assertCanvasPoint(point, `currentPoints[${index}]`)
  );
  previousPoints.forEach((point, index) =>
    assertCanvasPoint(point, `previousPoints[${index}]`)
  );
  const normalized = normalizeViewport(viewport);
  const previousDistance = distance(previousPoints[0], previousPoints[1]);

  if (previousDistance <= 0) {
    return camera;
  }

  const previousCenter = clampCanvasPoint(
    midpoint(previousPoints[0], previousPoints[1]),
    normalized
  );
  const currentCenter = clampCanvasPoint(
    midpoint(currentPoints[0], currentPoints[1]),
    normalized
  );
  const anchor = canvasToGeo(previousCenter, {
    bounds: mapCameraViewBounds(camera),
    ...normalized
  });
  const zoom =
    camera.zoom *
    (distance(currentPoints[0], currentPoints[1]) / previousDistance);

  return cameraAtAnchor(camera, {
    anchor,
    canvasPoint: currentCenter,
    viewport: normalized,
    zoom
  });
};

export const resetMapCamera = (camera) =>
  nextCamera(camera, {
    centerLat:
      (camera.worldBounds.minLat + camera.worldBounds.maxLat) / 2,
    centerLon:
      (camera.worldBounds.minLon + camera.worldBounds.maxLon) / 2,
    zoom: camera.minimumZoom
  });

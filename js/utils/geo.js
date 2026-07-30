import { clamp } from "./math.js";
import {
  assertFiniteNumber,
  assertNonNegativeNumber,
  assertPositiveNumber
} from "./validation.js";

export const EARTH_RADIUS_KM = 6371.0088;
export const GEO_EPSILON = 1e-9;

const toRadians = (degrees) => (degrees * Math.PI) / 180;
const toDegrees = (radians) => (radians * 180) / Math.PI;

const assertCoordinate = ({ lat, lon }, name = "coordinate") => {
  assertFiniteNumber(lat, `${name}.lat`);
  assertFiniteNumber(lon, `${name}.lon`);
};

const assertBounds = (bounds) => {
  assertFiniteNumber(bounds.minLon, "bounds.minLon");
  assertFiniteNumber(bounds.maxLon, "bounds.maxLon");
  assertFiniteNumber(bounds.minLat, "bounds.minLat");
  assertFiniteNumber(bounds.maxLat, "bounds.maxLat");

  if (
    bounds.minLon >= bounds.maxLon ||
    bounds.minLat >= bounds.maxLat
  ) {
    throw new RangeError("Geographic bounds must have positive ranges.");
  }
};

const normalizePadding = (padding = {}) => ({
  bottom: padding.bottom ?? 0,
  left: padding.left ?? 0,
  right: padding.right ?? 0,
  top: padding.top ?? 0
});

const assertViewport = ({ height, padding, width }) => {
  assertPositiveNumber(width, "viewport.width");
  assertPositiveNumber(height, "viewport.height");

  for (const [side, value] of Object.entries(padding)) {
    assertNonNegativeNumber(value, `viewport.padding.${side}`);
  }

  if (
    padding.left + padding.right >= width ||
    padding.top + padding.bottom >= height
  ) {
    throw new RangeError("Viewport padding leaves no drawable map area.");
  }
};

export const isPointInBounds = (point, bounds) => {
  assertCoordinate(point);
  assertBounds(bounds);

  return (
    point.lon >= bounds.minLon - GEO_EPSILON &&
    point.lon <= bounds.maxLon + GEO_EPSILON &&
    point.lat >= bounds.minLat - GEO_EPSILON &&
    point.lat <= bounds.maxLat + GEO_EPSILON
  );
};

export const geoToCanvas = (
  point,
  { bounds, height, padding: rawPadding, width }
) => {
  assertCoordinate(point);
  assertBounds(bounds);
  const padding = normalizePadding(rawPadding);
  assertViewport({ height, padding, width });

  const drawableWidth = width - padding.left - padding.right;
  const drawableHeight = height - padding.top - padding.bottom;
  const lonRatio = (point.lon - bounds.minLon) / (bounds.maxLon - bounds.minLon);
  const latRatio = (bounds.maxLat - point.lat) / (bounds.maxLat - bounds.minLat);

  return Object.freeze({
    x: padding.left + lonRatio * drawableWidth,
    y: padding.top + latRatio * drawableHeight
  });
};

export const canvasToGeo = (
  point,
  { bounds, height, padding: rawPadding, width }
) => {
  assertFiniteNumber(point.x, "point.x");
  assertFiniteNumber(point.y, "point.y");
  assertBounds(bounds);
  const padding = normalizePadding(rawPadding);
  assertViewport({ height, padding, width });

  const drawableWidth = width - padding.left - padding.right;
  const drawableHeight = height - padding.top - padding.bottom;
  const lonRatio = (point.x - padding.left) / drawableWidth;
  const latRatio = (point.y - padding.top) / drawableHeight;

  return Object.freeze({
    lat: bounds.maxLat - latRatio * (bounds.maxLat - bounds.minLat),
    lon: bounds.minLon + lonRatio * (bounds.maxLon - bounds.minLon)
  });
};

export const clientPointToGeo = (
  { clientX, clientY },
  { bounds, padding, rect }
) => {
  assertFiniteNumber(clientX, "clientX");
  assertFiniteNumber(clientY, "clientY");
  const normalizedPadding = normalizePadding(padding);

  return canvasToGeo(
    {
      x: clamp(
        clientX - rect.left,
        normalizedPadding.left,
        rect.width - normalizedPadding.right
      ),
      y: clamp(
        clientY - rect.top,
        normalizedPadding.top,
        rect.height - normalizedPadding.bottom
      )
    },
    {
      bounds,
      height: rect.height,
      padding: normalizedPadding,
      width: rect.width
    }
  );
};

export const haversineDistanceKm = (start, end) => {
  assertCoordinate(start, "start");
  assertCoordinate(end, "end");

  const startLat = toRadians(start.lat);
  const endLat = toRadians(end.lat);
  const deltaLat = endLat - startLat;
  const deltaLon = toRadians(end.lon - start.lon);
  const haversine =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(startLat) *
      Math.cos(endLat) *
      Math.sin(deltaLon / 2) ** 2;
  const centralAngle =
    2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));

  return EARTH_RADIUS_KM * centralAngle;
};

export const initialBearingDegrees = (start, end) => {
  assertCoordinate(start, "start");
  assertCoordinate(end, "end");

  const startLat = toRadians(start.lat);
  const endLat = toRadians(end.lat);
  const deltaLon = toRadians(end.lon - start.lon);
  const y = Math.sin(deltaLon) * Math.cos(endLat);
  const x =
    Math.cos(startLat) * Math.sin(endLat) -
    Math.sin(startLat) * Math.cos(endLat) * Math.cos(deltaLon);

  return (toDegrees(Math.atan2(y, x)) + 360) % 360;
};

export const destinationPoint = (start, distanceKm, bearingDegrees) => {
  assertCoordinate(start, "start");
  assertNonNegativeNumber(distanceKm, "distanceKm");
  assertFiniteNumber(bearingDegrees, "bearingDegrees");

  const angularDistance = distanceKm / EARTH_RADIUS_KM;
  const bearing = toRadians(bearingDegrees);
  const startLat = toRadians(start.lat);
  const startLon = toRadians(start.lon);
  const destinationLat = Math.asin(
    Math.sin(startLat) * Math.cos(angularDistance) +
      Math.cos(startLat) *
        Math.sin(angularDistance) *
        Math.cos(bearing)
  );
  const destinationLon =
    startLon +
    Math.atan2(
      Math.sin(bearing) *
        Math.sin(angularDistance) *
        Math.cos(startLat),
      Math.cos(angularDistance) -
        Math.sin(startLat) * Math.sin(destinationLat)
    );

  return Object.freeze({
    lat: toDegrees(destinationLat),
    lon: ((toDegrees(destinationLon) + 540) % 360) - 180
  });
};

const asPoint = ([lon, lat]) => ({ lat, lon });

const pointOnSegment = (point, start, end) => {
  const cross =
    (point.lat - start.lat) * (end.lon - start.lon) -
    (point.lon - start.lon) * (end.lat - start.lat);
  const scale = Math.max(
    1,
    Math.abs(end.lon - start.lon),
    Math.abs(end.lat - start.lat)
  );

  if (Math.abs(cross) > GEO_EPSILON * scale) {
    return false;
  }

  return (
    point.lon >= Math.min(start.lon, end.lon) - GEO_EPSILON &&
    point.lon <= Math.max(start.lon, end.lon) + GEO_EPSILON &&
    point.lat >= Math.min(start.lat, end.lat) - GEO_EPSILON &&
    point.lat <= Math.max(start.lat, end.lat) + GEO_EPSILON
  );
};

export const pointInPolygon = (point, ring) => {
  assertCoordinate(point);

  if (!Array.isArray(ring) || ring.length < 4) {
    throw new TypeError("Polygon ring must contain at least four coordinates.");
  }

  let inside = false;

  for (let index = 0, previous = ring.length - 1; index < ring.length; previous = index, index += 1) {
    const currentPoint = asPoint(ring[index]);
    const previousPoint = asPoint(ring[previous]);

    if (pointOnSegment(point, previousPoint, currentPoint)) {
      return true;
    }

    const crossesLatitude =
      currentPoint.lat > point.lat !== previousPoint.lat > point.lat;

    if (crossesLatitude) {
      const crossingLon =
        ((previousPoint.lon - currentPoint.lon) *
          (point.lat - currentPoint.lat)) /
          (previousPoint.lat - currentPoint.lat) +
        currentPoint.lon;

      if (point.lon < crossingLon) {
        inside = !inside;
      }
    }
  }

  return inside;
};

export const distanceToPolygonBoundaryKm = (point, ring) => {
  assertCoordinate(point);

  if (!Array.isArray(ring) || ring.length < 4) {
    throw new TypeError("Polygon ring must contain at least four coordinates.");
  }

  const latitudeScale = (Math.PI * EARTH_RADIUS_KM) / 180;
  const longitudeScale =
    latitudeScale * Math.cos(toRadians(point.lat));
  let minimumDistance = Number.POSITIVE_INFINITY;

  for (let index = 1; index < ring.length; index += 1) {
    const [startLon, startLat] = ring[index - 1];
    const [endLon, endLat] = ring[index];
    const startX = (startLon - point.lon) * longitudeScale;
    const startY = (startLat - point.lat) * latitudeScale;
    const endX = (endLon - point.lon) * longitudeScale;
    const endY = (endLat - point.lat) * latitudeScale;
    const deltaX = endX - startX;
    const deltaY = endY - startY;
    const lengthSquared = deltaX ** 2 + deltaY ** 2;
    const fraction =
      lengthSquared === 0
        ? 0
        : clamp(
            -(startX * deltaX + startY * deltaY) / lengthSquared,
            0,
            1
          );
    const closestX = startX + fraction * deltaX;
    const closestY = startY + fraction * deltaY;
    minimumDistance = Math.min(
      minimumDistance,
      Math.hypot(closestX, closestY)
    );
  }

  return minimumDistance;
};

const orientation = (first, second, third) => {
  const value =
    (second.lat - first.lat) * (third.lon - second.lon) -
    (second.lon - first.lon) * (third.lat - second.lat);

  if (Math.abs(value) <= GEO_EPSILON) {
    return 0;
  }

  return value > 0 ? 1 : 2;
};

export const segmentsIntersect = (firstStart, firstEnd, secondStart, secondEnd) => {
  for (const [point, name] of [
    [firstStart, "firstStart"],
    [firstEnd, "firstEnd"],
    [secondStart, "secondStart"],
    [secondEnd, "secondEnd"]
  ]) {
    assertCoordinate(point, name);
  }

  const orientation1 = orientation(firstStart, firstEnd, secondStart);
  const orientation2 = orientation(firstStart, firstEnd, secondEnd);
  const orientation3 = orientation(secondStart, secondEnd, firstStart);
  const orientation4 = orientation(secondStart, secondEnd, firstEnd);

  if (orientation1 !== orientation2 && orientation3 !== orientation4) {
    return true;
  }

  return (
    (orientation1 === 0 && pointOnSegment(secondStart, firstStart, firstEnd)) ||
    (orientation2 === 0 && pointOnSegment(secondEnd, firstStart, firstEnd)) ||
    (orientation3 === 0 && pointOnSegment(firstStart, secondStart, secondEnd)) ||
    (orientation4 === 0 && pointOnSegment(firstEnd, secondStart, secondEnd))
  );
};

export const segmentIntersectsPolygon = (start, end, ring) => {
  assertCoordinate(start, "start");
  assertCoordinate(end, "end");

  if (pointInPolygon(start, ring) || pointInPolygon(end, ring)) {
    return true;
  }

  for (let index = 1; index < ring.length; index += 1) {
    if (
      segmentsIntersect(start, end, asPoint(ring[index - 1]), asPoint(ring[index]))
    ) {
      return true;
    }
  }

  return false;
};

export const findNearestStation = (point, stations) => {
  assertCoordinate(point);

  if (!Array.isArray(stations) || stations.length === 0) {
    throw new TypeError("stations must be a non-empty array.");
  }

  let nearest = null;

  for (const station of stations) {
    const distanceKm = haversineDistanceKm(point, station);

    if (!nearest || distanceKm < nearest.distanceKm) {
      nearest = { distanceKm, station };
    }
  }

  return Object.freeze(nearest);
};

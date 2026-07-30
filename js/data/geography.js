import { PROJECT_CONFIG } from "../config.js";
import {
  distanceToPolygonBoundaryKm,
  findNearestStation,
  isPointInBounds,
  pointInPolygon
} from "../utils/geo.js";
import { WEATHER_STATIONS } from "./stations.js";

export const MAP_BOUNDS = PROJECT_CONFIG.geography.bounds;

export const MAP_DATA_URL = new URL(
  "../../assets/maps/northwest-pacific.json",
  import.meta.url
);

const REQUIRED_METADATA_FIELDS = Object.freeze([
  "formatVersion",
  "generatedAt",
  "license",
  "simplification",
  "source"
]);
const geographyCache = new Map();

const assertOnlyKeys = (value, allowedKeys, name) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError(`${name} must be an object.`);
  }

  const unknownKeys = Object.keys(value).filter(
    (key) => !allowedKeys.includes(key)
  );

  if (unknownKeys.length > 0) {
    throw new TypeError(`${name} contains unknown fields: ${unknownKeys.join(", ")}.`);
  }
};

const assertClosedRing = (ring, regionId) => {
  if (!Array.isArray(ring) || ring.length < 4) {
    throw new TypeError(`${regionId} polygon ring is incomplete.`);
  }

  const [firstLon, firstLat] = ring[0];
  const [lastLon, lastLat] = ring.at(-1);

  if (firstLon !== lastLon || firstLat !== lastLat) {
    throw new TypeError(`${regionId} polygon ring must be closed.`);
  }

  for (const coordinate of ring) {
    if (
      !Array.isArray(coordinate) ||
      coordinate.length !== 2 ||
      !Number.isFinite(coordinate[0]) ||
      !Number.isFinite(coordinate[1])
    ) {
      throw new TypeError(`${regionId} contains an invalid [lon, lat] pair.`);
    }

    const [lon, lat] = coordinate;

    if (
      lon < MAP_BOUNDS.minLon ||
      lon > MAP_BOUNDS.maxLon ||
      lat < MAP_BOUNDS.minLat ||
      lat > MAP_BOUNDS.maxLat
    ) {
      throw new RangeError(`${regionId} contains an out-of-bounds coordinate.`);
    }
  }

  let signedArea = 0;

  for (let index = 1; index < ring.length; index += 1) {
    signedArea +=
      ring[index - 1][0] * ring[index][1] -
      ring[index][0] * ring[index - 1][1];
  }

  if (signedArea >= 0) {
    throw new TypeError(`${regionId} exterior ring must be clockwise.`);
  }
};

export const validateMapData = (mapData) => {
  if (!mapData || mapData.type !== "FeatureCollection") {
    throw new TypeError("Map data must be a GeoJSON FeatureCollection.");
  }

  if (!Number.isInteger(mapData.schemaVersion)) {
    throw new TypeError("Map data schemaVersion must be an integer.");
  }

  if (mapData.schemaVersion !== 1) {
    throw new TypeError("Map data schemaVersion is unsupported.");
  }

  assertOnlyKeys(
    mapData,
    ["bounds", "features", "metadata", "schemaVersion", "type"],
    "map data"
  );
  assertOnlyKeys(
    mapData.bounds,
    ["maxLat", "maxLon", "minLat", "minLon"],
    "map bounds"
  );
  assertOnlyKeys(
    mapData.metadata,
    [
      "boundaryRule",
      "coordinateOrder",
      "formatVersion",
      "generatedAt",
      "license",
      "ringOrientation",
      "simplification",
      "source"
    ],
    "map metadata"
  );

  for (const field of REQUIRED_METADATA_FIELDS) {
    if (!mapData.metadata?.[field]) {
      throw new TypeError(`Map metadata is missing ${field}.`);
    }
  }

  assertOnlyKeys(
    mapData.metadata.source,
    ["name", "publisher", "url"],
    "map source"
  );
  assertOnlyKeys(mapData.metadata.license, ["name", "url"], "map license");

  for (const [name, value] of [
    ["source.name", mapData.metadata.source.name],
    ["source.publisher", mapData.metadata.source.publisher],
    ["source.url", mapData.metadata.source.url],
    ["license.name", mapData.metadata.license.name],
    ["license.url", mapData.metadata.license.url]
  ]) {
    if (typeof value !== "string" || value.length === 0) {
      throw new TypeError(`Map metadata ${name} must be a non-empty string.`);
    }
  }

  if (
    !mapData.metadata.source.url.startsWith("https://") ||
    !mapData.metadata.license.url.startsWith("https://")
  ) {
    throw new TypeError("Map source and license URLs must use HTTPS.");
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(mapData.metadata.generatedAt)) {
    throw new TypeError("Map generatedAt must use YYYY-MM-DD.");
  }

  if (
    mapData.bounds?.minLon !== MAP_BOUNDS.minLon ||
    mapData.bounds?.maxLon !== MAP_BOUNDS.maxLon ||
    mapData.bounds?.minLat !== MAP_BOUNDS.minLat ||
    mapData.bounds?.maxLat !== MAP_BOUNDS.maxLat
  ) {
    throw new RangeError("Map bounds do not match the Phase 2 contract.");
  }

  if (!Array.isArray(mapData.features) || mapData.features.length === 0) {
    throw new TypeError("Map data must contain land features.");
  }

  const regionIds = new Set();

  for (const feature of mapData.features) {
    assertOnlyKeys(feature, ["geometry", "properties", "type"], "map feature");
    assertOnlyKeys(
      feature.properties,
      ["coastSegments", "name", "regionId"],
      "feature properties"
    );
    assertOnlyKeys(feature.geometry, ["coordinates", "type"], "feature geometry");
    const regionId = feature.properties?.regionId;

    if (feature.type !== "Feature") {
      throw new TypeError(`${regionId ?? "Map entry"} must be a Feature.`);
    }

    if (!regionId || regionIds.has(regionId)) {
      throw new TypeError("Every land feature needs a unique regionId.");
    }

    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(regionId)) {
      throw new TypeError(`${regionId} is not a stable regionId.`);
    }

    regionIds.add(regionId);

    if (
      typeof feature.properties.name !== "string" ||
      feature.properties.name.length === 0
    ) {
      throw new TypeError(`${regionId} needs a display name.`);
    }

    if (feature.geometry?.type !== "Polygon") {
      throw new TypeError(`${regionId} must use Polygon geometry.`);
    }

    if (!Array.isArray(feature.geometry.coordinates)) {
      throw new TypeError(`${regionId} coordinates must be an array.`);
    }

    for (const ring of feature.geometry.coordinates) {
      assertClosedRing(ring, regionId);
    }
  }

  const taiwan = mapData.features.find(
    (feature) => feature.properties.regionId === "taiwan-main"
  );
  const sides = new Set(
    taiwan?.properties.coastSegments?.map((segment) => segment.coastSide)
  );

  if (taiwan?.properties.coastSegments?.length !== 4 || sides.size !== 4) {
    throw new TypeError("Taiwan coastline must contain four unique sides.");
  }

  for (const side of ["east", "west", "north", "south"]) {
    if (!sides.has(side)) {
      throw new TypeError(`Taiwan coastline is missing ${side}.`);
    }
  }

  for (const segment of taiwan.properties.coastSegments) {
    assertOnlyKeys(segment, ["coastSide", "coordinates"], "coast segment");

    if (!Array.isArray(segment.coordinates) || segment.coordinates.length < 2) {
      throw new TypeError(`Taiwan ${segment.coastSide} coast is incomplete.`);
    }

    for (const [lon, lat] of segment.coordinates) {
      if (!Number.isFinite(lon) || !Number.isFinite(lat)) {
        throw new TypeError(`Taiwan ${segment.coastSide} coast is invalid.`);
      }

      if (
        lon < MAP_BOUNDS.minLon ||
        lon > MAP_BOUNDS.maxLon ||
        lat < MAP_BOUNDS.minLat ||
        lat > MAP_BOUNDS.maxLat
      ) {
        throw new RangeError(
          `Taiwan ${segment.coastSide} coast is out of bounds.`
        );
      }
    }
  }

  return mapData;
};

export const loadGeography = async ({
  cache = true,
  fetchImpl = globalThis.fetch,
  url = MAP_DATA_URL
} = {}) => {
  if (typeof fetchImpl !== "function") {
    throw new TypeError("A fetch implementation is required.");
  }

  const cacheKey = String(url);

  if (cache && geographyCache.has(cacheKey)) {
    return geographyCache.get(cacheKey);
  }

  const request = (async () => {
    const response = await fetchImpl(url);

    if (!response.ok) {
      throw new Error(`Map data request failed with HTTP ${response.status}.`);
    }

    return validateMapData(await response.json());
  })();

  if (cache) {
    geographyCache.set(cacheKey, request);
  }

  try {
    return await request;
  } catch (error) {
    geographyCache.delete(cacheKey);
    throw error;
  }
};

export const clearGeographyCache = () => {
  geographyCache.clear();
};

export const findLandRegion = (point, mapData) => {
  if (!isPointInBounds(point, MAP_BOUNDS)) {
    return null;
  }

  for (const feature of mapData.features) {
    const [outerRing, ...holes] = feature.geometry.coordinates;

    if (
      pointInPolygon(point, outerRing) &&
      !holes.some((hole) => pointInPolygon(point, hole))
    ) {
      return feature;
    }
  }

  return null;
};

export const getRegionInlandDepthKm = (point, regionId, mapData) => {
  const region = mapData.features.find(
    (feature) => feature.properties.regionId === regionId
  );

  if (!region) {
    throw new TypeError(`Unknown map region: ${regionId}.`);
  }

  const [outerRing, ...holes] = region.geometry.coordinates;

  if (
    !pointInPolygon(point, outerRing) ||
    holes.some((hole) => pointInPolygon(point, hole))
  ) {
    return 0;
  }

  return Math.min(
    distanceToPolygonBoundaryKm(point, outerRing),
    ...holes.map((hole) => distanceToPolygonBoundaryKm(point, hole))
  );
};

export const describeGeographicPoint = (
  point,
  mapData,
  stations = WEATHER_STATIONS
) => {
  const landRegion = findLandRegion(point, mapData);
  const nearest = findNearestStation(point, stations);

  return Object.freeze({
    isLand: Boolean(landRegion),
    landRegion,
    nearestStation: nearest.station,
    nearestStationDistanceKm: nearest.distanceKm,
    point: Object.freeze({ ...point })
  });
};

import { PROJECT_CONFIG } from "../config.js";
import { findLandRegion } from "./geography.js";

export const TerrainZone = Object.freeze({
  CENTRAL_MOUNTAINS: "central-mountains",
  COAST_RANGE: "coast-range",
  EAST_RIFT_VALLEY: "east-rift-valley",
  GENERIC_LAND: "generic-land",
  OCEAN: "ocean",
  WEST_PLAIN: "west-plain"
});

const profile = ({
  elevation,
  isLand,
  regionId = null,
  roughness,
  slopeAspect = "flat",
  zone
}) =>
  Object.freeze({
    elevation,
    isLand,
    regionId,
    roughness,
    slopeAspect,
    zone
  });

export const taiwanRidgeLongitude = (lat) =>
  120.98 + (lat - 23.5) * 0.08;

export const getTerrainProfile = (point, mapData) => {
  const config = PROJECT_CONFIG.landInteractionConfig;
  const region = mapData ? findLandRegion(point, mapData) : null;

  if (!region) {
    return profile({
      elevation: 0,
      isLand: false,
      roughness: PROJECT_CONFIG.environmentConfig.roughnessOcean,
      zone: TerrainZone.OCEAN
    });
  }

  const regionId = region.properties.regionId;

  if (regionId !== "taiwan-main") {
    return profile({
      elevation: config.genericLandHeight,
      isLand: true,
      regionId,
      roughness: config.roughness.genericLand,
      zone: TerrainZone.GENERIC_LAND
    });
  }

  const offsetFromRidge = point.lon - taiwanRidgeLongitude(point.lat);

  if (offsetFromRidge < -0.22) {
    return profile({
      elevation: config.westPlainHeight,
      isLand: true,
      regionId,
      roughness: config.roughness.westPlain,
      slopeAspect: "west",
      zone: TerrainZone.WEST_PLAIN
    });
  }

  if (offsetFromRidge <= 0.16) {
    return profile({
      elevation: config.centralMountainHeight,
      isLand: true,
      regionId,
      roughness: config.roughness.centralMountains,
      slopeAspect: offsetFromRidge <= 0 ? "west" : "east",
      zone: TerrainZone.CENTRAL_MOUNTAINS
    });
  }

  if (offsetFromRidge <= 0.38) {
    return profile({
      elevation: config.eastRiftValleyHeight,
      isLand: true,
      regionId,
      roughness: config.roughness.eastRiftValley,
      slopeAspect: "valley",
      zone: TerrainZone.EAST_RIFT_VALLEY
    });
  }

  return profile({
    elevation: config.coastRangeHeight,
    isLand: true,
    regionId,
    roughness: config.roughness.coastRange,
    slopeAspect: "east",
    zone: TerrainZone.COAST_RANGE
  });
};

export const TAIWAN_TERRAIN_LABELS = Object.freeze([
  Object.freeze({
    lat: 23.7,
    lon: 120.45,
    name: "西部平原",
    zone: TerrainZone.WEST_PLAIN
  }),
  Object.freeze({
    lat: 23.72,
    lon: taiwanRidgeLongitude(23.72),
    name: "中央山脈",
    zone: TerrainZone.CENTRAL_MOUNTAINS
  }),
  Object.freeze({
    lat: 23.45,
    lon: taiwanRidgeLongitude(23.45) + 0.27,
    name: "東部縱谷",
    zone: TerrainZone.EAST_RIFT_VALLEY
  }),
  Object.freeze({
    lat: 23.35,
    lon: taiwanRidgeLongitude(23.35) + 0.48,
    name: "海岸山脈",
    zone: TerrainZone.COAST_RANGE
  })
]);

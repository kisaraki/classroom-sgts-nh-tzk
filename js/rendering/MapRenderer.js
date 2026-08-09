import {
  TAIWAN_TERRAIN_LABELS,
  TerrainZone,
  taiwanRidgeLongitude
} from "../data/terrain.js";
import { PROJECT_CONFIG } from "../config.js";
import { destinationPoint, geoToCanvas } from "../utils/geo.js";

const traceRing = (context, ring, viewport) => {
  ring.forEach(([lon, lat], index) => {
    const point = geoToCanvas({ lat, lon }, viewport);

    if (index === 0) {
      context.moveTo(point.x, point.y);
    } else {
      context.lineTo(point.x, point.y);
    }
  });
  context.closePath();
};

const traceLine = (context, coordinates, viewport) => {
  coordinates.forEach(([lon, lat], index) => {
    const point = geoToCanvas({ lat, lon }, viewport);

    if (index === 0) {
      context.moveTo(point.x, point.y);
    } else {
      context.lineTo(point.x, point.y);
    }
  });
};

export class MapRenderer {
  #canvasFactory;
  #staticLayer = null;
  #terrainTexture = null;

  constructor({
    canvasFactory = () => globalThis.document.createElement("canvas")
  } = {}) {
    this.#canvasFactory = canvasFactory;
  }

  setTerrainTexture(texture) {
    if (texture !== null && !texture?.image) {
      throw new TypeError("Terrain texture must contain a decoded image.");
    }

    if (this.#terrainTexture !== texture) {
      this.#terrainTexture = texture;
    }
  }

  draw({
    bounds,
    cameraRevision = 0,
    context,
    geography,
    height,
    padding,
    scale = 1,
    width
  }) {
    const viewport = {
      bounds,
      height,
      padding,
      width
    };

    const staticLayer = this.#getStaticLayer({
      bounds,
      cameraRevision,
      geography,
      height,
      padding,
      scale,
      width
    });

    context.save();
    if (staticLayer) {
      context.drawImage(staticLayer, 0, 0, width, height);
    } else {
      this.#drawStaticMap(context, geography, viewport, width);
    }

    context.restore();
  }

  #getStaticLayer({
    bounds,
    cameraRevision,
    geography,
    height,
    padding,
    scale,
    width
  }) {
    const boundsKey = [
      bounds.minLon,
      bounds.maxLon,
      bounds.minLat,
      bounds.maxLat
    ].join(":");
    if (
      this.#staticLayer?.geography === geography &&
      this.#staticLayer.boundsKey === boundsKey &&
      this.#staticLayer.cameraRevision === cameraRevision &&
      this.#staticLayer.height === height &&
      this.#staticLayer.scale === scale &&
      this.#staticLayer.terrainTexture === this.#terrainTexture &&
      this.#staticLayer.width === width
    ) {
      return this.#staticLayer.canvas;
    }

    let canvas = this.#staticLayer?.canvas;
    let context = this.#staticLayer?.context;

    if (!canvas || !context) {
      try {
        canvas = this.#canvasFactory();
      } catch {
        return null;
      }

      context = canvas?.getContext?.("2d");

      if (!context) {
        return null;
      }
    }

    const pixelWidth = Math.ceil(width * scale);
    const pixelHeight = Math.ceil(height * scale);
    if (canvas.width !== pixelWidth) {
      canvas.width = pixelWidth;
    }
    if (canvas.height !== pixelHeight) {
      canvas.height = pixelHeight;
    }
    context.setTransform?.(scale, 0, 0, scale, 0, 0);
    context.clearRect?.(0, 0, width, height);
    this.#drawStaticMap(
      context,
      geography,
      {
        bounds,
        height,
        padding,
        width
      },
      width
    );
    this.#staticLayer = {
      boundsKey,
      canvas,
      cameraRevision,
      context,
      geography,
      height,
      scale,
      terrainTexture: this.#terrainTexture,
      width
    };
    return canvas;
  }

  #drawStaticMap(context, geography, viewport, width) {
    context.save();
    context.beginPath();
    context.rect(
      viewport.padding.left,
      viewport.padding.top,
      viewport.width - viewport.padding.left - viewport.padding.right,
      viewport.height - viewport.padding.top - viewport.padding.bottom
    );
    context.clip();
    const hasTerrainTexture = this.#drawTerrainTexture(context, viewport);
    const land = context.createLinearGradient(
      viewport.padding.left,
      viewport.padding.top,
      width - viewport.padding.right,
      viewport.height - viewport.padding.bottom
    );
    land.addColorStop(0, "#53644a");
    land.addColorStop(0.38, "#3e5b43");
    land.addColorStop(0.68, "#314d3d");
    land.addColorStop(1, "#243d35");
    context.lineJoin = "round";

    for (const feature of geography.features) {
      context.beginPath();

      for (const ring of feature.geometry.coordinates) {
        traceRing(context, ring, viewport);
      }

      if (!hasTerrainTexture) {
        context.save();
        context.shadowBlur = 12;
        context.shadowColor = "rgba(1, 7, 13, 0.72)";
        context.shadowOffsetX = 3;
        context.shadowOffsetY = 5;
        context.fillStyle = land;
        context.fill("evenodd");
        context.restore();
      }

      context.strokeStyle = hasTerrainTexture
        ? "rgba(2, 12, 18, 0.66)"
        : "rgba(2, 12, 18, 0.86)";
      context.lineWidth = hasTerrainTexture ? 1.35 : 3.4;
      context.stroke();
      context.strokeStyle = hasTerrainTexture
        ? "rgba(235, 244, 222, 0.42)"
        : "rgba(220, 239, 218, 0.76)";
      context.lineWidth = hasTerrainTexture ? 0.45 : 0.85;
      context.stroke();
    }

    if (!hasTerrainTexture) {
      this.#drawLandRelief(context, geography, viewport);
    }

    const taiwan = geography.features.find(
      (feature) => feature.properties.regionId === "taiwan-main"
    );

    if (taiwan) {
      this.#drawTaiwanTerrain(
        context,
        taiwan,
        viewport,
        width,
        hasTerrainTexture
      );
    }

    for (const segment of taiwan?.properties.coastSegments ?? []) {
      context.beginPath();
      traceLine(context, segment.coordinates, viewport);
      context.strokeStyle = "rgba(255, 241, 206, 0.28)";
      context.lineWidth = 1.1;
      context.stroke();
    }

    context.restore();
  }

  #drawTerrainTexture(context, viewport) {
    const texture = this.#terrainTexture;

    if (!texture?.image) {
      return false;
    }

    const sourceBounds = texture.source.bounds;
    const visibleBounds = Object.freeze({
      maxLat: Math.min(viewport.bounds.maxLat, sourceBounds.maxLat),
      maxLon: Math.min(viewport.bounds.maxLon, sourceBounds.maxLon),
      minLat: Math.max(viewport.bounds.minLat, sourceBounds.minLat),
      minLon: Math.max(viewport.bounds.minLon, sourceBounds.minLon)
    });

    if (
      visibleBounds.minLon >= visibleBounds.maxLon ||
      visibleBounds.minLat >= visibleBounds.maxLat
    ) {
      return false;
    }

    const northWest = geoToCanvas(
      {
        lat: visibleBounds.maxLat,
        lon: visibleBounds.minLon
      },
      viewport
    );
    const southEast = geoToCanvas(
      {
        lat: visibleBounds.minLat,
        lon: visibleBounds.maxLon
      },
      viewport
    );
    const sourceWidthDegrees = sourceBounds.maxLon - sourceBounds.minLon;
    const sourceHeightDegrees = sourceBounds.maxLat - sourceBounds.minLat;
    const sourceX =
      ((visibleBounds.minLon - sourceBounds.minLon) / sourceWidthDegrees) *
      texture.source.width;
    const sourceY =
      ((sourceBounds.maxLat - visibleBounds.maxLat) / sourceHeightDegrees) *
      texture.source.height;
    const sourceWidth =
      ((visibleBounds.maxLon - visibleBounds.minLon) / sourceWidthDegrees) *
      texture.source.width;
    const sourceHeight =
      ((visibleBounds.maxLat - visibleBounds.minLat) / sourceHeightDegrees) *
      texture.source.height;

    context.save();
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";
    context.globalAlpha =
      PROJECT_CONFIG.renderingConfig.terrainTextureOpacity;
    context.drawImage(
      texture.image,
      sourceX,
      sourceY,
      sourceWidth,
      sourceHeight,
      northWest.x,
      northWest.y,
      southEast.x - northWest.x,
      southEast.y - northWest.y
    );
    context.globalCompositeOperation = "source-atop";
    context.globalAlpha = 1;
    context.fillStyle = "rgba(4, 17, 22, 0.18)";
    context.fillRect(
      northWest.x,
      northWest.y,
      southEast.x - northWest.x,
      southEast.y - northWest.y
    );
    context.restore();
    return true;
  }

  #drawLandRelief(context, geography, viewport) {
    context.save();
    context.strokeStyle = "rgba(224, 235, 196, 0.09)";
    context.lineWidth = 0.65;

    for (const feature of geography.features) {
      context.save();
      context.beginPath();
      for (const ring of feature.geometry.coordinates) {
        traceRing(context, ring, viewport);
      }
      context.clip("evenodd");

      const primaryRing = feature.geometry.coordinates[0];
      const center = primaryRing.reduce(
        (total, [lon, lat]) => ({
          lat: total.lat + lat / primaryRing.length,
          lon: total.lon + lon / primaryRing.length
        }),
        { lat: 0, lon: 0 }
      );
      const point = geoToCanvas(center, viewport);
      const relief = context.createRadialGradient(
        point.x - 10,
        point.y - 12,
        0,
        point.x,
        point.y,
        Math.max(24, viewport.width * 0.12)
      );
      relief.addColorStop(0, "rgba(226, 213, 155, 0.24)");
      relief.addColorStop(0.48, "rgba(122, 145, 91, 0.12)");
      relief.addColorStop(1, "rgba(3, 17, 15, 0.3)");
      context.fillStyle = relief;
      context.fillRect(0, 0, viewport.width, viewport.height);

      for (
        let diagonal = -viewport.height;
        diagonal < viewport.width;
        diagonal += 26
      ) {
        context.beginPath();
        context.moveTo(diagonal, viewport.height);
        context.lineTo(diagonal + viewport.height, 0);
        context.stroke();
      }
      context.restore();
    }
    context.restore();
  }

  drawTargets({
    bounds,
    context,
    height,
    level,
    padding,
    stations,
    width
  }) {
    if (!level?.referenceZones) {
      return;
    }

    const viewport = { bounds, height, padding, width };
    context.save();

    for (const zone of level.referenceZones) {
      const station = stations.find((entry) => entry.id === zone.stationId);

      if (!station) {
        continue;
      }

      const center = geoToCanvas(station, viewport);
      const east = geoToCanvas(
        destinationPoint(station, zone.radiusKm, 90),
        viewport
      );
      const north = geoToCanvas(
        destinationPoint(station, zone.radiusKm, 0),
        viewport
      );
      context.beginPath();
      context.ellipse(
        center.x,
        center.y,
        Math.abs(east.x - center.x),
        Math.abs(north.y - center.y),
        0,
        0,
        Math.PI * 2
      );
      context.fillStyle = "rgba(118, 228, 247, 0.07)";
      context.fill();
      context.setLineDash([5, 4]);
      context.strokeStyle = "rgba(118, 228, 247, 0.9)";
      context.lineWidth = 1.5;
      context.stroke();
      context.setLineDash([]);
      context.fillStyle = "#d9f9ff";
      context.font = "750 9px ui-monospace, monospace";
      context.fillText(
        `教育警戒區 ${zone.radiusKm} 公里`,
        center.x + 8,
        center.y - 10
      );
    }

    for (const zone of level.warningZones ?? []) {
      const center = geoToCanvas(zone.center, viewport);
      const east = geoToCanvas(
        destinationPoint(zone.center, zone.radiusKm, 90),
        viewport
      );
      const north = geoToCanvas(
        destinationPoint(zone.center, zone.radiusKm, 0),
        viewport
      );
      context.beginPath();
      context.ellipse(
        center.x,
        center.y,
        Math.abs(east.x - center.x),
        Math.abs(north.y - center.y),
        0,
        0,
        Math.PI * 2
      );
      context.fillStyle = "rgba(255, 210, 125, 0.06)";
      context.fill();
      context.setLineDash([8, 5]);
      context.strokeStyle = "#ffd27d";
      context.lineWidth = 2;
      context.stroke();
      context.setLineDash([]);
      context.fillStyle = "#fff1ce";
      context.font = "750 9px ui-monospace, monospace";
      context.fillText(
        `教學警戒區 ${zone.radiusKm} 公里`,
        center.x + 8,
        center.y - 10
      );
    }

    const proximity = level.objectives.find(
      (objective) =>
        objective.metric === "storm.distanceToStation"
    );
    const station = stations.find((entry) => entry.id === proximity?.subject);

    if (station && Number.isFinite(proximity.threshold)) {
      const center = geoToCanvas(station, viewport);
      const east = geoToCanvas(
        destinationPoint(station, proximity.threshold, 90),
        viewport
      );
      const north = geoToCanvas(
        destinationPoint(station, proximity.threshold, 0),
        viewport
      );
      context.beginPath();
      context.ellipse(
        center.x,
        center.y,
        Math.abs(east.x - center.x),
        Math.abs(north.y - center.y),
        0,
        0,
        Math.PI * 2
      );
      context.strokeStyle = "#ffd27d";
      context.lineWidth = 2;
      context.stroke();
    }

    context.restore();
  }

  #drawTaiwanTerrain(
    context,
    taiwan,
    viewport,
    width,
    hasTerrainTexture
  ) {
    const ring = taiwan.geometry.coordinates[0];
    if (!hasTerrainTexture) {
      const west = geoToCanvas(
        { lat: 23.5, lon: 120 },
        viewport
      );
      const east = geoToCanvas(
        { lat: 23.5, lon: 121.9 },
        viewport
      );
      const gradient = context.createLinearGradient(west.x, 0, east.x, 0);
      gradient.addColorStop(0, "rgba(216, 190, 111, 0.42)");
      gradient.addColorStop(0.45, "rgba(104, 78, 52, 0.82)");
      gradient.addColorStop(0.68, "rgba(83, 126, 85, 0.48)");
      gradient.addColorStop(1, "rgba(134, 86, 66, 0.66)");

      context.save();
      context.beginPath();
      traceRing(context, ring, viewport);
      context.clip();
      context.fillStyle = gradient;
      context.fillRect(
        Math.min(west.x, east.x),
        0,
        Math.abs(east.x - west.x),
        viewport.height
      );

      const ridgePoints = [22.1, 22.7, 23.3, 23.9, 24.5, 25.1].map((lat) =>
        geoToCanvas(
          { lat, lon: taiwanRidgeLongitude(lat) },
          viewport
        )
      );
      context.beginPath();
      ridgePoints.forEach((point, index) => {
        if (index === 0) {
          context.moveTo(point.x, point.y);
        } else {
          context.lineTo(point.x, point.y);
        }
      });
      context.strokeStyle = "rgba(255, 225, 167, 0.92)";
      context.lineWidth = 2.2;
      context.shadowBlur = 7;
      context.shadowColor = "rgba(255, 210, 125, 0.72)";
      context.stroke();
      context.restore();
    }

    if (width >= 720) {
      const central = TAIWAN_TERRAIN_LABELS.find(
        (entry) => entry.zone === TerrainZone.CENTRAL_MOUNTAINS
      );
      const point = geoToCanvas(central, viewport);
      context.fillStyle = "#ffe1a7";
      context.font = "800 8px ui-monospace, monospace";
      context.fillText("中央山脈", point.x + 4, point.y - 2);
    }
  }
}

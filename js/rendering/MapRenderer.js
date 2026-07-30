import {
  TAIWAN_TERRAIN_LABELS,
  TerrainZone,
  taiwanRidgeLongitude
} from "../data/terrain.js";
import { destinationPoint, geoToCanvas } from "../utils/geo.js";

const COAST_COLORS = Object.freeze({
  east: "#76e4f7",
  north: "#eef7ff",
  south: "#ff9c9c",
  west: "#ffd27d"
});

const STATION_LABEL_OFFSETS = Object.freeze({
  hualien: Object.freeze({ x: 9, y: 17 }),
  naha: Object.freeze({ x: 8, y: -7 }),
  penghu: Object.freeze({ x: -34, y: 26 }),
  "sun-moon-lake": Object.freeze({ x: -43, y: 15 }),
  taichung: Object.freeze({ x: -39, y: -6 }),
  taipei: Object.freeze({ x: 9, y: -12 })
});

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
  draw({ context, geography, height, padding, selection, stations, width }) {
    const viewport = {
      bounds: geography.bounds,
      height,
      padding,
      width
    };

    context.save();
    context.fillStyle = "#294638";
    context.strokeStyle = "rgba(217, 249, 255, 0.7)";
    context.lineJoin = "round";
    context.lineWidth = 1.1;

    for (const feature of geography.features) {
      context.beginPath();

      for (const ring of feature.geometry.coordinates) {
        traceRing(context, ring, viewport);
      }

      context.fill("evenodd");
      context.stroke();
    }

    const taiwan = geography.features.find(
      (feature) => feature.properties.regionId === "taiwan-main"
    );

    if (taiwan) {
      this.#drawTaiwanTerrain(context, taiwan, viewport, width);
    }

    for (const segment of taiwan?.properties.coastSegments ?? []) {
      context.beginPath();
      traceLine(context, segment.coordinates, viewport);
      context.strokeStyle = COAST_COLORS[segment.coastSide];
      context.lineWidth = 2.5;
      context.stroke();
    }

    for (const station of stations) {
      const point = geoToCanvas(station, viewport);
      const labelOffset = STATION_LABEL_OFFSETS[station.id] ?? {
        x: 6,
        y: -4
      };
      context.beginPath();
      context.arc(point.x, point.y, 3.5, 0, Math.PI * 2);
      context.fillStyle = "#ffd27d";
      context.fill();
      context.strokeStyle = "#06111f";
      context.lineWidth = 1;
      context.stroke();

      if (width >= 600) {
        context.beginPath();
        context.moveTo(point.x, point.y);
        context.lineTo(
          point.x + labelOffset.x * 0.78,
          point.y + labelOffset.y * 0.78
        );
        context.strokeStyle = "rgba(255, 210, 125, 0.72)";
        context.lineWidth = 0.8;
        context.stroke();
        context.fillStyle = "#eef7ff";
        context.font = "650 9px system-ui, sans-serif";
        context.fillText(
          station.name,
          point.x + labelOffset.x,
          point.y + labelOffset.y
        );
      }
    }

    if (selection) {
      const point = geoToCanvas(selection.point, viewport);
      context.strokeStyle = selection.isLand ? "#ff9c9c" : "#76e4f7";
      context.lineWidth = 2;
      context.beginPath();
      context.arc(point.x, point.y, 7, 0, Math.PI * 2);
      context.moveTo(point.x - 11, point.y);
      context.lineTo(point.x + 11, point.y);
      context.moveTo(point.x, point.y - 11);
      context.lineTo(point.x, point.y + 11);
      context.stroke();
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
        `${zone.id.toUpperCase()} ${zone.radiusKm} km`,
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
        `EDU WARNING ${zone.radiusKm} km`,
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

  #drawTaiwanTerrain(context, taiwan, viewport, width) {
    const ring = taiwan.geometry.coordinates[0];
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
    context.strokeStyle = "rgba(255, 225, 167, 0.9)";
    context.lineWidth = 2.2;
    context.stroke();
    context.restore();

    if (width >= 900) {
      const central = TAIWAN_TERRAIN_LABELS.find(
        (entry) => entry.zone === TerrainZone.CENTRAL_MOUNTAINS
      );
      const point = geoToCanvas(central, viewport);
      context.fillStyle = "#ffe1a7";
      context.font = "800 8px ui-monospace, monospace";
      context.fillText("CMR", point.x + 4, point.y - 2);
    }
  }
}

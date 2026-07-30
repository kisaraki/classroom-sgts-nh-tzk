import { geoToCanvas } from "../utils/geo.js";

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
}

import { PROJECT_CONFIG } from "../config.js";
import { geoToCanvas } from "../utils/geo.js";

export class FieldRenderer {
  #graticuleDegrees;

  constructor({
    graticuleDegrees = PROJECT_CONFIG.geography.graticuleDegrees
  } = {}) {
    this.#graticuleDegrees = graticuleDegrees;
  }

  draw({ bounds, context, height, padding, width }) {
    const ocean = context.createLinearGradient(0, 0, width, height);
    ocean.addColorStop(0, "#061625");
    ocean.addColorStop(0.55, "#0a2a40");
    ocean.addColorStop(1, "#10384f");
    context.fillStyle = ocean;
    context.fillRect(0, 0, width, height);

    context.save();
    context.strokeStyle = "rgba(118, 228, 247, 0.18)";
    context.fillStyle = "rgba(217, 249, 255, 0.72)";
    context.lineWidth = 1;
    context.font = "600 10px ui-monospace, monospace";

    for (
      let lon = bounds.minLon;
      lon <= bounds.maxLon;
      lon += this.#graticuleDegrees
    ) {
      const top = geoToCanvas(
        { lat: bounds.maxLat, lon },
        { bounds, height, padding, width }
      );
      const bottom = geoToCanvas(
        { lat: bounds.minLat, lon },
        { bounds, height, padding, width }
      );

      context.beginPath();
      context.moveTo(top.x, top.y);
      context.lineTo(bottom.x, bottom.y);
      context.stroke();
      context.fillText(`${lon}°E`, top.x + 3, height - 8);
    }

    for (
      let lat = bounds.minLat;
      lat <= bounds.maxLat;
      lat += this.#graticuleDegrees
    ) {
      const left = geoToCanvas(
        { lat, lon: bounds.minLon },
        { bounds, height, padding, width }
      );
      const right = geoToCanvas(
        { lat, lon: bounds.maxLon },
        { bounds, height, padding, width }
      );

      context.beginPath();
      context.moveTo(left.x, left.y);
      context.lineTo(right.x, right.y);
      context.stroke();

      if (lat > bounds.minLat) {
        context.fillText(`${lat}°N`, 5, left.y - 3);
      }
    }

    context.restore();
  }
}

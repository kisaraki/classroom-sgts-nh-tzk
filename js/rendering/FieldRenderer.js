import { PROJECT_CONFIG } from "../config.js";
import { clamp } from "../utils/math.js";
import { geoToCanvas } from "../utils/geo.js";

export const vectorToCanvasDelta = (
  { u, v },
  scale = PROJECT_CONFIG.renderingConfig.fieldArrowVectorScale
) => {
  const config = PROJECT_CONFIG.renderingConfig;
  const rawLength = Math.hypot(u, v) * scale;
  const appliedScale =
    rawLength > config.fieldArrowMaximumPixels
      ? config.fieldArrowMaximumPixels / Math.max(rawLength, 1e-9)
      : 1;

  return Object.freeze({
    x: u * scale * appliedScale,
    y: -v * scale * appliedScale
  });
};

const drawArrow = (context, start, vector, color, lineWidth = 1) => {
  const end = {
    x: start.x + vector.x,
    y: start.y + vector.y
  };
  const angle = Math.atan2(vector.y, vector.x);
  const head = PROJECT_CONFIG.renderingConfig.fieldArrowHeadPixels;

  context.beginPath();
  context.moveTo(start.x, start.y);
  context.lineTo(end.x, end.y);
  context.lineTo(
    end.x - Math.cos(angle - Math.PI / 6) * head,
    end.y - Math.sin(angle - Math.PI / 6) * head
  );
  context.moveTo(end.x, end.y);
  context.lineTo(
    end.x - Math.cos(angle + Math.PI / 6) * head,
    end.y - Math.sin(angle + Math.PI / 6) * head
  );
  context.strokeStyle = color;
  context.lineWidth = lineWidth;
  context.stroke();
};

export class FieldRenderer {
  #graticuleDegrees;

  constructor({
    graticuleDegrees = PROJECT_CONFIG.geography.graticuleDegrees
  } = {}) {
    this.#graticuleDegrees = graticuleDegrees;
  }

  draw({ bounds, context, environment, height, padding, width }) {
    const ocean = context.createLinearGradient(0, 0, width, height);
    ocean.addColorStop(0, "#061625");
    ocean.addColorStop(0.55, "#0a2a40");
    ocean.addColorStop(1, "#10384f");
    context.fillStyle = ocean;
    context.fillRect(0, 0, width, height);

    if (environment?.cells.length > 0) {
      this.#drawTemperatureField({
        bounds,
        context,
        environment,
        height,
        padding,
        width
      });
      this.#drawColdWakeField({
        bounds,
        context,
        environment,
        height,
        padding,
        width
      });
    }

    this.#drawGraticule({ bounds, context, height, padding, width });
  }

  drawOverlay({
    bounds,
    context,
    environment,
    height,
    observations = [],
    padding,
    steeringDiagnostic,
    typhoon,
    width
  }) {
    if (!environment?.cells.length) {
      return;
    }

    this.#drawRainfall({
      bounds,
      context,
      height,
      observations,
      padding,
      width
    });
    this.#drawPressureSystems({
      bounds,
      context,
      environment,
      height,
      padding,
      width
    });
    this.#drawSteeringArrows({
      bounds,
      context,
      environment,
      height,
      padding,
      width
    });

    if (steeringDiagnostic && typhoon) {
      const start = geoToCanvas(typhoon, {
        bounds,
        height,
        padding,
        width
      });
      const vector = vectorToCanvasDelta(
        steeringDiagnostic.actualVector,
        PROJECT_CONFIG.renderingConfig.currentVectorDisplayScale
      );
      context.save();
      context.shadowBlur = 6;
      context.shadowColor = "#ffd27d";
      drawArrow(context, start, vector, "#ffd27d", 2.5);
      context.fillStyle = "#ffd27d";
      context.font = "700 10px ui-monospace, monospace";
      context.fillText("NEXT", start.x + vector.x + 5, start.y + vector.y - 4);
      context.restore();
    }
  }

  #drawColdWakeField({
    bounds,
    context,
    environment,
    height,
    padding,
    width
  }) {
    const minimum = PROJECT_CONFIG.renderingConfig.coldWakeTileMinimum;
    const maximum = PROJECT_CONFIG.oceanCoolingConfig.maximumColdWake;
    const resolution = environment.gridResolution;

    context.save();

    for (const cell of environment.cells) {
      if (cell.landFraction >= 0.5 || cell.coldWake < minimum) {
        continue;
      }

      const topLeft = geoToCanvas(
        {
          lat: Math.min(bounds.maxLat, cell.lat + resolution / 2),
          lon: Math.max(bounds.minLon, cell.lon - resolution / 2)
        },
        { bounds, height, padding, width }
      );
      const bottomRight = geoToCanvas(
        {
          lat: Math.max(bounds.minLat, cell.lat - resolution / 2),
          lon: Math.min(bounds.maxLon, cell.lon + resolution / 2)
        },
        { bounds, height, padding, width }
      );
      const intensity = clamp(cell.coldWake / maximum, 0, 1);
      context.fillStyle =
        `rgba(${Math.round(38 + intensity * 58)}, ` +
        `${Math.round(104 + intensity * 40)}, 216, ` +
        `${0.15 + intensity * 0.5})`;
      context.fillRect(
        topLeft.x,
        topLeft.y,
        bottomRight.x - topLeft.x,
        bottomRight.y - topLeft.y
      );
    }

    context.restore();
  }

  #drawRainfall({
    bounds,
    context,
    height,
    observations,
    padding,
    width
  }) {
    const displayMaximum =
      PROJECT_CONFIG.renderingConfig.rainfallMaximumDisplayRate;

    context.save();
    context.globalCompositeOperation = "screen";

    for (const observation of observations) {
      const station = observation.station;
      const rate = station.hourlyRainRate;

      if (rate < 0.1) {
        continue;
      }

      const point = geoToCanvas(station, {
        bounds,
        height,
        padding,
        width
      });
      const intensity = clamp(rate / displayMaximum, 0, 1);
      const radius = 5 + intensity * 15;
      const gradient = context.createRadialGradient(
        point.x,
        point.y,
        0,
        point.x,
        point.y,
        radius
      );
      gradient.addColorStop(0, `rgba(123, 239, 255, ${0.3 + intensity * 0.5})`);
      gradient.addColorStop(0.62, `rgba(74, 141, 255, ${0.16 + intensity * 0.34})`);
      gradient.addColorStop(1, "rgba(74, 141, 255, 0)");
      context.fillStyle = gradient;
      context.beginPath();
      context.arc(point.x, point.y, radius, 0, Math.PI * 2);
      context.fill();
    }

    context.restore();
  }

  #drawTemperatureField({
    bounds,
    context,
    environment,
    height,
    padding,
    width
  }) {
    const spacing = PROJECT_CONFIG.renderingConfig.temperatureTileDegrees;
    const minSST = PROJECT_CONFIG.environmentConfig.seaSurfaceTemperatureMinimum;
    const maxSST = PROJECT_CONFIG.environmentConfig.baseSeaSurfaceTemperature;

    context.save();

    for (let lat = bounds.minLat; lat < bounds.maxLat; lat += spacing) {
      for (let lon = bounds.minLon; lon < bounds.maxLon; lon += spacing) {
        const cell = environment.sampleAt({
          lat: lat + spacing / 2,
          lon: lon + spacing / 2
        });
        const topLeft = geoToCanvas(
          { lat: lat + spacing, lon },
          { bounds, height, padding, width }
        );
        const bottomRight = geoToCanvas(
          { lat, lon: lon + spacing },
          { bounds, height, padding, width }
        );
        const heat = clamp((cell.SST - minSST) / (maxSST - minSST), 0, 1);
        context.fillStyle =
          `rgba(${Math.round(18 + heat * 36)}, ` +
          `${Math.round(80 + heat * 45)}, ${Math.round(118 + heat * 52)}, 0.2)`;
        context.fillRect(
          topLeft.x,
          topLeft.y,
          bottomRight.x - topLeft.x,
          bottomRight.y - topLeft.y
        );
      }
    }

    context.restore();
  }

  #drawGraticule({ bounds, context, height, padding, width }) {
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

  #drawPressureSystems({
    bounds,
    context,
    environment,
    height,
    padding,
    width
  }) {
    const config = PROJECT_CONFIG.renderingConfig;
    const high = environment.subtropicalHigh;
    const center = geoToCanvas(
      {
        lat: high.ridgeLatitude,
        lon: Math.max(
          high.westwardExtent +
            PROJECT_CONFIG.environmentConfig.highInfluenceLongitudeSpan,
          145
        )
      },
      { bounds, height, padding, width }
    );
    const lonRadius =
      (config.highRangeLongitudeRadius / (bounds.maxLon - bounds.minLon)) *
      (width - padding.left - padding.right);
    const latRadius =
      (config.highRangeLatitudeRadius / (bounds.maxLat - bounds.minLat)) *
      (height - padding.top - padding.bottom);

    context.save();
    context.fillStyle = `rgba(255, 210, 125, ${0.04 + high.intensity * 0.08})`;
    context.strokeStyle = "rgba(255, 210, 125, 0.58)";
    context.setLineDash([6, 5]);
    context.beginPath();
    context.ellipse(center.x, center.y, lonRadius, latRadius, 0, 0, Math.PI * 2);
    context.fill();
    context.stroke();
    context.setLineDash([]);

    for (let index = 1; index <= config.isobarCount; index += 1) {
      const ratio = index / (config.isobarCount + 1);
      context.beginPath();
      context.ellipse(
        center.x,
        center.y,
        lonRadius * ratio,
        latRadius * ratio,
        0,
        0,
        Math.PI * 2
      );
      context.strokeStyle = "rgba(255, 210, 125, 0.28)";
      context.stroke();
    }

    context.fillStyle = "#ffd27d";
    context.font = "800 11px system-ui, sans-serif";
    context.fillText("副高 H", center.x - 18, center.y + 4);

    const troughPoints = [105, 120, 135, 150].map((lon, index) =>
      geoToCanvas(
        {
          lat: config.monsoonTroughLatitude + index * 0.7,
          lon
        },
        { bounds, height, padding, width }
      )
    );
    context.beginPath();
    troughPoints.forEach((point, index) => {
      if (index === 0) {
        context.moveTo(point.x, point.y);
      } else {
        context.lineTo(point.x, point.y);
      }
    });
    context.strokeStyle = "rgba(118, 232, 255, 0.62)";
    context.lineWidth = 2;
    context.setLineDash([3, 5]);
    context.stroke();
    context.setLineDash([]);
    context.fillStyle = "#76e8ff";
    context.fillText(
      "季風槽",
      troughPoints[1].x,
      troughPoints[1].y + 14
    );
    context.restore();
  }

  #drawSteeringArrows({
    bounds,
    context,
    environment,
    height,
    padding,
    width
  }) {
    const spacing = PROJECT_CONFIG.renderingConfig.fieldArrowSpacingDegrees;

    context.save();

    for (
      let lat = bounds.minLat + spacing;
      lat < bounds.maxLat;
      lat += spacing
    ) {
      for (
        let lon = bounds.minLon + spacing;
        lon < bounds.maxLon;
        lon += spacing
      ) {
        const cell = environment.sampleAt({ lat, lon });
        const start = geoToCanvas(
          { lat, lon },
          { bounds, height, padding, width }
        );
        drawArrow(
          context,
          start,
          vectorToCanvasDelta(cell),
          "rgba(217, 249, 255, 0.42)"
        );
      }
    }

    context.restore();
  }
}

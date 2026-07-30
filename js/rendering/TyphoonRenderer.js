import { PROJECT_CONFIG } from "../config.js";
import { geoToCanvas } from "../utils/geo.js";

const TAU = Math.PI * 2;

const drawArc = (
  context,
  radius,
  start,
  end,
  { alpha = 0.9, lineWidth = 3 } = {}
) => {
  context.beginPath();
  context.arc(0, 0, radius, start, end);
  context.strokeStyle = `rgba(217, 249, 255, ${alpha})`;
  context.lineWidth = lineWidth;
  context.stroke();
};

export class TyphoonRenderer {
  draw({ bounds, context, height, padding, typhoon, width }) {
    if (!typhoon) {
      return;
    }

    const center = geoToCanvas(typhoon, {
      bounds,
      height,
      padding,
      width
    });
    const renderConfig = PROJECT_CONFIG.renderingConfig;
    const radius = Math.min(
      renderConfig.stormMaximumPixelRadius,
      Math.max(
        renderConfig.stormMinimumPixelRadius,
        typhoon.galeRadius / renderConfig.stormRadiusKilometreScale
      )
    );

    context.save();
    context.translate(center.x, center.y);
    context.rotate((typhoon.heading * Math.PI) / 180);
    context.globalAlpha = typhoon.active ? 1 : 0.58;
    context.shadowColor = "rgba(118, 232, 255, 0.64)";
    context.shadowBlur = 12;

    this.#drawStage(context, typhoon.structureStage, radius);

    context.shadowBlur = 0;
    context.fillStyle = "#06111f";
    context.strokeStyle = "#d9f9ff";
    context.lineWidth = 2;
    context.beginPath();
    context.arc(0, 0, typhoon.structureStage === "eye" ? 5 : 3, 0, TAU);
    context.fill();
    context.stroke();
    context.restore();

    context.save();
    context.fillStyle = "#eef7ff";
    context.font = "700 11px system-ui, sans-serif";
    context.fillText(
      `${typhoon.name} · ${typhoon.structureStage.toUpperCase()}`,
      center.x + radius * 0.55,
      center.y - radius * 0.62
    );
    context.restore();
  }

  #drawStage(context, stage, radius) {
    if (stage === "cluster") {
      for (const [x, y, scale] of [
        [-0.3, -0.18, 0.42],
        [0.22, -0.26, 0.36],
        [0.28, 0.22, 0.46],
        [-0.2, 0.28, 0.32]
      ]) {
        context.beginPath();
        context.arc(x * radius, y * radius, scale * radius, 0, TAU);
        context.fillStyle = "rgba(118, 232, 255, 0.32)";
        context.fill();
      }
      return;
    }

    if (stage === "decaying") {
      context.setLineDash([5, 7]);
      drawArc(context, radius * 0.42, 0.1, 4.4, {
        alpha: 0.42,
        lineWidth: 2
      });
      drawArc(context, radius * 0.78, 2, 5.5, {
        alpha: 0.3,
        lineWidth: 3
      });
      context.setLineDash([]);
      return;
    }

    drawArc(context, radius * 0.34, 0.4, 5.5, { lineWidth: 3.5 });
    drawArc(context, radius * 0.62, 2.2, 7.2, {
      alpha: 0.72,
      lineWidth: 3
    });

    if (stage === "spiral") {
      drawArc(context, radius * 0.9, 3.5, 7.7, {
        alpha: 0.5,
        lineWidth: 2
      });
      return;
    }

    if (stage === "comma") {
      context.beginPath();
      context.moveTo(radius * 0.45, radius * 0.2);
      context.quadraticCurveTo(
        radius * 1.05,
        radius * 0.54,
        radius * 1.28,
        radius * 1.12
      );
      context.strokeStyle = "rgba(217, 249, 255, 0.58)";
      context.lineWidth = 4;
      context.stroke();
      return;
    }

    drawArc(context, radius * 0.84, 0, TAU, {
      alpha: 0.78,
      lineWidth: 4
    });
    drawArc(context, radius * 0.18, 0, TAU, {
      alpha: 1,
      lineWidth: 3
    });
  }
}

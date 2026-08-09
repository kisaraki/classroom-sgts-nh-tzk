import { PROJECT_CONFIG } from "../config.js";
import { clamp } from "../utils/math.js";

export const STRUCTURE_VISUAL_LABELS = Object.freeze({
  cluster: "鬆散雲團",
  comma: "不對稱逗號狀",
  decaying: "衰減結構",
  eye: "颱風眼",
  inactive: "低於熱帶性低氣壓強度",
  spiral: "螺旋雨帶"
});

export const canvasCyclonicDirection = (lat) => (lat >= 0 ? -1 : 1);

export const particleAngleAt = ({
  angle,
  lat,
  simulationMinutes,
  speedScale = 1
}) =>
  angle +
  canvasCyclonicDirection(lat) *
    simulationMinutes *
    PROJECT_CONFIG.renderingConfig.particleAngularSpeed *
    speedScale;

export const resolveTyphoonVisualMetrics = (typhoon) => {
  const config = PROJECT_CONFIG.renderingConfig;
  const lifecycle = typhoon.active ? typhoon.structureStage : "inactive";
  const baseRadius = clamp(
    typhoon.galeRadius / config.stormRadiusKilometreScale,
    config.stormMinimumPixelRadius,
    config.stormMaximumPixelRadius
  );
  const lifecycleScale =
    config.stormLifecycleScale[lifecycle] ?? 1;
  const radius = clamp(
    baseRadius * lifecycleScale,
    config.stormVisualMinimumPixelRadius,
    config.stormVisualMaximumPixelRadius
  );

  return Object.freeze({
    lifecycle,
    opacity: config.stormLifecycleOpacity[lifecycle] ?? 1,
    radius
  });
};

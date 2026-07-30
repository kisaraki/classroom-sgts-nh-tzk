import { clamp } from "../utils/math.js";
import {
  assertFiniteNumber,
  assertPositiveNumber
} from "../utils/validation.js";

export const MAX_DEVICE_PIXEL_RATIO = 2;

export const computeCanvasDimensions = ({
  cssHeight,
  cssWidth,
  devicePixelRatio = 1,
  maxDevicePixelRatio = MAX_DEVICE_PIXEL_RATIO
}) => {
  assertPositiveNumber(cssWidth, "cssWidth");
  assertPositiveNumber(cssHeight, "cssHeight");
  assertFiniteNumber(devicePixelRatio, "devicePixelRatio");
  assertPositiveNumber(maxDevicePixelRatio, "maxDevicePixelRatio");

  const scale = clamp(devicePixelRatio, 1, maxDevicePixelRatio);

  return Object.freeze({
    cssHeight,
    cssWidth,
    pixelHeight: Math.round(cssHeight * scale),
    pixelWidth: Math.round(cssWidth * scale),
    scale
  });
};

export class CanvasViewport {
  #canvas;
  #dimensions = null;
  #getDevicePixelRatio;
  #resizeObserver = null;

  constructor(
    canvas,
    {
      getDevicePixelRatio = () => globalThis.devicePixelRatio ?? 1,
      ResizeObserverClass = globalThis.ResizeObserver
    } = {}
  ) {
    if (!canvas || typeof canvas.getContext !== "function") {
      throw new TypeError("CanvasViewport requires a canvas element.");
    }

    this.#canvas = canvas;
    this.#getDevicePixelRatio = getDevicePixelRatio;

    if (typeof ResizeObserverClass === "function") {
      this.#resizeObserver = new ResizeObserverClass(() => this.resize());
      this.#resizeObserver.observe(canvas);
    }

    this.resize();
  }

  get dimensions() {
    return this.#dimensions;
  }

  resize() {
    const rect = this.#canvas.getBoundingClientRect();

    if (rect.width <= 0 || rect.height <= 0) {
      return this.#dimensions;
    }

    const dimensions = computeCanvasDimensions({
      cssHeight: rect.height,
      cssWidth: rect.width,
      devicePixelRatio: this.#getDevicePixelRatio()
    });

    if (
      this.#canvas.width !== dimensions.pixelWidth ||
      this.#canvas.height !== dimensions.pixelHeight
    ) {
      this.#canvas.width = dimensions.pixelWidth;
      this.#canvas.height = dimensions.pixelHeight;
    }

    this.#dimensions = dimensions;
    return dimensions;
  }

  draw({ fps, simulationMinutes, speed, state, stepIndex }) {
    const dimensions = this.resize();

    if (!dimensions) {
      return;
    }

    const context = this.#canvas.getContext("2d");

    if (!context) {
      throw new Error("Canvas 2D context is unavailable.");
    }

    const { cssHeight: height, cssWidth: width, scale } = dimensions;
    context.setTransform(scale, 0, 0, scale, 0, 0);
    context.clearRect(0, 0, width, height);

    const ocean = context.createLinearGradient(0, 0, width, height);
    ocean.addColorStop(0, "#07182a");
    ocean.addColorStop(0.58, "#0b2c43");
    ocean.addColorStop(1, "#123a52");
    context.fillStyle = ocean;
    context.fillRect(0, 0, width, height);

    context.strokeStyle = "rgba(118, 228, 247, 0.16)";
    context.lineWidth = 1;
    const gridSize = Math.max(32, Math.round(Math.min(width, height) / 8));

    for (let x = 0; x <= width; x += gridSize) {
      context.beginPath();
      context.moveTo(x, 0);
      context.lineTo(x, height);
      context.stroke();
    }

    for (let y = 0; y <= height; y += gridSize) {
      context.beginPath();
      context.moveTo(0, y);
      context.lineTo(width, y);
      context.stroke();
    }

    context.fillStyle = "#d9f9ff";
    context.font = "700 18px system-ui, sans-serif";
    context.fillText("西北太平洋模擬範圍", 24, 38);

    context.fillStyle = "#9cc8d9";
    context.font = "500 14px system-ui, sans-serif";
    context.fillText("100°E～160°E · 0°N～40°N", 24, 62);

    context.fillStyle = "#eef7ff";
    context.font = "650 14px ui-monospace, monospace";
    context.fillText(`STATE  ${state}`, 24, height - 76);
    context.fillText(
      `TIME   ${formatSimulationTime(simulationMinutes)}  ·  STEP ${stepIndex}`,
      24,
      height - 52
    );
    context.fillText(
      `SPEED  ${speed}×  ·  FPS ${Number.isFinite(fps) ? fps.toFixed(0) : "0"}`,
      24,
      height - 28
    );

    context.fillStyle = "rgba(217, 249, 255, 0.68)";
    context.font = "600 13px system-ui, sans-serif";
    const placeholder = "Phase 1：地圖與颱風物理尚未啟用";
    const measured = context.measureText(placeholder);
    context.fillText(
      placeholder,
      Math.max(24, width - measured.width - 24),
      38
    );
  }

  destroy() {
    this.#resizeObserver?.disconnect();
  }
}

export const formatSimulationTime = (simulationMinutes) => {
  assertFiniteNumber(simulationMinutes, "simulationMinutes");

  const totalMinutes = Math.max(0, Math.round(simulationMinutes));
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;

  return `${String(days).padStart(2, "0")}d ${String(hours).padStart(
    2,
    "0"
  )}h ${String(minutes).padStart(2, "0")}m`;
};

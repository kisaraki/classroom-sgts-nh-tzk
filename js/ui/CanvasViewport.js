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

  return `${String(days).padStart(2, "0")} 日 ${String(hours).padStart(
    2,
    "0"
  )} 時 ${String(minutes).padStart(2, "0")} 分`;
};

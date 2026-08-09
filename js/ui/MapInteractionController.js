import { clamp } from "../utils/math.js";

const WHEEL_LINE_PIXELS = 16;
const WHEEL_SENSITIVITY = 0.0018;
const MINIMUM_WHEEL_FACTOR = 0.8;
const MAXIMUM_WHEEL_FACTOR = 1.25;
const BUTTON_ZOOM_FACTOR = 1.4;
const ANNOUNCEMENT_DELAY_MS = 180;

export const wheelZoomFactor = ({ deltaMode = 0, deltaY, pageHeight = 800 }) => {
  const pixels =
    deltaY *
    (deltaMode === 1
      ? WHEEL_LINE_PIXELS
      : deltaMode === 2
        ? pageHeight
        : 1);

  return clamp(
    Math.exp(-pixels * WHEEL_SENSITIVITY),
    MINIMUM_WHEEL_FACTOR,
    MAXIMUM_WHEEL_FACTOR
  );
};

const mapViewText = ({ centerLat, centerLon, zoom }) =>
  `縮放 ${(zoom * 100).toFixed(0)}% · ` +
  `中心北緯 ${centerLat.toFixed(2)}°、東經 ${centerLon.toFixed(2)}°`;

export class MapInteractionController {
  #announcement;
  #announcementTimer = null;
  #buttonHandlers = [];
  #canvas;
  #onBlur;
  #onError;
  #onKeyDown;
  #onLostPointerCapture;
  #onPointerCancel;
  #onPointerDown;
  #onPointerMove;
  #onPointerUp;
  #onWheel;
  #pointers = new Map();
  #renderer;
  #status;

  constructor({
    announcement,
    canvas,
    onError = () => {},
    renderer,
    resetButton,
    status,
    zoomInButton,
    zoomOutButton
  }) {
    if (!canvas || !renderer || !status || !announcement) {
      throw new TypeError("MapInteractionController is missing a dependency.");
    }

    this.#announcement = announcement;
    this.#canvas = canvas;
    this.#onError = onError;
    this.#renderer = renderer;
    this.#status = status;

    this.#onWheel = (event) => {
      if (!this.#renderer.isClientPointInMap(event)) {
        return;
      }

      event.preventDefault();
      this.#perform(() =>
        this.#renderer.zoomMapAtClientPoint(
          event,
          wheelZoomFactor({
            deltaMode: event.deltaMode,
            deltaY: event.deltaY,
            pageHeight: this.#canvas.getBoundingClientRect().height
          })
        )
      );
      this.#scheduleAnnouncement();
    };

    this.#onPointerDown = (event) => {
      if (
        (event.pointerType === "mouse" && event.button !== 0) ||
        !this.#renderer.isClientPointInMap(event)
      ) {
        return;
      }

      event.preventDefault();
      this.#pointers.set(event.pointerId, this.#pointerSnapshot(event));
      this.#canvas.dataset.mapDragging = "true";

      try {
        this.#canvas.setPointerCapture(event.pointerId);
      } catch {
        // Pointer capture may already be unavailable during cancellation.
      }
    };

    this.#onPointerMove = (event) => {
      if (!this.#pointers.has(event.pointerId)) {
        return;
      }

      event.preventDefault();
      const previous = this.#orderedPointers();
      const previousPoint = this.#pointers.get(event.pointerId);
      this.#pointers.set(event.pointerId, this.#pointerSnapshot(event));
      const current = this.#orderedPointers();

      if (current.length >= 2) {
        this.#perform(() =>
          this.#renderer.transformMapByPinch({
            currentPoints: current.slice(0, 2),
            previousPoints: previous.slice(0, 2)
          })
        );
      } else {
        this.#perform(() =>
          this.#renderer.panMapByPixels({
            deltaX: event.clientX - previousPoint.clientX,
            deltaY: event.clientY - previousPoint.clientY
          })
        );
      }
    };

    const finishPointer = (event, releaseCapture = true) => {
      if (!this.#pointers.delete(event.pointerId)) {
        return;
      }

      if (releaseCapture) {
        try {
          if (this.#canvas.hasPointerCapture(event.pointerId)) {
            this.#canvas.releasePointerCapture(event.pointerId);
          }
        } catch {
          // The browser may release capture before pointerup is delivered.
        }
      }

      if (this.#pointers.size === 0) {
        delete this.#canvas.dataset.mapDragging;
        this.#announce();
      }
    };

    this.#onPointerUp = (event) => finishPointer(event);
    this.#onPointerCancel = (event) => finishPointer(event);
    this.#onLostPointerCapture = (event) => finishPointer(event, false);
    this.#onBlur = () => {
      if (this.#pointers.size > 0) {
        this.#pointers.clear();
        delete this.#canvas.dataset.mapDragging;
        this.#announce();
      }
    };

    this.#onKeyDown = (event) => {
      const viewport = this.#renderer.getMapViewport();
      if (!viewport) {
        return;
      }

      const fraction = event.shiftKey ? 0.25 : 0.1;
      const horizontal =
        (viewport.width - viewport.padding.left - viewport.padding.right) *
        fraction;
      const vertical =
        (viewport.height - viewport.padding.top - viewport.padding.bottom) *
        fraction;
      let action = null;

      if (event.key === "+" || event.key === "=") {
        action = () => this.#renderer.zoomMapAtCenter(BUTTON_ZOOM_FACTOR);
      } else if (event.key === "-") {
        action = () => this.#renderer.zoomMapAtCenter(1 / BUTTON_ZOOM_FACTOR);
      } else if (event.key === "0" || event.key === "Home") {
        action = () => this.#renderer.resetMapView();
      } else if (event.key === "ArrowLeft") {
        action = () =>
          this.#renderer.panMapByPixels({ deltaX: horizontal, deltaY: 0 });
      } else if (event.key === "ArrowRight") {
        action = () =>
          this.#renderer.panMapByPixels({ deltaX: -horizontal, deltaY: 0 });
      } else if (event.key === "ArrowUp") {
        action = () =>
          this.#renderer.panMapByPixels({ deltaX: 0, deltaY: vertical });
      } else if (event.key === "ArrowDown") {
        action = () =>
          this.#renderer.panMapByPixels({ deltaX: 0, deltaY: -vertical });
      }

      if (action) {
        event.preventDefault();
        this.#perform(action);
        this.#announce();
      }
    };

    this.#canvas.addEventListener("wheel", this.#onWheel, { passive: false });
    this.#canvas.addEventListener("pointerdown", this.#onPointerDown);
    this.#canvas.addEventListener("pointermove", this.#onPointerMove);
    this.#canvas.addEventListener("pointerup", this.#onPointerUp);
    this.#canvas.addEventListener("pointercancel", this.#onPointerCancel);
    this.#canvas.addEventListener(
      "lostpointercapture",
      this.#onLostPointerCapture
    );
    this.#canvas.addEventListener("keydown", this.#onKeyDown);
    globalThis.addEventListener?.("blur", this.#onBlur);

    this.#bindButton(zoomInButton, () =>
      this.#renderer.zoomMapAtCenter(BUTTON_ZOOM_FACTOR)
    );
    this.#bindButton(zoomOutButton, () =>
      this.#renderer.zoomMapAtCenter(1 / BUTTON_ZOOM_FACTOR)
    );
    this.#bindButton(resetButton, () => this.#renderer.resetMapView());
    this.#syncStatus();
  }

  #pointerSnapshot({ clientX, clientY, pointerId }) {
    return Object.freeze({ clientX, clientY, pointerId });
  }

  #orderedPointers() {
    return [...this.#pointers.values()].sort(
      (first, second) => first.pointerId - second.pointerId
    );
  }

  #perform(action) {
    try {
      action();
      this.#syncStatus();
    } catch (error) {
      this.#onError(error);
    }
  }

  #bindButton(button, action) {
    if (!button) {
      throw new TypeError("Map interaction button is missing.");
    }

    const handler = () => {
      this.#perform(action);
      this.#announce();
      this.#canvas.focus();
    };
    button.addEventListener("click", handler);
    this.#buttonHandlers.push({ button, handler });
  }

  #syncStatus() {
    const view = this.#renderer.mapView;
    const text = mapViewText(view);
    this.#status.textContent = text;
    this.#canvas.dataset.mapCenterLat = view.centerLat.toFixed(6);
    this.#canvas.dataset.mapCenterLon = view.centerLon.toFixed(6);
    this.#canvas.dataset.mapRevision = String(view.revision);
    this.#canvas.dataset.mapZoom = view.zoom.toFixed(6);
  }

  #announce() {
    if (this.#announcementTimer !== null) {
      globalThis.clearTimeout(this.#announcementTimer);
      this.#announcementTimer = null;
    }
    this.#announcement.textContent = this.#status.textContent;
  }

  #scheduleAnnouncement() {
    if (this.#announcementTimer !== null) {
      globalThis.clearTimeout(this.#announcementTimer);
    }
    this.#announcementTimer = globalThis.setTimeout(() => {
      this.#announcementTimer = null;
      this.#announce();
    }, ANNOUNCEMENT_DELAY_MS);
  }

  destroy() {
    if (this.#announcementTimer !== null) {
      globalThis.clearTimeout(this.#announcementTimer);
    }
    this.#canvas.removeEventListener("wheel", this.#onWheel);
    this.#canvas.removeEventListener("pointerdown", this.#onPointerDown);
    this.#canvas.removeEventListener("pointermove", this.#onPointerMove);
    this.#canvas.removeEventListener("pointerup", this.#onPointerUp);
    this.#canvas.removeEventListener("pointercancel", this.#onPointerCancel);
    this.#canvas.removeEventListener(
      "lostpointercapture",
      this.#onLostPointerCapture
    );
    this.#canvas.removeEventListener("keydown", this.#onKeyDown);
    globalThis.removeEventListener?.("blur", this.#onBlur);

    for (const { button, handler } of this.#buttonHandlers) {
      button.removeEventListener("click", handler);
    }
    this.#buttonHandlers = [];
    this.#pointers.clear();
  }
}

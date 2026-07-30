const average = (values) =>
  values.length === 0
    ? 0
    : values.reduce((total, value) => total + value, 0) / values.length;
const percentile = (values, fraction) => {
  if (values.length === 0) {
    return 0;
  }

  const sorted = [...values].sort((left, right) => left - right);
  const index = Math.min(
    sorted.length - 1,
    Math.max(0, Math.ceil(sorted.length * fraction) - 1)
  );
  return sorted[index];
};

export class PerformanceMonitor {
  #frameRates = [];
  #longTaskCount = 0;
  #longTaskDurationMs = 0;
  #maximumSamples;
  #observer = null;
  #renderDurations = [];
  #snapshotCache = null;
  #snapshotCalls = 30;
  #updateDurations = [];

  constructor({
    maximumSamples = 600,
    PerformanceObserverClass = globalThis.PerformanceObserver
  } = {}) {
    if (!Number.isInteger(maximumSamples) || maximumSamples < 1) {
      throw new RangeError("maximumSamples must be a positive integer.");
    }

    this.#maximumSamples = maximumSamples;

    if (typeof PerformanceObserverClass === "function") {
      try {
        this.#observer = new PerformanceObserverClass((list) => {
          for (const entry of list.getEntries()) {
            this.#longTaskCount += 1;
            this.#longTaskDurationMs += entry.duration;
          }
        });
        this.#observer.observe({ type: "longtask", buffered: true });
      } catch {
        this.#observer = null;
      }
    }
  }

  recordFrame(frameDeltaMs) {
    if (Number.isFinite(frameDeltaMs) && frameDeltaMs > 0) {
      this.#append(this.#frameRates, 1000 / frameDeltaMs);
    }
  }

  recordRender(durationMs) {
    this.#recordDuration(this.#renderDurations, durationMs);
  }

  recordUpdate(durationMs) {
    this.#recordDuration(this.#updateDurations, durationMs);
  }

  reset() {
    this.#frameRates = [];
    this.#longTaskCount = 0;
    this.#longTaskDurationMs = 0;
    this.#renderDurations = [];
    this.#snapshotCache = null;
    this.#snapshotCalls = 30;
    this.#updateDurations = [];
  }

  snapshot() {
    this.#snapshotCalls += 1;

    if (this.#snapshotCache && this.#snapshotCalls < 30) {
      return this.#snapshotCache;
    }

    this.#snapshotCalls = 0;
    this.#snapshotCache = Object.freeze({
      averageFps: average(this.#frameRates),
      frameSamples: this.#frameRates.length,
      longTaskCount: this.#longTaskCount,
      longTaskDurationMs: this.#longTaskDurationMs,
      minimumFps:
        this.#frameRates.length === 0 ? 0 : Math.min(...this.#frameRates),
      medianFps: percentile(this.#frameRates, 0.5),
      onePercentLowFps: percentile(this.#frameRates, 0.01),
      renderAverageMs: average(this.#renderDurations),
      renderMaximumMs:
        this.#renderDurations.length === 0
          ? 0
          : Math.max(...this.#renderDurations),
      updateAverageMs: average(this.#updateDurations),
      updateMaximumMs:
        this.#updateDurations.length === 0
          ? 0
          : Math.max(...this.#updateDurations),
      updateP95Ms: percentile(this.#updateDurations, 0.95)
    });
    return this.#snapshotCache;
  }

  destroy() {
    this.#observer?.disconnect();
    this.#observer = null;
  }

  #append(collection, value) {
    collection.push(value);

    if (collection.length > this.#maximumSamples) {
      collection.splice(0, collection.length - this.#maximumSamples);
    }
  }

  #recordDuration(collection, durationMs) {
    if (Number.isFinite(durationMs) && durationMs >= 0) {
      this.#append(collection, durationMs);
    }
  }
}

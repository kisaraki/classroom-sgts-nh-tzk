import {
  geoToCanvas,
  haversineDistanceKm
} from "../utils/geo.js";
import { clamp } from "../utils/math.js";

const SVG_NAMESPACE = "http://www.w3.org/2000/svg";
const CARD_EDGE_GAP = 8;
const CARD_GAP = 8;
const COLLISION_EPSILON = 0.25;
const COMPACT_BREAKPOINT = 600;
const COMPACT_HEIGHT = 420;
const NARROW_COLUMNS = 2;
const SHALLOW_COLUMNS = 4;
const KEYBOARD_STEP = 8;
const KEYBOARD_LARGE_STEP = 32;
const SEARCH_STEP = 8;

export const DEFAULT_CARD_PLACEMENTS = Object.freeze({
  hualien: Object.freeze({ x: 0.82, y: 0.95 }),
  naha: Object.freeze({ x: 0.28, y: 0.95 }),
  penghu: Object.freeze({ x: 0.02, y: 0.51 }),
  "sun-moon-lake": Object.freeze({ x: 0.02, y: 0.28 }),
  taichung: Object.freeze({ x: 0.02, y: 0.05 }),
  taipei: Object.freeze({ x: 0.55, y: 0.95 })
});

const NARROW_CARD_PLACEMENTS = Object.freeze({
  hualien: Object.freeze({ x: 1, y: 0.82 }),
  naha: Object.freeze({ x: 1, y: 0 }),
  penghu: Object.freeze({ x: 0, y: 1 }),
  "sun-moon-lake": Object.freeze({ x: 0, y: 0.58 }),
  taichung: Object.freeze({ x: 0, y: 0 }),
  taipei: Object.freeze({ x: 1, y: 0.41 })
});

const SHALLOW_CARD_PLACEMENTS = Object.freeze({
  hualien: Object.freeze({ x: 1 / 3, y: 1 }),
  naha: Object.freeze({ x: 1, y: 0 }),
  penghu: Object.freeze({ x: 2 / 3, y: 0 }),
  "sun-moon-lake": Object.freeze({ x: 1 / 3, y: 0 }),
  taichung: Object.freeze({ x: 0, y: 0 }),
  taipei: Object.freeze({ x: 0, y: 1 })
});

const formatNumber = (value, digits = 1) =>
  Number.isFinite(value) ? value.toFixed(digits) : "—";

const formatUpdateTime = (simulationMinutes) => {
  if (!Number.isFinite(simulationMinutes) || simulationMinutes <= 0) {
    return "初始狀態";
  }

  const totalMinutes = Math.round(simulationMinutes);
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;

  return (
    `${String(days).padStart(2, "0")} 日 ` +
    `${String(hours).padStart(2, "0")} 時 ` +
    `${String(minutes).padStart(2, "0")} 分`
  );
};

export const stationObservationPresentation = (observation, storm) => {
  const station = observation.station;
  const distanceKm = Number.isFinite(observation.distanceKm)
    ? observation.distanceKm
    : haversineDistanceKm(storm, station);
  const sustainedWind = formatNumber(station.sustainedWind);
  const gust = formatNumber(station.gust);
  const hourlyRainRate = formatNumber(station.hourlyRainRate);
  const accumulatedRain = formatNumber(station.accumulatedRain);
  const terrainCorrection = formatNumber(station.terrainCorrection, 2);
  const updateTime = formatUpdateTime(station.updateSimulationMinutes);
  const distance = formatNumber(distanceKm);

  return Object.freeze({
    accessibleText:
      `${station.name}模型觀測，距離颱風中心 ${distance} 公里，` +
      `持續風每秒 ${sustainedWind} 公尺，最大陣風每秒 ${gust} 公尺，` +
      `當前雨率每小時 ${hourlyRainRate} 毫米，` +
      `累積雨量 ${accumulatedRain} 毫米，` +
      `地形修正 ${terrainCorrection} 倍，更新時間 ${updateTime}。`,
    accumulatedRain,
    distance,
    gust,
    hourlyRainRate,
    station,
    sustainedWind,
    terrainCorrection,
    updateTime
  });
};

const mapRectForViewport = (viewport) =>
  Object.freeze({
    bottom: viewport.height - viewport.padding.bottom - CARD_EDGE_GAP,
    left: viewport.padding.left + CARD_EDGE_GAP,
    right: viewport.width - viewport.padding.right - CARD_EDGE_GAP,
    top: viewport.padding.top + CARD_EDGE_GAP
  });

const normalizedPlacement = (placement) =>
  Object.freeze({
    x: clamp(Number(placement?.x) || 0, 0, 1),
    y: clamp(Number(placement?.y) || 0, 0, 1)
  });

export const normalizedPlacementToPosition = ({
  placement,
  size,
  viewport
}) => {
  const mapRect = mapRectForViewport(viewport);
  const normalized = normalizedPlacement(placement);
  const availableWidth = Math.max(0, mapRect.right - mapRect.left - size.width);
  const availableHeight = Math.max(
    0,
    mapRect.bottom - mapRect.top - size.height
  );

  return Object.freeze({
    x: mapRect.left + availableWidth * normalized.x,
    y: mapRect.top + availableHeight * normalized.y
  });
};

export const positionToNormalizedPlacement = ({ position, size, viewport }) => {
  const mapRect = mapRectForViewport(viewport);
  const availableWidth = Math.max(0, mapRect.right - mapRect.left - size.width);
  const availableHeight = Math.max(
    0,
    mapRect.bottom - mapRect.top - size.height
  );

  return Object.freeze({
    x: availableWidth === 0
      ? 0
      : clamp((position.x - mapRect.left) / availableWidth, 0, 1),
    y: availableHeight === 0
      ? 0
      : clamp((position.y - mapRect.top) / availableHeight, 0, 1)
  });
};

const clampPositionToMap = ({ position, size, viewport }) => {
  const mapRect = mapRectForViewport(viewport);

  return Object.freeze({
    x: clamp(
      position.x,
      mapRect.left,
      Math.max(mapRect.left, mapRect.right - size.width)
    ),
    y: clamp(
      position.y,
      mapRect.top,
      Math.max(mapRect.top, mapRect.bottom - size.height)
    )
  });
};

const rectangleForPosition = ({ size, x, y }) =>
  Object.freeze({
    bottom: y + size.height,
    left: x,
    right: x + size.width,
    top: y
  });

const rectanglesOverlap = (first, second, gap = 0) =>
  first.left < second.right + gap - COLLISION_EPSILON &&
  first.right > second.left - gap + COLLISION_EPSILON &&
  first.top < second.bottom + gap - COLLISION_EPSILON &&
  first.bottom > second.top - gap + COLLISION_EPSILON;

const positionIsAvailable = (position, size, blocked) => {
  const rectangle = rectangleForPosition({ ...position, size });

  return blocked.every(
    (obstacle) =>
      !rectanglesOverlap(rectangle, obstacle, obstacle.gap ?? CARD_GAP)
  );
};

const availablePositionNearest = ({ blocked, desired, size, viewport }) => {
  const clampedDesired = clampPositionToMap({
    position: desired,
    size,
    viewport
  });

  if (positionIsAvailable(clampedDesired, size, blocked)) {
    return clampedDesired;
  }

  const mapRect = mapRectForViewport(viewport);
  const maximumDistance = Math.max(
    mapRect.right - mapRect.left,
    mapRect.bottom - mapRect.top
  );

  for (let distance = SEARCH_STEP; distance <= maximumDistance; distance += SEARCH_STEP) {
    const offsets = [];

    for (let offset = -distance; offset <= distance; offset += SEARCH_STEP) {
      offsets.push(
        { x: offset, y: -distance },
        { x: offset, y: distance },
        { x: -distance, y: offset },
        { x: distance, y: offset }
      );
    }

    for (const offset of offsets) {
      const candidate = clampPositionToMap({
        position: {
          x: clampedDesired.x + offset.x,
          y: clampedDesired.y + offset.y
        },
        size,
        viewport
      });

      if (positionIsAvailable(candidate, size, blocked)) {
        return candidate;
      }
    }
  }

  return clampedDesired;
};

export const layoutStationCards = ({
  anchors,
  compact = false,
  compactColumns = NARROW_COLUMNS,
  obstacles = [],
  placements = {},
  sizes,
  viewport
}) => {
  const defaults = compact
    ? compactColumns === SHALLOW_COLUMNS
      ? SHALLOW_CARD_PLACEMENTS
      : NARROW_CARD_PLACEMENTS
    : DEFAULT_CARD_PLACEMENTS;
  const items = anchors
    .filter((anchor) => anchor.visible && sizes[anchor.id])
    .map((anchor) =>
      Object.freeze({ anchor, id: anchor.id, size: sizes[anchor.id] })
    );
  const blocked = [...obstacles];
  const positions = [];

  for (const [index, item] of items.entries()) {
    const fallback = Object.freeze({
      x:
        compactColumns <= 1
          ? 0
          : (index % compactColumns) / (compactColumns - 1),
      y: Math.floor(index / compactColumns) /
        Math.max(1, Math.ceil(items.length / compactColumns) - 1)
    });
    const placement = normalizedPlacement(
      placements[item.id] ?? defaults[item.id] ?? fallback
    );
    const desired = normalizedPlacementToPosition({
      placement,
      size: item.size,
      viewport
    });
    const resolved = availablePositionNearest({
      blocked,
      desired,
      size: item.size,
      viewport
    });
    const position = Object.freeze({
      ...item,
      placement,
      x: resolved.x,
      y: resolved.y
    });

    positions.push(position);
    blocked.push(rectangleForPosition(position));
  }

  return Object.freeze(positions);
};

const leaderEndpoint = ({ anchor, size, x, y }) => {
  const right = x + size.width;
  const bottom = y + size.height;
  const clampedX = clamp(anchor.x, x, right);
  const clampedY = clamp(anchor.y, y, bottom);

  if (anchor.x >= x && anchor.x <= right && anchor.y >= y && anchor.y <= bottom) {
    const candidates = [
      { distance: anchor.x - x, x, y: anchor.y },
      { distance: right - anchor.x, x: right, y: anchor.y },
      { distance: anchor.y - y, x: anchor.x, y },
      { distance: bottom - anchor.y, x: anchor.x, y: bottom }
    ];
    candidates.sort((first, second) => first.distance - second.distance);
    return candidates[0];
  }

  return Object.freeze({ x: clampedX, y: clampedY });
};

export class StationMapOverlay {
  #activeDrag = null;
  #anchors = new Map();
  #cardLayer;
  #controls;
  #elements = new Map();
  #geometryRevision = 0;
  #lastContentKey = "";
  #lastLayoutKey = "";
  #leaderLayer;
  #markerLayer;
  #obstacles = [];
  #obstaclesKey = "";
  #placementRevision = 0;
  #placements = new Map();
  #positions = new Map();
  #root;
  #resizeObserver = null;
  #sizes = {};
  #sizesKey = "";
  #status;
  #viewport = null;

  constructor(root) {
    if (!root || typeof root.querySelector !== "function") {
      throw new TypeError("StationMapOverlay requires a root element.");
    }

    this.#root = root;
    this.#cardLayer = root.querySelector("[data-station-card-layer]");
    this.#leaderLayer = root.querySelector("[data-station-leaders]");
    this.#markerLayer = root.querySelector("[data-station-markers]");
    this.#status = root.querySelector("[data-station-placement-status]");
    this.#controls = root.parentElement?.querySelector(".map-controls") ?? null;

    if (!this.#cardLayer || !this.#leaderLayer || !this.#markerLayer) {
      throw new Error("Station map overlay layers are incomplete.");
    }

    this.#cardLayer.addEventListener("pointerdown", this.#handlePointerDown);
    this.#cardLayer.addEventListener("pointermove", this.#handlePointerMove);
    this.#cardLayer.addEventListener("pointerup", this.#handlePointerUp);
    this.#cardLayer.addEventListener("pointercancel", this.#handlePointerCancel);
    this.#cardLayer.addEventListener(
      "lostpointercapture",
      this.#handlePointerCancel
    );
    this.#cardLayer.addEventListener("dblclick", this.#handleDoubleClick);
    this.#cardLayer.addEventListener("keydown", this.#handleKeyDown);

    const ResizeObserverClass = root.ownerDocument.defaultView?.ResizeObserver;
    if (typeof ResizeObserverClass === "function") {
      this.#resizeObserver = new ResizeObserverClass(() => {
        this.#geometryRevision += 1;
        this.#lastLayoutKey = "";
        this.#obstaclesKey = "";
        this.#sizesKey = "";
      });
      this.#resizeObserver.observe(this.#root);
      if (this.#controls) {
        this.#resizeObserver.observe(this.#controls);
      }
    }
  }

  #announce(message) {
    if (this.#status) {
      this.#status.textContent = message;
    }
  }

  #cardFromEvent(event) {
    const card = event.target?.closest?.(".station-card");
    return card && this.#cardLayer.contains(card) ? card : null;
  }

  #applyPosition(id, position) {
    const element = this.#elements.get(id);
    const anchor = this.#anchors.get(id);

    if (!element || !anchor || !position) {
      return;
    }

    const completePosition = Object.freeze({ ...position, anchor });
    const endpoint = leaderEndpoint(completePosition);
    element.article.style.transform =
      `translate3d(${position.x}px, ${position.y}px, 0)`;
    element.leader.setAttribute("x1", String(anchor.x));
    element.leader.setAttribute("y1", String(anchor.y));
    element.leader.setAttribute("x2", String(endpoint.x));
    element.leader.setAttribute("y2", String(endpoint.y));
    element.marker.setAttribute("cx", String(anchor.x));
    element.marker.setAttribute("cy", String(anchor.y));
    this.#positions.set(id, completePosition);
  }

  #commitPlacement(id, placement, message) {
    if (placement) {
      this.#placements.set(id, placement);
    } else {
      this.#placements.delete(id);
    }
    const article = this.#elements.get(id)?.article;
    if (article) {
      article.dataset.placement = placement ? "custom" : "default";
    }
    this.#placementRevision += 1;
    this.#lastLayoutKey = "";
    this.#announce(message);
  }

  #finishDrag({ commit }) {
    const active = this.#activeDrag;

    if (!active) {
      return;
    }

    this.#activeDrag = null;
    delete active.article.dataset.dragging;
    delete this.#root.dataset.dragging;

    if (active.article.hasPointerCapture?.(active.pointerId)) {
      active.article.releasePointerCapture(active.pointerId);
    }

    if (commit && active.currentPlacement) {
      this.#commitPlacement(
        active.id,
        active.currentPlacement,
        `${active.name}模型觀測卡已移至新位置。`
      );
    } else {
      this.#commitPlacement(
        active.id,
        active.startPlacement,
        `${active.name}模型觀測卡已取消移動。`
      );
    }
  }

  #handlePointerDown = (event) => {
    const article = this.#cardFromEvent(event);

    if (
      !article ||
      event.isPrimary === false ||
      (event.pointerType === "mouse" && event.button !== 0) ||
      !this.#viewport
    ) {
      return;
    }

    const id = article.dataset.stationId;
    const position = this.#positions.get(id);
    const size = this.#sizes[id];

    if (!position || !size) {
      return;
    }

    const rootRect = this.#root.getBoundingClientRect();
    event.preventDefault();
    event.stopPropagation();
    article.focus({ preventScroll: true });
    article.setPointerCapture?.(event.pointerId);
    article.dataset.dragging = "true";
    this.#root.dataset.dragging = "true";
    this.#activeDrag = {
      article,
      currentPlacement: null,
      id,
      name: this.#elements.get(id).title.textContent,
      offsetX: event.clientX - rootRect.left - position.x,
      offsetY: event.clientY - rootRect.top - position.y,
      pointerId: event.pointerId,
      rootRect,
      size,
      startPlacement: this.#placements.get(id) ?? null
    };
  };

  #handlePointerMove = (event) => {
    const active = this.#activeDrag;

    if (!active || event.pointerId !== active.pointerId || !this.#viewport) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    const position = clampPositionToMap({
      position: {
        x: event.clientX - active.rootRect.left - active.offsetX,
        y: event.clientY - active.rootRect.top - active.offsetY
      },
      size: active.size,
      viewport: this.#viewport
    });
    active.currentPlacement = positionToNormalizedPlacement({
      position,
      size: active.size,
      viewport: this.#viewport
    });
    this.#applyPosition(active.id, { ...position, size: active.size });
  };

  #handlePointerUp = (event) => {
    if (!this.#activeDrag || event.pointerId !== this.#activeDrag.pointerId) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    this.#finishDrag({ commit: true });
  };

  #handlePointerCancel = (event) => {
    if (!this.#activeDrag || event.pointerId !== this.#activeDrag.pointerId) {
      return;
    }

    this.#finishDrag({ commit: false });
  };

  #handleDoubleClick = (event) => {
    const article = this.#cardFromEvent(event);

    if (!article) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    this.#commitPlacement(
      article.dataset.stationId,
      null,
      `${this.#elements.get(article.dataset.stationId).title.textContent}` +
        "模型觀測卡已回到預設位置。"
    );
  };

  #handleKeyDown = (event) => {
    const article = this.#cardFromEvent(event);

    if (!article || !this.#viewport) {
      return;
    }

    const id = article.dataset.stationId;
    const name = this.#elements.get(id).title.textContent;

    if (event.key === "Escape" && this.#activeDrag) {
      event.preventDefault();
      this.#finishDrag({ commit: false });
      return;
    }

    if (event.key === "Home") {
      event.preventDefault();
      event.stopPropagation();
      this.#commitPlacement(
        id,
        null,
        `${name}模型觀測卡已回到預設位置。`
      );
      return;
    }

    const direction = {
      ArrowDown: { x: 0, y: 1 },
      ArrowLeft: { x: -1, y: 0 },
      ArrowRight: { x: 1, y: 0 },
      ArrowUp: { x: 0, y: -1 }
    }[event.key];

    if (!direction) {
      return;
    }

    const current = this.#positions.get(id);
    const size = this.#sizes[id];

    if (!current || !size) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    const step = event.shiftKey ? KEYBOARD_LARGE_STEP : KEYBOARD_STEP;
    const position = clampPositionToMap({
      position: {
        x: current.x + direction.x * step,
        y: current.y + direction.y * step
      },
      size,
      viewport: this.#viewport
    });
    const placement = positionToNormalizedPlacement({
      position,
      size,
      viewport: this.#viewport
    });
    this.#applyPosition(id, { ...position, size });
    this.#commitPlacement(id, placement, `${name}模型觀測卡位置已微調。`);
  };

  #ensureElement(observation) {
    const station = observation.station;
    const existing = this.#elements.get(station.id);

    if (existing) {
      return existing;
    }

    const document = this.#root.ownerDocument;
    const article = document.createElement("article");
    const heading = document.createElement("header");
    const title = document.createElement("h4");
    const update = document.createElement("span");
    const updateLabel = document.createElement("span");
    const updateValue = document.createElement("strong");
    const meta = document.createElement("dl");
    const wind = document.createElement("dl");
    const rain = document.createElement("dl");
    const leader = document.createElementNS(SVG_NAMESPACE, "line");
    const marker = document.createElementNS(SVG_NAMESPACE, "circle");
    const appendMetric = (container, labelText) => {
      const metric = document.createElement("div");
      const label = document.createElement("dt");
      const value = document.createElement("dd");
      metric.className = "station-card-metric";
      label.textContent = labelText;
      metric.append(label, value);
      container.append(metric);
      return value;
    };
    const distanceValue = appendMetric(meta, "與颱風中心距離");
    const terrainValue = appendMetric(meta, "地形修正");
    const sustainedWindValue = appendMetric(wind, "持續風");
    const gustValue = appendMetric(wind, "最大陣風");
    const hourlyRainRateValue = appendMetric(rain, "當前雨率");
    const accumulatedRainValue = appendMetric(rain, "累積雨量");

    article.dataset.stationId = station.id;
    article.dataset.placement = "default";
    article.className = "station-card";
    article.tabIndex = 0;
    article.setAttribute("aria-keyshortcuts", "ArrowUp ArrowDown ArrowLeft ArrowRight Home Escape");
    article.setAttribute("aria-roledescription", "可拖曳模型觀測卡");
    article.title = "拖曳可移動；方向鍵可微調；Home 鍵或按兩下可歸位";
    title.textContent = station.name;
    update.className = "station-card-update";
    updateLabel.textContent = "模擬更新時間";
    update.append(updateLabel, updateValue);
    heading.append(title, update);
    meta.className = "station-card-meta";
    wind.className = "station-card-wind";
    wind.dataset.stationWind = station.id;
    rain.className = "station-card-rain";
    rain.dataset.stationRain = station.id;
    article.append(heading, meta, wind, rain);

    leader.dataset.stationLeader = station.id;
    marker.dataset.stationMarker = station.id;
    marker.setAttribute("r", "3.5");
    this.#leaderLayer.append(leader);
    this.#markerLayer.append(marker);
    this.#cardLayer.append(article);

    const created = Object.freeze({
      accumulatedRainValue,
      article,
      distanceValue,
      gustValue,
      hourlyRainRateValue,
      leader,
      marker,
      sustainedWindValue,
      terrainValue,
      title,
      updateValue
    });
    this.#elements.set(station.id, created);
    return created;
  }

  render({ observations, storm, viewport }) {
    if (!viewport || !Array.isArray(observations) || !storm) {
      return;
    }

    this.#viewport = viewport;
    const presentations = observations.map((observation) =>
      stationObservationPresentation(observation, storm)
    );
    const contentKey = presentations
      .map(
        (entry) =>
          `${entry.station.id}:${entry.distance}:${entry.sustainedWind}:` +
          `${entry.gust}:${entry.hourlyRainRate}:${entry.accumulatedRain}:` +
          `${entry.terrainCorrection}:${entry.updateTime}`
      )
      .join("|");
    const contentChanged = contentKey !== this.#lastContentKey;

    for (const [index, presentation] of presentations.entries()) {
      const element = this.#ensureElement(observations[index]);

      if (contentChanged) {
        element.article.setAttribute(
          "aria-label",
          presentation.accessibleText +
            "拖曳可移動資訊卡；方向鍵可微調；Home 鍵可重設位置。"
        );
        element.updateValue.textContent = presentation.updateTime;
        element.distanceValue.textContent = `${presentation.distance} 公里`;
        element.sustainedWindValue.textContent =
          `${presentation.sustainedWind} 公尺／秒`;
        element.gustValue.textContent = `${presentation.gust} 公尺／秒`;
        element.hourlyRainRateValue.textContent =
          `${presentation.hourlyRainRate} 毫米／小時`;
        element.accumulatedRainValue.textContent =
          `${presentation.accumulatedRain} 毫米`;
        element.terrainValue.textContent = `×${presentation.terrainCorrection}`;
      }
    }
    this.#lastContentKey = contentKey;

    const compact =
      viewport.width < COMPACT_BREAKPOINT ||
      viewport.height - viewport.padding.top - viewport.padding.bottom <
        COMPACT_HEIGHT;
    const drawableWidth =
      viewport.width - viewport.padding.left - viewport.padding.right;
    const compactColumns = viewport.width < COMPACT_BREAKPOINT
      ? NARROW_COLUMNS
      : SHALLOW_COLUMNS;
    const compactWidth =
      (drawableWidth -
        CARD_EDGE_GAP * 2 -
        CARD_GAP * (compactColumns - 1)) /
      compactColumns;
    const layoutKey = [
      viewport.cameraRevision,
      viewport.width,
      viewport.height,
      compact,
      compactColumns,
      this.#geometryRevision,
      this.#placementRevision,
      ...Object.values(viewport.bounds)
    ].join(":");

    if (layoutKey === this.#lastLayoutKey) {
      return;
    }

    this.#root.dataset.layout = compact ? "compact" : "callout";
    this.#root.dataset.columns = compact ? String(compactColumns) : "1";
    if (this.#root.parentElement) {
      this.#root.parentElement.dataset.stationLayout =
        compact ? "compact" : "callout";
    }

    for (const presentation of presentations) {
      const element = this.#elements.get(presentation.station.id);
      element.article.hidden = false;
      if (compact) {
        element.article.style.inlineSize = `${compactWidth}px`;
      } else {
        element.article.style.removeProperty("inline-size");
      }
    }

    const anchors = presentations.map(({ station }) => {
      const point = geoToCanvas(station, viewport);
      return Object.freeze({
        id: station.id,
        visible: true,
        x: clamp(
          point.x,
          viewport.padding.left,
          viewport.width - viewport.padding.right
        ),
        y: clamp(
          point.y,
          viewport.padding.top,
          viewport.height - viewport.padding.bottom
        )
      });
    });
    this.#anchors = new Map(anchors.map((anchor) => [anchor.id, anchor]));

    const sizesKey = `${compact}:${compactWidth.toFixed(3)}:${viewport.height}`;
    if (sizesKey !== this.#sizesKey) {
      this.#sizes = Object.fromEntries(
        presentations.map(({ station }) => {
          const box = this.#elements
            .get(station.id)
            .article.getBoundingClientRect();
          return [
            station.id,
            Object.freeze({ height: box.height, width: box.width })
          ];
        })
      );
      this.#sizesKey = sizesKey;
    }

    const obstaclesKey = `${compact}:${viewport.width}:${viewport.height}`;
    if (obstaclesKey !== this.#obstaclesKey) {
      const rootRect = this.#root.getBoundingClientRect();
      const controlRect = this.#controls?.getBoundingClientRect();
      this.#obstacles =
        controlRect?.width > 0 && controlRect?.height > 0
          ? [
              Object.freeze({
                bottom: controlRect.bottom - rootRect.top,
                left: controlRect.left - rootRect.left,
                right: controlRect.right - rootRect.left,
                top: controlRect.top - rootRect.top
              })
            ]
          : [];
      this.#obstaclesKey = obstaclesKey;
    }

    const positions = layoutStationCards({
      anchors,
      compact,
      compactColumns,
      obstacles: this.#obstacles,
      placements: Object.fromEntries(this.#placements),
      sizes: this.#sizes,
      viewport
    });
    const byId = new Map(positions.map((position) => [position.id, position]));

    this.#leaderLayer.setAttribute(
      "viewBox",
      `0 0 ${viewport.width} ${viewport.height}`
    );
    this.#markerLayer.setAttribute(
      "viewBox",
      `0 0 ${viewport.width} ${viewport.height}`
    );
    for (const anchor of anchors) {
      const element = this.#elements.get(anchor.id);
      const position = byId.get(anchor.id);
      const visible = Boolean(position);
      element.article.hidden = !visible;
      element.leader.hidden = !visible;
      element.marker.hidden = !visible;

      if (visible && this.#activeDrag?.id !== anchor.id) {
        this.#applyPosition(anchor.id, position);
      }
    }
    this.#lastLayoutKey = layoutKey;
  }

  destroy() {
    this.#cardLayer.removeEventListener(
      "pointerdown",
      this.#handlePointerDown
    );
    this.#cardLayer.removeEventListener(
      "pointermove",
      this.#handlePointerMove
    );
    this.#cardLayer.removeEventListener("pointerup", this.#handlePointerUp);
    this.#cardLayer.removeEventListener(
      "pointercancel",
      this.#handlePointerCancel
    );
    this.#cardLayer.removeEventListener(
      "lostpointercapture",
      this.#handlePointerCancel
    );
    this.#cardLayer.removeEventListener("dblclick", this.#handleDoubleClick);
    this.#cardLayer.removeEventListener("keydown", this.#handleKeyDown);
    this.#resizeObserver?.disconnect();
  }
}

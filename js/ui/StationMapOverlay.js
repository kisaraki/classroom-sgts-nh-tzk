import {
  geoToCanvas,
  haversineDistanceKm
} from "../utils/geo.js";
import { clamp } from "../utils/math.js";

const SVG_NAMESPACE = "http://www.w3.org/2000/svg";
const CARD_EDGE_GAP = 8;
const CARD_GAP = 8;
const LEADER_GAP = 24;
const COMPACT_BREAKPOINT = 600;
const COMPACT_HEIGHT = 420;
const COMPACT_COLUMNS = 3;

const STATION_SIDES = Object.freeze({
  hualien: "right",
  naha: "right",
  penghu: "left",
  "sun-moon-lake": "left",
  taichung: "left",
  taipei: "right"
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

const layoutRail = (items, minimumY, maximumY) => {
  const sorted = [...items].sort(
    (first, second) => first.anchor.y - second.anchor.y ||
      first.id.localeCompare(second.id)
  );
  const positions = [];
  let cursor = minimumY;

  for (const item of sorted) {
    const height = item.size.height;
    const desired = clamp(
      item.anchor.y - height / 2,
      minimumY,
      maximumY - height
    );
    const y = Math.max(desired, cursor);
    positions.push({ ...item, y });
    cursor = y + height + CARD_GAP;
  }

  if (positions.length === 0) {
    return positions;
  }

  const overflow =
    positions.at(-1).y + positions.at(-1).size.height - maximumY;

  if (overflow > 0) {
    for (const position of positions) {
      position.y -= overflow;
    }
  }

  for (let index = positions.length - 2; index >= 0; index -= 1) {
    const current = positions[index];
    const next = positions[index + 1];
    current.y = Math.min(
      current.y,
      next.y - CARD_GAP - current.size.height
    );
  }

  const underflow = minimumY - positions[0].y;
  if (underflow > 0) {
    for (const position of positions) {
      position.y += underflow;
    }
  }

  return positions;
};

const compactLayout = (items, mapRect) => {
  const columns = Math.min(COMPACT_COLUMNS, Math.max(1, items.length));
  const rowHeights = [];

  for (let index = 0; index < items.length; index += 1) {
    const row = Math.floor(index / columns);
    rowHeights[row] = Math.max(
      rowHeights[row] ?? 0,
      items[index].size.height
    );
  }

  const rowOffsets = rowHeights.length <= 1
    ? [mapRect.top + CARD_EDGE_GAP]
    : rowHeights.map((height, index) =>
        index === 0
          ? mapRect.top + CARD_EDGE_GAP
          : mapRect.bottom - CARD_EDGE_GAP - height
      );

  return items.map((item, index) => {
    const column = index % columns;
    const row = Math.floor(index / columns);

    return Object.freeze({
      ...item,
      x:
        mapRect.left +
        CARD_EDGE_GAP +
        column * (item.size.width + CARD_GAP),
      y: rowOffsets[row]
    });
  });
};

export const layoutStationCards = ({
  anchors,
  compact = false,
  obstacles = [],
  sizes,
  viewport
}) => {
  const mapRect = Object.freeze({
    bottom: viewport.height - viewport.padding.bottom,
    left: viewport.padding.left,
    right: viewport.width - viewport.padding.right,
    top: viewport.padding.top
  });
  const visibleItems = anchors
    .filter((anchor) => anchor.visible)
    .map((anchor) =>
      Object.freeze({
        anchor,
        id: anchor.id,
        size: sizes[anchor.id]
      })
    );

  if (compact) {
    return Object.freeze(compactLayout(visibleItems, mapRect));
  }

  const leftItems = visibleItems.filter(
    (item) => STATION_SIDES[item.id] !== "right"
  );
  const rightItems = visibleItems.filter(
    (item) => STATION_SIDES[item.id] === "right"
  );
  const leftWidth = Math.max(0, ...leftItems.map((item) => item.size.width));
  const rightWidth = Math.max(0, ...rightItems.map((item) => item.size.width));
  const minimumAnchorX = Math.min(
    mapRect.right,
    ...visibleItems.map((item) => item.anchor.x)
  );
  const maximumAnchorX = Math.max(
    mapRect.left,
    ...visibleItems.map((item) => item.anchor.x)
  );
  let leftX = clamp(
    minimumAnchorX - leftWidth - LEADER_GAP,
    mapRect.left + CARD_EDGE_GAP,
    mapRect.right - leftWidth - CARD_EDGE_GAP
  );
  let rightX = clamp(
    maximumAnchorX + LEADER_GAP,
    mapRect.left + CARD_EDGE_GAP,
    mapRect.right - rightWidth - CARD_EDGE_GAP
  );

  if (
    leftItems.length > 0 &&
    rightItems.length > 0 &&
    leftX + leftWidth + CARD_GAP > rightX
  ) {
    leftX = mapRect.left + CARD_EDGE_GAP;
    rightX = mapRect.right - rightWidth - CARD_EDGE_GAP;
  }

  const minimumY = mapRect.top + CARD_EDGE_GAP;
  const maximumY = mapRect.bottom - CARD_EDGE_GAP;
  const maximumYForRail = (x, width) =>
    obstacles.reduce((limit, obstacle) => {
      const overlapsHorizontally =
        x < obstacle.right + CARD_GAP &&
        x + width > obstacle.left - CARD_GAP;

      return overlapsHorizontally
        ? Math.min(limit, obstacle.top - CARD_GAP)
        : limit;
    }, maximumY);
  const leftPositions = layoutRail(leftItems, minimumY, maximumY).map(
    (item) => Object.freeze({ ...item, x: leftX })
  );
  const rightPositions = layoutRail(
    rightItems,
    minimumY,
    maximumYForRail(rightX, rightWidth)
  ).map((item) => Object.freeze({ ...item, x: rightX }));

  return Object.freeze([...leftPositions, ...rightPositions]);
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
  #cardLayer;
  #controls;
  #elements = new Map();
  #lastContentKey = "";
  #lastLayoutKey = "";
  #leaderLayer;
  #obstacles = [];
  #obstaclesKey = "";
  #root;
  #sizes = {};
  #sizesKey = "";

  constructor(root) {
    if (!root || typeof root.querySelector !== "function") {
      throw new TypeError("StationMapOverlay requires a root element.");
    }

    this.#root = root;
    this.#cardLayer = root.querySelector("[data-station-card-layer]");
    this.#leaderLayer = root.querySelector("[data-station-leaders]");
    this.#controls = root.parentElement?.querySelector(".map-controls") ?? null;

    if (!this.#cardLayer || !this.#leaderLayer) {
      throw new Error("Station map overlay layers are incomplete.");
    }
  }

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
    const distanceText = document.createElement("p");
    const wind = document.createElement("p");
    const rain = document.createElement("p");
    const terrain = document.createElement("p");
    const leader = document.createElementNS(SVG_NAMESPACE, "line");
    const marker = document.createElementNS(SVG_NAMESPACE, "circle");
    const appendLabeledValue = (container, labelText) => {
      const label = document.createElement("span");
      const value = document.createElement("strong");
      label.className = "station-card-label";
      label.textContent = labelText;
      value.className = "station-card-value";
      container.append(label, value);
      return value;
    };
    const createMetric = (labelText) => {
      const metric = document.createElement("span");
      metric.className = "station-card-metric";
      return Object.freeze({
        metric,
        value: appendLabeledValue(metric, labelText)
      });
    };
    const updateValue = appendLabeledValue(update, "模擬更新時間");
    const distanceValue = appendLabeledValue(
      distanceText,
      "與颱風中心距離"
    );
    const sustainedWind = createMetric("持續風");
    const gust = createMetric("最大陣風");
    const hourlyRainRate = createMetric("當前雨率");
    const accumulatedRain = createMetric("累積雨量");
    const terrainValue = appendLabeledValue(terrain, "地形修正");

    article.dataset.stationId = station.id;
    article.className = "station-card";
    title.textContent = station.name;
    update.className = "station-card-update";
    heading.append(title, update);
    distanceText.className = "station-card-distance";
    wind.className = "station-card-wind";
    wind.dataset.stationWind = station.id;
    wind.append(sustainedWind.metric, gust.metric);
    rain.className = "station-card-rain";
    rain.dataset.stationRain = station.id;
    rain.append(hourlyRainRate.metric, accumulatedRain.metric);
    terrain.className = "station-card-terrain";
    article.append(heading, distanceText, wind, rain, terrain);

    leader.dataset.stationLeader = station.id;
    marker.dataset.stationMarker = station.id;
    marker.setAttribute("r", "3.5");
    this.#leaderLayer.append(leader, marker);
    this.#cardLayer.append(article);

    const created = Object.freeze({
      article,
      accumulatedRainValue: accumulatedRain.value,
      distanceValue,
      gustValue: gust.value,
      hourlyRainRateValue: hourlyRainRate.value,
      leader,
      marker,
      rain,
      sustainedWindValue: sustainedWind.value,
      terrainValue,
      title,
      updateValue,
      wind
    });
    this.#elements.set(station.id, created);
    return created;
  }

  render({ observations, storm, viewport }) {
    if (!viewport || !Array.isArray(observations) || !storm) {
      return;
    }

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
          presentation.accessibleText
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
    const compactWidth =
      (drawableWidth - CARD_EDGE_GAP * 2 - CARD_GAP * 2) /
      COMPACT_COLUMNS;
    const layoutKey = [
      viewport.cameraRevision,
      viewport.width,
      viewport.height,
      compact,
      ...Object.values(viewport.bounds)
    ].join(":");

    if (layoutKey === this.#lastLayoutKey) {
      return;
    }

    this.#root.dataset.layout = compact ? "compact" : "callout";
    this.#root.parentElement.dataset.stationLayout =
      compact ? "compact" : "callout";

    for (const presentation of presentations) {
      const element = this.#elements.get(presentation.station.id);
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
    for (const anchor of anchors) {
      this.#elements.get(anchor.id).article.hidden = false;
    }
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
        !compact && controlRect?.width > 0 && controlRect?.height > 0
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
      obstacles: this.#obstacles,
      sizes: this.#sizes,
      viewport
    });
    const byId = new Map(positions.map((position) => [position.id, position]));

    this.#leaderLayer.setAttribute("viewBox", `0 0 ${viewport.width} ${viewport.height}`);
    for (const anchor of anchors) {
      const element = this.#elements.get(anchor.id);
      const position = byId.get(anchor.id);
      const visible = Boolean(position);
      element.article.hidden = !visible;
      element.leader.hidden = !visible;
      element.marker.hidden = !visible;

      if (!visible) {
        continue;
      }

      element.article.style.transform =
        `translate3d(${position.x}px, ${position.y}px, 0)`;
      const endpoint = leaderEndpoint(position);
      element.leader.setAttribute("x1", String(anchor.x));
      element.leader.setAttribute("y1", String(anchor.y));
      element.leader.setAttribute("x2", String(endpoint.x));
      element.leader.setAttribute("y2", String(endpoint.y));
      element.marker.setAttribute("cx", String(anchor.x));
      element.marker.setAttribute("cy", String(anchor.y));
    }
    this.#lastLayoutKey = layoutKey;
  }
}
